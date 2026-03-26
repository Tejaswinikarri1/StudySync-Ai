require('dotenv').config();
const express    = require('express');
const http       = require('http');
const { Server } = require('socket.io');
const cors       = require('cors');
const rateLimit  = require('express-rate-limit');

const connectDB      = require('./config/db');
const errorHandler   = require('./middleware/errorHandler');
const authRouter     = require('./routes/auth');
const { userRouter, groupRouter, sessionRouter, messageRouter, analyticsRouter } = require('./routes/index');

connectDB();

const app    = express();
const server = http.createServer(app);

app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:5173', credentials: true }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

const limiter = rateLimit({ windowMs: 15*60*1000, max: 200, standardHeaders: true, legacyHeaders: false });
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 60, // allow up to 60 requests / 15 min on auth endpoints in development
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many auth attempts from this IP, please wait 15 minutes and try again.',
  },
});
app.use('/api', limiter);
app.use('/api/auth/login',    authLimiter);
app.use('/api/auth/register', authLimiter);

app.get('/api/health', (req, res) => res.json({ success: true, message: 'StudySync AI API 🚀', time: new Date() }));

app.use('/api/auth',      authRouter);
app.use('/api/users',     userRouter);
app.use('/api/groups',    groupRouter);
app.use('/api/sessions',  sessionRouter);
app.use('/api/messages',  messageRouter);
app.use('/api/analytics', analyticsRouter);

app.use('/api/*', (req, res) => res.status(404).json({ success: false, message: `Route ${req.originalUrl} not found.` }));
app.use(errorHandler);

// ── Socket.io ──────────────────────────────────────────────────────────────────
const io = new Server(server, {
  cors: { origin: process.env.CLIENT_URL || 'http://localhost:5173', methods: ['GET','POST'], credentials: true },
});

// userId → Set of socketIds (multiple tabs)
const onlineUsers = new Map();

// Helper: emit to a specific user across all their sockets
const emitToUser = (userId, event, data) => {
  const sockets = onlineUsers.get(userId?.toString());
  if (sockets) sockets.forEach(sid => io.to(sid).emit(event, data));
};

io.on('connection', (socket) => {

  // ── User comes online ───────────────────────────────────────────────────────
  socket.on('user_online', (userId) => {
    if (!userId) return;
    const uid = userId.toString();
    socket.userId = uid;
    if (!onlineUsers.has(uid)) onlineUsers.set(uid, new Set());
    onlineUsers.get(uid).add(socket.id);
    io.emit('online_users', Array.from(onlineUsers.keys()));
  });

  // ── Join group room ─────────────────────────────────────────────────────────
  socket.on('join_room', ({ groupId }) => {
    if (groupId) socket.join(`group:${groupId}`);
  });

  socket.on('leave_room', ({ groupId }) => {
    if (groupId) socket.leave(`group:${groupId}`);
  });

  // ── Group message broadcast ─────────────────────────────────────────────────
  // After REST saves message to DB, client emits this to broadcast to others in room
  socket.on('group_message', ({ groupId, message }) => {
    if (groupId && message) {
      socket.to(`group:${groupId}`).emit('new_group_message', message);
    }
  });

  // ── DM broadcast ───────────────────────────────────────────────────────────
  // After REST saves DM to DB, client emits this to deliver to recipient instantly
  socket.on('dm_message', ({ toUserId, message }) => {
    if (toUserId && message) {
      emitToUser(toUserId, 'new_dm_message', message);
    }
  });

  // ── Typing indicators ───────────────────────────────────────────────────────
  socket.on('typing_start', ({ groupId, userId, name }) => {
    if (groupId) socket.to(`group:${groupId}`).emit('user_typing', { userId, name });
  });

  socket.on('typing_stop', ({ groupId }) => {
    if (groupId) socket.to(`group:${groupId}`).emit('user_stop_typing');
  });

  socket.on('dm_typing_start', ({ toUserId, fromName }) => {
    emitToUser(toUserId, 'dm_user_typing', { fromName });
  });

  socket.on('dm_typing_stop', ({ toUserId }) => {
    emitToUser(toUserId, 'dm_user_stop_typing', {});
  });

  // ── Join request notification ───────────────────────────────────────────────
  // Server-side: after REST creates join request, notify admin in real time
  socket.on('join_request_sent', ({ adminId, groupName, userName }) => {
    emitToUser(adminId, 'new_join_request', { groupName, userName });
  });

  // ── Join approved notification ──────────────────────────────────────────────
  socket.on('join_approved', ({ userId, groupId, groupName }) => {
    emitToUser(userId, 'join_request_approved', { groupId, groupName });
  });

  // ── General notification push ───────────────────────────────────────────────
  socket.on('push_notification', ({ toUserId, notification }) => {
    emitToUser(toUserId, 'new_notification', notification);
  });

  // ── Disconnect ──────────────────────────────────────────────────────────────
  socket.on('disconnect', () => {
    if (socket.userId) {
      const sockets = onlineUsers.get(socket.userId);
      if (sockets) {
        sockets.delete(socket.id);
        if (sockets.size === 0) onlineUsers.delete(socket.userId);
      }
      io.emit('online_users', Array.from(onlineUsers.keys()));
    }
  });
});

// Export io so controllers can emit notifications directly
module.exports.io = io;
module.exports.emitToUser = emitToUser;

const PORT = parseInt(process.env.PORT) || 5000;
server.listen(PORT, () => {
  console.log(`\n🚀  StudySync AI API  →  http://localhost:${PORT}/api/health`);
  console.log(`🌍  Env: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔗  Client: ${process.env.CLIENT_URL || 'http://localhost:5173'}\n`);
});

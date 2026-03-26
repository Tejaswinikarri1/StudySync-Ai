const User       = require('../models/User');
const { Notification } = require('../models/index');
const { sendEmail, connectionRequestHtml } = require('../utils/email');

const emit = (userId, event, data) => {
  try { require('../server').emitToUser(userId?.toString(), event, data); } catch {}
};

// GET /api/users/me
exports.getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    res.json({ success: true, user });
  } catch (err) { next(err); }
};

// PUT /api/users/me
exports.updateMe = async (req, res, next) => {
  try {
    const forbidden = ['password','email','isVerified','verificationToken','resetPasswordToken'];
    forbidden.forEach(f => delete req.body[f]);

    const user = await User.findByIdAndUpdate(req.user._id, req.body, {
      new: true, runValidators: true,
    });
    res.json({ success: true, user });
  } catch (err) { next(err); }
};

// GET /api/users/matches  — AI compatibility scoring
exports.getMatches = async (req, res, next) => {
  try {
    const me      = await User.findById(req.user._id);
    const { subject, skill, avail } = req.query;

    // Exclude self and already-connected users
    const connectedIds = me.connections
      .filter(c => c.status === 'accepted')
      .map(c => c.user.toString());

    let query = { _id: { $ne: me._id } };
    if (skill)   query.skillLevel = skill;
    if (avail)   query.avail = avail;
    if (subject) query.subjects = { $regex: subject, $options: 'i' };

    const users = await User.find(query).limit(50);

    const scored = users.map(u => {
      const shared = (u.subjects || []).filter(s => (me.subjects || []).includes(s));
      const score  = Math.min(97,
        Math.min(40, shared.length * 13) +
        (u.skillLevel === me.skillLevel ? 20 : 10) +
        (u.avail === me.avail ? 20 : 10) +
        (u.learningStyle === me.learningStyle ? 10 : 5) + 10
      );

      const conn     = me.connections.find(c => c.user.toString() === u._id.toString());
      return {
        ...u.toJSON(),
        score,
        shared,
        connStatus: conn?.status || null,
        connId:     conn?._id    || null,
      };
    }).sort((a, b) => b.score - a.score);

    res.json({ success: true, users: scored });
  } catch (err) { next(err); }
};

// POST /api/users/connect/:id  — send connection request
exports.sendRequest = async (req, res, next) => {
  try {
    const fromUser = await User.findById(req.user._id);
    const toUser   = await User.findById(req.params.id);

    if (!toUser) return res.status(404).json({ success: false, message: 'User not found.' });
    if (req.params.id === req.user._id.toString()) {
      return res.status(400).json({ success: false, message: 'Cannot connect with yourself.' });
    }

    // Check if connection already exists
    const exists = fromUser.connections.find(
      c => c.user.toString() === req.params.id
    );
    if (exists) {
      return res.json({ success: true, status: exists.status, message: 'Request already sent.' });
    }

    // Add to both users, track who initiated
    fromUser.connections.push({ user: toUser._id, status: 'pending', initiatedByMe: true });
    toUser.connections.push({ user: fromUser._id, status: 'pending', initiatedByMe: false });
    await Promise.all([fromUser.save(), toUser.save()]);

    // Notification in DB + real-time push
    await Notification.create({
      user: toUser._id,
      type: 'connection',
      text: `${fromUser.name} sent you a connection request`,
    });

    emit(toUser._id, 'new_connection_request', {
      fromName: fromUser.name,
      fromId:   fromUser._id.toString(),
    });

    // Email
    try {
      await sendEmail({
        to: toUser.email,
        subject: 'New connection request on StudySync AI',
        html: connectionRequestHtml(fromUser.name, toUser.name),
      });
    } catch (e) { /* email failure shouldn't block response */ }

    res.json({ success: true, status: 'pending', message: 'Connection request sent.' });
  } catch (err) { next(err); }
};

// PUT /api/users/connect/:id/accept
exports.acceptRequest = async (req, res, next) => {
  try {
    const me    = await User.findById(req.user._id);
    const other = await User.findById(req.params.id);

    if (!other) return res.status(404).json({ success: false, message: 'User not found.' });

    // Update status in both docs
    const myConn    = me.connections.find(c => c.user.toString() === req.params.id);
    const theirConn = other.connections.find(c => c.user.toString() === req.user._id.toString());

    if (myConn)    myConn.status    = 'accepted';
    if (theirConn) theirConn.status = 'accepted';

    await Promise.all([me.save(), other.save()]);

    await Notification.create({
      user: other._id,
      type: 'connection',
      text: `${me.name} accepted your connection request`,
    });

    res.json({ success: true, message: 'Connection accepted.' });
  } catch (err) { next(err); }
};

// PUT /api/users/connect/:id/decline
exports.declineRequest = async (req, res, next) => {
  try {
    const me    = await User.findById(req.user._id);
    const other = await User.findById(req.params.id);

    const myConn    = me.connections.find(c => c.user.toString() === req.params.id);
    const theirConn = other?.connections.find(c => c.user.toString() === req.user._id.toString());

    if (myConn)    myConn.status    = 'declined';
    if (theirConn) theirConn.status = 'declined';

    await Promise.all([me.save(), other?.save()]);
    res.json({ success: true, message: 'Connection declined.' });
  } catch (err) { next(err); }
};

// GET /api/users/connections
exports.getConnections = async (req, res, next) => {
  try {
    const me = await User.findById(req.user._id)
      .populate('connections.user', 'name email college dept year subjects skillLevel avail learningStyle bio grad currentStreak totalFocusMinutes totalSessions badges');

    const { status } = req.query; // 'accepted' | 'pending'
    let conns = me.connections;
    if (status) conns = conns.filter(c => c.status === status);

    res.json({ success: true, connections: conns });
  } catch (err) { next(err); }
};

// GET /api/users/leaderboard
exports.getLeaderboard = async (req, res, next) => {
  try {
    const { tab = 'hours' } = req.query;

    const sortField = tab === 'hours'
      ? { totalFocusMinutes: -1 }
      : tab === 'streak'
        ? { currentStreak: -1 }
        : { totalSessions: -1 };

    const users = await User.find({})
      .select('name email college dept year subjects grad badges totalFocusMinutes totalSessions currentStreak')
      .sort(sortField)
      .limit(20);

    res.json({ success: true, users });
  } catch (err) { next(err); }
};

// GET /api/users/notifications
exports.getNotifications = async (req, res, next) => {
  try {
    const notifs = await Notification.find({ user: req.user._id })
      .sort({ createdAt: -1 })
      .limit(30);
    res.json({ success: true, notifications: notifs });
  } catch (err) { next(err); }
};

// PUT /api/users/notifications/read
exports.markNotificationsRead = async (req, res, next) => {
  try {
    await Notification.updateMany({ user: req.user._id, read: false }, { read: true });
    res.json({ success: true });
  } catch (err) { next(err); }
};

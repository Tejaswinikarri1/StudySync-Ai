import { io } from 'socket.io-client';

let socket = null;
let _userId = null;

// Pending listeners to attach once socket connects
const pendingListeners = [];

export const initSocket = (userId) => {
  _userId = userId;

  if (socket) {
    // Socket already exists - make sure user_online is sent
    if (socket.connected) socket.emit('user_online', userId);
    return socket;
  }

  socket = io('/', {
    transports:   ['websocket', 'polling'],
    autoConnect:  true,
    reconnection: true,
    reconnectionAttempts: 20,
    reconnectionDelay:    1000,
  });

  socket.on('connect', () => {
    console.log('🔌 Socket connected:', socket.id);
    if (_userId) socket.emit('user_online', _userId);

    // Attach any listeners that were registered before connection
    pendingListeners.forEach(({ event, handler }) => {
      socket.on(event, handler);
    });
    pendingListeners.length = 0;
  });

  socket.on('disconnect', (reason) => {
    console.log('🔌 Socket disconnected:', reason);
  });

  socket.on('reconnect', () => {
    if (_userId) socket.emit('user_online', _userId);
  });

  return socket;
};

export const getSocket = () => socket;

// Safe subscribe: works even before socket connects
export const onSocket = (event, handler) => {
  if (socket?.connected) {
    socket.on(event, handler);
  } else if (socket) {
    // Socket exists but not connected yet — attach on connect
    socket.once('connect', () => socket.on(event, handler));
  } else {
    // Socket not initialized yet — queue it
    pendingListeners.push({ event, handler });
  }
  // Return unsubscribe
  return () => {
    if (socket) socket.off(event, handler);
    const idx = pendingListeners.findIndex(l => l.event === event && l.handler === handler);
    if (idx !== -1) pendingListeners.splice(idx, 1);
  };
};

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
    _userId = null;
    pendingListeners.length = 0;
  }
};

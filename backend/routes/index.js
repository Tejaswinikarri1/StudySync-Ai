// Central route registry — imported by server.js
const authRouter      = require('./auth');
const userRouter      = require('./users');
const groupRouter     = require('./groups');
const sessionRouter   = require('./sessions');
const messageRouter   = require('./messages');
const analyticsRouter = require('./analytics');

module.exports = {
  authRouter,
  userRouter,
  groupRouter,
  sessionRouter,
  messageRouter,
  analyticsRouter,
};

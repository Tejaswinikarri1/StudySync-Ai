const express = require('express');
const router  = express.Router();
const { protect } = require('../middleware/auth');
const {
  getMe,
  updateMe,
  getMatches,
  sendRequest,
  acceptRequest,
  declineRequest,
  getConnections,
  getLeaderboard,
  getNotifications,
  markNotificationsRead,
} = require('../controllers/userController');

// All user routes require authentication
router.use(protect);

// GET  /api/users/me
router.get('/me', getMe);

// PUT  /api/users/me
router.put('/me', updateMe);

// GET  /api/users/matches?subject=&skill=&avail=
router.get('/matches', getMatches);

// POST /api/users/connect/:id  — send connection request
router.post('/connect/:id', sendRequest);

// PUT  /api/users/connect/:id/accept
router.put('/connect/:id/accept', acceptRequest);

// PUT  /api/users/connect/:id/decline
router.put('/connect/:id/decline', declineRequest);

// GET  /api/users/connections?status=accepted|pending
router.get('/connections', getConnections);

// GET  /api/users/leaderboard?tab=hours|streak|sessions
router.get('/leaderboard', getLeaderboard);

// GET  /api/users/notifications
router.get('/notifications', getNotifications);

// PUT  /api/users/notifications/read
router.put('/notifications/read', markNotificationsRead);

module.exports = router;

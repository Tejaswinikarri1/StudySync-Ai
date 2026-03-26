const express = require('express');
const router  = express.Router();
const { protect } = require('../middleware/auth');
const {
  getGroups,
  createGroup,
  requestJoin,
  getJoinRequests,
  approveJoin,
  declineJoin,
  leaveGroup,
  regenerateInvite,
  getGroupMessages,
  sendGroupMessage,
} = require('../controllers/mainController');

router.use(protect);

// GET  /api/groups
router.get('/',                            getGroups);
// POST /api/groups
router.post('/',                           createGroup);

// Join requests (replaces direct join)
// POST /api/groups/:id/request             — user sends join request
router.post('/:id/request',                requestJoin);
// GET  /api/groups/:id/requests            — admin sees pending requests
router.get('/:id/requests',                getJoinRequests);
// PUT  /api/groups/:id/requests/:userId/approve
router.put('/:id/requests/:userId/approve', approveJoin);
// PUT  /api/groups/:id/requests/:userId/decline
router.put('/:id/requests/:userId/decline', declineJoin);

// DELETE /api/groups/:id/leave
router.delete('/:id/leave',                leaveGroup);

// POST /api/groups/:id/invite              — regenerate invite code
router.post('/:id/invite',                 regenerateInvite);

// GET  /api/groups/:id/messages
router.get('/:id/messages',                getGroupMessages);
// POST /api/groups/:id/messages
router.post('/:id/messages',               sendGroupMessage);

module.exports = router;

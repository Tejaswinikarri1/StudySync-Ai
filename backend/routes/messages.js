const express = require('express');
const router  = express.Router();
const { protect } = require('../middleware/auth');
const { getDMMessages, sendDM } = require('../controllers/mainController');

router.use(protect);

// GET  /api/messages/:userId  — get DM thread with a user
router.get('/:userId', getDMMessages);

// POST /api/messages/:userId  — send DM (only for connected users)
router.post('/:userId', sendDM);

module.exports = router;

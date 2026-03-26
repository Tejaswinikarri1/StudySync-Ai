const express = require('express');
const router  = express.Router();
const { protect } = require('../middleware/auth');
const {
  getSessions,
  createSession,
  completeSession,
} = require('../controllers/mainController');

router.use(protect);

// GET  /api/sessions
router.get('/', getSessions);

// POST /api/sessions
router.post('/', createSession);

// PUT  /api/sessions/:id/complete
router.put('/:id/complete', completeSession);

module.exports = router;

const express = require('express');
const router  = express.Router();
const { protect } = require('../middleware/auth');
const { getAnalytics, logStudy, askAI } = require('../controllers/mainController');

router.use(protect);

// GET  /api/analytics
router.get('/', getAnalytics);

// POST /api/analytics/log  — log focus timer session
router.post('/log', logStudy);

// POST /api/analytics/ai  — AI study assistant
router.post('/ai', askAI);

module.exports = router;

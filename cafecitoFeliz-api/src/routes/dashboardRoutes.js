const express = require('express');
const router = express.Router();
const { getDashboardSummary } = require('../controllers/dashboardController');

const { requireAuth } = require('../middlewares/requireAuth');
const { requireRole } = require('../middlewares/requireRole');

// GET /api/dashboard/summary
router.get('/summary', requireAuth, requireRole('admin'), getDashboardSummary);

module.exports = router;
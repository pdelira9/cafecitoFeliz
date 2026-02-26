const express = require('express');
const router = express.Router();

const {
  createSale,
  getSaleBySaleId,
  cancelSaleBySaleId,
  listSales
} = require('../controllers/salesController');
const { requireAuth } = require('../middlewares/requireAuth');
const { requireRole } = require('../middlewares/requireRole');

// POST /api/sales
router.post('/', requireAuth, createSale);

 // GET /api/sales

router.get('/', requireAuth, listSales);

// GET /api/sales/:saleId

router.get('/:saleId', requireAuth, getSaleBySaleId);

// PATCH /api/sales/:saleId/cancel

router.patch('/:saleId/cancel', requireAuth, requireRole('admin'), cancelSaleBySaleId);

module.exports = router;
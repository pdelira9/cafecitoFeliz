const express = require('express');
const { getProducts, createProduct, updateProduct, deactivateProduct, activateProduct } = require('../controllers/productController');
const { requireAuth } = require('../middlewares/requireAuth');
const { requireRole } = require('../middlewares/requireRole');

const router = express.Router();

// Ver productos
router.get('/', requireAuth, getProducts);

// Crear producto
router.post('/', requireAuth, requireRole('admin'), createProduct);

router.patch('/:id', requireAuth, requireRole('admin'), updateProduct);
router.patch('/:id/deactivate', requireAuth, requireRole('admin'), deactivateProduct);
router.patch('/:id/activate', requireAuth, requireRole('admin'), activateProduct);

module.exports = router;


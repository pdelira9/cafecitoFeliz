const express = require('express');
const router = express.Router();

const {
  listCustomers,
  createCustomer,
  updateCustomer,
  setCustomerActive,
} = require('../controllers/customersController');

const { requireAuth } = require('../middlewares/requireAuth');
const { requireRole } = require('../middlewares/requireRole');

// Listar / buscar
router.get('/', requireAuth, listCustomers);

// Crear
router.post('/', requireAuth, createCustomer);

// Editar
router.patch('/:id', requireAuth, requireRole('admin'), updateCustomer);

// Activar/desactivar
router.patch('/:id/active', requireAuth, requireRole('admin'), setCustomerActive);

module.exports = router;

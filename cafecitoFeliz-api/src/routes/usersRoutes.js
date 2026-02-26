const express = require('express');
const router = express.Router();

const { requireAuth } = require('../middlewares/requireAuth');
const { requireRole } = require('../middlewares/requireRole');

const {
  listUsers,
  createUser,
  setUserActive,
  resetUserPassword,
} = require('../controllers/usersController');

 //  /api/users

router.get('/', requireAuth, requireRole('admin'), listUsers);
router.post('/', requireAuth, requireRole('admin'), createUser);

router.patch('/:id/active', requireAuth, requireRole('admin'), setUserActive);
router.patch('/:id/password', requireAuth, requireRole('admin'), resetUserPassword);

module.exports = router;
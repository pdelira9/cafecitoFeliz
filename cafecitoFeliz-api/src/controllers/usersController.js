const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');


// GET /api/users

async function listUsers(req, res) {
  try {
    const q = String(req.query.q ?? '').trim();
    const page = Number(req.query.page ?? 1);
    const limit = Number(req.query.limit ?? 20);
    const role = String(req.query.role ?? 'all').trim();
    const active = String(req.query.active ?? 'all').trim();

    const details = [];
    if (!Number.isInteger(page) || page < 1) {
      details.push({ field: 'page', value: req.query.page, message: 'page must be >= 1' });
    }
    if (!Number.isInteger(limit) || limit < 1 || limit > 100) {
      details.push({ field: 'limit', value: req.query.limit, message: 'limit must be between 1 and 100' });
    }
    if (!['admin', 'cashier', 'all'].includes(role)) {
      details.push({ field: 'role', value: role, message: 'role must be admin, cashier, or all' });
    }
    if (!['true', 'false', 'all'].includes(active)) {
      details.push({ field: 'active', value: active, message: 'active must be true, false, or all' });
    }
    if (details.length) {
      return res.status(400).json({ error: 'Invalid query parameters', details });
    }

    const filter = {};

    if (q) {
      filter.$or = [
        { name: { $regex: q, $options: 'i' } },
        { email: { $regex: q, $options: 'i' } },
      ];
    }

    if (role !== 'all') {
      filter.role = role;
    }

    if (active !== 'all') {
      filter.active = active === 'true';
    }

    const skip = (page - 1) * limit;

    const [total, users] = await Promise.all([
      User.countDocuments(filter),
      User.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
    ]);

    return res.json({ data: users, total, page, limit });
  } catch (err) {
    console.error('listUsers error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * POST /api/users
 *
 * JSON
 * { name, email, password, role }
 *
 */
async function createUser(req, res) {
  try {
    const { name, email, password, role = 'cashier' } = req.body ?? {};

    const details = [];

    if (!name || typeof name !== 'string' || name.trim().length < 2) {
      details.push({ field: 'name', message: 'name is required (min 2 chars)' });
    }

    if (!email || typeof email !== 'string' || !email.includes('@')) {
      details.push({ field: 'email', message: 'valid email is required' });
    }

    if (!password || typeof password !== 'string' || password.length < 6) {
      details.push({ field: 'password', message: 'password must be at least 6 chars' });
    }

    if (!['admin', 'cashier'].includes(role)) {
      details.push({ field: 'role', message: 'role must be admin or cashier' });
    }

    if (details.length) {
      return res.status(422).json({ error: 'Validation failed', details });
    }

    const normalizedEmail = String(email).toLowerCase().trim();
    const existing = await User.findOne({ email: normalizedEmail });
    if (existing) {
      return res.status(409).json({ error: 'User already exists' });
    }

    const passwordHash = await bcrypt.hash(String(password), 10);

    const created = await User.create({
      name: String(name).trim(),
      email: normalizedEmail,
      passwordHash,
      role,
      active: true,
    });

    return res.status(201).json(created);
  } catch (err) {
    console.error('createUser error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * PATCH /api/users/:id/active
 *
 * JSON
 * { active: boolean }
 */
async function setUserActive(req, res) {
  try {
    const { id } = req.params;
    const { active } = req.body ?? {};

    if (!mongoose.isValidObjectId(id)) {
      return res.status(404).json({ error: 'User not found', id });
    }

    if (typeof active !== 'boolean') {
      return res.status(422).json({
        error: 'Validation failed',
        details: [{ field: 'active', message: 'active must be boolean' }],
      });
    }

    const requesterId = req.user?.sub;

    if (String(requesterId) === String(id) && active === false) {
      return res.status(409).json({ error: 'You cannot disable your own user' });
    }

    const updated = await User.findByIdAndUpdate(
      id,
      { $set: { active } },
      { new: true }
    );

    if (!updated) {
      return res.status(404).json({ error: 'User not found', id });
    }

    return res.json(updated);
  } catch (err) {
    console.error('setUserActive error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * PATCH /api/users/:id/password
 *
 * { password: string }
 */
async function resetUserPassword(req, res) {
  try {
    const { id } = req.params;
    const { password } = req.body ?? {};

    if (!mongoose.isValidObjectId(id)) {
      return res.status(404).json({ error: 'User not found', id });
    }

    if (!password || typeof password !== 'string' || password.length < 6) {
      return res.status(422).json({
        error: 'Validation failed',
        details: [{ field: 'password', message: 'password must be at least 6 chars' }],
      });
    }

    const passwordHash = await bcrypt.hash(String(password), 10);

    const updated = await User.findByIdAndUpdate(
      id,
      { $set: { passwordHash } },
      { new: true }
    );

    if (!updated) {
      return res.status(404).json({ error: 'User not found', id });
    }

    return res.json({ ok: true, message: 'Password updated' });
  } catch (err) {
    console.error('resetUserPassword error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

module.exports = {
  listUsers,
  createUser,
  setUserActive,
  resetUserPassword,
};
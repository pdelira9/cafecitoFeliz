const bcrypt = require('bcryptjs');
const User = require('../models/User');
const { signToken } = require('../utils/jwt');

// POST /api/auth/register
async function register(req, res) {
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

    const normalizedEmail = email.toLowerCase().trim();

    const existing = await User.findOne({ email: normalizedEmail });
    if (existing) {
      return res.status(409).json({ error: 'User already exists' });
    }

    //   si YA existe un admin -> forzar a cashier
    //   si NO existe admin -> exige BOOTSTRAP_ADMIN_KEY
    let finalRole = role;

    if (role === 'admin') {
      const adminExists = await User.exists({ role: 'admin' });

      if (adminExists) {
        finalRole = 'cashier';
      } else {
        const bootstrapKey = req.headers['x-bootstrap-key'];
        const expectedKey = process.env.BOOTSTRAP_ADMIN_KEY;

        if (!expectedKey || bootstrapKey !== expectedKey) {
          return res.status(403).json({
            error: 'Bootstrap key required to create first admin',
            details: [{ field: 'x-bootstrap-key', message: 'missing or invalid bootstrap key' }],
          });
        }

        finalRole = 'admin';
      }
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const created = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      passwordHash,
      role: finalRole,
    });

    return res.status(201).json(created);
  } catch (err) {
    console.error('register error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

// POST /api/auth/login
async function login(req, res) {
  try {
    const { email, password } = req.body ?? {};

    if (!email || !password) {
      return res.status(422).json({
        error: 'Validation failed',
        details: [{ field: 'email/password', message: 'email and password are required' }],
      });
    }

    const user = await User.findOne({ email: String(email).toLowerCase().trim() });
    if (!user || user.active === false) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const ok = await bcrypt.compare(String(password), user.passwordHash);
    if (!ok) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = signToken(user);

    return res.json({
      token,
      user: {
        id: String(user._id),
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (err) {
    console.error('login error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

module.exports = { register, login };
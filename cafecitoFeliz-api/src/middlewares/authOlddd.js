const User = require('../models/User');
const { verifyToken } = require('../utils/jwt');


async function auth(req, res, next) {
  try {
    const header = req.headers.authorization || '';
    const [type, token] = header.split(' ');

    if (type !== 'Bearer' || !token) {
      return res.status(401).json({ error: 'Unauthorized', message: 'Missing Bearer token' });
    }

    const payload = verifyToken(token);

    const user = await User.findById(payload.sub);

    if (!user || user.active === false) {
      return res.status(401).json({ error: 'Unauthorized', message: 'User not found or inactive' });
    }

    req.user = {
      id: String(user._id),
      role: user.role,
      email: user.email,
      name: user.name,
    };

    next();
  } catch (err) {
    return res.status(401).json({ error: 'Unauthorized', message: 'Invalid or expired token' });
  }
}


function requireRole(role) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    if (req.user.role !== role) {
      return res.status(403).json({ error: 'Forbidden', message: `Requires role: ${role}` });
    }
    next();
  };
}

module.exports = { auth, requireRole };
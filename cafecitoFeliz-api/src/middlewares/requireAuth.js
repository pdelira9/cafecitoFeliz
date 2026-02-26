/* const jwt = require('jsonwebtoken');


function requireAuth(req, res, next) {
  try {
    const authHeader = req.headers.authorization || '';

    const [type, token] = authHeader.split(' ');

    if (type !== 'Bearer' || !token) {
      return res.status(401).json({ error: 'Unauthorized', message: 'Missing Bearer token' });
    }

    const secret = process.env.JWT_SECRET;
    if (!secret) {
      return res.status(500).json({ error: 'Server misconfigured', message: 'JWT_SECRET not set' });
    }

    // Verificamos token
    const payload = jwt.verify(token, secret);

    // Guardamos el payload
    req.user = payload;

    return next();
  } catch (err) {
    return res.status(401).json({ error: 'Unauthorized', message: 'Invalid or expired token' });
  }
}

module.exports = { requireAuth }; */

const { verifyToken } = require('../utils/jwt');
const { httpError } = require('../utils/httpError');

function requireAuth(req, res, next) {
  try {
    const authHeader = req.headers.authorization || '';
    const [type, token] = authHeader.split(' ');

    if (type !== 'Bearer' || !token) {
      throw httpError(401, 'Missing Bearer token', 'Unauthorized');
    }

    const payload = verifyToken(token);
    req.user = payload;
    return next();
  } catch (err) {
    if (!err.statusCode) {
      return next(httpError(401, 'Invalid or expired token', 'Unauthorized'));
    }
    return next(err);
  }
}

module.exports = { requireAuth };
/* const jwt = require('jsonwebtoken');


function signToken(user) {
  const secret = process.env.JWT_SECRET;
  const expiresIn = process.env.JWT_EXPIRES_IN || '7d';

  return jwt.sign(
    { role: user.role },
    secret,
    { subject: String(user._id), expiresIn }
  );
}

function verifyToken(token) {
  const secret = process.env.JWT_SECRET;
  return jwt.verify(token, secret);
}

module.exports = { signToken, verifyToken }; */


const jwt = require('jsonwebtoken');
const { httpError } = require('./httpError');

function getJwtSecret() {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw httpError(500, 'JWT_SECRET not set', 'Server misconfigured');
  }
  return secret;
}

function signToken(user) {
  const secret = getJwtSecret();
  const expiresIn = process.env.JWT_EXPIRES_IN || '7d';

  return jwt.sign(
    { role: user.role },
    secret,
    { subject: String(user._id), expiresIn }
  );
}

function verifyToken(token) {
  const secret = getJwtSecret();
  return jwt.verify(token, secret);
}

module.exports = { signToken, verifyToken };
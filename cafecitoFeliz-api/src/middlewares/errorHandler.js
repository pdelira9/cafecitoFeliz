function errorHandler(err, req, res, next) {
  // Si ya se respondió, evita "Can't set headers after they are sent."
  if (res.headersSent) return next(err);

  console.error(err);

  let status = err.statusCode || err.status || 500;
  let publicError = err.publicError || 'Internal Server Error';
  let message = err.publicMessage || err.message || 'Unexpected error';
  let details = err.details;

  // JWT (si llega directo un error de jsonwebtoken)
  if (err.name === 'TokenExpiredError' || err.name === 'JsonWebTokenError') {
    status = 401;
    publicError = 'Unauthorized';
    message = 'Invalid or expired token';
    details = undefined;
  }

  // Mongoose duplicate key (E11000)
  if (err.code === 11000) {
    status = 409;
    publicError = 'Conflict';
    const fields = Object.keys(err.keyValue || {});
    message = fields.length ? `Duplicate value for: ${fields.join(', ')}` : 'Duplicate key';
    details = err.keyValue;
  }

  // Mongoose validation errors
  if (err.name === 'ValidationError') {
    status = 400;
    publicError = 'ValidationError';
    message = 'Validation failed';
    details = Object.values(err.errors || {}).map(e => e.message);
  }

  // Respuesta (omite details si no existe)
  const payload = { error: publicError, message };
  if (details !== undefined) payload.details = details;

  return res.status(status).json(payload);
}

module.exports = { errorHandler };
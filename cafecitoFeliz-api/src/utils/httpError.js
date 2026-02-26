function httpError(statusCode, publicMessage, publicError = 'Error', details) {
  const err = new Error(publicMessage);
  err.statusCode = statusCode;
  err.publicError = publicError;
  err.publicMessage = publicMessage;
  if (details) err.details = details;
  return err;
}

module.exports = { httpError };
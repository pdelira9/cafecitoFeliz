function requireRole(role) {
  return (req, res, next) => {
    const user = req.user;

    if (!user) {
      return res.status(401).json({ error: 'Unauthorized', message: 'No session' });
    }

    if (user.role !== role) {
      return res.status(403).json({
        error: 'Forbidden',
        message: `Requires role: ${role}`,
      });
    }

    return next();
  };
}

module.exports = { requireRole };
// middleware/roleAuth.js
module.exports = function roleAuth(allowedRoles = []) {
  return (req, res, next) => {
    if (!req.user || !req.user.role) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    if (!Array.isArray(allowedRoles)) {
      allowedRoles = [allowedRoles];
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Access denied' });
    }

    next();
  };
};
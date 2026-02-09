module.exports = (requiredRole) => {
  return (req, res, next) => {
    // Admins can perform any action
    if (req.user.role === 'admin') {
      return next();
    }

    if (req.user.role !== requiredRole) {
      return res.status(403).json({ message: "Forbidden" });
    }
    next();
  };
};

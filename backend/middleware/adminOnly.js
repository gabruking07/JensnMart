module.exports = (roles) => {
  return (req, res, next) => {
    if (!req.user || !req.user.role) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    if (Array.isArray(roles)) {
      if (!roles.includes(req.user.role)) {
        return res.status(403).json({ message: "Access denied" });
      }
    } else {
      if (req.user.role !== roles) {
        return res.status(403).json({ message: "Access denied" });
      }
    }

    next();
  };
};
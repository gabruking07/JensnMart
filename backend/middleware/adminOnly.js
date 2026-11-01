/** Express middleware for admin only; checks a request condition before protected route handlers continue. */

// Builds role-checking middleware so each protected route can declare allowed roles.
module.exports = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: "Access denied" });
    }
    next();
  };
};

<<<<<<< HEAD
/** Express middleware for admin only; checks a request condition before protected route handlers continue. */

// Builds role-checking middleware so each protected route can declare allowed roles.
=======
>>>>>>> 01538e8b0c137147cf885390b770f7b7e80d10f5
module.exports = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: "Access denied" });
    }
    next();
  };
<<<<<<< HEAD
};
=======
};
>>>>>>> 01538e8b0c137147cf885390b770f7b7e80d10f5

/** Express middleware for optional auth middleware; checks a request condition before protected route handlers continue. */

const jwt = require("jsonwebtoken");

// Reads a bearer JWT when present, but lets public routes continue without a signed-in user.
module.exports = (req, _res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      req.user = null;
      return next();
    }

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    req.user = {
      id: decoded.id,
      role: decoded.role,
    };

    return next();
  } catch (_err) {
    req.user = null;
    return next();
  }
};

<<<<<<< HEAD
/** Express middleware for auth middleware; checks a request condition before protected route handlers continue. */

const jwt = require("jsonwebtoken");

// Verifies the request's bearer JWT and attaches its user ID and role for route handlers.
=======
const jwt = require("jsonwebtoken");

>>>>>>> 01538e8b0c137147cf885390b770f7b7e80d10f5
module.exports = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ message: "No token" });
    }

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    req.user = {
      id: decoded.id,
      role: decoded.role
    };

    next();
  } catch (err) {
    return res.status(401).json({ message: "Invalid token" });
  }
<<<<<<< HEAD
};
=======
};
>>>>>>> 01538e8b0c137147cf885390b770f7b7e80d10f5

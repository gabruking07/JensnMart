<<<<<<< HEAD
/** Express middleware for approve vendor only; checks a request condition before protected route handlers continue. */

const Vendor = require("../models/Vendor");

// Confirms that the authenticated vendor exists and has admin approval before checkout actions continue.
=======
const Vendor = require("../models/Vendor");

>>>>>>> 01538e8b0c137147cf885390b770f7b7e80d10f5
module.exports = async (req, res, next) => {
  try {
    const vendor = await Vendor.findById(req.user.id);

    if (!vendor) {
      return res.status(404).json({
        message: "Vendor not found"
      });
    }

    if (!vendor.approved) {
      return res.status(403).json({
        message: "Vendor not approved by admin yet"
      });
    }

    next();
  } catch (err) {
    console.error("ApproveVendorOnly error:", err);
    res.status(500).json({ message: "Server error" });
  }
<<<<<<< HEAD
};
=======
};
>>>>>>> 01538e8b0c137147cf885390b770f7b7e80d10f5

const Vendor = require("../models/Vendor");

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
};
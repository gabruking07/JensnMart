const router = require("express").Router();
const Vendor = require("../models/Vendor");
const auth = require("../middleware/authMiddleware");
const bcrypt = require("bcryptjs");

/* GET VENDOR PROFILE */
router.get("/profile", auth, async (req, res) => {
  try {
    if (req.user.role !== "vendor") {
      return res.status(403).json({ message: "Vendor only" });
    }

    const vendor = await Vendor.findById(req.user.id).select("-password");

    if (!vendor) {
      return res.status(404).json({ message: "Vendor not found" });
    }

    res.json(vendor);
  } catch (err) {
    res.status(500).json({ message: "Failed to load profile" });
  }
});

router.get("/all", auth, async (req, res) => {
  if (req.user.role !== "admin") {
    return res.status(403).json({ message: "Admin only" });
  }

  const vendors = await Vendor.find();
  res.json(vendors);z
});

/* UPDATE VENDOR PROFILE */
router.put("/profile", auth, async (req, res) => {
  try {
    if (req.user.role !== "vendor") {
      return res.status(403).json({ message: "Vendor only" });
    }

    const { name, password } = req.body;
    const update = {};

    if (name) update.name = name;

    if (password) {
      update.password = await bcrypt.hash(password, 10);
    }

    const vendor = await Vendor.findByIdAndUpdate(
      req.user.id,
      update,
      { new: true }
    ).select("-password");

    res.json(vendor);
  } catch (err) {
    console.error("VENDOR PROFILE UPDATE ERROR:", err);
    res.status(500).json({ message: "Profile update failed" });
  }
});

module.exports = router;
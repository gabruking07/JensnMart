const router = require("express").Router();
const Vendor = require("../models/Vendor");
const auth = require("../middleware/authMiddleware");
const bcrypt = require("bcryptjs");

/* GET VENDOR PROFILE */
router.get("/profile", auth, async (req, res) => {
  if (req.user.role !== "vendor") {
    return res.status(403).json({ message: "Vendor only" });
  }

  const vendor = await Vendor.findById(req.user.id).select("-password");
  res.json(vendor);
});

/* UPDATE PROFILE */
router.put("/profile", auth, async (req, res) => {
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
});

module.exports = router;
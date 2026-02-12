const router = require("express").Router();
const Vendor = require("../models/Vendor");
const auth = require("../middleware/authMiddleware");
const bcrypt = require("bcryptjs");
const upload = require("../config/upload");
const jwt = require("jsonwebtoken");

/* =====================================================
   REGISTER VENDOR
===================================================== */
router.post("/register", upload.single("profileImage"), async (req, res) => {
  try {
    const {
      name,
      email,
      password,
      phone,
      addressLine1,
      addressLine2,
      city,
      state,
      pincode,
      country
    } = req.body;

    if (!name || !email || !password || !phone) {
      return res.status(400).json({
        message: "Name, email, password and phone are required"
      });
    }

    if (!/^\d{10}$/.test(phone)) {
      return res.status(400).json({
        message: "Phone must be exactly 10 digits"
      });
    }

    const existing = await Vendor.findOne({ email: email.toLowerCase() });
    if (existing) {
      return res.status(400).json({
        message: "Vendor already exists"
      });
    }

    const hashed = await bcrypt.hash(password, 10);

    const vendor = new Vendor({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password: hashed,
      phone,

      address: {
        line1: addressLine1 || "",
        line2: addressLine2 || "",
        city: city || "",
        state: state || "",
        pincode: pincode || "",
        country: (country || "India").trim()
      },

      profileImage: req.file?.filename || "",
      approved: false,
      role: "vendor"
    });

    await vendor.save();

    res.json({
      message: "Registration successful. Await admin approval."
    });

  } catch (err) {
    console.log("REGISTER ERROR:", err);
    res.status(500).json({ message: err.message });
  }
});

/* =====================================================
   LOGIN VENDOR
===================================================== */
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const vendor = await Vendor.findOne({ email: email.toLowerCase() });
    if (!vendor) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const match = await bcrypt.compare(password, vendor.password);
    if (!match) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const token = jwt.sign(
      {
        id: vendor._id,
        role: "vendor",
        approved: vendor.approved
      },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    res.json({
      token,
      role: "vendor",
      approved: vendor.approved
    });

  } catch (err) {
    console.log("VENDOR LOGIN ERROR:", err);
    res.status(500).json({ message: "Vendor login failed" });
  }
});

/* =====================================================
   GET VENDOR PROFILE
===================================================== */
router.get("/profile", auth, async (req, res) => {
  try {
    if (req.user.role !== "vendor") {
      return res.status(403).json({ message: "Vendor only" });
    }

    const vendor = await Vendor.findById(req.user.id).select("-password");
    if (!vendor) {
      return res.status(404).json({ message: "Vendor not found" });
    }

    const v = vendor.toObject();

    res.json({
      ...v,

      // 🔥 THIS is critical mapping
      addressLine1: v.address?.line1 || "",
      addressLine2: v.address?.line2 || "",
      city: v.address?.city || "",
      state: v.address?.state || "",
      pincode: v.address?.pincode || "",
      country: v.address?.country || "India"
    });

  } catch (err) {
    console.log("GET PROFILE ERROR:", err);
    res.status(500).json({ message: "Failed to load profile" });
  }
});

/* =====================================================
   UPDATE VENDOR PROFILE
===================================================== */
router.put("/profile", auth, upload.single("profileImage"), async (req, res) => {
  try {
    if (req.user.role !== "vendor") {
      return res.status(403).json({ message: "Vendor only" });
    }

    const update = {};

    if (req.body.name) {
      update.name = req.body.name.trim();
    }

    if (req.body.phone) {
      if (!/^\d{10}$/.test(req.body.phone)) {
        return res.status(400).json({ message: "Phone must be 10 digits" });
      }
      update.phone = req.body.phone;
    }

    if (typeof req.body.addressLine1 === "string") {
      update["address.line1"] = req.body.addressLine1.trim();
    }

    if (typeof req.body.addressLine2 === "string") {
      update["address.line2"] = req.body.addressLine2.trim();
    }

    if (typeof req.body.city === "string") {
      update["address.city"] = req.body.city.trim();
    }

    if (typeof req.body.state === "string") {
      update["address.state"] = req.body.state.trim();
    }

    if (typeof req.body.pincode === "string") {
      update["address.pincode"] = req.body.pincode.trim();
    }

    if (typeof req.body.country === "string") {
      update["address.country"] = req.body.country.trim() || "India";
    }

    if (req.body.password) {
      update.password = await bcrypt.hash(req.body.password, 10);
    }

    if (req.file?.filename) {
      update.profileImage = req.file.filename;
    }

    const vendor = await Vendor.findByIdAndUpdate(
      req.user.id,
      update,
      { new: true }
    ).select("-password");

    const v = vendor.toObject();

    res.json({
      ...v,
      addressLine1: v.address?.line1 || "",
      addressLine2: v.address?.line2 || "",
      city: v.address?.city || "",
      state: v.address?.state || "",
      pincode: v.address?.pincode || "",
      country: v.address?.country || "India"
    });
  } catch (err) {
    console.log("UPDATE PROFILE ERROR:", err);
    res.status(500).json({ message: "Profile update failed" });
  }
});

module.exports = router;
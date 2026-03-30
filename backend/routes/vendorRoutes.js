const router = require("express").Router();
const authMiddleware = require("../middleware/authMiddleware");
const Vendor = require("../models/Vendor");
const auth = require("../middleware/authMiddleware");
const bcrypt = require("bcryptjs");
const upload = require("../config/upload");
const jwt = require("jsonwebtoken");
const { sendOtpEmail, sendOtpSms } = require("../utils/mailer");

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

    if (typeof pincode === "string" && pincode.trim() && !/^\d{6}$/.test(pincode.trim())) {
      return res.status(400).json({
        message: "Pincode must be exactly 6 digits"
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

      profileImage: req.file?.filename ? `vendorProfile/${req.file.filename}` : "",
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
   FORGOT PASSWORD (VENDOR)
===================================================== */
router.post("/forgot-password/request-otp", async (req, res) => {
  try {
    const contactType = req.body.contactType === "phone" ? "phone" : "email";
    const identifier = String(req.body.identifier || req.body.email || req.body.phone || "")
      .trim();
    const normalizedIdentifier =
      contactType === "email" ? identifier.toLowerCase() : identifier.replace(/\D/g, "");

    if (!normalizedIdentifier) {
      return res.status(400).json({
        message: contactType === "phone" ? "Phone is required" : "Email is required"
      });
    }

    if (contactType === "phone" && !/^\d{10}$/.test(normalizedIdentifier)) {
      return res.status(400).json({ message: "Phone must be exactly 10 digits" });
    }

    const lookup = contactType === "phone"
      ? { phone: normalizedIdentifier }
      : { email: normalizedIdentifier };

    const vendor = await Vendor.findOne(lookup);
    if (!vendor) {
      return res.status(404).json({ message: "No account found" });
    }

    const otp = String(Math.floor(100000 + Math.random() * 900000));
    const otpHash = await bcrypt.hash(otp, 10);

    vendor.passwordResetOtp = otpHash;
    vendor.passwordResetOtpExpires = new Date(Date.now() + 10 * 60 * 1000);
    await vendor.save();

    try {
      if (contactType === "phone") {
        await sendOtpSms({ to: vendor.phone, name: vendor.name, otp });
      } else {
        await sendOtpEmail({ to: vendor.email, name: vendor.name, otp });
      }
    } catch (deliveryErr) {
      console.error("VENDOR OTP DELIVERY ERROR:", deliveryErr.message);
    }

    res.json({
      message:
        contactType === "phone"
          ? "If the phone number exists, OTP has been sent"
          : "If the email exists, OTP has been sent"
    });
  } catch (err) {
    console.log("VENDOR OTP REQUEST ERROR:", err);
    res.status(500).json({ message: "Failed to send OTP" });
  }
});

router.post("/forgot-password/verify-otp", async (req, res) => {
  try {
    const contactType = req.body.contactType === "phone" ? "phone" : "email";
    const identifier = String(req.body.identifier || req.body.email || req.body.phone || "")
      .trim();
    const normalizedIdentifier =
      contactType === "email" ? identifier.toLowerCase() : identifier.replace(/\D/g, "");
    const otp = String(req.body.otp || "").trim();

    if (!normalizedIdentifier || !otp) {
      return res.status(400).json({
        message:
          contactType === "phone"
            ? "Phone and OTP are required"
            : "Email and OTP are required"
      });
    }

    const lookup = contactType === "phone"
      ? { phone: normalizedIdentifier }
      : { email: normalizedIdentifier };

    const vendor = await Vendor.findOne(lookup);
    if (!vendor || !vendor.passwordResetOtp || !vendor.passwordResetOtpExpires) {
      return res.status(400).json({ message: "Invalid or expired OTP" });
    }

    if (vendor.passwordResetOtpExpires.getTime() < Date.now()) {
      return res.status(400).json({ message: "OTP expired" });
    }

    const isOtpMatch = await bcrypt.compare(otp, vendor.passwordResetOtp);
    if (!isOtpMatch) {
      return res.status(400).json({ message: "Invalid or expired OTP" });
    }

    const resetToken = jwt.sign(
      {
        id: vendor._id,
        email: vendor.email,
        phone: vendor.phone || "",
        role: "vendor",
        contactType,
        identifier: normalizedIdentifier,
        purpose: "password_reset"
      },
      process.env.JWT_SECRET,
      { expiresIn: "15m" }
    );

    res.json({ message: "OTP verified", resetToken });
  } catch (err) {
    console.log("VENDOR OTP VERIFY ERROR:", err);
    res.status(500).json({ message: "Failed to verify OTP" });
  }
});

router.post("/forgot-password/reset", async (req, res) => {
  try {
    const contactType = req.body.contactType === "phone" ? "phone" : "email";
    const identifier = String(req.body.identifier || req.body.email || req.body.phone || "")
      .trim();
    const normalizedIdentifier =
      contactType === "email" ? identifier.toLowerCase() : identifier.replace(/\D/g, "");
    const newPassword = String(req.body.newPassword || "");
    const resetToken = String(req.body.resetToken || "");

    if (!normalizedIdentifier || !newPassword || !resetToken) {
      return res.status(400).json({
        message:
          contactType === "phone"
            ? "Phone, reset token and new password are required"
            : "Email, reset token and new password are required"
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters" });
    }

    let payload;
    try {
      payload = jwt.verify(resetToken, process.env.JWT_SECRET);
    } catch {
      return res.status(400).json({ message: "Invalid or expired reset token" });
    }

    if (
      payload.purpose !== "password_reset" ||
      payload.contactType !== contactType ||
      payload.identifier !== normalizedIdentifier
    ) {
      return res.status(400).json({ message: "Invalid reset request" });
    }

    const vendor = await Vendor.findById(payload.id);
    if (!vendor) {
      return res.status(404).json({ message: "Vendor not found" });
    }

    vendor.password = await bcrypt.hash(newPassword, 10);
    vendor.passwordResetOtp = "";
    vendor.passwordResetOtpExpires = null;
    await vendor.save();

    res.json({ message: "Password updated successfully" });
  } catch (err) {
    console.log("VENDOR RESET PASSWORD ERROR:", err);
    res.status(500).json({ message: "Failed to reset password" });
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
      if (req.body.pincode.trim() && !/^\d{6}$/.test(req.body.pincode.trim())) {
        return res.status(400).json({ message: "Pincode must be 6 digits" });
      }
      update["address.pincode"] = req.body.pincode.trim();
    }

    if (typeof req.body.country === "string") {
      update["address.country"] = req.body.country.trim() || "India";
    }

    if (req.body.password) {
      update.password = await bcrypt.hash(req.body.password, 10);
    }

    if (req.file?.filename) {
      update.profileImage = `vendorProfile/${req.file.filename}`;
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

/* =====================================================
   ADDRESS BOOK ROUTES
   BASE: /api/vendor
===================================================== */

router.get("/addresses", authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== "vendor") {
      return res.status(403).json({ message: "Vendor only" });
    }

    const vendor = await Vendor.findById(req.user.id);
    if (!vendor) {
      return res.status(404).json({ message: "Vendor not found" });
    }
    res.json(vendor.addresses || []);
  } catch {
    res.status(500).json({ message: "Failed to load addresses" });
  }
});

router.post("/addresses", authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== "vendor") {
      return res.status(403).json({ message: "Vendor only" });
    }

    const vendor = await Vendor.findById(req.user.id);
    if (!vendor) {
      return res.status(404).json({ message: "Vendor not found" });
    }

    if (!Array.isArray(vendor.addresses)) {
      vendor.addresses = [];
    }

    vendor.addresses.push({
      label: req.body.label,
      line1: req.body.line1,
      city: req.body.city,
      state: req.body.state || "",
      pincode: req.body.pincode
    });

    await vendor.save();
    res.json(vendor.addresses);
  } catch {
    res.status(500).json({ message: "Add failed" });
  }
});

router.put("/addresses/:index", authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== "vendor") {
      return res.status(403).json({ message: "Vendor only" });
    }

    const vendor = await Vendor.findById(req.user.id);
    if (!vendor) {
      return res.status(404).json({ message: "Vendor not found" });
    }

    if (!Array.isArray(vendor.addresses)) {
      vendor.addresses = [];
    }

    const i = Number(req.params.index);

    if (!vendor.addresses[i]) {
      return res.status(400).json({ message: "Address not found" });
    }

    vendor.addresses[i] = {
      label: req.body.label,
      line1: req.body.line1,
      city: req.body.city,
      state: req.body.state || "",
      pincode: req.body.pincode
    };

    await vendor.save();
    res.json(vendor.addresses);
  } catch {
    res.status(500).json({ message: "Edit failed" });
  }
});

router.delete("/addresses/:index", authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== "vendor") {
      return res.status(403).json({ message: "Vendor only" });
    }

    const vendor = await Vendor.findById(req.user.id);
    if (!vendor) {
      return res.status(404).json({ message: "Vendor not found" });
    }

    if (!Array.isArray(vendor.addresses)) {
      vendor.addresses = [];
    }

    vendor.addresses.splice(Number(req.params.index), 1);
    await vendor.save();
    res.json(vendor.addresses);
  } catch {
    res.status(500).json({ message: "Delete failed" });
  }
});

module.exports = router;

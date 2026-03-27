const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const Admin = require("../models/Admin");
const { sendOtpEmail, sendOtpSms } = require("../utils/mailer");

const router = express.Router();

/* ================= REGISTER ADMIN / MANAGER ================= */
router.post("/register", async (req, res) => {
  try {
    const { name, password, phone, role } = req.body;
    const email = String(req.body.email || "").toLowerCase().trim();

    if (!name || !email || !password || !role) {
      return res.status(400).json({ message: "All fields required" });
    }

    if (!["admin", "manager"].includes(role)) {
      return res.status(400).json({ message: "Invalid role" });
    }

    const exists = await Admin.findOne({ email });
    if (exists) {
      return res.status(400).json({ message: "Email already registered" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const admin = await Admin.create({
      name,
      email,
      password: hashedPassword,
      phone,
      role,
      approved: false 
    });

    res.status(201).json({
      message: `${role} registered successfully. Await admin approval.`
    });
  } catch (err) {
    console.error("ADMIN REGISTER ERROR:", err);
    res.status(500).json({ message: "Registration failed" });
  }
});

/* ================= LOGIN ADMIN / MANAGER ================= */
router.post("/login", async (req, res) => {
  try {
    const email = String(req.body.email || "").toLowerCase().trim();
    const { password } = req.body;

    const user = await Admin.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    if (!user.approved) {
      return res.status(403).json({ message: "Account pending approval" });
    }

    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.json({
      token,
      role: user.role,
      approved: user.approved
    });
  } catch (err) {
    console.error("ADMIN LOGIN ERROR:", err);
    res.status(500).json({ message: "Login failed" });
  }
});

/* ================= FORGOT PASSWORD (ADMIN/MANAGER) ================= */
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

    const user = await Admin.findOne(lookup);
    if (!user) {
      return res.status(404).json({ message: "No account found" });
    }

    const otp = String(Math.floor(100000 + Math.random() * 900000));
    const otpHash = await bcrypt.hash(otp, 10);

    user.passwordResetOtp = otpHash;
    user.passwordResetOtpExpires = new Date(Date.now() + 10 * 60 * 1000);
    await user.save();

    try {
      if (contactType === "phone") {
        await sendOtpSms({ to: user.phone, name: user.name, otp });
      } else {
        await sendOtpEmail({ to: user.email, name: user.name, otp });
      }
    } catch (deliveryErr) {
      console.error("ADMIN OTP DELIVERY ERROR:", deliveryErr.message);
    }

    res.json({
      message:
        contactType === "phone"
          ? "If the phone number exists, OTP has been sent"
          : "If the email exists, OTP has been sent"
    });
  } catch (err) {
    console.error("ADMIN OTP REQUEST ERROR:", err);
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

    const user = await Admin.findOne(lookup);
    if (!user || !user.passwordResetOtp || !user.passwordResetOtpExpires) {
      return res.status(400).json({ message: "Invalid or expired OTP" });
    }

    if (user.passwordResetOtpExpires.getTime() < Date.now()) {
      return res.status(400).json({ message: "OTP expired" });
    }

    const isOtpMatch = await bcrypt.compare(otp, user.passwordResetOtp);
    if (!isOtpMatch) {
      return res.status(400).json({ message: "Invalid or expired OTP" });
    }

    const resetToken = jwt.sign(
      {
        id: user._id,
        email: user.email,
        phone: user.phone || "",
        role: user.role,
        contactType,
        identifier: normalizedIdentifier,
        purpose: "password_reset"
      },
      process.env.JWT_SECRET,
      { expiresIn: "15m" }
    );

    res.json({ message: "OTP verified", resetToken });
  } catch (err) {
    console.error("ADMIN OTP VERIFY ERROR:", err);
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

    const user = await Admin.findById(payload.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    user.password = await bcrypt.hash(newPassword, 10);
    user.passwordResetOtp = "";
    user.passwordResetOtpExpires = null;
    await user.save();

    res.json({ message: "Password updated successfully" });
  } catch (err) {
    console.error("ADMIN RESET PASSWORD ERROR:", err);
    res.status(500).json({ message: "Failed to reset password" });
  }
});

module.exports = router;

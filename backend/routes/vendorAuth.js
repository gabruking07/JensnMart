const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const Vendor = require("../models/Vendor");

const router = express.Router();

/* ================= REGISTER VENDOR ================= */
router.post("/register", async (req, res) => {
  try {
    console.log("VENDOR REGISTER BODY:", req.body); // 🔴 ADD THIS

    const { name, email, password, phone } = req.body;

    if (!name || !email || !password || !phone) {
      return res.status(400).json({ message: "All fields required" });
    }

    const exists = await Vendor.findOne({ email });
    console.log("EXISTS CHECK:", exists); // 🔴 ADD THIS

    if (exists) {
      return res.status(400).json({ message: "Vendor already exists" });
    }

    const hashed = await bcrypt.hash(password, 10);

    const created = await Vendor.create({
      name,
      email,
      password: hashed,
      phone,
      role: "vendor",
      approved: false
    });

    console.log("VENDOR CREATED:", created); // 🔴 ADD THIS

    res.json({ message: "Vendor registered successfully" });

  } catch (err) {
    console.error("VENDOR REGISTER ERROR FULL:", err); // 🔴 IMPORTANT
    res.status(500).json({ message: "Vendor registration failed" });
  }
});

/* ================= LOGIN VENDOR ================= */
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const vendor = await Vendor.findOne({ email });
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
        approved: vendor.approved   // 🔑 IMPORTANT
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
    res.status(500).json({ message: "Vendor login failed" });
  }
});

module.exports = router;
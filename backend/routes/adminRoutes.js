const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");

const Product = require("../models/Product");
const Vendor = require("../models/Vendor");
const Admin = require("../models/Admin");

const authMiddleware = require("../middleware/authMiddleware");
const roleOnly = require("../middleware/adminOnly");
const { notifyVendor } = require("../utils/notificationService");

const sanitizeVendor = (vendorDoc) => {
  if (!vendorDoc) return null;
  const vendor =
    typeof vendorDoc.toObject === "function" ? vendorDoc.toObject() : vendorDoc;

  return {
    _id: vendor._id,
    name: vendor.name,
    email: vendor.email,
    phone: vendor.phone,
    approved: vendor.approved,
    role: vendor.role,
    profileImage: vendor.profileImage || "",
    address: vendor.address || {},
    addresses: Array.isArray(vendor.addresses) ? vendor.addresses : [],
    createdAt: vendor.createdAt,
    updatedAt: vendor.updatedAt,
  };
};

/* GET ALL VENDORS (ADMIN ONLY) */
router.get("/vendors", authMiddleware, roleOnly("admin", "manager"), async (req, res) => {
  const vendors = await Vendor.find().sort({ createdAt: -1 });
  res.json(vendors.map(sanitizeVendor));
});

/* =====================================================
   CREATE NEW VENDOR (ADMIN ONLY)
===================================================== */
router.post(
  "/create-vendor",
  authMiddleware,
  roleOnly("admin"),
  async (req, res) => {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({ message: "Email & password required" });
      }

      const exists = await Vendor.findOne({ email });
      if (exists) {
        return res.status(400).json({ message: "Vendor already exists" });
      }

      const hashed = await bcrypt.hash(password, 10);

      const vendor = await Vendor.create({
        name: email.split("@")[0], // auto name
        email,
        password: hashed,
        phone: "0000000000", // temp
        role: "vendor",
        approved: false
      });

      res.json(sanitizeVendor(vendor));
    } catch (err) {
      console.error("CREATE VENDOR ERROR:", err);
      res.status(500).json({ message: "Vendor creation failed" });
    }
  }
);

/* =====================================================
   UPDATE VENDOR
===================================================== */
router.put(
  "/vendor/:id",
  authMiddleware,
  roleOnly("admin"),
  async (req, res) => {
    try {
      const { email } = req.body;

      const vendor = await Vendor.findByIdAndUpdate(
        req.params.id,
        { email },
        { new: true }
      );

      res.json(sanitizeVendor(vendor));
    } catch {
      res.status(500).json({ message: "Update failed" });
    }
  }
);

/* APPROVE VENDOR (ADMIN ONLY) */
router.put(
  "/approve/:id",
  authMiddleware,
  roleOnly("admin"),
  async (req, res) => {
    try {
      const vendor = await Vendor.findById(req.params.id);
      if (!vendor) {
        return res.status(404).json({ message: "Vendor not found" });
      }

      const wasApproved = Boolean(vendor.approved);
      vendor.approved = true;
      await vendor.save();

      if (!wasApproved) {
        await notifyVendor({
          vendorId: vendor._id,
          type: "system",
          title: "Vendor account approved",
          message:
            "Your JensnMart vendor account has been approved by admin. You can now sign in and start placing orders.",
          meta: {
            status: "approved",
          },
          sendEmail: true,
        });
      }

      res.json({ message: "Vendor approved successfully" });
    } catch (err) {
      res.status(500).json({ message: "Vendor approval failed" });
    }
  }
);

/* REJECT VENDOR (ADMIN ONLY) */
router.delete(
  "/reject-vendor/:id",
  authMiddleware,
  roleOnly("admin"),
  async (req, res) => {
    try {
      await Vendor.findByIdAndDelete(req.params.id);
      res.json({ message: "Vendor rejected and removed" });
    } catch (err) {
      res.status(500).json({ message: "Vendor rejection failed" });
    }
  }
);

/* =====================================================
   ADMIN / MANAGER 
===================================================== */
// GET ALL ADMINS
router.get("/all-admins", authMiddleware, roleOnly("admin"), async (req, res) => {
  const admins = await Admin.find({
    role: { $in: ["admin", "manager"] }
  }).select("name email role approved createdAt updatedAt");
  res.json(admins);
});

// ================= CREATE ADMIN =================
router.post(
  "/create-admin",
  authMiddleware,
  roleOnly("admin"),
  async (req, res) => {
    try {
      const { email, password, role } = req.body;

      if (!email || !password || !role) {
        return res.status(400).json({
          message: "Email, password and role required"
        });
      }

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({
          message: "Invalid email format"
        });
      }

      if (password.length < 6) {
        return res.status(400).json({
          message: "Password must be at least 6 characters"
        });
      }

      const exists = await Admin.findOne({ email });
      if (exists) {
        return res.status(400).json({
          message: "Admin already exists"
        });
      }

      /* ===== CREATE ===== */
      const hash = await bcrypt.hash(password, 10);

      const newAdmin = await Admin.create({
        email: email.toLowerCase(),
        password: hash,
        role: role,
        approved: false
      });

      res.json({
        _id: newAdmin._id,
        email: newAdmin.email,
        role: newAdmin.role,
        approved: newAdmin.approved,
        createdAt: newAdmin.createdAt,
      });

    } catch (err) {
      console.error("CREATE ADMIN ERROR:", err);
      res.status(500).json({
        message: "Server error creating admin"
      });
    }
  }
);

/* ================= GET PROFILE ================= */
router.get("/profile", authMiddleware, async (req, res) => {
  if (!["admin", "manager"].includes(req.user.role)) {
    return res.status(403).json({ message: "Access denied" });
  }

  const admin = await Admin.findById(req.user.id).select("-password");
  res.json(admin);
});

/* ================= UPDATE PROFILE ================= */
router.put("/profile", authMiddleware, async (req, res) => {
  if (!["admin", "manager"].includes(req.user.role)) {
    return res.status(403).json({ message: "Access denied" });
  }

  const { name, phone, password } = req.body;

  const admin = await Admin.findById(req.user.id);
  if (!admin) return res.status(404).json({ message: "User not found" });

  if (name) admin.name = name;
  if (phone) admin.phone = phone;

  if (password && password.length >= 4) {
    admin.password = await bcrypt.hash(password, 10);
  }

  await admin.save();

  res.json({ message: "Profile updated" });
});

/* GET PENDING ADMINS & MANAGERS (ADMIN ONLY) */
router.get(
  "/pending-admins",
  authMiddleware,
  roleOnly("admin"),
  async (req, res) => {
    try {
      const pending = await Admin.find({
        role: { $in: ["admin", "manager"] },
        approved: false
      }).select("name email role approved");

      res.json(pending);
    } catch (err) {
      res.status(500).json({ message: "Failed to load pending users" });
    }
  }
);

/* APPROVE ADMIN / MANAGER (ADMIN ONLY) */
router.put(
  "/approve-admin/:id",
  authMiddleware,
  roleOnly("admin"),
  async (req, res) => {
    try {
      if (req.user.id === req.params.id) {
        return res.status(403).json({ message: "You cannot approve yourself" });
      }

      const user = await Admin.findById(req.params.id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      user.approved = true;
      await user.save();

      res.json({ message: `${user.role} approved successfully` });
    } catch (err) {
      res.status(500).json({ message: "Approval failed" });
    }
  }
);

/* REJECT ADMIN / MANAGER (ADMIN ONLY) */
/* ================= DELETE ADMIN ================= */
router.delete(
  "/remove-admin/:id",
  authMiddleware,
  roleOnly("admin"),
  async (req, res) => {
    try {
      const admin = await Admin.findById(req.params.id);

      if (!admin) {
        return res.status(404).json({ message: "Admin not found" });
      }

      if (admin._id.toString() === req.user.id) {
        return res.status(400).json({ message: "Cannot delete yourself" });
      }

      await Admin.findByIdAndDelete(req.params.id);

      res.json({ message: "Admin removed" });
    } catch (err) {
      console.error("REMOVE ADMIN ERROR:", err);
      res.status(500).json({ message: "Remove failed" });
    }
  }
);

/* UPDATE PRODUCT STOCK (ADMIN + MANAGER) */
/* ================= UPDATE STOCK ================= */
router.put(
  "/update-product-name/:id",
  authMiddleware,
  roleOnly("admin", "manager"),
  async (req, res) => {
    try {
      const name = String(req.body.name || "").trim();

      if (!name) {
        return res.status(400).json({ message: "Product name is required" });
      }

      const product = await Product.findByIdAndUpdate(
        req.params.id,
        { name },
        { new: true }
      );

      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }

      res.json({ message: "Product name updated", name: product.name });
    } catch (err) {
      console.error("UPDATE PRODUCT NAME ERROR:", err);
      res.status(500).json({ message: "Failed to update product name" });
    }
  }
);

/* ================= UPDATE PRICE ================= */
router.put(
  "/update-price/:id",
  authMiddleware,
  roleOnly("admin", "manager"),
  async (req, res) => {
    try {
      const price = Number(req.body.price);

      if (Number.isNaN(price) || price < 0) {
        return res.status(400).json({ message: "Invalid price" });
      }

      const product = await Product.findByIdAndUpdate(
        req.params.id,
        { price },
        { new: true }
      );

      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }

      res.json({ message: "Price updated", price: product.price });
    } catch (err) {
      console.error("UPDATE PRICE ERROR:", err);
      res.status(500).json({ message: "Failed to update price" });
    }
  }
);

/* ================= UPDATE PRODUCT CATEGORY ================= */
/* ADMIN + MANAGER */
router.put(
  "/update-product-category/:id",
  authMiddleware,
  roleOnly("admin", "manager"),
  async (req, res) => {
    try {
      const { category } = req.body;

      if (!category) {
        return res.status(400).json({ message: "Category required" });
      }

      const product = await Product.findByIdAndUpdate(
        req.params.id,
        { category },
        { new: true }
      );

      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }

      res.json(product);
    } catch (err) {
      res.status(500).json({ message: "Failed to update category" });
    }
  }
);

/* ================= GET LOGGED IN ADMIN PROFILE ================= */
router.get(
  "/me",
  authMiddleware,
  async (req, res) => {
    try {
      const admin = await Admin.findById(req.user.id).select("-password");

      if (!admin) {
        return res.status(404).json({ message: "User not found" });
      }

      res.json(admin);
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Profile fetch failed" });
    }
  }
);

module.exports = router;

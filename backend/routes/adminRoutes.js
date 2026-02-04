const express = require("express");
const router = express.Router();

const Product = require("../models/Product");
const Vendor = require("../models/Vendor");
const Admin = require("../models/Admin");

const authMiddleware = require("../middleware/authMiddleware");
const roleOnly = require("../middleware/adminOnly");

/* =====================================================
   VENDORS
===================================================== */

/* GET ALL VENDORS (ADMIN ONLY) */
router.get(
  "/vendors",
  authMiddleware,
  roleOnly(["admin", "manager"]),
  async (req, res) => {
    const vendors = await Vendor.find();
    res.json(vendors);
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

      vendor.approved = true;
      await vendor.save();

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
   ADMIN / MANAGER APPROVALS
===================================================== */

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
router.delete(
  "/reject-admin/:id",
  authMiddleware,
  roleOnly("admin"),
  async (req, res) => {
    try {
      await Admin.findByIdAndDelete(req.params.id);
      res.json({ message: "User rejected and deleted" });
    } catch (err) {
      res.status(500).json({ message: "Rejection failed" });
    }
  }
);

/* UPDATE PRODUCT STOCK (ADMIN + MANAGER) */
/* ================= UPDATE STOCK ================= */
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
        { new: true } // 👈 IMPORTANT
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

/* ================= UPDATE PRICE ================= */
router.put(
  "/update-price/:id",
  authMiddleware,
  roleOnly("admin", "manager"),
  async (req, res) => {
    try {
      const rawPrice = req.body.price;
      const price = Number(rawPrice);

      if (Number.isNaN(price) || price < 0) {
        return res.status(400).json({ message: "Invalid price value" });
      }

      const product = await Product.findById(req.params.id);

      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }

      product.price = price;
      await product.save();

      res.json({ message: "Price updated", price });
    } catch (err) {
      console.error("UPDATE PRICE ERROR:", err);
      res.status(500).json({ message: "Failed to update price" });
    }
  }
);

/* DELETE PRODUCT */
router.delete(
  "/product/:id",
  authMiddleware,
  roleOnly("admin", "manager"),
  async (req, res) => {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    await product.deleteOne();
    res.json({ message: "Product deleted successfully" });
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

module.exports = router;
const express = require("express");
const router = express.Router();
const Category = require("../models/Category");
const authMiddleware = require("../middleware/authMiddleware");

/* ================= CREATE CATEGORY ================= */
/* ADMIN + MANAGER */
const roleOnly = require("../middleware/adminOnly");
router.post(
  "/",
  authMiddleware,
  roleOnly("admin", "manager"),
  async (req, res) => {
  try {
    if (!["admin", "manager"].includes(req.user.role)) {
      return res.status(403).json({ message: "Access denied" });
    }

    const { name } = req.body;
    if (!name) {
      return res.status(400).json({ message: "Category name required" });
    }

    const exists = await Category.findOne({ name });
    if (exists) {
      return res.status(400).json({ message: "Category already exists" });
    }

    const category = await Category.create({ name });
    res.status(201).json(category);
  } catch (err) {
    res.status(500).json({ message: "Failed to create category" });
  }
});

/* GET ALL CATEGORIES */
router.get("/", authMiddleware, async (req, res) => {
  try {
    const categories = await Category.find().sort({ name: 1 });
    res.json(categories);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch categories" });
  }
});

/* ================= UPDATE CATEGORY ================= */
/* ADMIN + MANAGER */
router.put(
  "/:id",
  authMiddleware,
  roleOnly("admin", "manager"),
  async (req, res) => {
    try {
      const { name } = req.body;

      if (!name || !name.trim()) {
        return res.status(400).json({ message: "Category name required" });
      }

      const updated = await Category.findByIdAndUpdate(
        req.params.id,
        { name },
        { new: true }
      );

      if (!updated) {
        return res.status(404).json({ message: "Category not found" });
      }

      res.json(updated);
    } catch (err) {
      res.status(500).json({ message: "Failed to update category" });
    }
  }
);

/* ================= DELETE CATEGORY ================= */
/* ADMIN + MANAGER */
router.delete(
  "/:id",
  authMiddleware,
  roleOnly("admin", "manager"),
  async (req, res) => {
  try {
    if (!["admin", "manager"].includes(req.user.role)) {
      return res.status(403).json({ message: "Access denied" });
    }

    await Category.findByIdAndDelete(req.params.id);
    res.json({ message: "Category deleted" });
  } catch (err) {
    res.status(500).json({ message: "Failed to delete category" });
  }
});



module.exports = router;
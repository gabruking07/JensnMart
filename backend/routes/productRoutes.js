const express = require("express");
const router = express.Router();

const Product = require("../models/Product");
const upload = require("../config/upload");
const authMiddleware = require("../middleware/authMiddleware");
const roleOnly = require("../middleware/adminOnly"); // adminOnly middleware

/* =====================================================
   ADD PRODUCT (ADMIN + MANAGER)
===================================================== */
router.post(
  "/",
  authMiddleware,
  roleOnly("admin", "manager"),
  upload.single("image"),
  async (req, res) => {
    try {
      const { name, price, stock, category, subcategory } = req.body;

      if (!category) {
        return res.status(400).json({ message: "Category required" });
      }

      const product = await Product.create({
        name,
        price,
        stock,
        image: req.file?.filename || null,
        category,
        subcategory: subcategory || null,
        vendor: null
      });

      const populated = await Product.findById(product._id)
        .populate("category", "name")
        .populate("subcategory", "name");

      res.json(populated);
    } catch (err) {
      console.error("CREATE PRODUCT ERROR:", err);
      res.status(500).json({ message: "Product creation failed" });
    }
  }
);

/* =====================================================
   GET ALL PRODUCTS
===================================================== */
router.get("/", async (req, res) => {
  try {
    const { category, subcategory } = req.query;

    const filter = {};

    if (category) filter.category = category;
    if (subcategory) filter.subcategory = subcategory;

    const products = await Product.find(filter)
      .populate("category", "name")
      .populate("subcategory", "name")   // ⭐ IMPORTANT
      .sort({ createdAt: -1 });

    res.json(products);
  } catch (err) {
    console.error("FETCH PRODUCTS ERROR:", err);
    res.status(500).json({ message: "Failed to fetch products" });
  }
});

/* =====================================================
   UPDATE PRODUCT
===================================================== */
router.put(
  "/:id",
  authMiddleware,
  roleOnly("admin", "manager"),
  upload.none(),
  async (req, res) => {
    try {
      const { price, stock, category, subcategory } = req.body;

      const update = {};

      if (price !== undefined) update.price = price;
      if (stock !== undefined) update.stock = stock;
      if (category !== undefined) update.category = category;
      if (subcategory !== undefined) update.subcategory = subcategory;

      const product = await Product.findByIdAndUpdate(
        req.params.id,
        update,
        { new: true }
      )
        .populate("category", "name")
        .populate("subcategory", "name");

      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }

      res.json(product);
    } catch (err) {
      console.error("UPDATE PRODUCT ERROR:", err);
      res.status(500).json({ message: "Product update failed" });
    }
  }
);

/* =====================================================
   DELETE PRODUCT
===================================================== */
router.delete(
  "/:id",
  authMiddleware,
  roleOnly("admin"),
  async (req, res) => {
    try {
      await Product.findByIdAndDelete(req.params.id);
      res.json({ message: "Product deleted" });
    } catch (err) {
      console.error("DELETE PRODUCT ERROR:", err);
      res.status(500).json({ message: "Delete failed" });
    }
  }
);

module.exports = router;
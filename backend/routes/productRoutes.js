const express = require("express");
const router = express.Router();

const Product = require("../models/Product");
const upload = require("../config/upload");
const authMiddleware = require("../middleware/authMiddleware");

/* =====================================================
   ADD PRODUCT (ADMIN ONLY)
===================================================== */
const roleOnly = require("../middleware/roleOnly");

router.post(
  "/",
  authMiddleware,
  roleOnly("admin", "manager"),
  upload.single("image"),
  async (req, res) => {
    try {
      const { name, price, stock, category } = req.body;

      if (!category) {
        return res.status(400).json({ message: "Category required" });
      }

      const product = await Product.create({
        name,
        price,
        stock,
        image: req.file.filename,
        category,
        vendor: null // main vendor (admin)
      });

      res.json(product);
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Product creation failed" });
    }
  }
);

/* =====================================================
   GET ALL PRODUCTS (PUBLIC)
===================================================== */
router.get("/", async (req, res) => {
  try {
    const { category } = req.query;

    const filter = {};
    if (category) {
      filter.category = category;
    }

    const products = await Product.find(filter)
      .populate("category", "name")
      .sort({ createdAt: -1 });

    res.json(products);
  } catch (err) {
    console.error("FETCH PRODUCTS ERROR:", err);
    res.status(500).json({ message: "Failed to fetch products" });
  }
});

/* =====================================================
   UPDATE PRODUCT (ADMIN + MANAGER)
===================================================== */
router.put(
  "/:id",
  authMiddleware,
  roleOnly("admin", "manager"),
  upload.none(), 
  async (req, res) => {
    try {
      const { price, stock, category } = req.body;

      const update = {};
      if (price !== undefined) update.price = price;
      if (stock !== undefined) update.stock = stock;
      if (category !== undefined) update.category = category;

      const product = await Product.findByIdAndUpdate(
        req.params.id,
        update,
        { new: true }
      ).populate("category", "name");

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

module.exports = router;
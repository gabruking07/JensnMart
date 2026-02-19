const express = require("express");
const router = express.Router();

const Product = require("../models/Product");
const Category = require("../models/Category");
const SubCategory = require("../models/SubCategory");
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

      if (!name || !price || !stock || !category) {
        return res.status(400).json({ message: "All fields required" });
      }

      if (!req.file) {
        return res.status(400).json({ message: "Product image required" });
      }

      const product = await Product.create({
        name,
        price,
        stock,
        image: req.file.filename,
        category,
        subcategory: subcategory || null,
        vendor: null
      });

      res.json(product);

    } catch (err) {
      console.error("CREATE PRODUCT ERROR:", err);
      res.status(500).json({ message: err.message });
    }
  }
);

/* =====================================================
   GET ALL PRODUCTS
===================================================== */
router.get("/", async (req, res) => {
  try {
    const { category, subcategory, sort } = req.query;

    const filter = {};

    if (category) filter.category = category;
    if (subcategory) filter.subcategory = subcategory;

    let query = Product.find(filter)
      .populate("category", "name")
      .populate("subcategory", "name");

    if (sort === "priceHigh") query = query.sort({ price: -1 });
    else if (sort === "priceLow") query = query.sort({ price: 1 });
    else if (sort === "new") query = query.sort({ createdAt: -1 });
    else if (sort === "bestsell") query = query.sort({ sold: -1 });
    else query = query.sort({ createdAt: -1 });

    const products = await query;
    res.set("Cache-Control", "no-store");
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
  async (req, res) => {
    try {
      const { name, price, stock, category, subcategory } = req.body;

      const product = await Product.findById(req.params.id);

      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }

      if (name !== undefined) {
        const trimmedName = String(name).trim();
        if (!trimmedName) {
          return res.status(400).json({ message: "Product name is required" });
        }
        product.name = trimmedName;
      }
      if (price !== undefined) product.price = price;
      if (stock !== undefined) product.stock = stock;

      if (category !== undefined) {
        const categoryExists = await Category.findById(category);
        if (!categoryExists) {
          return res.status(400).json({ message: "Invalid category" });
        }
        product.category = category;
      }

      if (subcategory !== undefined) {
        if (!subcategory) {
          product.subcategory = null;
        } else {
          const subcategoryDoc = await SubCategory.findById(subcategory);
          if (!subcategoryDoc) {
            return res.status(400).json({ message: "Invalid subcategory" });
          }

          const targetCategoryId = String(
            category !== undefined ? category : product.category
          );
          if (String(subcategoryDoc.category) !== targetCategoryId) {
            return res.status(400).json({
              message: "Subcategory does not belong to selected category",
            });
          }

          product.subcategory = subcategory;
        }
      } else if (category !== undefined && product.subcategory) {
        const existingSub = await SubCategory.findById(product.subcategory);
        if (!existingSub || String(existingSub.category) !== String(product.category)) {
          product.subcategory = null;
        }
      }

      console.log("UPDATE PRODUCT BODY:", req.body);
      console.log("UPDATE PRODUCT BEFORE SAVE:", { id: product._id.toString(), name: product.name });

      await product.save();
      await product.populate("category", "name");
      await product.populate("subcategory", "name");

      console.log("UPDATE PRODUCT AFTER SAVE:", { id: product._id.toString(), name: product.name });

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

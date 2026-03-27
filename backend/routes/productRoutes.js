const express = require("express");
const router = express.Router();
const path = require("path");
const multer = require("multer");
const XLSX = require("xlsx");

const Product = require("../models/Product");
const Category = require("../models/Category");
const SubCategory = require("../models/SubCategory");
const RestockSubscription = require("../models/RestockSubscription");
const Notification = require("../models/Notification");
const Vendor = require("../models/Vendor");
const upload = require("../config/upload");
const authMiddleware = require("../middleware/authMiddleware");
const roleOnly = require("../middleware/adminOnly"); // adminOnly middleware
const { sendNotificationEmail } = require("../utils/mailer");
const IMPORT_PLACEHOLDER_IMAGE = "products/product-placeholder.svg";

const importUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowedExtensions = [".csv", ".xlsx", ".xls"];
    const extension = path.extname(file.originalname || "").toLowerCase();

    if (allowedExtensions.includes(extension)) {
      cb(null, true);
      return;
    }

    cb(new Error("Only CSV or Excel files are allowed"));
  },
});

const getProductImageUrl = (imageName) => {
  if (!imageName) return "";
  const baseUrl = process.env.PUBLIC_BACKEND_URL || "http://localhost:5000";
  return `${baseUrl.replace(/\/$/, "")}/uploads/${imageName}`;
};

const getProductImagePath = (imageName) => {
  if (!imageName) return "";
  return path.join(__dirname, "..", "uploads", imageName);
};

const notifyRestockSubscribers = async (product) => {
  const subscriptions = await RestockSubscription.find({
    product: product._id,
    status: "pending",
  }).populate("vendor", "name email");

  if (!subscriptions.length) return;

  const fulfilledAt = new Date();

  await Promise.all(
    subscriptions.map(async (subscription) => {
      const vendor = subscription.vendor;
      if (!vendor?._id) return;

      const title = `${product.name} is back in stock`;
      const message = `The product you asked about, ${product.name}, has been restocked on JensnMart and is now available to order.`;
      const productImageUrl = getProductImageUrl(product.image);
      const productImagePath = getProductImagePath(product.image);
      const productDetails = [
        { label: "Product", value: product.name },
        { label: "Price", value: `₹ ${Number(product.price || 0).toLocaleString("en-IN")}` },
        { label: "Stock available", value: String(product.stock || 0) },
        { label: "Category", value: product.category?.name || "Uncategorized" },
        { label: "Subcategory", value: product.subcategory?.name || "None" },
      ];

      await Notification.create({
        recipientModel: "Vendor",
        recipient: vendor._id,
        type: "system",
        title,
        message,
        meta: {
          productId: product._id,
          vendorId: vendor._id,
          productImage: product.image,
          productName: product.name,
          status: "restocked",
        },
      });

      if (vendor.email) {
        try {
          await sendNotificationEmail({
            to: vendor.email,
            subject: `JensnMart: ${title}`,
            title,
            message,
            imageUrl: productImageUrl,
            imageAlt: product.name,
            imagePath: productImagePath,
            details: productDetails,
          });
        } catch (err) {
          console.error("RESTOCK EMAIL ERROR:", err.message);
        }
      }
    })
  );

  await RestockSubscription.updateMany(
    { product: product._id, status: "pending" },
    { $set: { status: "fulfilled", fulfilledAt } }
  );
};

const normalizeValue = (value) =>
  String(value ?? "")
    .trim()
    .toLowerCase();

const getRowValue = (row, candidateKeys) => {
  const entries = Object.entries(row || {});
  for (const [key, value] of entries) {
    const normalizedKey = normalizeValue(key).replace(/[\s_-]+/g, "");
    if (candidateKeys.includes(normalizedKey)) {
      return value;
    }
  }
  return "";
};

const parseImportRows = (buffer, filename = "") => {
  const workbook = XLSX.read(buffer, { type: "buffer" });
  const firstSheetName = workbook.SheetNames[0];
  if (!firstSheetName) return [];

  const worksheet = workbook.Sheets[firstSheetName];
  return XLSX.utils.sheet_to_json(worksheet, {
    defval: "",
    raw: false,
  });
};

const buildCategoryLookup = (categories = []) => {
  const map = new Map();
  categories.forEach((category) => {
    map.set(String(category._id), category);
    map.set(normalizeValue(category.name), category);
  });
  return map;
};

const buildSubcategoryLookup = (subcategories = []) => {
  const map = new Map();
  subcategories.forEach((subcategory) => {
    map.set(String(subcategory._id), subcategory);
    map.set(
      `${normalizeValue(subcategory.name)}::${String(subcategory.category)}`,
      subcategory
    );
  });
  return map;
};

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
        image: `products/${req.file.filename}`,
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
   IMPORT PRODUCTS (CSV / EXCEL)
===================================================== */
router.post(
  "/import",
  authMiddleware,
  roleOnly("admin", "manager"),
  importUpload.single("file"),
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "Import file is required" });
      }

      const rows = parseImportRows(req.file.buffer, req.file.originalname);
      if (!rows.length) {
        return res.status(400).json({ message: "No rows found in the uploaded file" });
      }

      const categories = await Category.find({});
      const subcategories = await SubCategory.find({});
      const categoryLookup = buildCategoryLookup(categories);
      const subcategoryLookup = buildSubcategoryLookup(subcategories);
      const errors = [];
      const documents = [];

      rows.forEach((row, index) => {
        const excelRowNumber = index + 2;
        const name = String(
          getRowValue(row, ["name", "productname", "product", "title"])
        ).trim();
        const priceValue = getRowValue(row, ["price", "amount", "mrp"]);
        const stockValue = getRowValue(row, ["stock", "quantity", "qty", "inventory"]);
        const categoryValue = String(
          getRowValue(row, ["category", "categoryid", "categoryname"])
        ).trim();
        const subcategoryValue = String(
          getRowValue(row, ["subcategory", "subcategoryid", "subcategoryname"])
        ).trim();
        const imageValue = String(
          getRowValue(row, ["image", "imagename", "imagefile", "filename"])
        ).trim();

        // Skip completely empty rows.
        if (![name, priceValue, stockValue, categoryValue, subcategoryValue, imageValue].some(Boolean)) {
          return;
        }

        if (!name || priceValue === "" || stockValue === "" || !categoryValue) {
          errors.push(`Row ${excelRowNumber}: name, price, stock, and category are required.`);
          return;
        }

        const price = Number(priceValue);
        const stock = Number(stockValue);
        if (Number.isNaN(price) || price < 0) {
          errors.push(`Row ${excelRowNumber}: price must be a valid non-negative number.`);
          return;
        }

        if (!Number.isInteger(stock) || stock < 0) {
          errors.push(`Row ${excelRowNumber}: stock must be a valid whole number.`);
          return;
        }

        const categoryDoc =
          categoryLookup.get(categoryValue) || categoryLookup.get(normalizeValue(categoryValue));

        if (!categoryDoc) {
          errors.push(`Row ${excelRowNumber}: category "${categoryValue}" was not found.`);
          return;
        }

        let subcategoryId = null;
        if (subcategoryValue) {
          const byId = subcategoryLookup.get(subcategoryValue);
          const byNameAndCategory = subcategoryLookup.get(
            `${normalizeValue(subcategoryValue)}::${String(categoryDoc._id)}`
          );
          const subcategoryDoc = byId || byNameAndCategory;

          if (!subcategoryDoc) {
            errors.push(
              `Row ${excelRowNumber}: subcategory "${subcategoryValue}" was not found under "${categoryDoc.name}".`
            );
            return;
          }

          subcategoryId = subcategoryDoc._id;
        }

        documents.push({
          name,
          price,
          stock,
          category: categoryDoc._id,
          subcategory: subcategoryId,
          image: imageValue || IMPORT_PLACEHOLDER_IMAGE,
          vendor: null,
        });
      });

      if (!documents.length) {
        return res.status(400).json({
          message: errors[0] || "No valid product rows found",
          errors,
        });
      }

      const inserted = await Product.insertMany(documents);
      return res.json({
        message: `Imported ${inserted.length} products successfully`,
        importedCount: inserted.length,
        skippedCount: errors.length,
        errors,
      });
    } catch (err) {
      console.error("IMPORT PRODUCTS ERROR:", err);
      res.status(500).json({ message: err.message || "Import failed" });
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
  upload.single("image"),
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
      const previousStock = Number(product.stock || 0);
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

      if (req.file) {
        product.image = `products/${req.file.filename}`;
      }

      console.log("UPDATE PRODUCT BODY:", req.body);
      console.log("UPDATE PRODUCT BEFORE SAVE:", { id: product._id.toString(), name: product.name });

      await product.save();
      await product.populate("category", "name");
      await product.populate("subcategory", "name");

      const currentStock = Number(product.stock || 0);
      if (previousStock === 0 && currentStock > 0) {
        await notifyRestockSubscribers(product);
      }

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

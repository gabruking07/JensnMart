<<<<<<< HEAD
/** Express API endpoints for product routes; handlers connect HTTP requests to authorization, database operations, and JSON responses. */

=======
>>>>>>> 01538e8b0c137147cf885390b770f7b7e80d10f5
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

<<<<<<< HEAD
/** Builds a public URL for a product image so email and browser views can display it. */
=======
>>>>>>> 01538e8b0c137147cf885390b770f7b7e80d10f5
const getProductImageUrl = (imageName) => {
  if (!imageName) return "";
  const vercelHost = process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "";
  const baseUrl = process.env.PUBLIC_BACKEND_URL || vercelHost || "http://localhost:5000";
  return `${baseUrl.replace(/\/$/, "")}/uploads/${imageName}`;
};

<<<<<<< HEAD
/** Finds the uploaded image on disk so server-side email attachments can read it. */
=======
>>>>>>> 01538e8b0c137147cf885390b770f7b7e80d10f5
const getProductImagePath = (imageName) => {
  if (!imageName) return "";
  return path.join(__dirname, "..", "uploads", imageName);
};

<<<<<<< HEAD
/** Notifies vendors waiting on an out-of-stock product, then marks their requests fulfilled. */
=======
>>>>>>> 01538e8b0c137147cf885390b770f7b7e80d10f5
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

<<<<<<< HEAD
/** Converts value into a consistent value for the rest of the module. */
=======
>>>>>>> 01538e8b0c137147cf885390b770f7b7e80d10f5
const normalizeValue = (value) =>
  String(value ?? "")
    .trim()
    .toLowerCase();

<<<<<<< HEAD
/** Finds a spreadsheet cell by any accepted column heading, allowing imports with different header names. */
=======
>>>>>>> 01538e8b0c137147cf885390b770f7b7e80d10f5
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

<<<<<<< HEAD
/** Reads the first worksheet from an uploaded CSV or Excel file and returns its rows as objects. */
=======
>>>>>>> 01538e8b0c137147cf885390b770f7b7e80d10f5
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

<<<<<<< HEAD
/** Indexes categories by both database ID and normalized name for fast spreadsheet import matching. */
=======
>>>>>>> 01538e8b0c137147cf885390b770f7b7e80d10f5
const buildCategoryLookup = (categories = []) => {
  const map = new Map();
  categories.forEach((category) => {
    map.set(String(category._id), category);
    map.set(normalizeValue(category.name), category);
  });
  return map;
};

<<<<<<< HEAD
/** Indexes subcategories by ID and by normalized name plus category to avoid duplicate imports. */
=======
>>>>>>> 01538e8b0c137147cf885390b770f7b7e80d10f5
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

<<<<<<< HEAD
/** Reuses a matching category or creates it when importing a product that names a new category. */
=======
>>>>>>> 01538e8b0c137147cf885390b770f7b7e80d10f5
const ensureCategoryDocument = async (categoryValue, categoryLookup) => {
  const directMatch =
    categoryLookup.get(categoryValue) || categoryLookup.get(normalizeValue(categoryValue));
  if (directMatch) return { categoryDoc: directMatch, created: false };

  const categoryDoc = await Category.create({ name: categoryValue });
  categoryLookup.set(String(categoryDoc._id), categoryDoc);
  categoryLookup.set(normalizeValue(categoryDoc.name), categoryDoc);
  return { categoryDoc, created: true };
};

<<<<<<< HEAD
/** Reuses or creates a subcategory under the selected category during product import. */
=======
>>>>>>> 01538e8b0c137147cf885390b770f7b7e80d10f5
const ensureSubcategoryDocument = async (
  subcategoryValue,
  categoryDoc,
  subcategoryLookup
) => {
  const byId = subcategoryLookup.get(subcategoryValue);
  const byNameAndCategory = subcategoryLookup.get(
    `${normalizeValue(subcategoryValue)}::${String(categoryDoc._id)}`
  );
  const existingSubcategory = byId || byNameAndCategory;
  if (existingSubcategory) {
    return { subcategoryDoc: existingSubcategory, created: false };
  }

  const subcategoryDoc = await SubCategory.create({
    name: subcategoryValue,
    category: categoryDoc._id,
  });
  subcategoryLookup.set(String(subcategoryDoc._id), subcategoryDoc);
  subcategoryLookup.set(
    `${normalizeValue(subcategoryDoc.name)}::${String(categoryDoc._id)}`,
    subcategoryDoc
  );

  return { subcategoryDoc, created: true };
};

/* =====================================================
   ADD PRODUCT (ADMIN + MANAGER)
===================================================== */
<<<<<<< HEAD
// POST /: Creates a product and saves its uploaded image and category references.
=======
>>>>>>> 01538e8b0c137147cf885390b770f7b7e80d10f5
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
<<<<<<< HEAD
// POST /import: Imports product records from an uploaded CSV or Excel spreadsheet.
=======
>>>>>>> 01538e8b0c137147cf885390b770f7b7e80d10f5
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
      const createdCategories = new Set();
      const createdSubcategories = new Set();

      for (const [index, row] of rows.entries()) {
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
          continue;
        }

        if (!name || priceValue === "" || stockValue === "" || !categoryValue) {
          errors.push(`Row ${excelRowNumber}: name, price, stock, and category are required.`);
          continue;
        }

        const price = Number(priceValue);
        const stock = Number(stockValue);
        if (Number.isNaN(price) || price < 0) {
          errors.push(`Row ${excelRowNumber}: price must be a valid non-negative number.`);
          continue;
        }

        if (!Number.isInteger(stock) || stock < 0) {
          errors.push(`Row ${excelRowNumber}: stock must be a valid whole number.`);
          continue;
        }

        const { categoryDoc, created: categoryCreated } = await ensureCategoryDocument(
          categoryValue,
          categoryLookup
        );
        if (categoryCreated) {
          createdCategories.add(String(categoryDoc._id));
        }

        let subcategoryId = null;
        if (subcategoryValue) {
          const {
            subcategoryDoc,
            created: subcategoryCreated,
          } = await ensureSubcategoryDocument(
            subcategoryValue,
            categoryDoc,
            subcategoryLookup
          );
          if (subcategoryCreated) {
            createdSubcategories.add(String(subcategoryDoc._id));
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
      }

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
        createdCategoryCount: createdCategories.size,
        createdSubcategoryCount: createdSubcategories.size,
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
<<<<<<< HEAD
// GET /: Lists products and applies the catalog search and filter options.
=======
>>>>>>> 01538e8b0c137147cf885390b770f7b7e80d10f5
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
<<<<<<< HEAD
// PUT /:id: Updates the selected product fields and optional uploaded image.
=======
>>>>>>> 01538e8b0c137147cf885390b770f7b7e80d10f5
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
<<<<<<< HEAD
// DELETE /:id: Deletes the selected product from the catalog.
=======
>>>>>>> 01538e8b0c137147cf885390b770f7b7e80d10f5
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

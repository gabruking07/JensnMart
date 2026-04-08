const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, ".env") });

const adminAuthRoutes = require("./routes/adminAuth");
const adminRoutes = require("./routes/adminRoutes");
const productRoutes = require("./routes/productRoutes");
const orderRoutes = require("./routes/orderRoutes");
const vendorRoutes = require("./routes/vendorRoutes");
const cartRoutes = require("./routes/cartRoutes");
const categoryRoutes = require("./routes/categoryRoutes");
const subCategoryRoutes = require("./routes/subcategoryRoutes");
const paymentRoutes = require("./routes/paymentRoutes");
const notificationRoutes = require("./routes/notificationRoutes");
const aiRoutes = require("./routes/aiRoutes");
const contactRoutes = require("./routes/contactRoutes");
const app = express();

/* ================= MIDDLEWARE ================= */
app.use(cors());
app.use(express.json());

/* ================= STATIC ================= */
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

/* ================= AUTH ROUTES ================= */
app.use("/api/admin", adminAuthRoutes);

/* ================= FEATURE ROUTES ================= */
app.use("/api/admin", adminRoutes);
app.use("/api/vendor", vendorRoutes);
app.use("/api/products", productRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/subcategories", subCategoryRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/ai", aiRoutes);
app.use("/api/contact", contactRoutes);

/* ================= DB ================= */
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB Connected"))
  .catch(err => console.error("Mongo error:", err));

/* ================= SERVER ================= */
app.listen(5000, () => {
  console.log("Server running on port 5000");
});

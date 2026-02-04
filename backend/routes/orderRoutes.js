const express = require("express");
const router = express.Router();

const Product = require("../models/Product");
const Order = require("../models/Order");
const Vendor = require("../models/Vendor");
const Cart = require("../models/Cart");

const authMiddleware = require("../middleware/authMiddleware");
const approvedVendorOnly = require("../middleware/approveVendorOnly");
const roleOnly = require("../middleware/adminOnly");

/* =====================================================
   PLACE ORDER (VENDOR ONLY)
   POST /api/orders/buy/:productId
===================================================== */
router.post("/buy/:productId", authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== "vendor") {
      return res.status(403).json({ message: "Only vendors can buy products" });
    }

    const { qty } = req.body;
    const { productId } = req.params;

    if (!qty || qty <= 0) {
      return res.status(400).json({ message: "Invalid quantity" });
    }

    const vendor = await Vendor.findById(req.user.id);
    if (!vendor) {
      return res.status(404).json({ message: "Vendor not found" });
    }

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    if (product.stock < qty) {
      return res.status(400).json({ message: "Insufficient stock" });
    }

    product.stock -= qty;
    await product.save();

    const total = product.price * qty;
    const adminCommission = total * 0.1;
    const vendorEarning = total - adminCommission;

    const order = await Order.create({
      vendor: vendor._id,
      products: [
        {
          productId: product._id,
          name: product.name,
          price: product.price,
          qty
        }
      ],
      total,
      adminCommission,
      vendorEarning,
      status: "Placed"
    });

    res.json({ message: "Order placed successfully", order });
  } catch (err) {
    console.error("BUY ERROR:", err);
    res.status(500).json({ message: "Server error" });
  }
});

/* =====================================================
   GET VENDOR ORDERS (VENDOR ONLY)
===================================================== */
router.get("/vendor/orders", authMiddleware, async (req, res) => {
  if (req.user.role !== "vendor") {
    return res.status(403).json({ message: "Access denied" });
  }

  const orders = await Order.find({ vendor: req.user.id });
  res.json(orders);
});

/* =====================================================
   CHECKOUT CART (VENDOR ONLY)
===================================================== */
router.post(
  "/checkout",
  authMiddleware,
  approvedVendorOnly,
  async (req, res) => {
    try {
      const cart = await Cart.findOne({
        vendor: req.user.id,
        status: "active"
      }).populate("items.product");

      if (!cart || cart.items.length === 0) {
        return res.status(400).json({ message: "Cart is empty" });
      }

      let total = 0;
      const products = [];

      for (const item of cart.items) {
        const product = item.product;

        if (product.stock < item.quantity) {
          return res.status(400).json({
            message: `Insufficient stock for ${product.name}`
          });
        }

        product.stock -= item.quantity;
        await product.save();

        total += product.price * item.quantity;

        products.push({
          productId: product._id,
          name: product.name,
          price: product.price,
          qty: item.quantity,
          image: product.image
        });
      }

      const adminCommission = total * 0.1;
      const vendorEarning = total - adminCommission;

      const order = await Order.create({
        vendor: req.user.id,
        products,
        total,
        adminCommission,
        vendorEarning,
        status: "Placed"
      });

      cart.status = "ordered";
      await cart.save();

      res.json({ message: "Order placed successfully", order });
    } catch (err) {
      console.error("CHECKOUT ERROR:", err);
      res.status(500).json({ message: "Checkout failed" });
    }
  }
);

/* =====================================================
   GET ALL ORDERS (ADMIN + MANAGER)
   GET /api/orders/admin
===================================================== */
router.get("/admin", authMiddleware, async (req, res) => {
  if (!["admin", "manager"].includes(req.user.role)) {
    return res.status(403).json({ message: "Access denied" });
  }

  const orders = await Order.find()
    .populate("vendor", "name email")
    .sort({ createdAt: -1 });

  res.json(orders);
});

/* =====================================================
   UPDATE ORDER STATUS (ADMIN + MANAGER)
===================================================== */
router.put("/status/:id", authMiddleware, async (req, res) => {
  if (!["admin", "manager"].includes(req.user.role)) {
    return res.status(403).json({ message: "Access denied" });
  }

  const { status } = req.body;

  if (!["Placed", "Completed", "Cancelled"].includes(status)) {
    return res.status(400).json({ message: "Invalid status" });
  }

  const order = await Order.findByIdAndUpdate(
    req.params.id,
    { status },
    { new: true }
  );

  if (!order) {
    return res.status(404).json({ message: "Order not found" });
  }

  res.json(order);
});

/* =====================================================
   ADMIN COMMISSION (ADMIN ONLY)
===================================================== */
router.get("/commission", authMiddleware, roleOnly("admin"), async (req, res) => {
  const orders = await Order.find();
  const total = orders.reduce((sum, o) => sum + o.adminCommission, 0);
  res.json({ total });
});

module.exports = router;
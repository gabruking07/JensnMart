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
   STATUS CONSTANTS
===================================================== */
const ORDER_STATUSES = [
  "Placed",
  "Processing",
  "Shipped",
  "Delivered",
  "Returned",
  "Completed",
  "Cancelled",
];

/* =====================================================
   SAFE ORDER NUMBER GENERATOR
===================================================== */
const generateOrderNumber = async () => {
  const lastOrder = await Order.findOne({
    orderNumber: { $exists: true }
  }).sort({ orderNumber: -1 });

  if (!lastOrder || typeof lastOrder.orderNumber !== "number") {
    return 1;
  }

  return lastOrder.orderNumber + 1;
};

/* =====================================================
   CHECKOUT CART
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

      const newNumber = await generateOrderNumber();

      let total = 0;
      const products = [];

      for (const item of cart.items) {
        const product = item.product;
        if (!product) continue;

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

      if (products.length === 0) {
        return res.status(400).json({ message: "Invalid cart items" });
      }

      const adminCommission = total * 0.1;

      const order = await Order.create({
        orderNumber: newNumber,
        vendor: req.user.id,
        products,
        total,
        adminCommission,
        status: "Processing",
        statusHistory: [
          { status: "Processing", updatedAt: new Date() }
        ]
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
   GET VENDOR ORDERS
===================================================== */
router.get("/vendor/orders", authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== "vendor") {
      return res.status(403).json({ message: "Access denied" });
    }

    const orders = await Order.find({ vendor: req.user.id })
      .sort({ createdAt: -1 });

    res.json(orders);

  } catch (err) {
    console.error("VENDOR ORDERS ERROR:", err);
    res.status(500).json({ message: "Failed to fetch orders" });
  }
});

/* =====================================================
   GET ALL ORDERS (ADMIN + MANAGER)
===================================================== */
router.get("/admin", authMiddleware, async (req, res) => {
  try {
    if (!["admin", "manager"].includes(req.user.role)) {
      return res.status(403).json({ message: "Access denied" });
    }

    const orders = await Order.find()
      .populate("vendor", "name email")
      .sort({ createdAt: -1 });

    res.json(orders);

  } catch (err) {
    console.error("ADMIN FETCH ERROR:", err);
    res.status(500).json({ message: "Failed to fetch orders" });
  }
});

/* =====================================================
   UPDATE ORDER STATUS
===================================================== */
router.put("/status/:id", authMiddleware, async (req, res) => {
  try {
    if (!["admin", "manager"].includes(req.user.role)) {
      return res.status(403).json({ message: "Access denied" });
    }

    const { status } = req.body;

    if (!ORDER_STATUSES.includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }

    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    if (status === "Returned" && order.status !== "Returned") {
      for (const item of order.products) {
        const product = await Product.findById(item.productId);
        if (product) {
          product.stock += item.qty;
          await product.save();
        }
      }
    }

    if (order.status !== status) {
      order.status = status;
      order.statusHistory.push({
        status,
        updatedAt: new Date(),
      });
    }

    await order.save();

    res.json(order);

  } catch (err) {
    console.error("STATUS UPDATE ERROR:", err);
    res.status(500).json({ message: "Status update failed" });
  }
});

/* =====================================================
   ADMIN COMMISSION
===================================================== */
router.get(
  "/commission",
  authMiddleware,
  roleOnly("admin"),
  async (req, res) => {
    try {
      const orders = await Order.find();
      const total = orders.reduce(
        (sum, o) => sum + o.adminCommission,
        0
      );

      res.json({ total });

    } catch (err) {
      console.error("COMMISSION ERROR:", err);
      res.status(500).json({ message: "Failed to calculate commission" });
    }
  }
);

module.exports = router;

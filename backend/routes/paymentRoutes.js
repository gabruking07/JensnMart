const express = require("express");
const router = express.Router();
const Razorpay = require("razorpay");
const crypto = require("crypto");

const Payment = require("../models/Payment");
const Order = require("../models/Order");
const Product = require("../models/Product");
const Cart = require("../models/Cart");
const authMiddleware = require("../middleware/authMiddleware");
const roleOnly = require("../middleware/adminOnly");

const RAZORPAY_KEY_ID = (process.env.RAZORPAY_KEY_ID || "").trim();
const RAZORPAY_SECRET = ((process.env.RAZORPAY_SECRET || process.env.RAZORPAY_KEY_SECRET) || "").trim();

const razorpay = new Razorpay({
  key_id: RAZORPAY_KEY_ID,
  key_secret: RAZORPAY_SECRET,
});

/* ================= ADMIN VIEW PAYMENTS ================= */
router.get("/", authMiddleware, roleOnly("admin"), async (req, res) => {
  const payments = await Payment.find()
    .populate("order")
    .populate("vendor", "email");

  res.json(payments);
});

/* ================= VENDOR VIEW OWN TRANSACTIONS ================= */
router.get("/vendor", authMiddleware, async (req, res) => {
  if (req.user.role !== "vendor") {
    return res.status(403).json({ message: "Access denied" });
  }

  const payments = await Payment.find({ vendor: req.user.id })
    .populate("order", "orderNumber total status createdAt")
    .sort({ createdAt: -1 });

  res.json(payments);
});


/* ================= CREATE RAZORPAY ORDER ================= */
router.post("/create-order", authMiddleware, async (req, res) => {
  try {
    const { amount, orderId } = req.body;

    const options = {
      amount: amount * 100,
      currency: "INR",
      receipt: `receipt_${orderId}`,
    };

    const razorpayOrder = await razorpay.orders.create(options);

    res.json(razorpayOrder);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Payment order creation failed" });
  }
});


/* ================= VERIFY PAYMENT ================= */
router.post("/verify", authMiddleware, async (req, res) => {
  const {
    razorpay_order_id,
    razorpay_payment_id,
    razorpay_signature,
    orderId,
    amount,
  } = req.body;

  const generated_signature = crypto
    .createHmac("sha256", RAZORPAY_SECRET)
    .update(razorpay_order_id + "|" + razorpay_payment_id)
    .digest("hex");

  if (generated_signature !== razorpay_signature) {
    return res.status(400).json({ message: "Payment verification failed" });
  }

  const order = await Order.findById(orderId);
  if (!order) {
    return res.status(404).json({ message: "Order not found" });
  }

  if (order.status !== "PendingPayment") {
    return res.status(400).json({ message: "Order is not awaiting payment" });
  }

  for (const item of order.products) {
    const product = await Product.findById(item.productId);
    if (!product || product.stock < item.qty) {
      return res.status(400).json({
        message: `Stock unavailable for ${item.name || "a product"}. Payment captured but order could not be fulfilled.`
      });
    }
  }

  for (const item of order.products) {
    const product = await Product.findById(item.productId);
    product.stock -= item.qty;
    await product.save();
  }

  const payment = await Payment.findOneAndUpdate(
    { order: orderId },
    {
      status: "Paid",
      method: "UPI",
      transactionId: razorpay_payment_id,
      razorpayOrderId: razorpay_order_id,
      razorpayPaymentId: razorpay_payment_id,
      razorpaySignature: razorpay_signature
    },
    { new: true }
  );

  if (!payment) {
    return res.status(404).json({ message: "Payment record not found" });
  }

  await Order.findByIdAndUpdate(orderId, {
    status: "Placed",
    $push: { statusHistory: { status: "Placed" } }
  });

  const cart = await Cart.findOne({ vendor: req.user.id, status: "active" });
  if (cart) {
    cart.status = "ordered";
    await cart.save();
  }

  res.json({ message: "Payment successful", payment });
});


/* ================= ADMIN UPDATE PAYMENT ================= */
router.put("/:id", authMiddleware, roleOnly("admin"), async (req, res) => {
  const { status } = req.body;

  const payment = await Payment.findByIdAndUpdate(
    req.params.id,
    { status },
    { new: true }
  );

  res.json({ message: "Payment updated", payment });
});

module.exports = router;

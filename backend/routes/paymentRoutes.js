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
const { notifyVendor, notifyAdmins } = require("../utils/notificationService");

const RAZORPAY_KEY_ID = (process.env.RAZORPAY_KEY_ID || "").trim();
const RAZORPAY_SECRET = ((process.env.RAZORPAY_SECRET || process.env.RAZORPAY_KEY_SECRET) || "").trim();

const razorpay = new Razorpay({
  key_id: RAZORPAY_KEY_ID,
  key_secret: RAZORPAY_SECRET,
});

/* ================= ADMIN VIEW PAYMENTS ================= */
router.get("/", authMiddleware, roleOnly("admin"), async (req, res) => {
  const payments = await Payment.find()
    .sort({ createdAt: -1 })
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
    if (req.user.role !== "vendor") {
      return res.status(403).json({ message: "Access denied" });
    }

    const { orderId } = req.body;
    if (!orderId) {
      return res.status(400).json({ message: "Order is required" });
    }

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    if (String(order.vendor) !== String(req.user.id)) {
      return res.status(403).json({ message: "You cannot create payment for this order" });
    }

    if (order.status !== "PendingPayment") {
      return res.status(400).json({ message: "Order is not awaiting payment" });
    }

    const payment = await Payment.findOne({ order: orderId, vendor: req.user.id });
    if (!payment) {
      return res.status(404).json({ message: "Payment record not found" });
    }

    if (payment.status === "Paid") {
      return res.status(400).json({ message: "Order is already paid" });
    }

    const options = {
      amount: Math.round(Number(payment.amount || order.total || 0) * 100),
      currency: "INR",
      receipt: `receipt_${orderId}`,
    };

    const razorpayOrder = await razorpay.orders.create(options);
    await Payment.findByIdAndUpdate(payment._id, {
      razorpayOrderId: razorpayOrder.id,
      method: "UPI",
    });

    res.json(razorpayOrder);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Payment order creation failed" });
  }
});


/* ================= VERIFY PAYMENT ================= */
router.post("/verify", authMiddleware, async (req, res) => {
  if (req.user.role !== "vendor") {
    return res.status(403).json({ message: "Access denied" });
  }

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

  if (String(order.vendor) !== String(req.user.id)) {
    return res.status(403).json({ message: "You cannot verify payment for this order" });
  }

  if (order.status !== "PendingPayment") {
    return res.status(400).json({ message: "Order is not awaiting payment" });
  }

  const existingPayment = await Payment.findOne({ order: orderId, vendor: req.user.id });
  if (!existingPayment) {
    return res.status(404).json({ message: "Payment record not found" });
  }

  if (
    existingPayment.razorpayOrderId &&
    existingPayment.razorpayOrderId !== razorpay_order_id
  ) {
    return res.status(400).json({ message: "Payment order mismatch" });
  }

  if (existingPayment.status === "Paid") {
    return res.status(400).json({ message: "Payment already verified" });
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
    { order: orderId, vendor: req.user.id },
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

  await notifyVendor({
    vendorId: req.user.id,
    type: "payment",
    title: `Payment received for Order #${order.orderNumber}`,
    message: `Your online payment of Rs ${amount} is successful.`,
    meta: {
      orderId: order._id,
      paymentId: payment._id,
      orderNumber: order.orderNumber,
      status: "Paid",
    },
    sendEmail: true,
  });

  await notifyAdmins({
    type: "payment",
    title: "Online payment received",
    message: `Order #${order.orderNumber} was paid online (Rs ${amount}).`,
    meta: {
      orderId: order._id,
      paymentId: payment._id,
      orderNumber: order.orderNumber,
      status: "Paid",
    },
    sendEmail: true,
  });

  res.json({ message: "Payment successful", payment });
});


/* ================= ADMIN UPDATE PAYMENT ================= */
router.put("/:id", authMiddleware, roleOnly("admin"), async (req, res) => {
  const { status } = req.body;
  const allowedStatuses = ["Pending", "Paid", "Failed"];

  if (!allowedStatuses.includes(status)) {
    return res.status(400).json({ message: "Invalid payment status" });
  }

  const payment = await Payment.findById(req.params.id).populate("order");
  if (!payment) {
    return res.status(404).json({ message: "Payment not found" });
  }

  const order = payment.order;
  payment.status = status;
  await payment.save();

  const isOnlinePayment = payment.method === "UPI" || Boolean(payment.razorpayOrderId);
  if (order && isOnlinePayment) {
    if (status === "Paid" && order.status === "PendingPayment") {
      order.status = "Placed";
      order.statusHistory.push({ status: "Placed" });
      await order.save();
    }

    if (
      (status === "Pending" || status === "Failed") &&
      order.status === "Placed" &&
      !order.statusHistory.some((entry) => entry.status === "Processing" || entry.status === "Shipped")
    ) {
      order.status = "PendingPayment";
      order.statusHistory.push({ status: "PendingPayment" });
      await order.save();
    }
  }

  await notifyVendor({
    vendorId: payment.vendor,
    type: "payment",
    title: `Payment status updated for Order #${payment.order?.orderNumber || "-"}`,
    message: `Payment status is now "${status}".`,
    meta: {
      orderId: payment.order?._id,
      paymentId: payment._id,
      orderNumber: payment.order?.orderNumber,
      status,
    },
    sendEmail: true,
  });

  res.json({ message: "Payment updated", payment, order });
});

router.post("/:id/notify-vendor", authMiddleware, roleOnly("admin"), async (req, res) => {
  try {
    const payment = await Payment.findById(req.params.id)
      .populate("order", "orderNumber")
      .populate("vendor", "name email");

    if (!payment) {
      return res.status(404).json({ message: "Payment not found" });
    }

    if (payment.status !== "Pending") {
      return res.status(400).json({ message: "Only pending transactions can send reminders" });
    }

    await notifyVendor({
      vendorId: payment.vendor?._id || payment.vendor,
      type: "payment",
      title: `Pending transaction reminder for Order #${payment.order?.orderNumber || "-"}`,
      message: `Admin flagged your pending transaction of Rs ${payment.amount} for follow-up. Please review the payment status and update it if needed.`,
      meta: {
        orderId: payment.order?._id,
        paymentId: payment._id,
        vendorId: payment.vendor?._id || payment.vendor,
        orderNumber: payment.order?.orderNumber,
        status: payment.status,
      },
      sendEmail: true,
    });

    res.json({ message: "Vendor notified successfully" });
  } catch (err) {
    console.error("PAYMENT VENDOR NOTIFY ERROR:", err);
    res.status(500).json({ message: "Failed to notify vendor" });
  }
});

module.exports = router;

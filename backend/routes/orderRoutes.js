<<<<<<< HEAD
/** Express API endpoints for order routes; handlers connect HTTP requests to authorization, database operations, and JSON responses. */

=======
>>>>>>> 01538e8b0c137147cf885390b770f7b7e80d10f5
const express = require("express");
const router = express.Router();

const Product = require("../models/Product");
const Order = require("../models/Order");
const Vendor = require("../models/Vendor");
const Cart = require("../models/Cart");
const Payment = require("../models/Payment");
const { notifyVendor, notifyAdmins } = require("../utils/notificationService");

const authMiddleware = require("../middleware/authMiddleware");
const approvedVendorOnly = require("../middleware/approveVendorOnly");
const roleOnly = require("../middleware/adminOnly");

<<<<<<< HEAD
/** Reads the configured Razorpay key values so order flows can use the payment provider when enabled. */
=======
>>>>>>> 01538e8b0c137147cf885390b770f7b7e80d10f5
const getRazorpayCredentials = () => {
  const keyId = (process.env.RAZORPAY_KEY_ID || "").trim();
  const keySecret = ((process.env.RAZORPAY_SECRET || process.env.RAZORPAY_KEY_SECRET) || "").trim();
  return { keyId, keySecret };
};

<<<<<<< HEAD
/** Adds each order's related payment record to the order data returned by the API. */
=======
>>>>>>> 01538e8b0c137147cf885390b770f7b7e80d10f5
const attachPaymentDetails = async (orders) => {
  if (!Array.isArray(orders) || orders.length === 0) {
    return [];
  }

  const orderIds = orders.map((order) => order._id).filter(Boolean);
  const payments = await Payment.find({ order: { $in: orderIds } }).lean();
  const paymentByOrderId = new Map(
    payments.map((payment) => [String(payment.order), payment])
  );

  return orders.map((orderDoc) => {
    const order =
      typeof orderDoc?.toObject === "function" ? orderDoc.toObject() : orderDoc;
    const payment = paymentByOrderId.get(String(order._id)) || null;

    return {
      ...order,
      payment,
      paymentMethod: payment?.method || "Online",
      paymentStatus:
        payment?.status || (order.status === "Delivered" ? "Paid" : "Pending"),
      transactionId:
        payment?.transactionId || payment?.razorpayPaymentId || "",
      razorpayPaymentId: payment?.razorpayPaymentId || "",
    };
  });
};

/* =====================================================
   PLACE SINGLE PRODUCT ORDER (VENDOR)
===================================================== */
<<<<<<< HEAD
// POST /buy/:productId: Creates an order for one product using the submitted quantity and delivery details.
=======
>>>>>>> 01538e8b0c137147cf885390b770f7b7e80d10f5
router.post("/buy/:productId", authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== "vendor") {
      return res.status(403).json({ message: "Only vendors can buy products" });
    }

    const { qty } = req.body;
    const { paymentMethod } = req.body;
    const { productId } = req.params;

    if (!qty || qty <= 0) {
      return res.status(400).json({ message: "Invalid quantity" });
    }

    const vendor = await Vendor.findById(req.user.id);
    const product = await Product.findById(productId);

    if (!vendor || !product) {
      return res.status(404).json({ message: "Data not found" });
    }

    if (product.stock < qty) {
      return res.status(400).json({ message: "Insufficient stock" });
    }

    product.stock -= qty;
    product.sold = (product.sold || 0) + qty;
    await product.save();

    const lastOrder = await Order.findOne().sort({ orderNumber: -1 });
    const newNumber = lastOrder ? lastOrder.orderNumber + 1 : 1;

    const total = product.price * qty;
    const adminCommission = total * 0.1;

    const order = await Order.create({
      orderNumber: newNumber,
      vendor: vendor._id,
      products: [
        {
          orderNumber: newNumber,
          productId: product._id,
          name: product.name,
          price: product.price,
          qty,
          image: product.image
        }
      ],
      total,
      adminCommission,
      status: "Placed"
    });

    if (paymentMethod === "COD") {
      await Payment.create({
        order: order._id,
        vendor: req.user.id,
        amount: total,
        method: "COD",
        status: "Pending"
      });
    }

    res.json({ message: "Order placed successfully", order });
  } catch (err) {
    console.error("BUY ERROR:", err);
    res.status(500).json({ message: "Server error" });
  }
});

/* =====================================================
   GET VENDOR ORDERS
===================================================== */
<<<<<<< HEAD
// GET /vendor/orders: Lists orders belonging to the signed-in vendor.
=======
>>>>>>> 01538e8b0c137147cf885390b770f7b7e80d10f5
router.get("/vendor/orders", authMiddleware, async (req, res) => {
  if (req.user.role !== "vendor") {
    return res.status(403).json({ message: "Access denied" });
  }

  const orders = await Order.find({
    vendor: req.user.id,
    status: { $ne: "PendingPayment" }
  })
    .populate("vendor", "name email phone")
    .sort({ createdAt: -1, orderNumber: -1 });
  const ordersWithPayments = await attachPaymentDetails(orders);
  res.json(ordersWithPayments);
});

/* =====================================================
   CART CHECKOUT 
===================================================== */
<<<<<<< HEAD
// POST /checkout: Validates cart and stock, then creates the order and payment records for checkout.
router.post("/checkout", authMiddleware, approvedVendorOnly, async (req, res) => {
  try {
    const { address, paymentMethod } = req.body;
    /** Converts submitted delivery-address fields into one consistent shape for order records. */
=======
router.post("/checkout", authMiddleware, approvedVendorOnly, async (req, res) => {
  try {
    const { address, paymentMethod } = req.body;
>>>>>>> 01538e8b0c137147cf885390b770f7b7e80d10f5
    const normalizeAddress = (raw) => {
      if (!raw) return "";
      if (typeof raw === "string") return raw.trim();
      if (typeof raw === "object") {
        return [
          raw.label,
          raw.line1,
          raw.line2,
          raw.city,
          raw.state,
          raw.pincode,
          raw.country,
        ]
          .filter(Boolean)
          .join(", ");
      }
      return "";
    };

    const deliveryAddress = normalizeAddress(address);
    if (!deliveryAddress) {
      return res.status(400).json({ message: "Address required" });
    }

    const cart = await Cart.findOne({
      vendor: req.user.id,
      status: "active"
    }).populate("items.product");

    if (!cart || cart.items.length === 0) {
      return res.status(400).json({ message: "Cart empty" });
    }

    const lastOrder = await Order.findOne().sort({ orderNumber: -1 });
    const newNumber = lastOrder ? lastOrder.orderNumber + 1 : 1;

    let total = 0;
    const products = [];

    for (const item of cart.items) {
      const product = item.product;
      if (!product) {
        return res.status(400).json({ message: "Cart has invalid product. Refresh cart and try again." });
      }

      if (product.stock < item.quantity) {
        return res.status(400).json({
          message: `Stock low for ${product.name}`
        });
      }

      total += product.price * item.quantity;

      products.push({
        orderNumber: newNumber,
        productId: product._id,
        name: product.name,
        price: product.price,
        qty: item.quantity,
        image: product.image
      });
    }

    const adminCommission = total * 0.1;

    const initialStatus = paymentMethod === "Online" ? "PendingPayment" : "Placed";

    const order = await Order.create({
      orderNumber: newNumber,
      vendor: req.user.id,
      products,
      total,
      adminCommission,
      deliveryAddress,
      status: initialStatus
    });

    if (paymentMethod === "COD") {
      for (const item of cart.items) {
        const product = item.product;
        product.stock -= item.quantity;
        await product.save();
      }

      await Payment.create({
        order: order._id,
        vendor: req.user.id,
        amount: total,
        method: "COD",
        status: "Pending"
      });

      await notifyAdmins({
        type: "order",
        title: "New COD order placed",
        message: `Order #${order.orderNumber} was placed with COD.`,
        meta: { orderId: order._id, orderNumber: order.orderNumber, status: order.status },
        sendEmail: true,
      });

      cart.status = "ordered";
      await cart.save();

      return res.json({ message: "Order placed successfully", order });
    }

    if (paymentMethod === "Online") {

      const Razorpay = require("razorpay");
      const { keyId, keySecret } = getRazorpayCredentials();

      if (!keyId || !keySecret) {
        return res.status(500).json({
          message: "Razorpay credentials are not configured on server"
        });
      }

      const razorpay = new Razorpay({
        key_id: keyId,
        key_secret: keySecret,
      });

      let razorpayOrder;
      try {
        razorpayOrder = await razorpay.orders.create({
          amount: total * 100,
          currency: "INR",
          receipt: `receipt_${order._id}`
        });
      } catch (rzpErr) {
        const isAuthError = rzpErr?.statusCode === 401 || rzpErr?.error?.code === "BAD_REQUEST_ERROR";
        if (isAuthError) {
          return res.status(500).json({
            message: "Invalid Razorpay credentials on server. Update RAZORPAY_KEY_ID and RAZORPAY_SECRET."
          });
        }
        throw rzpErr;
      }

      await Payment.create({
        order: order._id,
        vendor: req.user.id,
        amount: total,
        method: "UPI",
        status: "Pending",
        razorpayOrderId: razorpayOrder.id
      });

      return res.json({
        message: "Order created",
        order,
        razorpayOrder,
        razorpayKeyId: keyId
      });
    }

    cart.status = "ordered";
    await cart.save();

    res.json({ message: "Order placed successfully", order });

  } catch (err) {
    console.error("CHECKOUT ERROR:", err);
    res.status(500).json({ message: "Checkout failed" });
  }
});

/* =====================================================
   ADMIN VIEW ORDERS
===================================================== */
<<<<<<< HEAD
// GET /admin: Lists orders for the admin order-management screen.
=======
>>>>>>> 01538e8b0c137147cf885390b770f7b7e80d10f5
router.get("/admin", authMiddleware, async (req, res) => {
  if (!["admin", "manager"].includes(req.user.role)) {
    return res.status(403).json({ message: "Access denied" });
  }

  const orders = await Order.find()
    .populate("vendor", "name email phone address")
    .populate({
      path: "products.productId",
      populate: {
        path: "category",
        select: "name"
      }
    })
    .sort({ createdAt: -1 });

  const ordersWithPayments = await attachPaymentDetails(orders);
  res.json(ordersWithPayments);
});

/* =====================================================
   UPDATE ORDER STATUS
===================================================== */
<<<<<<< HEAD
// PUT /status/:id: Changes an order status and records the status history.
=======
>>>>>>> 01538e8b0c137147cf885390b770f7b7e80d10f5
router.put("/status/:id", authMiddleware, async (req, res) => {
  if (!["admin", "manager"].includes(req.user.role)) {
    return res.status(403).json({ message: "Access denied" });
  }

  const allowedStatuses = [
    "PendingPayment",
    "Placed",
    "Processing",
    "Shipped",
    "Delivered",
    "Returned",
    "Cancelled"
  ];

  const { status } = req.body;

  if (!allowedStatuses.includes(status)) {
    return res.status(400).json({ message: "Invalid status" });
  }

  const order = await Order.findById(req.params.id);

  if (!order) {
    return res.status(404).json({ message: "Order not found" });
  }

  const payment = await Payment.findOne({ order: order._id });
  const hasPendingPayment = payment?.status === "Pending";

  if (hasPendingPayment && status !== "Placed") {
    return res.status(400).json({
      message: "Pending-payment orders are locked to Placed until payment is completed"
    });
  }

  if (
    (status === "Cancelled" || status === "Returned") &&
    order.status !== "Cancelled" &&
    order.status !== "Returned"
  ) {
    for (const item of order.products) {
      const product = await Product.findById(item.productId);
      if (product) {
        product.stock += item.qty;
        await product.save();
      }
    }
  }

  order.status = status;
  if (status === "Delivered") {
    await Payment.findOneAndUpdate(
      { order: order._id },
      { status: "Paid" }
    );
  }

  order.statusHistory.push({ status });
  await order.save();

  await notifyVendor({
    vendorId: order.vendor,
    type: "order",
    title: `Order #${order.orderNumber} status updated`,
    message: `Your order #${order.orderNumber} is now "${status}".`,
    meta: { orderId: order._id, orderNumber: order.orderNumber, status },
    sendEmail: true,
  });

  res.json(order);
});

/* =====================================================
   ADMIN COMMISSION
===================================================== */
<<<<<<< HEAD
// GET /commission: Calculates order commission totals for admin reporting.
=======
>>>>>>> 01538e8b0c137147cf885390b770f7b7e80d10f5
router.get("/commission", authMiddleware, roleOnly("admin"), async (req, res) => {
  const orders = await Order.find();
  const total = orders.reduce((sum, o) => sum + o.adminCommission, 0);
  res.json({ total });
});

module.exports = router;

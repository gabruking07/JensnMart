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
   PLACE SINGLE PRODUCT ORDER (VENDOR)
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
    const product = await Product.findById(productId);

    if (!vendor || !product) {
      return res.status(404).json({ message: "Data not found" });
    }

    if (product.stock < qty) {
      return res.status(400).json({ message: "Insufficient stock" });
    }

    product.stock -= item.quantity;
    product.sold += item.quantity; 
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
          qty
        }
      ],
      total,
      adminCommission,
      status: "Placed"
    });

    res.json({ message: "Order placed successfully", order });
  } catch (err) {
    console.error("BUY ERROR:", err);
    res.status(500).json({ message: "Server error" });
  }
});

/* =====================================================
   GET VENDOR ORDERS
===================================================== */
router.get("/vendor/orders", authMiddleware, async (req, res) => {
  if (req.user.role !== "vendor") {
    return res.status(403).json({ message: "Access denied" });
  }

  const orders = await Order.find({ vendor: req.user.id }).sort({ createdAt: -1 });
  res.json(orders);
});

/* =====================================================
   CART CHECKOUT  (MAIN FIXED ROUTE)
===================================================== */
router.post("/checkout", authMiddleware, approvedVendorOnly, async (req, res) => {
  try {
    const { address } = req.body;
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

      product.stock -= item.quantity;
      await product.save();

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

    const order = await Order.create({
      orderNumber: newNumber,
      vendor: req.user.id,
      products,
      total,
      adminCommission,
      deliveryAddress,
      status: "Placed"
    });

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
router.get("/admin", authMiddleware, async (req, res) => {
  if (!["admin", "manager"].includes(req.user.role)) {
    return res.status(403).json({ message: "Access denied" });
  }

  const orders = await Order.find()
    .populate("vendor", "name email phone address")
    .sort({ createdAt: -1 });

  res.json(orders);
});

/* =====================================================
   UPDATE ORDER STATUS
===================================================== */
router.put("/status/:id", authMiddleware, async (req, res) => {
  if (!["admin", "manager"].includes(req.user.role)) {
    return res.status(403).json({ message: "Access denied" });
  }

  const { status } = req.body;

  const order = await Order.findByIdAndUpdate(
    req.params.id,
    { status },
    { new: true }
  );

  res.json(order);
});

/* =====================================================
   ADMIN COMMISSION
===================================================== */
router.get("/commission", authMiddleware, roleOnly("admin"), async (req, res) => {
  const orders = await Order.find();
  const total = orders.reduce((sum, o) => sum + o.adminCommission, 0);
  res.json({ total });
});

module.exports = router;

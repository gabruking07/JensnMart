/** Express API endpoints for notification routes; handlers connect HTTP requests to authorization, database operations, and JSON responses. */

const express = require("express");
const router = express.Router();

const Notification = require("../models/Notification");
const Product = require("../models/Product");
const RestockSubscription = require("../models/RestockSubscription");
const Vendor = require("../models/Vendor");
const authMiddleware = require("../middleware/authMiddleware");
const { notifyAdmins } = require("../utils/notificationService");

/** Maps the signed-in role to the Mongoose model used to find its notification records. */
const getRecipientModelByRole = (role) => {
  if (role === "vendor") return "Vendor";
  if (role === "admin" || role === "manager") return "Admin";
  return null;
};

// GET /: Lists notifications for the signed-in admin or vendor.
router.get("/", authMiddleware, async (req, res) => {
  try {
    const recipientModel = getRecipientModelByRole(req.user.role);
    if (!recipientModel) return res.status(403).json({ message: "Access denied" });

    const limit = Math.min(Number(req.query.limit || 20), 50);

    const notifications = await Notification.find({
      recipientModel,
      recipient: req.user.id,
    })
      .sort({ createdAt: -1 })
      .limit(limit);

    res.json(notifications);
  } catch (err) {
    console.error("NOTIFICATIONS LIST ERROR:", err);
    res.status(500).json({ message: "Failed to load notifications" });
  }
});

// GET /unread-count: Returns the signed-in user unread notification count.
router.get("/unread-count", authMiddleware, async (req, res) => {
  try {
    const recipientModel = getRecipientModelByRole(req.user.role);
    if (!recipientModel) return res.status(403).json({ message: "Access denied" });

    const count = await Notification.countDocuments({
      recipientModel,
      recipient: req.user.id,
      isRead: false,
    });

    res.json({ count });
  } catch (err) {
    console.error("UNREAD COUNT ERROR:", err);
    res.status(500).json({ message: "Failed to load unread count" });
  }
});

// POST /restock-request: Subscribes the signed-in vendor to a back-in-stock alert for a product.
router.post("/restock-request", authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== "vendor") {
      return res.status(403).json({ message: "Only vendors can request restock alerts" });
    }

    const { productId } = req.body || {};
    if (!productId) {
      return res.status(400).json({ message: "Product is required" });
    }

    const product = await Product.findById(productId).select("name stock");
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    if (Number(product.stock || 0) > 0) {
      return res.status(400).json({ message: "This product is already in stock" });
    }

    const existingRequest = await RestockSubscription.exists({
      product: product._id,
      vendor: req.user.id,
      status: "pending",
    });

    if (existingRequest) {
      return res.json({
        alreadyRequested: true,
        message: "You are already subscribed for this product restock update",
      });
    }

    await RestockSubscription.create({
      product: product._id,
      vendor: req.user.id,
      status: "pending",
      requestedAt: new Date(),
    });

    const vendor = await Vendor.findById(req.user.id).select("name email");
    const vendorLabel = vendor?.name || vendor?.email || "A vendor";

    await notifyAdmins({
      type: "system",
      title: `Restock request: ${product.name}`,
      message: `${vendorLabel} requested a restock alert for ${product.name} because it is currently out of stock.`,
      meta: {
        productId: product._id,
        vendorId: req.user.id,
        status: "restock-request",
      },
      sendEmail: false,
    });

    res.status(201).json({
      message: "Request accepted. We'll notify you when this product becomes available.",
    });
  } catch (err) {
    console.error("RESTOCK REQUEST ERROR:", err);
    res.status(500).json({ message: "Failed to send restock request" });
  }
});

// DELETE /restock-request/:productId: Cancels the vendor back-in-stock alert for a product.
router.delete("/restock-request/:productId", authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== "vendor") {
      return res.status(403).json({ message: "Only vendors can manage restock alerts" });
    }

    const subscription = await RestockSubscription.findOneAndDelete({
      product: req.params.productId,
      vendor: req.user.id,
      status: "pending",
    });

    if (!subscription) {
      return res.status(404).json({ message: "No active restock alert found for this product" });
    }

    res.json({ message: "Restock alert turned off successfully" });
  } catch (err) {
    console.error("RESTOCK CANCEL ERROR:", err);
    res.status(500).json({ message: "Failed to turn off restock alert" });
  }
});

// PUT /read-all: Marks the signed-in user notifications as read.
router.put("/read-all", authMiddleware, async (req, res) => {
  try {
    const recipientModel = getRecipientModelByRole(req.user.role);
    if (!recipientModel) return res.status(403).json({ message: "Access denied" });

    await Notification.updateMany(
      { recipientModel, recipient: req.user.id, isRead: false },
      { $set: { isRead: true } }
    );

    res.json({ message: "All notifications marked as read" });
  } catch (err) {
    console.error("READ ALL ERROR:", err);
    res.status(500).json({ message: "Failed to mark notifications" });
  }
});

// PUT /:id/read: Marks one notification as read for its recipient.
router.put("/:id/read", authMiddleware, async (req, res) => {
  try {
    const recipientModel = getRecipientModelByRole(req.user.role);
    if (!recipientModel) return res.status(403).json({ message: "Access denied" });

    const notification = await Notification.findOneAndUpdate(
      {
        _id: req.params.id,
        recipientModel,
        recipient: req.user.id,
      },
      { $set: { isRead: true } },
      { new: true }
    );

    if (!notification) {
      return res.status(404).json({ message: "Notification not found" });
    }

    res.json(notification);
  } catch (err) {
    console.error("READ ONE ERROR:", err);
    res.status(500).json({ message: "Failed to mark notification" });
  }
});

module.exports = router;

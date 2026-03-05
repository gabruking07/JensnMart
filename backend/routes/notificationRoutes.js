const express = require("express");
const router = express.Router();

const Notification = require("../models/Notification");
const authMiddleware = require("../middleware/authMiddleware");

const getRecipientModelByRole = (role) => {
  if (role === "vendor") return "Vendor";
  if (role === "admin" || role === "manager") return "Admin";
  return null;
};

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

const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema(
  {
    recipientModel: {
      type: String,
      enum: ["Admin", "Vendor"],
      required: true,
    },
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      refPath: "recipientModel",
      index: true,
    },
    type: {
      type: String,
      enum: ["order", "payment", "system"],
      default: "system",
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    message: {
      type: String,
      required: true,
      trim: true,
    },
    isRead: {
      type: Boolean,
      default: false,
      index: true,
    },
    meta: {
      orderId: { type: mongoose.Schema.Types.ObjectId, ref: "Order" },
      paymentId: { type: mongoose.Schema.Types.ObjectId, ref: "Payment" },
      productId: { type: mongoose.Schema.Types.ObjectId, ref: "Product" },
      vendorId: { type: mongoose.Schema.Types.ObjectId, ref: "Vendor" },
      productImage: String,
      productName: String,
      orderNumber: Number,
      status: String,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Notification", notificationSchema);

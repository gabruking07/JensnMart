const mongoose = require("mongoose");

const restockSubscriptionSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
      index: true,
    },
    vendor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Vendor",
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: ["pending", "fulfilled"],
      default: "pending",
      index: true,
    },
    requestedAt: {
      type: Date,
      default: Date.now,
    },
    fulfilledAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

restockSubscriptionSchema.index({ product: 1, vendor: 1, status: 1 }, { unique: true });

module.exports = mongoose.model("RestockSubscription", restockSubscriptionSchema);

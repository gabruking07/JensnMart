const mongoose = require("mongoose");

const OrderSchema = new mongoose.Schema(
  {
    // Vendor who placed the order
    vendor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Vendor",
      required: true
    },

    // Ordered products
   products: [
  {
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product"
    },
    name: String,
    price: Number,
    qty: Number,
    image: String   // ✅ ADD THIS
  }
],

    // Order totals
    total: {
      type: Number,
      required: true
    },

    adminCommission: {
      type: Number,
      required: true
    },

    status: {
      type: String,
      enum: ["Placed", "Completed", "Cancelled"],
      default: "Placed"
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model("Order", OrderSchema);
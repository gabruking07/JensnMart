const mongoose = require("mongoose");

const ORDER_STATUSES = [
  "Placed",
  "Processing",
  "Shipped",
  "Delivered",
  "Returned",
  "Completed",
  "Cancelled",
];

/* ================= STATUS HISTORY SCHEMA ================= */
const statusHistorySchema = new mongoose.Schema(
  {
    status: {
      type: String,
      enum: ORDER_STATUSES,
      required: true,
    },
    updatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: false }
);

/* ================= MAIN ORDER SCHEMA ================= */
const OrderSchema = new mongoose.Schema(
  {
    orderNumber: {
      type: Number,
      unique: true,
      required: true,
    },

    vendor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Vendor",
      required: true,
    },

    products: [
      {
        productId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Product",
        },
        name: String,
        price: Number,
        qty: Number,
        image: String,
      },
    ],

    total: {
      type: Number,
      required: true,
    },

    adminCommission: {
      type: Number,
      required: true,
    },

    status: {
      type: String,
      enum: ORDER_STATUSES,
      default: "Processing",
    },

    statusHistory: {
      type: [statusHistorySchema],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

/* ================= AUTO ADD INITIAL STATUS ================= */
OrderSchema.pre("save", function () {
  if (this.isNew && this.statusHistory.length === 0) {
    this.statusHistory.push({
      status: this.status,
      updatedAt: new Date(),
    });
  }
});

module.exports = mongoose.model("Order", OrderSchema);

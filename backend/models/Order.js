<<<<<<< HEAD
/** Mongoose schema and model for order; defines the stored fields, validation, defaults, and relationships for this record. */

=======
>>>>>>> 01538e8b0c137147cf885390b770f7b7e80d10f5
const mongoose = require("mongoose");

const OrderSchema = new mongoose.Schema(
  {
    orderNumber: {
      type: Number,
      unique: true
    },

    deliveryAddress: String,

    vendor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Vendor",
      required: true
    },

    products: [
      {
        productId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Product"
        },
        name: String,
        price: Number,
        qty: Number,
        image: String
      }
    ],

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
      enum: [
        "PendingPayment",
        "Placed",
        "Processing",
        "Shipped",
        "Delivered",
        "Returned",
        "Cancelled"
      ],
      default: "Placed"
    },

    statusHistory: [
      {
        status: String,
        changedAt: { type: Date, default: Date.now }
      }
    ]
  },
  { timestamps: true }
);

module.exports = mongoose.model("Order", OrderSchema);

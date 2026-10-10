/** Mongoose schema and model for cart; defines the stored fields, validation, defaults, and relationships for this record. */

const mongoose = require("mongoose");

const CartSchema = new mongoose.Schema(
  {
    vendor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Vendor",
      required: true
    },

    items: [
      {
        product: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Product",
          required: true
        },
        quantity: {
          type: Number,
          required: true,
          min: 1
        }
      }
    ],

    status: {
      type: String,
      enum: ["active", "ordered"],
      default: "active"
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Cart", CartSchema);
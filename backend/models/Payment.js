/** Mongoose schema and model for payment; defines the stored fields, validation, defaults, and relationships for this record. */

const mongoose = require("mongoose");

const paymentSchema = new mongoose.Schema({
    order: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Order",
        required: true
    },
    vendor: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Vendor",
        required: true
    },
    amount: {
        type: Number,
        required: true
    },
    method: {
        type: String,
        enum: ["COD", "UPI", "Card"],
        default: "COD"
    },
    status: {
        type: String,
        enum: ["Pending", "Paid", "Failed"],
        default: "Pending"
    },
    transactionId: String,
    razorpayOrderId: String,
    razorpayPaymentId: String,
    razorpaySignature: String
}
    , { timestamps: true });

module.exports = mongoose.model("Payment", paymentSchema);
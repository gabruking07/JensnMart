const mongoose = require("mongoose");

const vendorSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: {
      type: String,
      required: true,
      unique: true
    },
    password: { type: String, required: true },
    phone: {
      type: String,
      required: true,
      match: /^[0-9]{10}$/
    },
    approved: { type: Boolean, default: false },
    role: { type: String, default: "vendor" }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Vendor", vendorSchema);
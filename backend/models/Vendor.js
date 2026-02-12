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
    address: {
      line1: { type: String, default: "" },
      line2: { type: String, default: "" },
      city: { type: String, default: "" },
      state: { type: String, default: "" },
      pincode: { type: String, default: "" },
      country: { type: String, default: "India" }
    },

    profileImage: {
      type: String,
      default: ""
    },
    approved: { type: Boolean, default: false },
    role: { type: String, default: "vendor" }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Vendor", vendorSchema);
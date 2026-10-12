<<<<<<< HEAD
/** Mongoose schema and model for vendor; defines the stored fields, validation, defaults, and relationships for this record. */

=======
>>>>>>> 01538e8b0c137147cf885390b770f7b7e80d10f5
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
    passwordResetOtp: { type: String, default: "" },
    passwordResetOtpExpires: { type: Date, default: null },
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
    addresses: [
      {
        label: String,
        line1: String,
        city: String,
        state: String,
        pincode: String,
        isDefault: { type: Boolean, default: false }
      }
    ],

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

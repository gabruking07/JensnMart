<<<<<<< HEAD
/** Mongoose schema and model for admin; defines the stored fields, validation, defaults, and relationships for this record. */

=======
>>>>>>> 01538e8b0c137147cf885390b770f7b7e80d10f5
const mongoose = require("mongoose");

const adminSchema = new mongoose.Schema(
  {
    name: { type: String},
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    passwordResetOtp: { type: String, default: "" },
    passwordResetOtpExpires: { type: Date, default: null },
    phone: {
      type: String,
      match: /^[0-9]{10}$/
    },
    approved: {
      type: Boolean,
      default: false
    },
    role: {
      type: String,
      enum: ["admin", "manager"],
      default: "admin"
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Admin", adminSchema);

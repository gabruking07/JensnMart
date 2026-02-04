const mongoose = require("mongoose");

const adminSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    phone: {
      type: String,
      required: true,
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
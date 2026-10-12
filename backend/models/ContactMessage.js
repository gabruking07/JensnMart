<<<<<<< HEAD
/** Mongoose schema and model for contact message; defines the stored fields, validation, defaults, and relationships for this record. */

=======
>>>>>>> 01538e8b0c137147cf885390b770f7b7e80d10f5
const mongoose = require("mongoose");

const contactMessageSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 120,
    },
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      maxlength: 180,
    },
    subject: {
      type: String,
      trim: true,
      maxlength: 180,
      default: "",
    },
    message: {
      type: String,
      required: true,
      trim: true,
      maxlength: 5000,
    },
    status: {
      type: String,
      enum: ["new", "reviewed", "resolved"],
      default: "new",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("ContactMessage", contactMessageSchema);

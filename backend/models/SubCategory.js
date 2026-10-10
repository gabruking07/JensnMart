/** Mongoose schema and model for sub category; defines the stored fields, validation, defaults, and relationships for this record. */

const mongoose = require("mongoose");

const subCategorySchema = new mongoose.Schema({
  name: { type: String, required: true },
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Category",
    required: true
  }
});

module.exports = mongoose.model("SubCategory", subCategorySchema);
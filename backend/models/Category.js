/** Mongoose schema and model for category; defines the stored fields, validation, defaults, and relationships for this record. */

const mongoose = require("mongoose");

const categorySchema = new mongoose.Schema({
  name: String
});

module.exports = mongoose.model("Category", categorySchema);
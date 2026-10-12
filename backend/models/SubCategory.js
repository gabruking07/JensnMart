<<<<<<< HEAD
/** Mongoose schema and model for sub category; defines the stored fields, validation, defaults, and relationships for this record. */

=======
>>>>>>> 01538e8b0c137147cf885390b770f7b7e80d10f5
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
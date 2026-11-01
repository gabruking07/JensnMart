/** Backend configuration for upload; centralizes setup reused by API routes. */

const multer = require("multer");
const path = require("path");
const fs = require("fs");

const storage = multer.diskStorage({
  // Chooses a storage folder based on the uploaded form field and creates it if needed.
  destination: (req, file, cb) => {
    const baseDir = path.join(__dirname, "../uploads");
    const targetDir =
      file.fieldname === "profileImage"
        ? path.join(baseDir, "vendorProfile")
        : file.fieldname === "image"
          ? path.join(baseDir, "products")
          : baseDir;

    fs.mkdirSync(targetDir, { recursive: true });
    cb(null, targetDir);
  },
  // Gives each uploaded image a timestamp-based name while preserving its extension.
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});

const upload = multer({
  storage,
  // Limits accepted uploads to common JPEG and PNG image extensions.
  fileFilter: (req, file, cb) => {
    const filetypes = /jpeg|jpg|png/;
    const extname = filetypes.test(
      path.extname(file.originalname).toLowerCase()
    );

    if (extname) {
      cb(null, true);
    } else {
      cb(new Error("Only images allowed"));
    }
  }
});

module.exports = upload;

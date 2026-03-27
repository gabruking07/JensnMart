const multer = require("multer");
const path = require("path");
const fs = require("fs");

const storage = multer.diskStorage({
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
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});

const upload = multer({
  storage,
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

const express = require("express");
const multer = require("multer");
const fs = require("fs");
const path = require("path");
const { API_URL } = require("../constants");

// path.dirname;
const router = express.Router();

const upload = multer({ dest: "./public" });

router.post("/", upload.single("upload"), async (req, res) => {
  const photo = req.file;

  var PathPhoto = photo.path;

  const extName = photo.mimetype;
  try {
    if (
      extName === "image/png" ||
      extName === "image/jpeg" ||
      extName === "image/jfif" ||
      extName === "image/jpg" ||
      extName === "image/tif" ||
      extName === "image/bmp"
    ) {
      const targetPathUrl = path.join(photo.destination, "logo.PNG");

      fs.renameSync(PathPhoto, targetPathUrl);
      res.json({
        uploaded: true,

        url: `${API_URL}/logo.PNG`,
      });
    } else {
      fs.unlinkSync(photo.path);

      res.json({ message: "Geçersiz Dosya Uzantısı!" });
    }
  } catch (error) {
    res.json(error);
  }
});

module.exports = router;

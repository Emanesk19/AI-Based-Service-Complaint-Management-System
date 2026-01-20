const express = require("express");
const router = express.Router();

const auth = require("../middleware/auth.middleware");
const upload = require("../middleware/upload.middleware");
const controller = require("../controllers/attachment.controller");

router.post(
  "/",
  auth,
  upload.single("file"),
  controller.uploadAttachment
);

module.exports = router;

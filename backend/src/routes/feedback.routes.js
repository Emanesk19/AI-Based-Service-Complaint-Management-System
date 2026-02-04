const express = require("express");
const router = express.Router();

const auth = require("../middleware/auth.middleware");
const controller = require("../controllers/feedback.controller");

router.post("/", auth, controller.submitFeedback);

module.exports = router;

const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth.middleware");
const controller = require("../controllers/chatbot.controller");

router.post("/", auth, controller.chat);

module.exports = router;

const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth.middleware");
const controller = require("../controllers/chatSession.controller");

router.post("/", auth, controller.createSession);

module.exports = router;

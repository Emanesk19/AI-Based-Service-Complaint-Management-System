const express = require("express");
const router = express.Router();

const auth = require("../middleware/auth.middleware");
const controller = require("../controllers/intelligence.controller");

router.get("/:ticketId", auth, controller.analyzeTicket);

module.exports = router;

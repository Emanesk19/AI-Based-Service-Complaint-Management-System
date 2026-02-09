const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth.middleware");
const controller = require("../controllers/stats.controller");

// Get overall statistics summary
router.get("/summary", auth, controller.getSummary);

module.exports = router;

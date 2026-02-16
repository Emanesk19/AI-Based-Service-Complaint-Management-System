const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth.middleware");
const role = require("../middleware/role.middleware");
const reportController = require("../controllers/report.controller");

// Admin only export routes
router.use(auth, role("admin"));

router.get("/export/csv", reportController.exportTicketsCSV);
router.get("/export/pdf", reportController.exportSummaryPDF);

module.exports = router;

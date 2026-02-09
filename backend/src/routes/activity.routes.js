const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth.middleware");
const roleMiddleware = require("../middleware/role.middleware");
const controller = require("../controllers/activity.controller");

// Ticket history endpoint (Available to all authenticated users for now, 
// controller handles the specific ticket logic if needed)
router.get(
  "/tickets/:id/history",
  auth,
  controller.getTicketHistory
);

// Global audit logs (Admin only)
router.get(
  "/audit-logs",
  auth,
  roleMiddleware("admin"),
  controller.getAuditLogs
);

module.exports = router;

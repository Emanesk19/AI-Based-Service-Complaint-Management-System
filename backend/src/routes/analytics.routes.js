const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth.middleware");
const roleMiddleware = require("../middleware/role.middleware");
const controller = require("../controllers/analytics.controller");

// All analytics endpoints require agent/admin role

// Dashboard overview (Personal for users, Global for agents)
router.get(
  "/dashboard",
  auth,
  controller.getDashboard
);

// Trends analysis (Personal for users, Global for agents)
router.get(
  "/trends",
  auth,
  controller.getTrends
);

// Agent performance
router.get(
  "/performance",
  auth,
  roleMiddleware("agent"),
  controller.getPerformance
);

// Category breakdown
router.get(
  "/category-breakdown",
  auth,
  roleMiddleware("agent"),
  controller.getCategoryBreakdown
);

// SLA compliance
router.get(
  "/sla-compliance",
  auth,
  roleMiddleware("agent"),
  controller.getSLACompliance
);

// Predictive Analytics

// Predict resolution time for a ticket
router.get(
  "/predict-resolution-time/:ticketId",
  auth,
  roleMiddleware("agent"),
  controller.predictResolutionTime
);

// Recommend agents for a ticket
router.get(
  "/recommend-agent/:ticketId",
  auth,
  roleMiddleware("agent"),
  controller.recommendAgent
);

// Ticket clustering (hot topics)
router.get(
  "/ticket-clustering",
  auth,
  roleMiddleware("agent"),
  controller.getTicketClustering
);


module.exports = router;

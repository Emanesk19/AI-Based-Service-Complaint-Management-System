const express = require("express");
const router = express.Router();

const ticketController = require("../controllers/ticket.controller");
const authMiddleware = require("../middleware/auth.middleware");

router.post("/", authMiddleware, ticketController.createTicket);
router.get("/my", authMiddleware, ticketController.getMyTickets);
const roleMiddleware = require("../middleware/role.middleware");


// Agent/Admin routes
router.post(
  "/assign",
  authMiddleware,
  roleMiddleware("agent"),
  ticketController.assignTicket
);

router.get(
  "/assigned",
  authMiddleware,
  roleMiddleware("agent"),
  ticketController.getAssignedTickets
);

router.post(
  "/status",
  authMiddleware,
  roleMiddleware("agent"),
  ticketController.updateTicketStatus
);

module.exports = router;
module.exports = router;

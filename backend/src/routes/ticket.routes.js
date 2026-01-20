const express = require("express");
const router = express.Router();

const ticketController = require("../controllers/ticket.controller");
const authMiddleware = require("../middleware/auth.middleware");

router.post("/", authMiddleware, ticketController.createTicket);
router.get("/my", authMiddleware, ticketController.getMyTickets);

module.exports = router;

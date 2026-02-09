const express = require("express");
const router = express.Router();

const ticketController = require("../controllers/ticket.controller");
const searchController = require("../controllers/search.controller");
const authMiddleware = require("../middleware/auth.middleware");
const roleMiddleware = require("../middleware/role.middleware");
const validators = require("../middleware/validators");
const { handleValidationErrors } = require("../middleware/validation.middleware");

// Public ticket routes (authenticated users)
router.post(
  "/",
  authMiddleware,
  validators.createTicketValidation,
  handleValidationErrors,
  ticketController.createTicket
);

router.get("/my", authMiddleware, ticketController.getMyTickets);

// Get all tickets with pagination and filtering (agents/admins)
router.get(
  "/all",
  authMiddleware,
  roleMiddleware("agent"),
  validators.paginationValidation,
  handleValidationErrors,
  ticketController.getAllTickets
);

// Search tickets (Advanced search)
router.get(
  "/search",
  authMiddleware,
  roleMiddleware("agent"),
  searchController.searchTickets
);

// Get single ticket by ID
router.get(
  "/:id",
  authMiddleware,
  validators.ticketIdParamValidation,
  handleValidationErrors,
  ticketController.getTicketById
);

// Agent/Admin routes
router.post(
  "/assign",
  authMiddleware,
  roleMiddleware("agent"),
  validators.assignTicketValidation,
  handleValidationErrors,
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
  validators.updateStatusValidation,
  handleValidationErrors,
  ticketController.updateTicketStatus
);

router.get(
  "/overdue",
  authMiddleware,
  roleMiddleware("agent"),
  ticketController.getOverdueTickets
);

router.post(
  "/close",
  authMiddleware,
  roleMiddleware("agent"),
  validators.closeTicketValidation,
  handleValidationErrors,
  ticketController.closeTicket
);

router.post(
  "/reopen",
  authMiddleware,
  roleMiddleware("user"),
  validators.reopenTicketValidation,
  handleValidationErrors,
  ticketController.reopenTicket
);

module.exports = router;



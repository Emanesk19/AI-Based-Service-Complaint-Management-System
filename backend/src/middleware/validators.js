const { body, param, query } = require("express-validator");

/**
 * Validation rules for user registration
 */
exports.registerValidation = [
  body("name")
    .trim()
    .notEmpty()
    .withMessage("Name is required")
    .isLength({ min: 2, max: 100 })
    .withMessage("Name must be between 2 and 100 characters"),

  body("email")
    .trim()
    .notEmpty()
    .withMessage("Email is required")
    .isEmail()
    .withMessage("Please provide a valid email address")
    .normalizeEmail(),

  body("password")
    .notEmpty()
    .withMessage("Password is required")
    .isLength({ min: 6 })
    .withMessage("Password must be at least 6 characters long"),

  body("role")
    .optional()
    .isIn(["user", "agent", "admin"])
    .withMessage("Role must be either user, agent, or admin")
];

/**
 * Validation rules for user login
 */
exports.loginValidation = [
  body("email")
    .trim()
    .notEmpty()
    .withMessage("Email is required")
    .isEmail()
    .withMessage("Please provide a valid email address")
    .normalizeEmail(),

  body("password")
    .notEmpty()
    .withMessage("Password is required")
];

/**
 * Validation rules for ticket creation
 */
exports.createTicketValidation = [
  body("title")
    .trim()
    .notEmpty()
    .withMessage("Title is required")
    .isLength({ min: 5, max: 200 })
    .withMessage("Title must be between 5 and 200 characters"),

  body("description")
    .trim()
    .notEmpty()
    .withMessage("Description is required")
    .isLength({ min: 10 })
    .withMessage("Description must be at least 10 characters long"),

  body("category")
    .trim()
    .notEmpty()
    .withMessage("Category is required"),

  body("priority")
    .notEmpty()
    .withMessage("Priority is required")
    .isIn(["Low", "Medium", "High"])
    .withMessage("Priority must be Low, Medium, or High")
];

/**
 * Validation rules for ticket assignment
 */
exports.assignTicketValidation = [
  body("ticketId")
    .notEmpty()
    .withMessage("Ticket ID is required")
    .isInt({ min: 1 })
    .withMessage("Ticket ID must be a positive integer"),

  body("agentId")
    .notEmpty()
    .withMessage("Agent ID is required")
    .isInt({ min: 1 })
    .withMessage("Agent ID must be a positive integer")
];

/**
 * Validation rules for ticket status update
 */
exports.updateStatusValidation = [
  body("ticketId")
    .notEmpty()
    .withMessage("Ticket ID is required")
    .isInt({ min: 1 })
    .withMessage("Ticket ID must be a positive integer"),

  body("status")
    .notEmpty()
    .withMessage("Status is required")
    .isIn(["New", "In Progress", "Pending", "Resolved", "Reopened"])
    .withMessage("Invalid status value")
];

/**
 * Validation rules for closing ticket
 */
exports.closeTicketValidation = [
  body("ticketId")
    .notEmpty()
    .withMessage("Ticket ID is required")
    .isInt({ min: 1 })
    .withMessage("Ticket ID must be a positive integer"),

  body("closeReason")
    .trim()
    .notEmpty()
    .withMessage("Close reason is required")
    .isLength({ min: 5 })
    .withMessage("Close reason must be at least 5 characters long")
];

/**
 * Validation rules for reopening ticket
 */
exports.reopenTicketValidation = [
  body("ticketId")
    .notEmpty()
    .withMessage("Ticket ID is required")
    .isInt({ min: 1 })
    .withMessage("Ticket ID must be a positive integer")
];

/**
 * Validation rules for ticket ID parameter
 */
exports.ticketIdParamValidation = [
  param("id")
    .notEmpty()
    .withMessage("Ticket ID is required")
    .isInt({ min: 1 })
    .withMessage("Ticket ID must be a positive integer")
];

/**
 * Validation rules for pagination query
 */
exports.paginationValidation = [
  query("page")
    .optional()
    .isInt({ min: 1 })
    .withMessage("Page must be a positive integer"),

  query("limit")
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage("Limit must be between 1 and 100"),

  query("sortBy")
    .optional()
    .isIn(["createdAt", "updatedAt", "priority", "status", "dueDate"])
    .withMessage("Invalid sort field"),

  query("order")
    .optional()
    .isIn(["asc", "desc"])
    .withMessage("Order must be asc or desc")
];

/**
 * Validation rules for comment creation
 */
exports.createCommentValidation = [
  body("ticketId")
    .notEmpty()
    .withMessage("Ticket ID is required")
    .isInt({ min: 1 })
    .withMessage("Ticket ID must be a positive integer"),

  body("content")
    .trim()
    .notEmpty()
    .withMessage("Comment content is required")
    .isLength({ min: 1, max: 1000 })
    .withMessage("Comment must be between 1 and 1000 characters")
];

/**
 * Validation rules for feedback submission
 */
exports.submitFeedbackValidation = [
  body("ticketId")
    .notEmpty()
    .withMessage("Ticket ID is required")
    .isInt({ min: 1 })
    .withMessage("Ticket ID must be a positive integer"),

  body("rating")
    .notEmpty()
    .withMessage("Rating is required")
    .isInt({ min: 1, max: 5 })
    .withMessage("Rating must be between 1 and 5"),

  body("comment")
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage("Comment must not exceed 500 characters")
];

const express = require("express");
const router = express.Router();
const userController = require("../controllers/user.controller");
const authMiddleware = require("../middleware/auth.middleware");
const roleMiddleware = require("../middleware/role.middleware");

// All routes require authentication
router.use(authMiddleware);

// Get all users (Admin only)
router.get(
  "/",
  roleMiddleware("admin"),
  userController.getAllUsers
);

// Get user by ID (Admin or self)
// Note: We'll allow agents to view user profiles too for assignment context?
// For now, let's restrict to admin, or maybe allow agents to view basic info?
// Task says "Add GET /api/users/:id endpoint".
// Let's allow admin for now.
router.get(
  "/:id",
  roleMiddleware("admin"),
  userController.getUserById
);

// Update user role (Admin only)
router.put(
  "/:id/role",
  roleMiddleware("admin"),
  userController.updateUserRole
);

// Update user status (Admin only)
router.put(
  "/:id/status",
  roleMiddleware("admin"),
  userController.updateUserStatus
);

module.exports = router;

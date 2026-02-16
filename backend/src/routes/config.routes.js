const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth.middleware");
const role = require("../middleware/role.middleware");
const controller = require("../controllers/config.controller");

// Public get routes for authenticated users
router.get("/categories", auth, controller.getCategories);
router.get("/priorities", auth, controller.getPriorities);

// Admin-only management routes
router.post("/categories", auth, role("admin"), controller.createCategory);
router.delete("/categories/:id", auth, role("admin"), controller.deleteCategory);

router.post("/priorities", auth, role("admin"), controller.createPriority);
router.delete("/priorities/:id", auth, role("admin"), controller.deletePriority);

module.exports = router;

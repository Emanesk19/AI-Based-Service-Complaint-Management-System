const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth.middleware");
const controller = require("../controllers/notification.controller");

// All routes require authentication
router.use(auth);

router.get("/", controller.getNotifications);
router.put("/read-all", controller.markAllAsRead);
router.put("/:id/read", controller.markAsRead);
router.delete("/:id", controller.deleteNotification);

module.exports = router;

const express = require("express");
const router = express.Router();

const auth = require("../middleware/auth.middleware");
const controller = require("../controllers/comment.controller");

router.post("/", auth, controller.addComment);
router.get("/:ticketId", auth, controller.getCommentsByTicket);

module.exports = router;

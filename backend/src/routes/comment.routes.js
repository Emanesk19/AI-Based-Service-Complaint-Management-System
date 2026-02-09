const express = require("express");
const router = express.Router();

const auth = require("../middleware/auth.middleware");
const controller = require("../controllers/comment.controller");
const validators = require("../middleware/validators");
const { handleValidationErrors } = require("../middleware/validation.middleware");

router.post(
  "/",
  auth,
  validators.createCommentValidation,
  handleValidationErrors,
  controller.addComment
);

router.get("/:ticketId", auth, controller.getCommentsByTicket);

module.exports = router;


const express = require("express");
const router = express.Router();

const auth = require("../middleware/auth.middleware");
const controller = require("../controllers/feedback.controller");
const validators = require("../middleware/validators");
const { handleValidationErrors } = require("../middleware/validation.middleware");

router.post(
  "/",
  auth,
  validators.submitFeedbackValidation,
  handleValidationErrors,
  controller.submitFeedback
);

module.exports = router;


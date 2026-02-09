const express = require("express");
const router = express.Router();
const authController = require("../controllers/auth.controller");
const validators = require("../middleware/validators");
const { handleValidationErrors } = require("../middleware/validation.middleware");

router.post(
  "/register",
  validators.registerValidation,
  handleValidationErrors,
  authController.register
);

router.post(
  "/login",
  validators.loginValidation,
  handleValidationErrors,
  authController.login
);

module.exports = router;


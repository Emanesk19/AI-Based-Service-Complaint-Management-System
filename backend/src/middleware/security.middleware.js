const rateLimit = require("express-rate-limit");

/**
 * Global rate limiter: 100 requests per 15 minutes
 */
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: {
    message: "Too many requests from this IP, please try again after 15 minutes"
  },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Auth rate limiter: 10 failed attempts per hour for login/register
 */
const authLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 100,
  message: {
    message: "Too many authentication attempts, please try again after an hour"
  },
  standardHeaders: true,
  legacyHeaders: false,
});

module.exports = {
  globalLimiter,
  authLimiter
};

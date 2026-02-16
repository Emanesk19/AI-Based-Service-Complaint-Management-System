const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const { globalLimiter, authLimiter } = require("./middleware/security.middleware");

const authRoutes = require("./routes/auth.routes");
const ticketRoutes = require("./routes/ticket.routes");
const commentRoutes = require("./routes/comment.routes");
const attachmentRoutes = require("./routes/attachment.routes");
const feedbackRoutes = require("./routes/feedback.routes");
const intelligenceRoutes = require("./routes/intelligence.routes");
const chatbotRoutes = require("./routes/chatbot.routes");
const chatSessionRoutes = require("./routes/chatSession.routes");
const statsRoutes = require("./routes/stats.routes");
const analyticsRoutes = require("./routes/analytics.routes");
const userRoutes = require("./routes/user.routes");
const activityRoutes = require("./routes/activity.routes");
const notificationRoutes = require("./routes/notification.routes");
const configRoutes = require("./routes/config.routes");
const reportRoutes = require("./routes/report.routes");

const app = express();

app.use(helmet());
app.use(morgan("dev"));
app.use(cors());
app.use(express.json());
app.use(globalLimiter);

app.get("/", (req, res) => {
  res.send("API running");
});

// Register routes
app.use("/api/auth", authLimiter, authRoutes);
app.use("/api/tickets", ticketRoutes);
app.use("/api/comments", commentRoutes);
app.use("/api/attachments", attachmentRoutes);
app.use("/api/feedback", feedbackRoutes);
app.use("/api/intelligence", intelligenceRoutes);
app.use("/api/chat", chatbotRoutes);
app.use("/api/chat/sessions", chatSessionRoutes);
app.use("/api/stats", statsRoutes);
app.use("/api/analytics", analyticsRoutes);
app.use("/api/users", userRoutes);
app.use("/api", activityRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/config", configRoutes);
app.use("/api/reports", reportRoutes);

// Global error handling middleware
app.use((err, req, res, next) => {
  console.error("Global error handler:", err);
  
  res.status(err.status || 500).json({
    message: err.message || "Internal server error",
    ...(process.env.NODE_ENV === "development" && { stack: err.stack })
  });
});


module.exports = app;


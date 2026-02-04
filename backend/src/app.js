const express = require("express");
const cors = require("cors");

const authRoutes = require("./routes/auth.routes");

const app = express();
const router = express.Router();
const authController = require("../src/controllers/auth.controller");
const ticketRoutes = require("./routes/ticket.routes");
const commentRoutes = require("./routes/comment.routes");
const attachmentRoutes = require("./routes/attachment.routes");
const feedbackRoutes = require("./routes/feedback.routes");
const intelligenceRoutes = require("./routes/intelligence.routes");
const chatbotRoutes = require("./routes/chatbot.routes");


app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.send("API running");
});
router.post("/register", authController.register);
router.post("/login", authController.login);

app.use("/api/auth", authRoutes);
app.use("/api/tickets", ticketRoutes);
app.use("/api/comments", commentRoutes);
app.use("/api/attachments", attachmentRoutes);
app.use("/api/feedback", feedbackRoutes);
app.use("/api/intelligence", intelligenceRoutes);
app.use("/api/chat", chatbotRoutes);

module.exports = app;

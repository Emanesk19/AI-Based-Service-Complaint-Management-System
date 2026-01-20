const express = require("express");
const cors = require("cors");

const authRoutes = require("./routes/auth.routes");

const app = express();
const router = express.Router();
const authController = require("../src/controllers/auth.controller");
const ticketRoutes = require("./routes/ticket.routes");

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.send("API running");
});
router.post("/register", authController.register);
router.post("/login", authController.login);

app.use("/api/auth", authRoutes);
app.use("/api/tickets", ticketRoutes);


module.exports = app;

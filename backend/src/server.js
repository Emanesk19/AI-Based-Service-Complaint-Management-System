require("dotenv").config();

const app = require("./app");
const cronService = require("./services/cron.service");
const socketService = require("./services/socket.service");
const http = require("http");

const server = http.createServer(app);

// Initialize services
cronService.startWeeklyReportJob();
socketService.init(server);

const PORT = 5000 || 5001;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
setInterval(() => {
  console.log("Server alive...");
}, 10000);


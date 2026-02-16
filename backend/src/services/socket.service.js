const { Server } = require("socket.io");
const jwt = require("jsonwebtoken");

let io;

/**
 * Initialize Socket.io
 * @param {object} server - HTTP server instance
 */
const init = (server) => {
  io = new Server(server, {
    cors: {
      origin: "*", // Adjust for production
      methods: ["GET", "POST"]
    }
  });

  // Authentication Middleware for Sockets
  io.use((socket, next) => {
    const token = socket.handshake.auth.token;
    if (!token) {
      return next(new Error("Authentication error: Token missing"));
    }

    try {
      const decoded = jwt.verify(token, "SUPER_SECRET_KEY");
      socket.user = decoded;
      next();
    } catch (err) {
      next(new Error("Authentication error: Invalid token"));
    }
  });

  io.on("connection", (socket) => {
    console.log(`User connected: ${socket.user.id} (Role: ${socket.user.role})`);

    // Join a private room for the user
    socket.join(`user_${socket.user.id}`);

    // Join role-based rooms
    if (socket.user.role === "admin" || socket.user.role === "agent") {
      socket.join("agents");
    }

    socket.on("disconnect", () => {
      console.log(`User disconnected: ${socket.user.id}`);
    });
  });

  return io;
};

/**
 * Get Socket.io instance
 */
const getIO = () => {
  if (!io) {
    throw new Error("Socket.io not initialized!");
  }
  return io;
};

/**
 * Emit event to a specific user
 */
const emitToUser = (userId, event, data) => {
  if (io) {
    io.to(`user_${userId}`).emit(event, data);
  }
};

/**
 * Emit event to all agents
 */
const emitToAgents = (event, data) => {
  if (io) {
    io.to("agents").emit(event, data);
  }
};

/**
 * Broadcast event
 */
const broadcast = (event, data) => {
  if (io) {
    io.emit(event, data);
  }
};

module.exports = {
  init,
  getIO,
  emitToUser,
  emitToAgents,
  broadcast
};

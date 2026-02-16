const prisma = require("../services/prisma");
const notificationService = require("../services/notification.service");
const socketService = require("../services/socket.service");

exports.addComment = async (req, res) => {
  try {
    const { ticketId, content } = req.body;
    const userId = req.user.id;
    // const userRole = req.user.role; // This line is removed as per the instruction

    const comment = await prisma.comment.create({
      data: {
        content,
        ticketId: parseInt(ticketId),
        userId,
      },
      include: { user: { select: { name: true } } }
    });

    // Real-time Update
    socketService.broadcast("new_comment", { ticketId, comment });

    // Notify other party
    const ticket = await prisma.ticket.findUnique({
      where: { id: parseInt(ticketId) },
      select: { userId: true, agentId: true, title: true }
    });

    if (ticket) {
      const recipientId = (userId === ticket.userId) ? ticket.agentId : ticket.userId;
      
      if (recipientId) {
        await notificationService.createNotification(
          recipientId,
          "NEW_COMMENT",
          "New Comment on Ticket",
          `${req.user.name} added a comment to "${ticket.title}".`,
          ticketId
        );
      }
    }

    res.status(201).json(comment);
  } catch (error) {
    console.error("Add comment error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

exports.getCommentsByTicket = async (req, res) => {
  const ticketId = parseInt(req.params.ticketId);

  const comments = await prisma.comment.findMany({
    where: { ticketId },
    include: { user: { select: { name: true, role: true } } },
    orderBy: { createdAt: "asc" },
  });

  res.json(comments);
};

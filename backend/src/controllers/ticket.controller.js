const prisma = require("../services/prisma");

exports.createTicket = async (req, res) => {
  try {
    const { title, description, category, priority } = req.body;
    const userId = req.user.id;

    const ticket = await prisma.ticket.create({
      data: {
        title,
        description,
        category,
        priority,
        status: "New",
        user: {
          connect: { id: userId }
        }
      }
    });

    res.status(201).json({
      message: "Ticket created successfully",
      ticket
    });
  } catch (error) {
    console.error("Create ticket error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

exports.getMyTickets = async (req, res) => {
  try {
    const userId = req.user.id;

    const tickets = await prisma.ticket.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" }
    });

    res.json(tickets);
  } catch (error) {
    console.error("Get tickets error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};
exports.assignTicket = async (req, res) => {
  try {
    const { ticketId, agentId } = req.body;

    const ticket = await prisma.ticket.update({
      where: { id: ticketId },
      data: {
        agent: {
          connect: { id: agentId }
        },
        status: "In Progress"
      }
    });

    res.json({
      message: "Ticket assigned successfully",
      ticket
    });
  } catch (error) {
    console.error("Assign ticket error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

exports.getAssignedTickets = async (req, res) => {
  try {
    const agentId = req.user.id;

    const tickets = await prisma.ticket.findMany({
      where: { agentId },
      orderBy: { createdAt: "desc" }
    });

    res.json(tickets);
  } catch (error) {
    console.error("Get assigned tickets error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

exports.updateTicketStatus = async (req, res) => {
  try {
    const { ticketId, status } = req.body;

    const ticket = await prisma.ticket.update({
      where: { id: ticketId },
      data: { status }
    });

    res.json({
      message: "Ticket status updated",
      ticket
    });
  } catch (error) {
    console.error("Update status error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

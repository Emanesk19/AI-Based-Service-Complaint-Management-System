const prisma = require("../services/prisma");
const calculateSLA = (priority) => {
  switch (priority) {
    case "High":
      return 24;
    case "Medium":
      return 72;
    case "Low":
      return 120;
    default:
      return 72;
  }
};

exports.createTicket = async (req, res) => {
  try {
    const { title, description, category, priority } = req.body;
    const userId = req.user.id;

    const slaHours = calculateSLA(priority);
    const dueDate = new Date(Date.now() + slaHours * 60 * 60 * 1000);

    const ticket = await prisma.ticket.create({
      data: {
        title,
        description,
        category,
        priority,
        status: "New",
        slaHours,
        dueDate,
        user: { connect: { id: userId } },
      },
    });

    res.status(201).json({
      message: "Ticket created with SLA",
      ticket,
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

exports.getOverdueTickets = async (req, res) => {
  try {
    const now = new Date();

    const tickets = await prisma.ticket.findMany({
      where: {
        dueDate: { lt: now },
        status: { not: "Resolved" },
      },
      orderBy: { dueDate: "asc" },
    });

    res.json(tickets);
  } catch (error) {
    console.error("Overdue tickets error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

exports.closeTicket = async (req, res) => {
  try {
    const { ticketId, closeReason } = req.body;

    const ticket = await prisma.ticket.update({
      where: { id: ticketId },
      data: {
        status: "Resolved",
        closeReason,
        closedAt: new Date(),
      },
    });

    res.json({
      message: "Ticket closed successfully",
      ticket,
    });
  } catch (error) {
    console.error("Close ticket error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};


exports.reopenTicket = async (req, res) => {
  try {
    const { ticketId } = req.body;

    const ticket = await prisma.ticket.update({
      where: { id: ticketId },
      data: {
        status: "Reopened",
        closedAt: null,
        closeReason: null,
      },
    });

    res.json({
      message: "Ticket reopened",
      ticket,
    });
  } catch (error) {
    console.error("Reopen ticket error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

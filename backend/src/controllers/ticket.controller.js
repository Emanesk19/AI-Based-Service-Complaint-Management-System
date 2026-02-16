const prisma = require("../services/prisma");
const activityService = require("../services/activity.service");
const notificationService = require("../services/notification.service");
const emailService = require("../services/email.service");
const socketService = require("../services/socket.service");
const intelligenceService = require("../services/intelligence.service");
const automationService = require("../services/automation.service");
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

    // AI Auto-Pilot: Enrich ticket with category, priority, and sentiment
    const enrichedData = await automationService.enrichTicket({ title, description, category, priority });

    const slaHours = calculateSLA(enrichedData.priority);
    const dueDate = new Date(Date.now() + slaHours * 60 * 60 * 1000);

    const ticket = await prisma.ticket.create({
      data: {
        title: enrichedData.title,
        description: enrichedData.description,
        category: enrichedData.category,
        priority: enrichedData.priority,
        metadata: enrichedData.metadata,
        status: "New",
        slaHours,
        dueDate,
        user: { connect: { id: userId } },
      },
    });

    // Log Activity
    await activityService.logActivity(ticket.id, userId, "TICKET_CREATED", null, "New");

    // Email Alert for High Priority
    if (priority === "High") {
      const admins = await prisma.user.findMany({ where: { role: "admin" }, select: { email: true } });
      if (admins.length > 0) {
        await emailService.sendHighPriorityAlert(admins.map(a => a.email).join(","), title, ticket.id);
      }
    }

    res.status(201).json({
      message: "Ticket created with SLA",
      ticket,
    });
  } catch (error) {
    console.error("Create ticket error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

/**
 * Get all tickets with pagination, filtering, and relations
 * GET /api/tickets/all?page=1&limit=10&status=New&priority=High&category=IT&search=keyword
 */
exports.getAllTickets = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      status,
      priority,
      category,
      search,
      sortBy = "createdAt",
      order = "desc"
    } = req.query;

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    // Build filter object
    const where = {};

    if (status) where.status = status;
    if (priority) where.priority = priority;
    if (category) where.category = category;

    // Search in title and description
    if (search) {
      where.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } }
      ];
    }

    // Get total count for pagination
    const total = await prisma.ticket.count({ where });

    // Get tickets with relations
    const tickets = await prisma.ticket.findMany({
      where,
      skip,
      take: limitNum,
      orderBy: { [sortBy]: order },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true
          }
        },
        agent: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true
          }
        },
        comments: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true
              }
            }
          },
          orderBy: { createdAt: "desc" }
        },
        attachments: true
      }
    });

    res.json({
      tickets,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum)
      }
    });
  } catch (error) {
    console.error("Get all tickets error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

/**
 * Get single ticket by ID with all relations
 * GET /api/tickets/:id
 */
exports.getTicketById = async (req, res) => {
  try {
    const ticketId = parseInt(req.params.id);

    const ticket = await prisma.ticket.findUnique({
      where: { id: ticketId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true
          }
        },
        agent: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true
          }
        },
        comments: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true
              }
            }
          },
          orderBy: { createdAt: "desc" }
        },
        attachments: {
          orderBy: { uploadedAt: "desc" }
        },
        feedbacks: true
      }
    });

    if (!ticket) {
      return res.status(404).json({ message: "Ticket not found" });
    }

    res.json(ticket);
  } catch (error) {
    console.error("Get ticket by ID error:", error);
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

/**
 * Universal get tickets for base route
 * Users get their own, Agents get all (simple array)
 */
exports.getTickets = async (req, res) => {
  try {
    const userId = req.user.id;
    const role = req.user.role;

    if (role === 'agent' || role === 'admin') {
      const tickets = await prisma.ticket.findMany({
        orderBy: { createdAt: "desc" },
        include: {
          user: { select: { name: true, email: true } }
        }
      });
      return res.json(tickets);
    }

    const tickets = await prisma.ticket.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" }
    });

    res.json(tickets);
  } catch (error) {
    console.error("Get universal tickets error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};
exports.assignTicket = async (req, res) => {
  try {
    const { ticketId, agentId } = req.body;

    const ticket = await prisma.ticket.update({
      where: { id: parseInt(ticketId) },
      data: {
        agent: {
          connect: { id: parseInt(agentId) }
        },
        status: "In Progress"
      }
    });

    // Log Activity
    await activityService.logActivity(parseInt(ticketId), req.user.id, "ASSIGNED", null, agentId);

    // Notify User
    await notificationService.createNotification(
      ticket.userId,
      "TICKET_ASSIGNED",
      "Ticket Assigned",
      `Your ticket "${ticket.title}" has been assigned to an agent.`,
      ticketId
    );

    // Notify Agent
    await notificationService.createNotification(
      agentId,
      "TICKET_ASSIGNED",
      "New Ticket Assigned",
      `You have been assigned to ticket "${ticket.title}".`,
      ticketId
    );

    // Email Notification
    const user = await prisma.user.findUnique({ where: { id: ticket.userId }, select: { email: true } });
    if (user) {
      await emailService.sendAssignmentEmail(user.email, ticket.title, ticketId);
    }

    // Real-time Update
    socketService.broadcast("ticket_updated", { ticketId, status: "In Progress", agentId });

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
      where: { id: parseInt(ticketId) },
      data: { status }
    });

    // Log Activity
    await activityService.logActivity(parseInt(ticketId), req.user.id, "STATUS_CHANGE", null, status);

    // Notify User
    await notificationService.createNotification(
      ticket.userId,
      "STATUS_UPDATE",
      "Ticket Status Updated",
      `Your ticket "${ticket.title}" status has been changed to ${status}.`,
      ticketId
    );

    // Email Notification
    const user = await prisma.user.findUnique({ where: { id: ticket.userId }, select: { email: true } });
    if (user) {
      await emailService.sendStatusUpdateEmail(user.email, ticket.title, ticketId, status);
    }

    // Real-time Update
    socketService.broadcast("ticket_updated", { ticketId, status });

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
      where: { id: parseInt(ticketId) },
      data: {
        status: "Resolved",
        closeReason,
        closedAt: new Date(),
      },
    });

    // Log Activity
    await activityService.logActivity(parseInt(ticketId), req.user.id, "RESOLVED", null, closeReason);

    // Notify User
    await notificationService.createNotification(
      ticket.userId,
      "STATUS_UPDATE",
      "Ticket Resolved",
      `Your ticket "${ticket.title}" has been resolved.`,
      ticketId
    );

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
      where: { id: parseInt(ticketId) },
      data: {
        status: "Reopened",
        closedAt: null,
        closeReason: null,
      },
    });

    // Log Activity
    await activityService.logActivity(parseInt(ticketId), req.user.id, "REOPENED", "Resolved", "Reopened");

    // Notify Agent (if assigned)
    if (ticket.agentId) {
      await notificationService.createNotification(
        ticket.agentId,
        "STATUS_UPDATE",
        "Ticket Reopened",
        `Ticket "${ticket.title}" has been reopened by the user.`,
        ticketId
      );
    }

    res.json({
      message: "Ticket reopened",
      ticket,
    });
  } catch (error) {
    console.error("Reopen ticket error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

const prisma = require("../services/prisma");

/**
 * Get overall system statistics summary
 * GET /api/stats/summary
 */
exports.getSummary = async (req, res) => {
  try {
    // Total tickets count
    const totalTickets = await prisma.ticket.count();

    // Count by status
    const openTickets = await prisma.ticket.count({
      where: {
        status: { in: ["New", "In Progress", "Pending", "Reopened"] }
      }
    });

    const resolvedTickets = await prisma.ticket.count({
      where: { status: "Resolved" }
    });

    // Overdue tickets (past due date and not resolved)
    const now = new Date();
    const overdueTickets = await prisma.ticket.count({
      where: {
        dueDate: { lt: now },
        status: { not: "Resolved" }
      }
    });

    // Average resolution time (in hours)
    const resolvedWithTimes = await prisma.ticket.findMany({
      where: {
        status: "Resolved",
        closedAt: { not: null }
      },
      select: {
        createdAt: true,
        closedAt: true
      }
    });

    let avgResolutionHours = 0;
    if (resolvedWithTimes.length > 0) {
      const totalHours = resolvedWithTimes.reduce((sum, ticket) => {
        const hours = (new Date(ticket.closedAt) - new Date(ticket.createdAt)) / (1000 * 60 * 60);
        return sum + hours;
      }, 0);
      avgResolutionHours = Math.round((totalHours / resolvedWithTimes.length) * 100) / 100;
    }

    // Count by priority
    const highPriorityCount = await prisma.ticket.count({
      where: { priority: "High", status: { not: "Resolved" } }
    });

    const mediumPriorityCount = await prisma.ticket.count({
      where: { priority: "Medium", status: { not: "Resolved" } }
    });

    const lowPriorityCount = await prisma.ticket.count({
      where: { priority: "Low", status: { not: "Resolved" } }
    });

    // Unassigned tickets
    const unassignedTickets = await prisma.ticket.count({
      where: {
        agentId: null,
        status: { not: "Resolved" }
      }
    });

    res.json({
      totalTickets,
      openTickets,
      resolvedTickets,
      overdueTickets,
      avgResolutionHours,
      priorityBreakdown: {
        high: highPriorityCount,
        medium: mediumPriorityCount,
        low: lowPriorityCount
      },
      unassignedTickets
    });
  } catch (error) {
    console.error("Stats summary error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

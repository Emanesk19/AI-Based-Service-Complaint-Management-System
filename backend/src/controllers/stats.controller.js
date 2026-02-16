const prisma = require("../services/prisma");

/**
 * Get overall system statistics summary
 * GET /api/stats/summary
 */
exports.getSummary = async (req, res) => {
  try {
    const userId = req.user.id;
    const role = req.user.role;

    // Determine filter: regular users see only their own stats
    const whereClause = (role === 'admin' || role === 'agent') ? {} : { userId };

    // Total tickets count
    const totalTickets = await prisma.ticket.count({ where: whereClause });

    // Count by status
    const openTickets = await prisma.ticket.count({
      where: {
        ...whereClause,
        status: { in: ["New", "In Progress", "Pending", "Reopened"] }
      }
    });

    const resolvedTickets = await prisma.ticket.count({
      where: { 
        ...whereClause,
        status: "Resolved" 
      }
    });

    // Overdue tickets (past due date and not resolved)
    const now = new Date();
    const overdueTickets = await prisma.ticket.count({
      where: {
        ...whereClause,
        dueDate: { lt: now },
        status: { not: "Resolved" }
      }
    });

    // Average resolution time (in hours)
    const resolvedWithTimes = await prisma.ticket.findMany({
      where: {
        ...whereClause,
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

    // Count by priority (for user, only show their own priorities)
    const priorityCounts = await prisma.ticket.groupBy({
      by: ["priority"],
      where: {
        ...whereClause,
        status: { not: "Resolved" }
      },
      _count: { id: true }
    });

    const priorityBreakdown = {
      high: priorityCounts.find(p => p.priority === "High")?._count.id || 0,
      medium: priorityCounts.find(p => p.priority === "Medium")?._count.id || 0,
      low: priorityCounts.find(p => p.priority === "Low")?._count.id || 0
    };

    // Unassigned tickets (for user, this might be less relevant but kept for consistency)
    const unassignedTickets = await prisma.ticket.count({
      where: {
        ...whereClause,
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
      priorityBreakdown,
      unassignedTickets
    });
  } catch (error) {
    console.error("Stats summary error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

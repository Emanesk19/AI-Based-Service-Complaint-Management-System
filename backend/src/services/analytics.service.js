const prisma = require("./prisma");

/**
 * Get comprehensive dashboard metrics
 * @param {string} userId - Optional userId to filter for personal stats
 */
async function getDashboardMetrics(userId = null) {
  console.log("Starting getDashboardMetrics...");
  try {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    // Overview stats
    console.log("Fetching overview stats...");
    const whereClause = userId ? { userId: parseInt(userId) } : {};

    const totalTickets = await prisma.ticket.count({ where: whereClause });
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
    const overdueTickets = await prisma.ticket.count({
      where: {
        ...whereClause,
        dueDate: { lt: now },
        status: { not: "Resolved" }
      }
    });

    // Recent activity (today)
    console.log("Fetching recent activity...");
    const ticketsCreatedToday = await prisma.ticket.count({
      where: { ...whereClause, createdAt: { gte: today } }
    });
    const ticketsResolvedToday = await prisma.ticket.count({
      where: {
        ...whereClause,
        status: "Resolved",
        closedAt: { gte: today }
      }
    });

    // Avg response time
    console.log("Fetching avg response time...");
    const ticketsWithComments = await prisma.ticket.findMany({
      where: {
        ...whereClause,
        comments: { some: {} }
      },
      select: {
        createdAt: true,
        comments: {
          orderBy: { createdAt: "asc" },
          take: 1,
          select: { createdAt: true }
        }
      }
    });
    console.log(`Found ${ticketsWithComments.length} tickets with comments`);

    let avgResponseTime = 0;
    if (ticketsWithComments.length > 0) {
      const totalResponseTime = ticketsWithComments.reduce((sum, ticket) => {
        if (ticket.comments && ticket.comments.length > 0) {
          const firstComment = ticket.comments[0];
          const responseTime = (new Date(firstComment.createdAt) - new Date(ticket.createdAt)) / (1000 * 60 * 60);
          return sum + responseTime;
        }
        return sum;
      }, 0);
      avgResponseTime = Math.round((totalResponseTime / ticketsWithComments.length) * 100) / 100;
    }

    console.log("getDashboardMetrics calculations complete");

    // return the object... (rest of function continues)
    // We only replaced top half, need to return to match original structure or continue
    
    // Category distribution
    console.log("Fetching category distribution...");
    const categoryData = await prisma.ticket.groupBy({
      by: ["category"],
      where: whereClause,
      _count: { category: true }
    });
  
    const categoryDistribution = categoryData.map(item => ({
      category: item.category,
      count: item._count.category,
      percentage: Math.round((item._count.category / totalTickets) * 100 * 10) / 10
    }));
  
    // Priority stats
    console.log("Fetching priority stats...");
    const priorityData = await prisma.ticket.groupBy({
      by: ["priority", "status"],
      where: whereClause,
      _count: { id: true }
    });

    const priorityStats = {
      high: { total: 0, resolved: 0, pending: 0 },
      medium: { total: 0, resolved: 0, pending: 0 },
      low: { total: 0, resolved: 0, pending: 0 }
    };

    priorityData.forEach(item => {
      const p = item.priority.toLowerCase();
      if (priorityStats[p]) {
        priorityStats[p].total += item._count.id;
        if (item.status === "Resolved") {
          priorityStats[p].resolved += item._count.id;
        } else {
          priorityStats[p].pending += item._count.id;
        }
      }
    });
    
    // Recent tickets for the dashboard table
    console.log("Fetching recent tickets...");
    const recentTickets = await prisma.ticket.findMany({
      where: whereClause,
      take: 5,
      orderBy: { createdAt: "desc" },
      include: {
        user: { select: { name: true, email: true } },
        agent: { select: { name: true } }
      }
    });

    console.log("Finished getDashboardMetrics");
  
    return {
      overview: {
        totalTickets,
        openTickets,
        resolvedTickets,
        overdueTickets
      },
      recentActivity: {
        ticketsCreatedToday,
        ticketsResolvedToday,
        avgResponseTime
      },
      categoryDistribution,
      priorityStats,
      recentTickets
    };

  } catch (error) {
    console.error("Error in getDashboardMetrics:", error);
    throw error;
  }
}


/**
 * Get trend data for specified period
 * @param {string} period - "daily", "weekly", or "monthly"
 * @param {string} userId - Optional userId to filter for personal stats
 */
async function getTrendData(period = "weekly", userId = null) {
  const whereClause = userId ? { userId: parseInt(userId) } : {};
  const now = new Date();
  let intervals = [];
  let groupByFormat;

  if (period === "daily") {
    // Last 7 days
    for (let i = 6; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);
      const nextDate = new Date(date);
      nextDate.setDate(nextDate.getDate() + 1);
      
      intervals.push({
        label: date.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
        start: date,
        end: nextDate
      });
    }
  } else if (period === "weekly") {
    // Last 8 weeks
    for (let i = 7; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - (i * 7));
      date.setHours(0, 0, 0, 0);
      const endDate = new Date(date);
      endDate.setDate(endDate.getDate() + 7);
      
      intervals.push({
        label: `Week ${8 - i}`,
        start: date,
        end: endDate
      });
    }
  } else if (period === "monthly") {
    // Last 12 months
    for (let i = 11; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const endDate = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);
      
      intervals.push({
        label: date.toLocaleDateString("en-US", { month: "short", year: "numeric" }),
        start: date,
        end: endDate
      });
    }
  }

  const trendData = await Promise.all(
    intervals.map(async (interval) => {
      const created = await prisma.ticket.count({
        where: {
          ...whereClause,
          createdAt: {
            gte: interval.start,
            lt: interval.end
          }
        }
      });

      const resolved = await prisma.ticket.count({
        where: {
          ...whereClause,
          closedAt: {
            gte: interval.start,
            lt: interval.end
          },
          status: "Resolved"
        }
      });

      // Avg resolution time for this period
      const resolvedTickets = await prisma.ticket.findMany({
        where: {
          ...whereClause,
          closedAt: {
            gte: interval.start,
            lt: interval.end
          },
          status: "Resolved"
        },
        select: {
          createdAt: true,
          closedAt: true
        }
      });

      let avgResolutionTime = 0;
      if (resolvedTickets.length > 0) {
        const totalTime = resolvedTickets.reduce((sum, ticket) => {
          const time = (new Date(ticket.closedAt) - new Date(ticket.createdAt)) / (1000 * 60 * 60);
          return sum + time;
        }, 0);
        avgResolutionTime = Math.round((totalTime / resolvedTickets.length) * 10) / 10;
      }

      return {
        label: interval.label,
        created,
        resolved,
        avgResolutionTime
      };
    })
  );

  return {
    period,
    data: trendData
  };
}

/**
 * Get agent performance metrics
 */
async function getAgentPerformance() {
  const agents = await prisma.user.findMany({
    where: { role: "agent" },
    select: {
      id: true,
      name: true,
      assigned: {
        select: {
          id: true,
          status: true,
          createdAt: true,
          closedAt: true,
          feedbacks: {
            select: { rating: true }
          },
          dueDate: true
        }
      }
    }
  });

  const agentMetrics = agents.map(agent => {
    const activeTickets = agent.assigned.filter(t => t.status !== "Resolved").length;
    const resolvedTickets = agent.assigned.filter(t => t.status === "Resolved").length;

    // Avg resolution time
    const resolved = agent.assigned.filter(t => t.status === "Resolved" && t.closedAt);
    let avgResolutionTime = 0;
    if (resolved.length > 0) {
      const totalTime = resolved.reduce((sum, ticket) => {
        const time = (new Date(ticket.closedAt) - new Date(ticket.createdAt)) / (1000 * 60 * 60);
        return sum + time;
      }, 0);
      avgResolutionTime = Math.round((totalTime / resolved.length) * 10) / 10;
    }

    // Satisfaction score
    const feedbacks = agent.assigned.flatMap(t => t.feedbacks);
    let satisfactionScore = 0;
    if (feedbacks.length > 0) {
      const totalRating = feedbacks.reduce((sum, f) => sum + f.rating, 0);
      satisfactionScore = Math.round((totalRating / feedbacks.length) * 10) / 10;
    }

    // SLA compliance
    const completedTickets = agent.assigned.filter(t => t.closedAt);
    let slaComplianceRate = 0;
    if (completedTickets.length > 0) {
      const withinSLA = completedTickets.filter(t => {
        return t.dueDate && new Date(t.closedAt) <= new Date(t.dueDate);
      }).length;
      slaComplianceRate = Math.round((withinSLA / completedTickets.length) * 100 * 10) / 10;
    }

    return {
      agentId: agent.id,
      name: agent.name,
      activeTickets,
      resolvedTickets,
      avgResolutionTime,
      satisfactionScore,
      slaComplianceRate
    };
  });

  // Summary
  const totalAgents = agentMetrics.length;
  const avgResolutionTime = totalAgents > 0
    ? Math.round((agentMetrics.reduce((sum, a) => sum + a.avgResolutionTime, 0) / totalAgents) * 10) / 10
    : 0;
  const avgSatisfactionScore = totalAgents > 0
    ? Math.round((agentMetrics.reduce((sum, a) => sum + a.satisfactionScore, 0) / totalAgents) * 10) / 10
    : 0;

  return {
    agents: agentMetrics,
    summary: {
      totalAgents,
      avgResolutionTime,
      avgSatisfactionScore
    }
  };
}

/**
 * Get category breakdown analysis
 */
async function getCategoryBreakdown() {
  const categories = await prisma.ticket.groupBy({
    by: ["category"],
    _count: { category: true }
  });

  const categoryMetrics = await Promise.all(
    categories.map(async (cat) => {
      const totalTickets = cat._count.category;
      const resolvedTickets = await prisma.ticket.count({
        where: { category: cat.category, status: "Resolved" }
      });

      // Avg resolution time
      const resolved = await prisma.ticket.findMany({
        where: {
          category: cat.category,
          status: "Resolved",
          closedAt: { not: null }
        },
        select: {
          createdAt: true,
          closedAt: true
        }
      });

      let avgResolutionTime = 0;
      if (resolved.length > 0) {
        const totalTime = resolved.reduce((sum, ticket) => {
          const time = (new Date(ticket.closedAt) - new Date(ticket.createdAt)) / (1000 * 60 * 60);
          return sum + time;
        }, 0);
        avgResolutionTime = Math.round((totalTime / resolved.length) * 10) / 10;
      }

      // SLA breach rate
      const completedTickets = await prisma.ticket.findMany({
        where: {
          category: cat.category,
          closedAt: { not: null }
        },
        select: {
          closedAt: true,
          dueDate: true
        }
      });

      let slaBreachRate = 0;
      if (completedTickets.length > 0) {
        const breached = completedTickets.filter(t => {
          return t.dueDate && new Date(t.closedAt) > new Date(t.dueDate);
        }).length;
        slaBreachRate = Math.round((breached / completedTickets.length) * 100 * 10) / 10;
      }

      // Satisfaction score
      const feedbacks = await prisma.feedback.findMany({
        where: {
          ticket: { category: cat.category }
        },
        select: { rating: true }
      });

      let satisfactionScore = 0;
      if (feedbacks.length > 0) {
        const totalRating = feedbacks.reduce((sum, f) => sum + f.rating, 0);
        satisfactionScore = Math.round((totalRating / feedbacks.length) * 10) / 10;
      }

      return {
        category: cat.category,
        totalTickets,
        resolvedTickets,
        avgResolutionTime,
        slaBreachRate,
        satisfactionScore
      };
    })
  );

  return {
    categories: categoryMetrics
  };
}

/**
 * Get SLA compliance metrics
 */
async function getSLACompliance() {
  const now = new Date();

  // Overall compliance
  const totalTickets = await prisma.ticket.count({
    where: { closedAt: { not: null } }
  });

  const ticketsWithDueDate = await prisma.ticket.findMany({
    where: {
      closedAt: { not: null },
      dueDate: { not: null }
    },
    select: {
      closedAt: true,
      dueDate: true,
      priority: true
    }
  });

  const withinSLA = ticketsWithDueDate.filter(t => {
    return new Date(t.closedAt) <= new Date(t.dueDate);
  }).length;

  const breached = ticketsWithDueDate.length - withinSLA;
  const complianceRate = ticketsWithDueDate.length > 0
    ? Math.round((withinSLA / ticketsWithDueDate.length) * 100 * 10) / 10
    : 0;

  // By priority
  const priorities = ["High", "Medium", "Low"];
  const byPriority = {};

  for (const priority of priorities) {
    const priorityTickets = ticketsWithDueDate.filter(t => t.priority === priority);
    const priorityWithinSLA = priorityTickets.filter(t => {
      return new Date(t.closedAt) <= new Date(t.dueDate);
    }).length;

    const priorityComplianceRate = priorityTickets.length > 0
      ? Math.round((priorityWithinSLA / priorityTickets.length) * 100 * 10) / 10
      : 0;

    byPriority[priority] = {
      total: priorityTickets.length,
      withinSLA: priorityWithinSLA,
      complianceRate: priorityComplianceRate
    };
  }

  // At-risk tickets (not resolved, approaching SLA)
  const atRiskTickets = await prisma.ticket.findMany({
    where: {
      status: { not: "Resolved" },
      dueDate: { not: null }
    },
    select: {
      id: true,
      title: true,
      priority: true,
      dueDate: true
    },
    orderBy: { dueDate: "asc" },
    take: 10
  });

  const atRisk = atRiskTickets.map(ticket => {
    const hoursRemaining = (new Date(ticket.dueDate) - now) / (1000 * 60 * 60);
    return {
      ticketId: ticket.id,
      title: ticket.title,
      hoursRemaining: Math.round(hoursRemaining * 10) / 10,
      priority: ticket.priority
    };
  }).filter(t => t.hoursRemaining <= 24); // Only show tickets within 24 hours

  return {
    overall: {
      totalTickets: ticketsWithDueDate.length,
      withinSLA,
      breached,
      complianceRate
    },
    byPriority,
    atRisk
  };
}

module.exports = {
  getDashboardMetrics,
  getTrendData,
  getAgentPerformance,
  getCategoryBreakdown,
  getSLACompliance
};

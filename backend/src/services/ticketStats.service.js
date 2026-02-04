const prisma = require("./prisma");

// Basic historical stats from your own DB (no ML)
async function getStats() {
  const total = await prisma.ticket.count();

  const resolved = await prisma.ticket.count({
    where: { status: "Resolved" },
  });

  const reopened = await prisma.ticket.count({
    where: { status: "Reopened" },
  });

  // Average resolution time (hours) for resolved tickets
  const resolvedTickets = await prisma.ticket.findMany({
    where: { status: "Resolved", closedAt: { not: null } },
    select: { createdAt: true, closedAt: true, category: true, priority: true },
    take: 500, // safety cap
  });

  let avgResolutionHours = null;
  if (resolvedTickets.length > 0) {
    const hours = resolvedTickets.map(t =>
      (new Date(t.closedAt) - new Date(t.createdAt)) / (1000 * 60 * 60)
    );
    avgResolutionHours = hours.reduce((a, b) => a + b, 0) / hours.length;
  }

  // Feedback stats
  const feedback = await prisma.feedback.findMany({
    select: { rating: true },
    take: 500,
  });

  let avgFeedback = null;
  if (feedback.length > 0) {
    avgFeedback = feedback.reduce((a, b) => a + b.rating, 0) / feedback.length;
  }

  return {
    total,
    resolved,
    reopened,
    resolutionRate: total > 0 ? resolved / total : 0,
    reopenRate: total > 0 ? reopened / total : 0,
    avgResolutionHours,
    avgFeedback,
  };
}


async function getAgentWorkload() {
  const agents = await prisma.user.findMany({
    where: { role: "agent" },
    select: { id: true, name: true },
  });

  const workloads = {};

  for (const agent of agents) {
    const activeCount = await prisma.ticket.count({
      where: {
        agentId: agent.id,
        status: { not: "Resolved" },
      },
    });

    workloads[agent.id] = {
      name: agent.name,
      activeTickets: activeCount,
      overloaded: activeCount >= 5, // threshold
    };
  }

  return workloads;
}
async function getCategoryStats() {
  const tickets = await prisma.ticket.findMany({
    select: {
      category: true,
      status: true,
      closedAt: true,
      createdAt: true,
    },
  });

  const stats = {};

  for (const t of tickets) {
    if (!stats[t.category]) {
      stats[t.category] = {
        total: 0,
        resolved: 0,
        avgResolutionHours: 0,
        times: [],
      };
    }

    stats[t.category].total++;

    if (t.status === "Resolved" && t.closedAt) {
      stats[t.category].resolved++;
      stats[t.category].times.push(
        (new Date(t.closedAt) - new Date(t.createdAt)) / (1000 * 60 * 60)
      );
    }
  }

  for (const c in stats) {
    const times = stats[c].times;
    stats[c].avgResolutionHours =
      times.length > 0
        ? times.reduce((a, b) => a + b, 0) / times.length
        : null;
  }

  return stats;
}

module.exports = {
  getStats,
  getAgentWorkload,
  getCategoryStats,
};

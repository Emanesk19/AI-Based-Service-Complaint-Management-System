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

module.exports = { getStats };

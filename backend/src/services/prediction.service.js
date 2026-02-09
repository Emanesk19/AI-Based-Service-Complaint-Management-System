const prisma = require("./prisma");

/**
 * Predict resolution time for a ticket based on category and priority averages
 * @param {number} ticketId 
 */
async function predictResolutionTime(ticketId) {
  const ticket = await prisma.ticket.findUnique({
    where: { id: parseInt(ticketId) },
    select: { category: true, priority: true }
  });

  if (!ticket) throw new Error("Ticket not found");

  // Get historical data for same category and priority
  const historicalTickets = await prisma.ticket.findMany({
    where: {
      category: ticket.category,
      priority: ticket.priority,
      status: "Resolved",
      closedAt: { not: null }
    },
    select: {
      createdAt: true,
      closedAt: true
    }
  });

  if (historicalTickets.length === 0) {
    return {
      prediction: null,
      message: "Not enough historical data for this category and priority combination.",
      confidence: "low"
    };
  }

  // Calculate average resolution time in hours
  const totalResolutionTime = historicalTickets.reduce((acc, t) => {
    const diff = new Date(t.closedAt) - new Date(t.createdAt);
    return acc + diff;
  }, 0);

  const avgMs = totalResolutionTime / historicalTickets.length;
  const avgHours = Math.round(avgMs / (1000 * 60 * 60) * 10) / 10;

  return {
    prediction: avgHours,
    unit: "hours",
    sampleSize: historicalTickets.length,
    confidence: historicalTickets.length > 5 ? "high" : "medium"
  };
}

/**
 * Recommend top agents for a ticket based on expertise, workload, and performance
 * @param {number} ticketId 
 */
async function recommendAgent(ticketId) {
  const ticket = await prisma.ticket.findUnique({
    where: { id: parseInt(ticketId) },
    select: { category: true }
  });

  if (!ticket) throw new Error("Ticket not found");

  // Get all active agents
  const agents = await prisma.user.findMany({
    where: { role: "agent", isActive: true },
    select: {
      id: true,
      name: true,
      email: true,
      _count: {
        select: {
          assigned: {
            where: { status: { not: "Resolved" } } // Workload: current open tickets
          }
        }
      }
    }
  });

  if (agents.length === 0) return [];

  const recommendations = await Promise.all(agents.map(async (agent) => {
    // Expertise: resolved tickets in this category
    const resolvedInCategory = await prisma.ticket.count({
      where: {
        agentId: agent.id,
        category: ticket.category,
        status: "Resolved"
      }
    });

    // Performance: avg resolution time (general)
    const resolvedByAgent = await prisma.ticket.findMany({
      where: {
        agentId: agent.id,
        status: "Resolved",
        closedAt: { not: null }
      },
      select: { createdAt: true, closedAt: true }
    });

    let avgTime = 0;
    if (resolvedByAgent.length > 0) {
      const totalTime = resolvedByAgent.reduce((acc, t) => acc + (new Date(t.closedAt) - new Date(t.createdAt)), 0);
      avgTime = totalTime / (resolvedByAgent.length * 1000 * 60 * 60);
    }

    // Scoring: Expertise (0-100) - Workload (0-100) - Performance (0-100 if time is high)
    // Simple score: (resolvedInCategory * 10) - (currentWorkload * 5)
    // Higher expertise = higher score. Higher workload = lower score.
    const workload = agent._count.assigned;
    const score = (resolvedInCategory * 10) - (workload * 5);

    return {
      agentId: agent.id,
      name: agent.name,
      expertiseScore: resolvedInCategory,
      currentWorkload: workload,
      avgResolutionTime: Math.round(avgTime * 10) / 10,
      totalScore: score
    };
  }));

  // Sort by total score descending
  return recommendations.sort((a, b) => b.totalScore - a.totalScore).slice(0, 3);
}

/**
 * Identify recurring topics/clusters (simple keyword frequency for now)
 */
async function getTicketClusters() {
  const recentTickets = await prisma.ticket.findMany({
    take: 100,
    orderBy: { createdAt: "desc" },
    select: { title: true }
  });

  const wordFreq = {};
  const stopWords = new Set(["the", "a", "is", "in", "it", "to", "for", "with", "on", "at", "by", "from", "up", "about", "issue", "problem", "ticket"]);

  recentTickets.forEach(t => {
    const words = t.title.toLowerCase().split(/\W+/);
    words.forEach(w => {
      if (w.length > 3 && !stopWords.has(w)) {
        wordFreq[w] = (wordFreq[w] || 0) + 1;
      }
    });
  });

  const clusters = Object.entries(wordFreq)
    .map(([keyword, count]) => ({ keyword, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  return clusters;
}

module.exports = {
  predictResolutionTime,
  recommendAgent,
  getTicketClusters
};

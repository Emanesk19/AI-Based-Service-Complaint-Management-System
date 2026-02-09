const prisma = require("./prisma");
const ticketStats = require("./ticketStats.service");
const intelligence = require("./intelligence.service");

async function getTopRiskyTickets(limit = 10) {
  const tickets = await prisma.ticket.findMany({
    where: { status: { not: "Resolved" } },
    take: 200, // safety cap
    orderBy: { createdAt: "desc" },
  });

  const stats = await ticketStats.getStats();
  const workloads = await ticketStats.getAgentWorkload();
  stats.categoryStats = await ticketStats.getCategoryStats();

  const scored = tickets.map(t => {
    const { score, reasoning, confidence } =
      intelligence.calculateRiskScore(t, stats, workloads);
    return {
      id: t.id,
      title: t.title || "(no title)",
      status: t.status,
      priority: t.priority,
      dueDate: t.dueDate,
      riskScore: score,
      confidence,
      reasons: reasoning.slice(0, 3),
    };
  });

  scored.sort((a, b) => b.riskScore - a.riskScore);
  return scored.slice(0, limit);
}

module.exports = { getTopRiskyTickets };
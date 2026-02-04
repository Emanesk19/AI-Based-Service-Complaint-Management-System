const prisma = require("../services/prisma");
const intelligence = require("../services/intelligence.service");
const ticketStats = require("../services/ticketStats.service");

exports.analyzeTicket = async (req, res) => {
  try {
    const ticketId = parseInt(req.params.ticketId);

    const ticket = await prisma.ticket.findUnique({ where: { id: ticketId } });
    if (!ticket) return res.status(404).json({ message: "Ticket not found" });

    const stats = await ticketStats.getStats();

    const { score, reasoning, confidence } = intelligence.calculateRiskScore(ticket, stats);
    const slaRisk = intelligence.predictSlaBreach(score);
    const recommendations = intelligence.generateRecommendation(ticket, score);

    res.json({
      ticketId: ticket.id,
      riskScore: score,
      slaBreachRisk: slaRisk,
      confidence,
      reasoning,
      recommendations,
      statsSnapshot: {
        totalTickets: stats.total,
        reopenRate: stats.reopenRate,
        avgResolutionHours: stats.avgResolutionHours,
        avgFeedback: stats.avgFeedback,
      },
    });
  } catch (error) {
    console.error("Intelligence error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

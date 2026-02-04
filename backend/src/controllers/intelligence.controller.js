const prisma = require("../services/prisma");
const intelligence = require("../services/intelligence.service");

exports.analyzeTicket = async (req, res) => {
  try {
    const ticketId = parseInt(req.params.ticketId);

    const ticket = await prisma.ticket.findUnique({
      where: { id: ticketId },
    });

    if (!ticket) {
      return res.status(404).json({ message: "Ticket not found" });
    }

    const riskScore = intelligence.calculateRiskScore(ticket);
    const slaRisk = intelligence.predictSlaBreach(riskScore);
    const recommendations = intelligence.generateRecommendation(
      ticket,
      riskScore
    );

    res.json({
      ticketId: ticket.id,
      riskScore,
      slaBreachRisk: slaRisk,
      recommendations,
    });
  } catch (error) {
    console.error("Intelligence error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

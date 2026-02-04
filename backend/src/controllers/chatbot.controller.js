const prisma = require("../services/prisma");
const chatbot = require("../services/chatbot.service");
const intelligence = require("../services/intelligence.service");
const ticketStats = require("../services/ticketStats.service");

exports.chat = async (req, res) => {
  try {
    const { message } = req.body;
    const user = req.user;

    if (!message) {
      return res.status(400).json({ reply: "Please enter a message." });
    }

    const { intent } = chatbot.parseIntent(message);
    const ticketId = chatbot.extractTicketId(message);

    // Greeting
    if (intent === "greeting") {
      return res.json({
        reply: `Hello ${user.name}. How can I assist you today?`,
      });
    }

    // Ticket-based intents
    if (
      ["ticket_status", "ticket_delay", "ticket_risk"].includes(intent)
    ) {
      if (!ticketId) {
        return res.json({
          reply: "Please specify the ticket number.",
        });
      }

      const ticket = await prisma.ticket.findUnique({
        where: { id: ticketId },
      });

      if (!ticket) {
        return res.json({
          reply: `I could not find ticket ${ticketId}.`,
        });
      }

      const stats = await ticketStats.getStats();
      const workloads = await ticketStats.getAgentWorkload();
      stats.categoryStats = await ticketStats.getCategoryStats();

      const { score, reasoning } =
        intelligence.calculateRiskScore(ticket, stats, workloads);

      if (intent === "ticket_status") {
        return res.json({
          reply: `Ticket ${ticketId} is currently '${ticket.status}' with priority '${ticket.priority}'.`,
        });
      }

      if (intent === "ticket_risk" || intent === "ticket_delay") {
        return res.json({
          reply: `Ticket ${ticketId} is considered high risk (${score}/100). Reasons: ${reasoning.join(
            "; "
          )}.`,
        });
      }
    }

    // Agent priority
    if (intent === "agent_priority" && user.role === "agent") {
      const tickets = await prisma.ticket.findMany({
        where: {
          agentId: user.id,
          status: { not: "Resolved" },
        },
      });

      if (tickets.length === 0) {
        return res.json({
          reply: "You have no active tickets assigned.",
        });
      }

      return res.json({
        reply: `You have ${tickets.length} active tickets. Focus on high priority and overdue ones first.`,
      });
    }

    // Fallback
    return res.json({
      reply:
        "I am not sure how to help with that yet. Try asking about ticket status or risk.",
    });
  } catch (error) {
    console.error("Chatbot error:", error);
    res.status(500).json({ reply: "Internal chatbot error." });
  }
};

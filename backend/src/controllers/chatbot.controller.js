const prisma = require("../services/prisma");
const chatbot = require("../services/chatbot.service");
const intelligence = require("../services/intelligence.service");
const ticketStats = require("../services/ticketStats.service");
const chatSession = require("../services/chatSession.service");

exports.chat = async (req, res) => {
  try {
    const { sessionId, message } = req.body;
    const user = req.user;

    if (!sessionId) {
      return res.status(400).json({ reply: "sessionId is required. Create a session first." });
    }
    if (!message) {
      return res.status(400).json({ reply: "Please enter a message." });
    }

    // Validate session ownership + load state
    const session = await chatSession.getSessionOrThrow(Number(sessionId), user.id);
    const state = session.state;

    // Save user's message
    await chatSession.addMessage(session.id, "user", message);

    // Parse intent + try to extract ticketId
    const { intent } = chatbot.parseIntent(message);
    let ticketId = chatbot.extractTicketId(message);

    // If not provided, use memory
    if (!ticketId && state?.lastTicketId) ticketId = state.lastTicketId;

    // Helper to reply + store assistant message
    const sendReply = async (reply, statePatch = null) => {
      await chatSession.addMessage(session.id, "assistant", reply);
      if (statePatch) await chatSession.updateState(session.id, statePatch);
      return res.json({ reply });
    };

    // Greeting
    if (intent === "greeting") {
      return sendReply(`Hello ${user.name}. How can I assist you today?`, {
        lastIntent: "greeting",
      });
    }

    // Ticket-based intents
    if (["ticket_status", "ticket_delay", "ticket_risk"].includes(intent)) {
      if (!ticketId) {
        return sendReply("Please specify the ticket number (e.g., 'ticket 2').", {
          lastIntent: intent,
        });
      }

      const ticket = await prisma.ticket.findUnique({ where: { id: ticketId } });
      if (!ticket) {
        return sendReply(`I could not find ticket ${ticketId}.`, {
          lastIntent: intent,
          lastTicketId: null,
        });
      }

      // Update memory with last ticket
      await chatSession.updateState(session.id, {
        lastTicketId: ticketId,
        lastIntent: intent,
      });

      if (intent === "ticket_status") {
        return sendReply(
          `Ticket ${ticketId} is currently '${ticket.status}' with priority '${ticket.priority}'.`
        );
      }

      // Intelligence
      const stats = await ticketStats.getStats();
      const workloads = await ticketStats.getAgentWorkload();
      stats.categoryStats = await ticketStats.getCategoryStats();

      const { score, reasoning, confidence } =
        intelligence.calculateRiskScore(ticket, stats, workloads);

      return sendReply(
        `Ticket ${ticketId} risk is ${score}/100 (confidence ${(confidence * 100).toFixed(
          0
        )}%). Reasons: ${reasoning.join("; ")}.`
      );
    }

    // Agent “what should I work on”
    if (intent === "agent_priority") {
      if (user.role !== "agent") {
        return sendReply("This command is available for agents only.");
      }

      const myTickets = await prisma.ticket.findMany({
        where: { agentId: user.id, status: { not: "Resolved" } },
        orderBy: { dueDate: "asc" },
      });

      if (myTickets.length === 0) {
        return sendReply("You have no active tickets assigned.");
      }

      // Simple suggestion (we'll make it smarter in next step)
      return sendReply(
        `You have ${myTickets.length} active tickets. Start with the oldest due date and any High priority tickets.`
      );
    }

    // Fallback
    return sendReply(
      "I’m not sure yet. Try: 'status of ticket 2', 'is ticket 2 at risk?', or 'why is ticket 2 delayed?'."
    );
  } catch (error) {
    console.error("Chatbot error:", error);
    res.status(error.status || 500).json({ reply: error.message || "Internal chatbot error." });
  }
};

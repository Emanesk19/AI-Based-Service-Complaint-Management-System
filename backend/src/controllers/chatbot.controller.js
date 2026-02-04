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
      return res
        .status(400)
        .json({ reply: "sessionId is required. Create a session first." });
    }

    if (!message) {
      return res.status(400).json({ reply: "Please enter a message." });
    }

    // ─────────────────────────────────────────────
    // 1️⃣ Load session + state
    // ─────────────────────────────────────────────
    const session = await chatSession.getSessionOrThrow(
      Number(sessionId),
      user.id
    );
    const state = session.state;

    // Save user message
    await chatSession.addMessage(session.id, "user", message);

    // Parse intent + ticketId
    const { intent } = chatbot.parseIntent(message);
    let ticketId = chatbot.extractTicketId(message);

    // Use memory if ticket not explicitly mentioned
    if (!ticketId && state?.lastTicketId) {
      ticketId = state.lastTicketId;
    }

    // Helper to reply
    const sendReply = async (reply, statePatch = null) => {
      await chatSession.addMessage(session.id, "assistant", reply);
      if (statePatch) {
        await chatSession.updateState(session.id, statePatch);
      }
      return res.json({ reply });
    };

    // ─────────────────────────────────────────────
    // 2️⃣ HANDLE CONFIRM / CANCEL FIRST
    // ─────────────────────────────────────────────
    if (state?.pendingAction) {
      if (intent === "confirm_action") {
        const action = JSON.parse(state.pendingAction);

        // ADD COMMENT
        if (action.type === "add_comment") {
          await prisma.comment.create({
            data: {
              ticketId: action.ticketId,
              userId: user.id,
              content: action.content,
            },
          });

          await chatSession.updateState(session.id, { pendingAction: null });

          return sendReply(
            `Comment added to ticket ${action.ticketId}.`
          );
        }

        // CLOSE TICKET
        if (action.type === "close_ticket") {
          await prisma.ticket.update({
            where: { id: action.ticketId },
            data: {
              status: "Resolved",
              closeReason: action.reason,
              closedAt: new Date(),
            },
          });

          await chatSession.updateState(session.id, { pendingAction: null });

          return sendReply(
            `Ticket ${action.ticketId} has been closed successfully.`
          );
        }
      }

      if (intent === "cancel_action") {
        await chatSession.updateState(session.id, { pendingAction: null });
        return sendReply("Action cancelled.");
      }

      return sendReply(
        "Please confirm by replying 'yes' or cancel with 'no'."
      );
    }

    // ─────────────────────────────────────────────
    // 3️⃣ ACTION INTENTS (CRITICAL SECTION)
    // ─────────────────────────────────────────────

    // ADD COMMENT
    if (intent === "add_comment") {
      if (!ticketId) {
        return sendReply("Please specify which ticket to comment on.");
      }

      const content = message
        .replace(/add comment|comment:/i, "")
        .trim();

      if (!content) {
        return sendReply("Please provide the comment text.");
      }

      await chatSession.updateState(session.id, {
        pendingAction: JSON.stringify({
          type: "add_comment",
          ticketId,
          content,
        }),
      });

      return sendReply(
        `Do you want me to add this comment to ticket ${ticketId}? (yes/no)`
      );
    }

    // CLOSE TICKET (AGENT ONLY)
    if (intent === "close_ticket") {
      if (user.role !== "agent") {
        return sendReply("Only agents can close tickets.");
      }

      if (!ticketId) {
        return sendReply("Please specify which ticket to close.");
      }

      const reason =
        message.replace(/close|resolve/i, "").trim() ||
        "Resolved via chatbot";

      await chatSession.updateState(session.id, {
        pendingAction: JSON.stringify({
          type: "close_ticket",
          ticketId,
          reason,
        }),
      });

      return sendReply(
        `I will close ticket ${ticketId} with reason: "${reason}". Confirm? (yes/no)`
      );
    }

    // ASSIGN TO ME (AGENT)
    if (intent === "assign_to_me") {
      if (user.role !== "agent") {
        return sendReply("Only agents can assign tickets.");
      }

      if (!ticketId) {
        return sendReply("Please specify which ticket.");
      }

      await prisma.ticket.update({
        where: { id: ticketId },
        data: { agentId: user.id },
      });

      return sendReply(`Ticket ${ticketId} has been assigned to you.`);
    }

    // ─────────────────────────────────────────────
    // 4️⃣ INFO INTENTS (STATUS / RISK)
    // ─────────────────────────────────────────────
    if (["ticket_status", "ticket_risk"].includes(intent)) {
      if (!ticketId) {
        return sendReply("Please specify the ticket number.");
      }

      const ticket = await prisma.ticket.findUnique({
        where: { id: ticketId },
      });

      if (!ticket) {
        return sendReply(`I could not find ticket ${ticketId}.`);
      }

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
        `Ticket ${ticketId} risk is ${score}/100 (confidence ${Math.round(
          confidence * 100
        )}%). Reasons: ${reasoning.join("; ")}.`
      );
    }

    // ─────────────────────────────────────────────
    // 5️⃣ FALLBACK (LAST)
    // ─────────────────────────────────────────────
    return sendReply(
      "I’m not sure yet. Try: 'add comment', 'close ticket', or 'assign it to me'."
    );
  } catch (error) {
    console.error("Chatbot error:", error);
    res.status(error.status || 500).json({
      reply: error.message || "Internal chatbot error.",
    });
  }
};

const prisma = require("../services/prisma");
const chatbot = require("../services/chatbot.service");
const intelligence = require("../services/intelligence.service");
const ticketStats = require("../services/ticketStats.service");
const chatSession = require("../services/chatSession.service");
const intelligenceQueue = require("../services/intelligenceQueue.service");
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
if (intent === "my_tickets") {
  const tickets = await prisma.ticket.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    take: 10,
  });

  if (tickets.length === 0) {
    return sendReply("You have no tickets yet.");
  }

  const lines = tickets.map(t =>
    `#${t.id} - ${t.status} - ${t.priority}${t.dueDate ? ` (due ${new Date(t.dueDate).toLocaleDateString()})` : ""}`
  );

  return sendReply(`Here are your latest tickets:\n${lines.join("\n")}`);
}
if (intent === "create_ticket") {
  const parts = message.split(":");
  if (parts.length < 2) {
    return sendReply(
      "Please use: 'Create ticket: <title> | <priority optional> | <category optional>'"
    );
  }

  const payload = parts.slice(1).join(":").trim();
  const [titleRaw, priorityRaw, categoryRaw] = payload.split("|").map(s => s.trim());

  const title = titleRaw;
  const priority = (priorityRaw || "Medium");
  const category = (categoryRaw || "General");

  if (!title) return sendReply("Ticket title is required.");

  // dueDate rule example: High=1 day, Medium=3 days, Low=5 days
  const now = new Date();
  const dueDays = priority.toLowerCase() === "high" ? 1 : priority.toLowerCase() === "low" ? 5 : 3;
  const dueDate = new Date(now.getTime() + dueDays * 24 * 60 * 60 * 1000);

  const ticket = await prisma.ticket.create({
    data: {
      title,
      priority,
      category,
      status: "New",
      dueDate,
      userId: user.id,
    },
  });

  await chatSession.updateState(session.id, { lastTicketId: ticket.id, lastIntent: "create_ticket" });

  return sendReply(`Ticket created: #${ticket.id} (${priority}, ${category}). Due date: ${dueDate.toLocaleDateString()}.`);
}

if (intent === "reopen_ticket") {
  if (!ticketId) return sendReply("Please specify which ticket to reopen.");

  const ticket = await prisma.ticket.findUnique({ where: { id: ticketId } });
  if (!ticket) return sendReply(`I could not find ticket ${ticketId}.`);

  // Optional: allow only the owner to reopen
  if (ticket.userId !== user.id) return sendReply("You can only reopen your own tickets.");

  const reason = message.replace(/reopen/i, "").trim() || "User requested reopening";

  await chatSession.updateState(session.id, {
    pendingAction: JSON.stringify({ type: "reopen_ticket", ticketId, reason }),
  });

  return sendReply(`I will reopen ticket ${ticketId} with reason: "${reason}". Confirm? (yes/no)`);
}

if (intent === "submit_feedback") {
  if (!ticketId) return sendReply("Please specify the ticket number for feedback (e.g., 'ticket 2').");

  const ticket = await prisma.ticket.findUnique({ where: { id: ticketId } });
  if (!ticket) return sendReply(`I could not find ticket ${ticketId}.`);

  if (ticket.status !== "Resolved") {
    return sendReply("Feedback allowed only after resolution.");
  }

  const rating = chatbot.extractRating(message);
  if (!rating) return sendReply("Please include a rating from 1 to 5 (e.g., 'Feedback 5: ...').");

  const comment = message.replace(/feedback|rate|rating|\b[1-5]\b/gi, "").replace(":", "").trim();

  await chatSession.updateState(session.id, {
    pendingAction: JSON.stringify({ type: "submit_feedback", ticketId, rating, comment }),
  });

  return sendReply(`Submit feedback for ticket ${ticketId} with rating ${rating}? Confirm (yes/no).`);
}

if (intent === "set_status") {
  if (user.role !== "agent") return sendReply("Only agents can change ticket status.");
  if (!ticketId) return sendReply("Please specify which ticket to update.");

  const newStatus = chatbot.extractStatus(message);
  if (!newStatus) return sendReply("Please specify status: In Progress, Pending, or Resolved.");

  await chatSession.updateState(session.id, {
    pendingAction: JSON.stringify({ type: "set_status", ticketId, status: newStatus }),
  });

  return sendReply(`I will set ticket ${ticketId} to '${newStatus}'. Confirm? (yes/no)`);
}

if (intent === "overdue_list") {
  if (user.role !== "agent") return sendReply("Only agents can view overdue queues.");

  const now = new Date();
  const overdue = await prisma.ticket.findMany({
    where: {
      status: { not: "Resolved" },
      dueDate: { lt: now },
    },
    orderBy: { dueDate: "asc" },
    take: 10,
  });

  if (overdue.length === 0) return sendReply("No overdue tickets 🎉");

  const lines = overdue.map(t => `#${t.id} - ${t.priority} - ${t.status}`);
  return sendReply(`Overdue tickets:\n${lines.join("\n")}`);
}

if (intent === "top_risky") {
  if (user.role !== "agent" && user.role !== "admin") {
    return sendReply("This command is available to agents/admins only.");
  }

  const top = await intelligenceQueue.getTopRiskyTickets(10);
  if (top.length === 0) return sendReply("No active tickets to score.");

  const lines = top.map(t =>
    `#${t.id} risk ${t.riskScore}/100 (${Math.round(t.confidence * 100)}%) - ${t.priority} - ${t.status}`
  );

  return sendReply(`Top risky tickets:\n${lines.join("\n")}`);
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
if (action.type === "reopen_ticket") {
  await prisma.ticket.update({
    where: { id: action.ticketId },
    data: { status: "Reopened", reopenReason: action.reason || "Reopened via chatbot" },
  });

  await chatSession.updateState(session.id, { pendingAction: null });
  return sendReply(`Ticket ${action.ticketId} has been reopened.`);
}

if (action.type === "submit_feedback") {
  await prisma.feedback.create({
    data: {
      ticketId: action.ticketId,
      userId: user.id,
      rating: action.rating,
      comment: action.comment || null,
    },
  });

  await chatSession.updateState(session.id, { pendingAction: null });
  return sendReply(`Thanks! Your feedback for ticket ${action.ticketId} was submitted.`);
}

if (action.type === "set_status") {
  await prisma.ticket.update({
    where: { id: action.ticketId },
    data: { status: action.status },
  });

  await chatSession.updateState(session.id, { pendingAction: null });
  return sendReply(`Ticket ${action.ticketId} status updated to '${action.status}'.`);
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

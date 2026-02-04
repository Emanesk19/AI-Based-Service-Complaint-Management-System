function parseIntent(message) {
  const text = message.toLowerCase().trim();

  // 🔴 CONFIRM / CANCEL (HIGHEST PRIORITY)
  if (/^(yes|confirm)$/.test(text)) return { intent: "confirm_action" };
  if (/^(no|cancel)$/.test(text)) return { intent: "cancel_action" };

  // 🔵 ACTION INTENTS (HIGH PRIORITY)
  if (/^add comment|comment:|add note/.test(text))
    return { intent: "add_comment" };

  if (/^close|^resolve/.test(text))
    return { intent: "close_ticket" };

  if (/reopen/.test(text))
    return { intent: "reopen_ticket" };

  if (/assign.*me|assign to me/.test(text))
    return { intent: "assign_to_me" };

  if (/create.*ticket/.test(text))
    return { intent: "create_ticket" };

  // 🟢 INFO INTENTS
  if (/status.*ticket|ticket.*status|status\?/.test(text))
    return { intent: "ticket_status" };

  if (/risk|risky|at risk|delay|delayed|late|why.*ticket|ticket.*delay/.test(text))
    return { intent: "ticket_risk" };

  if (/work on|prioritize|urgent tickets|what should i work on/.test(text))
    return { intent: "agent_priority" };

  if (/hello|hi|hey/.test(text))
    return { intent: "greeting" };

  // ⚪ FALLBACK (LAST LINE ONLY)
  return { intent: "unknown" };
}


function extractTicketId(message) {
  const match = message.match(/\b\d+\b/);
  return match ? parseInt(match[0]) : null;
}

module.exports = { parseIntent, extractTicketId };

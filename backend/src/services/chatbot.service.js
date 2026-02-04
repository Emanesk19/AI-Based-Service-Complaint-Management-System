function parseIntent(message) {
  const text = message.toLowerCase();

  if (/hello|hi|hey/.test(text)) return { intent: "greeting" };

  // Status
  if (/status.*ticket|ticket.*status|status\?/.test(text))
    return { intent: "ticket_status" };

  // Risk / delay (IMPORTANT FIX)
  if (
    /risk|risky|at risk|delay|delayed|late|why.*ticket|ticket.*delay/.test(text)
  ) {
    return { intent: "ticket_risk" };
  }

  // Agent priority
  if (/work on|prioritize|urgent tickets|what should i work on/.test(text))
    return { intent: "agent_priority" };

  return { intent: "unknown" };
}


function extractTicketId(message) {
  const match = message.match(/\b\d+\b/);
  return match ? parseInt(match[0]) : null;
}

module.exports = { parseIntent, extractTicketId };

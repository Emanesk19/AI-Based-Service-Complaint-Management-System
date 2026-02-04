function parseIntent(message) {
  const text = message.toLowerCase();

  if (/hello|hi|hey/.test(text)) return { intent: "greeting" };

  if (/status.*ticket|ticket.*status/.test(text))
    return { intent: "ticket_status" };

  if (/why.*ticket|ticket.*delayed|delay/.test(text))
    return { intent: "ticket_delay" };

  if (/risk.*ticket|ticket.*risk/.test(text))
    return { intent: "ticket_risk" };

  if (/work on|prioritize|urgent tickets/.test(text))
    return { intent: "agent_priority" };

  return { intent: "unknown" };
}

function extractTicketId(message) {
  const match = message.match(/\b\d+\b/);
  return match ? parseInt(match[0]) : null;
}

module.exports = { parseIntent, extractTicketId };

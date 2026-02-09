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
// USER/COMMON
if (/my tickets|show my tickets|list my tickets/.test(text))
  return { intent: "my_tickets" };

if (/create ticket|new ticket|open a ticket/.test(text))
  return { intent: "create_ticket" };

if (/feedback|rate|rating/.test(text))
  return { intent: "submit_feedback" };

if (/reopen/.test(text))
  return { intent: "reopen_ticket" };

// AGENT
if (/set status|change status|mark as/.test(text))
  return { intent: "set_status" };

if (/overdue tickets|show overdue|list overdue/.test(text))
  return { intent: "overdue_list" };

if (/top risky|highest risk|risk queue|urgent queue/.test(text))
  return { intent: "top_risky" };

// ADMIN (optional)
if (/summary|stats|dashboard/.test(text))
  return { intent: "admin_summary" };
  // ⚪ FALLBACK (LAST LINE ONLY)
  return { intent: "unknown" };
}


function extractTicketId(message) {
  const match = message.match(/\b\d+\b/);
  return match ? parseInt(match[0]) : null;
}
function extractRating(message) {
  const match = message.match(/\b([1-5])\b/);
  return match ? parseInt(match[1]) : null;
}

function extractStatus(message) {
  const text = message.toLowerCase();
  if (text.includes("in progress")) return "In Progress";
  if (text.includes("pending")) return "Pending";
  if (text.includes("resolved") || text.includes("closed")) return "Resolved";
  if (text.includes("reopened")) return "Reopened";
  if (text.includes("new") || text.includes("open")) return "New";
  return null;
}

module.exports = { parseIntent, extractTicketId, extractRating, extractStatus };
module.exports = { parseIntent, extractTicketId };

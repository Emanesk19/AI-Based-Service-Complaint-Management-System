const INTENTS = {
  // CONFIRMATION
  CONFIRM: "confirm_action",
  CANCEL: "cancel_action",

  // USER COMMANDS
  MY_TICKETS: "my_tickets",
  CREATE_TICKET: "create_ticket",
  TICKET_STATUS: "ticket_status",
  ADD_COMMENT: "add_comment",
  REOPEN_TICKET: "reopen_ticket",
  SUBMIT_FEEDBACK: "submit_feedback",

  // AGENT/ADMIN COMMANDS
  ASSIGN_TO_ME: "assign_to_me",
  SET_STATUS: "set_status",
  OVERDUE_LIST: "overdue_list",
  TOP_RISKY: "top_risky",
  TICKET_RISK: "ticket_risk",
  ADMIN_SUMMARY: "admin_summary",
  
  // GENERAL
  GREETING: "greeting",
  HELP: "help",
  UNKNOWN: "unknown"
};

/**
 * Robust Intent Parser using Weighted Keywords and Regex
 */
function parseIntent(message) {
  const text = message.toLowerCase().trim();

  // 1. Confirmations (Highest Priority)
  if (/^(yes|confirm|verify|do it|okay|ok|yep|sure)$/.test(text)) return { intent: INTENTS.CONFIRM };
  if (/^(no|cancel|stop|abort|negative|nope)$/.test(text)) return { intent: INTENTS.CANCEL };

  // 2. Action Phrases
  if (text.includes("help") || text === "?" || text.includes("what can you do")) return { intent: INTENTS.HELP };
  if (text.includes("hello") || text.includes("hi ") || text === "hi" || text.includes("hey")) return { intent: INTENTS.GREETING };

  // 3. Ticket Management
  if (/create.*ticket|new.*ticket|open.*ticket|report.*issue/i.test(text)) return { intent: INTENTS.CREATE_TICKET };
  if (/my.*tickets|list.*my|show.*my/i.test(text)) return { intent: INTENTS.MY_TICKETS };
  
  // 4. Specific Ticket Actions
  if (/add.*comment|comment.*on|message.*on|note.*on/i.test(text)) return { intent: INTENTS.ADD_COMMENT };
  if (/close.*ticket|resolve.*ticket|mark.*resolved/i.test(text)) return { intent: INTENTS.SET_STATUS };
  if (/reopen|open.*again/i.test(text)) return { intent: INTENTS.REOPEN_TICKET };
  if (/assign.*me|take.*ticket|i'll.*handle/i.test(text)) return { intent: INTENTS.ASSIGN_TO_ME };
  if (/set.*status|change.*status|mark.*as/i.test(text)) return { intent: INTENTS.SET_STATUS };
  
  // 5. Intelligence & Info
  if (/status.*of|how.*is.*ticket/i.test(text)) return { intent: INTENTS.TICKET_STATUS };
  if (/risk|delay|late|stuck|why.*taking.*so.*long/i.test(text)) return { intent: INTENTS.TICKET_RISK };
  if (/overdue|behind.*schedule/i.test(text)) return { intent: INTENTS.OVERDUE_LIST };
  if (/risky.*tickets|urgent.*queue|highest.*risk/i.test(text)) return { intent: INTENTS.TOP_RISKY };
  
  // 6. Analytics
  if (/summary|stats|performance|how.*we.*doing/i.test(text)) return { intent: INTENTS.ADMIN_SUMMARY };

  return { intent: INTENTS.UNKNOWN };
}

/**
 * Extract numerical ticket ID from text
 */
function extractTicketId(message) {
  const match = message.match(/#?(\d+)\b/);
  return match ? parseInt(match[1]) : null;
}

/**
 * Extract 1-5 rating from text
 */
function extractRating(message) {
  const match = message.match(/\b([1-5])\b/);
  return match ? parseInt(match[1]) : null;
}

/**
 * Extract status string from text
 */
function extractStatus(message) {
  const text = message.toLowerCase();
  if (text.includes("in progress")) return "In Progress";
  if (text.includes("pending")) return "Pending";
  if (text.includes("resolved") || text.includes("closed")) return "Resolved";
  if (text.includes("reopened")) return "Reopened";
  if (text.includes("new") || text.includes("open")) return "New";
  return null;
}

/**
 * Generate Role-Based Help Text
 */
function getHelpText(role) {
  let help = `I am your AI Service Assistant. Here is what I can do:\n\n`;
  
  help += `🎫 **For Users:**\n`;
  help += `- "Create ticket: [Title]" - Open a new request\n`;
  help += `- "Status of ticket #123" - Check progress\n`;
  help += `- "Add comment to #123: [Message]" - Update ticket\n`;
  help += `- "Show my tickets" - List your recent requests\n`;
  help += `- "Feedback for #123: [1-5]" - Rate resolution\n\n`;

  if (role === 'agent' || role === 'admin') {
    help += `🛠️ **For Agents:**\n`;
    help += `- "Assign #123 to me" - Take ownership\n`;
    help += `- "Set status of #123 to Resolved" - Close ticket\n`;
    help += `- "Show overdue tickets" - Check SLA breaches\n`;
    help += `- "Top risky tickets" - See AI priorities\n`;
    help += `- "Why is ticket #123 delayed?" - Get AI risk analysis\n\n`;
  }

  if (role === 'admin') {
    help += `📊 **For Admins:**\n`;
    help += `- "System summary" - Get today's KPI snapshot\n`;
  }

  return help;
}

module.exports = { 
  INTENTS,
  parseIntent, 
  extractTicketId, 
  extractRating, 
  extractStatus,
  getHelpText
};

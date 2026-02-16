const ai = require("./ai.service");

/**
 * Automatically categorize and prioritize a ticket based on its content.
 */
async function autoCategorize(title, description) {
  const prompt = `Analyze this service request:
  Title: ${title}
  Description: ${description}
  
  Determine the most appropriate category and priority (Low, Medium, High).
  Also detect the user's sentiment (Positive, Neutral, Frustrated, Angry).
  Finally, suggest a brief initial response for the agent.`;

  const schema = {
    category: "string (e.g., Software, Hardware, Access, Billing, General)",
    priority: "string (Low, Medium, or High)",
    sentiment: "string",
    isAngry: "boolean",
    suggestedReply: "string"
  };

  return await ai.quickAnalysis(prompt, schema);
}

/**
 * Middleware or Hook to enrich ticket data before saving
 */
async function enrichTicket(ticketData) {
  try {
    const analysis = await autoCategorize(ticketData.title, ticketData.description);
    if (!analysis) return ticketData;

    // Normalize Priority
    let priority = ticketData.priority;
    if (!priority && analysis.priority) {
      const p = analysis.priority.toLowerCase();
      if (p.includes("high")) priority = "High";
      else if (p.includes("low")) priority = "Low";
      else priority = "Medium";
    }

    // Normalize Category
    let category = ticketData.category;
    if (!category && analysis.category) {
      category = analysis.category.charAt(0).toUpperCase() + analysis.category.slice(1).toLowerCase();
    }

    return {
      ...ticketData,
      category: category || "General",
      priority: priority || "Medium",
      metadata: {
        sentiment: analysis.sentiment,
        isAngry: analysis.isAngry,
        aiSuggestedReply: analysis.suggestedReply,
        ...ticketData.metadata
      }
    };
  } catch (err) {
    console.error("AI Enrichment Error:", err);
    return ticketData;
  }
}

module.exports = { autoCategorize, enrichTicket };

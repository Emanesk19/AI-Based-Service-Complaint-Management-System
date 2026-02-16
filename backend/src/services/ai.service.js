const Groq = require("groq-sdk");
const prisma = require("./prisma");
const intelligence = require("./intelligence.service");
const ticketStats = require("./ticketStats.service");

// Initialize Groq
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

/**
 * Tool Definitions for Groq (OpenAI Format)
 */
const tools = [
  {
    type: "function",
    function: {
      name: "get_my_tickets",
      description: "Fetch the most recent tickets created by the authenticated user.",
      parameters: { type: "object", properties: {} }
    }
  },
  {
    type: "function",
    function: {
      name: "create_ticket",
      description: "Create a new service request or ticket.",
      parameters: {
        type: "object",
        properties: {
          title: { type: "string", description: "Short descriptive title of the issue" },
          priority: { type: "string", enum: ["Low", "Medium", "High"], description: "Urgency of the issue" },
          category: { type: "string", description: "Category of the service request" }
        },
        required: ["title"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "get_ticket_details",
      description: "Retrieve comprehensive details, status, and priority for a specific ticket ID.",
      parameters: {
        type: "object",
        properties: {
          ticketId: { type: "number", description: "The numerical ID of the ticket" }
        },
        required: ["ticketId"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "add_comment",
      description: "Add a message or comment to an existing ticket.",
      parameters: {
        type: "object",
        properties: {
          ticketId: { type: "number", description: "Ticket ID" },
          content: { type: "string", description: "Comment text" }
        },
        required: ["ticketId", "content"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "analyze_ticket_risk",
      description: "Use AI to analyze why a ticket might be delayed or at risk of breaching SLA.",
      parameters: {
        type: "object",
        properties: {
          ticketId: { type: "number", description: "Ticket ID to analyze" }
        },
        required: ["ticketId"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "get_all_high_risk_tickets",
      description: "List all active tickets currently flagged as high risk based on SLA and priority.",
      parameters: { type: "object", properties: {} }
    }
  }
];

/**
 * Execute the actual tool function
 */
async function callTool(name, args, user) {
  console.log(`Groq AI Calling Tool: ${name}`, args);
  
  try {
    switch (name) {
      case "get_my_tickets":
        const tickets = await prisma.ticket.findMany({
          where: { userId: user.id },
          orderBy: { createdAt: "desc" },
          take: 5
        });
        return { tickets: tickets.map(t => ({ id: t.id, title: t.title, status: t.status, priority: t.priority })) };

      case "create_ticket":
        const newTicket = await prisma.ticket.create({
          data: {
            title: args.title,
            description: "Created via Groq AI Assistant",
            priority: args.priority || "Medium",
            category: args.category || "General",
            userId: user.id,
            status: "New"
          }
        });
        return { success: true, ticketId: newTicket.id, message: "Ticket created successfully" };

      case "get_ticket_details":
        const ticket = await prisma.ticket.findUnique({ where: { id: args.ticketId } });
        if (!ticket) return { error: "Ticket not found" };
        return { ticket };

      case "add_comment":
        await prisma.comment.create({
          data: { ticketId: args.ticketId, userId: user.id, content: args.content }
        });
        return { success: true, message: "Comment added" };

      case "analyze_ticket_risk":
        const t = await prisma.ticket.findUnique({ where: { id: args.ticketId } });
        if (!t) return { error: "Ticket not found" };
        const stats = await ticketStats.getStats();
        const workloads = await ticketStats.getAgentWorkload();
        const risk = intelligence.calculateRiskScore(t, stats, workloads);
        return { risk_score: risk.score, reasoning: risk.reasoning, confidence: risk.confidence };

      case "get_all_high_risk_tickets":
        const activeTickets = await prisma.ticket.findMany({
          where: { status: { not: "Resolved" } },
          include: { agent: { select: { name: true } } }
        });
        const s = await ticketStats.getStats();
        const w = await ticketStats.getAgentWorkload();
        
        const highRisk = activeTickets.map(ticket => {
          const r = intelligence.calculateRiskScore(ticket, s, w);
          return { id: ticket.id, title: ticket.title, score: r.score, agent: ticket.agent?.name || "Unassigned" };
        }).filter(item => item.score > 50)
          .sort((a, b) => b.score - a.score);

        return { highRiskTickets: highRisk.slice(0, 10), count: highRisk.length };

      default:
        return { error: "Unsupported tool" };
    }
  } catch (err) {
    console.error("DEBUG: Groq processChat Error:");
    console.error(err);
    if (err.response) {
      console.error("Error Data:", JSON.stringify(err.response.data, null, 2));
    }
    throw err;
  }
}

/**
 * Main AI Chat Processor
 */
async function processChat(message, history, user) {
  const systemPrompt = `You are the Professional AI Service Assistant for the Intelligent Service Request Platform. 
  Your goal is to help users and agents manage tickets efficiently. 
  - Use tools when you need to access or modify data.
  - Be professional, concise, and helpful.
  - If a user mentions a ticket without an ID, check their recent tickets or ask for clarification.
  - You represent the backend system. Current User: ${user.name} (Role: ${user.role}, ID: ${user.id}).`;

  const messages = [
    { role: "system", content: systemPrompt },
    ...history,
    { role: "user", content: message }
  ];

  let completion = await groq.chat.completions.create({
    model: "llama-3.3-70b-versatile",
    messages: messages,
    tools: tools,
    tool_choice: "auto",
    max_tokens: 1024
  });

  let responseMessage = completion.choices[0].message;

  // Handle Tool Calls
  if (responseMessage.tool_calls) {
    // Add the AI's tool call to history
    messages.push(responseMessage);

    for (const toolCall of responseMessage.tool_calls) {
      const functionName = toolCall.function.name;
      let functionArgs;
      try {
        functionArgs = JSON.parse(toolCall.function.arguments);
      } catch (e) {
        functionArgs = {};
      }
      
      const functionResponse = await callTool(functionName, functionArgs, user);

      // Add the tool result to history (Strict OpenAI/Groq format)
      messages.push({
        role: "tool",
        tool_call_id: toolCall.id,
        content: JSON.stringify(functionResponse),
      });
    }

    // Get a final response from the model after tool execution
    const secondResponse = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: messages,
    });
    return secondResponse.choices[0].message.content;
  }

  return responseMessage.content;
}

/**
 * Quick Structured Analysis (No tools, returns JSON)
 */
async function quickAnalysis(prompt, schema) {
  const messages = [
    { 
      role: "system", 
      content: `You are a high-speed logic engine. 
      Respond ONLY with a valid JSON object matching this schema: ${JSON.stringify(schema)}.
      Do not include any other text or explanations.`
    },
    { role: "user", content: prompt }
  ];

  const completion = await groq.chat.completions.create({
    model: "llama-3.3-70b-versatile",
    messages: messages,
    response_format: { type: "json_object" },
    temperature: 0.1, // Low temp for consistency
    max_tokens: 512
  });

  try {
    return JSON.parse(completion.choices[0].message.content);
  } catch (err) {
    console.error("Failed to parse AI Analysis JSON:", completion.choices[0].message.content);
    return null;
  }
}

module.exports = { processChat, quickAnalysis };

const aiService = require("../services/ai.service");
const chatSession = require("../services/chatSession.service");

/**
 * Groq-Powered Professional Chatbot Controller
 */
exports.chat = async (req, res) => {
  try {
    const { sessionId, message } = req.body;
    const user = req.user;

    if (!sessionId || !message) {
      return res.status(400).json({ reply: "Session ID and message are required." });
    }

    // 1. Load Session & History
    const session = await chatSession.getSessionOrThrow(Number(sessionId), user.id);
    const recentMessages = await chatSession.getRecentMessages(session.id, 10);
    
    // Map history to OpenAI/Groq format
    const history = recentMessages.map(m => ({
      role: m.role === "assistant" ? "assistant" : "user",
      content: m.content
    }));

    // 2. Save User Message
    await chatSession.addMessage(session.id, "user", message);

    // 3. Process with Groq AI
    console.log(`Processing Groq AI request for User ${user.id}...`);
    const aiReply = await aiService.processChat(message, history, user);

    // 4. Save & Return AI Reply
    await chatSession.addMessage(session.id, "assistant", aiReply);

    return res.json({ reply: aiReply });

  } catch (error) {
    console.error("Groq AI Chatbot Error:", error);
    
    // Graceful fallback
    const fallbackMessage = "I'm experiencing a temporary brain freeze. Please try again in a moment.";
    res.status(error.status || 500).json({ reply: fallbackMessage });
  }
};

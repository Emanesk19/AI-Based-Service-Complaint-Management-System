const chatSession = require("../services/chatSession.service");

exports.createSession = async (req, res) => {
  try {
    const userId = req.user.id;
    const session = await chatSession.createSession(userId);

    res.status(201).json({
      message: "Chat session created",
      sessionId: session.id,
    });
  } catch (err) {
    console.error("Create session error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
};

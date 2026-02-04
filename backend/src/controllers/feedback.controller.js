const prisma = require("../services/prisma");

exports.submitFeedback = async (req, res) => {
  try {
    const { ticketId, rating, comment } = req.body;

    const ticket = await prisma.ticket.findUnique({
      where: { id: ticketId },
    });

    if (!ticket || ticket.status !== "Resolved") {
      return res
        .status(400)
        .json({ message: "Feedback allowed only after resolution" });
    }

    const feedback = await prisma.feedback.create({
      data: {
        ticketId,
        rating,
        comment,
      },
    });

    res.status(201).json({
      message: "Feedback submitted",
      feedback,
    });
  } catch (error) {
    console.error("Feedback error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

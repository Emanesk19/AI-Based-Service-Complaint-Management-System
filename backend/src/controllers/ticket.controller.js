const prisma = require("../services/prisma");

exports.createTicket = async (req, res) => {
  try {
    const { title, description, category, priority } = req.body;
    const userId = req.user.id;

    const ticket = await prisma.ticket.create({
      data: {
        title,
        description,
        category,
        priority,
        status: "New",
        user: {
          connect: { id: userId }
        }
      }
    });

    res.status(201).json({
      message: "Ticket created successfully",
      ticket
    });
  } catch (error) {
    console.error("Create ticket error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

exports.getMyTickets = async (req, res) => {
  try {
    const userId = req.user.id;

    const tickets = await prisma.ticket.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" }
    });

    res.json(tickets);
  } catch (error) {
    console.error("Get tickets error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

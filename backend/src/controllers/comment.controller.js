const prisma = require("../services/prisma");

exports.addComment = async (req, res) => {
  const { ticketId, content } = req.body;
  const userId = req.user.id;

  const comment = await prisma.comment.create({
    data: {
      content,
      ticketId,
      userId,
    },
  });

  res.status(201).json(comment);
};

exports.getCommentsByTicket = async (req, res) => {
  const ticketId = parseInt(req.params.ticketId);

  const comments = await prisma.comment.findMany({
    where: { ticketId },
    include: { user: { select: { name: true, role: true } } },
    orderBy: { createdAt: "asc" },
  });

  res.json(comments);
};

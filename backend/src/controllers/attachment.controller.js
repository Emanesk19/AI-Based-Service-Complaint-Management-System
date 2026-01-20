const prisma = require("../services/prisma");

exports.uploadAttachment = async (req, res) => {
  try {
    const ticketId = Number(req.body.ticketId);

    if (!ticketId || isNaN(ticketId)) {
      return res.status(400).json({ message: "Invalid or missing ticketId" });
    }

    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    const attachment = await prisma.attachment.create({
      data: {
        filename: req.file.originalname,
        path: req.file.path,
        ticket: {
          connect: { id: ticketId },
        },
      },
    });

    res.status(201).json({
      message: "Attachment uploaded",
      attachment,
    });
  } catch (error) {
    console.error("Upload attachment error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

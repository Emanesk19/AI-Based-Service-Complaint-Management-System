const prisma = require("../services/prisma");
const { Parser } = require("json2csv");
const PDFDocument = require("pdfkit");

/**
 * Export tickets to CSV
 * GET /api/reports/export/csv
 */
exports.exportTicketsCSV = async (req, res) => {
  try {
    const { status, priority, category } = req.query;
    
    const where = {};
    if (status) where.status = status;
    if (priority) where.priority = priority;
    if (category) where.category = category;

    const tickets = await prisma.ticket.findMany({
      where,
      include: {
        user: { select: { name: true, email: true } },
        agent: { select: { name: true } }
      }
    });

    const fields = [
      { label: "ID", value: "id" },
      { label: "Title", value: "title" },
      { label: "Status", value: "status" },
      { label: "Priority", value: "priority" },
      { label: "Category", value: "category" },
      { label: "Creator", value: "user.name" },
      { label: "Creator Email", value: "user.email" },
      { label: "Agent", value: "agent.name" },
      { label: "Created At", value: "createdAt" }
    ];

    const json2csvParser = new Parser({ fields });
    const csv = json2csvParser.parse(tickets);

    res.header("Content-Type", "text/csv");
    res.attachment(`tickets_export_${Date.now()}.csv`);
    return res.send(csv);

  } catch (error) {
    console.error("CSV Export error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

/**
 * Export summary to PDF
 * GET /api/reports/export/pdf
 */
exports.exportSummaryPDF = async (req, res) => {
  try {
    const totalTickets = await prisma.ticket.count();
    const resolvedTickets = await prisma.ticket.count({ where: { status: "Resolved" } });
    const highPriority = await prisma.ticket.count({ where: { priority: "High" } });

    const doc = new PDFDocument();
    let filename = `summary_report_${Date.now()}.pdf`;
    
    res.setHeader('Content-disposition', 'attachment; filename="' + filename + '"');
    res.setHeader('Content-type', 'application/pdf');

    doc.pipe(res);

    // Title
    doc.fontSize(25).text('Service Management Summary Report', { align: 'center' });
    doc.moveDown();
    doc.fontSize(12).text(`Generated on: ${new Date().toLocaleString()}`);
    doc.moveDown();

    // Stats Table-like layout
    doc.fontSize(16).text('Key Metrics:', { underline: true });
    doc.moveDown();
    doc.fontSize(14).text(`Total Tickets: ${totalTickets}`);
    doc.text(`Resolved Tickets: ${resolvedTickets}`);
    doc.text(`Resolution Rate: ${((resolvedTickets / totalTickets) * 100).toFixed(1)}%`);
    doc.fillColor('red').text(`High Priority Tickets: ${highPriority}`);

    doc.end();

  } catch (error) {
    console.error("PDF Export error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

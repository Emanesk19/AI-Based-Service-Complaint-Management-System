const cron = require("node-cron");
const prisma = require("./prisma");
const emailService = require("./email.service");
const analyticsService = require("./analytics.service");

/**
 * Weekly KPI Report Job
 * Runs every Monday at 8:00 AM
 */
const startWeeklyReportJob = () => {
  // '0 8 * * 1'
  // For testing, we can use a more frequent schedule if needed, but '0 8 * * 1' is per requirement.
  cron.schedule('0 8 * * 1', async () => {
    console.log("Running Weekly KPI Report Job...");
    
    try {
      // 1. Get Admins
      const admins = await prisma.user.findMany({
        where: { role: "admin" },
        select: { email: true }
      });
      
      if (admins.length === 0) return;

      // 2. Generate Stats
      // Reusing analytics logic if available, or calculating fresh
      const totalTickets = await prisma.ticket.count();
      const resolvedTickets = await prisma.ticket.count({ where: { status: "Resolved" } });
      const openTickets = totalTickets - resolvedTickets;

      const subject = `Weekly KPI Summary: ${new Date().toLocaleDateString()}`;
      const html = `
        <div style="font-family: sans-serif; padding: 20px;">
          <h2 style="color: #2563eb;">Weekly Performance Report</h2>
          <p>Here is the system summary for the past week:</p>
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 10px; border: 1px solid #ddd;">Total Tickets</td>
              <td style="padding: 10px; border: 1px solid #ddd; font-weight: bold;">${totalTickets}</td>
            </tr>
            <tr>
              <td style="padding: 10px; border: 1px solid #ddd;">Open Tickets</td>
              <td style="padding: 10px; border: 1px solid #ddd; font-weight: bold; color: #dc2626;">${openTickets}</td>
            </tr>
            <tr>
              <td style="padding: 10px; border: 1px solid #ddd;">Resolved</td>
              <td style="padding: 10px; border: 1px solid #ddd; font-weight: bold; color: #16a34a;">${resolvedTickets}</td>
            </tr>
          </table>
          <br>
          <p>Log in to the dashboard for detailed analytics.</p>
        </div>
      `;

      const adminEmails = admins.map(a => a.email).join(",");
      await emailService.sendEmail(adminEmails, subject, html);
      console.log("Weekly report sent to admins.");

    } catch (error) {
      console.error("Cron job error:", error);
    }
  });
};

module.exports = {
  startWeeklyReportJob
};

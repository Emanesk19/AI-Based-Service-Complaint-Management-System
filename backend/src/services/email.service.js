const nodemailer = require("nodemailer");

/**
 * Configure SMTP transporter
 * Uses environment variables for configuration
 */
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "smtp.mailtrap.io",
  port: process.env.SMTP_PORT || 2525,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

/**
 * Send an email notification
 * @param {string} to 
 * @param {string} subject 
 * @param {string} html 
 */
async function sendEmail(to, subject, html) {
  if (!process.env.SMTP_USER || process.env.SMTP_USER === "your_user") {
    console.log("--- MOCK EMAIL SENT ---");
    console.log(`To: ${to}`);
    console.log(`Subject: ${subject}`);
    console.log("------------------------");
    return { messageId: "mock-id-" + Date.now() };
  }

  try {
    const info = await transporter.sendMail({
      from: `"AI Service Center" <${process.env.SMTP_FROM || "noreply@aiservice.com"}>`,
      to,
      subject,
      html,
    });
    console.log("Email sent: %s", info.messageId);
    return info;
  } catch (error) {
    console.error("Error sending email:", error);
    return null;
  }
}

/**
 * Send ticket assignment email
 */
async function sendAssignmentEmail(userEmail, ticketTitle, ticketId) {
  const subject = `Ticket Assigned: ${ticketTitle}`;
  const html = `
    <div style="font-family: sans-serif; padding: 20px; border: 1px solid #eee; border-radius: 8px;">
      <h2 style="color: #2563eb;">Ticket Assigned</h2>
      <p>Hello,</p>
      <p>Your ticket "<strong>${ticketTitle}</strong>" (ID: ${ticketId}) has been assigned to an agent and is now being processed.</p>
      <p>You can track the progress in the application dashboard.</p>
      <br>
      <p style="font-size: 0.8em; color: #666;">This is an automated notification. Please do not reply to this email.</p>
    </div>
  `;
  return await sendEmail(userEmail, subject, html);
}

/**
 * Send status update email
 */
async function sendStatusUpdateEmail(userEmail, ticketTitle, ticketId, newStatus) {
  const subject = `Ticket Status Updated: ${ticketTitle}`;
  const html = `
    <div style="font-family: sans-serif; padding: 20px; border: 1px solid #eee; border-radius: 8px;">
      <h2 style="color: #2563eb;">Status Updated</h2>
      <p>Hello,</p>
      <p>The status of your ticket "<strong>${ticketTitle}</strong>" (ID: ${ticketId}) has been changed to: <strong>${newStatus}</strong>.</p>
      <br>
      <p style="font-size: 0.8em; color: #666;">This is an automated notification. Please do not reply to this email.</p>
    </div>
  `;
  return await sendEmail(userEmail, subject, html);
}

/**
 * Send high priority alert to admins
 */
async function sendHighPriorityAlert(adminEmails, ticketTitle, ticketId) {
  const subject = `CRITICAL: High Priority Ticket Created - ${ticketId}`;
  const html = `
    <div style="font-family: sans-serif; padding: 20px; border: 1px solid #dc2626; border-radius: 8px;">
      <h2 style="color: #dc2626;">Urgent Action Required</h2>
      <p>A high priority ticket has been created: "<strong>${ticketTitle}</strong>" (ID: ${ticketId}).</p>
      <p>Please ensure this is assigned and addressed immediately.</p>
    </div>
  `;
  return await sendEmail(adminEmails, subject, html);
}

/**
 * Send password reset email
 */
async function sendPasswordResetEmail(userEmail, token) {
  const subject = "Password Reset Request";
  const resetLink = `http://localhost:3000/reset-password?token=${token}`; // Placeholder UI link
  const html = `
    <div style="font-family: sans-serif; padding: 20px; border: 1px solid #eee; border-radius: 8px;">
      <h2 style="color: #2563eb;">Password Reset</h2>
      <p>Hello,</p>
      <p>You requested a password reset. Please click the button below to set a new password:</p>
      <a href="${resetLink}" style="display: inline-block; padding: 10px 20px; background-color: #2563eb; color: #fff; text-decoration: none; border-radius: 5px;">Reset Password</a>
      <p>This link will expire in 1 hour.</p>
      <p>If you did not request this, please ignore this email.</p>
    </div>
  `;
  return await sendEmail(userEmail, subject, html);
}

module.exports = {
  sendEmail,
  sendAssignmentEmail,
  sendStatusUpdateEmail,
  sendHighPriorityAlert,
  sendPasswordResetEmail
};

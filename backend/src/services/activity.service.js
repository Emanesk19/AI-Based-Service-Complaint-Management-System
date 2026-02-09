const prisma = require("./prisma");

/**
 * Record an activity or system event
 * @param {number} ticketId (Optional) ID of the ticket
 * @param {number} userId ID of the user performing the action
 * @param {string} action Description of the action (e.g., 'STATUS_CHANGE')
 * @param {string} oldValue (Optional) Value before change
 * @param {string} newValue (Optional) Value after change
 */
async function logActivity(ticketId, userId, action, oldValue = null, newValue = null) {
  try {
    return await prisma.activityLog.create({
      data: {
        ticketId: ticketId ? parseInt(ticketId) : null,
        userId: parseInt(userId),
        action,
        oldValue: oldValue ? String(oldValue) : null,
        newValue: newValue ? String(newValue) : null,
      }
    });
  } catch (error) {
    console.error("Error logging activity:", error);
    // Don't throw error to avoid breaking main flows if logging fails
    return null;
  }
}

/**
 * Get full history for a specific ticket
 * @param {number} ticketId 
 */
async function getTicketHistory(ticketId) {
  return await prisma.activityLog.findMany({
    where: { ticketId: parseInt(ticketId) },
    include: {
      user: {
        select: { id: true, name: true, email: true, role: true }
      }
    },
    orderBy: { createdAt: "desc" }
  });
}

/**
 * Get global audit logs (Admin only)
 * @param {object} filters (Optional) search, action, userId, etc.
 */
async function getAuditLogs(filters = {}) {
  const { search, action, userId, limit = 50, offset = 0 } = filters;

  const where = {};
  if (action) where.action = action;
  if (userId) where.userId = parseInt(userId);
  if (search) {
    where.OR = [
      { action: { contains: search, mode: 'insensitive' } },
      { oldValue: { contains: search, mode: 'insensitive' } },
      { newValue: { contains: search, mode: 'insensitive' } },
    ];
  }

  const logs = await prisma.activityLog.findMany({
    where,
    take: parseInt(limit),
    skip: parseInt(offset),
    include: {
      user: { select: { id: true, name: true, role: true } },
      ticket: { select: { id: true, title: true } }
    },
    orderBy: { createdAt: "desc" }
  });

  const total = await prisma.activityLog.count({ where });

  return {
    logs,
    pagination: {
      total,
      limit: parseInt(limit),
      offset: parseInt(offset)
    }
  };
}

module.exports = {
  logActivity,
  getTicketHistory,
  getAuditLogs
};

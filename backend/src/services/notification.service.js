const prisma = require("./prisma");
const socketService = require("./socket.service");

/**
 * Create a new notification for a user
 * @param {number} userId 
 * @param {string} type 'TICKET_ASSIGNED', 'STATUS_UPDATE', 'NEW_COMMENT'
 * @param {string} title 
 * @param {string} message 
 * @param {number} ticketId (Optional)
 */
async function createNotification(userId, type, title, message, ticketId = null) {
  try {
    const notification = await prisma.notification.create({
      data: {
        userId: parseInt(userId),
        type,
        title,
        message,
        ticketId: ticketId ? parseInt(ticketId) : null,
      },
    });

    // Real-time Notification
    socketService.emitToUser(userId, "new_notification", notification);

    return notification;
  } catch (error) {
    console.error("Create notification error:", error);
    return null;
  }
}

/**
 * Get all notifications for a user
 * @param {number} userId 
 * @param {boolean} onlyUnread (Optional)
 */
async function getUserNotifications(userId, onlyUnread = false) {
  const where = { userId: parseInt(userId) };
  if (onlyUnread) where.isRead = false;

  return await prisma.notification.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: 50
  });
}

/**
 * Mark a notification as read
 * @param {number} notificationId 
 * @param {number} userId (Security check)
 */
async function markAsRead(notificationId, userId) {
  return await prisma.notification.updateMany({
    where: {
      id: parseInt(notificationId),
      userId: parseInt(userId)
    },
    data: { isRead: true }
  });
}

/**
 * Delete a notification
 * @param {number} notificationId 
 * @param {number} userId (Security check)
 */
async function deleteNotification(notificationId, userId) {
  return await prisma.notification.deleteMany({
    where: {
      id: parseInt(notificationId),
      userId: parseInt(userId)
    }
  });
}

/**
 * Mark all notifications as read for a user
 * @param {number} userId 
 */
async function markAllAsRead(userId) {
  return await prisma.notification.updateMany({
    where: { userId: parseInt(userId), isRead: false },
    data: { isRead: true }
  });
}

module.exports = {
  createNotification,
  getUserNotifications,
  markAsRead,
  deleteNotification,
  markAllAsRead
};

const activityService = require("../services/activity.service");

/**
 * Get history for a specific ticket
 * GET /api/tickets/:id/history
 */
exports.getTicketHistory = async (req, res) => {
  try {
    const { id } = req.params;
    const history = await activityService.getTicketHistory(id);
    res.json(history);
  } catch (error) {
    console.error("Error fetching ticket history:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

/**
 * Get global audit logs
 * GET /api/audit-logs
 */
exports.getAuditLogs = async (req, res) => {
  try {
    const filters = {
      search: req.query.search,
      action: req.query.action,
      userId: req.query.userId,
      limit: req.query.limit || 50,
      offset: req.query.offset || 0
    };
    
    const auditLogs = await activityService.getAuditLogs(filters);
    res.json(auditLogs);
  } catch (error) {
    console.error("Error fetching audit logs:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

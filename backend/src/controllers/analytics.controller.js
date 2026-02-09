const analyticsService = require("../services/analytics.service");
const predictionService = require("../services/prediction.service");

/**
 * Get dashboard overview metrics
 * GET /api/analytics/dashboard
 */
exports.getDashboard = async (req, res) => {
  try {
    const dashboardData = await analyticsService.getDashboardMetrics();
    res.json(dashboardData);
  } catch (error) {
    console.error("Dashboard analytics error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

/**
 * Get trend data (daily/weekly/monthly)
 * GET /api/analytics/trends?period=weekly
 */
exports.getTrends = async (req, res) => {
  try {
    const { period = "weekly" } = req.query;
    
    if (!["daily", "weekly", "monthly"].includes(period)) {
      return res.status(400).json({
        message: "Invalid period. Must be 'daily', 'weekly', or 'monthly'"
      });
    }

    const trendData = await analyticsService.getTrendData(period);
    res.json(trendData);
  } catch (error) {
    console.error("Trends analytics error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

/**
 * Get agent performance metrics
 * GET /api/analytics/performance
 */
exports.getPerformance = async (req, res) => {
  try {
    const performanceData = await analyticsService.getAgentPerformance();
    res.json(performanceData);
  } catch (error) {
    console.error("Performance analytics error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

/**
 * Get category breakdown
 * GET /api/analytics/category-breakdown
 */
exports.getCategoryBreakdown = async (req, res) => {
  try {
    const categoryData = await analyticsService.getCategoryBreakdown();
    res.json(categoryData);
  } catch (error) {
    console.error("Category breakdown error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

/**
 * Get SLA compliance metrics
 * GET /api/analytics/sla-compliance
 */
exports.getSLACompliance = async (req, res) => {
  try {
    const slaData = await analyticsService.getSLACompliance();
    res.json(slaData);
  } catch (error) {
    console.error("SLA compliance error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

/**
 * Predict resolution time for a ticket
 * GET /api/analytics/predict-resolution-time/:ticketId
 */
exports.predictResolutionTime = async (req, res) => {
  try {
    const { ticketId } = req.params;
    const prediction = await predictionService.predictResolutionTime(ticketId);
    res.json(prediction);
  } catch (error) {
    console.error("Prediction error:", error);
    res.status(500).json({ message: error.message || "Internal server error" });
  }
};

/**
 * Recommend agents for a ticket
 * GET /api/analytics/recommend-agent/:ticketId
 */
exports.recommendAgent = async (req, res) => {
  try {
    const { ticketId } = req.params;
    const recommendations = await predictionService.recommendAgent(ticketId);
    res.json(recommendations);
  } catch (error) {
    console.error("Recommendation error:", error);
    res.status(500).json({ message: error.message || "Internal server error" });
  }
};

/**
 * Get ticket clusters/hot topics
 * GET /api/analytics/ticket-clustering
 */
exports.getTicketClustering = async (req, res) => {
  try {
    const clusters = await predictionService.getTicketClusters();
    res.json(clusters);
  } catch (error) {
    console.error("Clustering error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

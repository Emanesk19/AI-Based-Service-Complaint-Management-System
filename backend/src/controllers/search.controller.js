const searchService = require("../services/search.service");

/**
 * Search tickets with advanced filters
 * GET /api/tickets/search
 */
exports.searchTickets = async (req, res) => {
  try {
    const result = await searchService.searchTickets(req.query);
    res.json(result);
  } catch (error) {
    console.error("Search error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

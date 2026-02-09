const prisma = require("./prisma");

/**
 * Advanced search for tickets with filtering, sorting, and pagination
 * @param {Object} params - Search parameters
 * @param {string} params.q - Search keyword (title/description)
 * @param {string} params.status - Filter by status
 * @param {string} params.priority - Filter by priority
 * @param {string} params.category - Filter by category
 * @param {number} params.agentId - Filter by assigned agent
 * @param {string} params.startDate - Filter by creation date start (ISO)
 * @param {string} params.endDate - Filter by creation date end (ISO)
 * @param {string} params.sortBy - Field to sort by (createdAt, priority, status)
 * @param {string} params.order - Sort order (asc/desc)
 * @param {number} params.page - Page number
 * @param {number} params.limit - Items per page
 */
async function searchTickets(params) {
  const {
    q,
    status,
    priority,
    category,
    agentId,
    startDate,
    endDate,
    sortBy = "createdAt",
    order = "desc",
    page = 1,
    limit = 10
  } = params;

  const skip = (page - 1) * limit;

  // Build where clause
  const where = {};

  // Full-text search (case-insensitive)
  if (q) {
    where.OR = [
      { title: { contains: q, mode: "insensitive" } },
      { description: { contains: q, mode: "insensitive" } }
    ];
  }

  // Filters
  if (status) where.status = status;
  if (priority) where.priority = priority;
  if (category) where.category = category;
  if (agentId) where.agentId = parseInt(agentId);

  // Date range
  if (startDate || endDate) {
    where.createdAt = {};
    if (startDate) where.createdAt.gte = new Date(startDate);
    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999); // Include the entire end day
      where.createdAt.lte = end;
    }
  }

  // Execute query
  const [tickets, total] = await Promise.all([
    prisma.ticket.findMany({
      where,
      orderBy: { [sortBy]: order },
      skip,
      take: parseInt(limit),
      include: {
        user: { select: { id: true, name: true, email: true } },
        agent: { select: { id: true, name: true, email: true } },
        _count: { select: { comments: true, attachments: true } }
      }
    }),
    prisma.ticket.count({ where })
  ]);

  return {
    tickets,
    pagination: {
      total,
      page: parseInt(page),
      limit: parseInt(limit),
      totalPages: Math.ceil(total / limit)
    }
  };
}

module.exports = {
  searchTickets
};

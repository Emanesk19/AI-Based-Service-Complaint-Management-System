const prisma = require("../services/prisma");

/**
 * Get all users with filtering and pagination
 * GET /api/users
 */
exports.getAllUsers = async (req, res) => {
  try {
    const { role, status, search, page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;

    const where = {};

    if (role) where.role = role;
    if (status) where.isActive = status === "true";

    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } }
      ];
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          isActive: true, // Note: Schema update required for isActive
          createdAt: true,
          updatedAt: true,
          _count: {
            select: {
              tickets: true,
              assigned: true
            }
          }
        },
        skip,
        take: parseInt(limit),
        orderBy: { createdAt: "desc" }
      }),
      prisma.user.count({ where })
    ]);

    res.json({
      users,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error("Get all users error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

/**
 * Get user by ID
 * GET /api/users/:id
 */
exports.getUserById = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await prisma.user.findUnique({
      where: { id: parseInt(id) },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        tickets: {
          take: 5,
          orderBy: { createdAt: "desc" },
          select: { id: true, title: true, status: true, priority: true }
        },
        assigned: {
          take: 5,
          orderBy: { createdAt: "desc" },
          select: { id: true, title: true, status: true, priority: true }
        }
      }
    });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json(user);

  } catch (error) {
    console.error("Get user details error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

/**
 * Update user role
 * PUT /api/users/:id/role
 */
exports.updateUserRole = async (req, res) => {
  try {
    const { id } = req.params;
    const { role } = req.body;

    if (!["user", "agent", "admin"].includes(role)) {
      return res.status(400).json({ message: "Invalid role" });
    }

    const updatedUser = await prisma.user.update({
      where: { id: parseInt(id) },
      data: { role },
      select: { id: true, name: true, role: true }
    });

    res.json({
      message: "User role updated successfully",
      user: updatedUser
    });

  } catch (error) {
    console.error("Update role error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

/**
 * Update user status (active/inactive)
 * PUT /api/users/:id/status
 */
exports.updateUserStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { isActive } = req.body;

    if (typeof isActive !== "boolean") {
      return res.status(400).json({ message: "Invalid status" });
    }
    
    // Check if trying to deactivate self
    if (parseInt(id) === req.user.id) {
      return res.status(400).json({ message: "Cannot deactivate your own account" });
    }

    const updatedUser = await prisma.user.update({
      where: { id: parseInt(id) },
      data: { isActive },
      select: { id: true, name: true, isActive: true }
    });

    res.json({
      message: `User ${isActive ? "activated" : "deactivated"} successfully`,
      user: updatedUser
    });

  } catch (error) {
    console.error("Update status error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

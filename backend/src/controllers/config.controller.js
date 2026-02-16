const prisma = require("../services/prisma");

/**
 * Get all categories
 * GET /api/config/categories
 */
exports.getCategories = async (req, res) => {
  try {
    const categories = await prisma.category.findMany({
      orderBy: { name: "asc" }
    });
    res.json(categories);
  } catch (error) {
    console.error("Get categories error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

/**
 * Create a new category
 * POST /api/config/categories
 */
exports.createCategory = async (req, res) => {
  try {
    const { name } = req.body;
    if (!name) return res.status(400).json({ message: "Name is required" });

    const category = await prisma.category.create({
      data: { name }
    });
    res.status(201).json(category);
  } catch (error) {
    if (error.code === 'P2002') {
      return res.status(400).json({ message: "Category name already exists" });
    }
    console.error("Create category error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

/**
 * Delete a category
 * DELETE /api/config/categories/:id
 */
exports.deleteCategory = async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.category.delete({
      where: { id: parseInt(id) }
    });
    res.json({ message: "Category deleted" });
  } catch (error) {
    console.error("Delete category error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

/**
 * Get all priorities
 * GET /api/config/priorities
 */
exports.getPriorities = async (req, res) => {
  try {
    const priorities = await prisma.priority.findMany({
      orderBy: { level: "asc" }
    });
    res.json(priorities);
  } catch (error) {
    console.error("Get priorities error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

/**
 * Create a new priority
 * POST /api/config/priorities
 */
exports.createPriority = async (req, res) => {
  try {
    const { name, level } = req.body;
    if (!name || level === undefined) {
      return res.status(400).json({ message: "Name and level are required" });
    }

    const priority = await prisma.priority.create({
      data: { name, level: parseInt(level) }
    });
    res.status(201).json(priority);
  } catch (error) {
    if (error.code === 'P2002') {
      return res.status(400).json({ message: "Priority name already exists" });
    }
    console.error("Create priority error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

/**
 * Delete a priority
 * DELETE /api/config/priorities/:id
 */
exports.deletePriority = async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.priority.delete({
      where: { id: parseInt(id) }
    });
    res.json({ message: "Priority deleted" });
  } catch (error) {
    console.error("Delete priority error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

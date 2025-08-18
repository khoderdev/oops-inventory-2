import Category from "../models/Category.js";
import { Op } from "sequelize";
import { parsePaginationParams, buildPaginationResponse, buildFilterConditions, parseFieldSelection } from "../utils/paginationHelpers.js";

// Helper function to generate URL-friendly value from name
const generateValueFromName = (name) => {
  if (!name) return "";
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '') // Remove special characters except spaces and hyphens
    .replace(/\s+/g, '_') // Replace spaces with underscores
    .replace(/-+/g, '_') // Replace hyphens with underscores
    .replace(/_+/g, '_') // Replace multiple underscores with single
    .replace(/^_|_$/g, ''); // Remove leading/trailing underscores
};

const categoryController = {
  // Get all categories with filtering and pagination
  getAllCategories: async (req, res, next) => {
    try {
      const { type, isActive = "true", fields = "" } = req.query;

      // Parse pagination parameters
      const paginationParams = parsePaginationParams(req.query, {
        defaultLimit: 50,
        maxLimit: 200,
        allowedSortFields: ["name", "value", "type", "sortOrder", "createdAt", "updatedAt"]
      });

      // Build filter conditions
      const whereClause = buildFilterConditions(
        req.query,
        {
          searchFields: ["name", "value", "description"],
          exactFilters: ["type"],
          booleanFilters: ["isActive"]
        },
        Op
      );

      // Parse field selection for optimized transfer
      const attributes = parseFieldSelection(fields, ["id", "name", "value", "type", "description", "isActive", "sortOrder", "createdAt", "updatedAt"]);

      const { count, rows } = await Category.findAndCountAll({
        where: whereClause,
        attributes,
        ...paginationParams,
        distinct: true
      });

      const response = buildPaginationResponse(rows, count, paginationParams);
      res.json(response);
    } catch (error) {
      next(error);
    }
  },

  // Get categories by type (materials or menu_items)
  getCategoriesByType: async (req, res, next) => {
    try {
      const { type } = req.params;
      const { isActive = "true" } = req.query;

      if (!["materials", "menu_items", "beverages"].includes(type)) {
        return res.status(400).json({
          error: "Invalid category type. Must be 'materials', 'menu_items', or 'beverages'"
        });
      }

      const whereClause = { type };
      if (isActive !== "all") {
        whereClause.isActive = isActive === "true";
      }

      const categories = await Category.findAll({
        where: whereClause,
        order: [
          ["sortOrder", "ASC"],
          ["name", "ASC"]
        ]
      });

      // Return structure consistent with CategoriesResponse interface
      res.json({
        currentPage: 1,
        totalPages: 1,
        totalItems: categories,
        endIndex: categories.length,
        hasNextPage: false,
        hasPreviousPage: false,
        itemsPerPage: {
          page: 1,
          limit: categories.length,
          offset: 0,
          sortBy: "sortOrder",
          sortOrder: "ASC"
        },
        limit: categories.length,
        offset: 0,
        page: 1,
        sortBy: "sortOrder",
        sortOrder: "ASC",
        startIndex: 1
      });
    } catch (error) {
      next(error);
    }
  },

  // Get single category by ID
  getCategoryById: async (req, res, next) => {
    try {
      const { id } = req.params;

      const category = await Category.findByPk(id);

      if (!category) {
        return res.status(404).json({
          error: "Category not found"
        });
      }

      res.json({
        success: true,
        data: category
      });
    } catch (error) {
      next(error);
    }
  },

  // Create new category
  createCategory: async (req, res, next) => {
    try {
      const { name, value, type, description, isActive, sortOrder } = req.body;
      if (!name || !type) {
        return res.status(400).json({
          error: "Name and type are required fields"
        });
      }
      
      // Auto-generate value from name if not provided
      const categoryValue = value || generateValueFromName(name);
      // Validate type
      if (!["materials", "menu_items", "beverages"].includes(type)) {
        return res.status(400).json({
          error: "Type must be 'materials', 'menu_items', or 'beverages'"
        });
      }
      const existingCategory = await Category.findOne({
        where: {
          value: categoryValue,
          type
        }
      });

      if (existingCategory) {
        return res.status(400).json({
          error: `Category value '${categoryValue}' already exists for type '${type}'. Please choose a different value or use a different type.`
        });
      }
      try {
        const category = await Category.create({
          name,
          value: categoryValue,
          type,
          description,
          isActive: isActive !== undefined ? isActive : true,
          sortOrder: sortOrder || 0
        });
        res.status(201).json({
          success: true,
          message: "Category created successfully",
          data: category
        });
      } catch (err) {
        console.error("Failed to create category in database:", err);
        console.error("Validation errors:", err.errors ? JSON.stringify(err.errors) : "No validation details");
        
        // Handle PostgreSQL sequence out of sync error
        if (err.name === "SequelizeUniqueConstraintError" && err.parent?.constraint === "categories_pkey") {
          console.log("🔧 Detected PostgreSQL sequence issue, attempting to fix...");
          try {
            // Get max ID and reset sequence
            const [maxResult] = await Category.sequelize.query('SELECT MAX(id) as max_id FROM categories');
            const maxId = maxResult[0].max_id || 0;
            await Category.sequelize.query(`SELECT setval('categories_id_seq', ${maxId})`);
            console.log(`✅ Sequence reset to ${maxId}, retrying category creation...`);
            
            // Retry the creation
            const category = await Category.create({
              name,
              value: categoryValue,
              type,
              description,
              isActive: isActive !== undefined ? isActive : true,
              sortOrder: sortOrder || 0
            });
            
            return res.status(201).json({
              success: true,
              message: "Category created successfully (after sequence fix)",
              data: category
            });
          } catch (retryErr) {
            console.error("Failed to fix sequence and retry:", retryErr);
            return res.status(500).json({
              error: "Database sequence error - please try again",
              details: retryErr.message
            });
          }
        }
        
        if (err.name === "SequelizeValidationError" || err.name === "SequelizeUniqueConstraintError") {
          return res.status(400).json({
            error: err.message,
            details: err.errors.map(e => ({ field: e.path, message: e.message }))
          });
        }
        throw err;
      }
    } catch (error) {
      console.error("Error creating category:", error);
      return res.status(500).json({
        error: "Internal Server Error",
        details: error.message
      });
    }
  },

  // Update category
  updateCategory: async (req, res, next) => {
    try {
      const { id } = req.params;
      const { name, value, type, description, isActive, sortOrder } = req.body;
      const category = await Category.findByPk(id);
      if (!category) {
        return res.status(404).json({
          error: "Category not found"
        });
      }
      
      // Auto-generate value from name if name changed, unless explicit value provided
      let categoryValue;
      if (value !== undefined) {
        // Explicit value provided, use it
        categoryValue = value;
      } else if (name && name !== category.name) {
        // Name changed and no explicit value, auto-generate from new name
        categoryValue = generateValueFromName(name);
      } else {
        // No changes to name or value, keep existing
        categoryValue = category.value;
      }
      
      const updatedType = type || category.type;
      if ((categoryValue && categoryValue !== category.value) || (type && type !== category.type)) {
        const existingCategory = await Category.findOne({
          where: {
            value: categoryValue,
            type: updatedType,
            id: { [Op.ne]: id }
          }
        });
        if (existingCategory) {
          return res.status(400).json({
            error: `Category value '${categoryValue}' already exists for type '${updatedType}'. Please choose a different value.`
          });
        }
      }
      if (type && !["materials", "menu_items", "beverages"].includes(type)) {
        return res.status(400).json({
          error: "Type must be 'materials', 'menu_items', or 'beverages'"
        });
      }
      await category.update({
        ...(name !== undefined && { name }),
        ...(categoryValue !== category.value && { value: categoryValue }),
        ...(type !== undefined && { type }),
        ...(description !== undefined && { description }),
        ...(isActive !== undefined && { isActive }),
        ...(sortOrder !== undefined && { sortOrder })
      });
      res.json({
        success: true,
        message: "Category updated successfully",
        data: category
      });
    } catch (error) {
      if (error.name === "SequelizeValidationError") {
        return res.status(400).json({
          error: "Validation error",
          details: error.errors.map(e => e.message)
        });
      }
      next(error);
    }
  },

  // Delete category
  deleteCategory: async (req, res, next) => {
    try {
      const { id } = req.params;
      const category = await Category.findByPk(id);
      if (!category) {
        return res.status(404).json({
          error: "Category not found"
        });
      }
      await category.destroy();
      res.json({
        success: true,
        message: "Category deleted successfully"
      });
    } catch (error) {
      next(error);
    }
  },

  // Bulk update sort orders
  updateSortOrders: async (req, res, next) => {
    try {
      const { categories } = req.body;
      if (!Array.isArray(categories)) {
        return res.status(400).json({
          error: "Categories must be an array"
        });
      }
      const updatePromises = categories.map(({ id, sortOrder }) => Category.update({ sortOrder }, { where: { id } }));
      await Promise.all(updatePromises);
      res.json({
        success: true,
        message: "Sort orders updated successfully"
      });
    } catch (error) {
      next(error);
    }
  }
};

export default categoryController;

import Category from "../models/Category.js";
import { Op } from "sequelize";
import { parsePaginationParams, buildPaginationResponse, buildFilterConditions, parseFieldSelection } from "../utils/paginationHelpers.js";

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

      if (!["materials", "menu_items"].includes(type)) {
        return res.status(400).json({
          error: "Invalid category type. Must be 'materials' or 'menu_items'"
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
      const { name, value, type, description, isActive = true, sortOrder = 0 } = req.body;

      // Validate required fields
      if (!name || !value || !type) {
        return res.status(400).json({
          error: "Name, value, and type are required fields"
        });
      }

      // Validate type
      if (!["materials", "menu_items"].includes(type)) {
        return res.status(400).json({
          error: "Type must be either 'materials' or 'menu_items'"
        });
      }

      // Check if value already exists
      const existingCategory = await Category.findOne({ where: { value } });
      if (existingCategory) {
        return res.status(400).json({
          error: "Category value already exists. Please choose a different value."
        });
      }

      const category = await Category.create({
        name,
        value,
        type,
        description,
        isActive,
        sortOrder
      });

      res.status(201).json({
        success: true,
        message: "Category created successfully",
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

      // If updating value, check for uniqueness
      if (value && value !== category.value) {
        const existingCategory = await Category.findOne({
          where: {
            value,
            id: { [Op.ne]: id }
          }
        });
        if (existingCategory) {
          return res.status(400).json({
            error: "Category value already exists. Please choose a different value."
          });
        }
      }

      // Validate type if provided
      if (type && !["materials", "menu_items"].includes(type)) {
        return res.status(400).json({
          error: "Type must be either 'materials' or 'menu_items'"
        });
      }

      await category.update({
        ...(name !== undefined && { name }),
        ...(value !== undefined && { value }),
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

      // Update each category's sort order
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

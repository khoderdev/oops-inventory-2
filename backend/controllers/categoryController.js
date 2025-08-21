import Category from "../models/Category.js";
import CategoryType from "../models/CategoryType.js";
import { Op } from "sequelize";
import { parsePaginationParams, buildPaginationResponse, buildFilterConditions, parseFieldSelection } from "../utils/paginationHelpers.js";
import {  MenuItemIngredient } from "../models/index.js";
import Material from "../models/materials.js";


// Helper function to generate URL-friendly value from name
const generateValueFromName = name => {
  if (!name) return "";
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "") // Remove special characters except spaces and hyphens
    .replace(/\s+/g, "_") // Replace spaces with underscores
    .replace(/-+/g, "_") // Replace hyphens with underscores
    .replace(/_+/g, "_") // Replace multiple underscores with single
    .replace(/^_|_$/g, ""); // Remove leading/trailing underscores
};

const categoryController = {
  // Get all categories regardless of type
  getAllCategoriesByType: async (req, res, next) => {
    try {
      const { isActive = "true" } = req.query;

      // Build where clause for Category
      const categoryWhere = {};
      if (isActive !== "all") {
        categoryWhere.isActive = isActive === "true";
      }

      const categories = await Category.findAll({
        where: categoryWhere,
        order: [
          ["sortOrder", "ASC"],
          ["name", "ASC"]
        ]
      });

      // Manually populate categoryTypes for each category
      for (const category of categories) {
        if (category.categoryTypeIds && category.categoryTypeIds.length > 0) {
          const categoryTypes = await CategoryType.findAll({
            where: { id: category.categoryTypeIds },
            attributes: ["id", "type", "createdAt", "updatedAt"]
          });
          category.dataValues.categoryTypes = categoryTypes;
        } else {
          category.dataValues.categoryTypes = [];
        }
      }

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
  // Get all categories with filtering and pagination
  getAllCategories: async (req, res, next) => {
    try {
      const { type, isActive = "true", fields = "" } = req.query;

      // Parse pagination parameters
      const paginationParams = parsePaginationParams(req.query, {
        defaultLimit: 50,
        maxLimit: 200,
        allowedSortFields: ["name", "value", "sortOrder", "createdAt", "updatedAt"]
      });

      // Build filter conditions for Category
      const whereClause = buildFilterConditions(
        req.query,
        {
          searchFields: ["name", "value", "description"],
          booleanFilters: ["isActive"]
        },
        Op
      );

      // Parse field selection for optimized transfer
      const attributes = parseFieldSelection(fields, ["id", "name", "value", "description", "isActive", "sortOrder", "createdAt", "updatedAt"]);

      // Get categories without include (since we removed associations)
      const { count, rows } = await Category.findAndCountAll({
        where: whereClause,
        attributes,
        ...paginationParams
      });

      // Manually populate categoryTypes for each category
      for (const category of rows) {
        if (category.categoryTypeIds && category.categoryTypeIds.length > 0) {
          const categoryTypes = await CategoryType.findAll({
            where: { id: category.categoryTypeIds },
            attributes: ["id", "type", "createdAt", "updatedAt"]
          });
          category.dataValues.categoryTypes = categoryTypes;
        } else {
          category.dataValues.categoryTypes = [];
        }
      }

      const response = buildPaginationResponse(rows, count, paginationParams);
      res.json(response);
    } catch (error) {
      next(error);
    }
  },

  // Get categories by type (materials, menu_items, or beverages)
  getCategoriesByType: async (req, res, next) => {
    try {
      const { type } = req.params;
      const { isActive = "true" } = req.query;

      if (typeof type !== "string" || type.trim().length === 0 || type.length > 50) {
        return res.status(400).json({
          error: "Type must be a non-empty string with maximum 50 characters"
        });
      }

      // First find the category type by name to get its ID
      const categoryType = await CategoryType.findOne({
        where: { type },
        attributes: ["id"]
      });
     
      if (!categoryType) {
        return res.json({
          currentPage: 1,
          totalPages: 1,
          totalItems: [],
          endIndex: 0,
          hasNextPage: false,
          hasPreviousPage: false,
          itemsPerPage: {
            page: 1,
            limit: 0,
            offset: 0,
            sortBy: "sortOrder",
            sortOrder: "ASC"
          },
          limit: 0,
          offset: 0,
          page: 1,
          sortBy: "sortOrder",
          sortOrder: "ASC",
          startIndex: 1
        });
      }

      // Build where clause for Category
      const categoryWhere = {
        categoryTypeIds: {
          [Op.contains]: [categoryType.id]
        }
      };
      if (isActive !== "all") {
        categoryWhere.isActive = isActive === "true";
      }

      const categories = await Category.findAll({
        where: categoryWhere,
        order: [
          ["sortOrder", "ASC"],
          ["name", "ASC"]
        ]
      });

      // Manually populate categoryTypes for each category
      for (const category of categories) {
        if (category.categoryTypeIds && category.categoryTypeIds.length > 0) {
          const categoryTypes = await CategoryType.findAll({
            where: { id: category.categoryTypeIds },
            attributes: ["id", "type", "createdAt", "updatedAt"]
          });
          category.dataValues.categoryTypes = categoryTypes;
        } else {
          category.dataValues.categoryTypes = [];
        }
      }

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

      // Manually fetch categoryTypes if categoryTypeIds exist
      if (category.categoryTypeIds && category.categoryTypeIds.length > 0) {
        const categoryTypes = await CategoryType.findAll({
          where: { id: category.categoryTypeIds },
          attributes: ["id", "type", "createdAt", "updatedAt"]
        });
        category.dataValues.categoryTypes = categoryTypes;
      } else {
        category.dataValues.categoryTypes = [];
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
      const { name, value, categoryTypeIds, description, isActive, sortOrder } = req.body;

      // Validate required fields
      if (!name || !categoryTypeIds || !Array.isArray(categoryTypeIds) || categoryTypeIds.length === 0) {
        return res.status(400).json({
          error: "Name and categoryTypeIds array are required fields"
        });
      }

      // Validate categoryTypeIds array
      const invalidIds = categoryTypeIds.filter(id => typeof id !== "number" || id <= 0 || !Number.isInteger(id));
      if (invalidIds.length > 0) {
        return res.status(400).json({
          error: "All categoryTypeIds must be positive integers"
        });
      }

      // Verify all category type IDs exist
      const existingCategoryTypes = await CategoryType.findAll({
        where: { id: categoryTypeIds },
        attributes: ["id"]
      });

      if (existingCategoryTypes.length !== categoryTypeIds.length) {
        const foundIds = existingCategoryTypes.map(ct => ct.id);
        const missingIds = categoryTypeIds.filter(id => !foundIds.includes(id));
        return res.status(400).json({
          error: `Category type IDs not found: ${missingIds.join(", ")}`
        });
      }

      const categoryValue = value || generateValueFromName(name);

      // Check if category with same name or value already exists
      const existingCategory = await Category.findOne({
        where: {
          [Op.or]: [{ name }, { value: categoryValue }]
        }
      });

      if (existingCategory) {
        return res.status(400).json({
          error: `Category with name '${name}' or value '${categoryValue}' already exists. Please choose different values.`
        });
      }

      // Create the category
      const category = await Category.create({
        name,
        value: categoryValue,
        description,
        isActive: isActive !== undefined ? isActive : true,
        sortOrder: sortOrder || 0,
        categoryTypeIds
      });

      // Fetch the created category and manually populate categoryTypes
      const createdCategory = await Category.findByPk(category.id);

      // Manually fetch categoryTypes if categoryTypeIds exist
      if (categoryTypeIds && categoryTypeIds.length > 0) {
        const categoryTypes = await CategoryType.findAll({
          where: { id: categoryTypeIds }
        });
        createdCategory.dataValues.categoryTypes = categoryTypes;
      } else {
        createdCategory.dataValues.categoryTypes = [];
      }

      res.status(201).json({
        success: true,
        message: "Category created successfully",
        data: createdCategory
      });
    } catch (error) {
      console.error("Error creating category:", error);

      if (error.name === "SequelizeValidationError" || error.name === "SequelizeUniqueConstraintError") {
        return res.status(400).json({
          error: error.message,
          details: error.errors
            ? error.errors.map(e => ({
                field: e.path,
                message: e.message
              }))
            : []
        });
      }

      next(error);
    }
  },

  // Update category
  updateCategory: async (req, res, next) => {
    try {
      const { id } = req.params;
      const { name, value, categoryTypeIds, description, isActive, sortOrder } = req.body;

      const category = await Category.findByPk(id);

      if (!category) {
        return res.status(404).json({
          error: "Category not found"
        });
      }

      // Auto-generate value from name if name changed, unless explicit value provided
      let categoryValue;
      if (value !== undefined) {
        categoryValue = value;
      } else if (name && name !== category.name) {
        categoryValue = generateValueFromName(name);
      } else {
        categoryValue = category.value;
      }

      // Check for conflicts with name or value
      if ((name && name !== category.name) || (categoryValue && categoryValue !== category.value)) {
        const existingCategory = await Category.findOne({
          where: {
            [Op.or]: [{ name: name || category.name }, { value: categoryValue }],
            id: { [Op.ne]: id }
          }
        });

        if (existingCategory) {
          return res.status(400).json({
            error: `Category with name '${name || category.name}' or value '${categoryValue}' already exists. Please choose different values.`
          });
        }
      }

      // Validate categoryTypeIds if provided
      if (categoryTypeIds) {
        if (!Array.isArray(categoryTypeIds) || categoryTypeIds.length === 0) {
          return res.status(400).json({
            error: "CategoryTypeIds must be a non-empty array"
          });
        }

        const invalidIds = categoryTypeIds.filter(id => typeof id !== "number" || id <= 0 || !Number.isInteger(id));
        if (invalidIds.length > 0) {
          return res.status(400).json({
            error: "All categoryTypeIds must be positive integers"
          });
        }

        // Verify all category type IDs exist
        const existingCategoryTypes = await CategoryType.findAll({
          where: { id: categoryTypeIds },
          attributes: ["id"]
        });

        if (existingCategoryTypes.length !== categoryTypeIds.length) {
          const foundIds = existingCategoryTypes.map(ct => ct.id);
          const missingIds = categoryTypeIds.filter(id => !foundIds.includes(id));
          return res.status(400).json({
            error: `Category type IDs not found: ${missingIds.join(", ")}`
          });
        }
      }

      // Update category
      await category.update({
        ...(name !== undefined && { name }),
        ...(categoryValue !== category.value && { value: categoryValue }),
        ...(description !== undefined && { description }),
        ...(isActive !== undefined && { isActive }),
        ...(sortOrder !== undefined && { sortOrder }),
        ...(categoryTypeIds !== undefined && { categoryTypeIds })
      });

      // Fetch updated category and manually populate categoryTypes
      const updatedCategory = await Category.findByPk(id);

      // Manually fetch categoryTypes if categoryTypeIds exist
      if (updatedCategory.categoryTypeIds && updatedCategory.categoryTypeIds.length > 0) {
        const categoryTypes = await CategoryType.findAll({
          where: { id: updatedCategory.categoryTypeIds }
        });
        updatedCategory.dataValues.categoryTypes = categoryTypes;
      } else {
        updatedCategory.dataValues.categoryTypes = [];
      }

      res.json({
        success: true,
        message: "Category updated successfully",
        data: updatedCategory
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

      // Delete category (no need for transaction since CategoryType is now independent)
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
  },

  // Bulk delete categories
  bulkDeleteCategories: async (req, res, next) => {
    try {
      const { ids } = req.body;
      
      if (!Array.isArray(ids) || ids.length === 0) {
        return res.status(400).json({
          error: "IDs must be a non-empty array"
        });
      }

      // Check if categories exist before deleting
      const existingCategories = await Category.findAll({
        where: { id: ids },
        attributes: ['id', 'name']
      });

      if (existingCategories.length === 0) {
        return res.status(404).json({
          error: "No categories found with the provided IDs"
        });
      }

      // Delete the categories
      const deletedCount = await Category.destroy({
        where: { id: ids }
      });

      res.json({
        success: true,
        message: `${deletedCount} categor${deletedCount === 1 ? 'y' : 'ies'} deleted successfully`,
        deletedCount
      });
    } catch (error) {
      console.error('Error in bulkDeleteCategories:', error);
      next(error);
    }
  },

  // Bulk update categories
  bulkUpdateCategories: async (req, res, next) => {
    try {
      const { ids, data } = req.body;
      
      if (!Array.isArray(ids) || ids.length === 0) {
        return res.status(400).json({
          error: "IDs must be a non-empty array"
        });
      }

      if (!data || typeof data !== 'object') {
        return res.status(400).json({
          error: "Data object is required for bulk update"
        });
      }

      // Check if categories exist before updating
      const existingCategories = await Category.findAll({
        where: { id: ids },
        attributes: ['id', 'name']
      });

      if (existingCategories.length === 0) {
        return res.status(404).json({
          error: "No categories found with the provided IDs"
        });
      }

      // Prepare update data - only include fields that are provided
      const updateData = {};
      
      if (data.name !== undefined) updateData.name = data.name;
      if (data.value !== undefined) updateData.value = data.value;
      if (data.isActive !== undefined) updateData.isActive = data.isActive;
      if (data.categoryTypeIds !== undefined) updateData.categoryTypeIds = data.categoryTypeIds;

      // Generate value from name if name is provided but value is not
      if (data.name && !data.value) {
        updateData.value = generateValueFromName(data.name);
      }

      // Perform bulk update
      const [updatedCount] = await Category.update(updateData, {
        where: { id: ids }
      });

      // Fetch updated categories to return
      const updatedCategories = await Category.findAll({
        where: { id: ids },
        order: [['sortOrder', 'ASC'], ['name', 'ASC']]
      });

      // Populate categoryTypes for each updated category
      for (const category of updatedCategories) {
        if (category.categoryTypeIds && category.categoryTypeIds.length > 0) {
          const categoryTypes = await CategoryType.findAll({
            where: { id: category.categoryTypeIds },
            attributes: ["id", "type", "createdAt", "updatedAt"]
          });
          category.dataValues.categoryTypes = categoryTypes;
        } else {
          category.dataValues.categoryTypes = [];
        }
      }

      res.json({
        success: true,
        message: `${updatedCount} categor${updatedCount === 1 ? 'y' : 'ies'} updated successfully`,
        updatedCount,
        data: updatedCategories
      });
    } catch (error) {
      console.error('Error in bulkUpdateCategories:', error);
      next(error);
    }
  }
};

export default categoryController;

import CategoryType from "../models/CategoryType.js";
import Category from "../models/Category.js";
import { Op } from "sequelize";
import { parsePaginationParams, buildPaginationResponse, buildFilterConditions, parseFieldSelection } from "../utils/paginationHelpers.js";

const categoryTypeController = {
  // Get all category types with filtering and pagination
  getAllCategoryTypes: async (req, res, next) => {
    try {
      const { type, categoryId, fields = "" } = req.query;

      // Parse pagination parameters
      const paginationParams = parsePaginationParams(req.query, {
        defaultLimit: 50,
        maxLimit: 200,
        allowedSortFields: ["type", "categoryId", "createdAt", "updatedAt"]
      });

      // Build filter conditions
      const whereClause = {};
      
      if (type) {
        whereClause.type = type;
      }
      
      if (categoryId) {
        whereClause.categoryId = categoryId;
      }

      // Parse field selection for optimized transfer
      const attributes = parseFieldSelection(fields, ["id", "categoryId", "type", "createdAt", "updatedAt"]);

      // Get category types without include (since we removed associations)
      const { count, rows } = await CategoryType.findAndCountAll({
        where: whereClause,
        attributes,
        ...paginationParams
      });

      const response = buildPaginationResponse(rows, count, paginationParams);
      res.json(response);
    } catch (error) {
      next(error);
    }
  },

  // Get category types by category ID
  getCategoryTypesByCategoryId: async (req, res, next) => {
    try {
      const { categoryId } = req.params;

      const categoryTypes = await CategoryType.findAll({
        where: { categoryId },
        include: [{
          model: Category,
          as: "category",
          attributes: ["id", "name", "value", "description", "isActive"]
        }],
        order: [["type", "ASC"]]
      });

      res.json({
        success: true,
        data: categoryTypes
      });
    } catch (error) {
      next(error);
    }
  },

  // Get category types by type
  getCategoryTypesByType: async (req, res, next) => {
    try {
      const { type } = req.params;

      if (typeof type !== 'string' || type.trim().length === 0 || type.length > 50) {
        return res.status(400).json({
          error: "Type must be a non-empty string with maximum 50 characters"
        });
      }

      const categoryTypes = await CategoryType.findAll({
        where: { type },
        include: [{
          model: Category,
          as: "category",
          attributes: ["id", "name", "value", "description", "isActive"]
        }],
        order: [["categoryId", "ASC"]]
      });

      res.json({
        success: true,
        data: categoryTypes
      });
    } catch (error) {
      next(error);
    }
  },

  // Get single category type by ID
  getCategoryTypeById: async (req, res, next) => {
    try {
      const { id } = req.params;

      const categoryType = await CategoryType.findByPk(id, {
        include: [{
          model: Category,
          as: "category",
          attributes: ["id", "name", "value", "description", "isActive"]
        }]
      });

      if (!categoryType) {
        return res.status(404).json({
          error: "Category type not found"
        });
      }

      res.json({
        success: true,
        data: categoryType
      });
    } catch (error) {
      next(error);
    }
  },

  // Create new category type
  createCategoryType: async (req, res, next) => {
    try {
      const { categoryId, type } = req.body;

      // Only type is required, categoryId is optional for flexibility
      if (!type) {
        return res.status(400).json({
          error: "Type is required field"
        });
      }

      // Validate type format
      if (typeof type !== 'string' || type.trim().length === 0 || type.length > 50) {
        return res.status(400).json({
          error: "Type must be a non-empty string with maximum 50 characters"
        });
      }

      // Check if category exists (only if categoryId is provided)
      if (categoryId) {
        const category = await Category.findByPk(categoryId);
        if (!category) {
          return res.status(400).json({
            error: "Category not found"
          });
        }

        // Check if category type combination already exists
        const existingCategoryType = await CategoryType.findOne({
          where: { categoryId, type }
        });

        if (existingCategoryType) {
          return res.status(400).json({
            error: `Category type '${type}' already exists for this category`
          });
        }
      }

      const categoryType = await CategoryType.create({
        categoryId: categoryId || null,
        type
      });

      // Fetch the created category type with category information (if categoryId exists)
      const createdCategoryType = await CategoryType.findByPk(categoryType.id, {
        include: categoryId ? [{
          model: Category,
          as: "category",
          attributes: ["id", "name", "value", "description", "isActive"]
        }] : []
      });

      res.status(201).json({
        success: true,
        message: "Category type created successfully",
        data: createdCategoryType
      });
    } catch (error) {
      if (error.name === "SequelizeValidationError" || error.name === "SequelizeUniqueConstraintError") {
        return res.status(400).json({
          error: error.message,
          details: error.errors ? error.errors.map(e => ({ field: e.path, message: e.message })) : []
        });
      }
      next(error);
    }
  },

  // Update category type
  updateCategoryType: async (req, res, next) => {
    try {
      const { id } = req.params;
      const { categoryId, type } = req.body;

      const categoryType = await CategoryType.findByPk(id);

      if (!categoryType) {
        return res.status(404).json({
          error: "Category type not found"
        });
      }

      // Validate type format if provided
      if (type && (typeof type !== 'string' || type.trim().length === 0 || type.length > 50)) {
        return res.status(400).json({
          error: "Type must be a non-empty string with maximum 50 characters"
        });
      }

      // Check if category exists if categoryId is being updated
      if (categoryId && categoryId !== categoryType.categoryId) {
        const category = await Category.findByPk(categoryId);
        if (!category) {
          return res.status(404).json({
            error: "Category not found"
          });
        }
      }

      // Check for conflicts if updating categoryId or type
      if ((categoryId && categoryId !== categoryType.categoryId) || (type && type !== categoryType.type)) {
        const conflictWhere = {
          categoryId: categoryId || categoryType.categoryId,
          type: type || categoryType.type,
          id: { [Op.ne]: id }
        };

        const existingCategoryType = await CategoryType.findOne({
          where: conflictWhere
        });

        if (existingCategoryType) {
          return res.status(400).json({
            error: `Category type '${type || categoryType.type}' already exists for this category`
          });
        }
      }

      // Update category type
      await categoryType.update({
        ...(categoryId !== undefined && { categoryId }),
        ...(type !== undefined && { type })
      });

      // Fetch updated category type with category information
      const updatedCategoryType = await CategoryType.findByPk(id, {
        include: [{
          model: Category,
          as: "category",
          attributes: ["id", "name", "value", "description", "isActive"]
        }]
      });

      res.json({
        success: true,
        message: "Category type updated successfully",
        data: updatedCategoryType
      });
    } catch (error) {
      if (error.name === "SequelizeValidationError" || error.name === "SequelizeUniqueConstraintError") {
        return res.status(400).json({
          error: error.message,
          details: error.errors ? error.errors.map(e => ({ field: e.path, message: e.message })) : []
        });
      }
      next(error);
    }
  },

  // Delete category type
  deleteCategoryType: async (req, res, next) => {
    try {
      const { id } = req.params;

      const categoryType = await CategoryType.findByPk(id);

      if (!categoryType) {
        return res.status(404).json({
          error: "Category type not found"
        });
      }

      await categoryType.destroy();

      res.json({
        success: true,
        message: "Category type deleted successfully"
      });
    } catch (error) {
      next(error);
    }
  },

  // Bulk create category types
  bulkCreateCategoryTypes: async (req, res, next) => {
    try {
      const { categoryTypes } = req.body;

      if (!Array.isArray(categoryTypes) || categoryTypes.length === 0) {
        return res.status(400).json({
          error: "CategoryTypes must be a non-empty array"
        });
      }

      // Validate all entries
      for (const ct of categoryTypes) {
        if (!ct.type) {
          return res.status(400).json({
            error: "Each category type must have a type field"
          });
        }

        if (typeof ct.type !== 'string' || ct.type.trim().length === 0 || ct.type.length > 50) {
          return res.status(400).json({
            error: `Type '${ct.type}' must be a non-empty string with maximum 50 characters`
          });
        }

        // categoryId is optional, but if provided must be valid
        if (ct.categoryId && (typeof ct.categoryId !== 'number' || ct.categoryId <= 0)) {
          return res.status(400).json({
            error: `CategoryId '${ct.categoryId}' must be a positive number`
          });
        }
      }

      // Check for duplicates in the request
      const duplicates = categoryTypes.filter((ct, index) => 
        categoryTypes.findIndex(other => other.categoryId === ct.categoryId && other.type === ct.type) !== index
      );

      if (duplicates.length > 0) {
        return res.status(400).json({
          error: "Duplicate category type combinations found in request"
        });
      }

      // Use transaction for consistency
      const transaction = await CategoryType.sequelize.transaction();

      try {
        const createdCategoryTypes = await CategoryType.bulkCreate(categoryTypes, {
          transaction,
          validate: true,
          ignoreDuplicates: false
        });

        await transaction.commit();

        // Fetch created category types with category information
        const categoryTypeIds = createdCategoryTypes.map(ct => ct.id);
        const fullCategoryTypes = await CategoryType.findAll({
          where: { id: categoryTypeIds },
          include: [{
            model: Category,
            as: "category",
            attributes: ["id", "name", "value", "description", "isActive"]
          }]
        });

        res.status(201).json({
          success: true,
          message: `${createdCategoryTypes.length} category types created successfully`,
          data: fullCategoryTypes
        });
      } catch (err) {
        await transaction.rollback();
        throw err;
      }
    } catch (error) {
      if (error.name === "SequelizeValidationError" || error.name === "SequelizeUniqueConstraintError") {
        return res.status(400).json({
          error: error.message,
          details: error.errors ? error.errors.map(e => ({ field: e.path, message: e.message })) : []
        });
      }
      next(error);
    }
  },

  // Bulk delete category types
  bulkDeleteCategoryTypes: async (req, res, next) => {
    try {
      const { ids } = req.body;

      if (!Array.isArray(ids) || ids.length === 0) {
        return res.status(400).json({
          error: "IDs must be a non-empty array"
        });
      }

      const deletedCount = await CategoryType.destroy({
        where: { id: ids }
      });

      res.json({
        success: true,
        message: `${deletedCount} category types deleted successfully`,
        deletedCount
      });
    } catch (error) {
      next(error);
    }
  }
};

export default categoryTypeController;

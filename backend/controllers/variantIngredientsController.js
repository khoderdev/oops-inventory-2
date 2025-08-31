import sequelize from "../config/database.js";
import { VariantIngredient, Variants, Material, Sauce } from "../models/index.js";

const variantIngredientsController = {
  // Get all ingredients for a specific variant
  getIngredientsByVariantId: async (req, res, next) => {
    try {
      const { variantId } = req.params;
      const { includeInactive } = req.query;

      const whereClause = { variantId };
      if (!includeInactive || includeInactive === "false") {
        whereClause.isActive = true;
      }

      const ingredients = await VariantIngredient.findAll({
        where: whereClause,
        order: [
          ["sortOrder", "ASC"],
          ["id", "ASC"]
        ],
        include: [
          {
            model: Variants,
            as: "variant",
            attributes: ["id", "name", "volume", "unit", "price"],
            required: false
          },
          {
            model: Material,
            as: "material",
            attributes: ["id", "name", "unit", "unitType"],
            required: false
          },
          {
            model: Sauce,
            as: "sauce",
            attributes: ["id", "name", "totalCost", "costPerUnit", "yield", "yieldUnit"],
            required: false
          }
        ]
      });

      res.status(200).json({
        success: true,
        data: ingredients,
        count: ingredients.length
      });
    } catch (error) {
      next(error);
    }
  },

  // Get all variant ingredients (with optional filtering)
  getAllVariantIngredients: async (req, res, next) => {
    try {
      const { variantId, materialId, sauceId, isActive, limit = 100, offset = 0 } = req.query;

      const whereClause = {};
      if (variantId) whereClause.variantId = variantId;
      if (materialId) whereClause.materialId = materialId;
      if (sauceId) whereClause.sauceId = sauceId;
      if (isActive !== undefined) whereClause.isActive = isActive === "true";

      const ingredients = await VariantIngredient.findAndCountAll({
        where: whereClause,
        limit: parseInt(limit),
        offset: parseInt(offset),
        order: [
          ["variantId", "ASC"],
          ["sortOrder", "ASC"]
        ],
        include: [
          {
            model: Variants,
            as: "variant",
            attributes: ["id", "name", "volume", "unit", "price"],
            required: false
          },
          {
            model: Material,
            as: "material",
            attributes: ["id", "name", "unit", "unitType"],
            required: false
          },
          {
            model: Sauce,
            as: "sauce",
            attributes: ["id", "name", "totalCost", "costPerUnit", "yield", "yieldUnit"],
            required: false
          }
        ]
      });

      res.status(200).json({
        success: true,
        data: ingredients.rows,
        count: ingredients.count,
        pagination: {
          limit: parseInt(limit),
          offset: parseInt(offset),
          total: ingredients.count
        }
      });
    } catch (error) {
      next(error);
    }
  },

  // Get a single variant ingredient by ID
  getVariantIngredientById: async (req, res, next) => {
    try {
      const { id } = req.params;

      const ingredient = await VariantIngredient.findByPk(id, {
        include: [
          {
            model: Variants,
            as: "variant",
            attributes: ["id", "name", "volume", "unit", "price"],
            required: false
          },
          {
            model: Material,
            as: "material",
            attributes: ["id", "name", "unit", "unitType"],
            required: false
          },
          {
            model: Sauce,
            as: "sauce",
            attributes: ["id", "name", "totalCost", "costPerUnit", "yield", "yieldUnit"],
            required: false
          }
        ]
      });

      if (!ingredient) {
        return res.status(404).json({
          success: false,
          message: "Variant ingredient not found"
        });
      }

      res.status(200).json({
        success: true,
        data: ingredient
      });
    } catch (error) {
      next(error);
    }
  },

  // Create a new variant ingredient
  createVariantIngredient: async (req, res, next) => {
    const transaction = await sequelize.transaction();

    try {
      const { variantId, materialId, sauceId, quantity, unit, cost, sortOrder, isActive, notes } = req.body;

      // Validation
      if (!variantId) {
        return res.status(400).json({
          success: false,
          message: "Variant ID is required"
        });
      }

      if ((!materialId && !sauceId) || (materialId && sauceId)) {
        return res.status(400).json({
          success: false,
          message: "Must specify either materialId or sauceId, but not both"
        });
      }

      if (!quantity || quantity <= 0) {
        return res.status(400).json({
          success: false,
          message: "Quantity must be a positive number"
        });
      }

      if (!unit) {
        return res.status(400).json({
          success: false,
          message: "Unit is required"
        });
      }

      // Check if variant exists
      const variant = await Variants.findByPk(variantId);
      if (!variant) {
        return res.status(404).json({
          success: false,
          message: "Variant not found"
        });
      }

      // Check if material or sauce exists
      if (materialId) {
        const material = await Material.findByPk(materialId);
        if (!material) {
          return res.status(404).json({
            success: false,
            message: "Material not found"
          });
        }
      }

      if (sauceId) {
        const sauce = await Sauce.findByPk(sauceId);
        if (!sauce) {
          return res.status(404).json({
            success: false,
            message: "Sauce not found"
          });
        }
      }

      // Check for duplicate ingredient in the same variant
      const existingIngredient = await VariantIngredient.findOne({
        where: {
          variantId,
          ...(materialId ? { materialId } : { sauceId })
        }
      });

      if (existingIngredient) {
        return res.status(409).json({
          success: false,
          message: "This ingredient already exists for this variant"
        });
      }

      const ingredient = await VariantIngredient.create(
        {
          variantId,
          materialId: materialId || null,
          sauceId: sauceId || null,
          quantity,
          unit,
          cost: cost || 0,
          sortOrder: sortOrder || 0,
          isActive: isActive !== undefined ? isActive : true,
          notes: notes || null
        },
        { transaction }
      );

      await transaction.commit();

      // Fetch the created ingredient with associations
      const createdIngredient = await VariantIngredient.findByPk(ingredient.id, {
        include: [
          {
            model: Variants,
            as: "variant",
            attributes: ["id", "name", "volume", "unit", "price"]
          },
          {
            model: Material,
            as: "material",
            attributes: ["id", "name", "unit", "unitType"]
          },
          {
            model: Sauce,
            as: "sauce",
            attributes: ["id", "name", "totalCost", "costPerUnit", "yield", "yieldUnit"]
          }
        ]
      });

      res.status(201).json({
        success: true,
        data: createdIngredient,
        message: "Variant ingredient created successfully"
      });
    } catch (error) {
      await transaction.rollback();
      next(error);
    }
  },

  // Update a variant ingredient
  updateVariantIngredient: async (req, res, next) => {
    const transaction = await sequelize.transaction();

    try {
      const { id } = req.params;
      const { variantId, materialId, sauceId, quantity, unit, cost, sortOrder, isActive, notes } = req.body;

      const ingredient = await VariantIngredient.findByPk(id);
      if (!ingredient) {
        return res.status(404).json({
          success: false,
          message: "Variant ingredient not found"
        });
      }

      // Validation for material/sauce exclusivity
      if (materialId && sauceId) {
        return res.status(400).json({
          success: false,
          message: "Cannot specify both materialId and sauceId"
        });
      }

      if (!materialId && !sauceId) {
        return res.status(400).json({
          success: false,
          message: "Must specify either materialId or sauceId"
        });
      }

      // Check for duplicate if changing ingredient type
      if ((materialId && materialId !== ingredient.materialId) || (sauceId && sauceId !== ingredient.sauceId) || (variantId && variantId !== ingredient.variantId)) {
        const existingIngredient = await VariantIngredient.findOne({
          where: {
            id: { [sequelize.Op.ne]: id },
            variantId: variantId || ingredient.variantId,
            ...(materialId ? { materialId } : { sauceId })
          }
        });

        if (existingIngredient) {
          return res.status(409).json({
            success: false,
            message: "This ingredient already exists for this variant"
          });
        }
      }

      await ingredient.update(
        {
          ...(variantId !== undefined && { variantId }),
          ...(materialId !== undefined && { materialId }),
          ...(sauceId !== undefined && { sauceId }),
          ...(quantity !== undefined && { quantity }),
          ...(unit !== undefined && { unit }),
          ...(cost !== undefined && { cost }),
          ...(sortOrder !== undefined && { sortOrder }),
          ...(isActive !== undefined && { isActive }),
          ...(notes !== undefined && { notes })
        },
        { transaction }
      );

      await transaction.commit();

      // Fetch updated ingredient with associations
      const updatedIngredient = await VariantIngredient.findByPk(id, {
        include: [
          {
            model: Variants,
            as: "variant",
            attributes: ["id", "name", "volume", "unit", "price"]
          },
          {
            model: Material,
            as: "material",
            attributes: ["id", "name", "unit", "unitType"]
          },
          {
            model: Sauce,
            as: "sauce",
            attributes: ["id", "name", "totalCost", "costPerUnit", "yield", "yieldUnit"]
          }
        ]
      });

      res.status(200).json({
        success: true,
        data: updatedIngredient,
        message: "Variant ingredient updated successfully"
      });
    } catch (error) {
      await transaction.rollback();
      next(error);
    }
  },

  // Delete a variant ingredient
  deleteVariantIngredient: async (req, res, next) => {
    const transaction = await sequelize.transaction();

    try {
      const { id } = req.params;

      const ingredient = await VariantIngredient.findByPk(id);
      if (!ingredient) {
        return res.status(404).json({
          success: false,
          message: "Variant ingredient not found"
        });
      }

      await ingredient.destroy({ transaction });
      await transaction.commit();

      res.status(200).json({
        success: true,
        message: "Variant ingredient deleted successfully"
      });
    } catch (error) {
      await transaction.rollback();
      next(error);
    }
  },

  // Bulk create variant ingredients
  bulkCreateVariantIngredients: async (req, res, next) => {
    const transaction = await sequelize.transaction();

    try {
      const { ingredients } = req.body;

      if (!Array.isArray(ingredients) || ingredients.length === 0) {
        return res.status(400).json({
          success: false,
          message: "Ingredients array is required and cannot be empty"
        });
      }

      // Validate each ingredient
      for (const ingredient of ingredients) {
        if (!ingredient.variantId) {
          return res.status(400).json({
            success: false,
            message: "All ingredients must have a variantId"
          });
        }

        if ((!ingredient.materialId && !ingredient.sauceId) || (ingredient.materialId && ingredient.sauceId)) {
          return res.status(400).json({
            success: false,
            message: "Each ingredient must specify either materialId or sauceId, but not both"
          });
        }
      }

      const createdIngredients = await VariantIngredient.bulkCreate(
        ingredients.map(ingredient => ({
          variantId: ingredient.variantId,
          materialId: ingredient.materialId || null,
          sauceId: ingredient.sauceId || null,
          quantity: ingredient.quantity,
          unit: ingredient.unit,
          cost: ingredient.cost || 0,
          sortOrder: ingredient.sortOrder || 0,
          isActive: ingredient.isActive !== undefined ? ingredient.isActive : true,
          notes: ingredient.notes || null
        })),
        {
          transaction,
          validate: true,
          ignoreDuplicates: false
        }
      );

      await transaction.commit();

      res.status(201).json({
        success: true,
        data: createdIngredients,
        count: createdIngredients.length,
        message: "Variant ingredients created successfully"
      });
    } catch (error) {
      await transaction.rollback();
      next(error);
    }
  },

  // Toggle ingredient active status
  toggleIngredientStatus: async (req, res, next) => {
    try {
      const { id } = req.params;

      const ingredient = await VariantIngredient.findByPk(id);
      if (!ingredient) {
        return res.status(404).json({
          success: false,
          message: "Variant ingredient not found"
        });
      }

      await ingredient.update({
        isActive: !ingredient.isActive
      });

      res.status(200).json({
        success: true,
        data: ingredient,
        message: `Variant ingredient ${ingredient.isActive ? "activated" : "deactivated"} successfully`
      });
    } catch (error) {
      next(error);
    }
  }
};

export default variantIngredientsController;

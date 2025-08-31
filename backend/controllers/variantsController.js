import sequelize from "../config/database.js";
import { MenuItem, Variants, VariantIngredient, Material, Sauce } from "../models/index.js";

const variantsController = {
  // Get all variants for a specific menu item
  getVariantsByMenuItemId: async (req, res, next) => {
    try {
      const { menuItemId } = req.params;
      const { includeInactive } = req.query;

      const whereClause = { menuItemId };
      if (!includeInactive || includeInactive === 'false') {
        whereClause.isActive = true;
      }

      const variants = await Variants.findAll({
        where: whereClause,
        order: [['sortOrder', 'ASC'], ['name', 'ASC']],
        include: [
          {
            model: MenuItem,
            as: "menuItem",
            attributes: ["id", "name", "price"],
            required: false
          },
          {
            model: VariantIngredient,
            as: "ingredients",
            include: [
              {
                model: Material,
                as: "material",
                attributes: ["id", "name", "baseUnit", "unitType"],
                required: false
              },
              {
                model: Sauce,
                as: "sauce",
                attributes: ["id", "name", "unit", "costPerUnit"],
                required: false
              }
            ]
          }
        ]
      });

      res.status(200).json({
        success: true,
        data: variants,
        count: variants.length
      });
    } catch (error) {
      next(error);
    }
  },

  // Get all variants (with optional filtering)
  getAllVariants: async (req, res, next) => {
    try {
      const { menuItemId, isActive, limit = 100, offset = 0 } = req.query;

      const whereClause = {};
      if (menuItemId) whereClause.menuItemId = menuItemId;
      if (isActive !== undefined) whereClause.isActive = isActive === 'true';

      const variants = await Variants.findAndCountAll({
        where: whereClause,
        limit: parseInt(limit),
        offset: parseInt(offset),
        order: [['menuItemId', 'ASC'], ['sortOrder', 'ASC'], ['name', 'ASC']],
        include: [
          {
            model: MenuItem,
            as: "menuItem",
            attributes: ["id", "name", "price"],
            required: false
          },
          {
            model: VariantIngredient,
            as: "ingredients",
            include: [
              {
                model: Material,
                as: "material",
                attributes: ["id", "name", "baseUnit", "unitType"],
                required: false
              },
              {
                model: Sauce,
                as: "sauce",
                attributes: ["id", "name", "unit", "costPerUnit"],
                required: false
              }
            ]
          }
        ]
      });

      res.status(200).json({
        success: true,
        data: variants.rows,
        count: variants.count,
        pagination: {
          limit: parseInt(limit),
          offset: parseInt(offset),
          total: variants.count
        }
      });
    } catch (error) {
      next(error);
    }
  },

  // Get variant by ID
  getVariantById: async (req, res, next) => {
    try {
      const { id } = req.params;

      const variant = await Variants.findByPk(id, {
        include: [
          {
            model: MenuItem,
            as: "menuItem",
            attributes: ["id", "name", "price", "categoryId"],
            required: false
          },
          {
            model: VariantIngredient,
            as: "ingredients",
            include: [
              {
                model: Material,
                as: "material",
                attributes: ["id", "name", "baseUnit", "unitType"],
                required: false
              },
              {
                model: Sauce,
                as: "sauce",
                attributes: ["id", "name", "unit", "costPerUnit"],
                required: false
              }
            ]
          }
        ]
      });

      if (!variant) {
        return res.status(404).json({
          success: false,
          error: "Variant not found"
        });
      }

      res.status(200).json({
        success: true,
        data: variant
      });
    } catch (error) {
      next(error);
    }
  },

  // Create new variant
  createVariant: async (req, res, next) => {
    const transaction = await sequelize.transaction();
    try {
      const { menuItemId, name, volume, unit, price, isActive = true, sortOrder = 0 } = req.body;

      // Validate required fields
      if (!menuItemId || !name || volume === undefined || !unit || price === undefined) {
        await transaction.rollback();
        return res.status(400).json({
          success: false,
          error: "menuItemId, name, volume, unit, and price are required"
        });
      }

      // Validate menu item exists
      const menuItem = await MenuItem.findByPk(menuItemId);
      if (!menuItem) {
        await transaction.rollback();
        return res.status(404).json({
          success: false,
          error: "Menu item not found"
        });
      }

      // Validate numeric values
      const volumeValue = typeof volume === "string" ? parseFloat(volume) : volume;
      const priceValue = typeof price === "string" ? parseFloat(price) : price;
      const sortOrderValue = typeof sortOrder === "string" ? parseInt(sortOrder) : sortOrder;

      if (isNaN(volumeValue) || volumeValue < 0) {
        await transaction.rollback();
        return res.status(400).json({
          success: false,
          error: "Volume must be a non-negative number"
        });
      }

      if (isNaN(priceValue) || priceValue < 0) {
        await transaction.rollback();
        return res.status(400).json({
          success: false,
          error: "Price must be a non-negative number"
        });
      }

      // Check for duplicate variant name for the same menu item
      const existingVariant = await Variants.findOne({
        where: { menuItemId, name: name.trim() },
        transaction
      });

      if (existingVariant) {
        await transaction.rollback();
        return res.status(400).json({
          success: false,
          error: `Variant with name "${name}" already exists for this menu item`
        });
      }

      // Create variant
      const variant = await Variants.create({
        menuItemId,
        name: name.trim(),
        volume: volumeValue,
        unit: unit.trim(),
        price: priceValue,
        isActive: isActive !== undefined ? isActive : true,
        sortOrder: sortOrderValue
      }, { transaction });

      // Fetch created variant with menu item details and ingredients
      const createdVariant = await Variants.findByPk(variant.id, {
        include: [
          {
            model: MenuItem,
            as: "menuItem",
            attributes: ["id", "name", "price"],
            required: false
          },
          {
            model: VariantIngredient,
            as: "ingredients",
            include: [
              {
                model: Material,
                as: "material",
                attributes: ["id", "name", "baseUnit", "unitType"],
                required: false
              },
              {
                model: Sauce,
                as: "sauce",
                attributes: ["id", "name", "unit", "costPerUnit"],
                required: false
              }
            ]
          }
        ],
        transaction
      });

      await transaction.commit();
      res.status(201).json({
        success: true,
        data: createdVariant,
        message: "Variant created successfully"
      });
    } catch (error) {
      await transaction.rollback();
      next(error);
    }
  },

  // Create multiple variants for a menu item
  createBulkVariants: async (req, res, next) => {
    const transaction = await sequelize.transaction();
    try {
      const { menuItemId, variants } = req.body;

      // Validate required fields
      if (!menuItemId || !Array.isArray(variants) || variants.length === 0) {
        await transaction.rollback();
        return res.status(400).json({
          success: false,
          error: "menuItemId and variants array are required"
        });
      }

      // Validate menu item exists
      const menuItem = await MenuItem.findByPk(menuItemId);
      if (!menuItem) {
        await transaction.rollback();
        return res.status(404).json({
          success: false,
          error: "Menu item not found"
        });
      }

      // Validate each variant
      const validatedVariants = [];
      for (let i = 0; i < variants.length; i++) {
        const variant = variants[i];
        
        if (!variant.name || variant.volume === undefined || !variant.unit || variant.price === undefined) {
          await transaction.rollback();
          return res.status(400).json({
            success: false,
            error: `Variant ${i + 1}: name, volume, unit, and price are required`
          });
        }

        const volumeValue = typeof variant.volume === "string" ? parseFloat(variant.volume) : variant.volume;
        const priceValue = typeof variant.price === "string" ? parseFloat(variant.price) : variant.price;

        if (isNaN(volumeValue) || volumeValue < 0) {
          await transaction.rollback();
          return res.status(400).json({
            success: false,
            error: `Variant ${i + 1}: Volume must be a non-negative number`
          });
        }

        if (isNaN(priceValue) || priceValue < 0) {
          await transaction.rollback();
          return res.status(400).json({
            success: false,
            error: `Variant ${i + 1}: Price must be a non-negative number`
          });
        }

        validatedVariants.push({
          menuItemId,
          name: variant.name.trim(),
          volume: volumeValue,
          unit: variant.unit.trim(),
          price: priceValue,
          isActive: variant.isActive !== undefined ? variant.isActive : true,
          sortOrder: variant.sortOrder || i
        });
      }

      // Check for duplicate names
      const variantNames = validatedVariants.map(v => v.name);
      const duplicateNames = variantNames.filter((name, index) => variantNames.indexOf(name) !== index);
      if (duplicateNames.length > 0) {
        await transaction.rollback();
        return res.status(400).json({
          success: false,
          error: `Duplicate variant names found: ${duplicateNames.join(', ')}`
        });
      }

      // Check for existing variants with same names
      const existingVariants = await Variants.findAll({
        where: { 
          menuItemId,
          name: variantNames
        },
        transaction
      });

      if (existingVariants.length > 0) {
        await transaction.rollback();
        return res.status(400).json({
          success: false,
          error: `Variants with these names already exist: ${existingVariants.map(v => v.name).join(', ')}`
        });
      }

      // Create variants
      const createdVariants = await Variants.bulkCreate(validatedVariants, { 
        transaction,
        returning: true
      });

      await transaction.commit();
      res.status(201).json({
        success: true,
        data: createdVariants,
        count: createdVariants.length,
        message: `${createdVariants.length} variants created successfully`
      });
    } catch (error) {
      await transaction.rollback();
      next(error);
    }
  },

  // Update variant
  updateVariant: async (req, res, next) => {
    const transaction = await sequelize.transaction();
    try {
      const { id } = req.params;
      const { name, volume, unit, price, isActive, sortOrder } = req.body;

      const variant = await Variants.findByPk(id, { transaction });
      if (!variant) {
        await transaction.rollback();
        return res.status(404).json({
          success: false,
          error: "Variant not found"
        });
      }

      // Validate numeric values if provided
      let volumeValue = variant.volume;
      let priceValue = variant.price;
      let sortOrderValue = variant.sortOrder;

      if (volume !== undefined) {
        volumeValue = typeof volume === "string" ? parseFloat(volume) : volume;
        if (isNaN(volumeValue) || volumeValue < 0) {
          await transaction.rollback();
          return res.status(400).json({
            success: false,
            error: "Volume must be a non-negative number"
          });
        }
      }

      if (price !== undefined) {
        priceValue = typeof price === "string" ? parseFloat(price) : price;
        if (isNaN(priceValue) || priceValue < 0) {
          await transaction.rollback();
          return res.status(400).json({
            success: false,
            error: "Price must be a non-negative number"
          });
        }
      }

      if (sortOrder !== undefined) {
        sortOrderValue = typeof sortOrder === "string" ? parseInt(sortOrder) : sortOrder;
        if (isNaN(sortOrderValue)) {
          await transaction.rollback();
          return res.status(400).json({
            success: false,
            error: "Sort order must be a number"
          });
        }
      }

      // Check for duplicate name if name is being updated
      if (name && name.trim() !== variant.name) {
        const existingVariant = await Variants.findOne({
          where: { 
            menuItemId: variant.menuItemId, 
            name: name.trim(),
            id: { [sequelize.Op.ne]: id }
          },
          transaction
        });

        if (existingVariant) {
          await transaction.rollback();
          return res.status(400).json({
            success: false,
            error: `Variant with name "${name}" already exists for this menu item`
          });
        }
      }

      // Update variant
      await variant.update({
        name: name !== undefined ? name.trim() : variant.name,
        volume: volumeValue,
        unit: unit !== undefined ? unit.trim() : variant.unit,
        price: priceValue,
        isActive: isActive !== undefined ? isActive : variant.isActive,
        sortOrder: sortOrderValue
      }, { transaction });

      // Fetch updated variant with menu item details and ingredients
      const updatedVariant = await Variants.findByPk(id, {
        include: [
          {
            model: MenuItem,
            as: "menuItem",
            attributes: ["id", "name", "price"],
            required: false
          },
          {
            model: VariantIngredient,
            as: "ingredients",
            include: [
              {
                model: Material,
                as: "material",
                attributes: ["id", "name", "baseUnit", "unitType"],
                required: false
              },
              {
                model: Sauce,
                as: "sauce",
                attributes: ["id", "name", "unit", "costPerUnit"],
                required: false
              }
            ]
          }
        ],
        transaction
      });

      await transaction.commit();
      res.status(200).json({
        success: true,
        data: updatedVariant,
        message: "Variant updated successfully"
      });
    } catch (error) {
      await transaction.rollback();
      next(error);
    }
  },

  // Delete variant
  deleteVariant: async (req, res, next) => {
    const transaction = await sequelize.transaction();
    try {
      const { id } = req.params;

      const variant = await Variants.findByPk(id, { transaction });
      if (!variant) {
        await transaction.rollback();
        return res.status(404).json({
          success: false,
          error: "Variant not found"
        });
      }

      await variant.destroy({ transaction });

      await transaction.commit();
      res.status(200).json({
        success: true,
        message: "Variant deleted successfully"
      });
    } catch (error) {
      await transaction.rollback();
      next(error);
    }
  },

  // Bulk delete variants
  bulkDeleteVariants: async (req, res, next) => {
    const transaction = await sequelize.transaction();
    try {
      const { variantIds } = req.body;

      if (!Array.isArray(variantIds) || variantIds.length === 0) {
        await transaction.rollback();
        return res.status(400).json({
          success: false,
          error: "Variant IDs array is required"
        });
      }

      const deletedCount = await Variants.destroy({
        where: { id: variantIds },
        transaction
      });

      await transaction.commit();
      res.status(200).json({
        success: true,
        message: `${deletedCount} variants deleted successfully`,
        deletedCount
      });
    } catch (error) {
      await transaction.rollback();
      next(error);
    }
  },

  // Toggle variant active status
  toggleVariantStatus: async (req, res, next) => {
    const transaction = await sequelize.transaction();
    try {
      const { id } = req.params;

      const variant = await Variants.findByPk(id, { transaction });
      if (!variant) {
        await transaction.rollback();
        return res.status(404).json({
          success: false,
          error: "Variant not found"
        });
      }

      await variant.update({
        isActive: !variant.isActive
      }, { transaction });

      await transaction.commit();
      res.status(200).json({
        success: true,
        data: variant,
        message: `Variant ${variant.isActive ? 'activated' : 'deactivated'} successfully`
      });
    } catch (error) {
      await transaction.rollback();
      next(error);
    }
  }
};

export default variantsController;

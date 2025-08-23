import Sauce from "../models/Sauce.js";
import SauceIngredient from "../models/SauceIngredient.js";
import Material from "../models/materials.js";
import StockEntry from "../models/StockEntry.js";
import { Op } from "sequelize";
import sequelize from "../config/database.js";

// Get all sauces with filtering and pagination
export const getSauces = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 50,
      search = "",
      category = "",
      isActive,
      sortBy = "name",
      sortOrder = "ASC"
    } = req.query;

    const offset = (parseInt(page) - 1) * parseInt(limit);
    
    // Build where conditions
    const whereConditions = {};
    
    if (search) {
      whereConditions[Op.or] = [
        { name: { [Op.iLike]: `%${search}%` } },
        { description: { [Op.iLike]: `%${search}%` } },
        { category: { [Op.iLike]: `%${search}%` } }
      ];
    }
    
    if (category) {
      whereConditions.category = category;
    }
    
    if (isActive !== undefined) {
      whereConditions.isActive = isActive === 'true';
    }

    // Build order array
    const orderArray = [];
    if (sortBy && sortOrder) {
      orderArray.push([sortBy, sortOrder.toUpperCase()]);
    }

    const { count, rows } = await Sauce.findAndCountAll({
      where: whereConditions,
      include: [
        {
          model: SauceIngredient,
          as: "ingredients",
          include: [
            {
              model: Material,
              as: "material",
              attributes: ["id", "name", "baseUnit", "unitType"]
            }
          ]
        }
      ],
      limit: parseInt(limit),
      offset: offset,
      order: orderArray,
      distinct: true
    });

    const totalPages = Math.ceil(count / parseInt(limit));

    res.status(200).json({
      success: true,
      data: rows,
      pagination: {
        currentPage: parseInt(page),
        totalPages,
        totalItems: count,
        itemsPerPage: parseInt(limit),
        hasNextPage: parseInt(page) < totalPages,
        hasPreviousPage: parseInt(page) > 1
      },
      message: `Retrieved ${rows.length} sauces`
    });

  } catch (error) {
    console.error("❌ Error fetching sauces:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch sauces",
      error: error.message
    });
  }
};

// Get single sauce by ID
export const getSauce = async (req, res) => {
  try {
    const { id } = req.params;

    const sauce = await Sauce.findByPk(id, {
      include: [
        {
          model: SauceIngredient,
          as: "ingredients",
          include: [
            {
              model: Material,
              as: "material",
              attributes: ["id", "name", "baseUnit", "unitType", "categoryId"]
            }
          ],
          order: [["sortOrder", "ASC"]]
        }
      ]
    });

    if (!sauce) {
      return res.status(404).json({
        success: false,
        message: "Sauce not found"
      });
    }

    res.status(200).json({
      success: true,
      data: sauce,
      message: "Sauce retrieved successfully"
    });

  } catch (error) {
    console.error("❌ Error fetching sauce:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch sauce",
      error: error.message
    });
  }
};

// Create new sauce
export const createSauce = async (req, res) => {
  const transaction = await sequelize.transaction();
  
  try {
    const {
      name,
      description,
      category,
      baseIngredients,
      yieldQuantity,
      unit,
      preparationTime,
      instructions,
      shelfLife,
      storageInstructions,
      allergens,
      nutritionalInfo,
      isPOSItem = false
    } = req.body;

    // Validate required fields
    if (!name || !category || !baseIngredients || !Array.isArray(baseIngredients) || baseIngredients.length === 0) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: "Missing required fields: name, category, and baseIngredients are required"
      });
    }

    if (!yieldQuantity || yieldQuantity <= 0) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: "Yield quantity must be greater than 0"
      });
    }

    // Calculate total cost from ingredients
    let totalCost = 0;
    const ingredientCosts = [];

    for (const ingredient of baseIngredients) {
      if (!ingredient.materialId || !ingredient.quantity || !ingredient.unit) {
        await transaction.rollback();
        return res.status(400).json({
          success: false,
          message: "Each ingredient must have materialId, quantity, and unit"
        });
      }

      // Get material to calculate cost
      const material = await Material.findByPk(ingredient.materialId);
      if (!material) {
        await transaction.rollback();
        return res.status(400).json({
          success: false,
          message: `Material with ID ${ingredient.materialId} not found`
        });
      }

      // Get latest stock entries to calculate average cost
      const stockEntries = await StockEntry.findAll({
        where: { 
          materialId: ingredient.materialId,
          purchasedIndividualQuantity: { [Op.gt]: 0 }
        },
        order: [["purchaseDate", "DESC"]],
        limit: 5
      });

      let costPerUnit = 0;
      if (stockEntries.length > 0) {
        // Calculate weighted average cost from recent stock entries
        let totalValue = 0;
        let totalQuantity = 0;
        
        stockEntries.forEach(entry => {
          totalValue += entry.totalCost;
          totalQuantity += entry.purchasedIndividualQuantity;
        });
        
        costPerUnit = totalQuantity > 0 ? totalValue / totalQuantity : 0;
      }

      const ingredientCost = costPerUnit * ingredient.quantity;
      totalCost += ingredientCost;
      
      ingredientCosts.push({
        materialId: ingredient.materialId,
        materialName: material.name,
        quantity: ingredient.quantity,
        unit: ingredient.unit,
        costPerUnit,
        totalCost: ingredientCost
      });
    }

    const costPerUnit = yieldQuantity > 0 ? totalCost / yieldQuantity : 0;

    // Create sauce
    const sauce = await Sauce.create({
      name,
      description,
      category,
      totalCost,
      costPerUnit,
      unit,
      yieldQuantity,
      preparationTime,
      instructions,
      shelfLife,
      storageInstructions,
      allergens: allergens || [],
      nutritionalInfo,
      isPOSItem,
      createdBy: req.user?.id || null
    }, { transaction });

    // Create sauce ingredients
    const sauceIngredients = [];
    for (let i = 0; i < baseIngredients.length; i++) {
      const ingredient = baseIngredients[i];
      const ingredientCost = ingredientCosts[i];
      
      const sauceIngredient = await SauceIngredient.create({
        sauceId: sauce.id,
        materialId: ingredient.materialId,
        quantity: ingredient.quantity,
        unit: ingredient.unit,
        cost: ingredientCost.totalCost,
        notes: ingredient.notes,
        sortOrder: i
      }, { transaction });
      
      sauceIngredients.push(sauceIngredient);
    }

    await transaction.commit();

    // Fetch the created sauce with ingredients
    const createdSauce = await Sauce.findByPk(sauce.id, {
      include: [
        {
          model: SauceIngredient,
          as: "ingredients",
          include: [
            {
              model: Material,
              as: "material",
              attributes: ["id", "name", "baseUnit", "unitType"]
            }
          ],
          order: [["sortOrder", "ASC"]]
        }
      ]
    });

    res.status(201).json({
      success: true,
      data: createdSauce,
      message: "Sauce created successfully"
    });

  } catch (error) {
    await transaction.rollback();
    console.error("❌ Error creating sauce:", error);
    
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(400).json({
        success: false,
        message: "A sauce with this name already exists"
      });
    }
    
    res.status(500).json({
      success: false,
      message: "Failed to create sauce",
      error: error.message
    });
  }
};

// Update sauce
export const updateSauce = async (req, res) => {
  const transaction = await sequelize.transaction();
  
  try {
    const { id } = req.params;
    const {
      name,
      description,
      category,
      baseIngredients,
      yieldQuantity,
      unit,
      preparationTime,
      instructions,
      shelfLife,
      storageInstructions,
      allergens,
      nutritionalInfo,
      isPOSItem,
      isActive
    } = req.body;

    const sauce = await Sauce.findByPk(id);
    if (!sauce) {
      await transaction.rollback();
      return res.status(404).json({
        success: false,
        message: "Sauce not found"
      });
    }

    // If ingredients are being updated, recalculate costs
    let totalCost = sauce.totalCost;
    let costPerUnit = sauce.costPerUnit;

    if (baseIngredients && Array.isArray(baseIngredients)) {
      // Delete existing ingredients
      await SauceIngredient.destroy({
        where: { sauceId: id },
        transaction
      });

      // Calculate new total cost
      totalCost = 0;
      const ingredientCosts = [];

      for (const ingredient of baseIngredients) {
        if (!ingredient.materialId || !ingredient.quantity || !ingredient.unit) {
          await transaction.rollback();
          return res.status(400).json({
            success: false,
            message: "Each ingredient must have materialId, quantity, and unit"
          });
        }

        // Get material to calculate cost
        const material = await Material.findByPk(ingredient.materialId);
        if (!material) {
          await transaction.rollback();
          return res.status(400).json({
            success: false,
            message: `Material with ID ${ingredient.materialId} not found`
          });
        }

        // Get latest stock entries to calculate average cost
        const stockEntries = await StockEntry.findAll({
          where: { 
            materialId: ingredient.materialId,
            purchasedIndividualQuantity: { [Op.gt]: 0 }
          },
          order: [["purchaseDate", "DESC"]],
          limit: 5
        });

        let materialCostPerUnit = 0;
        if (stockEntries.length > 0) {
          let totalValue = 0;
          let totalQuantity = 0;
          
          stockEntries.forEach(entry => {
            totalValue += entry.totalCost;
            totalQuantity += entry.purchasedIndividualQuantity;
          });
          
          materialCostPerUnit = totalQuantity > 0 ? totalValue / totalQuantity : 0;
        }

        const ingredientCost = materialCostPerUnit * ingredient.quantity;
        totalCost += ingredientCost;
        
        ingredientCosts.push({
          materialId: ingredient.materialId,
          quantity: ingredient.quantity,
          unit: ingredient.unit,
          cost: ingredientCost,
          notes: ingredient.notes
        });
      }

      const newYieldQuantity = yieldQuantity || sauce.yieldQuantity;
      costPerUnit = newYieldQuantity > 0 ? totalCost / newYieldQuantity : 0;

      // Create new ingredients
      for (let i = 0; i < ingredientCosts.length; i++) {
        const ingredient = ingredientCosts[i];
        
        await SauceIngredient.create({
          sauceId: id,
          materialId: ingredient.materialId,
          quantity: ingredient.quantity,
          unit: ingredient.unit,
          cost: ingredient.cost,
          notes: ingredient.notes,
          sortOrder: i
        }, { transaction });
      }
    }

    // Update sauce
    await sauce.update({
      name: name || sauce.name,
      description: description !== undefined ? description : sauce.description,
      category: category || sauce.category,
      totalCost,
      costPerUnit,
      unit: unit || sauce.unit,
      yieldQuantity: yieldQuantity || sauce.yieldQuantity,
      preparationTime: preparationTime !== undefined ? preparationTime : sauce.preparationTime,
      instructions: instructions !== undefined ? instructions : sauce.instructions,
      shelfLife: shelfLife !== undefined ? shelfLife : sauce.shelfLife,
      storageInstructions: storageInstructions !== undefined ? storageInstructions : sauce.storageInstructions,
      allergens: allergens !== undefined ? allergens : sauce.allergens,
      nutritionalInfo: nutritionalInfo !== undefined ? nutritionalInfo : sauce.nutritionalInfo,
      isPOSItem: isPOSItem !== undefined ? isPOSItem : sauce.isPOSItem,
      isActive: isActive !== undefined ? isActive : sauce.isActive,
      updatedBy: req.user?.id || null
    }, { transaction });

    await transaction.commit();

    // Fetch updated sauce with ingredients
    const updatedSauce = await Sauce.findByPk(id, {
      include: [
        {
          model: SauceIngredient,
          as: "ingredients",
          include: [
            {
              model: Material,
              as: "material",
              attributes: ["id", "name", "baseUnit", "unitType"]
            }
          ],
          order: [["sortOrder", "ASC"]]
        }
      ]
    });

    res.status(200).json({
      success: true,
      data: updatedSauce,
      message: "Sauce updated successfully"
    });

  } catch (error) {
    await transaction.rollback();
    console.error("❌ Error updating sauce:", error);
    
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(400).json({
        success: false,
        message: "A sauce with this name already exists"
      });
    }
    
    res.status(500).json({
      success: false,
      message: "Failed to update sauce",
      error: error.message
    });
  }
};

// Delete sauce
export const deleteSauce = async (req, res) => {
  const transaction = await sequelize.transaction();
  
  try {
    const { id } = req.params;

    const sauce = await Sauce.findByPk(id);
    if (!sauce) {
      await transaction.rollback();
      return res.status(404).json({
        success: false,
        message: "Sauce not found"
      });
    }

    // Delete sauce ingredients (cascade will handle this, but explicit for clarity)
    await SauceIngredient.destroy({
      where: { sauceId: id },
      transaction
    });

    // Delete sauce
    await sauce.destroy({ transaction });

    await transaction.commit();

    res.status(200).json({
      success: true,
      message: "Sauce deleted successfully"
    });

  } catch (error) {
    await transaction.rollback();
    console.error("❌ Error deleting sauce:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete sauce",
      error: error.message
    });
  }
};

// Bulk delete sauces
export const bulkDeleteSauces = async (req, res) => {
  const transaction = await sequelize.transaction();
  
  try {
    const { ids } = req.body;

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: "IDs array is required"
      });
    }

    // Delete sauce ingredients first
    await SauceIngredient.destroy({
      where: { sauceId: { [Op.in]: ids } },
      transaction
    });

    // Delete sauces
    const deletedCount = await Sauce.destroy({
      where: { id: { [Op.in]: ids } },
      transaction
    });

    await transaction.commit();

    res.status(200).json({
      success: true,
      message: `${deletedCount} sauce(s) deleted successfully`,
      deletedCount
    });

  } catch (error) {
    await transaction.rollback();
    console.error("❌ Error bulk deleting sauces:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete sauces",
      error: error.message
    });
  }
};

// Toggle POS visibility
export const togglePOSVisibility = async (req, res) => {
  try {
    const { id } = req.params;
    const { isPOSItem } = req.body;

    const sauce = await Sauce.findByPk(id);
    if (!sauce) {
      return res.status(404).json({
        success: false,
        message: "Sauce not found"
      });
    }

    await sauce.update({
      isPOSItem: isPOSItem !== undefined ? isPOSItem : !sauce.isPOSItem,
      updatedBy: req.user?.id || null
    });

    res.status(200).json({
      success: true,
      data: sauce,
      message: `Sauce ${sauce.isPOSItem ? 'added to' : 'removed from'} POS`
    });

  } catch (error) {
    console.error("❌ Error toggling POS visibility:", error);
    res.status(500).json({
      success: false,
      message: "Failed to toggle POS visibility",
      error: error.message
    });
  }
};

// Toggle active status
export const toggleActiveStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { isActive } = req.body;

    const sauce = await Sauce.findByPk(id);
    if (!sauce) {
      return res.status(404).json({
        success: false,
        message: "Sauce not found"
      });
    }

    await sauce.update({
      isActive: isActive !== undefined ? isActive : !sauce.isActive,
      updatedBy: req.user?.id || null
    });

    res.status(200).json({
      success: true,
      data: sauce,
      message: `Sauce ${sauce.isActive ? 'activated' : 'deactivated'}`
    });

  } catch (error) {
    console.error("❌ Error toggling active status:", error);
    res.status(500).json({
      success: false,
      message: "Failed to toggle active status",
      error: error.message
    });
  }
};

// Calculate sauce cost
export const calculateSauceCost = async (req, res) => {
  try {
    const { ingredients } = req.body;

    if (!ingredients || !Array.isArray(ingredients) || ingredients.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Ingredients array is required"
      });
    }

    let totalCost = 0;
    const ingredientCosts = [];

    for (const ingredient of ingredients) {
      if (!ingredient.materialId || !ingredient.quantity || !ingredient.unit) {
        return res.status(400).json({
          success: false,
          message: "Each ingredient must have materialId, quantity, and unit"
        });
      }

      // Get material
      const material = await Material.findByPk(ingredient.materialId);
      if (!material) {
        return res.status(400).json({
          success: false,
          message: `Material with ID ${ingredient.materialId} not found`
        });
      }

      // Get latest stock entries to calculate average cost
      const stockEntries = await StockEntry.findAll({
        where: { 
          materialId: ingredient.materialId,
          purchasedIndividualQuantity: { [Op.gt]: 0 }
        },
        order: [["purchaseDate", "DESC"]],
        limit: 5
      });

      let costPerUnit = 0;
      if (stockEntries.length > 0) {
        let totalValue = 0;
        let totalQuantity = 0;
        
        stockEntries.forEach(entry => {
          totalValue += entry.totalCost;
          totalQuantity += entry.purchasedIndividualQuantity;
        });
        
        costPerUnit = totalQuantity > 0 ? totalValue / totalQuantity : 0;
      }

      const ingredientTotalCost = costPerUnit * ingredient.quantity;
      totalCost += ingredientTotalCost;

      ingredientCosts.push({
        materialId: ingredient.materialId,
        materialName: material.name,
        quantity: ingredient.quantity,
        unit: ingredient.unit,
        costPerUnit,
        totalCost: ingredientTotalCost
      });
    }

    res.status(200).json({
      success: true,
      totalCost,
      ingredientCosts,
      message: "Cost calculated successfully"
    });

  } catch (error) {
    console.error("❌ Error calculating sauce cost:", error);
    res.status(500).json({
      success: false,
      message: "Failed to calculate sauce cost",
      error: error.message
    });
  }
};

// Get sauce categories
export const getSauceCategories = async (req, res) => {
  try {
    const categories = [
      "Hot Sauces",
      "Cold Sauces", 
      "Dressings",
      "Marinades",
      "Dips",
      "Gravies",
      "Reductions",
      "Emulsions",
      "Compound Butters",
      "Salsas",
      "Chutneys",
      "Aiolis",
      "Vinaigrettes",
      "Other"
    ];

    res.status(200).json({
      success: true,
      data: categories,
      message: "Categories retrieved successfully"
    });

  } catch (error) {
    console.error("❌ Error fetching sauce categories:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch sauce categories",
      error: error.message
    });
  }
};

import { Op } from "sequelize";
import { Material, MenuItem, MenuItemIngredient, StockEntry, Variants } from "../models/index.js";

const posController = {
  // Get all POS items (menu items + POS-enabled stock entries)
  getPOSItems: async (req, res, next) => {
    try {
      // Fetch menu items with isPOSItem = true
      const menuItems = await MenuItem.findAll({
        where: { isPOSItem: true },
        include: [
          { 
            model: MenuItemIngredient, 
            as: "menuItemIngredients", 
            include: [{ 
              model: Material, 
              as: "material", 
              attributes: ["id", "name", "baseUnit", "unitType", "categoryId"] 
            }] 
          },
          {
            model: Variants,
            as: "variants",
            where: { isActive: true },
            required: false // LEFT JOIN - include menu items even if they don't have variants
          }
        ],
        order: [["name", "ASC"]]
      });

      // Fetch stock entries with isPOSItem = true, grouped by material
      const posStockEntries = await StockEntry.findAll({
        where: { isPOSItem: true, purchasedIndividualQuantity: { [Op.gt]: 0 } },
        include: [{ model: Material, as: "material", attributes: ["id", "name", "baseUnit", "unitType", "categoryId", "packageQuantity", "inputUnit"] }],
        order: [
          ["material", "name"],
          ["createdAt", "ASC"]
        ] // Group by material, then FIFO
      });

      // Group stock entries by material and calculate totals
      const materialStockMap = {};
      posStockEntries.forEach(entry => {
        const materialId = entry.materialId;
        if (!materialStockMap[materialId]) {
          materialStockMap[materialId] = {
            material: entry.material,
            stockEntries: [],
            totalAvailableQuantity: 0,
            averageCostPerBaseUnit: 0,
            totalValue: 0
          };
        }

        materialStockMap[materialId].stockEntries.push(entry);
        materialStockMap[materialId].totalAvailableQuantity += entry.purchasedIndividualQuantity || 0;
        materialStockMap[materialId].totalValue += entry.totalCost || 0;
      });

      // Calculate average cost per base unit for each material
      Object.keys(materialStockMap).forEach(materialId => {
        const materialData = materialStockMap[materialId];
        if (materialData.totalAvailableQuantity > 0) {
          materialData.averageCostPerBaseUnit = parseFloat((materialData.totalValue / materialData.totalAvailableQuantity).toFixed(6));
        }
      });

      // Format menu items for POS
      const formattedMenuItems = menuItems.map(item => ({
        id: item.id,
        type: "menu_item",
        name: item.name,
        description: item.description,
        price: parseFloat(item.price || 0),
        category: item.category || "menu",
        unit: "item",
        availableQuantity: 999, // Menu items are typically unlimited
        costPerUnit: parseFloat(item.price || 0),
        image: item.image, // Include the image field
        ingredients:
          item.menuItemIngredients?.map(ingredient => ({
            materialId: ingredient.materialId,
            materialName: ingredient.material?.name || "Unknown",
            quantity: ingredient.quantity,
            unit: ingredient.unit,
            cost: ingredient.cost || 0
          })) || [],
        variants: item.variants?.map(variant => ({
          id: variant.id,
          name: variant.name,
          volume: parseFloat(variant.volume),
          unit: variant.unit,
          price: parseFloat(variant.price)
        })) || [],
        createdAt: item.createdAt,
        updatedAt: item.updatedAt
      }));

      // Format stock entries for POS
      const formattedStockEntries = Object.values(materialStockMap).map(materialData => ({
        id: `material_${materialData.material.id}`,
        type: "stock_entry",
        name: materialData.material.name,
        description: `${materialData.material.categoryId || "material"} - ${materialData.totalAvailableQuantity} ${materialData.material.baseUnit} available`,
        price: materialData.averageCostPerBaseUnit,
        category: materialData.material.categoryId || "materials",
        unit: materialData.material.baseUnit,
        availableQuantity: materialData.totalAvailableQuantity,
        costPerUnit: materialData.averageCostPerBaseUnit,
        materialId: materialData.material.id,
        material: {
          id: materialData.material.id,
          name: materialData.material.name,
          baseUnit: materialData.material.baseUnit,
          unitType: materialData.material.unitType,
          category: materialData.material.categoryId,
          packageQuantity: materialData.material.packageQuantity,
          inputUnit: materialData.material.inputUnit
        },
        stockEntries: materialData.stockEntries.map(entry => ({
          id: entry.id,
          supplier: entry.supplier,
          purchasedQuantity: entry.purchasedQuantity,
          purchasedUnit: entry.purchasedUnit,
          purchasedIndividualQuantity: entry.purchasedIndividualQuantity,
          costPerBaseUnit: entry.costPerBaseUnit,
          totalCost: entry.totalCost,
          purchaseDate: entry.purchaseDate,
          expiryDate: entry.expiryDate
        })),
        createdAt: materialData.stockEntries[0]?.createdAt,
        updatedAt: materialData.stockEntries[0]?.updatedAt
      }));

      // Combine and sort all POS items
      const allPOSItems = [...formattedMenuItems, ...formattedStockEntries].sort((a, b) => {
        // Sort by category first, then by name
        if (a.category !== b.category) {
          // Convert to string for comparison since categoryId might be a number
          const categoryA = String(a.category || '');
          const categoryB = String(b.category || '');
          return categoryA.localeCompare(categoryB);
        }
        return a.name.localeCompare(b.name);
      });

      // Create summary statistics
      const summary = {
        totalItems: allPOSItems.length,
        menuItems: formattedMenuItems.length,
        stockEntries: formattedStockEntries.length,
        categories: [...new Set(allPOSItems.map(item => item.category))].sort(),
        totalStockValue: Object.values(materialStockMap).reduce((sum, material) => sum + material.totalValue, 0),
        lastUpdated: new Date()
      };

      res.status(200).json({
        success: true,
        data: allPOSItems,
        summary,
        message: `Retrieved ${allPOSItems.length} POS items (${formattedMenuItems.length} menu items, ${formattedStockEntries.length} stock materials)`
      });
    } catch (error) {
      console.error("Error fetching POS items:", error);
      next(error);
    }
  },

  // Get POS items by category
  getPOSItemsByCategory: async (req, res, next) => {
    try {
      const { category } = req.params;

      // Fetch menu items with isPOSItem = true and matching category
      const menuItems = await MenuItem.findAll({
        where: {
          isPOSItem: true,
          category: { [Op.iLike]: `%${category}%` }
        },
        include: [
          {
            model: MenuItemIngredient,
            as: "menuItemIngredients",
            include: [
              {
                model: Material,
                as: "material",
                attributes: ["id", "name", "baseUnit", "unitType", "categoryId"]
              }
            ]
          },
          {
            model: Variants,
            as: "variants",
            where: { isActive: true },
            required: false // LEFT JOIN - include menu items even if they don't have variants
          }
        ],
        order: [["name", "ASC"]]
      });

      // Fetch stock entries with isPOSItem = true and matching material category
      const posStockEntries = await StockEntry.findAll({
        where: {
          isPOSItem: true,
          purchasedIndividualQuantity: { [Op.gt]: 0 }
        },
        include: [
          {
            model: Material,
            as: "material",
            where: {
              categoryId: { [Op.iLike]: `%${category}%` }
            },
            attributes: ["id", "name", "baseUnit", "unitType", "categoryId", "packageQuantity", "inputUnit"]
          }
        ],
        order: [["material", "name"], ["createdAt", "ASC"]]
      });

      // Process the data using the same logic as getPOSItems but filtered
      const materialStockMap = {};
      posStockEntries.forEach(entry => {
        const materialId = entry.materialId;
        if (!materialStockMap[materialId]) {
          materialStockMap[materialId] = {
            material: entry.material,
            stockEntries: [],
            totalAvailableQuantity: 0,
            averageCostPerBaseUnit: 0,
            totalValue: 0
          };
        }

        materialStockMap[materialId].stockEntries.push(entry);
        materialStockMap[materialId].totalAvailableQuantity += entry.purchasedIndividualQuantity || 0;
        materialStockMap[materialId].totalValue += (entry.totalCost || 0);
      });

      // Calculate average cost per base unit for each material
      Object.keys(materialStockMap).forEach(materialId => {
        const materialData = materialStockMap[materialId];
        if (materialData.totalAvailableQuantity > 0) {
          materialData.averageCostPerBaseUnit = parseFloat(
            (materialData.totalValue / materialData.totalAvailableQuantity).toFixed(6)
          );
        }
      });

      // Format menu items
      const formattedMenuItems = menuItems.map(item => ({
        id: item.id,
        type: "menu_item",
        name: item.name,
        description: item.description,
        price: parseFloat(item.price || 0),
        category: item.category || "menu",
        unit: "item",
        availableQuantity: 999,
        costPerUnit: parseFloat(item.price || 0),
        image: item.image, // Include the image field
        ingredients: item.menuItemIngredients?.map(ingredient => ({
          materialId: ingredient.materialId,
          materialName: ingredient.material?.name || "Unknown",
          quantity: ingredient.quantity,
          unit: ingredient.unit,
          cost: ingredient.cost || 0
        })) || [],
        variants: item.variants?.map(variant => ({
          id: variant.id,
          name: variant.name,
          volume: parseFloat(variant.volume),
          unit: variant.unit,
          price: parseFloat(variant.price)
        })) || [],
        createdAt: item.createdAt,
        updatedAt: item.updatedAt
      }));

      // Format stock entries
      const formattedStockEntries = Object.values(materialStockMap).map(materialData => ({
        id: `material_${materialData.material.id}`,
        type: "stock_entry",
        name: materialData.material.name,
        description: `${materialData.material.categoryId || "material"} - ${materialData.totalAvailableQuantity} ${materialData.material.baseUnit} available`,
        price: materialData.averageCostPerBaseUnit,
        category: materialData.material.categoryId || "materials",
        unit: materialData.material.baseUnit,
        availableQuantity: materialData.totalAvailableQuantity,
        costPerUnit: materialData.averageCostPerBaseUnit,
        materialId: materialData.material.id,
        material: materialData.material,
        stockEntries: materialData.stockEntries.map(entry => ({
          id: entry.id,
          supplier: entry.supplier,
          purchasedQuantity: entry.purchasedQuantity,
          purchasedUnit: entry.purchasedUnit,
          purchasedIndividualQuantity: entry.purchasedIndividualQuantity,
          costPerBaseUnit: entry.costPerBaseUnit,
          totalCost: entry.totalCost,
          purchaseDate: entry.purchaseDate,
          expiryDate: entry.expiryDate
        })),
        createdAt: materialData.stockEntries[0]?.createdAt,
        updatedAt: materialData.stockEntries[0]?.updatedAt
      }));

      // Combine and sort
      const filteredItems = [
        ...formattedMenuItems,
        ...formattedStockEntries
      ].sort((a, b) => a.name.localeCompare(b.name));

      res.status(200).json({
        success: true,
        data: filteredItems,
        category,
        count: filteredItems.length,
        menuItems: formattedMenuItems.length,
        stockEntries: formattedStockEntries.length,
        message: `Retrieved ${filteredItems.length} POS items in category: ${category}`
      });

    } catch (error) {
      console.error("Error fetching POS items by category:", error);
      next(error);
    }
  }
};

export default posController;

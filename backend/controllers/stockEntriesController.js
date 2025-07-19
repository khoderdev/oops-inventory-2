import { Material, StockEntry } from "../models/index.js";
import sequelize from "../config/database.js";

const stockEntriesController = {
  // Get all stock entries
  getAllStockEntries: async (req, res, next) => {
    try {
      console.log('=== FETCHING ALL STOCK ENTRIES WITH CACHE BUSTING ===');
      
      // Force fresh query with raw SQL to bypass any caching
      const rawStockEntries = await sequelize.query(`
        SELECT 
          se.*,
          m.id as "material.id",
          m.name as "material.name",
          m."baseUnit" as "material.baseUnit",
          m."unitType" as "material.unitType",
          m."inputUnit" as "material.inputUnit",
          m."costPerBaseUnit" as "material.costPerBaseUnit",
          m."packageQuantity" as "material.packageQuantity",
          m.category as "material.category",
          m.description as "material.description"
        FROM "stockEntries" se
        LEFT JOIN materials m ON se."materialId" = m.id
        ORDER BY se.id ASC
      `, {
        type: sequelize.QueryTypes.SELECT,
        nest: true
      });
      
      console.log(`Found ${rawStockEntries.length} stock entries via raw query`);
      
      // Log sample entry to verify fresh data
      if (rawStockEntries.length > 0) {
        const sampleEntry = rawStockEntries.find(entry => entry.id === 28) || rawStockEntries[0];
        console.log('Sample FRESH stock entry data:', {
          id: sampleEntry.id,
          materialId: sampleEntry.materialId,
          materialName: sampleEntry.material?.name,
          purchasedQuantity: sampleEntry.purchasedQuantity,
          purchasedUnit: sampleEntry.purchasedUnit,
          purchasedIndividualQuantity: sampleEntry.purchasedIndividualQuantity,
          purchasedIndividualUnit: sampleEntry.purchasedIndividualUnit,
          updatedAt: sampleEntry.updatedAt
        });
      }
      
      res.status(200).json(rawStockEntries);
    } catch (error) {
      console.error('Error fetching stock entries:', error);
      next(error);
    }
  },

  // Get stock entry by ID
  getStockEntryById: async (req, res, next) => {
    try {
      const { id } = req.params;
      const stockEntry = await StockEntry.findByPk(id, {
        include: { model: Material, as: "material" }
      });

      if (!stockEntry) {
        return res.status(404).json({ error: "Stock entry not found" });
      }

      res.status(200).json(stockEntry);
    } catch (error) {
      next(error);
    }
  },

  // Create new stock entry
  createStockEntries: async (req, res, next) => {
    try {
      const { materialId, supplier, purchasedQuantity, purchasedUnit, costPerPurchasedUnit, totalCost, purchaseDate, expiryDate } = req.body;

      if (!materialId || !supplier || !purchasedQuantity || !purchasedUnit || !costPerPurchasedUnit || !totalCost || !purchaseDate) {
        return res.status(400).json({ error: "Missing required fields" });
      }

      if (purchasedQuantity <= 0 || costPerPurchasedUnit < 0 || totalCost < 0) {
        return res.status(400).json({ error: "Invalid numeric values" });
      }

      if (purchasedUnit.trim() === "") {
        return res.status(400).json({ error: "Purchased unit cannot be empty" });
      }

      // Get material to check if it's a package unit
      const material = await Material.findByPk(materialId);
      if (!material) {
        return res.status(404).json({ error: "Material not found" });
      }

      // Calculate individual quantities for package units and mass units
      let purchasedIndividualQuantity = purchasedQuantity;
      let purchasedIndividualUnit = purchasedUnit;

      if (material.unitType === "package" && material.packageQuantity && material.packageQuantity > 0) {
        // For package units, calculate individual quantities (rounded to whole numbers)
        purchasedIndividualQuantity = Math.round(purchasedQuantity * material.packageQuantity);
        purchasedIndividualUnit = material.baseUnit;

        console.log(`Package unit conversion for ${material.name}:`, {
          packageQuantity: purchasedQuantity,
          packageUnit: purchasedUnit,
          individualQuantity: purchasedIndividualQuantity,
          individualUnit: purchasedIndividualUnit,
          packageQuantityPerUnit: material.packageQuantity
        });
      } else if (material.unitType === "mass") {
        // For mass units, convert to base unit (grams)
        const massConversions = {
          kg: 1000,
          g: 1,
          lb: 453.592,
          oz: 28.3495
        };
        
        const conversionFactor = massConversions[purchasedUnit.toLowerCase()];
        if (conversionFactor) {
          purchasedIndividualQuantity = Math.round(purchasedQuantity * conversionFactor);
          purchasedIndividualUnit = material.baseUnit; // Should be 'g' for mass units
          
          console.log(`Mass unit conversion for ${material.name}:`, {
            originalQuantity: purchasedQuantity,
            originalUnit: purchasedUnit,
            individualQuantity: purchasedIndividualQuantity,
            individualUnit: purchasedIndividualUnit,
            conversionFactor: conversionFactor
          });
        } else {
          console.warn(`Unknown mass unit: ${purchasedUnit} for material: ${material.name}`);
        }
      }

      const stockEntry = await StockEntry.create({
        materialId,
        supplier,
        purchasedQuantity,
        purchasedUnit,
        purchasedIndividualQuantity,
        purchasedIndividualUnit,
        costPerPurchasedUnit,
        totalCost,
        purchaseDate,
        expiryDate
      });

      const createdStockEntry = await StockEntry.findByPk(stockEntry.id, {
        include: { model: Material, as: "material" }
      });

      res.status(201).json(createdStockEntry);
    } catch (error) {
      next(error);
    }
  },

  // Update stock entry
  updateStockEntries: async (req, res, next) => {
    try {
      const { id } = req.params;
      const { materialId, supplier, purchasedQuantity, purchasedUnit, costPerPurchasedUnit, totalCost, purchaseDate, expiryDate } = req.body;

      // Convert string values to numbers for validation and database storage
      const numericPurchasedQuantity = purchasedQuantity ? parseFloat(purchasedQuantity) : undefined;
      const numericCostPerPurchasedUnit = costPerPurchasedUnit ? parseFloat(costPerPurchasedUnit) : undefined;
      const numericTotalCost = totalCost ? parseFloat(totalCost) : undefined;

      const stockEntry = await StockEntry.findByPk(id);
      if (!stockEntry) {
        return res.status(404).json({ error: "Stock entry not found" });
      }

      if (numericPurchasedQuantity !== undefined && numericPurchasedQuantity <= 0) {
        return res.status(400).json({ error: "Purchased quantity must be positive" });
      }

      if (numericCostPerPurchasedUnit !== undefined && numericCostPerPurchasedUnit < 0) {
        return res.status(400).json({ error: "Unit cost cannot be negative" });
      }

      if (numericTotalCost !== undefined && numericTotalCost < 0) {
        return res.status(400).json({ error: "Total cost cannot be negative" });
      }

      if (purchasedUnit !== undefined && purchasedUnit.trim() === "") {
        return res.status(400).json({ error: "Purchased unit cannot be empty" });
      }

      // Get material to recalculate individual quantities if needed
      const material = await Material.findByPk(materialId ?? stockEntry.materialId);
      if (!material) {
        return res.status(404).json({ error: "Material not found" });
      }

      // Calculate individual quantities for package units
      let updatedIndividualQuantity = stockEntry.purchasedIndividualQuantity;
      let updatedIndividualUnit = stockEntry.purchasedIndividualUnit;

      const finalPurchasedQuantity = numericPurchasedQuantity ?? stockEntry.purchasedQuantity;
      const finalPurchasedUnit = purchasedUnit ?? stockEntry.purchasedUnit;

      if (material.unitType === "package" && material.packageQuantity && material.packageQuantity > 0) {
        // Recalculate individual quantities for package units (rounded to whole numbers)
        updatedIndividualQuantity = Math.round(finalPurchasedQuantity * material.packageQuantity);
        updatedIndividualUnit = material.baseUnit;

        console.log(`Package unit update conversion for ${material.name}:`, {
          packageQuantity: finalPurchasedQuantity,
          packageUnit: finalPurchasedUnit,
          individualQuantity: updatedIndividualQuantity,
          individualUnit: updatedIndividualUnit,
          packageQuantityPerUnit: material.packageQuantity
        });
      } else {
        if (material.unitType === "mass") {
          const massConversions = {
            kg: 1000,
            g: 1,
            lb: 453.592,
            oz: 28.3495
          };

          const conversionFactor = massConversions[finalPurchasedUnit.toLowerCase()];
          if (conversionFactor) {
            updatedIndividualQuantity = Math.round(finalPurchasedQuantity * conversionFactor);
            updatedIndividualUnit = material.baseUnit;
          } else {
            updatedIndividualQuantity = stockEntry.purchasedIndividualQuantity;
            updatedIndividualUnit = stockEntry.purchasedIndividualUnit;
          }
        } else {
          updatedIndividualQuantity = Math.round(finalPurchasedQuantity);
          updatedIndividualUnit = finalPurchasedUnit;
        }
      }

      await stockEntry.update({
        materialId: materialId ?? stockEntry.materialId,
        supplier: supplier ?? stockEntry.supplier,
        purchasedQuantity: finalPurchasedQuantity,
        purchasedUnit: finalPurchasedUnit,
        purchasedIndividualQuantity: updatedIndividualQuantity,
        purchasedIndividualUnit: updatedIndividualUnit,
        costPerPurchasedUnit: numericCostPerPurchasedUnit ?? stockEntry.costPerPurchasedUnit,
        totalCost: numericTotalCost ?? stockEntry.totalCost,
        purchaseDate: purchaseDate ?? stockEntry.purchaseDate,
        expiryDate: expiryDate ?? stockEntry.expiryDate
      });

      const updatedStockEntry = await StockEntry.findByPk(id, {
        include: { model: Material, as: "material" }
      });

      res.status(200).json(updatedStockEntry);
    } catch (error) {
      next(error);
    }
  },

  // Delete stock entry
  deleteStockEntries: async (req, res, next) => {
    try {
      const { id } = req.params;
      const stockEntry = await StockEntry.findByPk(id);
      if (!stockEntry) {
        return res.status(404).json({ error: "Stock entry not found" });
      }

      await stockEntry.destroy();
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  }
};

export default stockEntriesController;

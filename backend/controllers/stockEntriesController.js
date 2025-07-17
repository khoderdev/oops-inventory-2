import { Material, StockEntry } from "../models/index.js";

const stockEntriesController = {
  // Get all stock entries
  getAllStockEntries: async (req, res, next) => {
    try {
      const stockEntries = await StockEntry.findAll({
        include: { model: Material, as: "material" }
      });
      res.status(200).json(stockEntries);
    } catch (error) {
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

      // Calculate individual quantities for package units
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

      const stockEntry = await StockEntry.findByPk(id);
      if (!stockEntry) {
        return res.status(404).json({ error: "Stock entry not found" });
      }

      if (purchasedQuantity !== undefined && purchasedQuantity <= 0) {
        return res.status(400).json({ error: "Purchased quantity must be positive" });
      }

      if (costPerPurchasedUnit !== undefined && costPerPurchasedUnit < 0) {
        return res.status(400).json({ error: "Unit cost cannot be negative" });
      }

      if (totalCost !== undefined && totalCost < 0) {
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

      const finalPurchasedQuantity = purchasedQuantity ?? stockEntry.purchasedQuantity;
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
        // For non-package units, individual quantities match package quantities
        updatedIndividualQuantity = finalPurchasedQuantity;
        updatedIndividualUnit = finalPurchasedUnit;
      }

      await stockEntry.update({
        materialId: materialId ?? stockEntry.materialId,
        supplier: supplier ?? stockEntry.supplier,
        purchasedQuantity: finalPurchasedQuantity,
        purchasedUnit: finalPurchasedUnit,
        purchasedIndividualQuantity: updatedIndividualQuantity,
        purchasedIndividualUnit: updatedIndividualUnit,
        costPerPurchasedUnit: costPerPurchasedUnit ?? stockEntry.costPerPurchasedUnit,
        totalCost: totalCost ?? stockEntry.totalCost,
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

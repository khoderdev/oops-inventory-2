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
      const { materialId, supplier, purchasedQuantity, purchasedUnit, costPerPurchasedUnit, totalCost, purchaseDate, expiryDate, batchNumber, notes } = req.body;

      if (!materialId || !supplier || !purchasedQuantity || !purchasedUnit || !costPerPurchasedUnit || !totalCost || !purchaseDate) {
        return res.status(400).json({ error: "Missing required fields" });
      }

      if (purchasedQuantity <= 0 || costPerPurchasedUnit < 0 || totalCost < 0) {
        return res.status(400).json({ error: "Invalid numeric values" });
      }

      if (purchasedUnit.trim() === "") {
        return res.status(400).json({ error: "Purchased unit cannot be empty" });
      }

      const stockEntry = await StockEntry.create({
        materialId,
        supplier,
        purchasedQuantity,
        purchasedUnit,
        costPerPurchasedUnit,
        totalCost,
        purchaseDate,
        expiryDate,
        batchNumber,
        notes
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
      const { materialId, supplier, purchasedQuantity, purchasedUnit, costPerPurchasedUnit, totalCost, purchaseDate, expiryDate, batchNumber, notes } = req.body;

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

      await stockEntry.update({
        materialId: materialId ?? stockEntry.materialId,
        supplier: supplier ?? stockEntry.supplier,
        purchasedQuantity: purchasedQuantity ?? stockEntry.purchasedQuantity,
        purchasedUnit: purchasedUnit ?? stockEntry.purchasedUnit,
        costPerPurchasedUnit: costPerPurchasedUnit ?? stockEntry.costPerPurchasedUnit,
        totalCost: totalCost ?? stockEntry.totalCost,
        purchaseDate: purchaseDate ?? stockEntry.purchaseDate,
        expiryDate: expiryDate ?? stockEntry.expiryDate,
        batchNumber: batchNumber ?? stockEntry.batchNumber,
        notes: notes ?? stockEntry.notes
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

import StockEntry from "../models/StockEntry.js";

const stockEntriesController = {
  // Get all stock entries
  getAllStockEntries: async (req, res, next) => {
    try {
      const stockEntries = await StockEntry.findAll({
        include: ["Material"]
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
      const stockEntry = await StockEntry.findbyPk(id, {
        include: ["Material"]
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
      const { materialId, purchasedQuantity, purchasedUnit, totalCost } = req.body;

      // Validate required fields
      if (!materialId || !purchasedQuantity || !purchasedUnit || !totalCost) {
        return res.status(400).json({ error: "All fields are required" });
      }

      // Validate purchasedQuantity and totalCost are positive
      if (purchasedQuantity <= 0) {
        return res.status(400).json({ error: "Purchased quantity must be positive" });
      }
      if (totalCost < 0) {
        return res.status(400).json({ error: "Total cost cannot be negative" });
      }

      // Validate purchasedUnit is not empty
      if (purchasedUnit.trim() === "") {
        return res.status(400).json({ error: "Purchased unit cannot be empty" });
      }

      const stockEntry = await StockEntry.create({
        materialId,
        purchasedQuantity,
        purchasedUnit,
        totalCost
      });

      // Fetch the created stock entry with associations
      const createdStockEntry = await StockEntry.findByPk(stockEntry.id, {
        include: ["Material"]
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
      const { materialId, purchasedQuantity, purchasedUnit, totalCost } = req.body;

      const stockEntry = await StockEntry.findByPk(id);
      if (!stockEntry) {
        return res.status(404).json({ error: "Stock entry not found" });
      }

      // Validate provided fields
      if (purchasedQuantity !== undefined && purchasedQuantity <= 0) {
        return res.status(400).json({ error: "Purchased quantity must be positive" });
      }
      if (totalCost !== undefined && totalCost < 0) {
        return res.status(400).json({ error: "Total cost cannot be negative" });
      }
      if (purchasedUnit !== undefined && purchasedUnit.trim() === "") {
        return res.status(400).json({ error: "Purchased unit cannot be empty" });
      }

      await stockEntry.update({
        materialId: materialId || stockEntry.materialId,
        purchasedQuantity: purchasedQuantity !== undefined ? purchasedQuantity : stockEntry.purchasedQuantity,
        purchasedUnit: purchasedUnit !== undefined ? purchasedUnit : stockEntry.purchasedUnit,
        totalCost: totalCost !== undefined ? totalCost : stockEntry.totalCost
      });

      // Fetch the updated stock entry with associations
      const updatedStockEntry = await StockEntry.findByPk(id, {
        include: ["Material"]
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

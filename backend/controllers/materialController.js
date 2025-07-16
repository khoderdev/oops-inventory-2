import Material from "../models/materials.js";
import StockEntry from "../models/StockEntry.js";
import calculateStockConversion from "../utils/conversions.js";

const materialController = {
  // Get all materials with stock information
  getMaterialsWithStock: async (req, res, next) => {
    try {
      const materials = await Material.findAll({
        include: [{ model: StockEntry, as: "stockEntries" }]
      });

      const materialsWithStock = materials.map(material => {
        const stockEntries = material.stockEntries || [];
        let totalQuantityInBaseUnit = 0;
        let totalValue = 0;

        const conversions = stockEntries.map(entry => {
          const conversion = calculateStockConversion(entry, material);
          totalQuantityInBaseUnit += conversion.convertedQuantity;
          totalValue += conversion.totalCostInBaseUnit;
          return conversion;
        });

        const averageCostPerBaseUnit = totalQuantityInBaseUnit > 0 ? totalValue / totalQuantityInBaseUnit : 0;

        return {
          ...material.get(),
          stockEntries,
          totalQuantityInBaseUnit,
          totalValue,
          averageCostPerBaseUnit,
          availableQuantity: totalQuantityInBaseUnit
        };
      });

      res.json(materialsWithStock);
    } catch (err) {
      next(err);
    }
  },

  // Get all materials without stock information
  getAllMaterials: async (req, res, next) => {
    try {
      const materials = await Material.findAll();
      res.status(200).json(materials);
    } catch (err) {
      next(err);
    }
  },

  // Create a new material
  createMaterial: async (req, res, next) => {
    try {
      const { name, baseUnit } = req.body;

      // Validate required fields
      if (!name || !baseUnit) {
        return res.status(400).json({ error: "Name and baseUnit are required" });
      }

      // Validate baseUnit is not empty
      if (baseUnit.trim() === "") {
        return res.status(400).json({ error: "Base unit cannot be empty" });
      }

      const material = await Material.create(req.body);
      res.status(201).json(material);
    } catch (err) {
      next(err);
    }
  },

  // Update a material
  updateMaterial: async (req, res, next) => {
    try {
      const { id } = req.params;
      const { name, baseUnit } = req.body;

      const material = await Material.findByPk(id);
      if (!material) {
        return res.status(404).json({ error: "Material not found" });
      }

      // Validate baseUnit if provided
      if (baseUnit !== undefined && baseUnit.trim() === "") {
        return res.status(400).json({ error: "Base unit cannot be empty" });
      }

      await material.update({
        name: name !== undefined ? name : material.name,
        baseUnit: baseUnit !== undefined ? baseUnit : material.baseUnit
      });

      res.status(200).json(material);
    } catch (err) {
      next(err);
    }
  },

  // Delete a material
  deleteMaterial: async (req, res, next) => {
    try {
      const { id } = req.params;
      const material = await Material.findByPk(id);

      if (!material) {
        return res.status(404).json({ error: "Material not found" });
      }

      await material.destroy();
      res.status(204).send();
    } catch (err) {
      next(err);
    }
  }
};

export default materialController;

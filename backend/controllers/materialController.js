import Material from "../models/materials.js";
import StockEntry from "../models/StockEntry.js";
import calculateStockConversion from "../utils/conversions.js";

export const getMaterialsWithStock = async (req, res, next) => {
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
};

export const createMaterial = async (req, res, next) => {
  try {
    const material = await Material.create(req.body);
    res.status(201).json(material);
  } catch (err) {
    next(err);
  }
};

export default {
  getMaterialsWithStock,
  createMaterial
};

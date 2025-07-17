import { Material, StockEntry } from "../models/index.js";
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
      const { name, baseUnit, unitType, inputUnit, packageQuantity, costPerBaseUnit, category, description } = req.body;

      // Validate required fields
      if (!name || !baseUnit || !unitType) {
        return res.status(400).json({ error: "Name, baseUnit, unitType are required" });
      }

      // Validate baseUnit is not empty
      if (baseUnit.trim() === "") {
        return res.status(400).json({ error: "Base unit cannot be empty" });
      }

      // Validate package-specific fields
      if (unitType === "package") {
        if (!packageQuantity || packageQuantity < 1) {
          return res.status(400).json({ error: "Package quantity must be at least 1 for package materials" });
        }
        if (!inputUnit || inputUnit.trim() === "") {
          return res.status(400).json({ error: "Input unit is required for package materials" });
        }
      }

      const materialData = {
        name,
        baseUnit,
        unitType,
        inputUnit,
        packageQuantity: unitType === "package" ? packageQuantity : null,
        costPerBaseUnit,
        category,
        description
      };

      const material = await Material.create(materialData);
      res.status(201).json(material);
    } catch (err) {
      next(err);
    }
  },

  // Update a material
  updateMaterial: async (req, res, next) => {
    try {
      const { id } = req.params;
      const { name, baseUnit, unitType, inputUnit, packageQuantity, costPerBaseUnit, category, description } = req.body;

      const material = await Material.findByPk(id);
      if (!material) {
        return res.status(404).json({ error: "Material not found" });
      }

      // Validate baseUnit if provided
      if (baseUnit !== undefined && baseUnit.trim() === "") {
        return res.status(400).json({ error: "Base unit cannot be empty" });
      }

      // Validate package-specific fields if unitType is being changed to package
      const newUnitType = unitType !== undefined ? unitType : material.unitType;
      if (newUnitType === "package") {
        const newPackageQuantity = packageQuantity !== undefined ? packageQuantity : material.packageQuantity;
        const newInputUnit = inputUnit !== undefined ? inputUnit : material.inputUnit;

        if (!newPackageQuantity || newPackageQuantity < 1) {
          return res.status(400).json({ error: "Package quantity must be at least 1 for package materials" });
        }
        if (!newInputUnit || newInputUnit.trim() === "") {
          return res.status(400).json({ error: "Input unit is required for package materials" });
        }
      }

      await material.update({
        name: name !== undefined ? name : material.name,
        baseUnit: baseUnit !== undefined ? baseUnit : material.baseUnit,
        unitType: unitType !== undefined ? unitType : material.unitType,
        inputUnit: inputUnit !== undefined ? inputUnit : material.inputUnit,
        packageQuantity: packageQuantity !== undefined ? packageQuantity : material.packageQuantity,
        costPerBaseUnit: costPerBaseUnit !== undefined ? costPerBaseUnit : material.costPerBaseUnit,
        category: category !== undefined ? category : material.category,
        description: description !== undefined ? description : material.description
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

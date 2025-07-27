import { Op } from "sequelize";
import sequelize from "../config/database.js";
import { Material, StockEntry, Wasting } from "../models/index.js";
import { auditStockOperation } from "../middleware/auditMiddleware.js";

const stockEntriesController = {
  // Get all stock entries
  getAllStockEntries: async (req, res, next) => {
    try {
      const rawStockEntries = await sequelize.query(
        `
        SELECT
          se.*,
          m.id as "material.id",
          m.name as "material.name",
          m."baseUnit" as "material.baseUnit",
          m."unitType" as "material.unitType",
          m."inputUnit" as "material.inputUnit",
          m."packageQuantity" as "material.packageQuantity",
          m.category as "material.category"
        FROM "stockEntries" se
        LEFT JOIN materials m ON se."materialId" = m.id
        ORDER BY se.id ASC
      `,
        {
          type: sequelize.QueryTypes.SELECT,
          nest: true
        }
      );
      if (rawStockEntries.length > 0) {
        console.log("Sample stock entry:", rawStockEntries[0]);
        const negativeStockEntries = rawStockEntries.filter(entry => entry.purchasedIndividualQuantity < 0 || entry.purchasedQuantity < 0);
        if (negativeStockEntries.length > 0) {
          console.warn("Negative stock entries found:", negativeStockEntries);
        }
      }
      res.status(200).json(rawStockEntries);
    } catch (error) {
      console.error("Error fetching stock entries:", error);
      next(error);
    }
  },

  // Get stock entry by ID
  getStockEntryById: async (req, res, next) => {
    try {
      const { id } = req.params;
      if (!/^\d+$/.test(id)) {
        return res.status(400).json({ error: "Invalid stock entry ID" });
      }
      const stockEntry = await StockEntry.findByPk(id, {
        include: { model: Material, as: "material" }
      });

      if (!stockEntry) {
        return res.status(404).json({ error: "Stock entry not found" });
      }

      res.status(200).json(stockEntry);
    } catch (error) {
      console.error("Error fetching stock entry by ID:", error);
      next(error);
    }
  },

  // Create new stock entry
  createStockEntries: async (req, res, next) => {
    try {
      const { materialId, supplier, purchasedQuantity, purchasedUnit, costPerPurchasedUnit, totalCost, costPerBaseUnit, purchaseDate, expiryDate } = req.body;

      if (!materialId || !supplier || !purchasedQuantity || !purchasedUnit || !costPerPurchasedUnit || !totalCost || !purchaseDate) {
        return res.status(400).json({ error: "Missing required fields" });
      }

      const numericPurchasedQuantity = parseFloat(purchasedQuantity);
      const numericCostPerPurchasedUnit = parseFloat(costPerPurchasedUnit);
      const numericTotalCost = parseFloat(totalCost);
      const numericCostPerBaseUnit = costPerBaseUnit ? parseFloat(costPerBaseUnit) : undefined;

      if (isNaN(numericPurchasedQuantity) || numericPurchasedQuantity <= 0 || numericCostPerPurchasedUnit < 0 || numericTotalCost < 0) {
        return res.status(400).json({ error: "Invalid numeric values" });
      }

      if (purchasedUnit.trim() === "") {
        return res.status(400).json({ error: "Purchased unit cannot be empty" });
      }

      const material = await Material.findByPk(materialId);
      if (!material) {
        return res.status(404).json({ error: "Material not found" });
      }

      let purchasedIndividualQuantity = numericPurchasedQuantity;
      let purchasedIndividualUnit = purchasedUnit;

      if (material.unitType === "package" && material.packageQuantity && material.packageQuantity > 0) {
        purchasedIndividualQuantity = Math.round(numericPurchasedQuantity * material.packageQuantity);
        purchasedIndividualUnit = material.baseUnit;
      } else if (material.unitType === "mass") {
        const massConversions = {
          kg: 1000,
          g: 1,
          lb: 453.592,
          oz: 28.3495
        };
        const conversionFactor = massConversions[purchasedUnit.toLowerCase()];
        if (conversionFactor) {
          purchasedIndividualQuantity = Math.round(numericPurchasedQuantity * conversionFactor);
          purchasedIndividualUnit = material.baseUnit;
        } else {
          console.warn(`Unknown mass unit: ${purchasedUnit} for material: ${material.name}`);
          purchasedIndividualQuantity = numericPurchasedQuantity;
          purchasedIndividualUnit = purchasedUnit;
        }
      }

      const finalCostPerBaseUnit = numericCostPerBaseUnit !== undefined ? numericCostPerBaseUnit : purchasedIndividualQuantity > 0 ? parseFloat((numericTotalCost / purchasedIndividualQuantity).toFixed(6)) : 0;

      const stockEntry = await StockEntry.create({
        materialId,
        supplier,
        purchasedQuantity: numericPurchasedQuantity,
        purchasedUnit,
        purchasedIndividualQuantity,
        purchasedIndividualUnit,
        costPerPurchasedUnit: numericCostPerPurchasedUnit,
        costPerBaseUnit: finalCostPerBaseUnit,
        totalCost: numericTotalCost,
        purchaseDate,
        expiryDate
      });

      const createdStockEntry = await StockEntry.findByPk(stockEntry.id, {
        include: { model: Material, as: "material" }
      });

      // Log successful stock entry creation
      const userId = req.user?.id;
      if (userId) {
        await auditStockOperation(userId, 'CREATE', createdStockEntry.toJSON(), null, req);
      }

      res.status(201).json(createdStockEntry);
    } catch (error) {
      console.error("Error creating stock entry:", error);
      next(error);
    }
  },

  // Update stock entry
  updateStockEntries: async (req, res, next) => {
    try {
      const { id } = req.params;
      const { materialId, supplier, purchasedQuantity, purchasedUnit, costPerPurchasedUnit, totalCost, costPerBaseUnit, purchaseDate, expiryDate } = req.body;

      const numericPurchasedQuantity = purchasedQuantity ? parseFloat(purchasedQuantity) : undefined;
      const numericCostPerPurchasedUnit = costPerPurchasedUnit ? parseFloat(costPerPurchasedUnit) : undefined;
      const numericTotalCost = totalCost ? parseFloat(totalCost) : undefined;
      const numericCostPerBaseUnit = costPerBaseUnit ? parseFloat(costPerBaseUnit) : undefined;

      const stockEntry = await StockEntry.findByPk(id);
      if (!stockEntry) {
        return res.status(404).json({ error: "Stock entry not found" });
      }

      // Store original stock entry data for audit
      const originalStockEntry = stockEntry.toJSON();

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

      const material = await Material.findByPk(materialId ?? stockEntry.materialId);
      if (!material) {
        return res.status(404).json({ error: "Material not found" });
      }

      const finalPurchasedQuantity = numericPurchasedQuantity ?? stockEntry.purchasedQuantity;
      const finalPurchasedUnit = purchasedUnit ?? stockEntry.purchasedUnit;
      const finalCostPerPurchasedUnit = numericCostPerPurchasedUnit ?? stockEntry.costPerPurchasedUnit;
      const finalTotalCost = numericTotalCost ?? stockEntry.totalCost;

      let updatedIndividualQuantity = stockEntry.purchasedIndividualQuantity;
      let updatedIndividualUnit = stockEntry.purchasedIndividualUnit;

      if (material.unitType === "package" && material.packageQuantity && material.packageQuantity > 0) {
        updatedIndividualQuantity = Math.round(finalPurchasedQuantity * material.packageQuantity);
        updatedIndividualUnit = material.baseUnit;
      } else if (material.unitType === "mass") {
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
        }
      } else {
        updatedIndividualQuantity = Math.round(finalPurchasedQuantity);
        updatedIndividualUnit = finalPurchasedUnit;
      }

      const finalCostPerBaseUnit = numericCostPerBaseUnit !== undefined ? numericCostPerBaseUnit : updatedIndividualQuantity > 0 ? parseFloat((finalTotalCost / updatedIndividualQuantity).toFixed(6)) : 0;

      await stockEntry.update({
        materialId: materialId ?? stockEntry.materialId,
        supplier: supplier ?? stockEntry.supplier,
        purchasedQuantity: finalPurchasedQuantity,
        purchasedUnit: finalPurchasedUnit,
        purchasedIndividualQuantity: updatedIndividualQuantity,
        purchasedIndividualUnit: updatedIndividualUnit,
        costPerPurchasedUnit: finalCostPerPurchasedUnit,
        costPerBaseUnit: finalCostPerBaseUnit,
        totalCost: finalTotalCost,
        purchaseDate: purchaseDate ?? stockEntry.purchaseDate,
        expiryDate: expiryDate ?? stockEntry.expiryDate
      });

      const updatedStockEntry = await StockEntry.findByPk(id, {
        include: { model: Material, as: "material" }
      });

      // Log successful stock entry update
      const userId = req.user?.id;
      if (userId) {
        await auditStockOperation(userId, 'UPDATE', updatedStockEntry.toJSON(), originalStockEntry, req);
      }

      res.status(200).json(updatedStockEntry);
    } catch (error) {
      console.error("Error updating stock entry:", error);
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

      // Store stock entry data for audit before deletion
      const deletedStockEntry = stockEntry.toJSON();

      await stockEntry.destroy();

      // Log successful stock entry deletion
      const userId = req.user?.id;
      if (userId) {
        await auditStockOperation(userId, 'DELETE', deletedStockEntry, null, req);
      }

      res.status(204).send();
    } catch (error) {
      console.error("Error deleting stock entry:", error);
      next(error);
    }
  },

  // Add quantity to a specific stock entry
  addToSpecificEntry: async (req, res, next) => {
    try {
      const { id } = req.params;
      const { additionalQuantity, unit, additionDate, notes, costPerPurchasedUnit } = req.body;

      if (!additionalQuantity || !unit) {
        return res.status(400).json({ error: "Missing required fields: additionalQuantity, unit" });
      }

      const numericAdditionalQuantity = parseFloat(additionalQuantity);
      const numericCostPerPurchasedUnit = costPerPurchasedUnit ? parseFloat(costPerPurchasedUnit) : undefined;

      if (isNaN(numericAdditionalQuantity) || numericAdditionalQuantity <= 0) {
        return res.status(400).json({ error: "Additional quantity must be a positive number" });
      }

      if (numericCostPerPurchasedUnit !== undefined && numericCostPerPurchasedUnit < 0) {
        return res.status(400).json({ error: "Cost per unit cannot be negative" });
      }

      const stockEntry = await StockEntry.findByPk(id, {
        include: { model: Material, as: "material" }
      });

      if (!stockEntry) {
        return res.status(404).json({ error: "Stock entry not found" });
      }

      const material = stockEntry.material;

      if ((unit === "piece" || unit === "bottle") && material.unitType === "package" && numericCostPerPurchasedUnit) {
        const expectedCostPerUnit = material.costPerUnit / material.packageQuantity;
        if (Math.abs(numericCostPerPurchasedUnit - expectedCostPerUnit) / expectedCostPerUnit > 0.5) {
          return res.status(400).json({
            error: `Cost per ${unit} ($${numericCostPerPurchasedUnit.toFixed(4)}) deviates significantly from expected ($${expectedCostPerUnit.toFixed(4)})`
          });
        }
      }

      let additionalInOriginalUnit = numericAdditionalQuantity;

      if (stockEntry.purchasedUnit !== unit) {
        if (material.unitType === "mass") {
          const massConversions = { kg: 1000, g: 1, lb: 453.592, oz: 28.3495 };
          const originalUnitFactor = massConversions[stockEntry.purchasedUnit.toLowerCase()];
          const additionalUnitFactor = massConversions[unit.toLowerCase()];

          if (originalUnitFactor && additionalUnitFactor) {
            additionalInOriginalUnit = numericAdditionalQuantity * (additionalUnitFactor / originalUnitFactor);
          } else {
            return res.status(400).json({
              error: `Cannot convert between units: ${unit} and ${stockEntry.purchasedUnit}`
            });
          }
        } else if (material.unitType === "package") {
          if (unit === stockEntry.purchasedUnit) {
            additionalInOriginalUnit = numericAdditionalQuantity;
          } else if ((unit === "piece" || unit === "bottle") && material.packageQuantity && material.packageQuantity > 0) {
            additionalInOriginalUnit = numericAdditionalQuantity / material.packageQuantity;
          } else {
            return res.status(400).json({
              error: `Package unit mismatch: cannot add ${unit} to ${stockEntry.purchasedUnit}`
            });
          }
        } else {
          return res.status(400).json({
            error: `Unit mismatch: cannot add ${unit} to ${stockEntry.purchasedUnit}`
          });
        }
      }

      const newPurchasedQuantity = parseFloat(stockEntry.purchasedQuantity) + additionalInOriginalUnit;

      let newIndividualQuantity;
      let newIndividualUnit;

      if (material.unitType === "package" && material.packageQuantity && material.packageQuantity > 0) {
        newIndividualQuantity = (stockEntry.purchasedIndividualQuantity || 0) + (unit === "piece" || unit === "bottle" ? Math.round(numericAdditionalQuantity) : Math.round(numericAdditionalQuantity * material.packageQuantity));
        newIndividualUnit = material.baseUnit;
      } else if (material.unitType === "mass") {
        if (unit === material.baseUnit) {
          newIndividualQuantity = (stockEntry.purchasedIndividualQuantity || 0) + numericAdditionalQuantity;
        } else {
          const massConversions = { kg: 1000, g: 1, lb: 453.592, oz: 28.3495 };
          const additionalUnitFactor = massConversions[unit.toLowerCase()] || 1;
          const additionalInBaseUnit = Math.round(numericAdditionalQuantity * additionalUnitFactor);
          newIndividualQuantity = (stockEntry.purchasedIndividualQuantity || 0) + additionalInBaseUnit;
        }
        newIndividualUnit = material.baseUnit;
      } else {
        newIndividualQuantity = Math.round((stockEntry.purchasedIndividualQuantity || 0) + numericAdditionalQuantity);
        newIndividualUnit = stockEntry.purchasedIndividualUnit || stockEntry.purchasedUnit;
      }

      const finalCostPerPurchasedUnit = numericCostPerPurchasedUnit ?? stockEntry.costPerPurchasedUnit;
      const newTotalCost = newPurchasedQuantity * finalCostPerPurchasedUnit;
      const newCostPerBaseUnit = newIndividualQuantity > 0 ? parseFloat((newTotalCost / newIndividualQuantity).toFixed(6)) : 0;

      let newPurchasedConvertedQuantity = newPurchasedQuantity;
      let newPurchasedConvertedUnit = stockEntry.purchasedUnit;

      if (material.unitType === "mass") {
        const massConversions = { kg: 1000, g: 1, lb: 453.592, oz: 28.3495 };
        const conversionFactor = massConversions[stockEntry.purchasedUnit.toLowerCase()] || 1;
        newPurchasedConvertedQuantity = Math.round(newPurchasedQuantity * conversionFactor);
        newPurchasedConvertedUnit = material.baseUnit;
      } else if (material.unitType === "package") {
        newPurchasedConvertedQuantity = newPurchasedQuantity;
        newPurchasedConvertedUnit = stockEntry.purchasedUnit;
      }

      await stockEntry.update({
        purchasedQuantity: newPurchasedQuantity,
        purchasedIndividualQuantity: newIndividualQuantity,
        purchasedIndividualUnit: newIndividualUnit,
        purchasedConvertedQuantity: newPurchasedConvertedQuantity,
        purchasedConvertedUnit: newPurchasedConvertedUnit,
        costPerPurchasedUnit: finalCostPerPurchasedUnit,
        costPerBaseUnit: newCostPerBaseUnit,
        totalCost: newTotalCost,
        updatedAt: new Date(),
        notes: notes ? `${stockEntry.notes || ""}\n[${new Date().toLocaleDateString()}] Added ${numericAdditionalQuantity} ${unit}. ${notes}`.trim() : stockEntry.notes
      });

      const updatedEntry = await StockEntry.findByPk(id, {
        include: { model: Material, as: "material" }
      });

      res.status(200).json({
        message: `Successfully added ${numericAdditionalQuantity} ${unit} to existing stock entry`,
        stockEntry: updatedEntry
      });
    } catch (error) {
      console.error("Error adding to specific stock entry:", error);
      next(error);
    }
  },

  addToStock: async (req, res, next) => {
    try {
      const { materialId, additionalQuantity, unit, additionDate, notes, costPerPurchasedUnit, costPerBaseUnit } = req.body;

      if (!materialId || !additionalQuantity || !unit) {
        return res.status(400).json({ error: "Missing required fields: materialId, additionalQuantity, unit" });
      }

      const numericAdditionalQuantity = parseFloat(additionalQuantity);
      const numericCostPerPurchasedUnit = costPerPurchasedUnit ? parseFloat(costPerPurchasedUnit) : undefined;
      const numericCostPerBaseUnit = costPerBaseUnit ? parseFloat(costPerBaseUnit) : undefined;

      if (isNaN(numericAdditionalQuantity) || numericAdditionalQuantity <= 0) {
        return res.status(400).json({ error: "Additional quantity must be a positive number" });
      }

      const material = await Material.findByPk(materialId);
      if (!material) {
        return res.status(404).json({ error: "Material not found" });
      }

      const mostRecentEntry = await StockEntry.findOne({
        where: { materialId },
        order: [["createdAt", "DESC"]],
        include: { model: Material, as: "material" }
      });

      let additionalIndividualQuantity = numericAdditionalQuantity;
      let additionalIndividualUnit = unit;

      if (material.unitType === "package" && material.packageQuantity && material.packageQuantity > 0) {
        additionalIndividualQuantity = Math.round(numericAdditionalQuantity * material.packageQuantity);
        additionalIndividualUnit = material.baseUnit;
      } else if (material.unitType === "mass") {
        const massConversions = { kg: 1000, g: 1, lb: 453.592, oz: 28.3495 };
        const conversionFactor = massConversions[unit.toLowerCase()];
        if (conversionFactor) {
          additionalIndividualQuantity = Math.round(numericAdditionalQuantity * conversionFactor);
          additionalIndividualUnit = material.baseUnit;
        }
      }

      const defaultCostPerUnit = numericCostPerPurchasedUnit ?? mostRecentEntry?.costPerPurchasedUnit ?? material.costPerBaseUnit ?? material.costPerUnit ?? 0;
      const totalAdditionCost = numericAdditionalQuantity * defaultCostPerUnit;
      const finalCostPerBaseUnit = numericCostPerBaseUnit !== undefined ? numericCostPerBaseUnit : additionalIndividualQuantity > 0 ? parseFloat((totalAdditionCost / additionalIndividualQuantity).toFixed(6)) : 0;

      const additionEntry = await StockEntry.create({
        materialId,
        supplier: `Stock Addition - ${new Date().toLocaleDateString()}`,
        purchasedQuantity: numericAdditionalQuantity,
        purchasedUnit: unit,
        purchasedIndividualQuantity: additionalIndividualQuantity,
        purchasedIndividualUnit: additionalIndividualUnit,
        costPerPurchasedUnit: defaultCostPerUnit,
        costPerBaseUnit: finalCostPerBaseUnit,
        totalCost: totalAdditionCost,
        purchaseDate: additionDate ? new Date(additionDate) : new Date(),
        notes: notes || `Added ${numericAdditionalQuantity} ${unit} to existing stock`
      });

      const createdEntry = await StockEntry.findByPk(additionEntry.id, {
        include: { model: Material, as: "material" }
      });

      res.status(201).json({
        message: `Successfully added ${numericAdditionalQuantity} ${unit} to ${material.name}`,
        stockEntry: createdEntry
      });
    } catch (error) {
      console.error("Error adding to stock:", error);
      next(error);
    }
  },

  async wasteFromSpecificEntry(req, res, next) {
    try {
      const { id } = req.params;
      const { wasteQuantity, unit, wasteReason, wasteDate, notes } = req.body;

      if (!wasteQuantity || !unit || !wasteReason) {
        return res.status(400).json({ error: "Missing required fields: wasteQuantity, unit, wasteReason" });
      }

      const numericWasteQuantity = parseFloat(wasteQuantity);
      if (isNaN(numericWasteQuantity) || numericWasteQuantity <= 0) {
        return res.status(400).json({ error: "Waste quantity must be a positive number" });
      }

      const stockEntry = await StockEntry.findByPk(id, {
        include: { model: Material, as: "material" }
      });

      if (!stockEntry) {
        return res.status(404).json({ error: "Stock entry not found" });
      }

      const material = stockEntry.material;

      let wasteInOriginalUnit = numericWasteQuantity; // Quantity in stockEntry.purchasedUnit
      let wasteInSmallerUnit = numericWasteQuantity; // Quantity in material.baseUnit or purchasedIndividualUnit
      let wasteUnitForRecord = unit; // Unit to store in Wasting table

      // Convert waste quantity to stockEntry.purchasedUnit for validation
      if (stockEntry.purchasedUnit !== unit) {
        if (material.unitType === "package" && material.packageQuantity && material.packageQuantity > 0) {
          if (unit === material.baseUnit) {
            wasteInOriginalUnit = numericWasteQuantity / material.packageQuantity; // Convert pieces to packs
            wasteInSmallerUnit = numericWasteQuantity; // Keep pieces for record
            wasteUnitForRecord = material.baseUnit; // Store as piece
          } else if (unit !== stockEntry.purchasedUnit) {
            return res.status(400).json({
              error: `Package unit mismatch: cannot waste ${unit} from ${stockEntry.purchasedUnit}. Use ${stockEntry.purchasedUnit} or ${material.baseUnit}`
            });
          }
        } else if (material.unitType === "mass") {
          const massConversions = { kg: 1000, g: 1, lb: 453.592, oz: 28.3495 };
          const originalUnitFactor = massConversions[stockEntry.purchasedUnit.toLowerCase()];
          const wasteUnitFactor = massConversions[unit.toLowerCase()];

          if (originalUnitFactor && wasteUnitFactor) {
            wasteInOriginalUnit = numericWasteQuantity * (wasteUnitFactor / originalUnitFactor);
            wasteInSmallerUnit = numericWasteQuantity * (wasteUnitFactor || 1);
            wasteUnitForRecord = material.baseUnit;
          } else {
            return res.status(400).json({
              error: `Cannot convert between units: ${unit} and ${stockEntry.purchasedUnit}`
            });
          }
        } else {
          return res.status(400).json({
            error: `Unit mismatch: cannot waste ${unit} from ${stockEntry.purchasedUnit}`
          });
        }
      } else if (material.unitType === "package" && material.packageQuantity && material.packageQuantity > 0) {
        wasteInSmallerUnit = numericWasteQuantity * material.packageQuantity;
        wasteUnitForRecord = material.baseUnit;
      }

      if (wasteInOriginalUnit > stockEntry.purchasedQuantity) {
        return res.status(400).json({
          error: `Insufficient stock in this entry. Available: ${stockEntry.purchasedQuantity} ${stockEntry.purchasedUnit}, Requested: ${wasteInOriginalUnit.toFixed(3)} ${stockEntry.purchasedUnit}`
        });
      }

      // Update stock quantities
      const newPurchasedQuantity = Math.max(0, parseFloat(stockEntry.purchasedQuantity) - wasteInOriginalUnit);
      let newIndividualQuantity = stockEntry.purchasedIndividualQuantity || 0;
      let newIndividualUnit = stockEntry.purchasedIndividualUnit || material.baseUnit;

      if (material.unitType === "package" && material.packageQuantity && material.packageQuantity > 0) {
        newIndividualQuantity = Math.max(0, (stockEntry.purchasedIndividualQuantity || 0) - wasteInSmallerUnit);
        newIndividualUnit = material.baseUnit;
      } else if (material.unitType === "mass") {
        newIndividualQuantity = Math.max(0, (stockEntry.purchasedIndividualQuantity || 0) - wasteInSmallerUnit);
        newIndividualUnit = material.baseUnit;
      } else {
        newIndividualQuantity = Math.max(0, (stockEntry.purchasedIndividualQuantity || 0) - numericWasteQuantity);
        newIndividualUnit = stockEntry.purchasedIndividualUnit || stockEntry.purchasedUnit;
      }

      if (newIndividualQuantity < 0) {
        return res.status(400).json({
          error: `Cannot reduce stock below zero. Available: ${stockEntry.purchasedIndividualQuantity} ${stockEntry.purchasedIndividualUnit}, Requested to waste: ${wasteInSmallerUnit} ${wasteUnitForRecord}`
        });
      }

      // Calculate cost in smaller unit
      const costPerSmallerUnit = parseFloat(stockEntry.costPerBaseUnit) || parseFloat(stockEntry.costPerPurchasedUnit) / material.packageQuantity || 0;
      const totalCostInSmallerUnit = wasteInSmallerUnit * costPerSmallerUnit;

      let newPurchasedConvertedQuantity = newPurchasedQuantity;
      let newPurchasedConvertedUnit = stockEntry.purchasedUnit;

      if (material.unitType === "mass") {
        const massConversions = { kg: 1000, g: 1, lb: 453.592, oz: 28.3495 };
        const conversionFactor = massConversions[stockEntry.purchasedUnit.toLowerCase()] || 1;
        newPurchasedConvertedQuantity = Math.round(newPurchasedQuantity * conversionFactor);
        newPurchasedConvertedUnit = material.baseUnit;
      } else if (material.unitType === "package") {
        newPurchasedConvertedQuantity = newPurchasedQuantity;
        newPurchasedConvertedUnit = stockEntry.purchasedUnit;
      }

      const costReduction = wasteInOriginalUnit * parseFloat(stockEntry.costPerPurchasedUnit);
      const newTotalCost = Math.max(0, parseFloat(stockEntry.totalCost) - costReduction);
      const newCostPerBaseUnit = newIndividualQuantity > 0 ? parseFloat((newTotalCost / newIndividualQuantity).toFixed(6)) : 0;

      await stockEntry.update({
        purchasedQuantity: newPurchasedQuantity,
        purchasedIndividualQuantity: newIndividualQuantity,
        purchasedIndividualUnit: newIndividualUnit,
        purchasedConvertedQuantity: newPurchasedConvertedQuantity,
        purchasedConvertedUnit: newPurchasedConvertedUnit,
        costPerBaseUnit: newCostPerBaseUnit,
        totalCost: newTotalCost,
        updatedAt: new Date(),
        notes: notes ? `${stockEntry.notes || ""}\n[${new Date().toLocaleDateString()}] Waste: ${numericWasteQuantity} ${unit} (${wasteReason}). ${notes}`.trim() : stockEntry.notes,
        wasteReason: wasteReason
      });

      // Create a Wasting record using the smaller unit
      const wasteRecord = await Wasting.create({
        stockEntryId: stockEntry.id,
        materialName: material.name,
        category: material.category,
        quantity: wasteInSmallerUnit,
        unit: wasteUnitForRecord,
        costPerBaseUnit: costPerSmallerUnit,
        totalCost: totalCostInSmallerUnit,
        wasteReason,
        wasteDate: wasteDate ? new Date(wasteDate) : new Date(),
        notes: notes || `Waste recorded: ${wasteReason} - ${wasteInSmallerUnit} ${wasteUnitForRecord}`
      });

      const updatedEntry = await StockEntry.findByPk(id, {
        include: { model: Material, as: "material" }
      });

      res.status(200).json({
        message: `Successfully recorded waste of ${wasteInSmallerUnit} ${wasteUnitForRecord} from stock entry ${stockEntry.id}`,
        stockEntry: updatedEntry,
        wasteRecord,
        wastedQuantity: wasteInSmallerUnit,
        wastedUnit: wasteUnitForRecord,
        reason: wasteReason
      });
    } catch (error) {
      console.error("Error recording waste from specific stock entry:", error);
      next(error);
    }
  },

  getWastageReport: async (req, res, next) => {
    try {
      const { startDate, endDate, stockEntryId, reason } = req.query;

      if (!startDate) {
        return res.status(400).json({ error: "startDate is required" });
      }

      // Create proper date range - start of startDate to end of endDate
      const startOfDay = new Date(startDate);
      startOfDay.setHours(0, 0, 0, 0);

      const endOfDay = endDate ? new Date(endDate) : new Date();
      endOfDay.setHours(23, 59, 59, 999);

      console.log("Date filtering:", {
        startDate,
        endDate,
        startOfDay: startOfDay.toISOString(),
        endOfDay: endOfDay.toISOString()
      });

      const whereClause = {
        wasteDate: {
          [Op.gte]: startOfDay,
          [Op.lte]: endOfDay
        }
      };

      if (stockEntryId && stockEntryId !== "undefined") {
        whereClause.stockEntryId = stockEntryId;
      }

      if (reason && reason !== "undefined") {
        whereClause.wasteReason = reason;
      }

      console.log("Final whereClause:", JSON.stringify(whereClause, null, 2));

      const wastageRecords = await Wasting.findAll({
        where: whereClause,
        include: [
          {
            model: StockEntry,
            as: "stockEntry",
            include: [
              {
                model: Material,
                as: "material",
                attributes: ["id", "name", "category", "baseUnit", "unitType"]
              }
            ]
          }
        ]
      });

      console.log("Found wastage records:", wastageRecords.length);
      console.log(
        "Sample record:",
        wastageRecords[0]
          ? {
              id: wastageRecords[0].id,
              wasteDate: wastageRecords[0].wasteDate,
              quantity: wastageRecords[0].quantity,
              unit: wastageRecords[0].unit,
              materialName: wastageRecords[0].materialName
            }
          : "No records found"
      );

      const formattedRecords = wastageRecords.map(record => ({
        id: record.id,
        stockEntryId: record.stockEntryId,
        materialId: record.stockEntry?.materialId,
        materialName: record.stockEntry?.material?.name || record.materialName || "Unknown",
        category: record.stockEntry?.material?.category || record.category || "Unknown",
        quantity: record.quantity,
        unit: record.unit,
        costPerBaseUnit: record.costPerBaseUnit || 0,
        totalCost: record.totalCost || 0,
        wasteDate: record.wasteDate,
        reason: record.wasteReason,
        notes: record.notes
      }));

      res.status(200).json({ data: formattedRecords });
    } catch (error) {
      console.error("Error fetching wastage report:", error);
      next(error);
    }
  },
  recordWaste: async (req, res, next) => {
    try {
      const { materialId, wasteQuantity, unit, wasteReason, wasteDate, notes } = req.body;

      if (!materialId || !wasteQuantity || !unit || !wasteReason) {
        return res.status(400).json({ error: "Missing required fields: materialId, wasteQuantity, unit, wasteReason" });
      }

      const numericWasteQuantity = parseFloat(wasteQuantity);
      if (isNaN(numericWasteQuantity) || numericWasteQuantity <= 0) {
        return res.status(400).json({ error: "Waste quantity must be a positive number" });
      }

      const material = await Material.findByPk(materialId);
      if (!material) {
        return res.status(404).json({ error: "Material not found" });
      }

      let wasteIndividualQuantity = numericWasteQuantity;
      let wasteIndividualUnit = unit;

      if (material.unitType === "package" && material.packageQuantity && material.packageQuantity > 0) {
        wasteIndividualQuantity = Math.round(numericWasteQuantity * material.packageQuantity);
        wasteIndividualUnit = material.baseUnit;
      } else if (material.unitType === "mass") {
        const massConversions = { kg: 1000, g: 1, lb: 453.592, oz: 28.3495 };
        const conversionFactor = massConversions[unit.toLowerCase()];
        if (conversionFactor) {
          wasteIndividualQuantity = Math.round(numericWasteQuantity * conversionFactor);
          wasteIndividualUnit = material.baseUnit;
        }
      }

      const stockEntries = await StockEntry.findAll({
        where: {
          materialId,
          purchasedIndividualQuantity: { [Op.gt]: 0 }
        },
        order: [["createdAt", "ASC"]],
        include: { model: Material, as: "material" }
      });

      if (stockEntries.length === 0) {
        return res.status(400).json({ error: "No stock available for this material" });
      }

      const totalAvailableIndividualQuantity = stockEntries.reduce((sum, entry) => sum + entry.purchasedIndividualQuantity, 0);

      if (wasteIndividualQuantity > totalAvailableIndividualQuantity) {
        return res.status(400).json({
          error: `Insufficient stock. Available: ${totalAvailableIndividualQuantity} ${wasteIndividualUnit}, Requested: ${wasteIndividualQuantity} ${wasteIndividualUnit}`
        });
      }

      let remainingWasteQuantity = wasteIndividualQuantity;
      const updatedEntries = [];

      for (const entry of stockEntries) {
        if (remainingWasteQuantity <= 0) break;

        const entryAvailableQuantity = entry.purchasedIndividualQuantity;
        const quantityToReduce = Math.min(remainingWasteQuantity, entryAvailableQuantity);

        let newPurchasedQuantity = entry.purchasedQuantity;
        if (material.unitType === "package" && material.packageQuantity && material.packageQuantity > 0) {
          newPurchasedQuantity = Math.max(0, newIndividualQuantity / material.packageQuantity);
        } else if (material.unitType === "mass") {
          const massConversions = { kg: 1000, g: 1, lb: 453.592, oz: 28.3495 };
          const conversionFactor = massConversions[entry.purchasedUnit.toLowerCase()] || 1;
          newPurchasedQuantity = Math.max(0, newIndividualQuantity / conversionFactor);
        } else {
          newPurchasedQuantity = newIndividualQuantity;
        }

        const newIndividualQuantity = entryAvailableQuantity - quantityToReduce;
        const costReduction = (quantityToReduce / entry.purchasedIndividualQuantity) * entry.totalCost;
        const newTotalCost = Math.max(0, entry.totalCost - costReduction);
        const newCostPerBaseUnit = newIndividualQuantity > 0 ? parseFloat((newTotalCost / newIndividualQuantity).toFixed(6)) : 0;

        await entry.update({
          purchasedQuantity: newPurchasedQuantity,
          purchasedIndividualQuantity: newIndividualQuantity,
          totalCost: newTotalCost,
          costPerBaseUnit: newCostPerBaseUnit
        });

        updatedEntries.push({
          id: entry.id,
          originalQuantity: entryAvailableQuantity,
          reducedBy: quantityToReduce,
          newQuantity: newIndividualQuantity
        });

        remainingWasteQuantity -= quantityToReduce;
      }

      const wasteRecord = await Wasting.create({
        materialId,
        materialName: material.name,
        category: material.category,
        quantity: numericWasteQuantity,
        unit,
        costPerBaseUnit: material.costPerUnit || 0,
        totalCost: numericWasteQuantity * (material.costPerUnit || 0),
        wasteReason,
        wasteDate: wasteDate ? new Date(wasteDate) : new Date(),
        notes: notes || `Waste recorded: ${wasteReason} - ${numericWasteQuantity} ${unit}`
      });

      res.status(201).json({
        message: `Successfully recorded waste of ${numericWasteQuantity} ${unit} for ${material.name}`,
        wasteRecord,
        updatedEntries,
        reason: wasteReason
      });
    } catch (error) {
      console.error("Error recording waste:", error);
      next(error);
    }
  }
};

export default stockEntriesController;

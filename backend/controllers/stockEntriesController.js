import { Material, StockEntry } from "../models/index.js";
import sequelize from "../config/database.js";
import { Op } from "sequelize";

const stockEntriesController = {
  // Get all stock entries
  getAllStockEntries: async (req, res, next) => {
    try {
      console.log("=== FETCHING ALL STOCK ENTRIES WITH CACHE BUSTING ===");

      // Force fresh query with raw SQL to bypass any caching
      const rawStockEntries = await sequelize.query(
        `
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
      `,
        {
          type: sequelize.QueryTypes.SELECT,
          nest: true
        }
      );

      console.log(`Found ${rawStockEntries.length} stock entries via raw query`);

      // Log sample entry to verify fresh data and identify negative stock entries
      if (rawStockEntries.length > 0) {
        const sampleEntry = rawStockEntries.find(entry => entry.id === 28) || rawStockEntries[0];
        console.log("Sample FRESH stock entry data:", {
          id: sampleEntry.id,
          materialId: sampleEntry.materialId,
          materialName: sampleEntry.material?.name,
          purchasedQuantity: sampleEntry.purchasedQuantity,
          purchasedUnit: sampleEntry.purchasedUnit,
          purchasedIndividualQuantity: sampleEntry.purchasedIndividualQuantity,
          purchasedIndividualUnit: sampleEntry.purchasedIndividualUnit,
          updatedAt: sampleEntry.updatedAt
        });

        // Count and log negative stock entries
        const negativeStockEntries = rawStockEntries.filter(entry => entry.purchasedIndividualQuantity < 0 || entry.purchasedQuantity < 0);

        if (negativeStockEntries.length > 0) {
          console.log(`\n=== NEGATIVE STOCK ENTRIES DETECTED ===`);
          console.log(`Found ${negativeStockEntries.length} entries with negative quantities:`);
          negativeStockEntries.forEach(entry => {
            console.log(`- ${entry.material?.name || "Unknown"} (ID: ${entry.id}): ${entry.purchasedIndividualQuantity} ${entry.purchasedIndividualUnit}`);
          });
          console.log(`=== END NEGATIVE STOCK SUMMARY ===\n`);
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
  },

  // Add quantity to a specific stock entry
  addToSpecificEntry: async (req, res, next) => {
    try {
      const { id } = req.params;
      const { additionalQuantity, unit, additionDate, notes } = req.body;

      // Validation
      if (!additionalQuantity || !unit) {
        return res.status(400).json({ error: "Missing required fields: additionalQuantity, unit" });
      }

      const numericAdditionalQuantity = parseFloat(additionalQuantity);
      if (isNaN(numericAdditionalQuantity) || numericAdditionalQuantity <= 0) {
        return res.status(400).json({ error: "Additional quantity must be a positive number" });
      }

      // Get the specific stock entry
      const stockEntry = await StockEntry.findByPk(id, {
        include: { model: Material, as: "material" }
      });

      if (!stockEntry) {
        return res.status(404).json({ error: "Stock entry not found" });
      }

      const material = stockEntry.material;

      // CRITICAL FIX: Convert additional quantity to the same unit as the original purchased quantity
      let additionalInOriginalUnit = numericAdditionalQuantity;

      if (stockEntry.purchasedUnit !== unit) {
        if (material.unitType === "mass") {
          const massConversions = { kg: 1000, g: 1, lb: 453.592, oz: 28.3495 };
          const originalUnitFactor = massConversions[stockEntry.purchasedUnit.toLowerCase()];
          const additionalUnitFactor = massConversions[unit.toLowerCase()];

          if (originalUnitFactor && additionalUnitFactor) {
            // Convert additional quantity to original unit
            // Example: 20g to kg = 20 * (1/1000) = 0.02kg
            additionalInOriginalUnit = numericAdditionalQuantity * (additionalUnitFactor / originalUnitFactor);
          } else {
            return res.status(400).json({
              error: `Cannot convert between units: ${unit} and ${stockEntry.purchasedUnit}`
            });
          }
        } else if (material.unitType === "package") {
          // For package units, ensure both units are compatible
          if (unit !== stockEntry.purchasedUnit) {
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

      // Add the converted additional quantity to existing purchased quantity
      const newPurchasedQuantity = parseFloat(stockEntry.purchasedQuantity) + additionalInOriginalUnit;

      // Calculate new individual quantities based on material type
      let newIndividualQuantity;
      let newIndividualUnit;

      if (material.unitType === "package" && material.packageQuantity && material.packageQuantity > 0) {
        // For package units: add proportionally to individual quantity
        const additionalIndividualQuantity = Math.round(additionalInOriginalUnit * material.packageQuantity);
        newIndividualQuantity = (stockEntry.purchasedIndividualQuantity || 0) + additionalIndividualQuantity;
        newIndividualUnit = material.baseUnit;
      } else if (material.unitType === "mass") {
        // For mass units: add the additional quantity directly to existing individual quantity
        if (unit === material.baseUnit) {
          // Adding in base unit (e.g., adding grams to grams)
          newIndividualQuantity = (stockEntry.purchasedIndividualQuantity || 0) + numericAdditionalQuantity;
        } else {
          // Convert additional quantity to base unit and add
          const massConversions = { kg: 1000, g: 1, lb: 453.592, oz: 28.3495 };
          const additionalUnitFactor = massConversions[unit.toLowerCase()] || 1;
          const additionalInBaseUnit = Math.round(numericAdditionalQuantity * additionalUnitFactor);
          newIndividualQuantity = (stockEntry.purchasedIndividualQuantity || 0) + additionalInBaseUnit;
        }
        newIndividualUnit = material.baseUnit; // Should be 'g' for mass
      } else {
        // For other units: add directly
        newIndividualQuantity = Math.round((stockEntry.purchasedIndividualQuantity || 0) + numericAdditionalQuantity);
        newIndividualUnit = stockEntry.purchasedIndividualUnit || stockEntry.purchasedUnit;
      }

      // Recalculate total cost (using existing cost per unit)
      const newTotalCost = newPurchasedQuantity * stockEntry.costPerPurchasedUnit;

      // Update converted quantities for mass units
      let newPurchasedConvertedQuantity = newPurchasedQuantity;
      let newPurchasedConvertedUnit = stockEntry.purchasedUnit;

      if (material.unitType === "mass") {
        // For mass units, convert to base unit (grams) for converted quantities
        const massConversions = { kg: 1000, g: 1, lb: 453.592, oz: 28.3495 };
        const conversionFactor = massConversions[stockEntry.purchasedUnit.toLowerCase()] || 1;
        newPurchasedConvertedQuantity = Math.round(newPurchasedQuantity * conversionFactor);
        newPurchasedConvertedUnit = material.baseUnit; // Should be 'g'
      } else if (material.unitType === "package") {
        // For package materials, keep purchased quantities as-is
        newPurchasedConvertedQuantity = newPurchasedQuantity;
        newPurchasedConvertedUnit = stockEntry.purchasedUnit;
      }

      // Update the stock entry
      await stockEntry.update({
        purchasedQuantity: newPurchasedQuantity,
        purchasedIndividualQuantity: newIndividualQuantity,
        purchasedIndividualUnit: newIndividualUnit,
        purchasedConvertedQuantity: newPurchasedConvertedQuantity,
        purchasedConvertedUnit: newPurchasedConvertedUnit,
        totalCost: newTotalCost,
        updatedAt: new Date(),
        notes: notes ? `${stockEntry.notes || ""}\n[${new Date().toLocaleDateString()}] Added ${numericAdditionalQuantity} ${unit}. ${notes}`.trim() : stockEntry.notes
      });

      // Reload the updated entry
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

  // Record waste from a specific stock entry
  wasteFromSpecificEntry: async (req, res, next) => {
    try {
      const { id } = req.params;
      const { wasteQuantity, unit, wasteReason, wasteDate, notes } = req.body;

      // Validation
      if (!wasteQuantity || !unit || !wasteReason) {
        return res.status(400).json({ error: "Missing required fields: wasteQuantity, unit, wasteReason" });
      }

      const numericWasteQuantity = parseFloat(wasteQuantity);
      if (isNaN(numericWasteQuantity) || numericWasteQuantity <= 0) {
        return res.status(400).json({ error: "Waste quantity must be a positive number" });
      }

      // Get the specific stock entry
      const stockEntry = await StockEntry.findByPk(id, {
        include: { model: Material, as: "material" }
      });

      if (!stockEntry) {
        return res.status(404).json({ error: "Stock entry not found" });
      }

      const material = stockEntry.material;

      // CRITICAL FIX: Convert waste quantity to the same unit as the original purchased quantity
      let wasteInOriginalUnit = numericWasteQuantity;

      if (stockEntry.purchasedUnit !== unit) {
        if (material.unitType === "mass") {
          const massConversions = { kg: 1000, g: 1, lb: 453.592, oz: 28.3495 };
          const originalUnitFactor = massConversions[stockEntry.purchasedUnit.toLowerCase()];
          const wasteUnitFactor = massConversions[unit.toLowerCase()];

          if (originalUnitFactor && wasteUnitFactor) {
            // Convert waste quantity to original unit
            // Example: 5g to kg = 5 * (1/1000) = 0.005kg
            wasteInOriginalUnit = numericWasteQuantity * (wasteUnitFactor / originalUnitFactor);
          } else {
            return res.status(400).json({
              error: `Cannot convert between units: ${unit} and ${stockEntry.purchasedUnit}`
            });
          }
        } else if (material.unitType === "package") {
          // For package units, ensure both units are compatible
          if (unit !== stockEntry.purchasedUnit) {
            return res.status(400).json({
              error: `Package unit mismatch: cannot waste ${unit} from ${stockEntry.purchasedUnit}`
            });
          }
        } else {
          return res.status(400).json({
            error: `Unit mismatch: cannot waste ${unit} from ${stockEntry.purchasedUnit}`
          });
        }
      }

      // Check if there's enough stock in this specific entry (now comparing same units)
      if (wasteInOriginalUnit > stockEntry.purchasedQuantity) {
        return res.status(400).json({
          error: `Insufficient stock in this entry. Available: ${stockEntry.purchasedQuantity} ${stockEntry.purchasedUnit}, Requested: ${wasteInOriginalUnit.toFixed(3)} ${stockEntry.purchasedUnit}`
        });
      }

      // Subtract the converted waste quantity from existing purchased quantity
      const newPurchasedQuantity = Math.max(0, parseFloat(stockEntry.purchasedQuantity) - wasteInOriginalUnit);

      // Calculate new individual quantities based on material type (SUBTRACTIVE LOGIC)
      let newIndividualQuantity;
      let newIndividualUnit;

      if (material.unitType === "package" && material.packageQuantity && material.packageQuantity > 0) {
        // For package units: subtract proportionally from individual quantity
        const wasteIndividualQuantity = Math.round(wasteInOriginalUnit * material.packageQuantity);
        newIndividualQuantity = Math.max(0, (stockEntry.purchasedIndividualQuantity || 0) - wasteIndividualQuantity);
        newIndividualUnit = material.baseUnit;
      } else if (material.unitType === "mass") {
        // For mass units: subtract the waste quantity directly from existing individual quantity
        if (unit === material.baseUnit) {
          // Wasting in base unit (e.g., wasting grams from grams)
          newIndividualQuantity = Math.max(0, (stockEntry.purchasedIndividualQuantity || 0) - numericWasteQuantity);
        } else {
          // Convert waste quantity to base unit and subtract
          const massConversions = { kg: 1000, g: 1, lb: 453.592, oz: 28.3495 };
          const wasteUnitFactor = massConversions[unit.toLowerCase()] || 1;
          const wasteInBaseUnit = Math.round(numericWasteQuantity * wasteUnitFactor);
          newIndividualQuantity = Math.max(0, (stockEntry.purchasedIndividualQuantity || 0) - wasteInBaseUnit);
        }
        newIndividualUnit = material.baseUnit; // Should be 'g' for mass
      } else {
        // For other units: subtract directly
        newIndividualQuantity = Math.max(0, (stockEntry.purchasedIndividualQuantity || 0) - numericWasteQuantity);
        newIndividualUnit = stockEntry.purchasedIndividualUnit || stockEntry.purchasedUnit;
      }

      // Recalculate total cost (proportionally reduced)
      const costReduction = wasteInOriginalUnit * stockEntry.costPerPurchasedUnit;
      const newTotalCost = Math.max(0, stockEntry.totalCost - costReduction);

      // Update converted quantities for mass units
      let newPurchasedConvertedQuantity = newPurchasedQuantity;
      let newPurchasedConvertedUnit = stockEntry.purchasedUnit;

      if (material.unitType === "mass") {
        // For mass units, convert to base unit (grams) for converted quantities
        const massConversions = { kg: 1000, g: 1, lb: 453.592, oz: 28.3495 };
        const conversionFactor = massConversions[stockEntry.purchasedUnit.toLowerCase()] || 1;
        newPurchasedConvertedQuantity = Math.round(newPurchasedQuantity * conversionFactor);
        newPurchasedConvertedUnit = material.baseUnit; // Should be 'g'
      } else if (material.unitType === "package") {
        // For package materials, keep purchased quantities as-is
        newPurchasedConvertedQuantity = newPurchasedQuantity;
        newPurchasedConvertedUnit = stockEntry.purchasedUnit;
      }

      await stockEntry.update({
        purchasedQuantity: newPurchasedQuantity,
        purchasedIndividualQuantity: newIndividualQuantity,
        purchasedIndividualUnit: newIndividualUnit,
        purchasedConvertedQuantity: newPurchasedConvertedQuantity,
        purchasedConvertedUnit: newPurchasedConvertedUnit,
        totalCost: newTotalCost,
        updatedAt: new Date(),
        notes: notes ? `${stockEntry.notes || ""}\n[${new Date().toLocaleDateString()}] Waste: ${numericWasteQuantity} ${unit} (${wasteReason}). ${notes}`.trim() : stockEntry.notes
      });

      // Reload the updated entry
      const updatedEntry = await StockEntry.findByPk(id, {
        include: { model: Material, as: "material" }
      });

      res.status(200).json({
        message: `Successfully recorded waste of ${numericWasteQuantity} ${unit} from existing stock entry`,
        stockEntry: updatedEntry,
        wastedQuantity: numericWasteQuantity,
        wastedUnit: unit,
        reason: wasteReason
      });
    } catch (error) {
      console.error("Error recording waste from specific stock entry:", error);
      next(error);
    }
  },

  // Add stock to existing inventory
  addToStock: async (req, res, next) => {
    try {
      const { materialId, additionalQuantity, unit, additionDate, notes } = req.body;

      // Validation
      if (!materialId || !additionalQuantity || !unit) {
        return res.status(400).json({ error: "Missing required fields: materialId, additionalQuantity, unit" });
      }

      const numericAdditionalQuantity = parseFloat(additionalQuantity);
      if (isNaN(numericAdditionalQuantity) || numericAdditionalQuantity <= 0) {
        return res.status(400).json({ error: "Additional quantity must be a positive number" });
      }

      // Get material information
      const material = await Material.findByPk(materialId);
      if (!material) {
        return res.status(404).json({ error: "Material not found" });
      }

      // Find the most recent stock entry for this material to get cost information
      const mostRecentEntry = await StockEntry.findOne({
        where: { materialId },
        order: [["createdAt", "DESC"]],
        include: { model: Material, as: "material" }
      });

      // Calculate individual quantities based on material type
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

      // Create a new stock entry for the addition (using default cost from material or recent entry)
      const defaultCostPerUnit = mostRecentEntry?.costPerPurchasedUnit || material.costPerBaseUnit || material.costPerUnit || 0;
      const totalAdditionCost = numericAdditionalQuantity * defaultCostPerUnit;

      const additionEntry = await StockEntry.create({
        materialId,
        supplier: `Stock Addition - ${new Date().toLocaleDateString()}`,
        purchasedQuantity: numericAdditionalQuantity,
        purchasedUnit: unit,
        purchasedIndividualQuantity: additionalIndividualQuantity,
        purchasedIndividualUnit: additionalIndividualUnit,
        costPerPurchasedUnit: defaultCostPerUnit,
        totalCost: totalAdditionCost,
        purchaseDate: additionDate ? new Date(additionDate) : new Date(),
        notes: notes || `Added ${numericAdditionalQuantity} ${unit} to existing stock`
      });

      // Return the created entry with material information
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

  // Record waste (reduce stock)
  recordWaste: async (req, res, next) => {
    try {
      const { materialId, wasteQuantity, unit, wasteReason, wasteDate, notes } = req.body;

      // Validation
      if (!materialId || !wasteQuantity || !unit || !wasteReason) {
        return res.status(400).json({ error: "Missing required fields: materialId, wasteQuantity, unit, wasteReason" });
      }

      const numericWasteQuantity = parseFloat(wasteQuantity);
      if (isNaN(numericWasteQuantity) || numericWasteQuantity <= 0) {
        return res.status(400).json({ error: "Waste quantity must be a positive number" });
      }

      // Get material information
      const material = await Material.findByPk(materialId);
      if (!material) {
        return res.status(404).json({ error: "Material not found" });
      }

      // Calculate individual waste quantities
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

      // Get all stock entries for this material ordered by creation date (FIFO approach)
      const stockEntries = await StockEntry.findAll({
        where: {
          materialId,
          purchasedIndividualQuantity: { [Op.gt]: 0 } // Only entries with remaining quantity
        },
        order: [["createdAt", "ASC"]], // FIFO - oldest first
        include: { model: Material, as: "material" }
      });

      if (stockEntries.length === 0) {
        return res.status(400).json({ error: "No stock available for this material" });
      }

      // Calculate total available stock in individual units
      const totalAvailableIndividualQuantity = stockEntries.reduce((sum, entry) => sum + entry.purchasedIndividualQuantity, 0);

      if (wasteIndividualQuantity > totalAvailableIndividualQuantity) {
        return res.status(400).json({
          error: `Insufficient stock. Available: ${totalAvailableIndividualQuantity} ${wasteIndividualUnit}, Requested: ${wasteIndividualQuantity} ${wasteIndividualUnit}`
        });
      }

      // Reduce stock using FIFO approach
      let remainingWasteQuantity = wasteIndividualQuantity;
      const updatedEntries = [];
      const wasteEntries = [];

      for (const entry of stockEntries) {
        if (remainingWasteQuantity <= 0) break;

        const entryAvailableQuantity = entry.purchasedIndividualQuantity;
        const quantityToReduce = Math.min(remainingWasteQuantity, entryAvailableQuantity);

        // Update the stock entry
        const newIndividualQuantity = entryAvailableQuantity - quantityToReduce;

        // Calculate new purchased quantity (reverse conversion)
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

        await entry.update({
          purchasedQuantity: newPurchasedQuantity,
          purchasedIndividualQuantity: newIndividualQuantity
        });

        updatedEntries.push({
          id: entry.id,
          originalQuantity: entryAvailableQuantity,
          reducedBy: quantityToReduce,
          newQuantity: newIndividualQuantity
        });

        remainingWasteQuantity -= quantityToReduce;
      }

      // Create a waste record (negative entry for tracking)
      const wasteRecord = await StockEntry.create({
        materialId,
        supplier: `Waste Record - ${wasteReason}`,
        purchasedQuantity: -numericWasteQuantity, 
        purchasedUnit: unit,
        purchasedIndividualQuantity: -wasteIndividualQuantity,
        purchasedIndividualUnit: wasteIndividualUnit,
        costPerPurchasedUnit: 0,
        totalCost: 0,
        purchaseDate: wasteDate ? new Date(wasteDate) : new Date(),
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
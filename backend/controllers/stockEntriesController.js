import { Op } from "sequelize";
import { Material, StockEntry, Wasting, Printer, Category } from "../models/index.js";
import { StockEntryAuditHelperSimple } from "../decorators/stockEntryAuditDecoratorSimple.js";
import { parsePaginationParams, buildPaginationResponse, buildFilterConditions, parseFieldSelection } from "../utils/paginationHelpers.js";
import { getMaterialCategories } from "../utils/categoryHelpers.js";
import { convertVolume, convertToMl, isValidBeverageUnit, getMaterialVolumePerUnit, getMaterialVolumeUnit } from "../utils/volumeConversionUtils.js";

const stockEntriesController = {
  getAllStockEntries: async (req, res, next) => {
    try {
      const { includeMaterial = "true", fields = "" } = req.query;
      const paginationParams = parsePaginationParams(req.query, {
        defaultLimit: 10000,
        maxLimit: 50000,
        allowedSortFields: ["id", "supplier", "purchaseDate", "expiryDate", "totalCost", "createdAt", "updatedAt"]
      });
      const whereClause = buildFilterConditions(
        req.query,
        {
          searchFields: ["supplier"],
          exactFilters: ["materialId", "isPOSItem"],
          rangeFilters: ["purchaseDate", "expiryDate", "totalCost", "createdAt"]
        },
        Op
      );

      const selectedFields = parseFieldSelection(fields, [
        "id",
        "materialId",
        "supplier",
        "purchasedQuantity",
        "purchasedUnit",
        "purchasedIndividualQuantity",
        "purchasedIndividualUnit",
        "costPerPurchasedUnit",
        "costPerBaseUnit",
        "totalCost",
        "purchaseDate",
        "expiryDate",
        "isPOSItem",
        "printerId",
        "notes",
        "volumePerUnit",
        "volumeUnit",
        "totalVolume",
        "costPerVolumeUnit",
        "massPerUnit",
        "massUnit",
        "totalMass",
        "costPerMassUnit",
        "piecesPerPackage",
        "totalPieces",
        "costPerPiece",
        "unitDescription",
        "createdAt",
        "updatedAt"
      ]);
      const queryOptions = {
        where: whereClause,
        order: [[paginationParams.sortBy, paginationParams.sortOrder]],
        limit: paginationParams.limit,
        offset: paginationParams.offset,
        distinct: true,
        attributes: selectedFields
      };
      if (includeMaterial === "true") {
        queryOptions.include = [
          {
            model: Material,
            as: "material",
            attributes: ["id", "name", "baseUnit", "unitType", "inputUnit", "packageQuantity", "categoryId", "volumePerUnit", "volumeUnit", "massPerUnit", "massUnit", "piecesPerPackage", "unitDescription"],
            include: [
              {
                model: Category,
                as: "category",
                attributes: ["id", "name", "value", "categoryTypeIds"]
              }
            ]
          }
        ];
      }

      const { count, rows: stockEntries } = await StockEntry.findAndCountAll(queryOptions);
      if (stockEntries.length > 0) {
        const negativeStockEntries = stockEntries.filter(entry => entry.purchasedIndividualQuantity < 0 || entry.purchasedQuantity < 0);
        if (negativeStockEntries.length > 0) {
          console.warn("Negative stock entries found:", negativeStockEntries.length);
        }
      }

      const pagination = buildPaginationResponse(count, paginationParams.page, paginationParams.limit);

      res.status(200).json({
        data: stockEntries,
        pagination,
        filters: {
          search: req.query.search || "",
          materialId: req.query.materialId || "",
          isPOSItem: req.query.isPOSItem || "",
          purchaseDate_from: req.query.purchaseDate_from || "",
          purchaseDate_to: req.query.purchaseDate_to || "",
          expiryDate_from: req.query.expiryDate_from || "",
          expiryDate_to: req.query.expiryDate_to || "",
          totalCost_from: req.query.totalCost_from || "",
          totalCost_to: req.query.totalCost_to || "",
          sortBy: paginationParams.sortBy,
          sortOrder: paginationParams.sortOrder,
          includeMaterial,
          fields
        },
        meta: {
          requestTime: new Date().toISOString(),
          totalDataSize: stockEntries.length,
          negativeEntriesCount: stockEntries.filter(entry => entry.purchasedIndividualQuantity < 0 || entry.purchasedQuantity < 0).length
        }
      });
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
      const { materialId, supplier, purchasedQuantity, purchasedUnit, costPerPurchasedUnit, totalCost, costPerBaseUnit, purchaseDate, expiryDate, isPOSItem } = req.body;
      if (!materialId || !supplier || !purchasedQuantity || !purchasedUnit || !totalCost || !purchaseDate) {
        return res.status(400).json({ error: "Missing required fields" });
      }
      const numericPurchasedQuantity = parseFloat(purchasedQuantity);
      const numericCostPerPurchasedUnit = parseFloat(costPerPurchasedUnit);
      const numericTotalCost = parseFloat(totalCost);
      const numericCostPerBaseUnit = costPerBaseUnit ? parseFloat(costPerBaseUnit) : undefined;
      if (isNaN(numericPurchasedQuantity) || numericPurchasedQuantity <= 0 || numericTotalCost < 0) {
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
        // Check if purchasing by inputUnit (box/pack) or baseUnit (bottle/piece)
        if (purchasedUnit === material.inputUnit) {
          // Purchasing by boxes/packs - multiply by packageQuantity
          purchasedIndividualQuantity = Math.round(numericPurchasedQuantity * material.packageQuantity);
          purchasedIndividualUnit = material.baseUnit;
        } else if (purchasedUnit === material.baseUnit) {
          // Purchasing by individual units (bottles/pieces) - keep as is
          purchasedIndividualQuantity = numericPurchasedQuantity;
          purchasedIndividualUnit = material.baseUnit;
        } else {
          // Default behavior for other units - multiply by packageQuantity
          purchasedIndividualQuantity = Math.round(numericPurchasedQuantity * material.packageQuantity);
          purchasedIndividualUnit = material.baseUnit;
        }
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
      } else if (material.unitType === "volume") {
        try {
          // Use the comprehensive volume conversion system
          const materialVolumeUnit = getMaterialVolumeUnit(material);

          // Check if it's a valid beverage unit
          if (isValidBeverageUnit(purchasedUnit)) {
            // Convert to material's base volume unit
            const convertedVolume = convertVolume(numericPurchasedQuantity, purchasedUnit, materialVolumeUnit, material);
            purchasedIndividualQuantity = Math.round(convertedVolume * 1000) / 1000; // Round to 3 decimal places
            purchasedIndividualUnit = materialVolumeUnit;

            console.log(`🔄 [createStockEntries] Volume conversion for ${material.name}: ${numericPurchasedQuantity} ${purchasedUnit} → ${purchasedIndividualQuantity} ${purchasedIndividualUnit}`);
          } else {
            // Fallback to legacy conversion for non-standard units
            const volumeConversions = {
              l: 1000,
              ml: 1,
              cl: 10,
              dl: 100,
              gallon: 3785.41,
              qt: 946.353,
              pt: 473.176
            };
            const conversionFactor = volumeConversions[purchasedUnit.toLowerCase()];
            if (conversionFactor) {
              purchasedIndividualQuantity = Math.round(numericPurchasedQuantity * conversionFactor);
              purchasedIndividualUnit = material.baseUnit;
            } else {
              console.warn(`Unknown volume unit: ${purchasedUnit} for material: ${material.name}`);
              purchasedIndividualQuantity = numericPurchasedQuantity;
              purchasedIndividualUnit = purchasedUnit;
            }
          }
        } catch (conversionError) {
          console.error(`❌ [createStockEntries] Volume conversion failed for ${material.name}:`, conversionError);
          // Fallback to original logic
          purchasedIndividualQuantity = numericPurchasedQuantity;
          purchasedIndividualUnit = purchasedUnit;
        }
      }

      const finalCostPerPurchasedUnit = numericCostPerPurchasedUnit || 0;

      const finalCostPerBaseUnit = numericCostPerBaseUnit !== undefined ? numericCostPerBaseUnit : purchasedIndividualQuantity > 0 ? parseFloat((numericTotalCost / purchasedIndividualQuantity).toFixed(6)) : 0;

      console.log(`📊 [createStockEntries] Using frontend values for ${material.name}:`, {
        purchasedQuantity: numericPurchasedQuantity,
        costPerPurchasedUnit: numericCostPerPurchasedUnit,
        purchasedUnit,
        totalCost: numericTotalCost,
        frontendCostPerPurchasedUnit: numericCostPerPurchasedUnit,
        finalCostPerPurchasedUnit,
        purchasedIndividualQuantity,
        finalCostPerBaseUnit
      });

      const stockEntry = await StockEntry.create({
        materialId,
        supplier,
        purchasedQuantity: numericPurchasedQuantity,
        purchasedUnit,
        purchasedIndividualQuantity,
        purchasedIndividualUnit,
        // CRITICAL FIX: Ensure converted quantities are properly synchronized
        purchasedConvertedQuantity: material.unitType === "mass" ? purchasedIndividualQuantity : material.unitType === "package" ? numericPurchasedQuantity : purchasedIndividualQuantity,
        purchasedConvertedUnit: material.unitType === "mass" ? material.baseUnit : material.unitType === "package" ? purchasedUnit : purchasedIndividualUnit,
        costPerPurchasedUnit: finalCostPerPurchasedUnit,
        costPerBaseUnit: finalCostPerBaseUnit,
        totalCost: numericTotalCost,
        purchaseDate,
        expiryDate,
        isPOSItem: isPOSItem !== undefined ? isPOSItem : false
      });
      const createdStockEntry = await StockEntry.findByPk(stockEntry.id, {
        include: { model: Material, as: "material" }
      });
      try {
        const user = req.user || { id: null, fullName: "System", username: "system" };
        await StockEntryAuditHelperSimple.logStockCreation(createdStockEntry.toJSON(), user, req, {
          operationType: "stock_creation",
          supplier: createdStockEntry.supplier,
          totalCost: createdStockEntry.totalCost,
          purchasedQuantity: createdStockEntry.purchasedQuantity,
          purchasedUnit: createdStockEntry.purchasedUnit
        });
        console.log(`✅ Stock entry creation logged for material ${createdStockEntry.material?.name} (ID: ${createdStockEntry.id})`);
      } catch (loggingError) {
        console.error("❌ Failed to log stock entry creation:", loggingError);
      }
      res.status(201).json(createdStockEntry);
    } catch (error) {
      console.error("Error creating stock entry:", error);
      next(error);
    }
  },

  updateStockEntries: async (req, res, next) => {
    try {
      const { id } = req.params;
      const { materialId, supplier, purchasedQuantity, purchasedUnit, costPerPurchasedUnit, totalCost, costPerBaseUnit, purchaseDate, expiryDate, isPOSItem } = req.body;
      const numericPurchasedQuantity = purchasedQuantity ? parseFloat(purchasedQuantity) : undefined;
      const numericCostPerPurchasedUnit = costPerPurchasedUnit ? parseFloat(costPerPurchasedUnit) : undefined;
      const numericTotalCost = totalCost ? parseFloat(totalCost) : undefined;
      const numericCostPerBaseUnit = costPerBaseUnit ? parseFloat(costPerBaseUnit) : undefined;
      const stockEntry = await StockEntry.findByPk(id);
      if (!stockEntry) {
        return res.status(404).json({ error: "Stock entry not found" });
      }
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
      // Recalculate costPerPurchasedUnit if totalCost or purchasedQuantity changed
      let finalCostPerPurchasedUnit;
      let finalTotalCost;

      if (numericTotalCost !== undefined && numericPurchasedQuantity !== undefined) {
        // Both totalCost and quantity provided - calculate costPerPurchasedUnit
        finalTotalCost = numericTotalCost;
        finalCostPerPurchasedUnit = finalPurchasedQuantity > 0 ? parseFloat((numericTotalCost / finalPurchasedQuantity).toFixed(6)) : 0;
      } else if (numericCostPerPurchasedUnit !== undefined && numericPurchasedQuantity !== undefined) {
        // CostPerUnit and quantity provided - calculate totalCost
        finalCostPerPurchasedUnit = numericCostPerPurchasedUnit;
        finalTotalCost = parseFloat((numericCostPerPurchasedUnit * finalPurchasedQuantity).toFixed(6));
      } else if (numericTotalCost !== undefined) {
        // Only totalCost provided - recalculate costPerPurchasedUnit
        finalTotalCost = numericTotalCost;
        finalCostPerPurchasedUnit = finalPurchasedQuantity > 0 ? parseFloat((numericTotalCost / finalPurchasedQuantity).toFixed(6)) : 0;
      } else if (numericCostPerPurchasedUnit !== undefined) {
        // Only costPerUnit provided - recalculate totalCost
        finalCostPerPurchasedUnit = numericCostPerPurchasedUnit;
        finalTotalCost = parseFloat((numericCostPerPurchasedUnit * finalPurchasedQuantity).toFixed(6));
      } else {
        // No cost changes - keep existing values
        finalCostPerPurchasedUnit = stockEntry.costPerPurchasedUnit;
        finalTotalCost = stockEntry.totalCost;
      }
      let updatedIndividualQuantity = stockEntry.purchasedIndividualQuantity;
      let updatedIndividualUnit = stockEntry.purchasedIndividualUnit;
      if (material.unitType === "package" && material.packageQuantity && material.packageQuantity > 0) {
        if (finalPurchasedUnit === material.inputUnit) {
          updatedIndividualQuantity = Math.round(finalPurchasedQuantity * material.packageQuantity);
          updatedIndividualUnit = material.baseUnit;
        } else if (finalPurchasedUnit === material.baseUnit) {
          updatedIndividualQuantity = finalPurchasedQuantity;
          updatedIndividualUnit = material.baseUnit;
        } else {
          updatedIndividualQuantity = Math.round(finalPurchasedQuantity * material.packageQuantity);
          updatedIndividualUnit = material.baseUnit;
        }
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
      } else if (material.unitType === "volume") {
        try {
          // Use the comprehensive volume conversion system
          const materialVolumeUnit = getMaterialVolumeUnit(material);

          // Check if it's a valid beverage unit
          if (isValidBeverageUnit(finalPurchasedUnit)) {
            // Convert to material's base volume unit
            const convertedVolume = convertVolume(finalPurchasedQuantity, finalPurchasedUnit, materialVolumeUnit, material);
            updatedIndividualQuantity = Math.round(convertedVolume * 1000) / 1000; // Round to 3 decimal places
            updatedIndividualUnit = materialVolumeUnit;

            console.log(`🔄 [updateStockEntries] Volume conversion for ${material.name}: ${finalPurchasedQuantity} ${finalPurchasedUnit} → ${updatedIndividualQuantity} ${updatedIndividualUnit}`);
          } else {
            // Fallback to legacy conversion for non-standard units
            const volumeConversions = {
              l: 1000,
              ml: 1,
              cl: 10,
              dl: 100,
              gallon: 3785.41,
              qt: 946.353,
              pt: 473.176
            };
            const conversionFactor = volumeConversions[finalPurchasedUnit.toLowerCase()];
            if (conversionFactor) {
              updatedIndividualQuantity = Math.round(finalPurchasedQuantity * conversionFactor);
              updatedIndividualUnit = material.baseUnit;
            }
          }
        } catch (conversionError) {
          console.error(`❌ [updateStockEntries] Volume conversion failed for ${material.name}:`, conversionError);
          // Keep original values on conversion failure
          updatedIndividualQuantity = Math.round(finalPurchasedQuantity);
          updatedIndividualUnit = finalPurchasedUnit;
        }
      } else {
        updatedIndividualQuantity = Math.round(finalPurchasedQuantity);
        updatedIndividualUnit = finalPurchasedUnit;
      }

      const finalCostPerBaseUnit = numericCostPerBaseUnit !== undefined ? numericCostPerBaseUnit : updatedIndividualQuantity > 0 ? parseFloat((finalTotalCost / updatedIndividualQuantity).toFixed(6)) : 0;

      console.log(`📊 [updateStockEntries] Cost calculations for ${material.name}:`, {
        originalPurchasedQuantity: stockEntry.purchasedQuantity,
        finalPurchasedQuantity,
        finalPurchasedUnit,
        originalTotalCost: stockEntry.totalCost,
        finalTotalCost,
        originalCostPerPurchasedUnit: stockEntry.costPerPurchasedUnit,
        finalCostPerPurchasedUnit,
        updatedIndividualQuantity,
        finalCostPerBaseUnit
      });

      await stockEntry.update({
        materialId: materialId ?? stockEntry.materialId,
        supplier: supplier ?? stockEntry.supplier,
        purchasedQuantity: finalPurchasedQuantity,
        purchasedUnit: finalPurchasedUnit,
        purchasedIndividualQuantity: updatedIndividualQuantity,
        purchasedIndividualUnit: updatedIndividualUnit,
        // CRITICAL FIX: Ensure converted quantities are properly synchronized
        purchasedConvertedQuantity: material.unitType === "mass" ? updatedIndividualQuantity : material.unitType === "package" ? finalPurchasedQuantity : updatedIndividualQuantity,
        purchasedConvertedUnit: material.unitType === "mass" ? material.baseUnit : material.unitType === "package" ? finalPurchasedUnit : updatedIndividualUnit,
        costPerPurchasedUnit: finalCostPerPurchasedUnit,
        costPerBaseUnit: finalCostPerBaseUnit,
        totalCost: finalTotalCost,
        purchaseDate: purchaseDate ?? stockEntry.purchaseDate,
        expiryDate: expiryDate ?? stockEntry.expiryDate,
        isPOSItem: isPOSItem !== undefined ? isPOSItem : stockEntry.isPOSItem
      });
      const updatedStockEntry = await StockEntry.findByPk(id, {
        include: { model: Material, as: "material" }
      });
      try {
        const user = req.user || { id: null, fullName: "System", username: "system" };
        await StockEntryAuditHelperSimple.logStockEdit(originalStockEntry, updatedStockEntry.toJSON(), user, req, {
          operationType: "stock_edit",
          supplier: updatedStockEntry.supplier,
          totalCost: updatedStockEntry.totalCost,
          purchasedQuantity: updatedStockEntry.purchasedQuantity,
          purchasedUnit: updatedStockEntry.purchasedUnit
        });
        console.log(`✅ Stock entry update logged for material ${updatedStockEntry.material?.name} (ID: ${updatedStockEntry.id})`);
      } catch (loggingError) {
        console.error("❌ Failed to log stock entry update:", loggingError);
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
      const deletedStockEntry = stockEntry.toJSON();

      // Log deletion BEFORE destroying the stock entry to avoid foreign key constraint violation
      try {
        const user = req.user || { id: null, fullName: "System", username: "system" };
        await StockEntryAuditHelperSimple.logStockDeletion(deletedStockEntry, user, "Manual deletion via API", req);
        console.log(`✅ Stock entry deletion logged for material ${deletedStockEntry.material?.name || "Unknown"} (ID: ${deletedStockEntry.id})`);
      } catch (loggingError) {
        console.error("❌ Failed to log stock entry deletion:", loggingError);
      }

      // Now safely destroy the stock entry
      await stockEntry.destroy();
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting stock entry:", error);
      next(error);
    }
  },

  addToSpecificEntry: async (req, res, next) => {
    try {
      const { id } = req.params;
      const { additionalQuantity, unit, additionDate, notes, costPerPurchasedUnit } = req.body;
      console.log(`🔍 [addToSpecificEntry] Request for stock entry ${id}:`, {
        additionalQuantity,
        unit,
        additionDate,
        notes,
        costPerPurchasedUnit,
        body: req.body
      });
      if (!additionalQuantity || !unit) {
        console.log(`❌ [addToSpecificEntry] Missing required fields:`, { additionalQuantity, unit });
        return res.status(400).json({ error: "Missing required fields: additionalQuantity, unit" });
      }
      const numericAdditionalQuantity = parseFloat(additionalQuantity);
      const numericCostPerPurchasedUnit = costPerPurchasedUnit ? parseFloat(costPerPurchasedUnit) : undefined;
      console.log(`🔢 [addToSpecificEntry] Parsed values:`, {
        numericAdditionalQuantity,
        isNaN: isNaN(numericAdditionalQuantity),
        isLessOrEqual: numericAdditionalQuantity <= 0,
        numericCostPerPurchasedUnit
      });
      if (isNaN(numericAdditionalQuantity) || numericAdditionalQuantity <= 0) {
        console.log(`❌ [addToSpecificEntry] Invalid quantity:`, { numericAdditionalQuantity, additionalQuantity });
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
          } else if (unit === "ml" && material.volumePerUnit && material.volumePerUnit > 0) {
            // Handle ml units for bottle-based materials
            console.log(`🔄 [addToSpecificEntry] Converting ${numericAdditionalQuantity} ml to ${stockEntry.purchasedUnit} for ${material.name}`);
            
            // Validate reasonable ml quantities for bottle-based materials
            // Warn if adding less than 5% or more than 200% of a standard bottle
            if (numericAdditionalQuantity < material.volumePerUnit * 0.05) {
              console.warn(`⚠️ [addToSpecificEntry] Very small ml quantity (${numericAdditionalQuantity}ml) being added to ${material.name} - standard bottle is ${material.volumePerUnit}ml`);
            } else if (numericAdditionalQuantity > material.volumePerUnit * 2) {
              console.warn(`⚠️ [addToSpecificEntry] Very large ml quantity (${numericAdditionalQuantity}ml) being added to ${material.name} - standard bottle is ${material.volumePerUnit}ml`);
            }
            
            const { convertVolume } = await import("../utils/volumeConversionUtils.js");
            // Convert ml to bottles/packages using material context
            additionalInOriginalUnit = convertVolume(numericAdditionalQuantity, "ml", stockEntry.purchasedUnit, material);
            console.log(`🔄 [addToSpecificEntry] Conversion result: ${numericAdditionalQuantity} ml = ${additionalInOriginalUnit} ${stockEntry.purchasedUnit}`);
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
        if (unit === "ml" && material.volumePerUnit && material.volumePerUnit > 0) {
          // For ml additions to bottle-based materials, calculate individual pieces
          const bottlesEquivalent = numericAdditionalQuantity / material.volumePerUnit;
          newIndividualQuantity = (stockEntry.purchasedIndividualQuantity || 0) + Math.round(bottlesEquivalent * material.packageQuantity);
          console.log(`🔢 [addToSpecificEntry] Individual calculation: ${numericAdditionalQuantity} ml ÷ ${material.volumePerUnit} ml/bottle × ${material.packageQuantity} pieces/bottle = ${Math.round(bottlesEquivalent * material.packageQuantity)} pieces`);
        } else {
          newIndividualQuantity = (stockEntry.purchasedIndividualQuantity || 0) + (unit === "piece" || unit === "bottle" ? Math.round(numericAdditionalQuantity) : Math.round(numericAdditionalQuantity * material.packageQuantity));
        }
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
      const newTotalCost = parseFloat((newPurchasedQuantity * finalCostPerPurchasedUnit).toFixed(6));
      const newCostPerBaseUnit = newIndividualQuantity > 0 ? parseFloat((newTotalCost / newIndividualQuantity).toFixed(6)) : 0;

      // CRITICAL FIX: Ensure converted quantities are synchronized with individual quantities
      let finalConvertedQuantity, finalConvertedUnit;
      if (material.unitType === "mass") {
        finalConvertedQuantity = newIndividualQuantity;
        finalConvertedUnit = material.baseUnit;
      } else if (material.unitType === "package") {
        finalConvertedQuantity = newPurchasedQuantity;
        finalConvertedUnit = stockEntry.purchasedUnit;
      } else {
        finalConvertedQuantity = newIndividualQuantity;
        finalConvertedUnit = newIndividualUnit;
      }

      // Update calculated total fields (aligned with enhanced stock system)
      let newTotalVolume = parseFloat(stockEntry.totalVolume) || 0;
      let newTotalMass = stockEntry.totalMass || 0;
      let newTotalPieces = stockEntry.totalPieces || 0;
      let newCostPerVolumeUnit = stockEntry.costPerVolumeUnit || 0;
      let newCostPerMassUnit = stockEntry.costPerMassUnit || 0;
      let newCostPerPiece = stockEntry.costPerPiece || 0;
      
      console.log(`🔍 [DEBUG] Initial values: totalVolume=${newTotalVolume}, totalMass=${newTotalMass}, totalPieces=${newTotalPieces}`);
      console.log(`🔍 [DEBUG] Material unitType: ${material.unitType}, unit: ${unit}, additionalQuantity: ${numericAdditionalQuantity}`);

      if (material.unitType === "volume" || (material.unitType === "package" && unit === "ml")) {
        // Add to total volume
        const { convertToMl } = await import("../utils/volumeConversionUtils.js");
        // Pass material context to properly handle bottle units
        const additionalVolumeInMl = convertToMl(numericAdditionalQuantity, unit, material);
        newTotalVolume += additionalVolumeInMl;
        
        console.log(`📊 [addToSpecificEntry] Volume calculation: ${numericAdditionalQuantity} ${unit} = ${additionalVolumeInMl}ml, new total: ${newTotalVolume}ml`);
        console.log(`🔍 [DEBUG] Volume update: ${stockEntry.totalVolume} + ${additionalVolumeInMl} = ${newTotalVolume}`);

        // Recalculate cost per volume unit
        const totalVolumeCost = stockEntry.totalVolume * stockEntry.costPerVolumeUnit + additionalVolumeInMl * finalCostPerPurchasedUnit;
        newCostPerVolumeUnit = newTotalVolume > 0 ? totalVolumeCost / newTotalVolume : 0;
        console.log(`🔍 [DEBUG] Cost calculation: totalVolumeCost=${totalVolumeCost}, newCostPerVolumeUnit=${newCostPerVolumeUnit}`);
      } else if (material.unitType === "mass") {
        // Add to total mass
        const massConversions = { kg: 1000, g: 1, lb: 453.592, oz: 28.3495 };
        const conversionFactor = massConversions[unit.toLowerCase()] || 1;
        const additionalMassInGrams = numericAdditionalQuantity * conversionFactor;
        newTotalMass += additionalMassInGrams;

        // Recalculate cost per mass unit
        const totalMassCost = stockEntry.totalMass * stockEntry.costPerMassUnit + additionalMassInGrams * finalCostPerPurchasedUnit;
        newCostPerMassUnit = newTotalMass > 0 ? totalMassCost / newTotalMass : 0;
      } else {
        // Add to total pieces
        let additionalPieces;
        if (material.unitType === "package" && material.packageQuantity > 0) {
          if (unit === "ml" && material.volumePerUnit && material.volumePerUnit > 0) {
            // For ml additions to package materials, calculate pieces based on volume
            const bottlesEquivalent = numericAdditionalQuantity / material.volumePerUnit;
            additionalPieces = bottlesEquivalent * material.packageQuantity;
            console.log(`🔢 [addToSpecificEntry] Pieces calculation: ${numericAdditionalQuantity} ml ÷ ${material.volumePerUnit} ml/bottle × ${material.packageQuantity} pieces/bottle = ${additionalPieces} pieces`);
          } else if (unit === material.baseUnit) {
            additionalPieces = numericAdditionalQuantity;
          } else {
            additionalPieces = numericAdditionalQuantity * material.packageQuantity;
          }
        } else {
          additionalPieces = numericAdditionalQuantity;
        }
        newTotalPieces += additionalPieces;

        // Recalculate cost per piece
        const totalPieceCost = stockEntry.totalPieces * stockEntry.costPerPiece + additionalPieces * finalCostPerPurchasedUnit;
        newCostPerPiece = newTotalPieces > 0 ? totalPieceCost / newTotalPieces : 0;
      }

      console.log(`🔍 [DEBUG] Before update - Values to save:`);
      console.log(`🔍 [DEBUG] totalVolume: ${newTotalVolume} (type: ${typeof newTotalVolume})`);
      console.log(`🔍 [DEBUG] totalMass: ${newTotalMass} (type: ${typeof newTotalMass})`);
      console.log(`🔍 [DEBUG] totalPieces: ${Math.round(newTotalPieces)} (type: ${typeof Math.round(newTotalPieces)})`);
      
      await stockEntry.update({
        // Update calculated total fields (primary)
        totalVolume: parseFloat(newTotalVolume.toFixed(3)),
        totalMass: newTotalMass,
        totalPieces: Math.round(newTotalPieces),
        costPerVolumeUnit: typeof newCostPerVolumeUnit === "number" ? parseFloat(newCostPerVolumeUnit.toFixed(6)) : 0,
        costPerMassUnit: typeof newCostPerMassUnit === "number" ? parseFloat(newCostPerMassUnit.toFixed(6)) : 0,
        costPerPiece: typeof newCostPerPiece === "number" ? parseFloat(newCostPerPiece.toFixed(6)) : 0,

        // Update legacy fields (for backward compatibility)
        purchasedQuantity: newPurchasedQuantity,
        purchasedIndividualQuantity: newIndividualQuantity,
        purchasedIndividualUnit: newIndividualUnit,
        purchasedConvertedQuantity: finalConvertedQuantity,
        purchasedConvertedUnit: finalConvertedUnit,
        costPerPurchasedUnit: finalCostPerPurchasedUnit,
        costPerBaseUnit: newCostPerBaseUnit,
        totalCost: newTotalCost,
        updatedAt: new Date(),
        notes: notes ? `${stockEntry.notes || ""}\n[${new Date().toLocaleDateString()}] Added ${numericAdditionalQuantity} ${unit}. ${notes}`.trim() : stockEntry.notes
      });
      
      console.log(`🔍 [DEBUG] Database update completed. Fetching updated entry...`);
      
      const updatedEntry = await StockEntry.findByPk(id, {
        include: { model: Material, as: "material" }
      });
      
      console.log(`🔍 [DEBUG] After update - Database values:`);
      console.log(`🔍 [DEBUG] updatedEntry.totalVolume: ${updatedEntry.totalVolume}`);
      console.log(`🔍 [DEBUG] updatedEntry.totalMass: ${updatedEntry.totalMass}`);
      console.log(`🔍 [DEBUG] updatedEntry.totalPieces: ${updatedEntry.totalPieces}`);
      
      try {
        const user = req.user || { id: null, fullName: "System", username: "system" };
        const originalStockEntry = { ...stockEntry.toJSON() }; // Store original before update
        await StockEntryAuditHelperSimple.logAddToStock(originalStockEntry, updatedEntry.toJSON(), numericAdditionalQuantity, unit, user, req, {
          operationType: "add_to_stock",
          notes: notes,
          additionDate: additionDate,
          costPerPurchasedUnit: finalCostPerPurchasedUnit
        });
        console.log(`✅ Stock addition logged for material ${updatedEntry.material?.name} (ID: ${updatedEntry.id}) - Added ${numericAdditionalQuantity} ${unit}`);
      } catch (loggingError) {
        console.error("❌ Failed to log stock addition:", loggingError);
      }
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
        if (unit === material.inputUnit) {
          additionalIndividualQuantity = Math.round(numericAdditionalQuantity * material.packageQuantity);
          additionalIndividualUnit = material.baseUnit;
        } else if (unit === material.baseUnit) {
          additionalIndividualQuantity = numericAdditionalQuantity;
          additionalIndividualUnit = material.baseUnit;
        } else {
          additionalIndividualQuantity = Math.round(numericAdditionalQuantity * material.packageQuantity);
          additionalIndividualUnit = material.baseUnit;
        }
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

      // Calculate total fields for new stock entry (aligned with enhanced stock system)
      let totalVolume = 0,
        totalMass = 0,
        totalPieces = 0;
      let volumeUnit = "ml",
        massUnit = "g";
      let costPerVolumeUnit = 0,
        costPerMassUnit = 0,
        costPerPiece = 0;

      if (material.unitType === "volume") {
        // Convert to ml for consistent volume storage
        const { convertToMl } = require("../utils/volumeConversionUtils");
        // Pass material context to properly handle bottle units
        totalVolume = convertToMl(additionalIndividualQuantity, additionalIndividualUnit, material);
        volumeUnit = "ml";
        console.log(`📊 [addToStock] Volume calculation: ${additionalIndividualQuantity} ${additionalIndividualUnit} = ${totalVolume}ml`);
        costPerVolumeUnit = totalVolume > 0 ? totalAdditionCost / totalVolume : 0;
      } else if (material.unitType === "mass") {
        // Convert to grams for consistent mass storage
        const massConversions = { kg: 1000, g: 1, lb: 453.592, oz: 28.3495 };
        const conversionFactor = massConversions[additionalIndividualUnit.toLowerCase()] || 1;
        totalMass = additionalIndividualQuantity * conversionFactor;
        massUnit = "g";
        costPerMassUnit = totalMass > 0 ? totalAdditionCost / totalMass : 0;
      } else {
        // Treat as pieces (including packages)
        totalPieces = additionalIndividualQuantity;
        costPerPiece = totalPieces > 0 ? totalAdditionCost / totalPieces : 0;
      }

      const additionEntry = await StockEntry.create({
        materialId,
        supplier: `Stock Addition - ${new Date().toLocaleDateString()}`,
        purchasedQuantity: numericAdditionalQuantity,
        purchasedUnit: unit,
        purchasedIndividualQuantity: additionalIndividualQuantity,
        purchasedIndividualUnit: additionalIndividualUnit,
        // CRITICAL FIX: Ensure converted quantities are properly synchronized
        purchasedConvertedQuantity: material.unitType === "mass" ? additionalIndividualQuantity : material.unitType === "package" ? numericAdditionalQuantity : additionalIndividualQuantity,
        purchasedConvertedUnit: material.unitType === "mass" ? material.baseUnit : material.unitType === "package" ? unit : additionalIndividualUnit,

        // Add calculated total fields (aligned with enhanced stock system)
        totalVolume,
        totalMass,
        totalPieces,
        volumeUnit,
        massUnit,
        costPerVolumeUnit: parseFloat(costPerVolumeUnit.toFixed(6)),
        costPerMassUnit: parseFloat(costPerMassUnit.toFixed(6)),
        costPerPiece: parseFloat(costPerPiece.toFixed(6)),

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
      let wasteInOriginalUnit = numericWasteQuantity;
      let wasteInSmallerUnit = numericWasteQuantity;
      let wasteUnitForRecord = unit;
      if (stockEntry.purchasedUnit !== unit) {
        if (material.unitType === "package" && material.packageQuantity && material.packageQuantity > 0) {
          if (unit === material.baseUnit) {
            // Wasting in base unit (e.g., pieces from a box)
            wasteInOriginalUnit = numericWasteQuantity / material.packageQuantity;
            wasteInSmallerUnit = numericWasteQuantity;
            wasteUnitForRecord = material.baseUnit;
          } else if (unit === stockEntry.purchasedUnit) {
            // Wasting in purchased unit (e.g., boxes)
            wasteInOriginalUnit = numericWasteQuantity;
            wasteInSmallerUnit = numericWasteQuantity * material.packageQuantity;
            wasteUnitForRecord = material.baseUnit;
          } else {
            // Allow flexible waste recording - convert any valid unit
            console.log(`⚠️ Flexible waste unit conversion: ${unit} from ${stockEntry.purchasedUnit} for material ${material.name}`);

            // Try to handle common unit conversions for packages
            if (unit === "piece" || unit === "item" || unit === "unit") {
              // Treat as base unit
              wasteInOriginalUnit = numericWasteQuantity / material.packageQuantity;
              wasteInSmallerUnit = numericWasteQuantity;
              wasteUnitForRecord = material.baseUnit;
            } else {
              // Default: treat as purchased unit
              wasteInOriginalUnit = numericWasteQuantity;
              wasteInSmallerUnit = numericWasteQuantity * material.packageQuantity;
              wasteUnitForRecord = material.baseUnit;
            }
          }
        } else if (material.unitType === "mass") {
          const massConversions = { kg: 1000, g: 1, lb: 453.592, oz: 28.3495 };
          const originalUnitFactor = massConversions[stockEntry.purchasedUnit.toLowerCase()];
          const wasteUnitFactor = massConversions[unit.toLowerCase()];
          if (originalUnitFactor && wasteUnitFactor) {
            wasteInOriginalUnit = numericWasteQuantity * (wasteUnitFactor / originalUnitFactor);
            wasteInSmallerUnit = numericWasteQuantity * wasteUnitFactor;
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
      // Check availability using calculated total fields (aligned with stock deduction logic)
      let availableQuantity, availableUnit, fieldToCheck;
      if (material.unitType === "volume" && stockEntry.totalVolume > 0) {
        availableQuantity = stockEntry.totalVolume;
        availableUnit = stockEntry.volumeUnit || "ml";
        fieldToCheck = "totalVolume";
      } else if (material.unitType === "mass" && stockEntry.totalMass > 0) {
        availableQuantity = stockEntry.totalMass;
        availableUnit = stockEntry.massUnit || "g";
        fieldToCheck = "totalMass";
      } else if (stockEntry.totalPieces > 0) {
        availableQuantity = stockEntry.totalPieces;
        availableUnit = material.baseUnit || "piece";
        fieldToCheck = "totalPieces";
      } else {
        // Fallback to original logic for backward compatibility
        availableQuantity = stockEntry.purchasedQuantity;
        availableUnit = stockEntry.purchasedUnit;
        fieldToCheck = "purchasedQuantity";
      }

      // Convert waste quantity to match the available quantity's unit for comparison
      let wasteInAvailableUnit = numericWasteQuantity;
      if (unit !== availableUnit) {
        if (material.unitType === "volume") {
          const { convertVolume } = require("../utils/volumeConversionUtils");
          wasteInAvailableUnit = convertVolume(numericWasteQuantity, unit, availableUnit);
        } else if (material.unitType === "mass") {
          const massConversions = { kg: 1000, g: 1, lb: 453.592, oz: 28.3495 };
          const wasteUnitFactor = massConversions[unit.toLowerCase()];
          const availableUnitFactor = massConversions[availableUnit.toLowerCase()];
          if (wasteUnitFactor && availableUnitFactor) {
            wasteInAvailableUnit = numericWasteQuantity * (wasteUnitFactor / availableUnitFactor);
          }
        } else if (material.unitType === "package" && material.packageQuantity > 0) {
          if (unit === material.baseUnit && availableUnit === stockEntry.purchasedUnit) {
            wasteInAvailableUnit = numericWasteQuantity / material.packageQuantity;
          } else if (unit === stockEntry.purchasedUnit && availableUnit === material.baseUnit) {
            wasteInAvailableUnit = numericWasteQuantity * material.packageQuantity;
          }
        }
      }

      if (wasteInAvailableUnit > availableQuantity) {
        return res.status(400).json({
          error: `Insufficient stock in this entry. Available: ${availableQuantity} ${availableUnit} (${fieldToCheck}), Requested: ${wasteInAvailableUnit.toFixed(3)} ${availableUnit}`
        });
      }
      // Update calculated total fields (aligned with stock deduction logic)
      const isWastingAll = wasteInAvailableUnit >= availableQuantity;
      let newTotalVolume = stockEntry.totalVolume || 0;
      let newTotalMass = stockEntry.totalMass || 0;
      let newTotalPieces = stockEntry.totalPieces || 0;

      // Deduct from the appropriate calculated total field
      if (fieldToCheck === "totalVolume") {
        newTotalVolume = Math.max(0, newTotalVolume - wasteInAvailableUnit);
      } else if (fieldToCheck === "totalMass") {
        newTotalMass = Math.max(0, newTotalMass - wasteInAvailableUnit);
      } else if (fieldToCheck === "totalPieces") {
        newTotalPieces = Math.max(0, newTotalPieces - wasteInAvailableUnit);
      }

      // Update legacy fields for backward compatibility
      let newPurchasedQuantity = isWastingAll ? 0 : Math.max(0, parseFloat(stockEntry.purchasedQuantity) - wasteInOriginalUnit);
      let newIndividualQuantity = isWastingAll ? 0 : 0;
      let newIndividualUnit = isWastingAll ? material.baseUnit : stockEntry.purchasedIndividualUnit || material.baseUnit;

      if (isWastingAll) {
        newIndividualQuantity = 0;
        newIndividualUnit = material.baseUnit;
        newPurchasedQuantity = 0;
      } else if (material.unitType === "package" && material.packageQuantity && material.packageQuantity > 0) {
        newIndividualQuantity = Math.max(0, (stockEntry.purchasedIndividualQuantity || 0) - wasteInSmallerUnit);
        newIndividualUnit = material.baseUnit;
      } else if (material.unitType === "mass") {
        newIndividualQuantity = Math.max(0, (stockEntry.purchasedIndividualQuantity || 0) - wasteInSmallerUnit);
        newIndividualUnit = material.baseUnit;
      } else {
        newIndividualQuantity = Math.max(0, (stockEntry.purchasedIndividualQuantity || 0) - numericWasteQuantity);
        newIndividualUnit = stockEntry.purchasedIndividualUnit || stockEntry.purchasedUnit;
      }
      // Calculate cost reductions based on calculated total fields
      let costReduction = 0;
      let newCostPerVolumeUnit = stockEntry.costPerVolumeUnit || 0;
      let newCostPerMassUnit = stockEntry.costPerMassUnit || 0;
      let newCostPerPiece = stockEntry.costPerPiece || 0;

      if (fieldToCheck === "totalVolume" && stockEntry.totalVolume > 0) {
        costReduction = wasteInAvailableUnit * (stockEntry.costPerVolumeUnit || 0);
        newCostPerVolumeUnit = newTotalVolume > 0 ? (stockEntry.totalVolume * stockEntry.costPerVolumeUnit - costReduction) / newTotalVolume : 0;
      } else if (fieldToCheck === "totalMass" && stockEntry.totalMass > 0) {
        costReduction = wasteInAvailableUnit * (stockEntry.costPerMassUnit || 0);
        newCostPerMassUnit = newTotalMass > 0 ? (stockEntry.totalMass * stockEntry.costPerMassUnit - costReduction) / newTotalMass : 0;
      } else if (fieldToCheck === "totalPieces" && stockEntry.totalPieces > 0) {
        costReduction = wasteInAvailableUnit * (stockEntry.costPerPiece || 0);
        newCostPerPiece = newTotalPieces > 0 ? (stockEntry.totalPieces * stockEntry.costPerPiece - costReduction) / newTotalPieces : 0;
      } else {
        // Fallback to legacy cost calculation
        const costPerSmallerUnit = parseFloat(stockEntry.costPerBaseUnit) || parseFloat(stockEntry.costPerPurchasedUnit) / material.packageQuantity || 0;
        costReduction = wasteInOriginalUnit * parseFloat(stockEntry.costPerPurchasedUnit);
      }

      const newTotalCost = Math.max(0, parseFloat((parseFloat(stockEntry.totalCost) - costReduction).toFixed(6)));
      const newCostPerBaseUnit = newIndividualQuantity > 0 ? parseFloat((newTotalCost / newIndividualQuantity).toFixed(6)) : 0;
      let newPurchasedConvertedQuantity;
      let newPurchasedConvertedUnit;
      if (material.unitType === "mass") {
        newPurchasedConvertedQuantity = newIndividualQuantity;
        newPurchasedConvertedUnit = material.baseUnit;
        if (stockEntry.purchasedUnit === "kg" && material.baseUnit === "g") {
          newIndividualQuantity = Math.round(newPurchasedQuantity * 1000);
        }
      } else if (material.unitType === "package") {
        newPurchasedConvertedQuantity = newPurchasedQuantity;
        newPurchasedConvertedUnit = stockEntry.purchasedUnit;
      } else {
        newPurchasedConvertedQuantity = newIndividualQuantity;
        newPurchasedConvertedUnit = newIndividualUnit;
      }
      if (isWastingAll) {
        newPurchasedConvertedQuantity = 0;
        newIndividualQuantity = 0;
      }
      console.log(`📊 [wasteFromSpecificEntry] Waste calculations for ${material.name}:`, {
        wasteInOriginalUnit,
        wasteInSmallerUnit,
        wasteInAvailableUnit,
        fieldToCheck,
        availableQuantity,
        originalPurchasedQuantity: stockEntry.purchasedQuantity,
        newPurchasedQuantity,
        originalTotalVolume: stockEntry.totalVolume,
        newTotalVolume,
        originalTotalMass: stockEntry.totalMass,
        newTotalMass,
        originalTotalPieces: stockEntry.totalPieces,
        newTotalPieces,
        costReduction,
        isWastingAll
      });

      await stockEntry.update({
        // Update calculated total fields (primary)
        totalVolume: parseFloat(newTotalVolume.toFixed(3)),
        totalMass: newTotalMass,
        totalPieces: Math.round(newTotalPieces),
        costPerVolumeUnit: newCostPerVolumeUnit,
        costPerMassUnit: newCostPerMassUnit,
        costPerPiece: newCostPerPiece,

        // Update legacy fields (for backward compatibility)
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
      const wasteRecord = await Wasting.create({
        stockEntryId: stockEntry.id,
        materialName: material.name,
        category: material.category || material.categoryId || "uncategorized",
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
      try {
        const user = req.user || { id: null, fullName: "System", username: "system" };
        const originalStockEntry = { ...stockEntry.toJSON() };
        await StockEntryAuditHelperSimple.logWasteFromStock(originalStockEntry, updatedEntry.toJSON(), wasteInSmallerUnit, wasteUnitForRecord, wasteReason, user, req, {
          operationType: "waste_from_stock",
          notes: notes,
          wasteDate: wasteDate,
          totalCostReduction: costReduction,
          wasteRecordId: wasteRecord.id
        });
        console.log(`✅ Stock waste logged for material ${updatedEntry.material?.name} (ID: ${updatedEntry.id}) - Wasted ${wasteInSmallerUnit} ${wasteUnitForRecord} (${wasteReason})`);
      } catch (loggingError) {
        console.error("❌ Failed to log stock waste:", loggingError);
      }
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

  // Update POS visibility for a stock entry
  updateStockEntryPOS: async (req, res, next) => {
    try {
      const { id } = req.params;
      const { isPOSItem } = req.body;
      if (isPOSItem === undefined) {
        return res.status(400).json({ error: "isPOSItem field is required" });
      }
      const stockEntry = await StockEntry.findByPk(id, {
        include: { model: Material, as: "material" }
      });
      if (!stockEntry) {
        return res.status(404).json({ error: "Stock entry not found" });
      }
      const originalStockEntry = stockEntry.toJSON();
      await stockEntry.update({ isPOSItem });
      const updatedStockEntry = await StockEntry.findByPk(id, {
        include: { model: Material, as: "material" }
      });
      try {
        const user = req.user || { id: null, fullName: "System", username: "system" };
        await StockEntryAuditHelperSimple.logPOSToggle(updatedStockEntry.toJSON(), originalStockEntry.isPOSItem, isPOSItem, user, req);
        console.log(`✅ POS visibility toggle logged for material ${updatedStockEntry.material?.name} (ID: ${updatedStockEntry.id}) - Changed to ${isPOSItem ? "visible" : "hidden"}`);
      } catch (loggingError) {
        console.error("❌ Failed to log POS visibility toggle:", loggingError);
      }
      res.status(200).json({
        message: `Stock entry POS visibility updated to ${isPOSItem ? "visible" : "hidden"}`,
        stockEntry: updatedStockEntry
      });
    } catch (error) {
      console.error("Error updating stock entry POS visibility:", error);
      next(error);
    }
  },

  // Get stock entries with their assigned printers (with pagination)
  getStockEntriesWithPrinters: async (req, res, next) => {
    try {
      const { fields = "" } = req.query;
      const paginationParams = parsePaginationParams(req.query, {
        defaultLimit: 50,
        maxLimit: 500,
        allowedSortFields: ["id", "supplier", "purchaseDate", "totalCost", "createdAt"]
      });
      const whereClause = buildFilterConditions(
        req.query,
        {
          searchFields: ["supplier"],
          exactFilters: ["materialId", "printerId", "isPOSItem"]
        },
        Op
      );
      const selectedFields = parseFieldSelection(fields, ["id", "materialId", "supplier", "purchasedQuantity", "purchasedUnit", "totalCost", "purchaseDate", "expiryDate", "isPOSItem", "printerId", "createdAt"]);
      const queryOptions = {
        where: whereClause,
        include: [
          {
            model: Material,
            as: "material",
            attributes: ["id", "name", "baseUnit", "unitType", "category"]
          },
          {
            model: Printer,
            as: "assignedPrinter",
            attributes: ["id", "name", "type", "status", "location"],
            required: false
          }
        ],
        order: [[paginationParams.sortBy, paginationParams.sortOrder]],
        limit: paginationParams.limit,
        offset: paginationParams.offset,
        distinct: true,
        attributes: selectedFields
      };
      const { count, rows: stockEntries } = await StockEntry.findAndCountAll(queryOptions);
      const pagination = buildPaginationResponse(count, paginationParams.page, paginationParams.limit);
      res.status(200).json({
        data: stockEntries,
        pagination,
        filters: {
          search: req.query.search || "",
          materialId: req.query.materialId || "",
          printerId: req.query.printerId || "",
          isPOSItem: req.query.isPOSItem || "",
          sortBy: paginationParams.sortBy,
          sortOrder: paginationParams.sortOrder,
          fields
        },
        meta: {
          requestTime: new Date().toISOString(),
          totalDataSize: stockEntries.length
        }
      });
    } catch (error) {
      console.error("Error fetching stock entries with printers:", error);
      next(error);
    }
  },

  // Assign printer to stock entry
  assignPrinter: async (req, res, next) => {
    try {
      const { id } = req.params;
      const { printerId } = req.body;
      if (!/^\d+$/.test(id)) {
        return res.status(400).json({ error: "Invalid stock entry ID" });
      }
      if (printerId) {
        const printer = await Printer.findByPk(printerId);
        if (!printer) {
          return res.status(404).json({ error: "Printer not found" });
        }
      }
      const [updatedRowsCount] = await StockEntry.update({ printerId: printerId || null }, { where: { id } });
      if (updatedRowsCount === 0) {
        return res.status(404).json({ error: "Stock entry not found" });
      }
      const updatedStockEntry = await StockEntry.findByPk(id, {
        include: [
          {
            model: Material,
            as: "material",
            attributes: ["id", "name", "baseUnit", "unitType", "categoryId"]
          },
          {
            model: Printer,
            as: "assignedPrinter",
            attributes: ["id", "name", "type", "status"]
          }
        ]
      });
      res.status(200).json({
        message: printerId ? "Printer assigned successfully" : "Printer assignment removed",
        stockEntry: updatedStockEntry
      });
    } catch (error) {
      console.error("Error assigning printer to stock entry:", error);
      next(error);
    }
  },

  // Bulk assign printer to multiple stock entries
  bulkAssignPrinter: async (req, res, next) => {
    try {
      const { stockEntryIds, printerId } = req.body;
      if (!Array.isArray(stockEntryIds) || stockEntryIds.length === 0) {
        return res.status(400).json({ error: "Stock entry IDs array is required" });
      }
      if (printerId) {
        const printer = await Printer.findByPk(printerId);
        if (!printer) {
          return res.status(404).json({ error: "Printer not found" });
        }
      }
      const [updatedRowsCount] = await StockEntry.update({ printerId: printerId || null }, { where: { id: { [Op.in]: stockEntryIds } } });
      res.status(200).json({
        message: `${updatedRowsCount} stock entries updated`,
        updatedCount: updatedRowsCount
      });
    } catch (error) {
      console.error("Error bulk assigning printer:", error);
      next(error);
    }
  },

  // Calculate the total current stock value across all (optionally filtered) stock entries
  getTotalCurrentStockValue: async (req, res, next) => {
    try {
      // Optional filters: materialId, isPOSItem. By default exclude zero/negative quantities.
      const whereClause = buildFilterConditions(
        req.query,
        {
          searchFields: [],
          exactFilters: ["materialId", "isPOSItem"],
          rangeFilters: []
        },
        Op
      );

      // Exclude non-positive quantities by default for value computation
      if (req.query.includeZero !== "true") {
        whereClause.purchasedIndividualQuantity = { [Op.gt]: 0 };
      }

      const stockEntries = await StockEntry.findAll({
        where: whereClause,
        attributes: ["id", "materialId", "purchasedIndividualQuantity", "costPerBaseUnit", "totalCost"]
      });

      let totalValue = 0;
      let negativeEntriesCount = 0;
      for (const entry of stockEntries) {
        const qtyRaw = Number(entry.purchasedIndividualQuantity) || 0;
        // Guard against accidental negatives
        if (qtyRaw < 0) negativeEntriesCount += 1;
        const qty = Math.max(0, qtyRaw);

        let cbu = entry.costPerBaseUnit !== null && entry.costPerBaseUnit !== undefined ? Number(entry.costPerBaseUnit) : undefined;
        if ((cbu === undefined || isNaN(cbu) || cbu <= 0) && qty > 0) {
          // Fallback: derive from totalCost when costPerBaseUnit is missing or invalid
          const tc = Number(entry.totalCost) || 0;
          cbu = tc > 0 ? tc / qty : 0;
        }

        const perEntryValue = qty > 0 && cbu > 0 ? qty * cbu : 0;
        totalValue += perEntryValue;
      }

      const roundedTotal = Number(totalValue.toFixed(6));

      if (negativeEntriesCount > 0) {
        console.warn("[getTotalCurrentStockValue] Negative stock entries encountered:", negativeEntriesCount);
      }

      return res.status(200).json({
        totalStockValue: roundedTotal,
        entriesCount: stockEntries.length,
        filters: {
          materialId: req.query.materialId || "",
          isPOSItem: req.query.isPOSItem || "",
          includeZero: req.query.includeZero === "true"
        },
        computedAt: new Date().toISOString()
      });
    } catch (error) {
      console.error("Error calculating total current stock value:", error);
      next(error);
    }
  },

  // Get available material categories for stock entries
  getMaterialCategories: async (req, res, next) => {
    try {
      const categories = await getMaterialCategories();
      res.json({
        success: true,
        data: categories,
        count: categories.length
      });
    } catch (err) {
      next(err);
    }
  }
};

export default stockEntriesController;

import { Op } from "sequelize";
import sequelize from "../config/database.js";
import { Material, StockEntry, Wasting, Printer, Category } from "../models/index.js";
import { StockEntryAuditHelperSimple } from "../decorators/stockEntryAuditDecoratorSimple.js";
import { 
  parsePaginationParams, 
  buildPaginationResponse, 
  buildFilterConditions, 
  parseFieldSelection 
} from "../utils/paginationHelpers.js";
import { getMaterialCategories } from "../utils/categoryHelpers.js";

const stockEntriesController = {
  // Get all stock entries with pagination and filtering
  getAllStockEntries: async (req, res, next) => {
    try {
      const { includeMaterial = 'true', fields = '' } = req.query;
      
      // Parse pagination parameters
      const paginationParams = parsePaginationParams(req.query, {
        defaultLimit: 50,
        maxLimit: 500,
        allowedSortFields: ['id', 'supplier', 'purchaseDate', 'expiryDate', 'totalCost', 'createdAt', 'updatedAt']
      });

      // Build filter conditions
      const whereClause = buildFilterConditions(req.query, {
        searchFields: ['supplier'],
        exactFilters: ['materialId', 'isPOSItem'],
        rangeFilters: ['purchaseDate', 'expiryDate', 'totalCost', 'createdAt']
      }, Op);

      // Parse field selection for optimized transfer
      const selectedFields = parseFieldSelection(fields, [
        'id', 'materialId', 'supplier', 'purchasedQuantity', 'purchasedUnit', 
        'purchasedIndividualQuantity', 'purchasedIndividualUnit', 'costPerPurchasedUnit', 
        'costPerBaseUnit', 'totalCost', 'purchaseDate', 'expiryDate', 'isPOSItem', 
        'printerId', 'notes', 'createdAt', 'updatedAt'
      ]);

      // Base query options
      const queryOptions = {
        where: whereClause,
        order: [[paginationParams.sortBy, paginationParams.sortOrder]],
        limit: paginationParams.limit,
        offset: paginationParams.offset,
        distinct: true,
        attributes: selectedFields
      };

      // Conditionally include material data
      if (includeMaterial === 'true') {
        queryOptions.include = [{
          model: Material,
          as: "material",
          attributes: ['id', 'name', 'baseUnit', 'unitType', 'inputUnit', 'packageQuantity', 'categoryId'],
          include: [{
            model: Category,
            as: "category",
            attributes: ['id', 'name', 'value', 'type']
          }]
        }];
      }

      const { count, rows: stockEntries } = await StockEntry.findAndCountAll(queryOptions);

      // Check for negative stock entries and log warnings
      if (stockEntries.length > 0) {
        const negativeStockEntries = stockEntries.filter(entry => 
          entry.purchasedIndividualQuantity < 0 || entry.purchasedQuantity < 0
        );
        if (negativeStockEntries.length > 0) {
          console.warn("Negative stock entries found:", negativeStockEntries.length);
        }
      }

      const pagination = buildPaginationResponse(count, paginationParams.page, paginationParams.limit);

      res.status(200).json({
        data: stockEntries,
        pagination,
        filters: {
          search: req.query.search || '',
          materialId: req.query.materialId || '',
          isPOSItem: req.query.isPOSItem || '',
          purchaseDate_from: req.query.purchaseDate_from || '',
          purchaseDate_to: req.query.purchaseDate_to || '',
          expiryDate_from: req.query.expiryDate_from || '',
          expiryDate_to: req.query.expiryDate_to || '',
          totalCost_from: req.query.totalCost_from || '',
          totalCost_to: req.query.totalCost_to || '',
          sortBy: paginationParams.sortBy,
          sortOrder: paginationParams.sortOrder,
          includeMaterial,
          fields
        },
        meta: {
          requestTime: new Date().toISOString(),
          totalDataSize: stockEntries.length,
          negativeEntriesCount: stockEntries.filter(entry => 
            entry.purchasedIndividualQuantity < 0 || entry.purchasedQuantity < 0
          ).length
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
      } else if (material.unitType === "volume") {
        const volumeConversions = {
          l: 1000,
          ml: 1,
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

      const finalCostPerBaseUnit = numericCostPerBaseUnit !== undefined ? numericCostPerBaseUnit : purchasedIndividualQuantity > 0 ? parseFloat((numericTotalCost / purchasedIndividualQuantity).toFixed(6)) : 0;

      const stockEntry = await StockEntry.create({
        materialId,
        supplier,
        purchasedQuantity: numericPurchasedQuantity,
        purchasedUnit,
        purchasedIndividualQuantity,
        purchasedIndividualUnit,
        purchasedConvertedQuantity: purchasedIndividualQuantity,
        purchasedConvertedUnit: purchasedIndividualUnit,
        costPerPurchasedUnit: numericCostPerPurchasedUnit,
        costPerBaseUnit: finalCostPerBaseUnit,
        totalCost: numericTotalCost,
        purchaseDate,
        expiryDate,
        isPOSItem: isPOSItem !== undefined ? isPOSItem : false
      });

      const createdStockEntry = await StockEntry.findByPk(stockEntry.id, {
        include: { model: Material, as: "material" }
      });

      // Log successful stock entry creation using dedicated stock entry logger
      try {
        const user = req.user || { id: null, fullName: 'System', username: 'system' };
        await StockEntryAuditHelperSimple.logStockCreation(
          createdStockEntry.toJSON(),
          user,
          req,
          {
            operationType: 'stock_creation',
            supplier: createdStockEntry.supplier,
            totalCost: createdStockEntry.totalCost,
            purchasedQuantity: createdStockEntry.purchasedQuantity,
            purchasedUnit: createdStockEntry.purchasedUnit
          }
        );
        console.log(`✅ Stock entry creation logged for material ${createdStockEntry.material?.name} (ID: ${createdStockEntry.id})`);
      } catch (loggingError) {
        console.error('❌ Failed to log stock entry creation:', loggingError);
        // Don't fail the main operation if logging fails
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
      const { materialId, supplier, purchasedQuantity, purchasedUnit, costPerPurchasedUnit, totalCost, costPerBaseUnit, purchaseDate, expiryDate, isPOSItem } = req.body;

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
      } else if (material.unitType === "volume") {
        const volumeConversions = {
          l: 1000,
          ml: 1,
          gallon: 3785.41,
          qt: 946.353,
          pt: 473.176
        };
        const conversionFactor = volumeConversions[finalPurchasedUnit.toLowerCase()];
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
        purchasedConvertedQuantity: updatedIndividualQuantity,
        purchasedConvertedUnit: updatedIndividualUnit,
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

      // Log successful stock entry update using dedicated stock entry logger
      try {
        const user = req.user || { id: null, fullName: 'System', username: 'system' };
        await StockEntryAuditHelperSimple.logStockEdit(
          originalStockEntry,
          updatedStockEntry.toJSON(),
          user,
          req,
          {
            operationType: 'stock_edit',
            supplier: updatedStockEntry.supplier,
            totalCost: updatedStockEntry.totalCost,
            purchasedQuantity: updatedStockEntry.purchasedQuantity,
            purchasedUnit: updatedStockEntry.purchasedUnit
          }
        );
        console.log(`✅ Stock entry update logged for material ${updatedStockEntry.material?.name} (ID: ${updatedStockEntry.id})`);
      } catch (loggingError) {
        console.error('❌ Failed to log stock entry update:', loggingError);
        // Don't fail the main operation if logging fails
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

      // Log successful stock entry deletion using dedicated stock entry logger
      try {
        const user = req.user || { id: null, fullName: 'System', username: 'system' };
        await StockEntryAuditHelperSimple.logStockDeletion(
          deletedStockEntry,
          user,
          'Manual deletion via API',
          req
        );
        console.log(`✅ Stock entry deletion logged for material ${deletedStockEntry.material?.name || 'Unknown'} (ID: ${deletedStockEntry.id})`);
      } catch (loggingError) {
        console.error('❌ Failed to log stock entry deletion:', loggingError);
        // Don't fail the main operation if logging fails
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

      // Debug logging
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

      // Log successful stock addition using dedicated stock entry logger
      try {
        const user = req.user || { id: null, fullName: 'System', username: 'system' };
        const originalStockEntry = { ...stockEntry.toJSON() }; // Store original before update
        await StockEntryAuditHelperSimple.logAddToStock(
          originalStockEntry,
          updatedEntry.toJSON(),
          numericAdditionalQuantity,
          unit,
          user,
          req,
          {
            operationType: 'add_to_stock',
            notes: notes,
            additionDate: additionDate,
            costPerPurchasedUnit: finalCostPerPurchasedUnit
          }
        );
        console.log(`✅ Stock addition logged for material ${updatedEntry.material?.name} (ID: ${updatedEntry.id}) - Added ${numericAdditionalQuantity} ${unit}`);
      } catch (loggingError) {
        console.error('❌ Failed to log stock addition:', loggingError);
        // Don't fail the main operation if logging fails
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

      // Log successful waste recording using dedicated stock entry logger
      try {
        const user = req.user || { id: null, fullName: 'System', username: 'system' };
        const originalStockEntry = { ...stockEntry.toJSON() }; // Store original before update
        await StockEntryAuditHelperSimple.logWasteFromStock(
          originalStockEntry,
          updatedEntry.toJSON(),
          wasteInSmallerUnit,
          wasteUnitForRecord,
          wasteReason,
          user,
          req,
          {
            operationType: 'waste_from_stock',
            notes: notes,
            wasteDate: wasteDate,
            totalCostReduction: costReduction,
            wasteRecordId: wasteRecord.id
          }
        );
        console.log(`✅ Stock waste logged for material ${updatedEntry.material?.name} (ID: ${updatedEntry.id}) - Wasted ${wasteInSmallerUnit} ${wasteUnitForRecord} (${wasteReason})`);
      } catch (loggingError) {
        console.error('❌ Failed to log stock waste:', loggingError);
        // Don't fail the main operation if logging fails
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

      // Store original stock entry data for audit
      const originalStockEntry = stockEntry.toJSON();

      await stockEntry.update({ isPOSItem });

      const updatedStockEntry = await StockEntry.findByPk(id, {
        include: { model: Material, as: "material" }
      });

      // Log successful POS visibility update using dedicated stock entry logger
      try {
        const user = req.user || { id: null, fullName: 'System', username: 'system' };
        await StockEntryAuditHelperSimple.logPOSToggle(
          updatedStockEntry.toJSON(),
          originalStockEntry.isPOSItem,
          isPOSItem,
          user,
          req
        );
        console.log(`✅ POS visibility toggle logged for material ${updatedStockEntry.material?.name} (ID: ${updatedStockEntry.id}) - Changed to ${isPOSItem ? 'visible' : 'hidden'}`);
      } catch (loggingError) {
        console.error('❌ Failed to log POS visibility toggle:', loggingError);
        // Don't fail the main operation if logging fails
      }

      res.status(200).json({
        message: `Stock entry POS visibility updated to ${isPOSItem ? 'visible' : 'hidden'}`,
        stockEntry: updatedStockEntry
      });
    } catch (error) {
      console.error("Error updating stock entry POS visibility:", error);
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

      // Validate printer exists if printerId is provided
      if (printerId) {
        const printer = await Printer.findByPk(printerId);
        if (!printer) {
          return res.status(404).json({ error: "Printer not found" });
        }
      }

      // Update stock entry with printer assignment
      const [updatedRowsCount] = await StockEntry.update(
        { printerId: printerId || null },
        { where: { id } }
      );

      if (updatedRowsCount === 0) {
        return res.status(404).json({ error: "Stock entry not found" });
      }

      // Fetch updated stock entry with printer info
      const updatedStockEntry = await StockEntry.findByPk(id, {
        include: [
          {
            model: Material,
            as: "material",
            attributes: ["id", "name", "baseUnit", "unitType", "category"]
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

  // Get stock entries with their assigned printers (with pagination)
  getStockEntriesWithPrinters: async (req, res, next) => {
    try {
      const { fields = '' } = req.query;
      
      // Parse pagination parameters
      const paginationParams = parsePaginationParams(req.query, {
        defaultLimit: 50,
        maxLimit: 500,
        allowedSortFields: ['id', 'supplier', 'purchaseDate', 'totalCost', 'createdAt']
      });

      // Build filter conditions
      const whereClause = buildFilterConditions(req.query, {
        searchFields: ['supplier'],
        exactFilters: ['materialId', 'printerId', 'isPOSItem']
      }, Op);

      // Parse field selection
      const selectedFields = parseFieldSelection(fields, [
        'id', 'materialId', 'supplier', 'purchasedQuantity', 'purchasedUnit',
        'totalCost', 'purchaseDate', 'expiryDate', 'isPOSItem', 'printerId', 'createdAt'
      ]);

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
            required: false // LEFT JOIN to include entries without printers
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
          search: req.query.search || '',
          materialId: req.query.materialId || '',
          printerId: req.query.printerId || '',
          isPOSItem: req.query.isPOSItem || '',
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

  // Bulk assign printer to multiple stock entries
  bulkAssignPrinter: async (req, res, next) => {
    try {
      const { stockEntryIds, printerId } = req.body;

      if (!Array.isArray(stockEntryIds) || stockEntryIds.length === 0) {
        return res.status(400).json({ error: "Stock entry IDs array is required" });
      }

      // Validate printer exists if printerId is provided
      if (printerId) {
        const printer = await Printer.findByPk(printerId);
        if (!printer) {
          return res.status(404).json({ error: "Printer not found" });
        }
      }

      // Update multiple stock entries
      const [updatedRowsCount] = await StockEntry.update(
        { printerId: printerId || null },
        { where: { id: { [Op.in]: stockEntryIds } } }
      );

      res.status(200).json({
        message: `${updatedRowsCount} stock entries updated`,
        updatedCount: updatedRowsCount
      });
    } catch (error) {
      console.error("Error bulk assigning printer:", error);
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

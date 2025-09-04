// Import required modules
const { StockEntry, Material, Supplier } = require("../models");
const StockValidationService = require("../services/stockValidationService");
const StockCalculationService = require("../services/stockCalculationService");
const TransactionService = require("../services/transactionService");
const { Op } = require("sequelize");
const moment = require("moment");
const { StockEntryAuditHelperSimple } = require("../decorators/stockEntryAuditDecoratorSimple");
const { getCache, setCache } = require("../utils/cacheUtil");

// Controller for stock entries
const stockEntriesController = {
  // Get all stock entries
  getAllStockEntries: async (req, res, next) => {
    try {
      // Implementation details...
    } catch (error) {
      console.error("Error fetching stock entries:", error);
      next(error);
    }
  },

  // Create new stock entry
  createStockEntries: async (req, res, next) => {
    try {
      // Extract data from request body, supporting both nested and flat supplier structure
      const { materialId, supplier, supplierId: legacySupplierId, supplierName: legacySupplierName, purchasedQuantity, purchasedUnit, costPerPurchasedUnit, totalCost, costPerBaseUnit, purchaseDate, expiryDate, isPOSItem } = req.body;
      
      // Handle both new nested supplier structure and legacy flat structure
      // Extract supplierId, ensuring it's a primitive value (string or number), not an object
      let supplierId;
      let supplierName;
      
      // Handle deeply nested supplier structure from frontend
      // Example: supplier: {supplierId: {supplierId: "2", supplierName: "Spinneys"}, supplierName: ""}
      if (supplier?.supplierId && typeof supplier.supplierId === 'object' && supplier.supplierId !== null && supplier.supplierId.supplierId) {
        supplierId = supplier.supplierId.supplierId;
        supplierName = supplier.supplierId.supplierName;
      }
      // Handle the case where supplier.supplierId is an object with id property
      else if (supplier?.supplierId && typeof supplier.supplierId === 'object' && supplier.supplierId !== null && supplier.supplierId.id) {
        supplierId = supplier.supplierId.id;
        supplierName = supplier.supplierName || legacySupplierName;
      } 
      // Handle the case where supplier.supplierId is a primitive
      else if (supplier?.supplierId && (typeof supplier.supplierId === 'string' || typeof supplier.supplierId === 'number')) {
        supplierId = supplier.supplierId;
        supplierName = supplier.supplierName || legacySupplierName;
      } 
      // Fall back to legacy supplierId if available
      else if (legacySupplierId) {
        supplierId = legacySupplierId;
        supplierName = legacySupplierName;
      } else {
        supplierName = supplier?.supplierName || legacySupplierName;
      }
      
      const numericPurchasedQuantity = parseFloat(purchasedQuantity);
      const numericCostPerPurchasedUnit = parseFloat(costPerPurchasedUnit);
      const numericTotalCost = parseFloat(totalCost);
      const numericCostPerBaseUnit = costPerBaseUnit ? parseFloat(costPerBaseUnit) : undefined;
      const material = await Material.findByPk(materialId);
      if (!material) {
        return res.status(404).json({ error: "Material not found" });
      }
      const stockEntryData = {
        materialId,
        purchasedQuantity: numericPurchasedQuantity,
        purchasedUnit,
        totalCost: numericTotalCost,
        costPerPurchasedUnit: numericCostPerPurchasedUnit
      };
      const validationResult = await StockValidationService.validateStockEntryCreation(stockEntryData, material);
      if (!validationResult.isValid) {
        const formattedErrors = StockValidationService.formatValidationErrors(validationResult);
        return res.status(400).json(formattedErrors);
      }
      const calculatedValues = StockCalculationService.calculateAllValues(
        {
          purchasedQuantity: numericPurchasedQuantity,
          purchasedUnit: purchasedUnit,
          totalCost: numericTotalCost
        },
        material
      );
      const finalCostPerPurchasedUnit = numericCostPerPurchasedUnit || 0;
      const finalCostPerBaseUnit = numericCostPerBaseUnit !== undefined ? numericCostPerBaseUnit : calculatedValues.purchasedIndividualQuantity > 0 ? parseFloat((numericTotalCost / calculatedValues.purchasedIndividualQuantity).toFixed(6)) : 0;
      const user = req.user || { id: null, fullName: "System", username: "system" };
      // Check if supplier exists if supplierId is provided
      let supplierData = {};
      if (supplierId) {
        const supplierRecord = await Supplier.findByPk(supplierId);
        if (!supplierRecord) {
          return res.status(404).json({ error: "Supplier not found" });
        }
        // Create both nested supplier object and legacy fields
        supplierData = {
          supplier: {
            supplierId,
            supplierName: supplierRecord.name
          },
          // Legacy fields for backward compatibility
          supplierId,
          supplierName: supplierRecord.name
        };
      } else if (supplierName) {
        // If only supplier name is provided without ID
        supplierData = {
          supplier: {
            supplierId: null,
            supplierName
          },
          // Legacy field for backward compatibility
          supplierName
        };
      } else {
        // Ensure supplier object is always present even if null
        supplierData = {
          supplier: {
            supplierId: null,
            supplierName: null
          }
        };
      }

      const stockEntryCreateData = {
        materialId,
        ...supplierData,
        purchasedQuantity: numericPurchasedQuantity,
        purchasedUnit,
        costPerPurchasedUnit: finalCostPerPurchasedUnit,
        costPerBaseUnit: finalCostPerBaseUnit,
        totalCost: numericTotalCost,
        purchaseDate,
        expiryDate,
        isPOSItem: isPOSItem !== undefined ? isPOSItem : false,
        ...calculatedValues
      };
      const createdStockEntry = await TransactionService.createStockEntryTransaction(stockEntryCreateData, material, user, req);
      
      // Format the response with a nested supplier object
      const formattedResponse = {
        ...createdStockEntry.toJSON(),
        supplier: {
          supplierId: createdStockEntry.supplierId || null,
          supplierName: createdStockEntry.supplierName || null
        }
      };
      
      res.status(201).json(formattedResponse);
    } catch (error) {
      console.error("Error creating stock entry:", error);
      if (error.name === "ValidationError" || (error.message && error.message.includes("validation"))) {
        return res.status(400).json({
          error: "Validation failed",
          details: error.message
        });
      }
      res.status(500).json({ error: "Failed to create stock entry" });
    }
  },

  // Update stock entry
  updateStockEntries: async (req, res, next) => {
    try {
      const { id } = req.params;
      // Extract data from request body, supporting both nested and flat supplier structure
      const { materialId, supplier, supplierId: legacySupplierId, supplierName: legacySupplierName, purchasedQuantity, purchasedUnit, costPerPurchasedUnit, totalCost, costPerBaseUnit, purchaseDate, expiryDate, isPOSItem } = req.body;
      
      // Handle both new nested supplier structure and legacy flat structure
      // Extract supplierId, ensuring it's a primitive value (string or number), not an object
      let supplierId;
      let supplierName;
      
      // Handle deeply nested supplier structure from frontend
      // Example: supplier: {supplierId: {supplierId: "2", supplierName: "Spinneys"}, supplierName: ""}
      if (supplier?.supplierId && typeof supplier.supplierId === 'object' && supplier.supplierId !== null && supplier.supplierId.supplierId) {
        supplierId = supplier.supplierId.supplierId;
        supplierName = supplier.supplierId.supplierName;
      }
      // Handle the case where supplier.supplierId is an object with id property
      else if (supplier?.supplierId && typeof supplier.supplierId === 'object' && supplier.supplierId !== null && supplier.supplierId.id) {
        supplierId = supplier.supplierId.id;
        supplierName = supplier.supplierName || legacySupplierName;
      } 
      // Handle the case where supplier.supplierId is a primitive
      else if (supplier?.supplierId && (typeof supplier.supplierId === 'string' || typeof supplier.supplierId === 'number')) {
        supplierId = supplier.supplierId;
        supplierName = supplier.supplierName || legacySupplierName;
      } 
      // Fall back to legacy supplierId if available
      else if (legacySupplierId) {
        supplierId = legacySupplierId;
        supplierName = legacySupplierName;
      } else {
        supplierName = supplier?.supplierName || legacySupplierName;
      }
      
      const numericPurchasedQuantity = purchasedQuantity ? parseFloat(purchasedQuantity) : undefined;
      const numericCostPerPurchasedUnit = costPerPurchasedUnit ? parseFloat(costPerPurchasedUnit) : undefined;
      const numericTotalCost = totalCost ? parseFloat(totalCost) : undefined;
      const numericCostPerBaseUnit = costPerBaseUnit ? parseFloat(costPerBaseUnit) : undefined;
      const stockEntry = await StockEntry.findByPk(id);
      if (!stockEntry) {
        return res.status(404).json({ error: "Stock entry not found" });
      }
      const material = await Material.findByPk(materialId ?? stockEntry.materialId);
      if (!material) {
        return res.status(404).json({ error: "Material not found" });
      }
      const updateData = {
        materialId: materialId ?? stockEntry.materialId,
        purchasedQuantity: numericPurchasedQuantity ?? stockEntry.purchasedQuantity,
        purchasedUnit: purchasedUnit ?? stockEntry.purchasedUnit,
        totalCost: numericTotalCost ?? stockEntry.totalCost,
        costPerPurchasedUnit: numericCostPerPurchasedUnit ?? stockEntry.costPerPurchasedUnit
      };
      const validationResult = await StockValidationService.validateStockEntryCreation(updateData, material);
      if (!validationResult.isValid) {
        const formattedErrors = StockValidationService.formatValidationErrors(validationResult);
        return res.status(400).json(formattedErrors);
      }
      const calculatedValues = StockCalculationService.calculateAllValues(
        {
          purchasedQuantity: updateData.purchasedQuantity,
          purchasedUnit: updateData.purchasedUnit,
          totalCost: updateData.totalCost
        },
        material
      );
      const finalCostPerPurchasedUnit = numericCostPerPurchasedUnit ?? calculatedValues.costPerPurchasedUnit ?? 0;
      const finalCostPerBaseUnit = numericCostPerBaseUnit ?? (calculatedValues.purchasedIndividualQuantity > 0 ? parseFloat((updateData.totalCost / calculatedValues.purchasedIndividualQuantity).toFixed(6)) : 0);
      // Handle supplier data
      let supplierData = {};
      if (supplierId !== undefined) {
        // If supplierId is provided, verify it exists
        if (supplierId !== null) {
          const supplierRecord = await Supplier.findByPk(supplierId);
          if (!supplierRecord) {
            return res.status(404).json({ error: "Supplier not found" });
          }
          // Create both nested supplier object and legacy fields
          supplierData = {
            supplier: {
              supplierId,
              supplierName: supplierRecord.name
            },
            // Legacy fields for backward compatibility
            supplierId,
            supplierName: supplierRecord.name
          };
        } else {
          // If supplierId is explicitly set to null
          supplierData = {
            supplier: {
              supplierId: null,
              supplierName: supplierName || null
            },
            // Legacy fields for backward compatibility
            supplierId: null,
            supplierName: supplierName || null
          };
        }
      } else if (supplierName !== undefined && stockEntry.supplierId === null) {
        // If only supplier name is being updated and there's no supplier ID
        supplierData = {
          supplier: {
            supplierId: null,
            supplierName
          },
          // Legacy field for backward compatibility
          supplierName
        };
      } else {
        // Ensure supplier object is always present even if unchanged
        supplierData = {
          supplier: {
            supplierId: stockEntry.supplierId || null,
            supplierName: stockEntry.supplierName || null
          }
        };
      }

      const stockUpdateData = {
        materialId: materialId ?? stockEntry.materialId,
        ...supplierData,
        purchasedQuantity: updateData.purchasedQuantity,
        purchasedUnit: updateData.purchasedUnit,
        costPerPurchasedUnit: finalCostPerPurchasedUnit,
        costPerBaseUnit: finalCostPerBaseUnit,
        totalCost: updateData.totalCost,
        purchaseDate: purchaseDate ?? stockEntry.purchaseDate,
        expiryDate: expiryDate ?? stockEntry.expiryDate,
        isPOSItem: isPOSItem !== undefined ? isPOSItem : stockEntry.isPOSItem
      };
      
      const user = req.user || { id: null, fullName: "System", username: "system" };
      const updatedStockEntry = await TransactionService.updateStockEntryTransaction(stockEntry, stockUpdateData, user, req);
      
      // Format the response with a nested supplier object
      const formattedResponse = {
        ...updatedStockEntry.toJSON(),
        supplier: {
          supplierId: updatedStockEntry.supplierId || null,
          supplierName: updatedStockEntry.supplierName || null
        }
      };
      
      res.status(200).json(formattedResponse);
    } catch (error) {
      console.error("Error updating stock entry:", error);
      if (error.name === "ValidationError" || (error.message && error.message.includes("validation"))) {
        return res.status(400).json({
          error: "Validation failed",
          details: error.message
        });
      }
      res.status(500).json({ error: "Failed to update stock entry" });
    }
  },

  // Other methods...
};

module.exports = stockEntriesController;

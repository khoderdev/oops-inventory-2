import StockEntryLogger from "../services/StockEntryLogger.js";

export function logStockCreation(options = {}) {
  return function (target, propertyKey, descriptor) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args) {
      const req = args.find(arg => arg && arg.method && arg.url) || args[0];
      const user = req?.user || args.find(arg => arg && arg.id && arg.username);

      try {
        // Execute original method
        const result = await originalMethod.apply(this, args);

        // Log successful creation
        if (result && result.id) {
          await StockEntryLogger.logStockCreation(result, user, req, {
            controller: target.constructor.name,
            method: propertyKey,
            ...options.metadata
          });
        }

        return result;
      } catch (error) {
        // Log failed creation attempt
        await StockEntryLogger.logAction({
          actionType: "create",
          actionDescription: `Failed to create stock entry: ${error.message}`,
          stockEntryId: null,
          materialId: args.find(arg => arg?.materialId)?.materialId || null,
          userId: user?.id,
          userName: user?.fullName || user?.username,
          status: "failure",
          errorMessage: error.message,
          request: req,
          metadata: {
            controller: target.constructor.name,
            method: propertyKey,
            errorType: error.constructor.name,
            ...options.metadata
          }
        });

        throw error;
      }
    };

    return descriptor;
  };
}

/**
 * Decorator for stock entry updates/edits
 * @param {Object} options - Decorator options
 * @returns {Function} Decorator function
 */
export function logStockEdit(options = {}) {
  return function (target, propertyKey, descriptor) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args) {
      const req = args.find(arg => arg && arg.method && arg.url) || args[0];
      const user = req?.user || args.find(arg => arg && arg.id && arg.username);
      const stockEntryId = args.find(arg => typeof arg === "number") || args.find(arg => arg?.id)?.id || req?.params?.id;

      let originalStock = null;

      try {
        // Capture original state before modification
        if (stockEntryId && options.captureOriginal !== false) {
          const { StockEntry, Material } = await import("../models/index.js");
          originalStock = await StockEntry.findByPk(stockEntryId, {
            include: [{ model: Material, as: "material" }]
          });
        }

        // Execute original method
        const result = await originalMethod.apply(this, args);

        // Log successful edit
        if (result && originalStock) {
          await StockEntryLogger.logStockEdit(originalStock.toJSON(), result.toJSON ? result.toJSON() : result, user, req, {
            controller: target.constructor.name,
            method: propertyKey,
            ...options.metadata
          });
        }

        return result;
      } catch (error) {
        // Log failed edit attempt
        await StockEntryLogger.logAction({
          actionType: "edit",
          actionDescription: `Failed to edit stock entry: ${error.message}`,
          stockEntryId,
          materialId: originalStock?.materialId || null,
          userId: user?.id,
          userName: user?.fullName || user?.username,
          status: "failure",
          errorMessage: error.message,
          request: req,
          metadata: {
            controller: target.constructor.name,
            method: propertyKey,
            errorType: error.constructor.name,
            ...options.metadata
          }
        });

        throw error;
      }
    };

    return descriptor;
  };
}

/**
 * Decorator for adding stock to existing entries
 * @param {Object} options - Decorator options
 * @returns {Function} Decorator function
 */
export function logAddToStock(options = {}) {
  return function (target, propertyKey, descriptor) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args) {
      const req = args.find(arg => arg && arg.method && arg.url) || args[0];
      const user = req?.user || args.find(arg => arg && arg.id && arg.username);
      const stockEntryId = args.find(arg => typeof arg === "number") || args.find(arg => arg?.id)?.id || req?.params?.id;

      let originalStock = null;
      let addedQuantity = null;
      let addedUnit = null;

      try {
        // Capture original state and addition details
        if (stockEntryId && options.captureOriginal !== false) {
          const { StockEntry, Material } = await import("../models/index.js");
          originalStock = await StockEntry.findByPk(stockEntryId, {
            include: [{ model: Material, as: "material" }]
          });

          // Extract quantity and unit from request body or args
          const requestBody = req?.body || args.find(arg => arg?.quantity);
          addedQuantity = requestBody?.quantity || requestBody?.addedQuantity;
          addedUnit = requestBody?.unit || requestBody?.addedUnit || originalStock?.purchasedUnit;
        }

        // Execute original method
        const result = await originalMethod.apply(this, args);

        // Log successful stock addition
        if (result && originalStock) {
          await StockEntryLogger.logAddToStock(originalStock.toJSON(), result.toJSON ? result.toJSON() : result, addedQuantity, addedUnit, user, req, {
            controller: target.constructor.name,
            method: propertyKey,
            additionMethod: options.additionMethod || "manual",
            ...options.metadata
          });
        }

        return result;
      } catch (error) {
        // Log failed addition attempt
        await StockEntryLogger.logAction({
          actionType: "add_to_stock",
          actionDescription: `Failed to add stock: ${error.message}`,
          stockEntryId,
          materialId: originalStock?.materialId || null,
          userId: user?.id,
          userName: user?.fullName || user?.username,
          status: "failure",
          errorMessage: error.message,
          request: req,
          metadata: {
            controller: target.constructor.name,
            method: propertyKey,
            errorType: error.constructor.name,
            attemptedQuantity: addedQuantity,
            attemptedUnit: addedUnit,
            ...options.metadata
          }
        });

        throw error;
      }
    };

    return descriptor;
  };
}

/**
 * Decorator for recording waste from stock
 * @param {Object} options - Decorator options
 * @returns {Function} Decorator function
 */
export function logWasteFromStock(options = {}) {
  return function (target, propertyKey, descriptor) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args) {
      const req = args.find(arg => arg && arg.method && arg.url) || args[0];
      const user = req?.user || args.find(arg => arg && arg.id && arg.username);
      const stockEntryId = args.find(arg => typeof arg === "number") || args.find(arg => arg?.id)?.id || req?.params?.id;

      let originalStock = null;
      let wastedQuantity = null;
      let wastedUnit = null;
      let wasteReason = null;

      try {
        // Capture original state and waste details
        if (stockEntryId && options.captureOriginal !== false) {
          const { StockEntry, Material } = await import("../models/index.js");
          originalStock = await StockEntry.findByPk(stockEntryId, {
            include: [{ model: Material, as: "material" }]
          });

          // Extract waste details from request body or args
          const requestBody = req?.body || args.find(arg => arg?.quantity || arg?.wastedQuantity);
          wastedQuantity = requestBody?.quantity || requestBody?.wastedQuantity;
          wastedUnit = requestBody?.unit || requestBody?.wastedUnit || originalStock?.purchasedUnit;
          wasteReason = requestBody?.reason || requestBody?.wasteReason || "No reason provided";
        }

        // Execute original method
        const result = await originalMethod.apply(this, args);

        // Log successful waste recording
        if (result && originalStock) {
          await StockEntryLogger.logWasteFromStock(originalStock.toJSON(), result.toJSON ? result.toJSON() : result, wastedQuantity, wastedUnit, wasteReason, user, req, {
            controller: target.constructor.name,
            method: propertyKey,
            ...options.metadata
          });
        }

        return result;
      } catch (error) {
        // Log failed waste recording attempt
        await StockEntryLogger.logAction({
          actionType: "waste_from_stock",
          actionDescription: `Failed to record waste: ${error.message}`,
          stockEntryId,
          materialId: originalStock?.materialId || null,
          userId: user?.id,
          userName: user?.fullName || user?.username,
          status: "failure",
          errorMessage: error.message,
          reason: wasteReason,
          request: req,
          metadata: {
            controller: target.constructor.name,
            method: propertyKey,
            errorType: error.constructor.name,
            attemptedQuantity: wastedQuantity,
            attemptedUnit: wastedUnit,
            ...options.metadata
          }
        });

        throw error;
      }
    };

    return descriptor;
  };
}

/**
 * Decorator for stock entry deletion
 * @param {Object} options - Decorator options
 * @returns {Function} Decorator function
 */
export function logStockDeletion(options = {}) {
  return function (target, propertyKey, descriptor) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args) {
      const req = args.find(arg => arg && arg.method && arg.url) || args[0];
      const user = req?.user || args.find(arg => arg && arg.id && arg.username);
      const stockEntryId = args.find(arg => typeof arg === "number") || args.find(arg => arg?.id)?.id || req?.params?.id;

      let originalStock = null;
      let deletionReason = null;

      try {
        // Capture original state before deletion
        if (stockEntryId && options.captureOriginal !== false) {
          const { StockEntry, Material } = await import("../models/index.js");
          originalStock = await StockEntry.findByPk(stockEntryId, {
            include: [{ model: Material, as: "material" }]
          });

          // Extract deletion reason
          const requestBody = req?.body || args.find(arg => arg?.reason);
          deletionReason = requestBody?.reason || requestBody?.deletionReason || "No reason provided";
        }

        // Execute original method
        const result = await originalMethod.apply(this, args);

        // Log successful deletion
        if (originalStock) {
          await StockEntryLogger.logStockDeletion(originalStock.toJSON(), user, deletionReason, req, {
            controller: target.constructor.name,
            method: propertyKey,
            ...options.metadata
          });
        }

        return result;
      } catch (error) {
        // Log failed deletion attempt
        await StockEntryLogger.logAction({
          actionType: "delete_stock",
          actionDescription: `Failed to delete stock entry: ${error.message}`,
          stockEntryId,
          materialId: originalStock?.materialId || null,
          userId: user?.id,
          userName: user?.fullName || user?.username,
          status: "failure",
          errorMessage: error.message,
          reason: deletionReason,
          request: req,
          metadata: {
            controller: target.constructor.name,
            method: propertyKey,
            errorType: error.constructor.name,
            ...options.metadata
          }
        });

        throw error;
      }
    };

    return descriptor;
  };
}

/**
 * Decorator for POS visibility toggle
 * @param {Object} options - Decorator options
 * @returns {Function} Decorator function
 */
export function logPOSToggle(options = {}) {
  return function (target, propertyKey, descriptor) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args) {
      const req = args.find(arg => arg && arg.method && arg.url) || args[0];
      const user = req?.user || args.find(arg => arg && arg.id && arg.username);
      const stockEntryId = args.find(arg => typeof arg === "number") || args.find(arg => arg?.id)?.id || req?.params?.id;

      let originalStock = null;
      let previousPOSStatus = null;
      let newPOSStatus = null;

      try {
        // Capture original state
        if (stockEntryId && options.captureOriginal !== false) {
          const { StockEntry, Material } = await import("../models/index.js");
          originalStock = await StockEntry.findByPk(stockEntryId, {
            include: [{ model: Material, as: "material" }]
          });
          previousPOSStatus = originalStock?.isPOSItem;

          // Extract new POS status
          const requestBody = req?.body || args.find(arg => typeof arg?.isPOSItem === "boolean");
          newPOSStatus = requestBody?.isPOSItem;
        }

        // Execute original method
        const result = await originalMethod.apply(this, args);

        // Log successful POS toggle
        if (result && originalStock && previousPOSStatus !== newPOSStatus) {
          await StockEntryLogger.logPOSToggle(originalStock.toJSON(), previousPOSStatus, newPOSStatus, user, req, {
            controller: target.constructor.name,
            method: propertyKey,
            ...options.metadata
          });
        }

        return result;
      } catch (error) {
        // Log failed POS toggle attempt
        await StockEntryLogger.logAction({
          actionType: "pos_toggle",
          actionDescription: `Failed to toggle POS visibility: ${error.message}`,
          stockEntryId,
          materialId: originalStock?.materialId || null,
          userId: user?.id,
          userName: user?.fullName || user?.username,
          status: "failure",
          errorMessage: error.message,
          request: req,
          metadata: {
            controller: target.constructor.name,
            method: propertyKey,
            errorType: error.constructor.name,
            attemptedPOSStatus: newPOSStatus,
            ...options.metadata
          }
        });

        throw error;
      }
    };

    return descriptor;
  };
}

/**
 * Generic stock entry audit decorator
 * @param {string} actionType - Type of action being performed
 * @param {Object} options - Decorator options
 * @returns {Function} Decorator function
 */
export function auditStockEntry(actionType, options = {}) {
  return function (target, propertyKey, descriptor) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args) {
      const req = args.find(arg => arg && arg.method && arg.url) || args[0];
      const user = req?.user || args.find(arg => arg && arg.id && arg.username);

      try {
        // Execute original method
        const result = await originalMethod.apply(this, args);

        // Log action with basic information
        await StockEntryLogger.logAction({
          actionType,
          actionDescription: options.description || `Performed ${actionType} operation`,
          stockEntryId: result?.id || args.find(arg => typeof arg === "number"),
          materialId: result?.materialId || args.find(arg => arg?.materialId)?.materialId,
          userId: user?.id,
          userName: user?.fullName || user?.username,
          userRole: user?.role,
          status: "success",
          request: req,
          metadata: {
            controller: target.constructor.name,
            method: propertyKey,
            ...options.metadata
          }
        });

        return result;
      } catch (error) {
        // Log failed action
        await StockEntryLogger.logAction({
          actionType,
          actionDescription: `Failed ${actionType} operation: ${error.message}`,
          stockEntryId: args.find(arg => typeof arg === "number") || null,
          materialId: args.find(arg => arg?.materialId)?.materialId || null,
          userId: user?.id,
          userName: user?.fullName || user?.username,
          userRole: user?.role,
          status: "failure",
          errorMessage: error.message,
          request: req,
          metadata: {
            controller: target.constructor.name,
            method: propertyKey,
            errorType: error.constructor.name,
            ...options.metadata
          }
        });

        throw error;
      }
    };

    return descriptor;
  };
}

/**
 * Helper class for manual stock entry logging
 */
export class StockEntryAuditHelper {
  /**
   * Log stock entry action manually
   * @param {string} actionType - Type of action
   * @param {Object} stockData - Stock entry data
   * @param {Object} user - User performing action
   * @param {Object} request - HTTP request object
   * @param {Object} metadata - Additional metadata
   */
  static async logAction(actionType, stockData, user, request = null, metadata = {}) {
    return StockEntryLogger.logAction({
      actionType,
      actionDescription: metadata.description || `Manual ${actionType} operation`,
      stockEntryId: stockData.id,
      materialId: stockData.materialId,
      materialName: stockData.material?.name || stockData.materialName,
      materialCategory: stockData.material?.category || stockData.materialCategory,
      supplier: stockData.supplier,
      userId: user?.id,
      userName: user?.fullName || user?.username,
      userRole: user?.role,
      newValues: stockData,
      request,
      metadata: {
        manualLog: true,
        ...metadata
      }
    });
  }

  /**
   * Get stock entry history
   * @param {number} stockEntryId - Stock entry ID
   * @param {Object} options - Query options
   */
  static async getHistory(stockEntryId, options = {}) {
    return StockEntryLogger.getStockHistory(stockEntryId, options);
  }

  /**
   * Get material history across all stock entries
   * @param {number} materialId - Material ID
   * @param {Object} options - Query options
   */
  static async getMaterialHistory(materialId, options = {}) {
    return StockEntryLogger.getMaterialHistory(materialId, options);
  }

  /**
   * Get user activity summary
   * @param {number} userId - User ID
   * @param {Object} options - Query options
   */
  static async getUserActivity(userId, options = {}) {
    return StockEntryLogger.getUserActivity(userId, options);
  }
}

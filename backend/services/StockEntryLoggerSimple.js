import SystemLogs from "../models/StockEntryLogSimple.js";
import { Material } from "../models/index.js";
import { Op } from "sequelize";

/**
 * Simple Stock Entry Logger Service
 *
 * Simplified logging service using the working simple table structure
 */

class StockEntryLoggerSimple {
  constructor() {
    this.batchQueue = [];
    this.batchSize = 50;
    this.batchTimeout = 5000; // 5 seconds
    this.batchTimer = null;
  }

  /**
   * Log stock entry action with essential details
   * @param {Object} actionData - Action data to log
   * @returns {Promise<Object>} Log entry
   */
  async logAction(actionData) {
    try {
      // Enrich action data with additional context
      const enrichedData = await this._enrichActionData(actionData);

      // Validate required fields
      this._validateActionData(enrichedData);

      // Create log entry
      const logEntry = await SystemLogs.logAction(enrichedData);

      return logEntry;
    } catch (error) {
      console.error("Failed to log stock entry action:", error);
      throw error;
    }
  }

  /**
   * Log stock creation
   * @param {Object} stockEntry - Created stock entry
   * @param {Object} user - User who created the stock
   * @param {Object} request - HTTP request object
   * @param {Object} metadata - Additional metadata
   */
  async logStockCreation(stockEntry, user, request = null, metadata = {}) {
    return this.logAction({
      actionType: "create",
      actionDescription: `Created new stock entry for ${stockEntry.material?.name || "material"}`,
      stockEntryId: stockEntry.id,
      materialId: stockEntry.materialId,
      materialName: stockEntry.material?.name || "Unknown Material",
      userId: user?.id,
      userName: user?.fullName || user?.username,
      quantityDelta: stockEntry.purchasedQuantity,
      costDelta: stockEntry.totalCost,
      status: "success",
      request,
      metadata: {
        ...metadata,
        operationType: "stock_creation",
        initialStock: true
      }
    });
  }

  /**
   * Log stock editing/updates
   * @param {Object} originalStock - Original stock entry data
   * @param {Object} updatedStock - Updated stock entry data
   * @param {Object} user - User who made the update
   * @param {Object} request - HTTP request object
   * @param {Object} metadata - Additional metadata
   */
  async logStockEdit(originalStock, updatedStock, user, request = null, metadata = {}) {
    const quantityDelta = this._calculateQuantityDelta(originalStock, updatedStock);
    const costDelta = this._calculateCostDelta(originalStock, updatedStock);
    const changedFields = this._getChangedFields(originalStock, updatedStock);

    return this.logAction({
      actionType: "edit",
      actionDescription: `Edited stock entry for ${updatedStock.material?.name || "material"} - Changed: ${changedFields.join(", ")}`,
      stockEntryId: updatedStock.id,
      materialId: updatedStock.materialId,
      materialName: updatedStock.material?.name || originalStock.material?.name || "Unknown Material",
      userId: user?.id,
      userName: user?.fullName || user?.username,
      quantityDelta,
      costDelta,
      status: "success",
      request,
      metadata: {
        ...metadata,
        operationType: "stock_edit",
        changedFields,
        fieldCount: changedFields.length
      }
    });
  }

  /**
   * Log adding stock to existing entry
   * @param {Object} originalStock - Original stock entry data
   * @param {Object} updatedStock - Updated stock entry data after addition
   * @param {number} addedQuantity - Quantity added
   * @param {string} addedUnit - Unit of added quantity
   * @param {Object} user - User who added stock
   * @param {Object} request - HTTP request object
   * @param {Object} metadata - Additional metadata
   */
  async logAddToStock(originalStock, updatedStock, addedQuantity, addedUnit, user, request = null, metadata = {}) {
    const quantityDelta = this._calculateQuantityDelta(originalStock, updatedStock);
    const costDelta = this._calculateCostDelta(originalStock, updatedStock);

    return this.logAction({
      actionType: "add_to_stock",
      actionDescription: `Added ${addedQuantity} ${addedUnit} to stock entry for ${updatedStock.material?.name || "material"}`,
      stockEntryId: updatedStock.id,
      materialId: updatedStock.materialId,
      materialName: updatedStock.material?.name || "Unknown Material",
      userId: user?.id,
      userName: user?.fullName || user?.username,
      quantityDelta,
      costDelta,
      status: "success",
      request,
      metadata: {
        ...metadata,
        operationType: "stock_addition",
        addedQuantity,
        addedUnit,
        additionMethod: metadata.additionMethod || "manual"
      }
    });
  }

  /**
   * Log waste from stock
   * @param {Object} originalStock - Original stock entry data
   * @param {Object} updatedStock - Updated stock entry data after waste
   * @param {number} wastedQuantity - Quantity wasted
   * @param {string} wastedUnit - Unit of wasted quantity
   * @param {string} reason - Reason for waste
   * @param {Object} user - User who recorded waste
   * @param {Object} request - HTTP request object
   * @param {Object} metadata - Additional metadata
   */
  async logWasteFromStock(originalStock, updatedStock, wastedQuantity, wastedUnit, reason, user, request = null, metadata = {}) {
    // For waste operations, record the actual wasted quantity and cost as negative values
    // Calculate the cost of the wasted quantity
    const costPerUnit = parseFloat(updatedStock.costPerBaseUnit) || 0;
    const wastedCost = Math.abs(wastedQuantity) * costPerUnit;
    
    // Record as negative values to show reduction in stock
    const quantityDelta = -Math.abs(wastedQuantity);
    const costDelta = -wastedCost;

    return this.logAction({
      actionType: "waste_from_stock",
      actionDescription: `Recorded waste of ${Math.abs(wastedQuantity)} ${wastedUnit} from stock entry for ${updatedStock.material?.name || "material"} - Reason: ${reason}`,
      stockEntryId: updatedStock.id,
      materialId: updatedStock.materialId,
      materialName: updatedStock.material?.name || "Unknown Material",
      userId: user?.id,
      userName: user?.fullName || user?.username,
      quantityDelta,
      costDelta,
      status: "success",
      request,
      metadata: {
        ...metadata,
        operationType: "stock_waste",
        wastedQuantity: Math.abs(wastedQuantity),
        wastedUnit,
        wasteReason: reason,
        wasteCategory: this._categorizeWasteReason(reason),
        costPerUnit,
        totalWastedCost: wastedCost
      }
    });
  }

  /**
   * Log stock deletion
   * @param {Object} stockEntry - Stock entry being deleted
   * @param {Object} user - User who deleted the stock
   * @param {string} reason - Reason for deletion
   * @param {Object} request - HTTP request object
   * @param {Object} metadata - Additional metadata
   */
  async logStockDeletion(stockEntry, user, reason, request = null, metadata = {}) {
    return this.logAction({
      actionType: "delete_stock",
      actionDescription: `Deleted stock entry for ${stockEntry.material?.name || "material"} - Reason: ${reason}`,
      stockEntryId: stockEntry.id,
      materialId: stockEntry.materialId,
      materialName: stockEntry.material?.name || "Unknown Material",
      userId: user?.id,
      userName: user?.fullName || user?.username,
      quantityDelta: -stockEntry.purchasedQuantity,
      costDelta: -stockEntry.totalCost,
      status: "success",
      request,
      metadata: {
        ...metadata,
        operationType: "stock_deletion",
        deletionReason: reason,
        deletedValue: stockEntry.totalCost
      }
    });
  }

  /**
   * Log POS visibility toggle
   * @param {Object} stockEntry - Stock entry being modified
   * @param {boolean} previousPOSStatus - Previous POS visibility status
   * @param {boolean} newPOSStatus - New POS visibility status
   * @param {Object} user - User who made the change
   * @param {Object} request - HTTP request object
   * @param {Object} metadata - Additional metadata
   */
  async logPOSToggle(stockEntry, previousPOSStatus, newPOSStatus, user, request = null, metadata = {}) {
    return this.logAction({
      actionType: "pos_toggle",
      actionDescription: `${newPOSStatus ? "Enabled" : "Disabled"} POS visibility for ${stockEntry.material?.name || "material"}`,
      stockEntryId: stockEntry.id,
      materialId: stockEntry.materialId,
      materialName: stockEntry.material?.name || "Unknown Material",
      userId: user?.id,
      userName: user?.fullName || user?.username,
      quantityDelta: 0,
      costDelta: 0,
      status: "success",
      request,
      metadata: {
        ...metadata,
        operationType: "pos_visibility_change",
        previousPOSStatus,
        newPOSStatus,
        visibilityChange: newPOSStatus ? "enabled" : "disabled"
      }
    });
  }

  /**
   * Log failed operations
   * @param {Object} actionData - Action data
   * @param {Error} error - Error that occurred
   */
  async logFailure(actionData, error) {
    try {
      return this.logAction({
        ...actionData,
        status: "failure",
        errorMessage: error.message,
        actionDescription: `${actionData.actionDescription || actionData.actionType} - FAILED: ${error.message}`
      });
    } catch (logError) {
      console.error("Failed to log failure:", logError);
    }
  }

  /**
   * Enrich action data with additional context
   * @param {Object} actionData - Original action data
   * @returns {Object} Enriched action data
   */
  async _enrichActionData(actionData) {
    const enriched = { ...actionData };

    // Extract minimal request information
    if (actionData.request) {
      const req = actionData.request;
      enriched.sessionId = req.sessionID || req.session?.id;
    }

    // Fetch material information if not provided
    if (!enriched.materialName && enriched.materialId) {
      try {
        const material = await Material.findByPk(enriched.materialId);
        if (material) {
          enriched.materialName = material.name;
        }
      } catch (error) {
        console.warn("Failed to fetch material information:", error);
      }
    }

    // Set timestamp if not provided
    if (!enriched.actionTimestamp) {
      enriched.actionTimestamp = new Date();
    }

    return enriched;
  }

  /**
   * Validate required action data fields
   * @param {Object} actionData - Action data to validate
   */
  _validateActionData(actionData) {
    const required = ["actionType", "stockEntryId", "materialId"];

    for (const field of required) {
      if (!actionData[field]) {
        throw new Error(`Required field '${field}' is missing from action data`);
      }
    }

    // Validate action type
    const validActionTypes = ["create", "edit", "add_to_stock", "waste_from_stock", "delete_stock", "adjust_quantity", "transfer_stock", "pos_toggle", "cost_update", "bulk_operation", "system_correction"];

    if (!validActionTypes.includes(actionData.actionType)) {
      throw new Error(`Invalid action type: ${actionData.actionType}`);
    }
  }

  /**
   * Calculate quantity delta between two stock entries
   * @param {Object} originalStock - Original stock data
   * @param {Object} updatedStock - Updated stock data
   * @returns {number} Quantity delta
   */
  _calculateQuantityDelta(originalStock, updatedStock) {
    const prev = parseFloat(originalStock.purchasedQuantity) || 0;
    const curr = parseFloat(updatedStock.purchasedQuantity) || 0;
    return curr - prev;
  }

  /**
   * Calculate cost delta between two stock entries
   * @param {Object} originalStock - Original stock data
   * @param {Object} updatedStock - Updated stock data
   * @returns {number} Cost delta
   */
  _calculateCostDelta(originalStock, updatedStock) {
    const prev = parseFloat(originalStock.totalCost) || 0;
    const curr = parseFloat(updatedStock.totalCost) || 0;
    return curr - prev;
  }

  /**
   * Get changed fields between two objects
   * @param {Object} original - Original object
   * @param {Object} updated - Updated object
   * @returns {Array} Array of changed field names
   */
  _getChangedFields(original, updated) {
    const changed = [];
    const fieldsToCheck = ["supplier", "purchasedQuantity", "purchasedUnit", "purchasedIndividualQuantity", "purchasedIndividualUnit", "totalCost", "costPerPurchasedUnit", "costPerBaseUnit", "isPOSItem"];

    fieldsToCheck.forEach(field => {
      if (original[field] !== updated[field]) {
        changed.push(field);
      }
    });

    return changed;
  }

  /**
   * Categorize waste reason
   * @param {string} reason - Waste reason
   * @returns {string} Waste category
   */
  _categorizeWasteReason(reason) {
    if (!reason) return "unknown";

    const lowerReason = reason.toLowerCase();

    if (lowerReason.includes("expire") || lowerReason.includes("spoil")) {
      return "expiration";
    }
    if (lowerReason.includes("damage") || lowerReason.includes("broken")) {
      return "damage";
    }
    if (lowerReason.includes("contamina")) {
      return "contamination";
    }
    if (lowerReason.includes("theft") || lowerReason.includes("missing")) {
      return "loss";
    }
    if (lowerReason.includes("quality") || lowerReason.includes("defect")) {
      return "quality_issue";
    }

    return "other";
  }

  /**
   * Get stock entry history
   * @param {number} stockEntryId - Stock entry ID
   * @param {Object} options - Query options
   * @returns {Promise<Array>} History records
   */
  async getStockHistory(stockEntryId, options = {}) {
    const { limit = 50, offset = 0, actionTypes = null } = options;

    let whereClause = { stockEntryId };

    if (actionTypes && actionTypes.length > 0) {
      whereClause.actionType = actionTypes;
    }

    return await SystemLogs.findAll({
      where: whereClause,
      order: [["actionTimestamp", "DESC"]],
      limit,
      offset
    });
  }

  /**
   * Get material history across all stock entries
   * @param {number} materialId - Material ID
   * @param {Object} options - Query options
   * @returns {Promise<Array>} History records
   */
  async getMaterialHistory(materialId, options = {}) {
    const { limit = 100, actionTypes = null, startDate, endDate } = options;

    // Build where clause
    let whereClause = { materialId };

    if (actionTypes && actionTypes.length > 0) {
      whereClause.actionType = actionTypes;
    }

    // Add date filtering if provided
    if (startDate && endDate) {
      whereClause.actionTimestamp = {
        [Op.between]: [new Date(startDate), new Date(endDate)]
      };
    } else if (startDate) {
      whereClause.actionTimestamp = {
        [Op.gte]: new Date(startDate)
      };
    } else if (endDate) {
      whereClause.actionTimestamp = {
        [Op.lte]: new Date(endDate)
      };
    }

    return await SystemLogs.findAll({
      where: whereClause,
      order: [["actionTimestamp", "DESC"]],
      limit,
      attributes: [
        "id", 
        "actionType", 
        "actionTimestamp", 
        "stockEntryId",
        "materialId",
        "materialName",
        "userId",
        "userName", 
        "quantityDelta", 
        "costDelta", 
        "status",
        "actionDescription"
      ]
    });
  }

  /**
   * Get user activity summary
   * @param {number} userId - User ID
   * @param {Object} options - Query options
   * @returns {Promise<Array>} Activity records
   */
  async getUserActivity(userId, options = {}) {
    const { limit = 50, startDate, endDate } = options;

    // Build where clause
    const whereClause = { userId };
    
    // Add date filtering if provided
    if (startDate && endDate) {
      whereClause.actionTimestamp = {
        [Op.between]: [new Date(startDate), new Date(endDate)]
      };
    } else if (startDate) {
      whereClause.actionTimestamp = {
        [Op.gte]: new Date(startDate)
      };
    } else if (endDate) {
      whereClause.actionTimestamp = {
        [Op.lte]: new Date(endDate)
      };
    }

    return await SystemLogs.findAll({
      where: whereClause,
      order: [["actionTimestamp", "DESC"]],
      limit,
      attributes: [
        "id", 
        "actionType", 
        "actionTimestamp", 
        "stockEntryId",
        "materialId",
        "materialName", 
        "userId",
        "userName",
        "quantityDelta", 
        "costDelta",
        "status",
        "actionDescription"
      ]
    });
  }
}

// Export singleton instance
export default new StockEntryLoggerSimple();

// Export class for custom instances
export { StockEntryLoggerSimple };

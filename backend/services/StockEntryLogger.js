import StockEntryLog from "../models/StockEntryLog.js";
import { Material } from "../models/index.js";

/**
 * Stock Entry Logger Service
 *
 * Specialized service for logging all stock entry operations with
 * comprehensive tracking and detailed metadata capture.
 */

class StockEntryLogger {
  constructor() {
    this.batchQueue = [];
    this.batchSize = 50;
    this.batchTimeout = 5000; // 5 seconds
    this.batchTimer = null;
    this.isProcessing = false;
  }

  /**
   * Log stock entry action with comprehensive details
   * @param {Object} actionData - Action data to log
   * @returns {Promise<Object>} Log entry
   */
  async logAction(actionData) {
    try {
      // Enrich action data with additional context
      const enrichedData = await this._enrichActionData(actionData);

      // Validate required fields
      this._validateActionData(enrichedData);

      // Calculate deltas if previous and new values are provided
      if (enrichedData.previousValues && enrichedData.newValues) {
        enrichedData.quantityDelta = this._calculateQuantityDelta(enrichedData.previousValues, enrichedData.newValues);
        enrichedData.individualQuantityDelta = this._calculateIndividualQuantityDelta(enrichedData.previousValues, enrichedData.newValues);
        enrichedData.costDelta = this._calculateCostDelta(enrichedData.previousValues, enrichedData.newValues);
      }

      // Determine business impact
      enrichedData.businessImpact = this._assessBusinessImpact(enrichedData);

      // Calculate financial impact
      enrichedData.financialImpact = this._calculateFinancialImpact(enrichedData);

      // Set compliance relevance
      enrichedData.complianceRelevant = this._isComplianceRelevant(enrichedData);

      // Create log entry
      const logEntry = await StockEntryLog.logStockAction(enrichedData);

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
      materialCategory: stockEntry.material?.category,
      supplier: stockEntry.supplier,
      userId: user?.id,
      userName: user?.fullName || user?.username,
      userRole: user?.role,
      newValues: this._sanitizeStockData(stockEntry),
      newQuantity: stockEntry.purchasedQuantity,
      newIndividualQuantity: stockEntry.purchasedIndividualQuantity,
      newTotalCost: stockEntry.totalCost,
      purchasedUnit: stockEntry.purchasedUnit,
      individualUnit: stockEntry.purchasedIndividualUnit,
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
    const changedFields = this._getChangedFields(originalStock, updatedStock);

    return this.logAction({
      actionType: "edit",
      actionDescription: `Edited stock entry for ${updatedStock.material?.name || "material"} - Changed: ${changedFields.join(", ")}`,
      stockEntryId: updatedStock.id,
      materialId: updatedStock.materialId,
      materialName: updatedStock.material?.name || originalStock.material?.name || "Unknown Material",
      materialCategory: updatedStock.material?.category || originalStock.material?.category,
      supplier: updatedStock.supplier,
      userId: user?.id,
      userName: user?.fullName || user?.username,
      userRole: user?.role,
      previousValues: this._sanitizeStockData(originalStock),
      newValues: this._sanitizeStockData(updatedStock),
      previousQuantity: originalStock.purchasedQuantity,
      newQuantity: updatedStock.purchasedQuantity,
      previousIndividualQuantity: originalStock.purchasedIndividualQuantity,
      newIndividualQuantity: updatedStock.purchasedIndividualQuantity,
      previousTotalCost: originalStock.totalCost,
      newTotalCost: updatedStock.totalCost,
      purchasedUnit: updatedStock.purchasedUnit,
      individualUnit: updatedStock.purchasedIndividualUnit,
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
    return this.logAction({
      actionType: "add_to_stock",
      actionDescription: `Added ${addedQuantity} ${addedUnit} to stock entry for ${updatedStock.material?.name || "material"}`,
      stockEntryId: updatedStock.id,
      materialId: updatedStock.materialId,
      materialName: updatedStock.material?.name || "Unknown Material",
      materialCategory: updatedStock.material?.category,
      supplier: updatedStock.supplier,
      userId: user?.id,
      userName: user?.fullName || user?.username,
      userRole: user?.role,
      previousValues: this._sanitizeStockData(originalStock),
      newValues: this._sanitizeStockData(updatedStock),
      previousQuantity: originalStock.purchasedQuantity,
      newQuantity: updatedStock.purchasedQuantity,
      previousIndividualQuantity: originalStock.purchasedIndividualQuantity,
      newIndividualQuantity: updatedStock.purchasedIndividualQuantity,
      previousTotalCost: originalStock.totalCost,
      newTotalCost: updatedStock.totalCost,
      purchasedUnit: updatedStock.purchasedUnit,
      individualUnit: updatedStock.purchasedIndividualUnit,
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
    return this.logAction({
      actionType: "waste_from_stock",
      actionDescription: `Recorded waste of ${Math.abs(wastedQuantity)} ${wastedUnit} from stock entry for ${updatedStock.material?.name || "material"}`,
      stockEntryId: updatedStock.id,
      materialId: updatedStock.materialId,
      materialName: updatedStock.material?.name || "Unknown Material",
      materialCategory: updatedStock.material?.category,
      supplier: updatedStock.supplier,
      userId: user?.id,
      userName: user?.fullName || user?.username,
      userRole: user?.role,
      previousValues: this._sanitizeStockData(originalStock),
      newValues: this._sanitizeStockData(updatedStock),
      previousQuantity: originalStock.purchasedQuantity,
      newQuantity: updatedStock.purchasedQuantity,
      previousIndividualQuantity: originalStock.purchasedIndividualQuantity,
      newIndividualQuantity: updatedStock.purchasedIndividualQuantity,
      previousTotalCost: originalStock.totalCost,
      newTotalCost: updatedStock.totalCost,
      purchasedUnit: updatedStock.purchasedUnit,
      individualUnit: updatedStock.purchasedIndividualUnit,
      reason,
      request,
      metadata: {
        ...metadata,
        operationType: "stock_waste",
        wastedQuantity: Math.abs(wastedQuantity),
        wastedUnit,
        wasteReason: reason,
        wasteCategory: this._categorizeWasteReason(reason)
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
      actionDescription: `Deleted stock entry for ${stockEntry.material?.name || "material"}`,
      stockEntryId: stockEntry.id,
      materialId: stockEntry.materialId,
      materialName: stockEntry.material?.name || "Unknown Material",
      materialCategory: stockEntry.material?.category,
      supplier: stockEntry.supplier,
      userId: user?.id,
      userName: user?.fullName || user?.username,
      userRole: user?.role,
      previousValues: this._sanitizeStockData(stockEntry),
      previousQuantity: stockEntry.purchasedQuantity,
      previousIndividualQuantity: stockEntry.purchasedIndividualQuantity,
      previousTotalCost: stockEntry.totalCost,
      purchasedUnit: stockEntry.purchasedUnit,
      individualUnit: stockEntry.purchasedIndividualUnit,
      reason,
      request,
      metadata: {
        ...metadata,
        operationType: "stock_deletion",
        deletionReason: reason,
        deletedValue: stockEntry.totalCost,
        requiresApproval: true
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
      materialCategory: stockEntry.material?.category,
      supplier: stockEntry.supplier,
      userId: user?.id,
      userName: user?.fullName || user?.username,
      userRole: user?.role,
      previousValues: { isPOSItem: previousPOSStatus },
      newValues: { isPOSItem: newPOSStatus },
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
   * Log bulk operations
   * @param {Array} operations - Array of operation data
   * @param {Object} user - User who performed bulk operation
   * @param {string} batchId - Unique batch identifier
   * @param {Object} request - HTTP request object
   * @param {Object} metadata - Additional metadata
   */
  async logBulkOperation(operations, user, batchId, request = null, metadata = {}) {
    const logPromises = operations.map(operation =>
      this.logAction({
        ...operation,
        userId: user?.id,
        userName: user?.fullName || user?.username,
        userRole: user?.role,
        batchId,
        request,
        metadata: {
          ...metadata,
          ...operation.metadata,
          operationType: "bulk_operation",
          batchSize: operations.length,
          bulkOperation: true
        }
      })
    );

    return Promise.all(logPromises);
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
          enriched.materialCategory = material.category;
        }
      } catch (error) {
        console.warn("Failed to fetch material information:", error);
      }
    }

    // Set timestamp if not provided
    if (!enriched.actionTimestamp) {
      enriched.actionTimestamp = new Date();
    }

    // Generate correlation ID if not provided
    if (!enriched.correlationId) {
      enriched.correlationId = `stock_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
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
   * Calculate quantity delta between previous and new values
   * @param {Object} previousValues - Previous stock datas
   * @param {Object} newValues - New stock data
   * @returns {number} Quantity delta
   */
  _calculateQuantityDelta(previousValues, newValues) {
    const prev = parseFloat(previousValues.purchasedQuantity) || 0;
    const curr = parseFloat(newValues.purchasedQuantity) || 0;
    return curr - prev;
  }

  /**
   * Calculate individual quantity delta
   * @param {Object} previousValues - Previous stock data
   * @param {Object} newValues - New stock data
   * @returns {number} Individual quantity delta
   */
  _calculateIndividualQuantityDelta(previousValues, newValues) {
    const prev = parseFloat(previousValues.purchasedIndividualQuantity) || 0;
    const curr = parseFloat(newValues.purchasedIndividualQuantity) || 0;
    return curr - prev;
  }

  /**
   * Calculate cost delta
   * @param {Object} previousValues - Previous stock data
   * @param {Object} newValues - New stock data
   * @returns {number} Cost delta
   */
  _calculateCostDelta(previousValues, newValues) {
    const prev = parseFloat(previousValues.totalCost) || 0;
    const curr = parseFloat(newValues.totalCost) || 0;
    return curr - prev;
  }

  /**
   * Assess business impact of the action
   * @param {Object} actionData - Action data
   * @returns {string} Business impact level
   */
  _assessBusinessImpact(actionData) {
    const { actionType, costDelta, quantityDelta } = actionData;

    // High impact actions
    if (["delete_stock", "waste_from_stock"].includes(actionType)) {
      return "high";
    }

    // Critical impact for large financial changes
    if (Math.abs(costDelta || 0) > 1000) {
      return "critical";
    }

    // Medium impact for significant changes
    if (Math.abs(costDelta || 0) > 100 || Math.abs(quantityDelta || 0) > 50) {
      return "medium";
    }

    return "low";
  }

  /**
   * Calculate financial impact
   * @param {Object} actionData - Action data
   * @returns {number} Financial impact amount
   */
  _calculateFinancialImpact(actionData) {
    const { actionType, costDelta, newTotalCost, previousTotalCost } = actionData;

    if (actionType === "delete_stock") {
      return -(parseFloat(previousTotalCost) || 0);
    }

    if (actionType === "waste_from_stock") {
      // Calculate value of wasted stock
      const wastedValue = Math.abs(costDelta || 0);
      return -wastedValue;
    }

    return costDelta || 0;
  }

  /**
   * Determine if action is compliance relevant
   * @param {Object} actionData - Action data
   * @returns {boolean} Whether action is compliance relevant
   */
  _isComplianceRelevant(actionData) {
    const { actionType, businessImpact, financialImpact } = actionData;

    // High impact actions are always compliance relevant
    if (["high", "critical"].includes(businessImpact)) {
      return true;
    }

    // Financial impact above threshold
    if (Math.abs(financialImpact || 0) > 500) {
      return true;
    }

    // Specific action types
    const complianceActions = ["delete_stock", "waste_from_stock", "adjust_quantity"];
    return complianceActions.includes(actionType);
  }

  /**
   * Sanitize stock data for logging
   * @param {Object} stockData - Stock entry data
   * @returns {Object} Sanitized data
   */
  _sanitizeStockData(stockData) {
    if (!stockData) return null;

    const sanitized = {
      id: stockData.id,
      materialId: stockData.materialId,
      supplier: stockData.supplier,
      purchasedQuantity: stockData.purchasedQuantity,
      purchasedUnit: stockData.purchasedUnit,
      purchasedIndividualQuantity: stockData.purchasedIndividualQuantity,
      purchasedIndividualUnit: stockData.purchasedIndividualUnit,
      totalCost: stockData.totalCost,
      costPerPurchasedUnit: stockData.costPerPurchasedUnit,
      costPerBaseUnit: stockData.costPerBaseUnit,
      isPOSItem: stockData.isPOSItem,
      createdAt: stockData.createdAt,
      updatedAt: stockData.updatedAt
    };

    // Include material data if available
    if (stockData.material) {
      sanitized.material = {
        id: stockData.material.id,
        name: stockData.material.name,
        category: stockData.material.category,
        baseUnit: stockData.material.baseUnit,
        unitType: stockData.material.unitType
      };
    }

    return sanitized;
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
    return StockEntryLog.getStockHistory(stockEntryId, options);
  }

  /**
   * Get material history across all stock entries
   * @param {number} materialId - Material ID
   * @param {Object} options - Query options
   * @returns {Promise<Array>} History records
   */
  async getMaterialHistory(materialId, options = {}) {
    return StockEntryLog.getMaterialHistory(materialId, options);
  }

  /**
   * Get user activity summary
   * @param {number} userId - User ID
   * @param {Object} options - Query options
   * @returns {Promise<Array>} Activity records
   */
  async getUserActivity(userId, options = {}) {
    return StockEntryLog.getUserActivity(userId, options);
  }

  /**
   * Get action summary statistics
   * @param {Object} options - Query options
   * @returns {Promise<Array>} Summary statistics
   */
  async getActionSummary(options = {}) {
    return StockEntryLog.getActionSummary(options);
  }
}

// Export singleton instance
export default new StockEntryLogger();

// Export class for custom instances
export { StockEntryLogger };

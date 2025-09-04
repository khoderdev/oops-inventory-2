import SystemLogs from "../models/StockEntryLogSimple.js";
import { Material } from "../models/index.js";
import { Op } from "sequelize";

class StockEntryLoggerSimple {
  constructor() {
    this.batchQueue = [];
    this.batchSize = 50;
    this.batchTimeout = 5000;
    this.batchTimer = null;
  }

  async logAction(actionData, transaction = null) {
    try {
      const enrichedData = await this._enrichActionData(actionData);
      this._validateActionData(enrichedData);
      const logEntry = await SystemLogs.logAction(enrichedData, transaction);
      return logEntry;
    } catch (error) {
      console.error("Failed to log stock entry action:", error);
      throw error;
    }
  }

  async logStockCreation(stockEntry, user, request = null, metadata = {}, transaction = null) {
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

  async logStockEdit(originalStock, updatedStock, user, request = null, metadata = {}, transaction = null) {
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

  async logAddToStock(originalStock, updatedStock, addedQuantity, addedUnit, user, request = null, metadata = {}, transaction = null) {
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

  async logWasteFromStock(originalStock, updatedStock, wastedQuantity, wastedUnit, reason, user, request = null, metadata = {}, transaction = null) {
    const costPerUnit = parseFloat(updatedStock.costPerBaseUnit) || 0;
    const wastedCost = Math.abs(wastedQuantity) * costPerUnit;
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

  async logStockDeletion(stockEntry, user, reason, request = null, metadata = {}, transaction = null) {
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

  async logPOSToggle(stockEntry, previousPOSStatus, newPOSStatus, user, request = null, metadata = {}, transaction = null) {
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

  async _enrichActionData(actionData) {
    const enriched = { ...actionData };
    if (actionData.request) {
      const req = actionData.request;
      enriched.sessionId = req.sessionID || req.session?.id;
    }
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
    if (!enriched.actionTimestamp) {
      enriched.actionTimestamp = new Date();
    }
    return enriched;
  }

  _validateActionData(actionData) {
    const required = ["actionType", "stockEntryId", "materialId"];
    for (const field of required) {
      if (!actionData[field]) {
        throw new Error(`Required field '${field}' is missing from action data`);
      }
    }
    const validActionTypes = ["create", "edit", "add_to_stock", "waste_from_stock", "delete_stock", "adjust_quantity", "transfer_stock", "pos_toggle", "cost_update", "bulk_operation", "system_correction"];
    if (!validActionTypes.includes(actionData.actionType)) {
      throw new Error(`Invalid action type: ${actionData.actionType}`);
    }
  }

  _calculateQuantityDelta(originalStock, updatedStock) {
    const prev = parseFloat(originalStock.purchasedQuantity) || 0;
    const curr = parseFloat(updatedStock.purchasedQuantity) || 0;
    return curr - prev;
  }

  _calculateCostDelta(originalStock, updatedStock) {
    const prev = parseFloat(originalStock.totalCost) || 0;
    const curr = parseFloat(updatedStock.totalCost) || 0;
    return curr - prev;
  }

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

  async getMaterialHistory(materialId, options = {}) {
    const { limit = 100, actionTypes = null, startDate, endDate } = options;
    let whereClause = { materialId };
    if (actionTypes && actionTypes.length > 0) {
      whereClause.actionType = actionTypes;
    }
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
      attributes: ["id", "actionType", "actionTimestamp", "stockEntryId", "materialId", "materialName", "userId", "userName", "quantityDelta", "costDelta", "status", "actionDescription"]
    });
  }

  async getUserActivity(userId, options = {}) {
    const { limit = 50, startDate, endDate } = options;
    const whereClause = { userId };
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
      attributes: ["id", "actionType", "actionTimestamp", "stockEntryId", "materialId", "materialName", "userId", "userName", "quantityDelta", "costDelta", "status", "actionDescription"]
    });
  }
}
export default new StockEntryLoggerSimple();
export { StockEntryLoggerSimple };

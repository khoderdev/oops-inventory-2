import StockEntryLoggerSimple from '../services/StockEntryLoggerSimple.js';

export class StockEntryAuditHelperSimple {

  static async logAction(actionType, stockData, user, request = null, metadata = {}, transaction = null) {
    return StockEntryLoggerSimple.logAction({
      actionType,
      actionDescription: metadata.description || `Manual ${actionType} operation`,
      stockEntryId: stockData.id,
      materialId: stockData.materialId,
      materialName: stockData.material?.name || stockData.materialName,
      userId: user?.id,
      userName: user?.fullName || user?.username,
      quantityDelta: metadata.quantityDelta || 0,
      costDelta: metadata.costDelta || 0,
      status: 'success',
      request,
      metadata: {
        manualLog: true,
        ...metadata
      }
    });
  }

  static async logStockCreation(stockEntry, user, request = null, metadata = {}, transaction = null) {
    return StockEntryLoggerSimple.logStockCreation(stockEntry, user, request, metadata, transaction);
  }

  static async logStockEdit(originalStock, updatedStock, user, request = null, metadata = {}, transaction = null) {
    return StockEntryLoggerSimple.logStockEdit(originalStock, updatedStock, user, request, metadata, transaction);
  }

  static async logAddToStock(originalStock, updatedStock, addedQuantity, addedUnit, user, request = null, metadata = {}, transaction = null) {
    return StockEntryLoggerSimple.logAddToStock(originalStock, updatedStock, addedQuantity, addedUnit, user, request, metadata, transaction);
  }

  static async logWasteFromStock(originalStock, updatedStock, wastedQuantity, wastedUnit, reason, user, request = null, metadata = {}, transaction = null) {
    return StockEntryLoggerSimple.logWasteFromStock(originalStock, updatedStock, wastedQuantity, wastedUnit, reason, user, request, metadata, transaction);
  }

  static async logStockDeletion(stockEntry, user, reason, request = null, metadata = {}, transaction = null) {
    return StockEntryLoggerSimple.logStockDeletion(stockEntry, user, reason, request, metadata, transaction);
  }

  static async logPOSToggle(stockEntry, previousPOSStatus, newPOSStatus, user, request = null, metadata = {}, transaction = null) {
    return StockEntryLoggerSimple.logPOSToggle(stockEntry, previousPOSStatus, newPOSStatus, user, request, metadata, transaction);
  }

  static async logFailure(actionData, error) {
    return StockEntryLoggerSimple.logFailure(actionData, error);
  }

  static async getHistory(stockEntryId, options = {}) {
    return StockEntryLoggerSimple.getStockHistory(stockEntryId, options);
  }

  static async getMaterialHistory(materialId, options = {}) {
    return StockEntryLoggerSimple.getMaterialHistory(materialId, options);
  }

  static async getUserActivity(userId, options = {}) {
    return StockEntryLoggerSimple.getUserActivity(userId, options);
  }
}

export async function logStockCreation(stockEntry, user, request = null) {
  try {
    await StockEntryAuditHelperSimple.logStockCreation(stockEntry, user, request, {
      source: 'controller',
      category: 'stock_creation'
    });
  } catch (error) {
    console.error('Failed to log stock creation:', error);
  }
}

export async function logStockEdit(originalStock, updatedStock, user, request = null) {
  try {
    await StockEntryAuditHelperSimple.logStockEdit(originalStock, updatedStock, user, request, {
      source: 'controller',
      category: 'stock_edit'
    });
  } catch (error) {
    console.error('Failed to log stock edit:', error);
  }
}

export async function logAddToStock(originalStock, updatedStock, addedQuantity, addedUnit, user, request = null) {
  try {
    await StockEntryAuditHelperSimple.logAddToStock(originalStock, updatedStock, addedQuantity, addedUnit, user, request, {
      source: 'controller',
      category: 'stock_addition'
    });
  } catch (error) {
    console.error('Failed to log stock addition:', error);
  }
}

export async function logWasteFromStock(originalStock, updatedStock, wastedQuantity, wastedUnit, reason, user, request = null) {
  try {
    await StockEntryAuditHelperSimple.logWasteFromStock(originalStock, updatedStock, wastedQuantity, wastedUnit, reason, user, request, {
      source: 'controller',
      category: 'stock_waste'
    });
  } catch (error) {
    console.error('Failed to log stock waste:', error);
  }
}

export async function logStockDeletion(stockEntry, user, reason, request = null) {
  try {
    await StockEntryAuditHelperSimple.logStockDeletion(stockEntry, user, reason, request, {
      source: 'controller',
      category: 'stock_deletion'
    });
  } catch (error) {
    console.error('Failed to log stock deletion:', error);
  }
}

export async function logPOSToggle(stockEntry, previousPOSStatus, newPOSStatus, user, request = null) {
  try {
    await StockEntryAuditHelperSimple.logPOSToggle(stockEntry, previousPOSStatus, newPOSStatus, user, request, {
      source: 'controller',
      category: 'pos_toggle'
    });
  } catch (error) {
    console.error('Failed to log POS toggle:', error);
  }
}

export async function logCustomAction(actionType, stockData, user, request = null, metadata = {}) {
  try {
    await StockEntryAuditHelperSimple.logAction(actionType, stockData, user, request, {
      source: 'controller',
      category: 'custom_action',
      ...metadata
    });
  } catch (error) {
    console.error('Failed to log custom action:', error);
  }
}

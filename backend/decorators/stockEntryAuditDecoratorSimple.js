import StockEntryLoggerSimple from '../services/StockEntryLoggerSimple.js';

/**
 * Simple Stock Entry Audit Decorators
 * 
 * Simplified decorators for automatic stock entry logging
 * using the working simple table structure.
 */

/**
 * Helper class for manual stock entry logging
 */
export class StockEntryAuditHelperSimple {
  /**
   * Log stock entry action manually
   * @param {string} actionType - Type of action
   * @param {Object} stockData - Stock entry data
   * @param {Object} user - User performing action
   * @param {Object} request - HTTP request object
   * @param {Object} metadata - Additional metadata
   */
  static async logAction(actionType, stockData, user, request = null, metadata = {}) {
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

  /**
   * Log stock creation
   * @param {Object} stockEntry - Created stock entry
   * @param {Object} user - User who created the stock
   * @param {Object} request - HTTP request object
   * @param {Object} metadata - Additional metadata
   */
  static async logStockCreation(stockEntry, user, request = null, metadata = {}) {
    return StockEntryLoggerSimple.logStockCreation(stockEntry, user, request, metadata);
  }

  /**
   * Log stock editing
   * @param {Object} originalStock - Original stock entry data
   * @param {Object} updatedStock - Updated stock entry data
   * @param {Object} user - User who made the update
   * @param {Object} request - HTTP request object
   * @param {Object} metadata - Additional metadata
   */
  static async logStockEdit(originalStock, updatedStock, user, request = null, metadata = {}) {
    return StockEntryLoggerSimple.logStockEdit(originalStock, updatedStock, user, request, metadata);
  }

  /**
   * Log adding stock
   * @param {Object} originalStock - Original stock entry data
   * @param {Object} updatedStock - Updated stock entry data after addition
   * @param {number} addedQuantity - Quantity added
   * @param {string} addedUnit - Unit of added quantity
   * @param {Object} user - User who added stock
   * @param {Object} request - HTTP request object
   * @param {Object} metadata - Additional metadata
   */
  static async logAddToStock(originalStock, updatedStock, addedQuantity, addedUnit, user, request = null, metadata = {}) {
    return StockEntryLoggerSimple.logAddToStock(originalStock, updatedStock, addedQuantity, addedUnit, user, request, metadata);
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
  static async logWasteFromStock(originalStock, updatedStock, wastedQuantity, wastedUnit, reason, user, request = null, metadata = {}) {
    return StockEntryLoggerSimple.logWasteFromStock(originalStock, updatedStock, wastedQuantity, wastedUnit, reason, user, request, metadata);
  }

  /**
   * Log stock deletion
   * @param {Object} stockEntry - Stock entry being deleted
   * @param {Object} user - User who deleted the stock
   * @param {string} reason - Reason for deletion
   * @param {Object} request - HTTP request object
   * @param {Object} metadata - Additional metadata
   */
  static async logStockDeletion(stockEntry, user, reason, request = null, metadata = {}) {
    return StockEntryLoggerSimple.logStockDeletion(stockEntry, user, reason, request, metadata);
  }

  /**
   * Log POS toggle
   * @param {Object} stockEntry - Stock entry being modified
   * @param {boolean} previousPOSStatus - Previous POS visibility status
   * @param {boolean} newPOSStatus - New POS visibility status
   * @param {Object} user - User who made the change
   * @param {Object} request - HTTP request object
   * @param {Object} metadata - Additional metadata
   */
  static async logPOSToggle(stockEntry, previousPOSStatus, newPOSStatus, user, request = null, metadata = {}) {
    return StockEntryLoggerSimple.logPOSToggle(stockEntry, previousPOSStatus, newPOSStatus, user, request, metadata);
  }

  /**
   * Log failed operation
   * @param {Object} actionData - Action data
   * @param {Error} error - Error that occurred
   */
  static async logFailure(actionData, error) {
    return StockEntryLoggerSimple.logFailure(actionData, error);
  }

  /**
   * Get stock entry history
   * @param {number} stockEntryId - Stock entry ID
   * @param {Object} options - Query options
   */
  static async getHistory(stockEntryId, options = {}) {
    return StockEntryLoggerSimple.getStockHistory(stockEntryId, options);
  }

  /**
   * Get material history across all stock entries
   * @param {number} materialId - Material ID
   * @param {Object} options - Query options
   */
  static async getMaterialHistory(materialId, options = {}) {
    return StockEntryLoggerSimple.getMaterialHistory(materialId, options);
  }

  /**
   * Get user activity summary
   * @param {number} userId - User ID
   * @param {Object} options - Query options
   */
  static async getUserActivity(userId, options = {}) {
    return StockEntryLoggerSimple.getUserActivity(userId, options);
  }
}

/**
 * Simple function-based logging helpers for easy integration
 */

/**
 * Log stock creation with minimal setup
 * @param {Object} stockEntry - Created stock entry
 * @param {Object} user - User who created the stock
 * @param {Object} request - HTTP request object
 */
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

/**
 * Log stock editing with minimal setup
 * @param {Object} originalStock - Original stock entry data
 * @param {Object} updatedStock - Updated stock entry data
 * @param {Object} user - User who made the update
 * @param {Object} request - HTTP request object
 */
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

/**
 * Log adding stock with minimal setup
 * @param {Object} originalStock - Original stock entry data
 * @param {Object} updatedStock - Updated stock entry data after addition
 * @param {number} addedQuantity - Quantity added
 * @param {string} addedUnit - Unit of added quantity
 * @param {Object} user - User who added stock
 * @param {Object} request - HTTP request object
 */
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

/**
 * Log waste from stock with minimal setup
 * @param {Object} originalStock - Original stock entry data
 * @param {Object} updatedStock - Updated stock entry data after waste
 * @param {number} wastedQuantity - Quantity wasted
 * @param {string} wastedUnit - Unit of wasted quantity
 * @param {string} reason - Reason for waste
 * @param {Object} user - User who recorded waste
 * @param {Object} request - HTTP request object
 */
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

/**
 * Log stock deletion with minimal setup
 * @param {Object} stockEntry - Stock entry being deleted
 * @param {Object} user - User who deleted the stock
 * @param {string} reason - Reason for deletion
 * @param {Object} request - HTTP request object
 */
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

/**
 * Log POS toggle with minimal setup
 * @param {Object} stockEntry - Stock entry being modified
 * @param {boolean} previousPOSStatus - Previous POS visibility status
 * @param {boolean} newPOSStatus - New POS visibility status
 * @param {Object} user - User who made the change
 * @param {Object} request - HTTP request object
 */
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

/**
 * Generic logging function for custom actions
 * @param {string} actionType - Type of action
 * @param {Object} stockData - Stock entry data
 * @param {Object} user - User performing action
 * @param {Object} request - HTTP request object
 * @param {Object} metadata - Additional metadata
 */
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

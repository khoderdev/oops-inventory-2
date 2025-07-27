import { 
  StockEntryAuditHelperSimple,
  logStockCreation, 
  logStockEdit, 
  logAddToStock, 
  logWasteFromStock, 
  logStockDeletion, 
  logPOSToggle,
  logCustomAction
} from '../decorators/stockEntryAuditDecoratorSimple.js';
import StockEntryLoggerSimple from '../services/StockEntryLoggerSimple.js';
import { StockEntry, Material } from '../models/index.js';

/**
 * Simple Stock Entry Logging Examples
 * 
 * Examples showing how to integrate the simple stock entry
 * logging system into your controllers and services.
 */

// ============================================================================
// EXAMPLE 1: Controller with Simple Logging Functions
// ============================================================================

class StockEntryControllerSimple {
  
  /**
   * Create new stock entry with simple logging
   */
  async createStockEntry(req, res) {
    try {
      const { materialId, supplier, purchasedQuantity, purchasedUnit, totalCost } = req.body;
      
      const stockEntry = await StockEntry.create({
        materialId,
        supplier,
        purchasedQuantity,
        purchasedUnit,
        totalCost,
        costPerPurchasedUnit: totalCost / purchasedQuantity,
        isPOSItem: false
      });

      // Include material data for logging
      await stockEntry.reload({ include: [{ model: Material, as: 'material' }] });

      // Simple logging call
      await logStockCreation(stockEntry, req.user, req);

      res.status(201).json({
        success: true,
        data: stockEntry,
        message: 'Stock entry created successfully'
      });

      return stockEntry;
    } catch (error) {
      // Log the failure
      await StockEntryLoggerSimple.logFailure({
        actionType: 'create',
        actionDescription: 'Failed to create stock entry',
        stockEntryId: null,
        materialId: req.body?.materialId || null,
        userId: req.user?.id,
        userName: req.user?.fullName || req.user?.username
      }, error);

      res.status(500).json({ error: error.message });
      throw error;
    }
  }

  /**
   * Update stock entry with simple logging
   */
  async updateStockEntry(req, res) {
    let originalStock = null;
    
    try {
      const { id } = req.params;
      const updateData = req.body;

      // Get original stock data
      originalStock = await StockEntry.findByPk(id, {
        include: [{ model: Material, as: 'material' }]
      });
      
      if (!originalStock) {
        return res.status(404).json({ error: 'Stock entry not found' });
      }

      // Store original data
      const originalData = originalStock.toJSON();

      // Update the stock entry
      await originalStock.update(updateData);
      await originalStock.reload();

      // Simple logging call
      await logStockEdit(originalData, originalStock.toJSON(), req.user, req);

      res.json({
        success: true,
        data: originalStock,
        message: 'Stock entry updated successfully'
      });

      return originalStock;
    } catch (error) {
      // Log the failure
      await StockEntryLoggerSimple.logFailure({
        actionType: 'edit',
        actionDescription: 'Failed to update stock entry',
        stockEntryId: req.params?.id || null,
        materialId: originalStock?.materialId || null,
        userId: req.user?.id,
        userName: req.user?.fullName || req.user?.username
      }, error);

      res.status(500).json({ error: error.message });
      throw error;
    }
  }

  /**
   * Add stock to existing entry
   */
  async addToStock(req, res) {
    let originalStock = null;
    
    try {
      const { id } = req.params;
      const { quantity, unit, reason } = req.body;

      // Get original stock data
      originalStock = await StockEntry.findByPk(id, {
        include: [{ model: Material, as: 'material' }]
      });

      if (!originalStock) {
        return res.status(404).json({ error: 'Stock entry not found' });
      }

      // Store original data
      const originalData = originalStock.toJSON();

      // Add to existing quantity
      const newQuantity = parseFloat(originalStock.purchasedQuantity) + parseFloat(quantity);
      await originalStock.update({ 
        purchasedQuantity: newQuantity,
        updatedAt: new Date()
      });

      await originalStock.reload();

      // Simple logging call
      await logAddToStock(originalData, originalStock.toJSON(), quantity, unit, req.user, req);

      res.json({
        success: true,
        data: originalStock,
        message: `Added ${quantity} ${unit} to stock`,
        addedQuantity: quantity,
        addedUnit: unit
      });

      return originalStock;
    } catch (error) {
      // Log the failure
      await StockEntryLoggerSimple.logFailure({
        actionType: 'add_to_stock',
        actionDescription: 'Failed to add to stock',
        stockEntryId: req.params?.id || null,
        materialId: originalStock?.materialId || null,
        userId: req.user?.id,
        userName: req.user?.fullName || req.user?.username
      }, error);

      res.status(500).json({ error: error.message });
      throw error;
    }
  }

  /**
   * Record waste from stock
   */
  async recordWaste(req, res) {
    let originalStock = null;
    
    try {
      const { id } = req.params;
      const { quantity, unit, reason } = req.body;

      // Get original stock data
      originalStock = await StockEntry.findByPk(id, {
        include: [{ model: Material, as: 'material' }]
      });

      if (!originalStock) {
        return res.status(404).json({ error: 'Stock entry not found' });
      }

      // Store original data
      const originalData = originalStock.toJSON();

      // Subtract wasted quantity
      const newQuantity = parseFloat(originalStock.purchasedQuantity) - parseFloat(quantity);
      await originalStock.update({ 
        purchasedQuantity: Math.max(0, newQuantity), // Prevent negative stock
        updatedAt: new Date()
      });

      await originalStock.reload();

      // Simple logging call
      await logWasteFromStock(originalData, originalStock.toJSON(), quantity, unit, reason, req.user, req);

      res.json({
        success: true,
        data: originalStock,
        message: `Recorded waste of ${quantity} ${unit}`,
        wastedQuantity: quantity,
        wastedUnit: unit,
        reason
      });

      return originalStock;
    } catch (error) {
      // Log the failure
      await StockEntryLoggerSimple.logFailure({
        actionType: 'waste_from_stock',
        actionDescription: 'Failed to record waste',
        stockEntryId: req.params?.id || null,
        materialId: originalStock?.materialId || null,
        userId: req.user?.id,
        userName: req.user?.fullName || req.user?.username
      }, error);

      res.status(500).json({ error: error.message });
      throw error;
    }
  }

  /**
   * Delete stock entry
   */
  async deleteStockEntry(req, res) {
    let stockEntry = null;
    
    try {
      const { id } = req.params;
      const { reason } = req.body;

      // Get stock entry data before deletion
      stockEntry = await StockEntry.findByPk(id, {
        include: [{ model: Material, as: 'material' }]
      });

      if (!stockEntry) {
        return res.status(404).json({ error: 'Stock entry not found' });
      }

      // Store data before deletion
      const stockData = stockEntry.toJSON();

      // Delete the stock entry
      await stockEntry.destroy();

      // Simple logging call
      await logStockDeletion(stockData, req.user, reason, req);

      res.json({
        success: true,
        message: 'Stock entry deleted successfully',
        deletedEntry: {
          id: stockData.id,
          materialName: stockData.material?.name,
          supplier: stockData.supplier,
          quantity: stockData.purchasedQuantity
        },
        reason
      });

      return { success: true };
    } catch (error) {
      // Log the failure
      await StockEntryLoggerSimple.logFailure({
        actionType: 'delete_stock',
        actionDescription: 'Failed to delete stock entry',
        stockEntryId: req.params?.id || null,
        materialId: stockEntry?.materialId || null,
        userId: req.user?.id,
        userName: req.user?.fullName || req.user?.username
      }, error);

      res.status(500).json({ error: error.message });
      throw error;
    }
  }

  /**
   * Toggle POS visibility
   */
  async togglePOSVisibility(req, res) {
    let stockEntry = null;
    
    try {
      const { id } = req.params;
      const { isPOSItem } = req.body;

      stockEntry = await StockEntry.findByPk(id, {
        include: [{ model: Material, as: 'material' }]
      });

      if (!stockEntry) {
        return res.status(404).json({ error: 'Stock entry not found' });
      }

      const previousPOSStatus = stockEntry.isPOSItem;

      await stockEntry.update({ isPOSItem });
      await stockEntry.reload();

      // Simple logging call
      await logPOSToggle(stockEntry.toJSON(), previousPOSStatus, isPOSItem, req.user, req);

      res.json({
        success: true,
        data: stockEntry,
        message: `POS visibility ${isPOSItem ? 'enabled' : 'disabled'}`
      });

      return stockEntry;
    } catch (error) {
      // Log the failure
      await StockEntryLoggerSimple.logFailure({
        actionType: 'pos_toggle',
        actionDescription: 'Failed to toggle POS visibility',
        stockEntryId: req.params?.id || null,
        materialId: stockEntry?.materialId || null,
        userId: req.user?.id,
        userName: req.user?.fullName || req.user?.username
      }, error);

      res.status(500).json({ error: error.message });
      throw error;
    }
  }

  /**
   * Custom action with logging
   */
  async adjustQuantity(req, res) {
    let stockEntry = null;
    
    try {
      const { id } = req.params;
      const { newQuantity, reason } = req.body;

      stockEntry = await StockEntry.findByPk(id, {
        include: [{ model: Material, as: 'material' }]
      });
      
      if (!stockEntry) {
        return res.status(404).json({ error: 'Stock entry not found' });
      }

      const oldQuantity = stockEntry.purchasedQuantity;
      await stockEntry.update({ 
        purchasedQuantity: newQuantity,
        updatedAt: new Date()
      });

      // Custom logging call
      await logCustomAction('adjust_quantity', stockEntry.toJSON(), req.user, req, {
        description: `Adjusted quantity from ${oldQuantity} to ${newQuantity} - Reason: ${reason}`,
        quantityDelta: newQuantity - oldQuantity,
        adjustmentReason: reason
      });

      res.json({
        success: true,
        data: stockEntry,
        message: 'Quantity adjusted successfully',
        adjustment: {
          from: oldQuantity,
          to: newQuantity,
          difference: newQuantity - oldQuantity,
          reason
        }
      });

      return stockEntry;
    } catch (error) {
      // Log the failure
      await StockEntryLoggerSimple.logFailure({
        actionType: 'adjust_quantity',
        actionDescription: 'Failed to adjust quantity',
        stockEntryId: req.params?.id || null,
        materialId: stockEntry?.materialId || null,
        userId: req.user?.id,
        userName: req.user?.fullName || req.user?.username
      }, error);

      res.status(500).json({ error: error.message });
      throw error;
    }
  }
}

// ============================================================================
// EXAMPLE 2: Service Layer with Manual Logging
// ============================================================================

class StockEntryServiceSimple {
  
  /**
   * Bulk stock creation with simple logging
   */
  async createBulkStock(stockEntries, user) {
    const createdEntries = [];
    const errors = [];

    for (const stockData of stockEntries) {
      try {
        // Create stock entry
        const stockEntry = await StockEntry.create(stockData);
        await stockEntry.reload({ include: [{ model: Material, as: 'material' }] });
        
        createdEntries.push(stockEntry);

        // Log successful creation
        await StockEntryAuditHelperSimple.logStockCreation(stockEntry, user, null, {
          source: 'service_layer',
          operationType: 'bulk_creation',
          bulkSize: stockEntries.length
        });

      } catch (error) {
        errors.push({ stockData, error: error.message });
        
        // Log failed creation
        await StockEntryLoggerSimple.logFailure({
          actionType: 'create',
          actionDescription: 'Bulk creation failed for item',
          stockEntryId: null,
          materialId: stockData.materialId,
          userId: user?.id,
          userName: user?.fullName || user?.username
        }, error);
      }
    }

    return {
      created: createdEntries,
      errors,
      totalAttempted: stockEntries.length,
      successCount: createdEntries.length,
      errorCount: errors.length
    };
  }

  /**
   * Stock transfer between entries
   */
  async transferStock(fromStockId, toStockId, quantity, user, reason = 'Stock transfer') {
    let fromStock = null;
    let toStock = null;

    try {
      // Get both stock entries
      fromStock = await StockEntry.findByPk(fromStockId, {
        include: [{ model: Material, as: 'material' }]
      });
      toStock = await StockEntry.findByPk(toStockId, {
        include: [{ model: Material, as: 'material' }]
      });

      if (!fromStock || !toStock) {
        throw new Error('One or both stock entries not found');
      }

      // Capture original states
      const originalFromStock = fromStock.toJSON();
      const originalToStock = toStock.toJSON();

      // Perform transfer
      const newFromQuantity = parseFloat(fromStock.purchasedQuantity) - parseFloat(quantity);
      const newToQuantity = parseFloat(toStock.purchasedQuantity) + parseFloat(quantity);

      if (newFromQuantity < 0) {
        throw new Error('Insufficient stock for transfer');
      }

      await fromStock.update({ purchasedQuantity: newFromQuantity });
      await toStock.update({ purchasedQuantity: newToQuantity });

      // Log both sides of the transfer
      await StockEntryAuditHelperSimple.logAction('transfer_stock', fromStock.toJSON(), user, null, {
        description: `Transferred ${quantity} units to ${toStock.material?.name} (${toStock.supplier})`,
        quantityDelta: -parseFloat(quantity),
        transferType: 'outbound',
        transferTo: {
          stockEntryId: toStock.id,
          materialName: toStock.material?.name,
          supplier: toStock.supplier
        },
        transferredQuantity: quantity,
        reason
      });

      await StockEntryAuditHelperSimple.logAction('transfer_stock', toStock.toJSON(), user, null, {
        description: `Received ${quantity} units from ${fromStock.material?.name} (${fromStock.supplier})`,
        quantityDelta: parseFloat(quantity),
        transferType: 'inbound',
        transferFrom: {
          stockEntryId: fromStock.id,
          materialName: fromStock.material?.name,
          supplier: fromStock.supplier
        },
        transferredQuantity: quantity,
        reason
      });

      return {
        fromStock: fromStock.toJSON(),
        toStock: toStock.toJSON(),
        transferredQuantity: quantity
      };
    } catch (error) {
      // Log failed transfer attempt
      await StockEntryLoggerSimple.logFailure({
        actionType: 'transfer_stock',
        actionDescription: `Failed to transfer ${quantity} units`,
        stockEntryId: fromStockId,
        materialId: fromStock?.materialId || null,
        userId: user?.id,
        userName: user?.fullName || user?.username
      }, error);

      throw error;
    }
  }
}

// ============================================================================
// EXAMPLE 3: Reporting with Simple Logging
// ============================================================================

class StockReportingServiceSimple {
  
  /**
   * Generate stock history report
   */
  async generateStockHistoryReport(stockEntryId, options = {}) {
    try {
      const history = await StockEntryAuditHelperSimple.getHistory(stockEntryId, {
        limit: options.limit || 100,
        actionTypes: options.actionTypes || null
      });

      const report = {
        stockEntryId,
        totalActions: history.length,
        actionSummary: this._summarizeActions(history),
        timeline: history.map(log => ({
          timestamp: log.actionTimestamp,
          action: log.actionType,
          description: log.actionDescription,
          user: log.userName,
          quantityChange: log.quantityDelta,
          costChange: log.costDelta,
          status: log.status
        })),
        generatedAt: new Date()
      };

      return report;
    } catch (error) {
      console.error('Failed to generate stock history report:', error);
      throw error;
    }
  }

  /**
   * Generate material activity report
   */
  async generateMaterialActivityReport(materialId, options = {}) {
    try {
      const activity = await StockEntryAuditHelperSimple.getMaterialHistory(materialId, {
        limit: options.limit || 200,
        actionTypes: options.actionTypes || null
      });

      const report = {
        materialId,
        totalActivities: activity.length,
        activitySummary: this._summarizeActivities(activity),
        stockEntries: this._groupByStockEntry(activity),
        trends: this._analyzeTrends(activity),
        generatedAt: new Date()
      };

      return report;
    } catch (error) {
      console.error('Failed to generate material activity report:', error);
      throw error;
    }
  }

  /**
   * Generate user activity report
   */
  async generateUserActivityReport(userId, options = {}) {
    try {
      const activity = await StockEntryAuditHelperSimple.getUserActivity(userId, {
        limit: options.limit || 150
      });

      const report = {
        userId,
        totalActivities: activity.length,
        activityBreakdown: this._breakdownByAction(activity),
        recentActivity: activity.slice(0, 20),
        generatedAt: new Date()
      };

      return report;
    } catch (error) {
      console.error('Failed to generate user activity report:', error);
      throw error;
    }
  }

  // Helper methods for report generation
  _summarizeActions(history) {
    return history.reduce((summary, log) => {
      summary[log.actionType] = (summary[log.actionType] || 0) + 1;
      return summary;
    }, {});
  }

  _summarizeActivities(activity) {
    return activity.reduce((summary, log) => {
      summary[log.actionType] = (summary[log.actionType] || 0) + 1;
      return summary;
    }, {});
  }

  _groupByStockEntry(activity) {
    return activity.reduce((groups, log) => {
      if (!groups[log.stockEntryId]) {
        groups[log.stockEntryId] = [];
      }
      groups[log.stockEntryId].push(log);
      return groups;
    }, {});
  }

  _analyzeTrends(activity) {
    const trends = {
      totalQuantityChange: 0,
      totalCostChange: 0,
      mostCommonAction: null,
      activityFrequency: {}
    };

    activity.forEach(log => {
      trends.totalQuantityChange += parseFloat(log.quantityDelta) || 0;
      trends.totalCostChange += parseFloat(log.costDelta) || 0;
      
      const action = log.actionType;
      trends.activityFrequency[action] = (trends.activityFrequency[action] || 0) + 1;
    });

    // Find most common action
    trends.mostCommonAction = Object.keys(trends.activityFrequency)
      .reduce((a, b) => trends.activityFrequency[a] > trends.activityFrequency[b] ? a : b);

    return trends;
  }

  _breakdownByAction(activity) {
    return activity.reduce((breakdown, log) => {
      breakdown[log.actionType] = (breakdown[log.actionType] || 0) + 1;
      return breakdown;
    }, {});
  }
}

export {
  StockEntryControllerSimple,
  StockEntryServiceSimple,
  StockReportingServiceSimple
};

import { 
  logStockCreation, 
  logStockEdit, 
  logAddToStock, 
  logWasteFromStock, 
  logStockDeletion, 
  logPOSToggle,
  auditStockEntry,
  StockEntryAuditHelper 
} from '../decorators/stockEntryAuditDecorator.js';
import StockEntryLogger from '../services/StockEntryLogger.js';

/**
 * Stock Entry Logging Examples
 * 
 * Comprehensive examples showing how to integrate the stock entry
 * logging system into your controllers and services.
 */

// ============================================================================
// EXAMPLE 1: Controller with Decorators
// ============================================================================

class StockEntryController {
  
  /**
   * Create new stock entry with automatic logging
   * Note: In production, you would use @logStockCreation decorator
   * For this example, we'll show the manual approach
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
        // ... other fields
      });

      // Include material data for logging
      await stockEntry.reload({ include: [{ model: Material, as: 'material' }] });

      // Manual logging (in production, use @logStockCreation decorator instead)
      await StockEntryLogger.logStockCreation(stockEntry, req.user, req, {
        source: 'web_interface',
        category: 'inventory_management'
      });

      res.status(201).json({
        success: true,
        data: stockEntry,
        message: 'Stock entry created successfully'
      });

      return stockEntry;
    } catch (error) {
      res.status(500).json({ error: error.message });
      throw error; // Decorator will log the failure
    }
  }

  /**
   * Update stock entry with automatic logging
   */
  @logStockEdit({ 
    captureOriginal: true,
    metadata: { 
      source: 'web_interface',
      category: 'inventory_update' 
    } 
  })
  async updateStockEntry(req, res) {
    try {
      const { id } = req.params;
      const updateData = req.body;

      const stockEntry = await StockEntry.findByPk(id);
      if (!stockEntry) {
        return res.status(404).json({ error: 'Stock entry not found' });
      }

      await stockEntry.update(updateData);
      await stockEntry.reload({ include: [{ model: Material, as: 'material' }] });

      res.json({
        success: true,
        data: stockEntry,
        message: 'Stock entry updated successfully'
      });

      return stockEntry; // Decorator will compare with original and log changes
    } catch (error) {
      res.status(500).json({ error: error.message });
      throw error;
    }
  }

  /**
   * Add stock to existing entry
   */
  @logAddToStock({ 
    additionMethod: 'manual',
    metadata: { 
      source: 'web_interface',
      category: 'stock_replenishment' 
    } 
  })
  async addToStock(req, res) {
    try {
      const { id } = req.params;
      const { quantity, unit, reason } = req.body;

      const stockEntry = await StockEntry.findByPk(id, {
        include: [{ model: Material, as: 'material' }]
      });

      if (!stockEntry) {
        return res.status(404).json({ error: 'Stock entry not found' });
      }

      // Add to existing quantity
      const newQuantity = parseFloat(stockEntry.purchasedQuantity) + parseFloat(quantity);
      await stockEntry.update({ 
        purchasedQuantity: newQuantity,
        updatedAt: new Date()
      });

      await stockEntry.reload();

      res.json({
        success: true,
        data: stockEntry,
        message: `Added ${quantity} ${unit} to stock`,
        addedQuantity: quantity,
        addedUnit: unit
      });

      return stockEntry; // Decorator will log the addition
    } catch (error) {
      res.status(500).json({ error: error.message });
      throw error;
    }
  }

  /**
   * Record waste from stock
   */
  @logWasteFromStock({ 
    metadata: { 
      source: 'web_interface',
      category: 'inventory_waste' 
    } 
  })
  async recordWaste(req, res) {
    try {
      const { id } = req.params;
      const { quantity, unit, reason } = req.body;

      const stockEntry = await StockEntry.findByPk(id, {
        include: [{ model: Material, as: 'material' }]
      });

      if (!stockEntry) {
        return res.status(404).json({ error: 'Stock entry not found' });
      }

      // Subtract wasted quantity
      const newQuantity = parseFloat(stockEntry.purchasedQuantity) - parseFloat(quantity);
      await stockEntry.update({ 
        purchasedQuantity: Math.max(0, newQuantity), // Prevent negative stock
        updatedAt: new Date()
      });

      await stockEntry.reload();

      res.json({
        success: true,
        data: stockEntry,
        message: `Recorded waste of ${quantity} ${unit}`,
        wastedQuantity: quantity,
        wastedUnit: unit,
        reason
      });

      return stockEntry; // Decorator will log the waste
    } catch (error) {
      res.status(500).json({ error: error.message });
      throw error;
    }
  }

  /**
   * Delete stock entry
   */
  @logStockDeletion({ 
    captureOriginal: true,
    metadata: { 
      source: 'web_interface',
      category: 'inventory_deletion',
      requiresApproval: true 
    } 
  })
  async deleteStockEntry(req, res) {
    try {
      const { id } = req.params;
      const { reason } = req.body;

      const stockEntry = await StockEntry.findByPk(id, {
        include: [{ model: Material, as: 'material' }]
      });

      if (!stockEntry) {
        return res.status(404).json({ error: 'Stock entry not found' });
      }

      await stockEntry.destroy();

      res.json({
        success: true,
        message: 'Stock entry deleted successfully',
        deletedEntry: {
          id: stockEntry.id,
          materialName: stockEntry.material?.name,
          supplier: stockEntry.supplier,
          quantity: stockEntry.purchasedQuantity
        },
        reason
      });

      return { success: true }; // Decorator will log the deletion
    } catch (error) {
      res.status(500).json({ error: error.message });
      throw error;
    }
  }

  /**
   * Toggle POS visibility
   */
  @logPOSToggle({ 
    metadata: { 
      source: 'web_interface',
      category: 'pos_management' 
    } 
  })
  async togglePOSVisibility(req, res) {
    try {
      const { id } = req.params;
      const { isPOSItem } = req.body;

      const stockEntry = await StockEntry.findByPk(id, {
        include: [{ model: Material, as: 'material' }]
      });

      if (!stockEntry) {
        return res.status(404).json({ error: 'Stock entry not found' });
      }

      await stockEntry.update({ isPOSItem });
      await stockEntry.reload();

      res.json({
        success: true,
        data: stockEntry,
        message: `POS visibility ${isPOSItem ? 'enabled' : 'disabled'}`
      });

      return stockEntry; // Decorator will log the POS toggle
    } catch (error) {
      res.status(500).json({ error: error.message });
      throw error;
    }
  }

  /**
   * Generic operation with custom audit
   */
  @auditStockEntry('adjust_quantity', { 
    description: 'Manual quantity adjustment',
    metadata: { 
      source: 'admin_panel',
      category: 'inventory_correction' 
    } 
  })
  async adjustQuantity(req, res) {
    try {
      const { id } = req.params;
      const { newQuantity, reason } = req.body;

      const stockEntry = await StockEntry.findByPk(id);
      if (!stockEntry) {
        return res.status(404).json({ error: 'Stock entry not found' });
      }

      const oldQuantity = stockEntry.purchasedQuantity;
      await stockEntry.update({ 
        purchasedQuantity: newQuantity,
        updatedAt: new Date()
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

      return stockEntry; // Decorator will log the adjustment
    } catch (error) {
      res.status(500).json({ error: error.message });
      throw error;
    }
  }
}

// ============================================================================
// EXAMPLE 2: Manual Logging in Services
// ============================================================================

class StockEntryService {
  
  /**
   * Bulk stock creation with manual logging
   */
  async createBulkStock(stockEntries, user, correlationId = null) {
    const operations = [];
    const createdEntries = [];

    try {
      for (const stockData of stockEntries) {
        // Create stock entry
        const stockEntry = await StockEntry.create(stockData);
        await stockEntry.reload({ include: [{ model: Material, as: 'material' }] });
        
        createdEntries.push(stockEntry);

        // Prepare operation data for bulk logging
        operations.push({
          actionType: 'create',
          actionDescription: `Bulk created stock entry for ${stockEntry.material?.name}`,
          stockEntryId: stockEntry.id,
          materialId: stockEntry.materialId,
          materialName: stockEntry.material?.name,
          materialCategory: stockEntry.material?.category,
          supplier: stockEntry.supplier,
          newValues: StockEntryLogger._sanitizeStockData(stockEntry),
          newQuantity: stockEntry.purchasedQuantity,
          newIndividualQuantity: stockEntry.purchasedIndividualQuantity,
          newTotalCost: stockEntry.totalCost,
          correlationId,
          metadata: {
            operationType: 'bulk_creation',
            bulkSize: stockEntries.length,
            source: 'service_layer'
          }
        });
      }

      // Log all operations as a batch
      const batchId = `bulk_create_${Date.now()}`;
      await StockEntryLogger.logBulkOperation(operations, user, batchId, null, {
        operationType: 'bulk_stock_creation',
        totalEntries: stockEntries.length
      });

      return createdEntries;
    } catch (error) {
      // Log failure for any completed operations
      if (operations.length > 0) {
        const batchId = `bulk_create_failed_${Date.now()}`;
        await StockEntryLogger.logBulkOperation(
          operations.map(op => ({ ...op, status: 'failure', errorMessage: error.message })),
          user,
          batchId,
          null,
          {
            operationType: 'bulk_stock_creation_failed',
            totalAttempted: stockEntries.length,
            totalCompleted: operations.length
          }
        );
      }
      throw error;
    }
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
      const originalFromStock = { ...fromStock.toJSON() };
      const originalToStock = { ...toStock.toJSON() };

      // Perform transfer
      const newFromQuantity = parseFloat(fromStock.purchasedQuantity) - parseFloat(quantity);
      const newToQuantity = parseFloat(toStock.purchasedQuantity) + parseFloat(quantity);

      if (newFromQuantity < 0) {
        throw new Error('Insufficient stock for transfer');
      }

      await fromStock.update({ purchasedQuantity: newFromQuantity });
      await toStock.update({ purchasedQuantity: newToQuantity });

      // Log both sides of the transfer
      const correlationId = `transfer_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      // Log reduction from source
      await StockEntryLogger.logAction({
        actionType: 'transfer_stock',
        actionDescription: `Transferred ${quantity} units to ${toStock.material?.name} (${toStock.supplier})`,
        stockEntryId: fromStock.id,
        materialId: fromStock.materialId,
        materialName: fromStock.material?.name,
        materialCategory: fromStock.material?.category,
        supplier: fromStock.supplier,
        userId: user.id,
        userName: user.fullName || user.username,
        userRole: user.role,
        previousValues: originalFromStock,
        newValues: fromStock.toJSON(),
        previousQuantity: originalFromStock.purchasedQuantity,
        newQuantity: newFromQuantity,
        quantityDelta: -parseFloat(quantity),
        reason,
        correlationId,
        metadata: {
          transferType: 'outbound',
          transferTo: {
            stockEntryId: toStock.id,
            materialName: toStock.material?.name,
            supplier: toStock.supplier
          },
          transferredQuantity: quantity
        }
      });

      // Log addition to destination
      await StockEntryLogger.logAction({
        actionType: 'transfer_stock',
        actionDescription: `Received ${quantity} units from ${fromStock.material?.name} (${fromStock.supplier})`,
        stockEntryId: toStock.id,
        materialId: toStock.materialId,
        materialName: toStock.material?.name,
        materialCategory: toStock.material?.category,
        supplier: toStock.supplier,
        userId: user.id,
        userName: user.fullName || user.username,
        userRole: user.role,
        previousValues: originalToStock,
        newValues: toStock.toJSON(),
        previousQuantity: originalToStock.purchasedQuantity,
        newQuantity: newToQuantity,
        quantityDelta: parseFloat(quantity),
        reason,
        correlationId,
        metadata: {
          transferType: 'inbound',
          transferFrom: {
            stockEntryId: fromStock.id,
            materialName: fromStock.material?.name,
            supplier: fromStock.supplier
          },
          transferredQuantity: quantity
        }
      });

      return {
        fromStock: fromStock.toJSON(),
        toStock: toStock.toJSON(),
        transferredQuantity: quantity,
        correlationId
      };
    } catch (error) {
      // Log failed transfer attempt
      await StockEntryLogger.logAction({
        actionType: 'transfer_stock',
        actionDescription: `Failed to transfer ${quantity} units: ${error.message}`,
        stockEntryId: fromStockId,
        materialId: fromStock?.materialId || null,
        userId: user.id,
        userName: user.fullName || user.username,
        userRole: user.role,
        status: 'failure',
        errorMessage: error.message,
        reason,
        metadata: {
          transferType: 'failed',
          attemptedTransfer: {
            fromStockId,
            toStockId,
            quantity
          }
        }
      });

      throw error;
    }
  }

  /**
   * System correction with detailed logging
   */
  async systemCorrection(stockEntryId, corrections, user, reason = 'System correction') {
    let stockEntry = null;

    try {
      stockEntry = await StockEntry.findByPk(stockEntryId, {
        include: [{ model: Material, as: 'material' }]
      });

      if (!stockEntry) {
        throw new Error('Stock entry not found');
      }

      const originalData = { ...stockEntry.toJSON() };

      // Apply corrections
      await stockEntry.update(corrections);
      await stockEntry.reload();

      // Log system correction
      await StockEntryLogger.logAction({
        actionType: 'system_correction',
        actionDescription: `System correction applied: ${reason}`,
        stockEntryId: stockEntry.id,
        materialId: stockEntry.materialId,
        materialName: stockEntry.material?.name,
        materialCategory: stockEntry.material?.category,
        supplier: stockEntry.supplier,
        userId: user.id,
        userName: user.fullName || user.username,
        userRole: user.role,
        previousValues: originalData,
        newValues: stockEntry.toJSON(),
        reason,
        businessImpact: 'medium',
        complianceRelevant: true,
        metadata: {
          correctionType: 'system_correction',
          correctedFields: Object.keys(corrections),
          correctionReason: reason,
          requiresReview: true
        }
      });

      return stockEntry;
    } catch (error) {
      // Log failed correction
      await StockEntryLogger.logAction({
        actionType: 'system_correction',
        actionDescription: `Failed system correction: ${error.message}`,
        stockEntryId,
        materialId: stockEntry?.materialId || null,
        userId: user.id,
        userName: user.fullName || user.username,
        userRole: user.role,
        status: 'failure',
        errorMessage: error.message,
        reason,
        metadata: {
          correctionType: 'system_correction_failed',
          attemptedCorrections: corrections
        }
      });

      throw error;
    }
  }
}

// ============================================================================
// EXAMPLE 3: Using Helper Functions
// ============================================================================

class StockReportingService {
  
  /**
   * Generate stock history report
   */
  async generateStockHistoryReport(stockEntryId, options = {}) {
    try {
      const history = await StockEntryAuditHelper.getHistory(stockEntryId, {
        limit: options.limit || 100,
        actionTypes: options.actionTypes || null,
        startDate: options.startDate || null,
        endDate: options.endDate || null
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
          businessImpact: log.businessImpact
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
      const activity = await StockEntryAuditHelper.getMaterialHistory(materialId, {
        limit: options.limit || 200,
        actionTypes: options.actionTypes || null,
        startDate: options.startDate || null,
        endDate: options.endDate || null
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
      const activity = await StockEntryAuditHelper.getUserActivity(userId, {
        limit: options.limit || 150,
        startDate: options.startDate || null,
        endDate: options.endDate || null
      });

      const report = {
        userId,
        totalActivities: activity.length,
        activityBreakdown: this._breakdownByAction(activity),
        businessImpactSummary: this._summarizeBusinessImpact(activity),
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
    // Simple trend analysis - can be expanded
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

  _summarizeBusinessImpact(activity) {
    return activity.reduce((summary, log) => {
      summary[log.businessImpact] = (summary[log.businessImpact] || 0) + 1;
      return summary;
    }, {});
  }
}

// ============================================================================
// EXAMPLE 4: Integration with Existing Controllers
// ============================================================================

/**
 * Example of how to integrate with your existing stock controller
 * by adding minimal logging calls
 */
class ExistingStockController {
  
  async createStock(req, res) {
    try {
      const stockData = req.body;
      
      // Your existing creation logic
      const stockEntry = await StockEntry.create(stockData);
      await stockEntry.reload({ include: [{ model: Material, as: 'material' }] });

      // Add logging with minimal changes
      await StockEntryLogger.logStockCreation(stockEntry, req.user, req, {
        source: 'existing_controller',
        migrated: true
      });

      res.status(201).json({ success: true, data: stockEntry });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async updateStock(req, res) {
    try {
      const { id } = req.params;
      const updateData = req.body;

      // Capture original state
      const originalStock = await StockEntry.findByPk(id, {
        include: [{ model: Material, as: 'material' }]
      });

      // Your existing update logic
      await originalStock.update(updateData);
      await originalStock.reload();

      // Add logging
      await StockEntryLogger.logStockEdit(
        originalStock.toJSON(),
        originalStock.toJSON(),
        req.user,
        req,
        {
          source: 'existing_controller',
          migrated: true
        }
      );

      res.json({ success: true, data: originalStock });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
}

export {
  StockEntryController,
  StockEntryService,
  StockReportingService,
  ExistingStockController
};

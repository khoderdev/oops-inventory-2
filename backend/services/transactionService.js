import sequelize from "../config/database.js";

/**
 * Transaction Service for consistent database transaction handling
 */
class TransactionService {
  
  /**
   * Execute a function within a database transaction
   * @param {Function} operation - Function to execute within transaction
   * @param {Object} options - Transaction options
   * @returns {Promise} Result of the operation
   */
  static async executeInTransaction(operation, options = {}) {
    const transaction = await sequelize.transaction({
      isolationLevel: options.isolationLevel || sequelize.Transaction.ISOLATION_LEVELS.READ_COMMITTED,
      ...options
    });

    try {
      const result = await operation(transaction);
      await transaction.commit();
      return result;
    } catch (error) {
      await transaction.rollback();
      console.error('Transaction rolled back due to error:', error);
      throw error;
    }
  }

  /**
   * Execute multiple operations in a single transaction
   * @param {Array} operations - Array of functions to execute
   * @param {Object} options - Transaction options
   * @returns {Promise} Array of results
   */
  static async executeMultipleInTransaction(operations, options = {}) {
    return this.executeInTransaction(async (transaction) => {
      const results = [];
      for (const operation of operations) {
        const result = await operation(transaction);
        results.push(result);
      }
      return results;
    }, options);
  }

  /**
   * Create a stock entry with all related calculations in a transaction
   * @param {Object} stockData - Stock entry data
   * @param {Object} material - Material object
   * @param {Object} user - User object for audit
   * @param {Object} req - Request object for audit
   * @returns {Promise} Created stock entry
   */
  static async createStockEntryTransaction(stockData, material, user, req) {
    return this.executeInTransaction(async (transaction) => {
      const { StockEntry } = await import("../models/index.js");
      const { StockEntryAuditHelperSimple } = await import("../decorators/stockEntryAuditDecoratorSimple.js");

      // Create stock entry within transaction
      const stockEntry = await StockEntry.create(stockData, { transaction });

      // Reload with associations
      const createdStockEntry = await StockEntry.findByPk(stockEntry.id, {
        include: { model: material.constructor, as: "material" },
        transaction
      });

      // Log audit within same transaction
      try {
        await StockEntryAuditHelperSimple.logStockCreation(
          createdStockEntry.toJSON(), 
          user, 
          req, 
          {
            operationType: "stock_creation",
            supplier: createdStockEntry.supplier,
            totalCost: createdStockEntry.totalCost,
            purchasedQuantity: createdStockEntry.purchasedQuantity,
            purchasedUnit: createdStockEntry.purchasedUnit
          },
          transaction
        );
      } catch (auditError) {
        console.error("Audit logging failed:", auditError);
        // Don't fail the transaction for audit errors
      }

      return createdStockEntry;
    });
  }

  /**
   * Update a stock entry with all related calculations in a transaction
   * @param {Object} stockEntry - Existing stock entry
   * @param {Object} updateData - Update data
   * @param {Object} user - User object for audit
   * @param {Object} req - Request object for audit
   * @returns {Promise} Updated stock entry
   */
  static async updateStockEntryTransaction(stockEntry, updateData, user, req) {
    return this.executeInTransaction(async (transaction) => {
      const { StockEntry, Material } = await import("../models/index.js");
      const { StockEntryAuditHelperSimple } = await import("../decorators/stockEntryAuditDecoratorSimple.js");

      const originalStockEntry = stockEntry.toJSON();

      // Update stock entry within transaction
      await stockEntry.update(updateData, { transaction });

      // Reload with associations
      const updatedStockEntry = await StockEntry.findByPk(stockEntry.id, {
        include: { model: Material, as: "material" },
        transaction
      });

      // Log audit within same transaction
      try {
        await StockEntryAuditHelperSimple.logStockEdit(
          originalStockEntry,
          updatedStockEntry.toJSON(),
          user,
          req,
          {
            operationType: "stock_edit",
            supplier: updatedStockEntry.supplier,
            totalCost: updatedStockEntry.totalCost,
            purchasedQuantity: updatedStockEntry.purchasedQuantity,
            purchasedUnit: updatedStockEntry.purchasedUnit
          },
          transaction
        );
      } catch (auditError) {
        console.error("Audit logging failed:", auditError);
      }

      return updatedStockEntry;
    });
  }

  /**
   * Delete a stock entry with audit logging in a transaction
   * @param {Object} stockEntry - Stock entry to delete
   * @param {Object} user - User object for audit
   * @param {Object} req - Request object for audit
   * @returns {Promise} void
   */
  static async deleteStockEntryTransaction(stockEntry, user, req) {
    return this.executeInTransaction(async (transaction) => {
      const { StockEntryAuditHelperSimple } = await import("../decorators/stockEntryAuditDecoratorSimple.js");

      const deletedStockEntry = stockEntry.toJSON();

      // Log deletion BEFORE destroying to avoid constraint issues
      try {
        await StockEntryAuditHelperSimple.logStockDeletion(
          deletedStockEntry,
          user,
          "Manual deletion via API",
          req,
          transaction
        );
      } catch (auditError) {
        console.error("Audit logging failed:", auditError);
      }

      // Delete stock entry within transaction
      await stockEntry.destroy({ transaction });
    });
  }

  /**
   * Record waste from stock entry with all calculations in a transaction
   * @param {Object} stockEntry - Stock entry to waste from
   * @param {Object} wasteData - Waste data
   * @param {Object} user - User object for audit
   * @param {Object} req - Request object for audit
   * @returns {Promise} Object with updated stock entry and waste record
   */
  static async wasteFromStockTransaction(stockEntry, wasteData, user, req) {
    return this.executeInTransaction(async (transaction) => {
      const { StockEntry, Material, Wasting } = await import("../models/index.js");
      const { StockEntryAuditHelperSimple } = await import("../decorators/stockEntryAuditDecoratorSimple.js");

      const originalStockEntry = stockEntry.toJSON();

      // Update stock entry within transaction
      await stockEntry.update(wasteData.stockUpdateData, { transaction });

      // Create waste record within transaction
      const wasteRecord = await Wasting.create({
        ...wasteData.wasteRecordData,
        stockEntryId: stockEntry.id
      }, { transaction });

      // Reload updated stock entry
      const updatedStockEntry = await StockEntry.findByPk(stockEntry.id, {
        include: { model: Material, as: "material" },
        transaction
      });

      // Log audit within same transaction
      try {
        await StockEntryAuditHelperSimple.logWasteFromStock(
          originalStockEntry,
          updatedStockEntry.toJSON(),
          wasteData.wasteQuantity,
          wasteData.wasteUnit,
          wasteData.wasteReason,
          user,
          req,
          {
            operationType: "waste_from_stock",
            notes: wasteData.notes,
            wasteDate: wasteData.wasteDate,
            totalCostReduction: wasteData.costReduction,
            wasteRecordId: wasteRecord.id
          },
          transaction
        );
      } catch (auditError) {
        console.error("Audit logging failed:", auditError);
      }

      return { updatedStockEntry, wasteRecord };
    });
  }
}

export default TransactionService;

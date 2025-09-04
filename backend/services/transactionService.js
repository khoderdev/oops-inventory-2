import sequelize from "../config/database.js";
import { Transaction } from "sequelize";

class TransactionService {

  static async executeInTransaction(operation, options = {}) {
    const transaction = await sequelize.transaction({
      isolationLevel: options.isolationLevel || Transaction.ISOLATION_LEVELS.READ_COMMITTED,
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

  static async createStockEntryTransaction(stockData, material, user, req) {
    return this.executeInTransaction(async (transaction) => {
      const { StockEntry } = await import("../models/index.js");
      const { StockEntryAuditHelperSimple } = await import("../decorators/stockEntryAuditDecoratorSimple.js");
      
      // First create the stock entry
      const stockEntry = await StockEntry.create(stockData, { transaction });
      
      // Fetch the created entry with its associations
      const createdStockEntry = await StockEntry.findByPk(stockEntry.id, {
        include: { model: material.constructor, as: "material" },
        transaction
      });
      
      // Store the entry data for logging after transaction commit
      const stockEntryData = createdStockEntry.toJSON();
      const logData = {
        operationType: "stock_creation",
        supplier: createdStockEntry.supplier,
        totalCost: createdStockEntry.totalCost,
        purchasedQuantity: createdStockEntry.purchasedQuantity,
        purchasedUnit: createdStockEntry.purchasedUnit
      };
      
      // Return the created entry - the transaction will be committed after this
      return createdStockEntry;
    }).then(async (createdStockEntry) => {
      // Now that the transaction is committed, log the action without a transaction
      // This ensures the stock entry exists in the database before the log references it
      try {
        const { StockEntryAuditHelperSimple } = await import("../decorators/stockEntryAuditDecoratorSimple.js");
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
          }
        );
      } catch (auditError) {
        console.error("Audit logging failed:", auditError);
      }
      return createdStockEntry;
    });
  }

  static async updateStockEntryTransaction(stockEntry, updateData, user, req) {
    return this.executeInTransaction(async (transaction) => {
      const { StockEntry, Material } = await import("../models/index.js");
      const { StockEntryAuditHelperSimple } = await import("../decorators/stockEntryAuditDecoratorSimple.js");
      
      // Store the original state for logging
      const originalStockEntry = stockEntry.toJSON();
      
      // Update the stock entry
      await stockEntry.update(updateData, { transaction });
      
      // Fetch the updated entry with its associations
      const updatedStockEntry = await StockEntry.findByPk(stockEntry.id, {
        include: { model: Material, as: "material" },
        transaction
      });
      
      // Return the updated entry - the transaction will be committed after this
      return { updatedStockEntry, originalStockEntry };
    }).then(async ({ updatedStockEntry, originalStockEntry }) => {
      // Now that the transaction is committed, log the action without a transaction
      // This ensures the stock entry exists in the database before the log references it
      try {
        const { StockEntryAuditHelperSimple } = await import("../decorators/stockEntryAuditDecoratorSimple.js");
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
          }
        );
      } catch (auditError) {
        console.error("Audit logging failed:", auditError);
      }
      return updatedStockEntry;
    });
  }

  static async deleteStockEntryTransaction(stockEntry, user, req) {
    // Store the stock entry data before deletion for logging
    const deletedStockEntry = stockEntry.toJSON();
    
    return this.executeInTransaction(async (transaction) => {
      // Delete the stock entry within the transaction
      await stockEntry.destroy({ transaction });
      
      // Return the deleted entry data for logging after transaction commit
      return deletedStockEntry;
    }).then(async (deletedStockEntry) => {
      // Now that the transaction is committed and the entry is deleted,
      // log the action without a transaction
      try {
        const { StockEntryAuditHelperSimple } = await import("../decorators/stockEntryAuditDecoratorSimple.js");
        await StockEntryAuditHelperSimple.logStockDeletion(
          deletedStockEntry,
          user,
          "Manual deletion via API",
          req
        );
      } catch (auditError) {
        console.error("Audit logging failed:", auditError);
      }
      return deletedStockEntry;
    });
  }

  static async wasteFromStockTransaction(stockEntry, wasteData, user, req) {
    return this.executeInTransaction(async (transaction) => {
      const { StockEntry, Material, Wasting } = await import("../models/index.js");
      
      // Store the original state for logging
      const originalStockEntry = stockEntry.toJSON();
      
      // Update the stock entry
      await stockEntry.update(wasteData.stockUpdateData, { transaction });
      
      // Create the waste record
      const wasteRecord = await Wasting.create({
        stockEntryId: stockEntry.id,
        materialId: stockEntry.materialId,
        wastedQuantity: wasteData.wastedQuantity,
        wastedUnit: wasteData.wastedUnit,
        wastedIndividualQuantity: wasteData.wastedIndividualQuantity,
        wasteReason: wasteData.wasteReason,
        wasteDate: wasteData.wasteDate || new Date(),
        userId: user.id,
        userName: user.fullName || user.username
      }, { transaction });
      
      // Fetch the updated entry with its associations
      const updatedStockEntry = await StockEntry.findByPk(stockEntry.id, {
        include: { model: Material, as: "material" },
        transaction
      });
      
      // Return the updated entry and waste record - the transaction will be committed after this
      return { updatedStockEntry, wasteRecord, originalStockEntry, wasteData };
    }).then(async ({ updatedStockEntry, wasteRecord, originalStockEntry, wasteData }) => {
      // Now that the transaction is committed, log the action without a transaction
      // This ensures the stock entry and waste record exist in the database before the log references them
      try {
        const { StockEntryAuditHelperSimple } = await import("../decorators/stockEntryAuditDecoratorSimple.js");
        await StockEntryAuditHelperSimple.logWasteFromStock(
          originalStockEntry,
          updatedStockEntry.toJSON(),
          wasteData,
          user,
          req
        );
      } catch (auditError) {
        console.error("Audit logging failed:", auditError);
      }
      return { updatedStockEntry, wasteRecord };
    });
  }
}

export default TransactionService;

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
      const stockEntry = await StockEntry.create(stockData, { transaction });
      const createdStockEntry = await StockEntry.findByPk(stockEntry.id, {
        include: { model: material.constructor, as: "material" },
        transaction
      });
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
      }
      return createdStockEntry;
    });
  }

  static async updateStockEntryTransaction(stockEntry, updateData, user, req) {
    return this.executeInTransaction(async (transaction) => {
      const { StockEntry, Material } = await import("../models/index.js");
      const { StockEntryAuditHelperSimple } = await import("../decorators/stockEntryAuditDecoratorSimple.js");
      const originalStockEntry = stockEntry.toJSON();
      await stockEntry.update(updateData, { transaction });
      const updatedStockEntry = await StockEntry.findByPk(stockEntry.id, {
        include: { model: Material, as: "material" },
        transaction
      });
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

  static async deleteStockEntryTransaction(stockEntry, user, req) {
    return this.executeInTransaction(async (transaction) => {
      const { StockEntryAuditHelperSimple } = await import("../decorators/stockEntryAuditDecoratorSimple.js");
      const deletedStockEntry = stockEntry.toJSON();
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
      await stockEntry.destroy({ transaction });
    });
  }

  static async wasteFromStockTransaction(stockEntry, wasteData, user, req) {
    return this.executeInTransaction(async (transaction) => {
      const { StockEntry, Material, Wasting } = await import("../models/index.js");
      const { StockEntryAuditHelperSimple } = await import("../decorators/stockEntryAuditDecoratorSimple.js");
      const originalStockEntry = stockEntry.toJSON();
      await stockEntry.update(wasteData.stockUpdateData, { transaction });
      const wasteRecord = await Wasting.create({
        ...wasteData.wasteRecordData,
        stockEntryId: stockEntry.id
      }, { transaction });
      const updatedStockEntry = await StockEntry.findByPk(stockEntry.id, {
        include: { model: Material, as: "material" },
        transaction
      });
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

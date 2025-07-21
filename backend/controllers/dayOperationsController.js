import { Op } from "sequelize";
import sequelize from "../config/database.js";
import { DayOperation, Material, Sale, Section, StockEntry } from "../models/index.js";

/**
 * DAY OPERATIONS CONTROLLER
 *
 * Manages daily business operations including:
 * - Day opening and closing procedures
 * - Cash management and reconciliation
 * - Stock snapshots and variance tracking
 * - Automated daily report generation
 * - Integration with existing sales and inventory systems
 * - Business activity logging
 */

const dayOperationsController = {
  // Get all day operations with pagination
  getAllDayOperations: async (req, res, next) => {
    try {
      const { page = 1, limit = 20, status } = req.query;
      const offset = (page - 1) * limit;

      const whereClause = {};
      if (status && ["opened", "closed"].includes(status)) {
        whereClause.status = status;
      }

      const dayOperations = await DayOperation.findAndCountAll({
        where: whereClause,
        order: [["date", "DESC"]],
        limit: parseInt(limit),
        offset: parseInt(offset)
      });

      res.status(200).json({
        dayOperations: dayOperations.rows,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(dayOperations.count / limit),
          totalItems: dayOperations.count,
          itemsPerPage: parseInt(limit)
        }
      });
    } catch (error) {
      console.error("Error fetching day operations:", error);
      next(error);
    }
  },

  // Helper function to calculate real-time day statistics
  calculateRealTimeDayStats: async (dayOperation, transaction = null) => {
    try {
      const dayStart = new Date(dayOperation.openedAt);
      const now = new Date();

      // Get all sales for the current day
      const salesData = await Sale.findAll({
        where: {
          saleDate: {
            [Op.between]: [dayStart, now]
          },
          isActive: true // Only include active sales
        },
        include: [
          {
            model: Section,
            as: "section",
            attributes: ["id", "name"]
          }
        ],
        transaction
      });

      // Calculate totals
      const totalSales = salesData.reduce((sum, sale) => sum + parseFloat(sale.totalAmount), 0);
      const totalTransactions = salesData.length;
      const averageTicket = totalTransactions > 0 ? totalSales / totalTransactions : 0;
      const expectedCash = parseFloat(dayOperation.openingCash) + totalSales;

      return {
        totalSales,
        totalTransactions,
        averageTicket,
        expectedCash,
        salesData
      };
    } catch (error) {
      console.error("Error calculating real-time day stats:", error);
      throw error;
    }
  },

  // Get current day operation with real-time data
  getCurrentDayOperation: async (req, res, next) => {
    try {
      const today = new Date().toISOString().split("T")[0];

      const currentDay = await DayOperation.findOne({
        where: { date: today }
      });

      if (!currentDay) {
        return res.status(200).json({
          currentDay: null,
          message: "No day operation found for today"
        });
      }

      // If day is still open, get real-time statistics
      if (currentDay.status === "opened") {
        const realTimeStats = await dayOperationsController.calculateRealTimeDayStats(currentDay);

        // Update the day operation with real-time data (but don't save to DB yet)
        const updatedDayData = {
          ...currentDay.toJSON(),
          totalSales: realTimeStats.totalSales,
          totalTransactions: realTimeStats.totalTransactions,
          averageTicket: realTimeStats.averageTicket,
          expectedCash: realTimeStats.expectedCash,
          realTimeUpdate: true // Flag to indicate this is real-time data
        };

        return res.status(200).json({
          currentDay: updatedDayData,
          message: "Real-time data included"
        });
      }

      res.status(200).json({ currentDay });
    } catch (error) {
      console.error("Error fetching current day operation:", error);
      next(error);
    }
  },

  // Get current day activities
  getCurrentDayActivities: async (req, res, next) => {
    try {
      const today = new Date().toISOString().split("T")[0];

      const currentDay = await DayOperation.findOne({
        where: { date: today },
        attributes: ["id", "date", "status", "activityLogs", "lastActivity"]
      });

      if (!currentDay) {
        return res.status(200).json({
          activities: [],
          message: "No day operation found for today"
        });
      }
      const activities = currentDay.activityLogs || [];
      res.status(200).json({
        activities: activities.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)),
        totalActivities: activities.length,
        lastActivity: currentDay.lastActivity,
        dayStatus: currentDay.status
      });
    } catch (error) {
      console.error("Error fetching current day activities:", error);
      next(error);
    }
  },

  // Open a new day
  openDay: async (req, res, next) => {
    const transaction = await sequelize.transaction();

    try {
      const { openingCash = 0, openedBy = "System", notes } = req.body;
      const today = new Date().toISOString().split("T")[0];

      // Check if day is already opened
      const existingDay = await DayOperation.findOne({
        where: { date: today },
        transaction
      });

      if (existingDay) {
        await transaction.rollback();
        return res.status(400).json({
          error: "Day is already opened",
          existingDay
        });
      }

      console.log(`\n=== OPENING DAY ${today} ===`);
      console.log(`Opening cash: $${openingCash}`);
      console.log(`Opened by: ${openedBy}`);

      // Create stock snapshot for opening
      const stockSnapshot = await StockEntry.findAll({
        include: [
          {
            model: Material,
            as: "material",
            attributes: ["id", "name", "baseUnit", "category"]
          }
        ],
        transaction
      });

      const openingStockSnapshot = stockSnapshot.map(entry => ({
        stockEntryId: entry.id,
        materialId: entry.materialId,
        materialName: entry.material?.name || "Unknown",
        materialCategory: entry.material?.category || "other",
        quantity: entry.purchasedIndividualQuantity || 0,
        unit: entry.material?.baseUnit || "unit",
        supplier: entry.supplier,
        costPerUnit: entry.costPerPurchasedUnit || 0,
        snapshotTime: new Date()
      }));

      // Create new day operation
      const newDay = await DayOperation.create(
        {
          date: today,
          status: "opened",
          openedAt: new Date(),
          openedBy,
          openingCash: parseFloat(openingCash),
          expectedCash: parseFloat(openingCash),
          openingStockSnapshot,
          notes,
          totalSales: 0,
          totalTransactions: 0,
          averageTicket: 0
        },
        { transaction }
      );

      await transaction.commit();

      console.log(`\n=== DAY ${today} SUCCESSFULLY OPENED ===`);
      console.log(`Day Operation ID: ${newDay.id}`);
      console.log(`Stock items captured: ${openingStockSnapshot.length}`);

      res.status(201).json({
        message: "Day successfully opened",
        dayOperation: newDay,
        stockItemsCaptured: openingStockSnapshot.length
      });
    } catch (error) {
      await transaction.rollback();
      console.error("Error opening day:", error);
      next(error);
    }
  },

  // Close current day
  closeDay: async (req, res, next) => {
    const transaction = await sequelize.transaction();

    try {
      const { closingCash, closedBy = "System", notes } = req.body;
      const today = new Date().toISOString().split("T")[0];

      // Find current day operation
      const currentDay = await DayOperation.findOne({
        where: {
          date: today,
          status: "opened"
        },
        transaction
      });

      if (!currentDay) {
        await transaction.rollback();
        return res.status(404).json({
          error: "No open day operation found for today"
        });
      }

      console.log(`\n=== CLOSING DAY ${today} ===`);
      console.log(`Day Operation ID: ${currentDay.id}`);

      // Calculate sales data for the day
      const dayStart = new Date(currentDay.openedAt);
      const dayEnd = new Date();

      const salesData = await Sale.findAll({
        where: {
          saleDate: {
            [Op.between]: [dayStart, dayEnd]
          },
          isActive: true // Only include active sales
        },
        include: [
          {
            model: Section,
            as: "section",
            attributes: ["id", "name"]
          }
        ],
        transaction
      });

      // Calculate totals
      const totalSales = salesData.reduce((sum, sale) => sum + parseFloat(sale.totalAmount), 0);
      const totalTransactions = salesData.length;
      const averageTicket = totalTransactions > 0 ? totalSales / totalTransactions : 0;

      // Calculate expected cash
      const expectedCash = parseFloat(currentDay.openingCash) + totalSales;
      const actualClosingCash = parseFloat(closingCash || 0);
      const cashVariance = actualClosingCash - expectedCash;

      // Create closing stock snapshot
      const closingStockSnapshot = await StockEntry.findAll({
        include: [
          {
            model: Material,
            as: "material",
            attributes: ["id", "name", "baseUnit", "category"]
          }
        ],
        transaction
      });

      const closingSnapshot = closingStockSnapshot.map(entry => ({
        stockEntryId: entry.id,
        materialId: entry.materialId,
        materialName: entry.material?.name || "Unknown",
        materialCategory: entry.material?.category || "other",
        quantity: entry.purchasedIndividualQuantity || 0,
        unit: entry.material?.baseUnit || "unit",
        supplier: entry.supplier,
        costPerUnit: entry.costPerPurchasedUnit || 0,
        snapshotTime: new Date()
      }));

      // Calculate stock variances
      const stockVariances = [];
      const openingSnapshot = currentDay.openingStockSnapshot || [];

      closingSnapshot.forEach(closingItem => {
        const openingItem = openingSnapshot.find(item => item.stockEntryId === closingItem.stockEntryId);

        if (openingItem) {
          const variance = closingItem.quantity - openingItem.quantity;
          if (variance !== 0) {
            stockVariances.push({
              stockEntryId: closingItem.stockEntryId,
              materialId: closingItem.materialId,
              materialName: closingItem.materialName,
              openingQuantity: openingItem.quantity,
              closingQuantity: closingItem.quantity,
              variance: variance,
              unit: closingItem.unit,
              varianceType: variance > 0 ? "gain" : "loss"
            });
          }
        }
      });

      // Generate daily report data
      const reportData = {
        date: today,
        operationalHours: Math.round(((dayEnd - dayStart) / (1000 * 60 * 60)) * 100) / 100,
        sales: {
          totalAmount: totalSales,
          totalTransactions,
          averageTicket,
          salesBySection: salesData.reduce((acc, sale) => {
            const sectionName = sale.section?.name || "Unknown";
            if (!acc[sectionName]) {
              acc[sectionName] = { count: 0, total: 0 };
            }
            acc[sectionName].count++;
            acc[sectionName].total += parseFloat(sale.totalAmount);
            return acc;
          }, {})
        },
        cash: {
          opening: parseFloat(currentDay.openingCash),
          expected: expectedCash,
          actual: actualClosingCash,
          variance: cashVariance,
          variancePercentage: expectedCash > 0 ? (cashVariance / expectedCash) * 100 : 0
        },
        inventory: {
          totalVariances: stockVariances.length,
          gains: stockVariances.filter(v => v.variance > 0).length,
          losses: stockVariances.filter(v => v.variance < 0).length,
          significantVariances: stockVariances.filter(v => Math.abs(v.variance) > 10)
        },
        generatedAt: new Date()
      };

      // Update day operation
      await currentDay.update(
        {
          status: "closed",
          closedAt: dayEnd,
          closedBy,
          closingCash: actualClosingCash,
          expectedCash,
          cashVariance,
          totalSales,
          totalTransactions,
          averageTicket,
          closingStockSnapshot: closingSnapshot,
          stockVariances,
          autoReportGenerated: true,
          reportData,
          notes: notes ? `${currentDay.notes || ""}\n[CLOSING] ${notes}` : currentDay.notes
        },
        { transaction }
      );

      await transaction.commit();

      console.log(`\n=== DAY ${today} SUCCESSFULLY CLOSED ===`);
      console.log(`Total Sales: $${totalSales.toFixed(2)}`);
      console.log(`Total Transactions: ${totalTransactions}`);
      console.log(`Cash Variance: $${cashVariance.toFixed(2)}`);
      console.log(`Stock Variances: ${stockVariances.length}`);

      res.status(200).json({
        message: "Day successfully closed",
        dayOperation: await DayOperation.findByPk(currentDay.id),
        dailyReport: reportData,
        summary: {
          totalSales,
          totalTransactions,
          averageTicket,
          cashVariance,
          stockVariances: stockVariances.length
        }
      });
    } catch (error) {
      await transaction.rollback();
      console.error("Error closing day:", error);
      next(error);
    }
  },

  // Get day operation by ID
  getDayOperationById: async (req, res, next) => {
    try {
      const { id } = req.params;

      const dayOperation = await DayOperation.findByPk(id);

      if (!dayOperation) {
        return res.status(404).json({ error: "Day operation not found" });
      }

      res.status(200).json({ dayOperation });
    } catch (error) {
      console.error("Error fetching day operation:", error);
      next(error);
    }
  },

  // Get daily report for a specific day
  getDailyReport: async (req, res, next) => {
    try {
      const { date } = req.params;

      const dayOperation = await DayOperation.findOne({
        where: { date }
      });

      if (!dayOperation) {
        return res.status(404).json({ error: "Day operation not found for the specified date" });
      }

      if (!dayOperation.autoReportGenerated) {
        return res.status(400).json({ error: "Daily report not yet generated for this day" });
      }

      res.status(200).json({
        date,
        report: dayOperation.reportData,
        dayOperation: {
          id: dayOperation.id,
          status: dayOperation.status,
          openedAt: dayOperation.openedAt,
          closedAt: dayOperation.closedAt,
          openedBy: dayOperation.openedBy,
          closedBy: dayOperation.closedBy
        }
      });
    } catch (error) {
      console.error("Error fetching daily report:", error);
      next(error);
    }
  },

  // Update day operation (for corrections)
  updateDayOperation: async (req, res, next) => {
    const transaction = await sequelize.transaction();

    try {
      const { id } = req.params;
      const updates = req.body;

      const dayOperation = await DayOperation.findByPk(id, { transaction });

      if (!dayOperation) {
        await transaction.rollback();
        return res.status(404).json({ error: "Day operation not found" });
      }

      // Prevent updating closed days unless specifically allowed
      if (dayOperation.status === "closed" && !updates.allowClosedDayUpdate) {
        await transaction.rollback();
        return res.status(400).json({
          error: "Cannot update closed day operation without explicit permission"
        });
      }

      await dayOperation.update(updates, { transaction });
      await transaction.commit();

      res.status(200).json({
        message: "Day operation updated successfully",
        dayOperation
      });
    } catch (error) {
      await transaction.rollback();
      console.error("Error updating day operation:", error);
      next(error);
    }
  }
};

export default dayOperationsController;

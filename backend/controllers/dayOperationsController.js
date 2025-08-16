import { Op } from "sequelize";
import sequelize from "../config/database.js";
import { DayOperation, DayOperationReport, Material, Sale, Section, StockEntry, User } from "../models/index.js";

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
      const { openingCash = 0, openedBy = "System", notes, userId } = req.body;
      const today = new Date().toISOString().split("T")[0];
      // Find today's day operation (if any)
      const existingDay = await DayOperation.findOne({
        where: { date: today },
        transaction
      });

      const isUserSpecificOperation = userId !== undefined;

      // USER-SPECIFIC OPEN: only update reportData, never create/alter global day
      if (isUserSpecificOperation) {
        if (!existingDay || existingDay.status !== "opened") {
          await transaction.rollback();
          return res.status(400).json({ error: "Global day is not opened. Ask a manager to open the day first." });
        }

        try {
          const user = await User.findByPk(userId, { transaction });
          const userName = user ? `${user.firstName} ${user.lastName}`.trim() : `User ${userId}`;

          const reportData = existingDay.reportData || {};
          const userOrderStats = reportData.userOrderStats || [];
          const idx = userOrderStats.findIndex(u => u.userId === userId);
          const now = new Date();

          if (idx >= 0) {
            userOrderStats[idx] = {
              ...userOrderStats[idx],
              openingTime: now.toISOString(),
              openingCash: parseFloat(openingCash ?? 0),
              closingTime: null,
              closingCash: null,
              notes: notes || userOrderStats[idx].notes
            };
          } else {
            userOrderStats.push({
              userId,
              userName,
              openingTime: now.toISOString(),
              openingCash: parseFloat(openingCash ?? 0),
              closingTime: null,
              closingCash: null,
              orderCount: 0,
              totalAmount: 0,
              cashSales: 0,
              cardSales: 0,
              notes: notes || ''
            });
          }

          await existingDay.update({ reportData: { ...reportData, userOrderStats } }, { transaction });
        } catch (e) {
          await transaction.rollback();
          console.error("Error updating user-specific open:", e);
          return next(e);
        }

        await transaction.commit();
        return res.status(200).json({ message: "User day opened", dayOperation: existingDay });
      }

      // GLOBAL OPEN: create or reopen day
      if (existingDay && existingDay.status === "opened") {
        await transaction.rollback();
        return res.status(400).json({ error: "Day is already opened" });
      }

      // Build opening stock snapshot
      const stockSnapshot = await StockEntry.findAll({
        include: [
          { model: Material, as: "material", attributes: ["id", "name", "baseUnit", "categoryId"] }
        ],
        transaction
      });

      const openingStockSnapshot = stockSnapshot.map(entry => ({
        stockEntryId: entry.id,
        materialId: entry.materialId,
        materialName: entry.material?.name || "Unknown",
        materialCategory: entry.material?.categoryId || "other",
        quantity: entry.purchasedIndividualQuantity || 0,
        unit: entry.material?.baseUnit || "unit",
        supplier: entry.supplier,
        costPerUnit: entry.costPerPurchasedUnit || 0,
        snapshotTime: new Date()
      }));

      let dayOperation;
      if (existingDay && existingDay.status === "closed") {
        dayOperation = await existingDay.update(
          {
            status: "opened",
            openedAt: new Date(),
            openedBy,
            openingCash: parseFloat(openingCash),
            expectedCash: parseFloat(openingCash),
            openingStockSnapshot,
            notes: notes ? `${existingDay.notes}\n[REOPENED] ${notes}` : existingDay.notes,
            totalSales: 0,
            totalTransactions: 0,
            averageTicket: 0,
            closedAt: null,
            closedBy: null,
            closingCash: null,
            cashVariance: 0,
            closingStockSnapshot: [],
            stockVariances: [],
            autoReportGenerated: false,
            reportData: {},
            activityLogs: [],
            lastActivity: null
          },
          { transaction }
        );
      } else {
        dayOperation = await DayOperation.create(
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
      }

      await transaction.commit();
      return res.status(201).json({ message: existingDay ? "Day successfully reopened" : "Day successfully opened", dayOperation, stockItemsCaptured: openingStockSnapshot.length });
    } catch (error) {
      await transaction.rollback();
      console.error("Error opening day:", error);
      next(error);
    }
  },

  // Close the current day
  closeDay: async (req, res, next) => {
    const transaction = await sequelize.transaction();

    try {
      const { closingCash, closedBy = "System", notes, userId } = req.body;
      const today = new Date().toISOString().split("T")[0];

      // Find the current day operation
      const dayOperation = await DayOperation.findOne({
        where: { date: today },
        transaction
      });

      if (!dayOperation) {
        await transaction.rollback();
        return res.status(404).json({ error: "No day operation found for today" });
      }

      const isUserSpecificOperation = userId !== undefined;

      // USER-SPECIFIC CLOSE: only update reportData for that user
      if (isUserSpecificOperation) {
        try {
          // sales for this user today
          const dayStart = new Date(dayOperation.openedAt);
          const dayEnd = new Date();
          const salesData = await Sale.findAll({
            where: { saleDate: { [Op.between]: [dayStart, dayEnd] }, isActive: true, userId },
            include: [{ model: Section, as: "section", attributes: ["id", "name"] }],
            transaction
          });

          const userTotalSales = salesData.reduce((sum, sale) => sum + parseFloat(sale.totalAmount), 0);
          const userCashSales = salesData.filter(s => s.paymentMethod === 'cash').reduce((sum, s) => sum + parseFloat(s.totalAmount), 0);
          const userCardSales = salesData.filter(s => s.paymentMethod === 'card').reduce((sum, s) => sum + parseFloat(s.totalAmount), 0);

          const reportData = dayOperation.reportData || {};
          const userOrderStats = reportData.userOrderStats || [];
          const idx = userOrderStats.findIndex(u => u.userId === userId);
          const now = new Date();

          if (idx >= 0) {
            userOrderStats[idx] = {
              ...userOrderStats[idx],
              closingTime: now.toISOString(),
              closingCash: parseFloat(closingCash ?? 0),
              cashSales: userCashSales,
              cardSales: userCardSales,
              orderCount: salesData.length,
              totalAmount: userTotalSales,
              notes: notes || userOrderStats[idx].notes
            };
          } else {
            userOrderStats.push({
              userId,
              userName: `User ${userId}`,
              openingTime: dayStart.toISOString(),
              openingCash: 0,
              closingTime: now.toISOString(),
              closingCash: parseFloat(closingCash ?? 0),
              orderCount: salesData.length,
              totalAmount: userTotalSales,
              cashSales: userCashSales,
              cardSales: userCardSales,
              notes: notes || ''
            });
          }

          await dayOperation.update({ reportData: { ...reportData, userOrderStats } }, { transaction });
          await transaction.commit();
          return res.status(200).json({ message: "User day closed", dayOperation, userStats: userOrderStats.find(u => u.userId === userId) });
        } catch (e) {
          await transaction.rollback();
          console.error("Error updating user-specific close:", e);
          return next(e);
        }
      }

      // For global day operations (admin), check if day is already closed
      if (dayOperation.status === "closed") {
        await transaction.rollback();
        return res.status(400).json({ error: "Day is already closed" });
      }

      // Calculate sales data for the day
      const dayStart = new Date(dayOperation.openedAt);
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
      const expectedCash = parseFloat(dayOperation.openingCash) + totalSales;
      const actualClosingCash = parseFloat(closingCash || 0);
      const cashVariance = actualClosingCash - expectedCash;

      // Create closing stock snapshot
      const closingStockSnapshot = await StockEntry.findAll({
        include: [
          {
            model: Material,
            as: "material",
            attributes: ["id", "name", "baseUnit", "categoryId"]
          }
        ],
        transaction
      });

      const closingSnapshot = closingStockSnapshot.map(entry => ({
        stockEntryId: entry.id,
        materialId: entry.materialId,
        materialName: entry.material?.name || "Unknown",
        materialCategory: entry.material?.categoryId || "other",
        quantity: entry.purchasedIndividualQuantity || 0,
        unit: entry.material?.baseUnit || "unit",
        supplier: entry.supplier,
        costPerUnit: entry.costPerPurchasedUnit || 0,
        snapshotTime: new Date()
      }));

      // Calculate stock variances
      const stockVariances = [];
      const openingSnapshot = dayOperation.openingStockSnapshot || [];

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
      const existingReportData = dayOperation.reportData || {};
      const reportData = {
        ...existingReportData,
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
          opening: parseFloat(dayOperation.openingCash),
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
      
      // Handle individual user day status if userId is provided
      if (isUserSpecificOperation && userId) {
        try {
          // Get user information
          const user = await User.findByPk(userId, { transaction });
          const userName = user ? `${user.firstName} ${user.lastName}`.trim() : `User ${userId}`;
          
          // Get user order stats
          const userOrderStats = reportData.userOrderStats || [];
          const now = new Date();
          
          // Find user's sales data
          const userSalesData = salesData.filter(sale => sale.userId === userId);
          const userTotalSales = userSalesData.reduce((sum, sale) => sum + parseFloat(sale.totalAmount), 0);
          const userCashSales = userSalesData
            .filter(sale => sale.paymentMethod === 'cash')
            .reduce((sum, sale) => sum + parseFloat(sale.totalAmount), 0);
          const userCardSales = userSalesData
            .filter(sale => sale.paymentMethod === 'card')
            .reduce((sum, sale) => sum + parseFloat(sale.totalAmount), 0);
          
          // Check if user already exists in stats
          const existingUserIndex = userOrderStats.findIndex(u => u.userId === userId);
          
          if (existingUserIndex >= 0) {
            // Update existing user stats
            userOrderStats[existingUserIndex] = {
              ...userOrderStats[existingUserIndex],
              closingTime: now.toISOString(),
              closingCash: parseFloat(closingCash),
              cashSales: userCashSales,
              cardSales: userCardSales,
              orderCount: userSalesData.length,
              totalAmount: userTotalSales,
              notes: notes || userOrderStats[existingUserIndex].notes
            };
          } else {
            // Add new user stats (shouldn't happen for closing, but handle just in case)
            userOrderStats.push({
              userId,
              userName,
              openingTime: dayStart.toISOString(), // Assume opened at day start
              openingCash: 0, // Default opening cash
              closingTime: now.toISOString(),
              closingCash: parseFloat(closingCash),
              orderCount: userSalesData.length,
              totalAmount: userTotalSales,
              cashSales: userCashSales,
              cardSales: userCardSales,
              notes: notes || ''
            });
          }
          
          // Update report data with updated user stats
          reportData.userOrderStats = userOrderStats;
          
          console.log(`Updated day operation with user ${userId} closing status`);
        } catch (userError) {
          console.error(`Error updating user day status for user ${userId}:`, userError);
          // Continue with the transaction even if user update fails
        }
      }

      // Update day operation
      await dayOperation.update(
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
          notes: notes ? (dayOperation.notes ? `${dayOperation.notes}\n[CLOSED] ${notes}` : notes) : dayOperation.notes
        },
        { transaction }
      );

      // Create a DayOperationReport record automatically
      const report = await DayOperationReport.create({
        dayOperationId: dayOperation.id,
        reportDate: today,
        reportType: "daily",
        salesSummary: reportData.sales || {},
        cashSummary: reportData.cash || {},
        inventorySummary: reportData.inventory || {},
        topSellingItems: [],
        salesByCategory: {},
        salesBySection: reportData.sales?.salesBySection || {},
        salesByHour: [],
        paymentMethodBreakdown: {},
        stockMovements: [],
        significantVariances: stockVariances || [],
        notes: notes ? `Auto-generated during day closing. ${notes}` : 'Auto-generated during day closing.',
        generatedBy: closedBy || 'System',
        reportStatus: "final",
        generatedAt: new Date()
      }, { transaction });

      // For individual user day operations, don't close the global day
      if (isUserSpecificOperation) {
        await transaction.commit();
        res.status(200).json({
          message: "User day closed successfully",
          dayOperation,
          userStats: reportData.userOrderStats?.find(u => u.userId === userId),
          summary: {
            totalSales,
            totalTransactions,
            averageTicket,
            cashVariance,
            stockVariances: stockVariances.length
          }
        });
      } else {
        // For global day operations (admin), close the entire day
        await transaction.commit();
        res.status(200).json({
          message: "Day closed successfully",
          dayOperation,
          dailyReport: reportData,
          summary: {
            totalSales,
            totalTransactions,
            averageTicket,
            cashVariance,
            stockVariances: stockVariances.length
          }
        });
      }
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
  // Get user order statistics for the current day with individual day status
  // getCurrentDayUserOrderStats: async (req, res, next) => {
  //   try {
  //     const today = new Date().toISOString().split("T")[0];

  //     // Find current day operation
  //     const currentDay = await DayOperation.findOne({
  //       where: { date: today }
  //     });

  //     if (!currentDay) {
  //       return res.status(200).json({
  //         userOrderStats: [],
  //         message: "No day operation found for today"
  //       });
  //     }

  //     const dayStart = new Date(currentDay.openedAt);
  //     const dayEnd = currentDay.status === "closed" ? new Date(currentDay.closedAt) : new Date();

  //     // Get all sales for the current day grouped by user
  //     const userOrderStats = await Sale.findAll({
  //       where: {
  //         saleDate: {
  //           [Op.between]: [dayStart, dayEnd]
  //         },
  //         isActive: true,
  //         userId: { [Op.not]: null } // Only include sales with a userId
  //       },
  //       attributes: [
  //         'userId',
  //         [sequelize.literal('COUNT("Sale"."id")'), 'orderCount'],
  //         [sequelize.fn('SUM', sequelize.col('Sale.totalAmount')), 'totalAmount'],
  //         [
  //           sequelize.fn(
  //             'SUM',
  //             sequelize.literal("CASE WHEN \"Sale\".\"paymentMethod\" = 'cash' THEN \"Sale\".\"totalAmount\" ELSE 0 END")
  //           ),
  //           'cashSales'
  //         ],
  //         [
  //           sequelize.fn(
  //             'SUM',
  //             sequelize.literal("CASE WHEN \"Sale\".\"paymentMethod\" = 'card' THEN \"Sale\".\"totalAmount\" ELSE 0 END")
  //           ),
  //           'cardSales'
  //         ]
  //       ],
  //       include: [
  //         {
  //           model: User,
  //           as: "creator",
  //           attributes: ['firstName', 'lastName']
  //         }
  //       ],
  //       group: ['Sale.userId', 'creator.id'],
  //       raw: false
  //     });

  //     // Get user-specific day operation data from reportData if available
  //     let userDayData = [];
  //     if (currentDay.reportData && currentDay.reportData.userOrderStats) {
  //       userDayData = currentDay.reportData.userOrderStats;
  //     }

  //     // Format the response with individual user day status
  //     const formattedStats = userOrderStats.map(stat => {
  //       // Find existing user data if available
  //       const userData = userDayData.find(u => u.userId === stat.userId) || {};
        
  //       return {
  //         userId: stat.userId,
  //         userName: stat.creator ? `${stat.creator.firstName} ${stat.creator.lastName}`.trim() : `User ${stat.userId}`,
  //         orderCount: parseInt(stat.dataValues.orderCount, 10),
  //         totalAmount: parseFloat(stat.dataValues.totalAmount),
  //         cashSales: parseFloat(stat.dataValues.cashSales || 0),
  //         cardSales: parseFloat(stat.dataValues.cardSales || 0),
  //         // Include user-specific day operation data
  //         openingTime: userData.openingTime || null,
  //         closingTime: userData.closingTime || null,
  //         openingCash: userData.openingCash || 0,
  //         closingCash: userData.closingCash || 0,
  //         notes: userData.notes || ''
  //       };
  //     });

  //     res.status(200).json({
  //       userOrderStats: formattedStats,
  //       totalUsers: formattedStats.length,
  //       dayStatus: currentDay.status
  //     });
  //   } catch (error) {
  //     console.error("Error fetching user order statistics:", error);
  //     next(error);
  //   }
  // },
  getCurrentDayUserOrderStats: async (req, res, next) => {
    try {
      const today = new Date().toISOString().split("T")[0];

      // Find current day operation
      const currentDay = await DayOperation.findOne({
        where: { date: today }
      });

      if (!currentDay) {
        return res.status(200).json({
          userOrderStats: [],
          message: "No day operation found for today"
        });
      }

      const dayStart = new Date(currentDay.openedAt);
      const dayEnd = currentDay.status === "closed" ? new Date(currentDay.closedAt) : new Date();

      // First, verify the actual column names in your Sales model
      const saleAttributes = Object.keys(Sale.rawAttributes);
      console.log('Sales model attributes:', saleAttributes);

      // Build aggregate attributes dynamically depending on whether paymentMethod exists
      const paymentMethodExists = saleAttributes.includes('paymentMethod');
      const aggregateAttributes = [
        'userId',
        [sequelize.fn('COUNT', sequelize.col('Sale.id')), 'orderCount'],
        [sequelize.fn('SUM', sequelize.col('Sale.totalAmount')), 'totalAmount'],
        paymentMethodExists
          ? [
              sequelize.fn(
                'SUM',
                sequelize.literal("CASE WHEN \"Sale\".\"paymentMethod\" = 'cash' THEN \"Sale\".\"totalAmount\" ELSE 0 END")
              ),
              'cashSales'
            ]
          : [sequelize.literal('0'), 'cashSales'],
        paymentMethodExists
          ? [
              sequelize.fn(
                'SUM',
                sequelize.literal("CASE WHEN \"Sale\".\"paymentMethod\" = 'card' THEN \"Sale\".\"totalAmount\" ELSE 0 END")
              ),
              'cardSales'
            ]
          : [sequelize.literal('0'), 'cardSales']
      ];

      // Get all sales for the current day grouped by user
      const userOrderStats = await Sale.findAll({
        where: {
          saleDate: {
            [Op.between]: [dayStart, dayEnd]
          },
          isActive: true,
          userId: { [Op.not]: null }
        },
        attributes: aggregateAttributes,
        include: [
          {
            model: User,
            as: "creator",
            attributes: ['id', 'firstName', 'lastName']
          }
        ],
        group: ['Sale.userId', 'creator.id'],
        raw: false
      });

      // Get user-specific day operation data from reportData if available
      let userDayData = [];
      if (currentDay.reportData && currentDay.reportData.userOrderStats) {
        userDayData = currentDay.reportData.userOrderStats;
      }

      // Format the response
      const formattedStats = userOrderStats.map(stat => {
        const userData = userDayData.find(u => u.userId === stat.userId) || {};
        
        return {
          userId: stat.userId,
          userName: stat.creator ? `${stat.creator.firstName} ${stat.creator.lastName}`.trim() : `User ${stat.userId}`,
          orderCount: parseInt(stat.dataValues.orderCount, 10),
          totalAmount: parseFloat(stat.dataValues.totalAmount),
          cashSales: parseFloat(stat.dataValues.cashSales || 0),
          cardSales: parseFloat(stat.dataValues.cardSales || 0),
          openingTime: userData.openingTime || null,
          closingTime: userData.closingTime || null,
          openingCash: userData.openingCash || 0,
          closingCash: userData.closingCash || 0,
          notes: userData.notes || ''
        };
      });

      res.status(200).json({
        userOrderStats: formattedStats,
        totalUsers: formattedStats.length,
        dayStatus: currentDay.status
      });
    } catch (error) {
      console.error("Error fetching user order statistics:", error);
      next(error);
    }
  },

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

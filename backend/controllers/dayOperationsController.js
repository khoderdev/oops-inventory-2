import { Op } from "sequelize";
import sequelize from "../config/database.js";
import { DayOperation, DayOperationReport, Material, Sale, Section, StockEntry, User } from "../models/index.js";

const dayOperationsController = {
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
      const salesData = await Sale.findAll({
        where: { saleDate: { [Op.between]: [dayStart, now] }, isActive: true },
        include: [{ model: Section, as: "section", attributes: ["id", "name"] }],
        transaction
      });
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
      if (currentDay.status === "opened") {
        const realTimeStats = await dayOperationsController.calculateRealTimeDayStats(currentDay);
        const updatedDayData = {
          ...currentDay.toJSON(),
          totalSales: realTimeStats.totalSales,
          totalTransactions: realTimeStats.totalTransactions,
          averageTicket: realTimeStats.averageTicket,
          expectedCash: realTimeStats.expectedCash,
          realTimeUpdate: true
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
      console.log("[DayOps][openDay] Incoming payload:", { openingCash, openedBy, notes, userId });
      const today = new Date().toISOString().split("T")[0];
      const existingDay = await DayOperation.findOne({
        where: { date: today },
        transaction
      });
      console.log("[DayOps][openDay] existingDay:", existingDay ? { id: existingDay.id, status: existingDay.status } : null);
      const isUserSpecificOperation = userId !== undefined;
      console.log("[DayOps][openDay] isUserSpecificOperation:", isUserSpecificOperation);
      if (isUserSpecificOperation) {
        // If no global day or it's closed, auto-create/reopen it to allow staff shift to open
        let activeDay = existingDay;
        if (!activeDay || activeDay.status !== "opened") {
          console.warn("[DayOps][openDay] Auto-opening global day for user-specific open", { hadExisting: !!activeDay, status: activeDay?.status });
          // Build opening stock snapshot for new/reopened day
          console.log("[DayOps][openDay] Building opening stock snapshot (user-specific path)...");
          const stockSnapshot = await StockEntry.findAll({
            include: [{ model: Material, as: "material", attributes: ["id", "name", "baseUnit", "categoryId"] }],
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
          console.log("[DayOps][openDay] openingStockSnapshot items (user path):", openingStockSnapshot.length);
          const user = await User.findByPk(userId, { transaction });
          const userName = user ? `${user.firstName} ${user.lastName}`.trim() : `User ${userId}`;
          if (activeDay && activeDay.status === "closed") {
            console.log("[DayOps][openDay] Reopening closed day (user path)", { dayId: activeDay.id });
            activeDay = await activeDay.update(
              {
                status: "opened",
                openedAt: new Date(),
                openedBy: openedBy || userName || "System",
                openingCash: parseFloat(openingCash ?? 0),
                expectedCash: parseFloat(openingCash ?? 0),
                openingStockSnapshot,
                notes: notes ? `${activeDay.notes || ""}\n[REOPENED] ${notes}` : activeDay.notes,
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
          } else if (!activeDay) {
            console.log("[DayOps][openDay] Creating new day operation (user path) for", { date: today });
            activeDay = await DayOperation.create(
              {
                date: today,
                status: "opened",
                openedAt: new Date(),
                openedBy: openedBy || userName || "System",
                openingCash: parseFloat(openingCash ?? 0),
                expectedCash: parseFloat(openingCash ?? 0),
                openingStockSnapshot,
                notes,
                totalSales: 0,
                totalTransactions: 0,
                averageTicket: 0
              },
              { transaction }
            );
          }
          // Refresh reference
          await activeDay.reload({ transaction });
        }
        // At this point we have an opened global day; proceed with user stats
        try {
          const user = await User.findByPk(userId, { transaction });
          const userName = user ? `${user.firstName} ${user.lastName}`.trim() : `User ${userId}`;
          const reportData = (activeDay.reportData || {});
          const userOrderStats = reportData.userOrderStats || [];
          const idx = userOrderStats.findIndex(u => u.userId === userId);
          const now = new Date();
          console.log("[DayOps][openDay][user] Preparing user stats update", { userId, hasExisting: idx >= 0, openingCash: parseFloat(openingCash ?? 0) });
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
              notes: notes || ""
            });
          }
          console.log("[DayOps][openDay][user] Updating day reportData.userOrderStats (len):", userOrderStats.length);
          await activeDay.update({ reportData: { ...(activeDay.reportData || {}), userOrderStats } }, { transaction });
          await activeDay.reload({ transaction });
          await transaction.commit();
          console.log("[DayOps][openDay][user] Commit successful for user-specific open", { dayId: activeDay.id, userId });
          return res.status(existingDay ? 200 : 201).json({ message: "User day opened", dayOperation: activeDay });
        } catch (e) {
          await transaction.rollback();
          console.error("Error updating user-specific open:", e);
          return next(e);
        }
      }
      if (existingDay && existingDay.status === "opened") {
        await transaction.rollback();
        console.warn("[DayOps][openDay] Global open rejected: day already opened", { dayId: existingDay.id });
        return res.status(400).json({ error: "Day is already opened" });
      }
      console.log("[DayOps][openDay] Building opening stock snapshot...");
      const stockSnapshot = await StockEntry.findAll({
        include: [{ model: Material, as: "material", attributes: ["id", "name", "baseUnit", "categoryId"] }],
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
      console.log("[DayOps][openDay] openingStockSnapshot items:", openingStockSnapshot.length);
      let dayOperation;
      if (existingDay && existingDay.status === "closed") {
        console.log("[DayOps][openDay] Reopening closed day", { dayId: existingDay.id });
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
        console.log("[DayOps][openDay] Creating new day operation for", { date: today });
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
      console.log("[DayOps][openDay] Commit successful", { dayId: dayOperation?.id, itemsCaptured: openingStockSnapshot.length });
      return res.status(201).json({ message: existingDay ? "Day successfully reopened" : "Day successfully opened", dayOperation, stockItemsCaptured: openingStockSnapshot.length });
    } catch (error) {
      await transaction.rollback();
      console.error("Error opening day:", error);
      next(error);
    }
  },

  closeDay: async (req, res, next) => {
    const transaction = await sequelize.transaction();
    try {
      const { closingCash, closedBy = "System", notes, userId } = req.body;
      console.log("[DayOps][closeDay] Incoming payload:", { closingCash, closedBy, notes, userId });
      const today = new Date().toISOString().split("T")[0];
      const dayOperation = await DayOperation.findOne({
        where: { date: today },
        transaction
      });
      console.log("[DayOps][closeDay] dayOperation:", dayOperation ? { id: dayOperation.id, status: dayOperation.status } : null);
      if (!dayOperation) {
        await transaction.rollback();
        return res.status(404).json({ error: "No day operation found for today" });
      }
      const isUserSpecificOperation = userId !== undefined;
      console.log("[DayOps][closeDay] isUserSpecificOperation:", isUserSpecificOperation);
      if (isUserSpecificOperation) {
        try {
          const dayStart = new Date(dayOperation.openedAt);
          const dayEnd = new Date();
          console.log("[DayOps][closeDay][user] Calculating sales window", { dayStart, dayEnd, userId });
          const salesData = await Sale.findAll({
            where: { saleDate: { [Op.between]: [dayStart, dayEnd] }, isActive: true, userId },
            include: [{ model: Section, as: "section", attributes: ["id", "name"] }],
            transaction
          });
          console.log("[DayOps][closeDay][user] salesData length:", salesData.length);
          const userTotalSales = salesData.reduce((sum, sale) => sum + parseFloat(sale.totalAmount), 0);
          const userCashSales = salesData.filter(s => s.paymentMethod === "cash").reduce((sum, s) => sum + parseFloat(s.totalAmount), 0);
          const userCardSales = salesData.filter(s => s.paymentMethod === "card").reduce((sum, s) => sum + parseFloat(s.totalAmount), 0);
          console.log("[DayOps][closeDay][user] totals:", { userTotalSales, userCashSales, userCardSales, closingCash: parseFloat(closingCash ?? 0) });
          const reportData = dayOperation.reportData || {};
          const userOrderStats = reportData.userOrderStats || [];
          const idx = userOrderStats.findIndex(u => u.userId === userId);
          const now = new Date();
          console.log("[DayOps][closeDay][user] Updating user stats", { hasExisting: idx >= 0, listLen: userOrderStats.length });
          const user = await User.findByPk(userId, { transaction });
          const userName = user ? `${user.firstName} ${user.lastName}`.trim() : `User ${userId}`;
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
              userName,
              openingTime: dayStart.toISOString(),
              openingCash: 0,
              closingTime: now.toISOString(),
              closingCash: parseFloat(closingCash ?? 0),
              orderCount: salesData.length,
              totalAmount: userTotalSales,
              cashSales: userCashSales,
              cardSales: userCardSales,
              notes: notes || ""
            });
          }
          console.log("[DayOps][closeDay][user] Persisting user stats (len):", userOrderStats.length);
          const updatedReportData = {
            ...dayOperation.reportData,
            userOrderStats: [...userOrderStats]
          };
          console.log("[DayOps][closeDay][user] Updating reportData:", JSON.stringify(updatedReportData, null, 2));
          await dayOperation.update({ reportData: updatedReportData }, { transaction, logging: console.log });
          console.log("[DEBUG] After update - reloaded reportData:", JSON.stringify(dayOperation.reportData, null, 2));
          await dayOperation.reload({ transaction });
          await transaction.commit();
          console.log("[DayOps][closeDay][user] Commit successful for user-specific close", { dayId: dayOperation.id, userId });
          return res.status(200).json({
            message: "User day closed",
            dayOperation,
            userStats: userOrderStats.find(u => u.userId === userId)
          });
        } catch (e) {
          await transaction.rollback();
          console.error("Error updating user-specific close:", e);
          return next(e);
        }
      }
      if (dayOperation.status === "closed") {
        await transaction.rollback();
        console.warn("[DayOps][closeDay] Global close rejected: day already closed", { dayId: dayOperation.id });
        return res.status(400).json({ error: "Day is already closed" });
      }
      const dayStart = new Date(dayOperation.openedAt);
      const dayEnd = new Date();
      const salesData = await Sale.findAll({
        where: { saleDate: { [Op.between]: [dayStart, dayEnd] }, isActive: true },
        include: [{ model: Section, as: "section", attributes: ["id", "name"] }],
        transaction
      });
      console.log("[DayOps][closeDay] salesData length:", salesData.length);
      const totalSales = salesData.reduce((sum, sale) => sum + parseFloat(sale.totalAmount), 0);
      const totalTransactions = salesData.length;
      const averageTicket = totalTransactions > 0 ? totalSales / totalTransactions : 0;
      console.log("[DayOps][closeDay] totals:", { totalSales, totalTransactions, averageTicket });
      const expectedCash = parseFloat(dayOperation.openingCash) + totalSales;
      const actualClosingCash = parseFloat(closingCash || 0);
      const cashVariance = actualClosingCash - expectedCash;
      console.log("[DayOps][closeDay] cash summary:", { openingCash: parseFloat(dayOperation.openingCash), expectedCash, actualClosingCash, cashVariance });
      console.log("[DayOps][closeDay] Building closing stock snapshot...");
      const closingStockSnapshot = await StockEntry.findAll({
        include: [{ model: Material, as: "material", attributes: ["id", "name", "baseUnit", "categoryId"] }],
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
      console.log("[DayOps][closeDay] closingSnapshot items:", closingSnapshot.length);
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
      console.log("[DayOps][closeDay] stockVariances count:", stockVariances.length);
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
      console.log("[DayOps][closeDay] Persisting global day closure/update...");
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
        { transaction, logging: console.log }
      );
      const report = await DayOperationReport.create(
        {
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
          notes: notes ? `Auto-generated during day closing. ${notes}` : "Auto-generated during day closing.",
          generatedBy: closedBy || "System",
          reportStatus: "final",
          generatedAt: new Date()
        },
        { transaction }
      );
      console.log("[DayOps][closeDay] Report created", { reportId: report?.id, dayId: dayOperation.id });
      await transaction.commit();
      console.log("[DayOps][closeDay] Commit successful (global path)");
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

  getCurrentDayUserOrderStats: async (req, res, next) => {
    try {
      const today = new Date().toISOString().split("T")[0];
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
      const saleAttributes = Object.keys(Sale.rawAttributes);
      console.log("Sales model attributes:", saleAttributes);
      const paymentMethodExists = saleAttributes.includes("paymentMethod");
      const aggregateAttributes = [
        "userId",
        [sequelize.fn("COUNT", sequelize.col("Sale.id")), "orderCount"],
        [sequelize.fn("SUM", sequelize.col("Sale.totalAmount")), "totalAmount"],
        paymentMethodExists ? [sequelize.fn("SUM", sequelize.literal('CASE WHEN "Sale"."paymentMethod" = \'cash\' THEN "Sale"."totalAmount" ELSE 0 END')), "cashSales"] : [sequelize.literal("0"), "cashSales"],
        paymentMethodExists ? [sequelize.fn("SUM", sequelize.literal('CASE WHEN "Sale"."paymentMethod" = \'card\' THEN "Sale"."totalAmount" ELSE 0 END')), "cardSales"] : [sequelize.literal("0"), "cardSales"]
      ];
      const userOrderStats = await Sale.findAll({
        where: { saleDate: { [Op.between]: [dayStart, dayEnd] }, isActive: true, userId: { [Op.not]: null } },
        attributes: aggregateAttributes,
        include: [{ model: User, as: "creator", attributes: ["id", "firstName", "lastName"] }],
        group: ["Sale.userId", "creator.id"],
        raw: false
      });
      let userDayData = [];
      if (currentDay.reportData && currentDay.reportData.userOrderStats) {
        userDayData = currentDay.reportData.userOrderStats;
      }
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
          notes: userData.notes || ""
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

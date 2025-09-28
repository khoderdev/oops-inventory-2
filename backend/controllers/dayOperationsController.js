import { Op } from "sequelize";
import sequelize from "../config/database.js";
import { DayOperation, DayOperationReport, DayOperationStockSnapshot, DayOperationStockVariance, DayOperationActivity, DayOperationUserStats, Material, Sale, Section, StockEntry, User, OrderItem, Order, MenuItem } from "../models/index.js";
import { createStockSnapshots, createStockVariances, createActivityLog, getStockSnapshots, getStockVariances, getActivityLogs, getUserStats, getOrCreateUserStats, convertLegacyToRelational } from "./dayOperationsControllerHelpers.js";

// Helper function to get today's date in YYYY-MM-DD format
const getTodayDate = () => new Date().toISOString().split("T")[0];

const dayOperationsController = {
  getAllDayOperations: async (req, res, next) => {
    try {
      const { page = 1, limit = 20, status } = req.query;
      const offset = (page - 1) * limit;
      const whereClause = {};
      if (status && ["opened", "closed"].includes(status)) {
        whereClause.status = status;
      }

      // Group by date and get the most recent day operation for each date
      const dayOperations = await DayOperation.findAndCountAll({
        where: whereClause,
        order: [
          ["date", "DESC"],
          ["createdAt", "DESC"]
        ],
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
      const today = getTodayDate();

      // First try to find an open day for today
      let currentDay = await DayOperation.findOne({
        where: { date: today, status: "opened" },
        order: [["createdAt", "DESC"]]
      });

      // If no open day exists, get the most recent closed day for today
      if (!currentDay) {
        currentDay = await DayOperation.findOne({
          where: { date: today },
          order: [["createdAt", "DESC"]]
        });
      }
      if (!currentDay) {
        return res.status(200).json({
          currentDay: null,
          message: "No day operation found for today"
        });
      }

      // Get related data from relational tables
      const [openingSnapshots, closingSnapshots, stockVariances, activities, userStats] = await Promise.all([getStockSnapshots(currentDay.id, "opening"), getStockSnapshots(currentDay.id, "closing"), getStockVariances(currentDay.id), getActivityLogs(currentDay.id), getUserStats(currentDay.id)]);

      // For backward compatibility, keep the JSON fields populated
      const dayWithRelations = currentDay.toJSON();

      // If the legacy fields are empty but we have relational data, populate them
      if ((!dayWithRelations.openingStockSnapshot || dayWithRelations.openingStockSnapshot.length === 0) && openingSnapshots.length > 0) {
        dayWithRelations.openingStockSnapshot = openingSnapshots.map(snapshot => ({
          stockEntryId: snapshot.stockEntryId,
          materialId: snapshot.materialId,
          materialName: snapshot.materialName,
          materialCategory: snapshot.materialCategory,
          quantity: snapshot.quantity,
          unit: snapshot.unit,
          costPerUnit: snapshot.costPerUnit,
          snapshotTime: snapshot.snapshotTime
        }));
      }

      if ((!dayWithRelations.closingStockSnapshot || dayWithRelations.closingStockSnapshot.length === 0) && closingSnapshots.length > 0) {
        dayWithRelations.closingStockSnapshot = closingSnapshots.map(snapshot => ({
          stockEntryId: snapshot.stockEntryId,
          materialId: snapshot.materialId,
          materialName: snapshot.materialName,
          materialCategory: snapshot.materialCategory,
          quantity: snapshot.quantity,
          unit: snapshot.unit,
          costPerUnit: snapshot.costPerUnit,
          snapshotTime: snapshot.snapshotTime
        }));
      }

      if ((!dayWithRelations.stockVariances || dayWithRelations.stockVariances.length === 0) && stockVariances.length > 0) {
        dayWithRelations.stockVariances = stockVariances.map(variance => ({
          stockEntryId: variance.stockEntryId,
          materialId: variance.materialId,
          materialName: variance.materialName,
          openingQuantity: variance.openingQuantity,
          closingQuantity: variance.closingQuantity,
          variance: variance.variance,
          unit: variance.unit,
          varianceType: variance.varianceType
        }));
      }

      if ((!dayWithRelations.activityLogs || dayWithRelations.activityLogs.length === 0) && activities.length > 0) {
        dayWithRelations.activityLogs = activities.map(activity => ({
          type: activity.activityType,
          description: activity.description,
          userId: activity.userId,
          userName: activity.userName,
          entityId: activity.entityId,
          entityType: activity.entityType,
          metadata: activity.metadata,
          timestamp: activity.timestamp
        }));
      }

      // Update reportData.userOrderStats if needed
      if (userStats.length > 0) {
        if (!dayWithRelations.reportData) dayWithRelations.reportData = {};
        if (!dayWithRelations.reportData.userOrderStats || dayWithRelations.reportData.userOrderStats.length === 0) {
          dayWithRelations.reportData.userOrderStats = userStats.map(stat => ({
            userId: stat.userId,
            userName: stat.userName,
            openingTime: stat.openingTime ? stat.openingTime.toISOString() : null,
            closingTime: stat.closingTime ? stat.closingTime.toISOString() : null,
            openingCash: stat.openingCash,
            closingCash: stat.closingCash,
            orderCount: stat.orderCount,
            totalAmount: stat.totalAmount,
            cashSales: stat.cashSales,
            cardSales: stat.cardSales,
            notes: stat.notes
          }));
        }
      }

      // If the day is open, calculate real-time stats
      if (currentDay.status === "opened") {
        const realTimeStats = await dayOperationsController.calculateRealTimeDayStats(currentDay);
        const updatedDayData = {
          ...dayWithRelations,
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

      res.status(200).json({ currentDay: dayWithRelations });
    } catch (error) {
      console.error("Error fetching current day operation:", error);
      next(error);
    }
  },

  // Get current day activities
  getCurrentDayActivities: async (req, res, next) => {
    try {
      const today = getTodayDate();
      const currentDay = await DayOperation.findOne({
        where: { date: today, status: "opened" },
        attributes: ["id", "date", "status", "lastActivity"],
        order: [["createdAt", "DESC"]]
      });

      if (!currentDay) {
        return res.status(200).json({
          activities: [],
          message: "No day operation found for today"
        });
      }

      // Get activities from the relational table
      const activityRecords = await DayOperationActivity.findAll({
        where: { dayOperationId: currentDay.id },
        order: [["timestamp", "DESC"]]
      });

      // Format activities for the response
      const activities = activityRecords.map(activity => ({
        type: activity.activityType,
        description: activity.description,
        userId: activity.userId,
        userName: activity.userName,
        entityId: activity.entityId,
        entityType: activity.entityType,
        metadata: activity.metadata,
        timestamp: activity.timestamp
      }));

      // For backward compatibility, also check the legacy field
      const legacyActivities = currentDay.activityLogs || [];

      // Merge both sources if needed
      const allActivities = activities.length > 0 ? activities : legacyActivities;

      res.status(200).json({
        activities: allActivities.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)),
        totalActivities: allActivities.length,
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
    let transaction = null;
    try {
      // Extract request data first, before any database operations
      const { openingCash = 0, openedBy = "System", notes, userId } = req.body;
      console.log("[DayOps][openDay] Incoming payload:", { openingCash, openedBy, notes, userId });

      // Get today's date
      const today = getTodayDate();

      // Start transaction with detailed logging
      console.log("[DayOps][openDay] Starting transaction...");
      try {
        transaction = await sequelize.transaction();
        console.log("[DayOps][openDay] Transaction started successfully", { transactionId: transaction.id });
      } catch (txError) {
        console.error("[DayOps][openDay] Failed to start transaction:", txError);
        return res.status(500).json({ error: "Failed to start database transaction", message: txError.message });
      }

      // Find any existing day operation for today (regardless of status)
      const existingDay = await DayOperation.findOne({
        where: { date: today },
        transaction
      });

      // If there's already a day operation for today, check its status
      if (existingDay) {
        if (existingDay.status === "opened") {
          console.log("[DayOps][openDay] Day already opened, returning existing day:", { id: existingDay.id, status: existingDay.status });
          await transaction.commit();
          return res.status(200).json({
            success: true,
            message: "Day operation already opened",
            dayOperation: existingDay,
            alreadyOpened: true
          });
        } else if (existingDay.status === "closed") {
          console.log("[DayOps][openDay] Day was closed, reopening it:", { id: existingDay.id, status: existingDay.status });
          // Update the existing day to reopen it
          await existingDay.update(
            {
              status: "opened",
              openedAt: new Date(),
              openedBy: openedBy || "System",
              openingCash: parseFloat(openingCash ?? 0),
              expectedCash: parseFloat(openingCash ?? 0),
              notes: notes || existingDay.notes
            },
            { transaction }
          );

          await transaction.commit();
          return res.status(200).json({
            success: true,
            message: "Day operation reopened successfully",
            dayOperation: existingDay,
            reopened: true
          });
        }
      }

      console.log("[DayOps][openDay] existingDay:", existingDay ? { id: existingDay.id, status: existingDay.status } : null);
      const isUserSpecificOperation = userId !== undefined;
      console.log("[DayOps][openDay] isUserSpecificOperation:", isUserSpecificOperation);

      if (isUserSpecificOperation) {
        // Handle user-specific operation
        console.log("[DayOps][openDay] Handling user-specific operation");
        let activeDay = existingDay; // Use existing day if available
        let openingStockSnapshot = []; // Initialize at proper scope level

        // Build opening stock snapshot for new day
        console.log("[DayOps][openDay] Building opening stock snapshot (user-specific path)...");
        let stockSnapshot = [];
        try {
          console.log("[DayOps][openDay] Fetching stock entries with transaction ID:", transaction.id);
          stockSnapshot = await StockEntry.findAll({
            include: [{ model: Material, as: "material", attributes: ["id", "name", "baseUnit", "categoryId"] }],
            transaction
          });
          console.log(`[DayOps][openDay] Successfully fetched ${stockSnapshot.length} stock entries`);
        } catch (stockError) {
          console.error("[DayOps][openDay] Error fetching stock entries:", stockError);
          throw stockError; // Rethrow to trigger transaction rollback
        }

        console.log("[DayOps][openDay] Mapping stock entries to snapshot format...");
        openingStockSnapshot = stockSnapshot.map(entry => ({
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

        // Generate a unique identifier for this day operation
        const now = new Date();
        const uniqueIdentifier = now.getTime().toString();

        // Only create a new day operation if there isn't an existing one
        if (!activeDay) {
          console.log("[DayOps][openDay] Creating new day operation (user path) for", { date: today });
          try {
            // Create the day operation with minimal data - NO JSON fields
            console.log(`[DayOps][openDay] Creating day with ${stockSnapshot.length} stock items`);
            console.log("[DayOps][openDay] Transaction status before create:", {
              id: transaction.id,
              finished: transaction.finished,
              state: transaction.state,
              connection: transaction.connection ? "exists" : "null"
            });

            // Prepare the data object with detailed logging
            const dayOpData = {
              date: today,
              status: "opened",
              openedAt: now,
              openedBy: openedBy || userName || "System",
              openingCash: parseFloat(openingCash ?? 0),
              expectedCash: parseFloat(openingCash ?? 0),
              notes,
              totalSales: 0,
              totalTransactions: 0,
              averageTicket: 0,
              uniqueId: uniqueIdentifier,
              // Set JSON fields to empty arrays/objects instead of null
              openingStockSnapshot: [],
              closingStockSnapshot: [],
              stockVariances: [],
              activityLogs: [],
              reportData: {}
            };

            console.log("[DayOps][openDay] Attempting to create DayOperation with data:", {
              date: dayOpData.date,
              uniqueId: dayOpData.uniqueId,
              jsonFieldSizes: {
                openingStockSnapshot: JSON.stringify(dayOpData.openingStockSnapshot).length,
                closingStockSnapshot: JSON.stringify(dayOpData.closingStockSnapshot).length,
                stockVariances: JSON.stringify(dayOpData.stockVariances).length,
                activityLogs: JSON.stringify(dayOpData.activityLogs).length,
                reportData: JSON.stringify(dayOpData.reportData).length
              }
            });

            try {
              activeDay = await DayOperation.create(dayOpData, { transaction });
              console.log("[DayOps][openDay] DayOperation created successfully:", { id: activeDay.id });
            } catch (createError) {
              console.error("[DayOps][openDay] Error during DayOperation.create():", {
                name: createError.name,
                message: createError.message,
                code: createError.parent?.code,
                sql: createError.sql ? "SQL present" : "No SQL",
                parameters: createError.parameters ? "Parameters present" : "No parameters"
              });
              throw createError;
            }

            // Now create the stock snapshots in the related table
            console.log(`[DayOps][openDay] Creating stock snapshots for day operation ${activeDay.id}`);
            try {
              console.log(`[DayOps][openDay] Calling createStockSnapshots with ${stockSnapshot.length} items and transaction ID: ${transaction.id}`);
              const snapshots = await createStockSnapshots(activeDay.id, stockSnapshot, "opening", now, transaction);
              console.log(`[DayOps][openDay] Successfully created ${snapshots.length} stock snapshots`);
            } catch (snapshotError) {
              console.warn("[DayOps][openDay] Failed to create stock snapshots, but continuing:", {
                message: snapshotError.message,
                code: snapshotError.parent?.code,
                name: snapshotError.name
              });
              // Don't throw the error, continue with the operation
            }
          } catch (createError) {
            // This should not happen since we already checked for existing day operations
            console.error("[DayOps][openDay] Unexpected error during day operation creation:", createError);
            throw createError;
          }

          // Refresh reference with error handling (only if we created a new day)
          if (activeDay) {
            try {
              console.log("[DayOps][openDay] Reloading activeDay with transaction ID:", transaction.id);
              await activeDay.reload({ transaction });
              console.log("[DayOps][openDay] Successfully reloaded activeDay:", { id: activeDay.id });
            } catch (reloadError) {
              console.error("[DayOps][openDay] Error reloading activeDay:", {
                message: reloadError.message,
                code: reloadError.parent?.code,
                name: reloadError.name
              });
              // Continue despite reload error
            }
          }
        } else {
          console.log("[DayOps][openDay] Using existing day operation:", { id: activeDay.id, status: activeDay.status });
        }

        // At this point we have an opened global day; proceed with user stats
        try {
          console.log("[DayOps][openDay][user] Fetching user data with transaction ID:", transaction.id);
          const user = await User.findByPk(userId, { transaction });
          const userName = user ? `${user.firstName} ${user.lastName}`.trim() : `User ${userId}`;
          const now = new Date();

          console.log("[DayOps][openDay][user] Preparing user stats update", { userId, openingCash: parseFloat(openingCash ?? 0) });

          // Create or update user stats in the dedicated table
          let userStats;
          try {
            console.log("[DayOps][openDay][user] Calling getOrCreateUserStats for day:", activeDay.id);
            userStats = await getOrCreateUserStats(activeDay.id, userId, transaction);
            console.log("[DayOps][openDay][user] User stats retrieved/created:", { userStatsId: userStats.id });

            // Update user stats
            console.log("[DayOps][openDay][user] Updating user stats");
            await userStats.update(
              {
                userName,
                openingTime: now,
                openingCash: parseFloat(openingCash ?? 0),
                closingTime: null,
                closingCash: null,
                notes: notes || userStats.notes
              },
              { transaction }
            );
            console.log("[DayOps][openDay][user] User stats updated successfully");
          } catch (statsError) {
            console.warn("[DayOps][openDay][user] Failed to update user stats, but continuing:", {
              message: statsError.message,
              code: statsError.parent?.code,
              name: statsError.name
            });
            // Don't throw the error, continue with the operation
          }

          // For backward compatibility, also update the reportData field
          try {
            const reportData = activeDay.reportData || {};
            const legacyUserStats = reportData.userOrderStats || [];
            const idx = legacyUserStats.findIndex(u => u.userId === userId);

            if (idx >= 0) {
              legacyUserStats[idx] = {
                ...legacyUserStats[idx],
                openingTime: now.toISOString(),
                openingCash: parseFloat(openingCash ?? 0),
                closingTime: null,
                closingCash: null,
                notes: notes || legacyUserStats[idx].notes
              };
            } else {
              legacyUserStats.push({
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

            console.log("[DayOps][openDay][user] Updating day reportData.userOrderStats (len):", legacyUserStats.length);
            await activeDay.update({ reportData: { ...(activeDay.reportData || {}), userOrderStats: legacyUserStats } }, { transaction });
          } catch (reportError) {
            console.warn("[DayOps][openDay][user] Failed to update reportData, but continuing:", reportError.message);
            // Don't throw the error, continue with the operation
          }

          // Create an activity log for the user opening
          try {
            await createActivityLog(activeDay.id, "user_shift_opened", `User shift opened by ${userName}`, userId, userName, { openingCash: parseFloat(openingCash ?? 0) }, transaction);
          } catch (activityError) {
            console.warn("[DayOps][openDay][user] Failed to create activity log, but continuing:", activityError.message);
            // Don't throw the error, continue with the operation
          }

          // Reload and commit with error handling
          try {
            await activeDay.reload({ transaction });
            await transaction.commit();
            console.log("[DayOps][openDay][user] Transaction committed successfully");
          } catch (commitError) {
            console.error("[DayOps][openDay][user] Error during commit:", commitError);
            // Try to rollback if commit fails
            if (transaction && !transaction.finished) {
              try {
                await transaction.rollback();
                console.log("[DayOps][openDay][user] Transaction rolled back after commit failure");
              } catch (rollbackError) {
                console.error("[DayOps][openDay][user] Error during rollback after commit failure:", rollbackError);
              }
            }
            throw commitError;
          }

          // Get the stock snapshots count for response
          let stockSnapshots = [];
          try {
            stockSnapshots = await getStockSnapshots(activeDay.id, "opening");
            console.log("[DayOps][openDay][user] Commit successful for user-specific open", { dayId: activeDay.id, userId, stockItemsCaptured: stockSnapshots.length });
          } catch (snapshotError) {
            console.warn("[DayOps][openDay][user] Failed to get stock snapshots, continuing:", snapshotError.message);
          }

          return res.status(existingDay ? 200 : 201).json({
            message: "User day opened",
            dayOperation: activeDay,
            stockItemsCaptured: stockSnapshots.length || 0
          });
        } catch (e) {
          // Attempt to rollback the transaction
          if (transaction && !transaction.finished) {
            try {
              await transaction.rollback();
              console.log("[DayOps][openDay][user] Transaction rolled back successfully");
            } catch (rollbackError) {
              console.error("[DayOps][openDay][user] Error during transaction rollback:", rollbackError);
            }
          }
          console.error("Error updating user-specific open:", e);

          // Return a more specific error message for transaction aborted errors
          if (e.parent && e.parent.code === "25P02") {
            return res.status(500).json({
              error: "Database transaction error",
              message: "The operation could not be completed due to a database transaction error. Please try again."
            });
          }

          return res.status(500).json({
            error: "Failed to open user shift",
            message: e.message || "An error occurred while opening the user shift"
          });
        }
      }

      // This code should not be reached since we handle existing day operations at the beginning
      // But keeping it as a safety net
      console.error("[DayOps][openDay] Unexpected code path reached - this should not happen");

      // Always attempt to rollback the transaction if it exists
      if (transaction && !transaction.finished) {
        try {
          await transaction.rollback();
          console.log("[DayOps][openDay] Transaction rolled back successfully");
        } catch (rollbackError) {
          console.error("[DayOps][openDay] Error during transaction rollback:", rollbackError);
        }
      }

      return res.status(500).json({
        error: "Internal error",
        message: "Unexpected code path in day operations"
      });
    } catch (error) {
      // Always attempt to rollback the transaction if it exists
      if (transaction && !transaction.finished) {
        try {
          await transaction.rollback();
          console.log("[DayOps][openDay] Transaction rolled back successfully");
        } catch (rollbackError) {
          console.error("[DayOps][openDay] Error during transaction rollback:", rollbackError);
        }
      }

      console.error("Error opening day:", error);
      if (error.name === "SequelizeUniqueConstraintError") {
        return res.status(400).json({ error: "A day operation already exists for this date" });
      }

      // Return a more specific error message for transaction aborted errors
      if (error.parent && error.parent.code === "25P02") {
        return res.status(500).json({
          error: "Database transaction error",
          message: "The operation could not be completed due to a database transaction error. Please try again."
        });
      }

      return res.status(500).json({
        error: "Failed to open day",
        message: error.message || "An unexpected error occurred while opening the day"
      });
    }
  },

  closeDay: async (req, res, next) => {
    const transaction = await sequelize.transaction();
    try {
      const { closingCash, closedBy = "System", notes, userId, finalizeDay, closeDay, onlyUser } = req.body;
      const shouldFinalize = Boolean(closeDay) || Boolean(finalizeDay) || (userId !== undefined && onlyUser !== true);
      const today = getTodayDate();

      // Find the currently open day operation
      const dayOperation = await DayOperation.findOne({
        where: { date: today, status: "opened" },
        transaction
      });
      if (!dayOperation) {
        await transaction.rollback();
        return res.status(404).json({ error: "No day operation found for today" });
      }
      const isUserSpecificOperation = userId !== undefined;
      if (isUserSpecificOperation) {
        try {
          const dayStart = new Date(dayOperation.openedAt);
          const dayEnd = new Date();
          const salesData = await Sale.findAll({
            where: { saleDate: { [Op.between]: [dayStart, dayEnd] }, isActive: true, userId },
            include: [{ model: Section, as: "section", attributes: ["id", "name"] }],
            transaction
          });
          const userTotalSales = salesData.reduce((sum, sale) => sum + parseFloat(sale.totalAmount), 0);
          const userCashSales = salesData.filter(s => s.paymentMethod === "cash").reduce((sum, s) => sum + parseFloat(s.totalAmount), 0);
          const userCardSales = salesData.filter(s => s.paymentMethod === "card").reduce((sum, s) => sum + parseFloat(s.totalAmount), 0);
          const baseReportData = JSON.parse(JSON.stringify(dayOperation.reportData || {}));
          const userOrderStats = Array.isArray(baseReportData.userOrderStats) ? [...baseReportData.userOrderStats] : [];
          const idx = userOrderStats.findIndex(u => u.userId === userId);
          const now = new Date();
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
          const updatedReportData = {
            ...baseReportData,
            userOrderStats: [...userOrderStats]
          };
          await DayOperation.update({ reportData: updatedReportData, lastActivity: now.toISOString() }, { where: { id: dayOperation.id }, transaction });
          await dayOperation.reload({ transaction });

          if (!shouldFinalize) {
            await transaction.commit();
            const freshDayOperation = await DayOperation.findByPk(dayOperation.id);
            return res.status(200).json({
              message: "User shift closed successfully",
              dayOperation: freshDayOperation,
              dailyReport: updatedReportData,
              summary: {
                userId,
                userName,
                orderCount: salesData.length,
                totalAmount: userTotalSales,
                cashSales: userCashSales,
                cardSales: userCardSales,
                closingCash: parseFloat(closingCash ?? 0)
              }
            });
          }
        } catch (e) {
          await transaction.rollback();
          console.error("Error updating user-specific close:", e);
          return next(e);
        }
      }
      if (dayOperation.status === "closed") {
        await transaction.rollback();
        return res.status(400).json({ error: "Day is already closed" });
      }
      const dayStart = new Date(dayOperation.openedAt);
      const dayEnd = new Date();
      console.log(`[DayOps][closeDay] Fetching sales data from ${dayStart.toISOString()} to ${dayEnd.toISOString()}`);

      // Get all sales with payment method information
      const salesData = await Sale.findAll({
        where: {
          saleDate: { [Op.between]: [dayStart, dayEnd] },
          isActive: true
        },
        include: [
          { model: Section, as: "section", attributes: ["id", "name"] },
          { model: User, as: "creator", attributes: ["id", "firstName", "lastName"] },
          {
            model: Order,
            as: "order",
            attributes: ["id", "orderNumber", "orderType", "status", "paymentAmount"],
            required: false
          }
        ],
        transaction
      });

      console.log(`[DayOps][closeDay] Found ${salesData.length} sales records`);

      // If no sales found but day has been open for a while, try a fallback approach
      if (salesData.length === 0) {
        const hoursSinceOpening = (dayEnd - dayStart) / (1000 * 60 * 60);
        if (hoursSinceOpening > 1) {
          // If day has been open for more than 1 hour
          console.log(`[DayOps][closeDay] No sales found with primary method after ${hoursSinceOpening.toFixed(2)} hours, checking for orphaned orders`);

          // Look for paid orders that might not be linked to sales
          const orphanedOrders = await Order.findAll({
            where: {
              status: { [Op.in]: ["paid", "served"] },
              saleId: null, // Orders not linked to sales
              [Op.or]: [{ completedAt: { [Op.between]: [dayStart, dayEnd] } }, { createdAt: { [Op.between]: [dayStart, dayEnd] } }]
            },
            transaction
          });

          if (orphanedOrders.length > 0) {
            console.log(`[DayOps][closeDay] Found ${orphanedOrders.length} orphaned paid orders, creating synthetic sales data`);

            // Create synthetic sales data from orphaned orders
            for (const order of orphanedOrders) {
              salesData.push({
                id: null, // No actual sale ID
                saleDate: order.completedAt || order.createdAt,
                totalAmount: order.total,
                section: { id: null, name: "Unknown" },
                isActive: true,
                isSynthetic: true, // Mark as synthetic for reporting
                order: order
              });
            }
          }
        }
      }
      const totalSales = salesData.reduce((sum, sale) => sum + parseFloat(sale.totalAmount), 0);
      const totalTransactions = salesData.length;
      const averageTicket = totalTransactions > 0 ? totalSales / totalTransactions : 0;
      const expectedCash = parseFloat(dayOperation.openingCash) + totalSales;
      const actualClosingCash = parseFloat(closingCash || 0);
      const cashVariance = actualClosingCash - expectedCash;
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
      // Aggregate item-level sales for the closed day window
      console.log(`[DayOps][closeDay] Aggregating item-level sales from ${dayStart.toISOString()} to ${dayEnd.toISOString()}`);

      // First get all sales for this day period
      const daySales = await Sale.findAll({
        attributes: ["id"],
        where: {
          saleDate: { [Op.between]: [dayStart, dayEnd] },
          isActive: true
        },
        transaction
      });

      const saleIds = daySales.map(sale => sale.id);
      console.log(`[DayOps][closeDay] Found ${saleIds.length} sales for aggregation`);

      // Then get all orders associated with these sales
      const dayOrders = await Order.findAll({
        attributes: ["id"],
        where: {
          saleId: { [Op.in]: saleIds },
          status: { [Op.in]: ["paid", "served"] }
        },
        transaction
      });

      const orderIds = dayOrders.map(order => order.id);
      console.log(`[DayOps][closeDay] Found ${orderIds.length} orders for aggregation`);

      // Now aggregate the order items
      const itemAggregates = await OrderItem.findAll({
        attributes: ["menuItemId", [sequelize.fn("COALESCE", sequelize.col("menuItem.name"), sequelize.col("OrderItem.name")), "name"], [sequelize.fn("SUM", sequelize.col("OrderItem.quantity")), "quantity"], [sequelize.fn("SUM", sequelize.col("OrderItem.totalPrice")), "revenue"]],
        where: {
          orderId: { [Op.in]: orderIds },
          type: "menu_item",
          status: { [Op.ne]: "cancelled" }
        },
        include: [
          {
            model: MenuItem,
            as: "menuItem",
            attributes: []
          }
        ],
        group: ["OrderItem.menuItemId", "menuItem.name", "OrderItem.name"],
        raw: true,
        transaction
      });

      console.log(`[DayOps][closeDay] Aggregated ${itemAggregates.length} menu items for reporting`);

      // If no items found, try a fallback approach
      if (itemAggregates.length === 0 && saleIds.length > 0) {
        console.log(`[DayOps][closeDay] No items found with primary method, trying fallback with direct order dates`);

        // Fallback to direct order dates if no items found but sales exist
        const fallbackItemAggregates = await OrderItem.findAll({
          attributes: ["menuItemId", [sequelize.fn("COALESCE", sequelize.col("menuItem.name"), sequelize.col("OrderItem.name")), "name"], [sequelize.fn("SUM", sequelize.col("OrderItem.quantity")), "quantity"], [sequelize.fn("SUM", sequelize.col("OrderItem.totalPrice")), "revenue"]],
          where: {
            type: "menu_item",
            status: { [Op.ne]: "cancelled" }
          },
          include: [
            {
              model: Order,
              as: "order",
              attributes: [],
              where: {
                status: { [Op.in]: ["paid", "served"] },
                [Op.or]: [{ completedAt: { [Op.between]: [dayStart, dayEnd] } }, { createdAt: { [Op.between]: [dayStart, dayEnd] } }]
              }
            },
            {
              model: MenuItem,
              as: "menuItem",
              attributes: []
            }
          ],
          group: ["OrderItem.menuItemId", "menuItem.name", "OrderItem.name"],
          raw: true,
          transaction
        });

        if (fallbackItemAggregates.length > 0) {
          console.log(`[DayOps][closeDay] Fallback found ${fallbackItemAggregates.length} items`);
          itemAggregates.push(...fallbackItemAggregates);
        }
      }

      const itemSales = itemAggregates
        .map(r => ({
          name: r.name,
          quantity: Number(r.quantity) || 0,
          revenue: Number(r.revenue) || 0
        }))
        .sort((a, b) => b.revenue - a.revenue);

      const existingReportData = dayOperation.reportData || {};

      // Calculate payment method breakdown
      const paymentMethodBreakdown = salesData.reduce((acc, sale) => {
        // Try to get payment method from order if available
        const paymentMethod = sale.order?.paymentMethod || "unknown";
        if (!acc[paymentMethod]) {
          acc[paymentMethod] = { count: 0, total: 0 };
        }
        acc[paymentMethod].count++;
        acc[paymentMethod].total += parseFloat(sale.totalAmount);
        return acc;
      }, {});

      // Calculate sales by hour
      const salesByHour = {};
      salesData.forEach(sale => {
        const saleHour = new Date(sale.saleDate).getHours();
        const hourKey = saleHour.toString().padStart(2, "0") + ":00";
        if (!salesByHour[hourKey]) {
          salesByHour[hourKey] = { count: 0, total: 0 };
        }
        salesByHour[hourKey].count++;
        salesByHour[hourKey].total += parseFloat(sale.totalAmount);
      });

      // Calculate sales by category using the itemSales data
      const salesByCategory = itemSales.reduce((acc, item) => {
        // Try to find the menu item to get its category
        const menuItem = itemAggregates.find(i => i.name === item.name);
        const categoryName = menuItem?.category?.name || "Uncategorized";

        if (!acc[categoryName]) {
          acc[categoryName] = { count: 0, total: 0, items: [] };
        }
        acc[categoryName].count += item.quantity;
        acc[categoryName].total += item.revenue;
        acc[categoryName].items.push(item);
        return acc;
      }, {});

      // Create comprehensive report data
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
          }, {}),
          salesByHour,
          salesByCategory,
          paymentMethodBreakdown,
          topItems: itemSales.slice(0, 20),
          itemCount: itemSales.length,
          totalItemsSold: itemSales.reduce((sum, item) => sum + item.quantity, 0)
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

      console.log(`[DayOps][closeDay] Generated report with ${itemSales.length} unique items and ${reportData.sales.totalItemsSold} total items sold`);
      // Create a copy of the day operation with closed status instead of updating the existing one
      // This ensures we keep all day operations history
      const now = new Date();
      const uniqueIdentifier = now.getTime().toString();
      let closedDayOperation;

      try {
        closedDayOperation = await DayOperation.create(
          {
            date: today,
            status: "closed",
            openedAt: dayOperation.openedAt,
            closedAt: dayEnd,
            openedBy: dayOperation.openedBy,
            closedBy,
            openingCash: dayOperation.openingCash,
            closingCash: actualClosingCash,
            expectedCash,
            cashVariance,
            totalSales,
            totalTransactions,
            averageTicket,
            openingStockSnapshot: dayOperation.openingStockSnapshot,
            closingStockSnapshot: closingSnapshot,
            stockVariances,
            autoReportGenerated: true,
            reportData,
            notes: notes ? (dayOperation.notes ? `${dayOperation.notes}\n[CLOSED] ${notes}` : notes) : dayOperation.notes,
            uniqueId: uniqueIdentifier
          },
          { transaction, logging: console.log }
        );
      } catch (createError) {
        // If there's a unique constraint error, try again with a different approach
        if (createError.name === "SequelizeUniqueConstraintError") {
          console.log("[DayOps][closeDay] Unique constraint error, trying with timestamp in notes", { date: today });

          // Add timestamp to notes to make it unique
          const baseNotes = dayOperation.notes || "";
          const closeNotes = notes || "";
          const uniqueNotes = `${baseNotes}\n[CLOSED ${uniqueIdentifier}] ${closeNotes}`;

          closedDayOperation = await DayOperation.create(
            {
              date: today,
              status: "closed",
              openedAt: dayOperation.openedAt,
              closedAt: dayEnd,
              openedBy: dayOperation.openedBy,
              closedBy,
              openingCash: dayOperation.openingCash,
              closingCash: actualClosingCash,
              expectedCash,
              cashVariance,
              totalSales,
              totalTransactions,
              averageTicket,
              openingStockSnapshot: dayOperation.openingStockSnapshot,
              closingStockSnapshot: closingSnapshot,
              stockVariances,
              autoReportGenerated: true,
              reportData,
              notes: uniqueNotes,
              uniqueId: uniqueIdentifier
            },
            { transaction, logging: console.log }
          );
        } else {
          // If it's a different error, rethrow it
          throw createError;
        }
      }
      const report = await DayOperationReport.create(
        {
          dayOperationId: closedDayOperation.id,
          reportDate: today,
          reportType: "daily",
          salesSummary: reportData.sales || {},
          cashSummary: reportData.cash || {},
          inventorySummary: reportData.inventory || {},
          topSellingItems: itemSales,
          salesByCategory: reportData.sales?.salesByCategory || {},
          salesBySection: reportData.sales?.salesBySection || {},
          salesByHour: reportData.sales?.salesByHour || {},
          paymentMethodBreakdown: reportData.sales?.paymentMethodBreakdown || {},
          stockMovements: stockVariances.map(v => ({
            materialName: v.materialName,
            opening: v.openingQuantity,
            closing: v.closingQuantity,
            change: v.variance,
            unit: v.unit
          })),
          significantVariances: stockVariances.filter(v => Math.abs(v.variance) > 10) || [],
          notes: notes ? `Auto-generated during day closing. ${notes}` : "Auto-generated during day closing.",
          generatedBy: closedBy || "System",
          reportStatus: "final",
          generatedAt: new Date(),
          enhancedData: {
            salesByHour: reportData.sales?.salesByHour || {},
            salesByCategory: reportData.sales?.salesByCategory || {},
            salesBySection: reportData.sales?.salesBySection || {},
            paymentMethodBreakdown: reportData.sales?.paymentMethodBreakdown || {},
            stockMovements: stockVariances.map(v => ({
              materialName: v.materialName,
              opening: v.openingQuantity,
              closing: v.closingQuantity,
              change: v.variance,
              unit: v.unit
            })),
            significantVariances: stockVariances.filter(v => Math.abs(v.variance) > 10) || []
          }
        },
        { transaction }
      );

      console.log(`[DayOps][closeDay] Created day operation report ID: ${report.id}`);
      await transaction.commit();
      res.status(200).json({
        message: "Day closed successfully",
        dayOperation: closedDayOperation,
        dailyReport: reportData,
        totalSales,
        totalTransactions,
        averageTicket,
        cashVariance,
        stockVariances: stockVariances.length
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
        where: { date },
        order: [["createdAt", "DESC"]]
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
      const today = getTodayDate();
      const currentDay = await DayOperation.findOne({
        where: { date: today, status: "opened" },
        order: [["createdAt", "DESC"]]
      });

      if (!currentDay) {
        return res.status(200).json({
          userOrderStats: [],
          message: "No day operation found for today"
        });
      }

      // Get user stats from the relational table
      const userStatsRecords = await DayOperationUserStats.findAll({
        where: { dayOperationId: currentDay.id },
        include: [{ model: User, as: "user", attributes: ["id", "firstName", "lastName"] }]
      });

      // Calculate real-time sales data
      const dayStart = new Date(currentDay.openedAt);
      const dayEnd = currentDay.status === "closed" ? new Date(currentDay.closedAt) : new Date();
      const saleAttributes = Object.keys(Sale.rawAttributes);
      const paymentMethodExists = saleAttributes.includes("paymentMethod");
      const aggregateAttributes = [
        "userId",
        [sequelize.fn("COUNT", sequelize.col("Sale.id")), "orderCount"],
        [sequelize.fn("SUM", sequelize.col("Sale.totalAmount")), "totalAmount"],
        paymentMethodExists ? [sequelize.fn("SUM", sequelize.literal('CASE WHEN "Sale"."paymentMethod" = \'cash\' THEN "Sale"."totalAmount" ELSE 0 END')), "cashSales"] : [sequelize.literal("0"), "cashSales"],
        paymentMethodExists ? [sequelize.fn("SUM", sequelize.literal('CASE WHEN "Sale"."paymentMethod" = \'card\' THEN "Sale"."totalAmount" ELSE 0 END')), "cardSales"] : [sequelize.literal("0"), "cardSales"]
      ];

      const salesByUser = await Sale.findAll({
        where: { saleDate: { [Op.between]: [dayStart, dayEnd] }, isActive: true, userId: { [Op.not]: null } },
        attributes: aggregateAttributes,
        include: [{ model: User, as: "creator", attributes: ["id", "firstName", "lastName"] }],
        group: ["Sale.userId", "creator.id"],
        raw: false
      });

      // For backward compatibility, check legacy data
      let legacyUserStats = [];
      if (currentDay.reportData && currentDay.reportData.userOrderStats) {
        legacyUserStats = currentDay.reportData.userOrderStats;
      }

      // Merge data from both sources
      const userMap = new Map();

      // First, add data from relational tables
      userStatsRecords.forEach(stat => {
        userMap.set(stat.userId, {
          userId: stat.userId,
          userName: stat.userName || (stat.user ? `${stat.user.firstName} ${stat.user.lastName}`.trim() : `User ${stat.userId}`),
          orderCount: stat.orderCount || 0,
          totalAmount: stat.totalAmount || 0,
          cashSales: stat.cashSales || 0,
          cardSales: stat.cardSales || 0,
          openingTime: stat.openingTime,
          closingTime: stat.closingTime,
          openingCash: stat.openingCash || 0,
          closingCash: stat.closingCash || null,
          notes: stat.notes || ""
        });
      });

      // Then, add data from legacy JSON if not already present
      legacyUserStats.forEach(userData => {
        if (!userMap.has(userData.userId)) {
          userMap.set(userData.userId, {
            userId: userData.userId,
            userName: userData.userName || `User ${userData.userId}`,
            orderCount: userData.orderCount || 0,
            totalAmount: userData.totalAmount || 0,
            cashSales: userData.cashSales || 0,
            cardSales: userData.cardSales || 0,
            openingTime: userData.openingTime ? new Date(userData.openingTime) : null,
            closingTime: userData.closingTime ? new Date(userData.closingTime) : null,
            openingCash: userData.openingCash || 0,
            closingCash: userData.closingCash || null,
            notes: userData.notes || ""
          });
        }
      });

      // Finally, update with real-time sales data
      salesByUser.forEach(salesData => {
        const userId = salesData.userId;
        const userData = userMap.get(userId) || {
          userId,
          userName: salesData.creator ? `${salesData.creator.firstName} ${salesData.creator.lastName}`.trim() : `User ${userId}`,
          orderCount: 0,
          totalAmount: 0,
          cashSales: 0,
          cardSales: 0,
          openingTime: null,
          closingTime: null,
          openingCash: 0,
          closingCash: null,
          notes: ""
        };

        // Update with real-time sales data
        userData.orderCount = parseInt(salesData.dataValues.orderCount, 10);
        userData.totalAmount = parseFloat(salesData.dataValues.totalAmount);
        userData.cashSales = parseFloat(salesData.dataValues.cashSales || 0);
        userData.cardSales = parseFloat(salesData.dataValues.cardSales || 0);

        userMap.set(userId, userData);
      });

      // Convert map to array
      const formattedStats = Array.from(userMap.values());

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

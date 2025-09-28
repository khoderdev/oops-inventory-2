import { Op } from "sequelize";
import { DayOperation, DayOperationStockSnapshot, DayOperationStockVariance, DayOperationActivity, DayOperationUserStats, Material, StockEntry, User } from "../models/index.js";

export const createStockSnapshots = async (dayOperationId, stockEntries, type, snapshotTime, transaction) => {
  console.log(`[DayOpsHelper] Creating ${type} stock snapshots for day operation ${dayOperationId}`);
  console.log(`[DayOpsHelper] Transaction ID: ${transaction?.id}, Stock entries count: ${stockEntries?.length || 0}`);

  // Validate inputs
  if (!dayOperationId) {
    console.error('[DayOpsHelper] Missing dayOperationId in createStockSnapshots');
    throw new Error('Missing dayOperationId in createStockSnapshots');
  }

  if (!stockEntries || !Array.isArray(stockEntries)) {
    console.warn('[DayOpsHelper] Invalid stockEntries (empty or not an array), returning empty array');
    return [];
  }

  if (!transaction) {
    console.warn('[DayOpsHelper] No transaction provided to createStockSnapshots, continuing without transaction');
  }

  const snapshots = [];
  const batchSize = 20; // Smaller batch size to reduce transaction load

  try {
    // Prepare the data for bulk creation with validation
    console.log(`[DayOpsHelper] Preparing snapshot data for ${stockEntries.length} entries`);
    const snapshotData = stockEntries
      .filter(entry => entry && entry.id) // Filter out any null/undefined entries
      .map(entry => ({
        dayOperationId,
        type,
        stockEntryId: entry.id,
        materialId: entry.materialId,
        materialName: entry.material?.name || "Unknown",
        materialCategory: entry.material?.categoryId || null,
        quantity: entry.purchasedIndividualQuantity || 0,
        unit: entry.material?.baseUnit || "unit",
        costPerUnit: entry.costPerPurchasedUnit || 0,
        snapshotTime
      }));

    console.log(`[DayOpsHelper] Prepared ${snapshotData.length} valid snapshot records`);

    // Process in batches
    const totalBatches = Math.ceil(snapshotData.length / batchSize);
    console.log(`[DayOpsHelper] Processing in ${totalBatches} batches of ${batchSize} items each`);

    for (let i = 0; i < snapshotData.length; i += batchSize) {
      const batch = snapshotData.slice(i, i + batchSize);
      const batchNumber = Math.floor(i / batchSize) + 1;
      console.log(`[DayOpsHelper] Processing batch ${batchNumber}/${totalBatches} (${batch.length} items)`);

      try {
        // Check transaction status before each batch
        if (transaction && transaction.finished) {
          console.error(`[DayOpsHelper] Transaction is already finished, cannot process batch ${batchNumber}`);
          break;
        }

        const batchSnapshots = await DayOperationStockSnapshot.bulkCreate(batch, { transaction });
        console.log(`[DayOpsHelper] Batch ${batchNumber} created ${batchSnapshots.length} snapshots successfully`);
        snapshots.push(...batchSnapshots);
      } catch (batchError) {
        console.error(`[DayOpsHelper] Error processing batch ${batchNumber}:`, {
          message: batchError.message,
          code: batchError.parent?.code,
          name: batchError.name,
          sql: batchError.sql ? "SQL present" : "No SQL"
        });
        
        // If transaction is aborted, break the loop
        if (batchError.parent?.code === '25P02') {
          console.error(`[DayOpsHelper] Transaction aborted, stopping batch processing`);
          break;
        }
        // Continue with the next batch instead of failing the entire operation
      }
    }

    console.log(`[DayOpsHelper] Successfully created ${snapshots.length} of ${stockEntries.length} stock snapshots`);
    return snapshots;
  } catch (error) {
    console.error(`[DayOpsHelper] Error creating stock snapshots:`, {
      message: error.message,
      code: error.parent?.code,
      name: error.name
    });
    throw error;
  }
};

export const createStockVariances = async (dayOperationId, openingSnapshots, closingSnapshots, transaction) => {
  console.log(`[DayOpsHelper] Creating stock variances for day operation ${dayOperationId}`);

  const variances = [];

  // Convert snapshots to maps for easier lookup
  const openingMap = new Map();
  const closingMap = new Map();

  openingSnapshots.forEach(snapshot => {
    openingMap.set(snapshot.stockEntryId, snapshot);
  });

  closingSnapshots.forEach(snapshot => {
    closingMap.set(snapshot.stockEntryId, snapshot);
  });

  // Create variances for all stock entries in either opening or closing snapshots
  const allStockEntryIds = new Set([...openingMap.keys(), ...closingMap.keys()]);

  for (const stockEntryId of allStockEntryIds) {
    const openingSnapshot = openingMap.get(stockEntryId);
    const closingSnapshot = closingMap.get(stockEntryId);

    if (openingSnapshot && closingSnapshot) {
      const variance = closingSnapshot.quantity - openingSnapshot.quantity;

      if (variance !== 0) {
        const varianceRecord = await DayOperationStockVariance.create(
          {
            dayOperationId,
            stockEntryId,
            materialId: openingSnapshot.materialId,
            materialName: openingSnapshot.materialName,
            openingQuantity: openingSnapshot.quantity,
            closingQuantity: closingSnapshot.quantity,
            variance,
            unit: openingSnapshot.unit,
            varianceType: variance > 0 ? "gain" : "loss"
          },
          { transaction }
        );

        variances.push(varianceRecord);
      }
    }
  }

  return variances;
};

export const createActivityLog = async (dayOperationId, activityType, description, userId, userName, metadata = {}, transaction) => {
  try {
    console.log(`[DayOpsHelper] Creating activity log for day operation ${dayOperationId}: ${activityType}`);

    // Ensure metadata is a plain object to avoid serialization issues
    const safeMetadata = typeof metadata === "object" && metadata !== null ? JSON.parse(JSON.stringify(metadata)) : {};

    return await DayOperationActivity.create(
      {
        dayOperationId,
        activityType,
        description: description || `${activityType} activity`,
        userId,
        userName: userName || (userId ? `User ${userId}` : "System"),
        entityId: null,
        entityType: null,
        metadata: safeMetadata,
        timestamp: new Date()
      },
      { transaction }
    );
  } catch (error) {
    console.warn(`[DayOpsHelper] Failed to create activity log: ${error.message}`);
    // Don't throw the error, as activity logs are not critical
    return null;
  }
};

export const getStockSnapshots = async (dayOperationId, type = null, transaction = null) => {
  const where = { dayOperationId };

  if (type) {
    where.type = type;
  }

  return await DayOperationStockSnapshot.findAll({
    where,
    order: [["materialName", "ASC"]],
    transaction
  });
};

export const getStockVariances = async (dayOperationId, transaction = null) => {
  return await DayOperationStockVariance.findAll({
    where: { dayOperationId },
    order: [["materialName", "ASC"]],
    transaction
  });
};

export const getActivityLogs = async (dayOperationId, transaction = null) => {
  return await DayOperationActivity.findAll({
    where: { dayOperationId },
    order: [["timestamp", "DESC"]],
    transaction
  });
};

export const getUserStats = async (dayOperationId, transaction = null) => {
  return await DayOperationUserStats.findAll({
    where: { dayOperationId },
    include: [
      {
        model: User,
        as: "user",
        attributes: ["id", "firstName", "lastName"]
      }
    ],
    transaction
  });
};

export const getOrCreateUserStats = async (dayOperationId, userId, transaction = null) => {
  try {
    console.log(`[DayOpsHelper] Getting or creating user stats for day operation ${dayOperationId}, user ${userId}`);

    // Validate inputs
    if (!dayOperationId || !userId) {
      console.warn(`[DayOpsHelper] Invalid parameters: dayOperationId=${dayOperationId}, userId=${userId}`);
      throw new Error("Invalid parameters for getOrCreateUserStats");
    }

    // First try to find existing stats
    let userStats;

    try {
      userStats = await DayOperationUserStats.findOne({
        where: { dayOperationId, userId },
        transaction
      });
    } catch (findError) {
      console.warn(`[DayOpsHelper] Error finding user stats: ${findError.message}`);
    }

    // If found, return it
    if (userStats) {
      return userStats;
    }

    // If not found, create new stats
    try {
      // Try to get the user's name first
      let userName = `User ${userId}`;
      try {
        const user = await User.findByPk(userId, { transaction });
        if (user) {
          userName = `${user.firstName} ${user.lastName}`.trim();
        }
      } catch (userError) {
        console.warn(`[DayOpsHelper] Error getting user name: ${userError.message}`);
      }

      // Create the user stats
      userStats = await DayOperationUserStats.create(
        {
          dayOperationId,
          userId,
          userName,
          openingCash: 0,
          orderCount: 0,
          totalAmount: 0,
          cashSales: 0,
          cardSales: 0
        },
        { transaction }
      );

      console.log(`[DayOpsHelper] Created new user stats for user ${userName}`);
      return userStats;
    } catch (createError) {
      console.error(`[DayOpsHelper] Error creating user stats: ${createError.message}`);
      throw createError;
    }
  } catch (error) {
    console.error(`[DayOpsHelper] Error in getOrCreateUserStats: ${error.message}`);
    throw error;
  }
};

export const convertLegacyToRelational = async (dayOperation, transaction) => {
  console.log(`[DayOpsHelper] Converting legacy JSON data to relational format for day operation ${dayOperation.id}`);

  // Convert opening stock snapshot
  if (dayOperation.openingStockSnapshot && Array.isArray(dayOperation.openingStockSnapshot)) {
    for (const item of dayOperation.openingStockSnapshot) {
      await DayOperationStockSnapshot.create(
        {
          dayOperationId: dayOperation.id,
          type: "opening",
          stockEntryId: item.stockEntryId,
          materialId: item.materialId,
          materialName: item.materialName || "Unknown",
          materialCategory: item.materialCategory,
          quantity: item.quantity || 0,
          unit: item.unit || "unit",
          costPerUnit: item.costPerUnit || 0,
          snapshotTime: item.snapshotTime || dayOperation.openedAt
        },
        { transaction }
      );
    }
  }

  // Convert closing stock snapshot
  if (dayOperation.closingStockSnapshot && Array.isArray(dayOperation.closingStockSnapshot)) {
    for (const item of dayOperation.closingStockSnapshot) {
      await DayOperationStockSnapshot.create(
        {
          dayOperationId: dayOperation.id,
          type: "closing",
          stockEntryId: item.stockEntryId,
          materialId: item.materialId,
          materialName: item.materialName || "Unknown",
          materialCategory: item.materialCategory,
          quantity: item.quantity || 0,
          unit: item.unit || "unit",
          costPerUnit: item.costPerUnit || 0,
          snapshotTime: item.snapshotTime || dayOperation.closedAt || dayOperation.openedAt
        },
        { transaction }
      );
    }
  }

  // Convert stock variances
  if (dayOperation.stockVariances && Array.isArray(dayOperation.stockVariances)) {
    for (const variance of dayOperation.stockVariances) {
      await DayOperationStockVariance.create(
        {
          dayOperationId: dayOperation.id,
          stockEntryId: variance.stockEntryId,
          materialId: variance.materialId,
          materialName: variance.materialName || "Unknown",
          openingQuantity: variance.openingQuantity || 0,
          closingQuantity: variance.closingQuantity || 0,
          variance: variance.variance || 0,
          unit: variance.unit || "unit",
          varianceType: variance.varianceType || (variance.variance > 0 ? "gain" : variance.variance < 0 ? "loss" : "none")
        },
        { transaction }
      );
    }
  }

  // Convert activity logs
  if (dayOperation.activityLogs && Array.isArray(dayOperation.activityLogs)) {
    for (const activity of dayOperation.activityLogs) {
      await DayOperationActivity.create(
        {
          dayOperationId: dayOperation.id,
          activityType: activity.type || "unknown",
          description: activity.description || "",
          userId: activity.userId,
          userName: activity.userName || "",
          entityId: activity.entityId,
          entityType: activity.entityType || "",
          metadata: activity.metadata || {},
          timestamp: activity.timestamp || dayOperation.openedAt
        },
        { transaction }
      );
    }
  }

  // Convert user order stats
  if (dayOperation.reportData && dayOperation.reportData.userOrderStats && Array.isArray(dayOperation.reportData.userOrderStats)) {
    for (const userStat of dayOperation.reportData.userOrderStats) {
      await DayOperationUserStats.create(
        {
          dayOperationId: dayOperation.id,
          userId: userStat.userId,
          userName: userStat.userName || `User ${userStat.userId}`,
          openingTime: userStat.openingTime ? new Date(userStat.openingTime) : null,
          closingTime: userStat.closingTime ? new Date(userStat.closingTime) : null,
          openingCash: userStat.openingCash || 0,
          closingCash: userStat.closingCash || null,
          orderCount: userStat.orderCount || 0,
          totalAmount: userStat.totalAmount || 0,
          cashSales: userStat.cashSales || 0,
          cardSales: userStat.cardSales || 0,
          notes: userStat.notes || ""
        },
        { transaction }
      );
    }
  }
};

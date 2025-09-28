import { sequelize } from "../models/index.js";
import { DayOperation, DayOperationStockSnapshot, DayOperationStockVariance, DayOperationActivity, DayOperationUserStats } from "../models/index.js";

/**
 * Migration script to move data from JSON fields to relational tables
 * Run this script after creating the new tables
 */
const migrateJsonToRelational = async () => {
  console.log("Starting migration of DayOperation JSON fields to relational tables...");
  
  try {
    // Start a transaction to ensure data consistency
    const transaction = await sequelize.transaction();
    
    try {
      // Get all day operations
      const dayOperations = await DayOperation.findAll({ transaction });
      console.log(`Found ${dayOperations.length} day operations to migrate`);
      
      // Process each day operation
      for (const dayOp of dayOperations) {
        console.log(`Processing day operation ID: ${dayOp.id}, date: ${dayOp.date}`);
        
        // Migrate opening stock snapshot
        if (dayOp.openingStockSnapshot && Array.isArray(dayOp.openingStockSnapshot)) {
          console.log(`Migrating ${dayOp.openingStockSnapshot.length} opening stock items`);
          
          for (const item of dayOp.openingStockSnapshot) {
            await DayOperationStockSnapshot.create({
              dayOperationId: dayOp.id,
              type: 'opening',
              stockEntryId: item.stockEntryId,
              materialId: item.materialId,
              materialName: item.materialName || 'Unknown',
              materialCategory: item.materialCategory,
              quantity: item.quantity || 0,
              unit: item.unit || 'unit',
              costPerUnit: item.costPerUnit || 0,
              snapshotTime: item.snapshotTime || dayOp.openedAt
            }, { transaction });
          }
        }
        
        // Migrate closing stock snapshot
        if (dayOp.closingStockSnapshot && Array.isArray(dayOp.closingStockSnapshot)) {
          console.log(`Migrating ${dayOp.closingStockSnapshot.length} closing stock items`);
          
          for (const item of dayOp.closingStockSnapshot) {
            await DayOperationStockSnapshot.create({
              dayOperationId: dayOp.id,
              type: 'closing',
              stockEntryId: item.stockEntryId,
              materialId: item.materialId,
              materialName: item.materialName || 'Unknown',
              materialCategory: item.materialCategory,
              quantity: item.quantity || 0,
              unit: item.unit || 'unit',
              costPerUnit: item.costPerUnit || 0,
              snapshotTime: item.snapshotTime || dayOp.closedAt || dayOp.openedAt
            }, { transaction });
          }
        }
        
        // Migrate stock variances
        if (dayOp.stockVariances && Array.isArray(dayOp.stockVariances)) {
          console.log(`Migrating ${dayOp.stockVariances.length} stock variances`);
          
          for (const variance of dayOp.stockVariances) {
            await DayOperationStockVariance.create({
              dayOperationId: dayOp.id,
              stockEntryId: variance.stockEntryId,
              materialId: variance.materialId,
              materialName: variance.materialName || 'Unknown',
              openingQuantity: variance.openingQuantity || 0,
              closingQuantity: variance.closingQuantity || 0,
              variance: variance.variance || 0,
              unit: variance.unit || 'unit',
              varianceType: variance.varianceType || (variance.variance > 0 ? 'gain' : variance.variance < 0 ? 'loss' : 'none')
            }, { transaction });
          }
        }
        
        // Migrate activity logs
        if (dayOp.activityLogs && Array.isArray(dayOp.activityLogs)) {
          console.log(`Migrating ${dayOp.activityLogs.length} activity logs`);
          
          for (const activity of dayOp.activityLogs) {
            await DayOperationActivity.create({
              dayOperationId: dayOp.id,
              activityType: activity.type || 'unknown',
              description: activity.description || '',
              userId: activity.userId,
              userName: activity.userName || '',
              entityId: activity.entityId,
              entityType: activity.entityType || '',
              metadata: activity.metadata || {},
              timestamp: activity.timestamp || dayOp.openedAt
            }, { transaction });
          }
        }
        
        // Migrate user order stats
        if (dayOp.reportData && dayOp.reportData.userOrderStats && Array.isArray(dayOp.reportData.userOrderStats)) {
          console.log(`Migrating ${dayOp.reportData.userOrderStats.length} user order stats`);
          
          for (const userStat of dayOp.reportData.userOrderStats) {
            await DayOperationUserStats.create({
              dayOperationId: dayOp.id,
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
              notes: userStat.notes || ''
            }, { transaction });
          }
        }
      }
      
      // Commit the transaction
      await transaction.commit();
      console.log("Migration completed successfully!");
      
    } catch (error) {
      // Rollback the transaction if there's an error
      await transaction.rollback();
      console.error("Migration failed:", error);
      throw error;
    }
    
  } catch (error) {
    console.error("Migration failed:", error);
    throw error;
  }
};

export default migrateJsonToRelational;

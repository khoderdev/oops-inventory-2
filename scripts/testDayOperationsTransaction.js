import { sequelize } from "../backend/models/index.js";
import { DayOperation, StockEntry, Material, DayOperationStockSnapshot } from "../backend/models/index.js";
import { createStockSnapshots } from "../backend/controllers/dayOperationsControllerHelpers.js";

/**
 * Test script to verify the Day Operations transaction fix
 * This script simulates opening a day with a large number of stock entries
 */
const testDayOperationsTransaction = async () => {
  console.log("Starting Day Operations transaction test...");
  
  let transaction = null;
  try {
    // Start a transaction
    transaction = await sequelize.transaction();
    
    // Get today's date
    const today = new Date().toISOString().split("T")[0];
    const now = new Date();
    const uniqueIdentifier = now.getTime().toString();
    
    // Create a test day operation
    console.log("Creating test day operation...");
    const dayOperation = await DayOperation.create(
      {
        date: today,
        status: "opened",
        openedAt: now,
        openedBy: "Test Script",
        openingCash: 0,
        expectedCash: 0,
        notes: `Test day operation [${uniqueIdentifier}]`,
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
      },
      { transaction }
    );
    
    // Get all stock entries
    console.log("Fetching stock entries...");
    const stockEntries = await StockEntry.findAll({
      include: [{ model: Material, as: "material", attributes: ["id", "name", "baseUnit", "categoryId"] }],
      transaction
    });
    
    console.log(`Found ${stockEntries.length} stock entries`);
    
    // Create stock snapshots in batches
    console.log("Creating stock snapshots...");
    const snapshots = await createStockSnapshots(dayOperation.id, stockEntries, 'opening', now, transaction);
    
    console.log(`Created ${snapshots.length} stock snapshots`);
    
    // Commit the transaction
    console.log("Committing transaction...");
    await transaction.commit();
    
    // Verify that the stock snapshots were created
    const verifySnapshots = await DayOperationStockSnapshot.findAll({
      where: { dayOperationId: dayOperation.id }
    });
    
    console.log(`Verified ${verifySnapshots.length} stock snapshots in the database`);
    
    // Clean up the test data
    console.log("Cleaning up test data...");
    await DayOperationStockSnapshot.destroy({
      where: { dayOperationId: dayOperation.id }
    });
    
    await DayOperation.destroy({
      where: { id: dayOperation.id }
    });
    
    console.log("Test completed successfully!");
    process.exit(0);
  } catch (error) {
    // Rollback the transaction if it exists
    if (transaction && !transaction.finished) {
      try {
        await transaction.rollback();
        console.log("Transaction rolled back successfully");
      } catch (rollbackError) {
        console.error("Error during transaction rollback:", rollbackError);
      }
    }
    
    console.error("Test failed:", error);
    process.exit(1);
  }
};

// Run the test
testDayOperationsTransaction();

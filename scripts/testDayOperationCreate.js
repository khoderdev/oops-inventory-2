import sequelize from "../backend/config/database.js";
import { DayOperation } from "../backend/models/index.js";

async function testDayOperationCreate() {
  try {
    console.log("🧪 Testing DayOperation creation with duplicate dates...");
    
    const testDate = '2025-12-25'; // Use Christmas as test date
    const now = new Date();
    
    // Clean up any existing test records first
    await DayOperation.destroy({
      where: { date: testDate },
      force: true
    });
    
    console.log("🧹 Cleaned up any existing test records");
    
    // Test 1: Create first record
    console.log("📝 Creating first DayOperation record...");
    const dayOp1 = await DayOperation.create({
      date: testDate,
      uniqueId: `test_${now.getTime()}_1`,
      status: 'opened',
      openedAt: now,
      openedBy: 'Test User 1',
      openingCash: 100,
      expectedCash: 100,
      totalSales: 0,
      totalTransactions: 0,
      averageTicket: 0,
      openingStockSnapshot: [],
      closingStockSnapshot: [],
      stockVariances: [],
      autoReportGenerated: false,
      reportData: {},
      activityLogs: []
    });
    
    console.log(`✅ First record created successfully: ID ${dayOp1.id}`);
    
    // Test 2: Create second record with same date but different uniqueId
    console.log("📝 Creating second DayOperation record with same date...");
    const dayOp2 = await DayOperation.create({
      date: testDate, // Same date!
      uniqueId: `test_${now.getTime()}_2`,
      status: 'opened',
      openedAt: new Date(now.getTime() + 1000), // 1 second later
      openedBy: 'Test User 2',
      openingCash: 200,
      expectedCash: 200,
      totalSales: 0,
      totalTransactions: 0,
      averageTicket: 0,
      openingStockSnapshot: [],
      closingStockSnapshot: [],
      stockVariances: [],
      autoReportGenerated: false,
      reportData: {},
      activityLogs: []
    });
    
    console.log(`✅ Second record created successfully: ID ${dayOp2.id}`);
    
    // Test 3: Try to create with duplicate uniqueId (should fail)
    console.log("📝 Testing duplicate uniqueId (should fail)...");
    try {
      await DayOperation.create({
        date: testDate,
        uniqueId: `test_${now.getTime()}_1`, // Same uniqueId as first record
        status: 'opened',
        openedAt: now,
        openedBy: 'Test User 3',
        openingCash: 300,
        expectedCash: 300,
        totalSales: 0,
        totalTransactions: 0,
        averageTicket: 0,
        openingStockSnapshot: [],
        closingStockSnapshot: [],
        stockVariances: [],
        autoReportGenerated: false,
        reportData: {},
        activityLogs: []
      });
      console.log("❌ ERROR: Duplicate uniqueId should have failed but didn't!");
    } catch (duplicateError) {
      console.log("✅ Correctly rejected duplicate uniqueId:", duplicateError.message);
    }
    
    // Verify both records exist
    const records = await DayOperation.findAll({
      where: { date: testDate },
      order: [['createdAt', 'ASC']]
    });
    
    console.log(`\n📊 Found ${records.length} records for date ${testDate}:`);
    records.forEach((record, index) => {
      console.log(`  ${index + 1}. ID: ${record.id}, uniqueId: ${record.uniqueId}, openedBy: ${record.openedBy}`);
    });
    
    // Clean up test records
    await DayOperation.destroy({
      where: { date: testDate },
      force: true
    });
    
    console.log("\n🧹 Cleaned up test records");
    console.log("🎉 SUCCESS: Multiple day operations per date are now working!");
    
  } catch (error) {
    console.error("❌ Test failed:", error);
    console.error("Full error:", error.message);
    if (error.parent) {
      console.error("Database error:", error.parent.message);
    }
    throw error;
  } finally {
    await sequelize.close();
  }
}

// Run the test
testDayOperationCreate()
  .then(() => {
    console.log("🎉 Test completed successfully!");
    process.exit(0);
  })
  .catch(error => {
    console.error("💥 Test failed:", error);
    process.exit(1);
  });

import sequelize from "../backend/config/database.js";

async function simpleTest() {
  try {
    console.log("🔍 Simple test: checking constraints and trying direct SQL insert...");
    
    // Check current constraints
    const [constraints] = await sequelize.query(`
      SELECT conname, pg_get_constraintdef(oid) as definition
      FROM pg_constraint 
      WHERE conrelid = 'public."DayOperations"'::regclass
      AND contype = 'u'
      ORDER BY conname
    `);
    
    console.log("📋 Current unique constraints:");
    constraints.forEach(constraint => {
      console.log(`  - ${constraint.conname}: ${constraint.definition}`);
    });
    
    // Try a direct SQL insert
    const testDate = '2025-12-30';
    const uniqueId1 = `test_${Date.now()}_1`;
    const uniqueId2 = `test_${Date.now()}_2`;
    
    console.log(`\n🧪 Testing direct SQL insert for date: ${testDate}`);
    
    // Clean up first
    await sequelize.query(`DELETE FROM public."DayOperations" WHERE date = '${testDate}'`);
    
    // Insert first record
    try {
      await sequelize.query(`
        INSERT INTO public."DayOperations" 
        (date, "uniqueId", status, "openedAt", "openedBy", "openingCash", "expectedCash", "totalSales", "totalTransactions", "averageTicket", "openingStockSnapshot", "closingStockSnapshot", "stockVariances", "autoReportGenerated", "reportData", "activityLogs", "createdAt", "updatedAt")
        VALUES 
        ('${testDate}', '${uniqueId1}', 'opened', NOW(), 'Test1', 0, 0, 0, 0, 0, '[]', '[]', '[]', false, '{}', '[]', NOW(), NOW())
      `);
      console.log("✅ First record inserted successfully");
    } catch (error) {
      console.log("❌ First insert failed:", error.message);
      throw error;
    }
    
    // Insert second record with same date
    try {
      await sequelize.query(`
        INSERT INTO public."DayOperations" 
        (date, "uniqueId", status, "openedAt", "openedBy", "openingCash", "expectedCash", "totalSales", "totalTransactions", "averageTicket", "openingStockSnapshot", "closingStockSnapshot", "stockVariances", "autoReportGenerated", "reportData", "activityLogs", "createdAt", "updatedAt")
        VALUES 
        ('${testDate}', '${uniqueId2}', 'opened', NOW(), 'Test2', 0, 0, 0, 0, 0, '[]', '[]', '[]', false, '{}', '[]', NOW(), NOW())
      `);
      console.log("✅ Second record with same date inserted successfully!");
    } catch (error) {
      console.log("❌ Second insert failed:", error.message);
      console.log("Full error:", error);
      throw error;
    }
    
    // Check what we have
    const [records] = await sequelize.query(`
      SELECT id, date, "uniqueId", "openedBy" 
      FROM public."DayOperations" 
      WHERE date = '${testDate}'
      ORDER BY id
    `);
    
    console.log(`\n📊 Records found for ${testDate}:`);
    records.forEach(record => {
      console.log(`  ID: ${record.id}, uniqueId: ${record.uniqueId}, openedBy: ${record.openedBy}`);
    });
    
    // Clean up
    await sequelize.query(`DELETE FROM public."DayOperations" WHERE date = '${testDate}'`);
    console.log("🧹 Cleaned up test records");
    
  } catch (error) {
    console.error("❌ Test failed:", error.message);
    if (error.parent) {
      console.error("Database error details:", error.parent.message);
      console.error("Constraint:", error.parent.constraint);
      console.error("Detail:", error.parent.detail);
    }
  } finally {
    await sequelize.close();
  }
}

simpleTest()
  .then(() => {
    console.log("🎉 Simple test completed!");
    process.exit(0);
  })
  .catch(() => {
    process.exit(1);
  });

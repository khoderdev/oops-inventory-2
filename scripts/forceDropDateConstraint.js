import sequelize from "../backend/config/database.js";

async function forceDropDateConstraint() {
  try {
    console.log("🎯 Force dropping the 'day_operations_date' constraint...");
    
    // Try to drop the specific constraint mentioned in the error
    try {
      await sequelize.query(`ALTER TABLE public."DayOperations" DROP CONSTRAINT "day_operations_date"`);
      console.log("✅ Successfully dropped constraint: day_operations_date");
    } catch (error) {
      if (error.message.includes('does not exist')) {
        console.log("ℹ️  Constraint 'day_operations_date' does not exist (already dropped)");
      } else {
        console.log("❌ Error dropping 'day_operations_date':", error.message);
      }
    }
    
    // Also try common variations
    const possibleConstraints = [
      'day_operations_date',
      'DayOperations_date_key',
      'DayOperations_date_key495',
      'DayOperations_date_key496',
      'dayoperations_date_key',
      'unique_date_constraint'
    ];
    
    for (const constraintName of possibleConstraints) {
      try {
        await sequelize.query(`ALTER TABLE public."DayOperations" DROP CONSTRAINT "${constraintName}"`);
        console.log(`✅ Successfully dropped constraint: ${constraintName}`);
      } catch (error) {
        if (!error.message.includes('does not exist')) {
          console.log(`⚠️  Error with ${constraintName}:`, error.message);
        }
      }
    }
    
    // Check what's left
    console.log("\n🔍 Checking remaining constraints...");
    const [constraints] = await sequelize.query(`
      SELECT conname, pg_get_constraintdef(oid) as definition
      FROM pg_constraint 
      WHERE conrelid = 'public."DayOperations"'::regclass
      AND contype = 'u'
    `);
    
    console.log("📋 Remaining unique constraints:");
    constraints.forEach(constraint => {
      console.log(`  - ${constraint.conname}: ${constraint.definition}`);
    });
    
    // Test if we can create a duplicate date now
    console.log("\n🧪 Testing if duplicate dates are now allowed...");
    try {
      const testDate = '2025-12-31'; // Use a future date for testing
      
      // Try to create two records with the same date but different uniqueId
      await sequelize.query(`
        INSERT INTO public."DayOperations" 
        (date, "uniqueId", status, "openedAt", "openedBy", "openingCash", "expectedCash", "totalSales", "totalTransactions", "averageTicket", "openingStockSnapshot", "closingStockSnapshot", "stockVariances", "autoReportGenerated", "reportData", "activityLogs")
        VALUES 
        ('${testDate}', 'test1', 'opened', NOW(), 'Test', 0, 0, 0, 0, 0, '[]', '[]', '[]', false, '{}', '[]')
      `);
      
      await sequelize.query(`
        INSERT INTO public."DayOperations" 
        (date, "uniqueId", status, "openedAt", "openedBy", "openingCash", "expectedCash", "totalSales", "totalTransactions", "averageTicket", "openingStockSnapshot", "closingStockSnapshot", "stockVariances", "autoReportGenerated", "reportData", "activityLogs")
        VALUES 
        ('${testDate}', 'test2', 'opened', NOW(), 'Test', 0, 0, 0, 0, 0, '[]', '[]', '[]', false, '{}', '[]')
      `);
      
      console.log("✅ SUCCESS: Multiple records with same date created!");
      
      // Clean up test records
      await sequelize.query(`DELETE FROM public."DayOperations" WHERE date = '${testDate}'`);
      console.log("🧹 Cleaned up test records");
      
    } catch (testError) {
      console.log("❌ FAILED: Still cannot create duplicate dates:", testError.message);
    }
    
  } catch (error) {
    console.error("❌ Error in force drop:", error);
    throw error;
  } finally {
    await sequelize.close();
  }
}

// Run the force drop
forceDropDateConstraint()
  .then(() => {
    console.log("🎉 Force drop completed!");
    process.exit(0);
  })
  .catch(error => {
    console.error("💥 Force drop failed:", error);
    process.exit(1);
  });

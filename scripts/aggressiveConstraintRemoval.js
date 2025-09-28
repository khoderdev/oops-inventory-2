import sequelize from "../backend/config/database.js";

async function aggressiveConstraintRemoval() {
  try {
    console.log("🔥 AGGRESSIVE constraint removal for DayOperations table...");
    
    // Get ALL constraints on the table
    const [allConstraints] = await sequelize.query(`
      SELECT 
        conname, 
        contype,
        pg_get_constraintdef(oid) as definition
      FROM pg_constraint 
      WHERE conrelid = 'public."DayOperations"'::regclass
      ORDER BY contype, conname
    `);
    
    console.log("📋 ALL constraints found:");
    allConstraints.forEach(constraint => {
      const type = constraint.contype === 'u' ? 'UNIQUE' : 
                   constraint.contype === 'p' ? 'PRIMARY' : 
                   constraint.contype === 'f' ? 'FOREIGN' : constraint.contype;
      console.log(`  ${type}: ${constraint.conname} - ${constraint.definition}`);
    });
    
    // Find ALL unique constraints that mention 'date' but not 'uniqueId'
    const problematicConstraints = allConstraints.filter(c => 
      c.contype === 'u' && 
      (c.definition.toLowerCase().includes('date') || c.conname.toLowerCase().includes('date')) &&
      !c.definition.toLowerCase().includes('uniqueid') &&
      !c.conname.toLowerCase().includes('uniqueid')
    );
    
    console.log(`\n🎯 Found ${problematicConstraints.length} problematic date constraints:`);
    problematicConstraints.forEach(constraint => {
      console.log(`  ❌ ${constraint.conname}: ${constraint.definition}`);
    });
    
    // Drop each problematic constraint
    for (const constraint of problematicConstraints) {
      try {
        console.log(`\n🗑️  Dropping constraint: ${constraint.conname}`);
        await sequelize.query(`ALTER TABLE public."DayOperations" DROP CONSTRAINT "${constraint.conname}"`);
        console.log(`✅ Successfully dropped: ${constraint.conname}`);
      } catch (dropError) {
        console.log(`⚠️  Failed to drop ${constraint.conname}:`, dropError.message);
      }
    }
    
    // Also try to drop by common naming patterns
    const commonNames = [
      'day_operations_date',
      'DayOperations_date_key',
      'dayoperations_date_key',
      'unique_date',
      'date_unique'
    ];
    
    console.log("\n🔍 Trying common constraint name patterns...");
    for (const name of commonNames) {
      try {
        await sequelize.query(`ALTER TABLE public."DayOperations" DROP CONSTRAINT "${name}"`);
        console.log(`✅ Dropped: ${name}`);
      } catch (error) {
        if (!error.message.includes('does not exist')) {
          console.log(`⚠️  Issue with ${name}:`, error.message);
        }
      }
    }
    
    // Check what's left
    console.log("\n🔍 Checking remaining constraints...");
    const [remaining] = await sequelize.query(`
      SELECT conname, pg_get_constraintdef(oid) as definition
      FROM pg_constraint 
      WHERE conrelid = 'public."DayOperations"'::regclass
      AND contype = 'u'
      ORDER BY conname
    `);
    
    console.log("📋 Remaining unique constraints:");
    remaining.forEach(constraint => {
      const isProblematic = (constraint.definition.toLowerCase().includes('date') || constraint.conname.toLowerCase().includes('date')) &&
                           !constraint.definition.toLowerCase().includes('uniqueid') &&
                           !constraint.conname.toLowerCase().includes('uniqueid');
      const status = isProblematic ? "❌ STILL PROBLEMATIC" : "✅ OK";
      console.log(`  ${status} ${constraint.conname}: ${constraint.definition}`);
    });
    
    // Final test
    console.log("\n🧪 Final test: trying to insert duplicate dates...");
    const testDate = '2025-12-31';
    
    // Clean up first
    await sequelize.query(`DELETE FROM public."DayOperations" WHERE date = '${testDate}'`);
    
    try {
      // First insert
      await sequelize.query(`
        INSERT INTO public."DayOperations" 
        (date, "uniqueId", status, "openedAt", "openedBy", "openingCash", "expectedCash", "totalSales", "totalTransactions", "averageTicket", "openingStockSnapshot", "closingStockSnapshot", "stockVariances", "autoReportGenerated", "reportData", "activityLogs", "createdAt", "updatedAt")
        VALUES 
        ('${testDate}', 'final_test_1', 'opened', NOW(), 'Test1', 0, 0, 0, 0, 0, '[]', '[]', '[]', false, '{}', '[]', NOW(), NOW())
      `);
      
      // Second insert with same date
      await sequelize.query(`
        INSERT INTO public."DayOperations" 
        (date, "uniqueId", status, "openedAt", "openedBy", "openingCash", "expectedCash", "totalSales", "totalTransactions", "averageTicket", "openingStockSnapshot", "closingStockSnapshot", "stockVariances", "autoReportGenerated", "reportData", "activityLogs", "createdAt", "updatedAt")
        VALUES 
        ('${testDate}', 'final_test_2', 'opened', NOW(), 'Test2', 0, 0, 0, 0, 0, '[]', '[]', '[]', false, '{}', '[]', NOW(), NOW())
      `);
      
      console.log("🎉 SUCCESS! Multiple records with same date created!");
      
      // Clean up
      await sequelize.query(`DELETE FROM public."DayOperations" WHERE date = '${testDate}'`);
      
    } catch (testError) {
      console.log("❌ STILL FAILING:", testError.message);
      if (testError.constraint) {
        console.log("Constraint causing issue:", testError.constraint);
      }
    }
    
  } catch (error) {
    console.error("❌ Aggressive removal failed:", error);
  } finally {
    await sequelize.close();
  }
}

aggressiveConstraintRemoval()
  .then(() => {
    console.log("🎉 Aggressive constraint removal completed!");
    process.exit(0);
  })
  .catch(error => {
    console.error("💥 Failed:", error);
    process.exit(1);
  });

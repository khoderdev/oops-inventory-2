import sequelize from "../backend/config/database.js";

async function checkIndexes() {
  try {
    console.log("🔍 Checking ALL indexes on DayOperations table...");
    
    // Check all indexes
    const [indexes] = await sequelize.query(`
      SELECT 
        indexname,
        indexdef,
        schemaname,
        tablename
      FROM pg_indexes 
      WHERE schemaname = 'public' 
      AND tablename = 'DayOperations'
      ORDER BY indexname
    `);
    
    console.log("📋 ALL indexes on DayOperations:");
    indexes.forEach(index => {
      const isUnique = index.indexdef.includes('UNIQUE');
      const hasDate = index.indexdef.toLowerCase().includes('date');
      const hasUniqueId = index.indexdef.toLowerCase().includes('uniqueid');
      
      let status = "✅ OK";
      if (isUnique && hasDate && !hasUniqueId) {
        status = "❌ PROBLEMATIC (unique on date only)";
      } else if (isUnique && hasDate && hasUniqueId) {
        status = "✅ OK (composite unique)";
      } else if (isUnique) {
        status = "⚠️  UNIQUE (check manually)";
      }
      
      console.log(`  ${status}`);
      console.log(`    Name: ${index.indexname}`);
      console.log(`    Definition: ${index.indexdef}`);
      console.log("");
    });
    
    // Check for unique indexes specifically
    const [uniqueIndexes] = await sequelize.query(`
      SELECT 
        i.relname as indexname,
        pg_get_indexdef(i.oid) as indexdef,
        ix.indisunique as is_unique
      FROM pg_class t
      JOIN pg_index ix ON t.oid = ix.indrelid
      JOIN pg_class i ON i.oid = ix.indexrelid
      WHERE t.relname = 'DayOperations'
      AND ix.indisunique = true
      ORDER BY i.relname
    `);
    
    console.log("🎯 UNIQUE indexes specifically:");
    uniqueIndexes.forEach(index => {
      const hasDate = index.indexdef.toLowerCase().includes('date');
      const hasUniqueId = index.indexdef.toLowerCase().includes('uniqueid');
      
      let status = "✅ OK";
      if (hasDate && !hasUniqueId) {
        status = "❌ PROBLEMATIC - DROP THIS";
      }
      
      console.log(`  ${status} ${index.indexname}`);
      console.log(`    ${index.indexdef}`);
      console.log("");
    });
    
    // Try to drop problematic unique indexes
    const problematicIndexes = uniqueIndexes.filter(index => 
      index.indexdef.toLowerCase().includes('date') && 
      !index.indexdef.toLowerCase().includes('uniqueid')
    );
    
    if (problematicIndexes.length > 0) {
      console.log("🗑️  Dropping problematic unique indexes...");
      for (const index of problematicIndexes) {
        try {
          console.log(`Dropping index: ${index.indexname}`);
          await sequelize.query(`DROP INDEX IF EXISTS public."${index.indexname}"`);
          console.log(`✅ Dropped index: ${index.indexname}`);
        } catch (dropError) {
          console.log(`❌ Failed to drop ${index.indexname}:`, dropError.message);
        }
      }
    }
    
    // Final test after dropping indexes
    console.log("\n🧪 Testing after index cleanup...");
    const testDate = '2025-12-29';
    
    await sequelize.query(`DELETE FROM public."DayOperations" WHERE date = '${testDate}'`);
    
    try {
      await sequelize.query(`
        INSERT INTO public."DayOperations" 
        (date, "uniqueId", status, "openedAt", "openedBy", "openingCash", "expectedCash", "totalSales", "totalTransactions", "averageTicket", "openingStockSnapshot", "closingStockSnapshot", "stockVariances", "autoReportGenerated", "reportData", "activityLogs", "createdAt", "updatedAt")
        VALUES 
        ('${testDate}', 'index_test_1', 'opened', NOW(), 'Test1', 0, 0, 0, 0, 0, '[]', '[]', '[]', false, '{}', '[]', NOW(), NOW())
      `);
      
      await sequelize.query(`
        INSERT INTO public."DayOperations" 
        (date, "uniqueId", status, "openedAt", "openedBy", "openingCash", "expectedCash", "totalSales", "totalTransactions", "averageTicket", "openingStockSnapshot", "closingStockSnapshot", "stockVariances", "autoReportGenerated", "reportData", "activityLogs", "createdAt", "updatedAt")
        VALUES 
        ('${testDate}', 'index_test_2', 'opened', NOW(), 'Test2', 0, 0, 0, 0, 0, '[]', '[]', '[]', false, '{}', '[]', NOW(), NOW())
      `);
      
      console.log("🎉 SUCCESS! Duplicate dates work after index cleanup!");
      
      await sequelize.query(`DELETE FROM public."DayOperations" WHERE date = '${testDate}'`);
      
    } catch (testError) {
      console.log("❌ Still failing after index cleanup:", testError.message);
      console.log("Constraint:", testError.constraint);
      console.log("Detail:", testError.detail);
    }
    
  } catch (error) {
    console.error("❌ Index check failed:", error);
  } finally {
    await sequelize.close();
  }
}

checkIndexes()
  .then(() => {
    console.log("🎉 Index check completed!");
    process.exit(0);
  })
  .catch(error => {
    console.error("💥 Failed:", error);
    process.exit(1);
  });

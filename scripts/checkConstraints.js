import sequelize from "../backend/config/database.js";

async function checkConstraints() {
  try {
    console.log("🔍 Checking all constraints on DayOperations table...");
    
    // Check ALL constraints (not just unique)
    const [allConstraints] = await sequelize.query(`
      SELECT 
        conname, 
        contype,
        CASE 
          WHEN contype = 'p' THEN 'PRIMARY KEY'
          WHEN contype = 'u' THEN 'UNIQUE'
          WHEN contype = 'f' THEN 'FOREIGN KEY'
          WHEN contype = 'c' THEN 'CHECK'
          ELSE contype
        END as constraint_type,
        pg_get_constraintdef(oid) as definition
      FROM pg_constraint 
      WHERE conrelid = 'public."DayOperations"'::regclass
      ORDER BY contype, conname
    `);
    
    console.log("📋 ALL constraints on DayOperations table:");
    allConstraints.forEach(constraint => {
      console.log(`  ${constraint.constraint_type}: ${constraint.conname}`);
      console.log(`    Definition: ${constraint.definition}`);
      console.log("");
    });
    
    // Check specifically for unique constraints
    const uniqueConstraints = allConstraints.filter(c => c.contype === 'u');
    console.log("🎯 UNIQUE constraints specifically:");
    uniqueConstraints.forEach(constraint => {
      const isDateOnly = constraint.definition.includes('date') && !constraint.definition.includes('uniqueId');
      const status = isDateOnly ? "❌ PROBLEMATIC" : "✅ OK";
      console.log(`  ${status} ${constraint.conname}: ${constraint.definition}`);
    });
    
    // Check indexes as well
    console.log("\n🔍 Checking indexes on DayOperations table...");
    const [indexes] = await sequelize.query(`
      SELECT 
        indexname,
        indexdef
      FROM pg_indexes 
      WHERE tablename = 'DayOperations'
      ORDER BY indexname
    `);
    
    console.log("📋 Indexes:");
    indexes.forEach(index => {
      console.log(`  - ${index.indexname}`);
      console.log(`    ${index.indexdef}`);
      console.log("");
    });
    
  } catch (error) {
    console.error("❌ Error checking constraints:", error);
    throw error;
  } finally {
    await sequelize.close();
  }
}

// Run the check
checkConstraints()
  .then(() => {
    console.log("🎉 Constraint check completed!");
    process.exit(0);
  })
  .catch(error => {
    console.error("💥 Check failed:", error);
    process.exit(1);
  });

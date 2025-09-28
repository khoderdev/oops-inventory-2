import sequelize from "../backend/config/database.js";

async function removeDateConstraint() {
  try {
    console.log("🔍 Checking existing constraints on DayOperations table...");
    
    // Check existing constraints
    const [constraints] = await sequelize.query(`
      SELECT conname, contype, pg_get_constraintdef(oid) as definition
      FROM pg_constraint 
      WHERE conrelid = 'public."DayOperations"'::regclass
      AND contype = 'u'
    `);
    
    console.log("📋 Current unique constraints:");
    constraints.forEach(constraint => {
      console.log(`  - ${constraint.conname}: ${constraint.definition}`);
    });
    
    // Find and drop ALL date unique constraints (including different naming patterns)
    const dateConstraints = constraints.filter(c => 
      (c.definition.includes('date') && !c.definition.includes('uniqueId')) ||
      c.conname.toLowerCase().includes('date') && !c.conname.toLowerCase().includes('uniqueid')
    );
    
    if (dateConstraints.length > 0) {
      for (const constraint of dateConstraints) {
        console.log(`🗑️  Dropping constraint: ${constraint.conname}`);
        await sequelize.query(`ALTER TABLE public."DayOperations" DROP CONSTRAINT "${constraint.conname}"`);
        console.log(`✅ Successfully dropped constraint: ${constraint.conname}`);
      }
    } else {
      console.log("ℹ️  No date-only unique constraints found to drop");
    }
    
    // Verify constraints after removal
    console.log("\n🔍 Checking constraints after removal...");
    const [remainingConstraints] = await sequelize.query(`
      SELECT conname, contype, pg_get_constraintdef(oid) as definition
      FROM pg_constraint 
      WHERE conrelid = 'public."DayOperations"'::regclass
      AND contype = 'u'
    `);
    
    console.log("📋 Remaining unique constraints:");
    remainingConstraints.forEach(constraint => {
      console.log(`  - ${constraint.conname}: ${constraint.definition}`);
    });
    
    console.log("\n✅ Migration completed successfully!");
    console.log("🎯 Multiple day operations per date are now allowed");
    
  } catch (error) {
    console.error("❌ Error removing date constraint:", error);
    throw error;
  } finally {
    await sequelize.close();
  }
}

// Run the migration
removeDateConstraint()
  .then(() => {
    console.log("🎉 Database migration completed!");
    process.exit(0);
  })
  .catch(error => {
    console.error("💥 Migration failed:", error);
    process.exit(1);
  });

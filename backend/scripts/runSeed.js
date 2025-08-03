import { seedDatabase } from "../seeds/seedData.js";
import sequelize from "../config/database.js";

/**
 * Script to run the comprehensive database seeding
 */
async function runSeed() {
  try {
    console.log("🚀 Starting database seeding process...");
    
    // Test database connection
    await sequelize.authenticate();
    console.log("✅ Database connection established");

    // Run the comprehensive seed
    const result = await seedDatabase();
    
    console.log("\n📊 SEEDING SUMMARY:");
    console.log("==================");
    console.log(`Materials: ${result.materials.created} created, ${result.materials.existing} existed`);
    console.log(`Stock Entries: ${result.stockEntries.created} created, ${result.stockEntries.skipped} skipped`);
    console.log(`Menu Items: ${result.menuItems.created} created, ${result.menuItems.skipped} skipped`);
    console.log("\n🎉 Database seeding completed successfully!");
    
    process.exit(0);
  } catch (error) {
    console.error("❌ Seeding failed:", error);
    process.exit(1);
  }
}

// Run the seeding
runSeed();

import sequelize from "../config/database.js";
import Material from "../models/materials.js";
import StockEntry from "../models/StockEntry.js";
import { MenuItem, MenuItemIngredient } from "../models/menuItems.js";

/**
 * Truncate all seeding-related tables to start fresh
 */
async function truncateTables() {
  try {
    console.log("🗑️ Truncating database tables...");

    // Test database connection
    await sequelize.authenticate();
    console.log("✅ Database connection established");

    // Truncate tables in correct order (respecting foreign key constraints)
    console.log("🔄 Truncating MenuItemIngredients...");
    await sequelize.query('TRUNCATE TABLE "menuItemIngredients" CASCADE');
    
    console.log("🔄 Truncating MenuItems...");
    await sequelize.query('TRUNCATE TABLE "menuItems" CASCADE');
    
    console.log("🔄 Truncating StockEntries...");
    await sequelize.query('TRUNCATE TABLE "stockEntries" CASCADE');
    
    console.log("🔄 Truncating Materials...");
    await sequelize.query('TRUNCATE TABLE "materials" CASCADE');

    // Verify tables are empty
    const materialCount = await Material.count();
    const stockCount = await StockEntry.count();
    const menuCount = await MenuItem.count();
    const ingredientCount = await MenuItemIngredient.count();

    console.log("\n📊 TRUNCATION RESULTS:");
    console.log("======================");
    console.log(`Materials: ${materialCount} remaining`);
    console.log(`Stock Entries: ${stockCount} remaining`);
    console.log(`Menu Items: ${menuCount} remaining`);
    console.log(`Menu Item Ingredients: ${ingredientCount} remaining`);

    if (materialCount === 0 && stockCount === 0 && menuCount === 0 && ingredientCount === 0) {
      console.log("\n✅ All tables successfully truncated!");
    } else {
      console.log("\n⚠️ Some records may still exist");
    }

    await sequelize.close();
    console.log("🔌 Database connection closed");
    
  } catch (error) {
    console.error("❌ Error truncating tables:", error);
    process.exit(1);
  }
}

// Run the truncation
truncateTables();

import Material from "../models/materials.js";
import StockEntry from "../models/StockEntry.js";
import { MenuItem, MenuItemIngredient } from "../models/menuItems.js";
import { seedMaterials } from "./seedMaterials.js";
import { seedStockEntries } from "./seedStockEntries.js";
import { seedMenuItems } from "./seedMenuItems.js";

/**
 * Comprehensive seed function to populate the database
 */
export async function seedDatabase() {
  try {
    console.log("🌱 Starting comprehensive database seeding...");

    // Step 1: Create materials
    const materialsResult = await seedMaterials();
    console.log(`📦 Materials: ${materialsResult.created} created, ${materialsResult.existing} existed`);
    
    // Step 2: Create stock entries
    const stockResult = await seedStockEntries();
    console.log(`📋 Stock Entries: ${stockResult.created} created, ${stockResult.skipped} skipped`);
    
    // Step 3: Create menu items with ingredients
    const menuResult = await seedMenuItems();
    console.log(`🍽️ Menu Items: ${menuResult.created} created, ${menuResult.skipped} skipped`);

    console.log("✅ Database seeding completed successfully!");
    
    return {
      success: true,
      materials: materialsResult,
      stockEntries: stockResult,
      menuItems: menuResult,
      message: "All data seeded successfully"
    };

  } catch (error) {
    console.error("❌ Error seeding database:", error);
    throw error;
  }
}

// Export individual seed functions for flexibility
export { seedMaterials, seedStockEntries, seedMenuItems };

import Material from "../models/materials.js";
import { MenuItem } from "../models/menuItems.js";
import { seedMaterials } from "./seedMaterials.js";
import { seedStockEntries } from "./seedStockEntries.js";
import { seedMenuItems } from "./seedMenuItems.js";
import { seedBeverages } from "./seedBeverages.js";
import { seedPrinters } from "./seedPrinters.js";

export async function seedDatabase() {
  try {
    console.log("🌱 Starting comprehensive database seeding...");
    console.log("ℹ️  Note: All seed functions include duplicate prevention - existing data will be skipped");

    // Check if database already has significant data
    const materialCount = await Material.count();
    const menuItemCount = await MenuItem.count();

    if (materialCount > 100 && menuItemCount > 100) {
      console.log("📊 Database appears to already contain significant data:");
      console.log(`   - Materials: ${materialCount} items`);
      console.log(`   - Menu Items: ${menuItemCount} items`);
      console.log("🔄 Proceeding with seeding (duplicates will be skipped)...");
    }

    // Step 1: Create materials
    console.log("\n📦 Seeding materials...");
    const materialsResult = await seedMaterials();
    console.log(`📦 Materials: ${materialsResult.created} created, ${materialsResult.existing} existed`);

    // Step 2: Create printers and printer channels
    console.log("\n🖨️ Seeding printers...");
    await seedPrinters();
    console.log(`🖨️ Printers: Seeded successfully`);

    // Step 3: Create stock entries
    console.log("\n📋 Seeding stock entries...");
    const stockResult = await seedStockEntries();
    console.log(`📋 Stock Entries: ${stockResult.created} created, ${stockResult.skipped} skipped`);

    // Step 4: Create menu items with ingredients
    console.log("\n🍽️ Seeding menu items...");
    const menuResult = await seedMenuItems();
    console.log(`🍽️ Menu Items: ${menuResult.created} created, ${menuResult.skipped} skipped`);

    // Step 5: Create beverages
    console.log("\n🍹 Seeding beverages...");
    const beveragesResult = await seedBeverages();
    console.log(`🍹 Beverages: ${beveragesResult.created} created, ${beveragesResult.skipped} skipped`);

    // Summary
    const totalCreated = materialsResult.created + stockResult.created + menuResult.created + beveragesResult.created;
    const totalSkipped = (materialsResult.existing || 0) + (stockResult.skipped || 0) + (menuResult.skipped || 0) + (beveragesResult.skipped || 0);

    console.log("\n✅ Database seeding completed successfully!");
    console.log(`📊 Summary: ${totalCreated} items created, ${totalSkipped} items skipped (already existed)`);

    return {
      success: true,
      materials: materialsResult,
      stockEntries: stockResult,
      menuItems: menuResult,
      beverages: beveragesResult,
      summary: {
        totalCreated,
        totalSkipped
      },
      message: "All data seeded successfully with duplicate prevention"
    };
  } catch (error) {
    console.error("❌ Error seeding database:", error);
    throw error;
  }
}

export { seedMaterials, seedStockEntries, seedMenuItems, seedBeverages };

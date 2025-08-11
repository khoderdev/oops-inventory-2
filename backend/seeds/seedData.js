import Material from "../models/materials.js";
import { MenuItem } from "../models/menuItems.js";
import User from "../models/User.js";
import { seedUsers } from "./seedUsers.js";
import { seedMaterials } from "./seedMaterials.js";
import { seedStockEntries } from "./seedStockEntries.js";
import { seedMenuItems } from "./seedMenuItems.js";
import { seedBeverages } from "./seedBeverages.js";
import { seedPrinters } from "./seedPrinters.js";

export async function seedDatabase() {
  try {
    console.log("🌱 Starting comprehensive database seeding...");
    console.log("ℹ️  Note: All seed functions include duplicate prevention - existing data will be skipped");

    // CRITICAL: Users MUST be created first for proper relationships
    console.log("\n👥 STEP 1: Creating users (REQUIRED FIRST)...");
    const usersResult = await seedUsers();
    console.log(`👥 Users: ${usersResult.created} created, ${usersResult.existing} existed`);
    
    // Verify users exist before proceeding
    const userCount = await User.count();
    if (userCount === 0) {
      throw new Error("❌ CRITICAL: No users found after seeding. Cannot proceed with other seeds that require user relationships.");
    }
    console.log(`✅ User verification passed: ${userCount} users available for relationships`);

    // Check if database already has significant data (after users are confirmed)
    const materialCount = await Material.count();
    const menuItemCount = await MenuItem.count();

    if (materialCount > 100 && menuItemCount > 100) {
      console.log("📊 Database appears to already contain significant data:");
      console.log(`   - Users: ${userCount} users`);
      console.log(`   - Materials: ${materialCount} items`);
      console.log(`   - Menu Items: ${menuItemCount} items`);
      console.log("🔄 Proceeding with seeding (duplicates will be skipped)...");
    }

    // Step 2: Create printers and printer channels
    console.log("\n🖨️ Seeding printers...");
    await seedPrinters();
    console.log(`🖨️ Printers: Seeded successfully`);

    // Step 3: Create materials
    console.log("\n📦 Seeding materials...");
    const materialsResult = await seedMaterials();
    console.log(`📦 Materials: ${materialsResult.created} created, ${materialsResult.existing} existed`);

    // Step 4: Create stock entries
    console.log("\n📋 Seeding stock entries...");
    const stockResult = await seedStockEntries();
    console.log(`📋 Stock Entries: ${stockResult.created} created, ${stockResult.skipped} skipped`);

    // Step 5: Create menu items with ingredients
    console.log("\n🍽️ Seeding menu items...");
    const menuResult = await seedMenuItems();
    console.log(`🍽️ Menu Items: ${menuResult.created} created, ${menuResult.skipped} skipped`);

    // Step 6: Create beverages
    console.log("\n🍹 Seeding beverages...");
    const beveragesResult = await seedBeverages();
    console.log(`🍹 Beverages: ${beveragesResult.created} created, ${beveragesResult.skipped} skipped`);

    // Summary
    const totalCreated = usersResult.created + materialsResult.created + stockResult.created + menuResult.created + beveragesResult.created;
    const totalSkipped = (usersResult.existing || 0) + (materialsResult.existing || 0) + (stockResult.skipped || 0) + (menuResult.skipped || 0) + (beveragesResult.skipped || 0);

    console.log("\n✅ Database seeding completed successfully!");
    console.log(`📊 Summary: ${totalCreated} items created, ${totalSkipped} items skipped (already existed)`);

    return {
      success: true,
      users: usersResult,
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

export { seedUsers, seedMaterials, seedStockEntries, seedMenuItems, seedBeverages };

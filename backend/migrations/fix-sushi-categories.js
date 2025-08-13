import { MenuItem } from "../models/menuItems.js";
import Category from "../models/Category.js";
import sequelize from "../config/database.js";

/**
 * Fix sushi items that were incorrectly categorized as "plates"
 * This script updates existing sushi menu items to use the correct sushi category ID
 */
async function fixSushiCategories() {
  try {
    console.log("🍣 Starting sushi category fix...");
    console.log("📦 Models loaded:", { MenuItem: !!MenuItem, Category: !!Category });
    
    await sequelize.authenticate();
    console.log("✅ Database connected successfully");

    // Get the sushi category ID
    const sushiCategory = await Category.findOne({
      where: { value: "sushi", type: "menu_items" }
    });

    if (!sushiCategory) {
      console.error("❌ Sushi category not found!");
      return;
    }

    console.log(`🎯 Found sushi category: ID ${sushiCategory.id}, Name: "${sushiCategory.name}"`);

    // Define all sushi item names that need to be updated
    const sushiItemNames = [
      // SUSHI STARTERS
      "Edamame",
      "Spicy Edamame", 
      "Shoyu Carpaccio",
      "Dynamite Salmon",
      
      // SUSHI SALADS
      "Oishi Kani",
      "Crunchy Salmon",
      "Crunchy Tuna",
      "Exotic Poke Bowl",
      "Rainbow",
      
      // SASHIMI
      "Crab Sashimi",
      "Shrimp Sashimi",
      "Salmon Sashimi",
      "Tuna Sashimi",
      
      // TEMAKI
      "Crab Temaki",
      "Shrimp Temaki",
      "Salmon Temaki",
      "Shoyu Temaki",
      
      // CRISPY URA MAKI
      "Crispy California",
      "Crispy Shrimps",
      "Crispy Salmon",
      "Crispy Tuna",
      "Crispy Crazy",
      
      // URA MAKI
      "Crazy Strawberry",
      "Crazy Kiwi",
      "Crazy Mango",
      "Crazy Avo",
      "Crazy Shrimps",
      "Crazy Salmon",
      "Crazy Tuna",
      "Spicy Shrimps",
      "Spicy Salmon",
      "Spicy Tuna",
      
      // HOSO MAKI
      "Hoso Avocado",
      "Hoso Mango",
      "Hoso Salmon",
      "Hoso Tuna",
      "Hoso Shrimp",
      "Hoso Crab Sticks",
      
      // BURRITO
      "Burrito California",
      "Burrito Lady Choice",
      "Burrito Tokyo"
    ];

    console.log(`🔍 Looking for ${sushiItemNames.length} sushi items to update...`);

    // Find all sushi items that need to be updated
    const sushiItems = await MenuItem.findAll({
      where: {
        name: sushiItemNames
      }
    });

    console.log(`📋 Found ${sushiItems.length} sushi items in database`);

    if (sushiItems.length === 0) {
      console.log("⚠️ No sushi items found to update");
      return;
    }

    // Update each sushi item to use the correct category ID
    let updatedCount = 0;
    let alreadyCorrectCount = 0;

    for (const item of sushiItems) {
      if (item.categoryId !== sushiCategory.id) {
        const oldCategoryId = item.categoryId;
        await item.update({ categoryId: sushiCategory.id });
        console.log(`✅ Updated "${item.name}": categoryId ${oldCategoryId} → ${sushiCategory.id}`);
        updatedCount++;
      } else {
        console.log(`⏭️ "${item.name}" already has correct categoryId ${sushiCategory.id}`);
        alreadyCorrectCount++;
      }
    }

    console.log("\n🎉 Sushi category fix completed!");
    console.log(`📊 Summary:`);
    console.log(`   - Items updated: ${updatedCount}`);
    console.log(`   - Items already correct: ${alreadyCorrectCount}`);
    console.log(`   - Total sushi items: ${sushiItems.length}`);

    // Verify the fix by checking a few sushi items
    console.log("\n🔍 Verification - checking some sushi items:");
    const verificationItems = await MenuItem.findAll({
      where: {
        name: ["Edamame", "Salmon Sashimi", "Crispy California", "Burrito Tokyo"]
      },
      include: [{
        model: Category,
        attributes: ['id', 'name', 'value']
      }]
    });

    verificationItems.forEach(item => {
      console.log(`   - "${item.name}": categoryId ${item.categoryId} (${item.Category?.name})`);
    });

  } catch (error) {
    console.error("❌ Error fixing sushi categories:", error);
    console.error("Stack trace:", error.stack);
    throw error;
  }
}

// Run the fix if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  fixSushiCategories()
    .then(() => {
      console.log("✅ Migration completed successfully");
      process.exit(0);
    })
    .catch((error) => {
      console.error("❌ Migration failed:", error);
      process.exit(1);
    });
}

export default fixSushiCategories;

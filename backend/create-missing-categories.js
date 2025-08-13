import sequelize from "./config/database.js";

console.log("🔧 Creating missing beverage menu item categories...");

async function createMissingCategories() {
  try {
    await sequelize.authenticate();
    
    // Check current menu item categories
    const [existingCategories] = await sequelize.query(`
      SELECT id, name, value FROM categories 
      WHERE type = 'menu_items' 
      ORDER BY id
    `);
    
    console.log("\n📋 Current menu item categories:");
    existingCategories.forEach(cat => {
      console.log(`   ${cat.value}: ID ${cat.id} (${cat.name})`);
    });

    // Define missing categories
    const missingCategories = [
      { name: "Cold Beverages", value: "cold", type: "menu_items", sortOrder: 10 },
      { name: "Hot Beverages", value: "hot", type: "menu_items", sortOrder: 11 },
      { name: "Alcohol", value: "alcohol", type: "menu_items", sortOrder: 12 }
    ];

    console.log("\n🔍 Checking for missing categories...");
    
    for (const category of missingCategories) {
      // Check if category already exists
      const [existing] = await sequelize.query(`
        SELECT id FROM categories 
        WHERE value = ? AND type = ?
      `, { replacements: [category.value, category.type] });

      if (existing.length === 0) {
        // Create the missing category
        await sequelize.query(`
          INSERT INTO categories (name, value, type, "sortOrder", "isActive", "createdAt", "updatedAt")
          VALUES (?, ?, ?, ?, true, NOW(), NOW())
        `, { replacements: [category.name, category.value, category.type, category.sortOrder] });
        
        console.log(`   ✅ Created: ${category.name} (${category.value})`);
      } else {
        console.log(`   ⏭️ Already exists: ${category.name} (${category.value})`);
      }
    }

    // Show updated categories
    const [updatedCategories] = await sequelize.query(`
      SELECT id, name, value FROM categories 
      WHERE type = 'menu_items' 
      ORDER BY id
    `);
    
    console.log("\n📋 Updated menu item categories:");
    updatedCategories.forEach(cat => {
      console.log(`   ${cat.value}: ID ${cat.id} (${cat.name})`);
    });

    await sequelize.close();
    console.log("\n🎉 Missing categories creation completed!");

  } catch (error) {
    console.error("❌ Error:", error.message);
    console.error("Stack:", error.stack);
  }
}

createMissingCategories();

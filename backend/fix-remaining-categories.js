import sequelize from "./config/database.js";

console.log("🔧 Fixing remaining null categories...");

async function fixRemainingCategories() {
  try {
    await sequelize.authenticate();
    
    // Get all categories
    const [categories] = await sequelize.query(`
      SELECT id, name, value FROM categories 
      WHERE type = 'menu_items' 
      ORDER BY id
    `);
    
    console.log("\n📋 Available categories:");
    const categoryMap = {};
    categories.forEach(cat => {
      categoryMap[cat.value] = cat.id;
      console.log(`   ${cat.value}: ID ${cat.id} (${cat.name})`);
    });

    // Get all items with null categoryId
    const [nullItems] = await sequelize.query(`
      SELECT name FROM "menuItems" 
      WHERE "categoryId" IS NULL 
      ORDER BY name
    `);

    console.log(`\n🔍 Processing ${nullItems.length} items with null categoryId...`);

    let updatedCount = 0;

    for (const item of nullItems) {
      const name = item.name.toLowerCase();
      let targetCategoryId = null;
      let categoryType = '';

      // Categorize based on name patterns
      if (name.includes('coffee') || name.includes('latte') || name.includes('cappuccino') || 
          name.includes('espresso') || name.includes('americano') || name.includes('macchiato') || 
          name.includes('mocha') || name.includes('hot chocolate')) {
        targetCategoryId = categoryMap['hot'];
        categoryType = 'hot beverages';
      } 
      else if (name.includes('juice') || name.includes('lemonade') || name.includes('smoothie') || 
               name.includes('shake') || name.includes('iced') || name.includes('cold') ||
               name.includes('energy drink')) {
        targetCategoryId = categoryMap['cold'];
        categoryType = 'cold beverages';
      }
      else if (name.includes('beer') || name.includes('wine') || name.includes('whiskey') || 
               name.includes('vodka') || name.includes('gin') || name.includes('rum') ||
               name.includes('almaza') || name.includes('baileys') || name.includes('label') ||
               name.includes('bottle') || name.includes('glass') || name.includes('shot') ||
               name.includes('russian') || name.includes('martini') || name.includes('mojito') ||
               name.includes('belvedere') || name.includes('bombay') || name.includes('beefeater')) {
        targetCategoryId = categoryMap['alcohol'];
        categoryType = 'alcohol';
      }
      else if (name.includes('cake') || name.includes('chocolate') || name.includes('dessert')) {
        targetCategoryId = categoryMap['desserts'];
        categoryType = 'desserts';
      }
      else if (name.includes('pasta') || name.includes('spaghetti') || name.includes('penne')) {
        targetCategoryId = categoryMap['pasta'];
        categoryType = 'pasta';
      }
      else if (name.includes('pizza')) {
        targetCategoryId = categoryMap['pizza'];
        categoryType = 'pizza';
      }
      else if (name.includes('breakfast') || name.includes('pancake') || name.includes('omelette')) {
        targetCategoryId = categoryMap['breakfast'];
        categoryType = 'breakfast';
      }
      else {
        // Default to plates for main dishes or unidentified items
        targetCategoryId = categoryMap['plates'];
        categoryType = 'plates (default)';
      }

      if (targetCategoryId) {
        await sequelize.query(`
          UPDATE "menuItems" 
          SET "categoryId" = ? 
          WHERE name = ? AND "categoryId" IS NULL
        `, { replacements: [targetCategoryId, item.name] });

        console.log(`   ✅ "${item.name}" → ${categoryType}`);
        updatedCount++;
      } else {
        console.log(`   ⚠️ "${item.name}" → no suitable category found`);
      }
    }

    console.log(`\n📊 Updated ${updatedCount} items`);

    // Final verification
    const [finalCheck] = await sequelize.query(`
      SELECT 
        c.name as "categoryName",
        c.value as "categoryValue",
        COUNT(m.id) as "itemCount"
      FROM categories c
      LEFT JOIN "menuItems" m ON c.id = m."categoryId"
      WHERE c.type = 'menu_items'
      GROUP BY c.id, c.name, c.value
      ORDER BY c.id
    `);

    console.log("\n🔍 FINAL CATEGORY DISTRIBUTION:");
    finalCheck.forEach(row => {
      console.log(`   ${row.categoryValue}: ${row.itemCount} items`);
    });

    const [nullCount] = await sequelize.query(`
      SELECT COUNT(*) as count FROM "menuItems" WHERE "categoryId" IS NULL
    `);
    
    console.log(`   null categories: ${nullCount[0].count} items`);

    await sequelize.close();
    console.log("\n🎉 Category fix completed successfully!");

  } catch (error) {
    console.error("❌ Error:", error.message);
    console.error("Stack:", error.stack);
  }
}

fixRemainingCategories();

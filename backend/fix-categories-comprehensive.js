import sequelize from "./config/database.js";

console.log("🔧 Starting comprehensive category fix...");

async function fixCategories() {
  try {
    await sequelize.authenticate();
    console.log("✅ Database connected");

    // Get all menu item categories
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

    // 1. Fix sushi items that are incorrectly categorized as "plates"
    console.log("\n🍣 FIXING SUSHI ITEMS:");
    const sushiItemNames = [
      'Edamame', 'Spicy Edamame', 'Shoyu Carpaccio', 'Dynamite Salmon',
      'Oishi Kani', 'Crunchy Salmon', 'Crunchy Tuna', 'Exotic Poke Bowl', 'Rainbow',
      'Crab Sashimi', 'Shrimp Sashimi', 'Salmon Sashimi', 'Tuna Sashimi',
      'Crab Temaki', 'Shrimp Temaki', 'Salmon Temaki', 'Shoyu Temaki',
      'Crispy California', 'Crispy Shrimps', 'Crispy Salmon', 'Crispy Tuna', 'Crispy Crazy',
      'Crazy Strawberry', 'Crazy Kiwi', 'Crazy Mango', 'Crazy Avo', 'Crazy Shrimps', 'Crazy Salmon', 'Crazy Tuna',
      'Spicy Shrimps', 'Spicy Salmon', 'Spicy Tuna',
      'Hoso Avocado', 'Hoso Mango', 'Hoso Salmon', 'Hoso Tuna', 'Hoso Shrimp', 'Hoso Crab Sticks',
      'Burrito California', 'Burrito Lady Choice', 'Burrito Tokyo'
    ];

    const sushiCategoryId = categoryMap['sushi'];
    const platesCategoryId = categoryMap['plates'];

    if (sushiCategoryId && platesCategoryId) {
      // Check current sushi items
      const sushiPlaceholders = sushiItemNames.map(() => '?').join(',');
      const [currentSushi] = await sequelize.query(`
        SELECT name, "categoryId" FROM "menuItems" 
        WHERE name IN (${sushiPlaceholders})
      `, { replacements: sushiItemNames });

      const wrongSushi = currentSushi.filter(item => item.categoryId === platesCategoryId);
      console.log(`   Found ${wrongSushi.length} sushi items with plates category`);

      if (wrongSushi.length > 0) {
        await sequelize.query(`
          UPDATE "menuItems" 
          SET "categoryId" = ? 
          WHERE name IN (${sushiPlaceholders}) AND "categoryId" = ?
        `, { replacements: [sushiCategoryId, ...sushiItemNames, platesCategoryId] });
        
        console.log(`   ✅ Updated ${wrongSushi.length} sushi items to sushi category`);
      } else {
        console.log(`   ✅ All sushi items already have correct category`);
      }
    }

    // 2. Fix beverages with null categoryId
    console.log("\n🥤 FIXING BEVERAGE ITEMS:");
    
    // Get beverages with null categoryId
    const [nullBeverages] = await sequelize.query(`
      SELECT name FROM "menuItems" 
      WHERE "categoryId" IS NULL 
      AND (name LIKE '%Coffee%' OR name LIKE '%Tea%' OR name LIKE '%Juice%' 
           OR name LIKE '%Lemonade%' OR name LIKE '%Smoothie%' OR name LIKE '%Shake%'
           OR name LIKE '%Latte%' OR name LIKE '%Cappuccino%' OR name LIKE '%Espresso%'
           OR name LIKE '%Americano%' OR name LIKE '%Macchiato%' OR name LIKE '%Mocha%')
    `);

    console.log(`   Found ${nullBeverages.length} beverages with null categoryId`);

    if (nullBeverages.length > 0) {
      // Categorize beverages based on their names
      const hotBeverageKeywords = ['Coffee', 'Latte', 'Cappuccino', 'Espresso', 'Americano', 'Macchiato', 'Mocha', 'Hot Tea', 'Tea'];
      const coldBeverageKeywords = ['Juice', 'Lemonade', 'Smoothie', 'Shake', 'Iced', 'Cold'];
      
      const hotCategoryId = categoryMap['hot'];
      const coldCategoryId = categoryMap['cold'];

      if (hotCategoryId && coldCategoryId) {
        for (const beverage of nullBeverages) {
          const isHot = hotBeverageKeywords.some(keyword => beverage.name.includes(keyword));
          const isCold = coldBeverageKeywords.some(keyword => beverage.name.includes(keyword));
          
          let targetCategoryId;
          let categoryType;
          
          if (isHot && !isCold) {
            targetCategoryId = hotCategoryId;
            categoryType = 'hot';
          } else if (isCold && !isHot) {
            targetCategoryId = coldCategoryId;
            categoryType = 'cold';
          } else {
            // Default to cold for ambiguous cases
            targetCategoryId = coldCategoryId;
            categoryType = 'cold (default)';
          }

          await sequelize.query(`
            UPDATE "menuItems" 
            SET "categoryId" = ? 
            WHERE name = ? AND "categoryId" IS NULL
          `, { replacements: [targetCategoryId, beverage.name] });

          console.log(`   ✅ "${beverage.name}" → ${categoryType} category`);
        }
      }
    }

    // 3. Final verification
    console.log("\n🔍 FINAL VERIFICATION:");
    
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

fixCategories();

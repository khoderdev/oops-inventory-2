import sequelize from "./config/database.js";

console.log("🍣 Starting direct sushi category fix...");

async function fixSushiDirect() {
  try {
    await sequelize.authenticate();
    console.log("✅ Database connected");

    // First, let's see what categories exist
    const [categories] = await sequelize.query(`
      SELECT id, name, value FROM categories 
      WHERE type = 'menu_items' 
      ORDER BY id
    `);
    
    console.log("\n📋 Available menu item categories:");
    categories.forEach(cat => {
      console.log(`   ID: ${cat.id}, Value: '${cat.value}', Name: '${cat.name}'`);
    });

    // Find sushi and plates category IDs
    const sushiCategory = categories.find(cat => cat.value === 'sushi');
    const platesCategory = categories.find(cat => cat.value === 'plates');

    if (!sushiCategory) {
      console.error("❌ Sushi category not found!");
      return;
    }

    if (!platesCategory) {
      console.error("❌ Plates category not found!");
      return;
    }

    console.log(`\n🎯 Target categories:`);
    console.log(`   Sushi: ID ${sushiCategory.id}`);
    console.log(`   Plates: ID ${platesCategory.id}`);

    // Define sushi item names
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

    // Check current status of sushi items
    const placeholders = sushiItemNames.map(() => '?').join(',');
    const [currentSushiItems] = await sequelize.query(`
      SELECT name, categoryId FROM menuItems 
      WHERE name IN (${placeholders})
      ORDER BY name
    `, {
      replacements: sushiItemNames
    });

    console.log(`\n🔍 Found ${currentSushiItems.length} sushi items in database:`);
    let needsUpdate = 0;
    let alreadyCorrect = 0;

    currentSushiItems.forEach(item => {
      if (item.categoryId === platesCategory.id) {
        console.log(`   ❌ "${item.name}": categoryId ${item.categoryId} (plates) - NEEDS UPDATE`);
        needsUpdate++;
      } else if (item.categoryId === sushiCategory.id) {
        console.log(`   ✅ "${item.name}": categoryId ${item.categoryId} (sushi) - CORRECT`);
        alreadyCorrect++;
      } else {
        console.log(`   ⚠️ "${item.name}": categoryId ${item.categoryId} (other) - UNEXPECTED`);
      }
    });

    console.log(`\n📊 Summary: ${needsUpdate} need update, ${alreadyCorrect} already correct`);

    if (needsUpdate > 0) {
      console.log(`\n🔄 Updating ${needsUpdate} sushi items...`);
      
      // Update sushi items from plates category to sushi category
      const [result] = await sequelize.query(`
        UPDATE menuItems 
        SET categoryId = ? 
        WHERE name IN (${placeholders}) AND categoryId = ?
      `, {
        replacements: [sushiCategory.id, ...sushiItemNames, platesCategory.id]
      });

      console.log(`✅ Updated ${result.affectedRows || result.rowCount || 'unknown'} sushi items`);

      // Verify the update
      const [verifyItems] = await sequelize.query(`
        SELECT name, categoryId FROM menuItems 
        WHERE name IN (${placeholders}) AND categoryId = ?
        ORDER BY name
      `, {
        replacements: [...sushiItemNames, sushiCategory.id]
      });

      console.log(`\n🔍 Verification - ${verifyItems.length} items now have sushi category:`);
      verifyItems.slice(0, 5).forEach(item => {
        console.log(`   ✅ "${item.name}": categoryId ${item.categoryId}`);
      });
      if (verifyItems.length > 5) {
        console.log(`   ... and ${verifyItems.length - 5} more items`);
      }
    } else {
      console.log(`\n🎉 All sushi items already have correct categories!`);
    }

    await sequelize.close();
    console.log(`\n✅ Sushi category fix completed successfully!`);

  } catch (error) {
    console.error("❌ Error:", error.message);
    console.error("Stack:", error.stack);
  }
}

fixSushiDirect();

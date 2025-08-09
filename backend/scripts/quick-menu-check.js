import sequelize from "../config/database.js";

async function quickMenuCheck() {
  try {
    await sequelize.authenticate();
    
    const [menuResults] = await sequelize.query(`
      SELECT COUNT(*) as menu_count FROM "menuItems"
    `);
    
    const [ingredientResults] = await sequelize.query(`
      SELECT COUNT(*) as ingredient_count FROM "menuItemIngredients"
    `);
    
    console.log(`📊 Menu Items: ${menuResults[0].menu_count}`);
    console.log(`🥕 Ingredients: ${ingredientResults[0].ingredient_count}`);
    
    // Show sample menu items
    const [sampleMenu] = await sequelize.query(`
      SELECT id, name, category, price FROM "menuItems" ORDER BY id LIMIT 5
    `);
    
    console.log("\n📋 Sample Menu Items:");
    console.table(sampleMenu);
    
    // Show sample ingredients
    const [sampleIngredients] = await sequelize.query(`
      SELECT id, "menuItemId", "materialId", quantity, unit, cost 
      FROM "menuItemIngredients" ORDER BY id LIMIT 10
    `);
    
    console.log("\n🥕 Sample Ingredients:");
    console.table(sampleIngredients);
    
  } catch (error) {
    console.error("❌ Error:", error.message);
  } finally {
    await sequelize.close();
  }
}

quickMenuCheck();

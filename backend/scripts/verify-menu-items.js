import sequelize from "../config/database.js";
import "../models/index.js";
import { MenuItem, MenuItemIngredient } from "../models/menuItems.js";
import Material from "../models/materials.js";

async function verifyMenuItems() {
  try {
    console.log("🔍 Verifying menu items...");
    
    // Connect to database
    await sequelize.authenticate();
    console.log("✅ Database connected");
    
    // Count menu items and ingredients
    const menuItemCount = await MenuItem.count();
    const ingredientCount = await MenuItemIngredient.count();
    
    console.log(`🍔 Total menu items: ${menuItemCount}`);
    console.log(`🥕 Total ingredients: ${ingredientCount}`);
    
    // Get menu items with their ingredients
    const menuItems = await MenuItem.findAll({
      include: [{
        model: MenuItemIngredient,
        as: 'ingredients',
        include: [{
          model: Material,
          attributes: ['name']
        }]
      }],
      order: [['id', 'ASC']]
    });
    
    console.log("\n📋 Menu items with ingredients:");
    menuItems.forEach((item, index) => {
      console.log(`\n${index + 1}. ${item.name} - $${item.price} (${item.category})`);
      console.log(`   Description: ${item.description || 'No description'}`);
      console.log(`   POS Item: ${item.isPOSItem ? 'Yes' : 'No'}`);
      
      if (item.ingredients && item.ingredients.length > 0) {
        console.log(`   Ingredients (${item.ingredients.length}):`);
        item.ingredients.forEach((ing, ingIndex) => {
          const materialName = ing.Material ? ing.Material.name : `Material ID ${ing.materialId}`;
          console.log(`     ${ingIndex + 1}. ${materialName}: ${ing.quantity} ${ing.unit} ($${ing.cost})`);
        });
      } else {
        console.log(`   No ingredients found`);
      }
    });
    
    // Sample query to match your expected format
    console.log("\n📊 Sample menu items data:");
    const [menuResults] = await sequelize.query(`
      SELECT 
        id,
        name,
        description,
        category,
        price,
        "isPOSItem",
        "createdAt",
        "updatedAt"
      FROM "menuItems" 
      ORDER BY id 
      LIMIT 3
    `);
    
    console.table(menuResults);
    
    console.log("\n📊 Sample ingredients data:");
    const [ingredientResults] = await sequelize.query(`
      SELECT 
        id,
        "menuItemId",
        "materialId",
        quantity,
        unit,
        cost
      FROM "menuItemIngredients" 
      ORDER BY id 
      LIMIT 5
    `);
    
    console.table(ingredientResults);
    
    if (menuItemCount > 0 && ingredientCount > 0) {
      console.log("\n🎉 SUCCESS: Menu items and ingredients created successfully!");
    } else {
      console.log("\n⚠️ No menu items or ingredients found");
    }
    
  } catch (error) {
    console.error("❌ Error:", error.message);
  } finally {
    await sequelize.close();
  }
}

verifyMenuItems();

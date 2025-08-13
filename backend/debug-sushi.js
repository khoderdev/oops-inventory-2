import { MenuItem } from "./models/menuItems.js";
import Category from "./models/Category.js";
import sequelize from "./config/database.js";

console.log("🔍 Debug script starting...");

async function debugSushi() {
  try {
    console.log("📦 Models loaded:", { MenuItem: !!MenuItem, Category: !!Category });
    
    await sequelize.authenticate();
    console.log("✅ Database connected");

    // Get sushi category
    const sushiCategory = await Category.findOne({
      where: { value: "sushi", type: "menu_items" }
    });
    
    console.log("🍣 Sushi category:", sushiCategory ? `ID: ${sushiCategory.id}, Name: ${sushiCategory.name}` : "NOT FOUND");

    // Get plates category for comparison
    const platesCategory = await Category.findOne({
      where: { value: "plates", type: "menu_items" }
    });
    
    console.log("🍽️ Plates category:", platesCategory ? `ID: ${platesCategory.id}, Name: ${platesCategory.name}` : "NOT FOUND");

    // Check some sushi items
    const sushiItems = await MenuItem.findAll({
      where: {
        name: ["Edamame", "Salmon Sashimi", "Crispy California"]
      },
      include: [{
        model: Category,
        attributes: ['id', 'name', 'value']
      }]
    });

    console.log("\n🔍 Current sushi items status:");
    sushiItems.forEach(item => {
      console.log(`   - "${item.name}": categoryId ${item.categoryId} (${item.Category?.name || 'NO CATEGORY'})`);
    });

    await sequelize.close();
    
  } catch (error) {
    console.error("❌ Error:", error.message);
    console.error("Stack:", error.stack);
  }
}

debugSushi();

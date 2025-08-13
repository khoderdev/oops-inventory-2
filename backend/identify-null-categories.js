import sequelize from "./config/database.js";

console.log("🔍 Identifying items with null categories...");

async function identifyNullCategories() {
  try {
    await sequelize.authenticate();
    
    // Get all items with null categoryId
    const [nullItems] = await sequelize.query(`
      SELECT name FROM "menuItems" 
      WHERE "categoryId" IS NULL 
      ORDER BY name
    `);

    console.log(`\n📋 Found ${nullItems.length} items with null categoryId:`);
    
    // Group items by likely categories based on name patterns
    const categories = {
      beverages: [],
      pasta: [],
      pizza: [],
      breakfast: [],
      desserts: [],
      plates: [],
      other: []
    };

    nullItems.forEach(item => {
      const name = item.name.toLowerCase();
      
      if (name.includes('coffee') || name.includes('tea') || name.includes('juice') || 
          name.includes('lemonade') || name.includes('smoothie') || name.includes('shake') ||
          name.includes('latte') || name.includes('cappuccino') || name.includes('espresso') ||
          name.includes('americano') || name.includes('macchiato') || name.includes('mocha') ||
          name.includes('drink') || name.includes('beverage')) {
        categories.beverages.push(item.name);
      } else if (name.includes('pasta') || name.includes('spaghetti') || name.includes('penne') ||
                 name.includes('linguine') || name.includes('ravioli') || name.includes('lasagna')) {
        categories.pasta.push(item.name);
      } else if (name.includes('pizza') || name.includes('margherita') || name.includes('pepperoni')) {
        categories.pizza.push(item.name);
      } else if (name.includes('breakfast') || name.includes('pancake') || name.includes('waffle') ||
                 name.includes('omelette') || name.includes('eggs') || name.includes('toast')) {
        categories.breakfast.push(item.name);
      } else if (name.includes('cake') || name.includes('dessert') || name.includes('ice cream') ||
                 name.includes('chocolate') || name.includes('sweet') || name.includes('cookie')) {
        categories.desserts.push(item.name);
      } else if (name.includes('chicken') || name.includes('beef') || name.includes('fish') ||
                 name.includes('steak') || name.includes('grilled') || name.includes('fried')) {
        categories.plates.push(item.name);
      } else {
        categories.other.push(item.name);
      }
    });

    // Display categorized items
    Object.entries(categories).forEach(([category, items]) => {
      if (items.length > 0) {
        console.log(`\n🏷️ ${category.toUpperCase()} (${items.length} items):`);
        items.slice(0, 10).forEach(item => console.log(`   - ${item}`));
        if (items.length > 10) {
          console.log(`   ... and ${items.length - 10} more`);
        }
      }
    });

    await sequelize.close();
    
  } catch (error) {
    console.error("❌ Error:", error.message);
  }
}

identifyNullCategories();

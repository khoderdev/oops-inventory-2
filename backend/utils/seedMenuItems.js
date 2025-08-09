import { MenuItem, MenuItemIngredient } from "../models/menuItems.js";
import Material from "../models/materials.js";

/**
 * Seed initial menu items and their ingredients
 * @returns {Promise<Object>} Summary of seeding operation
 */
export const seedMenuItems = async () => {
  try {
    console.log("🌱 Starting menu items seeding...");
    
    // Get all materials first to check if we have enough for recipes
    const allMaterials = await Material.findAll({ order: [['id', 'ASC']] });
    
    if (allMaterials.length === 0) {
      console.log("⚠️ No materials found to create menu items");
      return { created: 0, existing: 0, ingredients: 0 };
    }

    // Define expected menu items count
    const expectedMenuItems = 9; // Number of menu items we want to create
    
    // Check if menu items already exist
    const existingMenuItems = await MenuItem.count();
    const existingIngredients = await MenuItemIngredient.count();
    
    if (existingMenuItems >= expectedMenuItems && existingIngredients > 0) {
      console.log(`✅ Menu items already complete (${existingMenuItems} items, ${existingIngredients} ingredients)`);
      return { created: 0, existing: existingMenuItems, ingredients: existingIngredients };
    }
    
    if (existingMenuItems > 0) {
      console.log(`🗑️ Found ${existingMenuItems} existing menu items and ${existingIngredients} ingredients but incomplete. Clearing to create complete data...`);
      // Clear existing data
      await MenuItemIngredient.destroy({ where: {} });
      await MenuItem.destroy({ where: {} });
      console.log("✅ Existing menu items and ingredients cleared");
    }

    console.log(`🍔 Creating menu items with ingredients from ${allMaterials.length} available materials...`);

    // Create menu items based on available materials
    const menuItemsData = [
      {
        name: "Hamburger",
        description: "Classic beef hamburger with fresh ingredients",
        category: "burgers",
        price: 4.00,
        isPOSItem: true,
        ingredients: [
          { materialName: "Bun", quantity: 1, unit: "piece", cost: 0.25 },
          { materialName: "Beef", quantity: 150, unit: "g", cost: 0.09 },
          { materialName: "Pickles", quantity: 3, unit: "g", cost: 0.0021 },
          { materialName: "Tomato", quantity: 3, unit: "g", cost: 0.0024 },
          { materialName: "Onion", quantity: 3, unit: "g", cost: 0.0033 }
        ]
      },
      {
        name: "Chicken Burger",
        description: "Grilled chicken burger with fresh vegetables",
        category: "burgers",
        price: 4.50,
        isPOSItem: true,
        ingredients: [
          { materialName: "Bun", quantity: 1, unit: "piece", cost: 0.25 },
          { materialName: "Chicken", quantity: 120, unit: "g", cost: 0.08 },
          { materialName: "Tomato", quantity: 5, unit: "g", cost: 0.004 },
          { materialName: "Onion", quantity: 2, unit: "g", cost: 0.0022 }
        ]
      },
      {
        name: "Steak Plate",
        description: "Grilled steak with fries and vegetables",
        category: "plates",
        price: 8.00,
        isPOSItem: true,
        ingredients: [
          { materialName: "Steak", quantity: 200, unit: "g", cost: 0.15 },
          { materialName: "Fries", quantity: 150, unit: "g", cost: 0.06 },
          { materialName: "Tomato", quantity: 10, unit: "g", cost: 0.008 },
          { materialName: "Onion", quantity: 5, unit: "g", cost: 0.0055 }
        ]
      },
      {
        name: "7up",
        description: "Refreshing lemon-lime soda",
        category: "beverages",
        price: 1.50,
        isPOSItem: true,
        ingredients: [
          { materialName: "7up", quantity: 1, unit: "bottle", cost: 0.80 }
        ]
      },
      {
        name: "Pepsi",
        description: "Classic cola drink",
        category: "beverages",
        price: 1.50,
        isPOSItem: true,
        ingredients: [
          { materialName: "Pepsi", quantity: 1, unit: "bottle", cost: 0.80 }
        ]
      },
      {
        name: "Mirinda",
        description: "Orange flavored soda",
        category: "beverages",
        price: 1.50,
        isPOSItem: true,
        ingredients: [
          { materialName: "Mirinda", quantity: 1, unit: "bottle", cost: 0.80 }
        ]
      },
      {
        name: "Almaza Beer",
        description: "Premium Lebanese beer",
        category: "beverages",
        price: 3.00,
        isPOSItem: true,
        ingredients: [
          { materialName: "Almaza Beer", quantity: 1, unit: "bottle", cost: 2.00 }
        ]
      },
      {
        name: "Mixed Nuts",
        description: "Assorted roasted nuts",
        category: "appetizers",
        price: 2.50,
        isPOSItem: true,
        ingredients: [
          { materialName: "Nuts", quantity: 50, unit: "g", cost: 0.10 }
        ]
      },
      {
        name: "Chocolate Dessert",
        description: "Rich chocolate dessert",
        category: "desserts",
        price: 3.50,
        isPOSItem: true,
        ingredients: [
          { materialName: "Chocolate", quantity: 80, unit: "g", cost: 0.15 },
          { materialName: "Ice Cream", quantity: 50, unit: "g", cost: 0.08 }
        ]
      }
    ];

    // Create a map of material names to IDs for quick lookup
    const materialMap = {};
    allMaterials.forEach(material => {
      materialMap[material.name] = material.id;
    });

    let totalCreatedItems = 0;
    let totalCreatedIngredients = 0;

    // Create menu items and their ingredients
    for (const itemData of menuItemsData) {
      // Check if all required materials exist
      const missingMaterials = itemData.ingredients.filter(ing => !materialMap[ing.materialName]);
      
      if (missingMaterials.length > 0) {
        console.log(`⚠️ Skipping "${itemData.name}" - missing materials: ${missingMaterials.map(m => m.materialName).join(", ")}`);
        continue;
      }

      // Create menu item
      const menuItem = await MenuItem.create({
        name: itemData.name,
        description: itemData.description,
        category: itemData.category,
        price: itemData.price,
        isPOSItem: itemData.isPOSItem
      });

      totalCreatedItems++;

      // Create ingredients for this menu item
      for (const ingredient of itemData.ingredients) {
        await MenuItemIngredient.create({
          menuItemId: menuItem.id,
          materialId: materialMap[ingredient.materialName],
          quantity: ingredient.quantity,
          unit: ingredient.unit,
          cost: ingredient.cost
        });
        totalCreatedIngredients++;
      }

      console.log(`✅ Created "${itemData.name}" with ${itemData.ingredients.length} ingredients`);
    }

    console.log(`🍽️ Menu items seeding completed: ${totalCreatedItems} items, ${totalCreatedIngredients} ingredients`);
    
    return { 
      created: totalCreatedItems, 
      existing: 0,
      ingredients: totalCreatedIngredients
    };
    
  } catch (error) {
    console.error("❌ Error seeding menu items:", error);
    throw error;
  }
};

export default seedMenuItems;

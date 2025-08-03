import Material from "../models/materials.js";
import { MenuItem, MenuItemIngredient } from "../models/menuItems.js";

/**
 * Seed menu items with ingredients based on the comprehensive menu
 */
export async function seedMenuItems() {
  console.log("🍽️ Seeding menu items...");

  // Get all materials for ingredient mapping
  const materials = await Material.findAll();
  const materialMap = {};
  materials.forEach(material => {
    materialMap[material.name] = material;
  });

  const menuItems = [
    // Appetizers
    {
      name: "Grilled Halloumi",
      description: "Grilled Halloumi, Iceberg, cherry tomatoes, pesto sauce",
      category: "appetizers",
      price: 7.00,
      isPOSItem: true,
      ingredients: [
        { materialName: "Halloumi", quantity: 150, unit: "g", cost: 1.80 },
        { materialName: "Iceberg Lettuce", quantity: 50, unit: "g", cost: 0.13 },
        { materialName: "Cherry Tomatoes", quantity: 80, unit: "g", cost: 0.28 },
        { materialName: "Pesto Sauce", quantity: 30, unit: "ml", cost: 0.36 }
      ]
    },
    {
      name: "Juicy Balls",
      description: "Cheese balls, special sauce",
      category: "appetizers",
      price: 8.00,
      isPOSItem: true,
      ingredients: [
        { materialName: "Mozzarella Cheese", quantity: 120, unit: "g", cost: 0.96 },
        { materialName: "Special Sauce", quantity: 40, unit: "ml", cost: 0.40 }
      ]
    },
    {
      name: "Mozzarella Sticks",
      description: "6 Mozzarella sticks",
      category: "appetizers",
      price: 6.00,
      isPOSItem: true,
      ingredients: [
        { materialName: "Mozzarella Cheese", quantity: 180, unit: "g", cost: 1.44 }
      ]
    },
    {
      name: "Chicken Tenders",
      description: "5 Crispy chicken, Cocktail Sauce",
      category: "appetizers",
      price: 8.00,
      isPOSItem: true,
      ingredients: [
        { materialName: "Crispy Chicken", quantity: 5, unit: "piece", cost: 2.50 },
        { materialName: "Cocktail Sauce", quantity: 40, unit: "ml", cost: 0.32 }
      ]
    },
    {
      name: "Chicken Wings",
      description: "BBQ, Buffalo, Honey mustard",
      category: "appetizers",
      price: 10.00,
      isPOSItem: true,
      ingredients: [
        { materialName: "Chicken Wings", quantity: 8, unit: "piece", cost: 3.20 },
        { materialName: "BBQ Sauce", quantity: 30, unit: "ml", cost: 0.18 },
        { materialName: "Buffalo Sauce", quantity: 30, unit: "ml", cost: 0.26 },
        { materialName: "Honey Mustard Sauce", quantity: 30, unit: "ml", cost: 0.23 }
      ]
    },
    {
      name: "French Fries",
      description: "French Fries, Ketchup",
      category: "appetizers",
      price: 3.00,
      isPOSItem: true,
      ingredients: [
        { materialName: "French Fries", quantity: 200, unit: "g", cost: 0.40 },
        { materialName: "Ketchup", quantity: 30, unit: "ml", cost: 0.12 }
      ]
    },

    // Salads
    {
      name: "Rocca Salad",
      description: "Rocca, fresh mushroom, cherry tomatoes, parmesan, walnuts, balsamic sauce",
      category: "salads",
      price: 11.00,
      isPOSItem: true,
      ingredients: [
        { materialName: "Rocca", quantity: 100, unit: "g", cost: 0.40 },
        { materialName: "Mushroom", quantity: 80, unit: "g", cost: 0.40 },
        { materialName: "Cherry Tomatoes", quantity: 100, unit: "g", cost: 0.35 },
        { materialName: "Parmesan", quantity: 40, unit: "g", cost: 0.72 },
        { materialName: "Walnuts", quantity: 30, unit: "g", cost: 0.45 },
        { materialName: "Balsamic Sauce", quantity: 40, unit: "ml", cost: 0.32 }
      ]
    },
    {
      name: "Chicken Caesar Salad",
      description: "Iceberg, grilled marinated chicken, cherry tomatoes, croutons, parmesan cheese, Caesar sauce",
      category: "salads",
      price: 14.00,
      isPOSItem: true,
      ingredients: [
        { materialName: "Iceberg Lettuce", quantity: 150, unit: "g", cost: 0.38 },
        { materialName: "Chicken Breast", quantity: 150, unit: "g", cost: 1.28 },
        { materialName: "Cherry Tomatoes", quantity: 80, unit: "g", cost: 0.28 },
        { materialName: "Croutons", quantity: 40, unit: "g", cost: 0.32 },
        { materialName: "Parmesan", quantity: 30, unit: "g", cost: 0.54 },
        { materialName: "Caesar Sauce", quantity: 50, unit: "ml", cost: 0.40 }
      ]
    },

    // Burgers
    {
      name: "Classic Hamburger",
      description: "Grilled beef patty, coleslaw",
      category: "burgers",
      price: 9.00,
      isPOSItem: true,
      ingredients: [
        { materialName: "Burger Bun", quantity: 1, unit: "piece", cost: 0.50 },
        { materialName: "Beef Patty", quantity: 150, unit: "g", cost: 1.80 },
        { materialName: "Coleslaw", quantity: 80, unit: "g", cost: 0.28 }
      ]
    },
    {
      name: "Chicken Burger",
      description: "Breaded chicken, mozzarella cheese, iceberg, garlic mayo sauce",
      category: "burgers",
      price: 7.50,
      isPOSItem: true,
      ingredients: [
        { materialName: "Burger Bun", quantity: 1, unit: "piece", cost: 0.50 },
        { materialName: "Crispy Chicken", quantity: 1, unit: "piece", cost: 1.50 },
        { materialName: "Mozzarella Cheese", quantity: 50, unit: "g", cost: 0.40 },
        { materialName: "Iceberg Lettuce", quantity: 40, unit: "g", cost: 0.10 },
        { materialName: "Mayo Garlic Sauce", quantity: 30, unit: "ml", cost: 0.24 }
      ]
    },
    {
      name: "Oops Beef Burger",
      description: "Double beef patty, caramelized onion, bacon, double cheddar cheese, oops sauce",
      category: "burgers",
      price: 13.00,
      isPOSItem: true,
      ingredients: [
        { materialName: "Burger Bun", quantity: 1, unit: "piece", cost: 0.50 },
        { materialName: "Beef Patty", quantity: 300, unit: "g", cost: 3.60 },
        { materialName: "Onion", quantity: 60, unit: "g", cost: 0.09 },
        { materialName: "Bacon", quantity: 40, unit: "g", cost: 0.56 },
        { materialName: "Cheddar Cheese", quantity: 100, unit: "g", cost: 0.90 },
        { materialName: "Oops Sauce", quantity: 40, unit: "ml", cost: 0.48 }
      ]
    },

    // Sandwiches
    {
      name: "Taouk",
      description: "Arabic bread, taouk, coleslaw, fries, pickles, mayo garlic sauce",
      category: "sandwiches",
      price: 7.00,
      isPOSItem: true,
      ingredients: [
        { materialName: "Arabic Bread", quantity: 1, unit: "piece", cost: 0.25 },
        { materialName: "Taouk", quantity: 150, unit: "g", cost: 1.35 },
        { materialName: "Coleslaw", quantity: 60, unit: "g", cost: 0.21 },
        { materialName: "French Fries", quantity: 100, unit: "g", cost: 0.20 },
        { materialName: "Pickles", quantity: 30, unit: "g", cost: 0.14 },
        { materialName: "Mayo Garlic Sauce", quantity: 30, unit: "ml", cost: 0.24 }
      ]
    },
    {
      name: "Steak",
      description: "Ciabatta bread, grilled beef filet, onion, bell pepper, mozzarella cheese, special sauce",
      category: "sandwiches",
      price: 15.00,
      isPOSItem: true,
      ingredients: [
        { materialName: "Ciabatta Bread", quantity: 1, unit: "piece", cost: 1.00 },
        { materialName: "Beef Filet", quantity: 180, unit: "g", cost: 4.50 },
        { materialName: "Onion", quantity: 50, unit: "g", cost: 0.08 },
        { materialName: "Bell Pepper", quantity: 50, unit: "g", cost: 0.15 },
        { materialName: "Mozzarella Cheese", quantity: 60, unit: "g", cost: 0.48 },
        { materialName: "Special Sauce", quantity: 40, unit: "ml", cost: 0.40 }
      ]
    },

    // Pasta
    {
      name: "Penne Arrabiata",
      description: "Penne, red sauce, parmesan",
      category: "plates",
      price: 10.00,
      isPOSItem: true,
      ingredients: [
        { materialName: "Penne Pasta", quantity: 120, unit: "g", cost: 0.36 },
        { materialName: "Red Sauce", quantity: 100, unit: "ml", cost: 0.50 },
        { materialName: "Parmesan", quantity: 30, unit: "g", cost: 0.54 }
      ]
    },
    {
      name: "Fettuccine Alfredo",
      description: "Tagliatelle, grilled chicken, mushroom, parmesan",
      category: "plates",
      price: 14.00,
      isPOSItem: true,
      ingredients: [
        { materialName: "Tagliatelle Pasta", quantity: 120, unit: "g", cost: 0.48 },
        { materialName: "Chicken Breast", quantity: 150, unit: "g", cost: 1.28 },
        { materialName: "Mushroom", quantity: 80, unit: "g", cost: 0.40 },
        { materialName: "Alfredo Sauce", quantity: 120, unit: "ml", cost: 0.84 },
        { materialName: "Parmesan", quantity: 30, unit: "g", cost: 0.54 }
      ]
    },

    // Main Course
    {
      name: "Taouk Platter",
      description: "Taouk, fries, coleslaw, pickles, garlic mayo sauce",
      category: "plates",
      price: 12.00,
      isPOSItem: true,
      ingredients: [
        { materialName: "Taouk", quantity: 200, unit: "g", cost: 1.80 },
        { materialName: "French Fries", quantity: 150, unit: "g", cost: 0.30 },
        { materialName: "Coleslaw", quantity: 80, unit: "g", cost: 0.28 },
        { materialName: "Pickles", quantity: 40, unit: "g", cost: 0.18 },
        { materialName: "Mayo Garlic Sauce", quantity: 50, unit: "ml", cost: 0.40 }
      ]
    },
    {
      name: "Grilled Salmon",
      description: "Grilled salmon, mashed potatoes, grilled vegetables",
      category: "plates",
      price: 24.00,
      isPOSItem: true,
      ingredients: [
        { materialName: "Salmon", quantity: 200, unit: "g", cost: 4.40 },
        { materialName: "Mashed Potatoes", quantity: 150, unit: "g", cost: 0.42 },
        { materialName: "Grilled Vegetables", quantity: 120, unit: "g", cost: 0.66 }
      ]
    },

    // Pizza
    {
      name: "Pizza Margherita",
      description: "Sourdough, San Marzano Tomatoes, low moisture Mozzarella",
      category: "plates",
      price: 10.00,
      isPOSItem: true,
      ingredients: [
        { materialName: "Sourdough", quantity: 1, unit: "piece", cost: 1.33 },
        { materialName: "Marinara Sauce", quantity: 80, unit: "ml", cost: 0.40 },
        { materialName: "Mozzarella Cheese", quantity: 120, unit: "g", cost: 0.96 }
      ]
    },
    {
      name: "Pizza Pepperoni",
      description: "Sourdough, Homemade Marinara Sauce, Low Moisture Italian Mozzarella, Pepperoni",
      category: "plates",
      price: 13.00,
      isPOSItem: true,
      ingredients: [
        { materialName: "Sourdough", quantity: 1, unit: "piece", cost: 1.33 },
        { materialName: "Marinara Sauce", quantity: 80, unit: "ml", cost: 0.40 },
        { materialName: "Mozzarella Cheese", quantity: 120, unit: "g", cost: 0.96 },
        { materialName: "Pepperoni", quantity: 60, unit: "g", cost: 0.96 }
      ]
    },

    // Sushi - Sample items
    {
      name: "Edamame",
      description: "Steamed soy beans, rock salt",
      category: "appetizers",
      price: 4.00,
      isPOSItem: true,
      ingredients: [
        { materialName: "Edamame", quantity: 150, unit: "g", cost: 1.28 }
      ]
    },
    {
      name: "Salmon Sashimi",
      description: "3 PC",
      category: "appetizers",
      price: 6.50,
      isPOSItem: true,
      ingredients: [
        { materialName: "Salmon", quantity: 60, unit: "g", cost: 1.32 }
      ]
    },
    {
      name: "Crispy California",
      description: "Crispy wrap, Premium crab sticks, cucumber, avocado",
      category: "appetizers",
      price: 4.00,
      isPOSItem: true,
      ingredients: [
        { materialName: "Sushi Rice", quantity: 80, unit: "g", cost: 0.32 },
        { materialName: "Nori Sheets", quantity: 1, unit: "piece", cost: 0.24 },
        { materialName: "Crab Sticks", quantity: 40, unit: "g", cost: 0.60 },
        { materialName: "Cucumber", quantity: 30, unit: "g", cost: 0.06 },
        { materialName: "Avocado", quantity: 40, unit: "g", cost: 0.32 }
      ]
    },

    // Breakfast
    {
      name: "Labneh",
      description: "Traditional Lebanese labneh",
      category: "appetizers",
      price: 3.50,
      isPOSItem: true,
      ingredients: [
        { materialName: "Labneh", quantity: 120, unit: "g", cost: 0.72 }
      ]
    },
    {
      name: "Eggs",
      description: "Fresh eggs",
      category: "appetizers",
      price: 3.50,
      isPOSItem: true,
      ingredients: [
        { materialName: "Eggs", quantity: 2, unit: "piece", cost: 0.58 }
      ]
    },
    {
      name: "Sajj Zaatar",
      description: "Sajj bread with zaatar",
      category: "appetizers",
      price: 2.00,
      isPOSItem: true,
      ingredients: [
        { materialName: "Sajj Bread", quantity: 1, unit: "piece", cost: 0.30 },
        { materialName: "Zaatar", quantity: 20, unit: "g", cost: 0.24 }
      ]
    },
    {
      name: "Sajj Labneh",
      description: "Sajj bread with labneh",
      category: "appetizers",
      price: 2.50,
      isPOSItem: true,
      ingredients: [
        { materialName: "Sajj Bread", quantity: 1, unit: "piece", cost: 0.30 },
        { materialName: "Labneh", quantity: 60, unit: "g", cost: 0.36 }
      ]
    }
  ];

  let createdCount = 0;
  let skippedCount = 0;

  for (const itemData of menuItems) {
    try {
      // Check if menu item already exists
      const existingItem = await MenuItem.findOne({
        where: { name: itemData.name }
      });

      if (!existingItem) {
        // Create menu item
        const menuItem = await MenuItem.create({
          name: itemData.name,
          description: itemData.description,
          category: itemData.category,
          price: itemData.price,
          isPOSItem: itemData.isPOSItem
        });

        // Create ingredients
        for (const ingredientData of itemData.ingredients) {
          const material = materialMap[ingredientData.materialName];
          if (material) {
            await MenuItemIngredient.create({
              menuItemId: menuItem.id,
              materialId: material.id,
              quantity: ingredientData.quantity,
              unit: ingredientData.unit,
              cost: ingredientData.cost
            });
          } else {
            console.log(`⚠️  Material not found for ingredient: ${ingredientData.materialName}`);
          }
        }

        console.log(`✅ Created menu item: ${itemData.name} with ${itemData.ingredients.length} ingredients`);
        createdCount++;
      } else {
        skippedCount++;
      }
    } catch (error) {
      console.error(`❌ Error creating menu item ${itemData.name}:`, error.message);
      skippedCount++;
    }
  }

  return { created: createdCount, skipped: skippedCount };
}

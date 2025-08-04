import Material from "../models/materials.js";

/**
 * Seed materials table with comprehensive ingredients
 */
export async function seedMaterials() {
  console.log("📦 Seeding materials...");

  const materials = [
    // Proteins
    { name: "Beef Patty", baseUnit: "g", unitType: "mass", inputUnit: "kg", category: "meat" },
    { name: "Chicken Breast", baseUnit: "g", unitType: "mass", inputUnit: "kg", category: "meat" },
    { name: "Chicken Thigh", baseUnit: "g", unitType: "mass", inputUnit: "kg", category: "meat" },
    { name: "Crispy Chicken", baseUnit: "piece", unitType: "package", inputUnit: "pack", packageQuantity: 10, category: "meat" },
    { name: "Chicken Wings", baseUnit: "piece", unitType: "package", inputUnit: "pack", packageQuantity: 12, category: "meat" },
    { name: "Taouk", baseUnit: "g", unitType: "mass", inputUnit: "kg", category: "meat" },
    { name: "Beef Filet", baseUnit: "g", unitType: "mass", inputUnit: "kg", category: "meat" },
    { name: "Salmon", baseUnit: "g", unitType: "mass", inputUnit: "kg", category: "seafood" },
    { name: "Shrimp", baseUnit: "g", unitType: "mass", inputUnit: "kg", category: "seafood" },
    { name: "Tuna", baseUnit: "g", unitType: "mass", inputUnit: "kg", category: "seafood" },
    { name: "Crab Sticks", baseUnit: "g", unitType: "mass", inputUnit: "kg", category: "seafood" },
    { name: "Ham", baseUnit: "g", unitType: "mass", inputUnit: "kg", category: "meat" },
    { name: "Bacon", baseUnit: "g", unitType: "mass", inputUnit: "kg", category: "meat" },
    { name: "Pepperoni", baseUnit: "g", unitType: "mass", inputUnit: "kg", category: "meat" },
    { name: "Salami", baseUnit: "g", unitType: "mass", inputUnit: "kg", category: "meat" },

    // Dairy & Cheese
    { name: "Mozzarella Cheese", baseUnit: "g", unitType: "mass", inputUnit: "kg", category: "dairy" },
    { name: "Cheddar Cheese", baseUnit: "g", unitType: "mass", inputUnit: "kg", category: "dairy" },
    { name: "Halloumi", baseUnit: "g", unitType: "mass", inputUnit: "kg", category: "dairy" },
    { name: "Parmesan", baseUnit: "g", unitType: "mass", inputUnit: "kg", category: "dairy" },
    { name: "Feta Cheese", baseUnit: "g", unitType: "mass", inputUnit: "kg", category: "dairy" },
    { name: "Cream Cheese", baseUnit: "g", unitType: "mass", inputUnit: "kg", category: "dairy" },
    { name: "Emental Cheese", baseUnit: "g", unitType: "mass", inputUnit: "kg", category: "dairy" },
    { name: "Labneh", baseUnit: "g", unitType: "mass", inputUnit: "kg", category: "dairy" },

    // Vegetables
    { name: "Iceberg Lettuce", baseUnit: "g", unitType: "mass", inputUnit: "kg", category: "vegetables" },
    { name: "Rocca", baseUnit: "g", unitType: "mass", inputUnit: "kg", category: "vegetables" },
    { name: "Kale", baseUnit: "g", unitType: "mass", inputUnit: "kg", category: "vegetables" },
    { name: "Cherry Tomatoes", baseUnit: "g", unitType: "mass", inputUnit: "kg", category: "vegetables" },
    { name: "Onion", baseUnit: "g", unitType: "mass", inputUnit: "kg", category: "vegetables" },
    { name: "Bell Pepper", baseUnit: "g", unitType: "mass", inputUnit: "kg", category: "vegetables" },
    { name: "Mushroom", baseUnit: "g", unitType: "mass", inputUnit: "kg", category: "vegetables" },
    { name: "Fresh Mushroom", baseUnit: "g", unitType: "mass", inputUnit: "kg", category: "vegetables" },
    { name: "Avocado", baseUnit: "g", unitType: "mass", inputUnit: "kg", category: "vegetables" },
    { name: "Cucumber", baseUnit: "g", unitType: "mass", inputUnit: "kg", category: "vegetables" },
    { name: "Carrot", baseUnit: "g", unitType: "mass", inputUnit: "kg", category: "vegetables" },
    { name: "Red Cabbage", baseUnit: "g", unitType: "mass", inputUnit: "kg", category: "vegetables" },
    { name: "Corn", baseUnit: "g", unitType: "mass", inputUnit: "kg", category: "vegetables" },
    { name: "Pickles", baseUnit: "g", unitType: "mass", inputUnit: "kg", category: "vegetables" },
    { name: "Jalapeno", baseUnit: "g", unitType: "mass", inputUnit: "kg", category: "vegetables" },
    { name: "Black Olives", baseUnit: "g", unitType: "mass", inputUnit: "kg", category: "vegetables" },
    { name: "Mango", baseUnit: "g", unitType: "mass", inputUnit: "kg", category: "vegetables" },
    { name: "Strawberry", baseUnit: "g", unitType: "mass", inputUnit: "kg", category: "vegetables" },
    { name: "Kiwi", baseUnit: "g", unitType: "mass", inputUnit: "kg", category: "vegetables" },
    { name: "Edamame", baseUnit: "g", unitType: "mass", inputUnit: "kg", category: "vegetables" },
    { name: "French Fries", baseUnit: "g", unitType: "mass", inputUnit: "kg", category: "vegetables" },
    { name: "Wedges", baseUnit: "g", unitType: "mass", inputUnit: "kg", category: "vegetables" },
    { name: "Curly Fries", baseUnit: "g", unitType: "mass", inputUnit: "kg", category: "vegetables" },
    { name: "Mashed Potatoes", baseUnit: "g", unitType: "mass", inputUnit: "kg", category: "vegetables" },
    { name: "Coleslaw", baseUnit: "g", unitType: "mass", inputUnit: "kg", category: "vegetables" },
    { name: "Mixed Greens", baseUnit: "g", unitType: "mass", inputUnit: "kg", category: "vegetables" },
    { name: "Lolo Rosso Lettuce", baseUnit: "g", unitType: "mass", inputUnit: "kg", category: "vegetables" },
    { name: "Mixed Vegetables", baseUnit: "g", unitType: "mass", inputUnit: "kg", category: "vegetables" },
    { name: "Grilled Vegetables", baseUnit: "g", unitType: "mass", inputUnit: "kg", category: "vegetables" },
    { name: "Green Onions", baseUnit: "g", unitType: "mass", inputUnit: "kg", category: "vegetables" },
    { name: "Capers", baseUnit: "g", unitType: "mass", inputUnit: "kg", category: "vegetables" },
    { name: "Sahen Khodra", baseUnit: "g", unitType: "mass", inputUnit: "kg", category: "vegetables" },

    // Grains & Bread
    { name: "Burger Bun", baseUnit: "piece", unitType: "package", inputUnit: "pack", packageQuantity: 8, category: "grains" },
    { name: "Crunchy Bun", baseUnit: "piece", unitType: "package", inputUnit: "pack", packageQuantity: 8, category: "grains" },
    { name: "Arabic Bread", baseUnit: "piece", unitType: "package", inputUnit: "pack", packageQuantity: 10, category: "grains" },
    { name: "Ciabatta Bread", baseUnit: "piece", unitType: "package", inputUnit: "pack", packageQuantity: 6, category: "grains" },
    { name: "Brown Bread", baseUnit: "piece", unitType: "package", inputUnit: "pack", packageQuantity: 8, category: "grains" },
    { name: "Tortilla Bread", baseUnit: "piece", unitType: "package", inputUnit: "pack", packageQuantity: 10, category: "grains" },
    { name: "French Toast", baseUnit: "piece", unitType: "package", inputUnit: "pack", packageQuantity: 8, category: "grains" },
    { name: "Sourdough", baseUnit: "piece", unitType: "package", inputUnit: "pack", packageQuantity: 6, category: "grains" },
    { name: "Sajj Bread", baseUnit: "piece", unitType: "package", inputUnit: "pack", packageQuantity: 10, category: "grains" },

    // Pasta & Rice
    { name: "Penne Pasta", baseUnit: "g", unitType: "mass", inputUnit: "kg", category: "grains" },
    { name: "Fettuccine Pasta", baseUnit: "g", unitType: "mass", inputUnit: "kg", category: "grains" },
    { name: "Tagliatelle Pasta", baseUnit: "g", unitType: "mass", inputUnit: "kg", category: "grains" },
    { name: "Linguine Pasta", baseUnit: "g", unitType: "mass", inputUnit: "kg", category: "grains" },
    { name: "Spaghetti Pasta", baseUnit: "g", unitType: "mass", inputUnit: "kg", category: "grains" },
    { name: "Fresh Noodles", baseUnit: "g", unitType: "mass", inputUnit: "kg", category: "grains" },
    { name: "White Rice", baseUnit: "g", unitType: "mass", inputUnit: "kg", category: "grains" },
    { name: "Sushi Rice", baseUnit: "g", unitType: "mass", inputUnit: "kg", category: "grains" },
    { name: "Quinoa", baseUnit: "g", unitType: "mass", inputUnit: "kg", category: "grains" },
    { name: "Mac n Cheese", baseUnit: "g", unitType: "mass", inputUnit: "kg", category: "grains" },
    { name: "Walnuts", baseUnit: "g", unitType: "mass", inputUnit: "kg", category: "grains" },
    { name: "Cashew", baseUnit: "g", unitType: "mass", inputUnit: "kg", category: "grains" },
    { name: "Croutons", baseUnit: "g", unitType: "mass", inputUnit: "kg", category: "grains" },
    { name: "Nachos", baseUnit: "g", unitType: "mass", inputUnit: "kg", category: "grains" },
    { name: "Tortilla Chips", baseUnit: "g", unitType: "mass", inputUnit: "kg", category: "grains" },
    { name: "Crispy Flakes", baseUnit: "g", unitType: "mass", inputUnit: "kg", category: "grains" },
    { name: "Sesame Seeds", baseUnit: "g", unitType: "mass", inputUnit: "kg", category: "grains" },

    // Sauces & Condiments  
    { name: "Mayo Garlic Sauce", baseUnit: "ml", unitType: "volume", inputUnit: "l", category: "spices" },
    { name: "BBQ Sauce", baseUnit: "ml", unitType: "volume", inputUnit: "l", category: "spices" },
    { name: "Buffalo Sauce", baseUnit: "ml", unitType: "volume", inputUnit: "l", category: "spices" },
    { name: "Honey Mustard Sauce", baseUnit: "ml", unitType: "volume", inputUnit: "l", category: "spices" },
    { name: "Cocktail Sauce", baseUnit: "ml", unitType: "volume", inputUnit: "l", category: "spices" },
    { name: "Pesto Sauce", baseUnit: "ml", unitType: "volume", inputUnit: "l", category: "spices" },
    { name: "Caesar Sauce", baseUnit: "ml", unitType: "volume", inputUnit: "l", category: "spices" },
    { name: "Balsamic Sauce", baseUnit: "ml", unitType: "volume", inputUnit: "l", category: "spices" },
    { name: "Lemon Mayo Sauce", baseUnit: "ml", unitType: "volume", inputUnit: "l", category: "spices" },
    { name: "Lemon Mustard Sauce", baseUnit: "ml", unitType: "volume", inputUnit: "l", category: "spices" },
    { name: "Special Sauce", baseUnit: "ml", unitType: "volume", inputUnit: "l", category: "spices" },
    { name: "Oops Sauce", baseUnit: "ml", unitType: "volume", inputUnit: "l", category: "spices" },
    { name: "Marinara Sauce", baseUnit: "ml", unitType: "volume", inputUnit: "l", category: "spices" },
    { name: "Alfredo Sauce", baseUnit: "ml", unitType: "volume", inputUnit: "l", category: "spices" },
    { name: "Vodka Sauce", baseUnit: "ml", unitType: "volume", inputUnit: "l", category: "spices" },
    { name: "Red Sauce", baseUnit: "ml", unitType: "volume", inputUnit: "l", category: "spices" },
    { name: "Rose Sauce", baseUnit: "ml", unitType: "volume", inputUnit: "l", category: "spices" },
    { name: "Creamy Pesto Sauce", baseUnit: "ml", unitType: "volume", inputUnit: "l", category: "spices" },
    { name: "Mushroom Sauce", baseUnit: "ml", unitType: "volume", inputUnit: "l", category: "spices" },
    { name: "Indian Sauce", baseUnit: "ml", unitType: "volume", inputUnit: "l", category: "spices" },
    { name: "Cheese Sauce", baseUnit: "ml", unitType: "volume", inputUnit: "l", category: "spices" },
    { name: "Cheddar Sauce", baseUnit: "ml", unitType: "volume", inputUnit: "l", category: "spices" },
    { name: "Creamy Sauce", baseUnit: "ml", unitType: "volume", inputUnit: "l", category: "spices" },
    { name: "Oyster Sauce", baseUnit: "ml", unitType: "volume", inputUnit: "l", category: "spices" },
    { name: "Teriyaki Sauce", baseUnit: "ml", unitType: "volume", inputUnit: "l", category: "spices" },
    { name: "Dynamite Sauce", baseUnit: "ml", unitType: "volume", inputUnit: "l", category: "spices" },
    { name: "Kimchi Mayo", baseUnit: "ml", unitType: "volume", inputUnit: "l", category: "spices" },
    { name: "Spicy Mayo", baseUnit: "ml", unitType: "volume", inputUnit: "l", category: "spices" },
    { name: "Avocado Sauce", baseUnit: "ml", unitType: "volume", inputUnit: "l", category: "spices" },
    { name: "Olive Oil Sauce", baseUnit: "ml", unitType: "volume", inputUnit: "l", category: "spices" },
    { name: "Ketchup", baseUnit: "ml", unitType: "volume", inputUnit: "l", category: "spices" },
    { name: "Mayo Mustard Sauce", baseUnit: "ml", unitType: "volume", inputUnit: "l", category: "spices" },
    { name: "Blue Cheese Sauce", baseUnit: "ml", unitType: "volume", inputUnit: "l", category: "spices" },
    { name: "Mexican Salsa", baseUnit: "ml", unitType: "volume", inputUnit: "l", category: "spices" },
    { name: "Guacamole", baseUnit: "ml", unitType: "volume", inputUnit: "l", category: "spices" },
    { name: "Hot Honey", baseUnit: "ml", unitType: "volume", inputUnit: "l", category: "spices" },
    { name: "Zaatar", baseUnit: "g", unitType: "mass", inputUnit: "kg", category: "spices" },
    { name: "Wasabi", baseUnit: "g", unitType: "mass", inputUnit: "kg", category: "spices" },
    { name: "Soy Sauce", baseUnit: "ml", unitType: "volume", inputUnit: "l", category: "spices" },
    { name: "Sriracha", baseUnit: "ml", unitType: "volume", inputUnit: "l", category: "spices" },
    { name: "Togarashi", baseUnit: "g", unitType: "mass", inputUnit: "kg", category: "spices" },

    // Sushi Specific
    { name: "Nori Sheets", baseUnit: "piece", unitType: "package", inputUnit: "pack", packageQuantity: 50, category: "vegetables" },
    { name: "Tobiko", baseUnit: "g", unitType: "mass", inputUnit: "kg", category: "other" },

    // Other Items
    { name: "Dried Fruits", baseUnit: "g", unitType: "mass", inputUnit: "kg", category: "vegetables" },
    { name: "Dried Figs", baseUnit: "g", unitType: "mass", inputUnit: "kg", category: "vegetables" },
    { name: "Cranberry", baseUnit: "g", unitType: "mass", inputUnit: "kg", category: "vegetables" },
    { name: "Eggs", baseUnit: "piece", unitType: "package", inputUnit: "pack", packageQuantity: 12, category: "dairy" },
    { name: "Lahmeh", baseUnit: "g", unitType: "mass", inputUnit: "kg", category: "meat" },
    
    // Missing materials from menu items
    { name: "Tomatoes", baseUnit: "g", unitType: "mass", inputUnit: "kg", category: "vegetables" },
    { name: "Light Mayo", baseUnit: "ml", unitType: "volume", inputUnit: "l", category: "spices" },
    { name: "Calamari", baseUnit: "g", unitType: "mass", inputUnit: "kg", category: "seafood" },
    { name: "Fish Fingers", baseUnit: "piece", unitType: "package", inputUnit: "pack", packageQuantity: 20, category: "seafood" }
  ];

  let createdCount = 0;
  let existingCount = 0;

  for (const materialData of materials) {
    try {
      const existingMaterial = await Material.findOne({
        where: { name: materialData.name }
      });

      if (!existingMaterial) {
        await Material.create(materialData);
        console.log(`✅ Created material: ${materialData.name}`);
        createdCount++;
      } else {
        existingCount++;
      }
    } catch (error) {
      console.error(`❌ Error creating material ${materialData.name}:`, error.message);
    }
  }

  return { created: createdCount, existing: existingCount };
}

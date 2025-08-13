import Material from "../models/materials.js";
import Category from "../models/Category.js";

/**
 * Seed materials table with comprehensive ingredients
 */
export async function seedMaterials() {
  console.log("📦 Seeding materials...");

  // First, get all categories to map category values to IDs
  const categories = await Category.findAll({ where: { type: 'materials' } });
  const categoryMap = {};
  categories.forEach(cat => {
    categoryMap[cat.value] = cat.id;
  });

  console.log("📋 Available categories:", categoryMap);

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
    { name: "Guacamole", baseUnit: "g", unitType: "mass", inputUnit: "kg", category: "spices" },
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
    { name: "Fish Fingers", baseUnit: "piece", unitType: "package", inputUnit: "pack", packageQuantity: 20, category: "seafood" },

    // Alcoholic Beverages - Beers
    { name: "Mexican Red Bull", baseUnit: "bottle", unitType: "package", inputUnit: "box", packageQuantity: 24, category: "alcohol" },
    { name: "Almaza Beer", baseUnit: "bottle", unitType: "package", inputUnit: "box", packageQuantity: 24, category: "alcohol" },
    { name: "Almaza Light Beer", baseUnit: "bottle", unitType: "package", inputUnit: "box", packageQuantity: 24, category: "alcohol" },
    { name: "Mexican Beer", baseUnit: "bottle", unitType: "package", inputUnit: "box", packageQuantity: 24, category: "alcohol" },
    { name: "Almaza Rose Beer", baseUnit: "bottle", unitType: "package", inputUnit: "box", packageQuantity: 24, category: "alcohol" },
    { name: "Mexican Energy Drink", baseUnit: "bottle", unitType: "package", inputUnit: "box", packageQuantity: 24, category: "alcohol" },

    // Wines
    { name: "Ksara Red Wine", baseUnit: "bottle", unitType: "package", inputUnit: "box", packageQuantity: 12, category: "alcohol" },
    { name: "Ksara White Wine", baseUnit: "bottle", unitType: "package", inputUnit: "box", packageQuantity: 12, category: "alcohol" },
    { name: "Ksara Rose Wine", baseUnit: "bottle", unitType: "package", inputUnit: "box", packageQuantity: 12, category: "alcohol" },

    // Spirits - Tequila
    { name: "Jose Cuervo Silver", baseUnit: "bottle", unitType: "package", inputUnit: "box", packageQuantity: 6, category: "alcohol" },
    { name: "Jose Cuervo Gold", baseUnit: "bottle", unitType: "package", inputUnit: "box", packageQuantity: 6, category: "alcohol" },

    // Spirits - Gin
    { name: "Beefeater Gin", baseUnit: "bottle", unitType: "package", inputUnit: "box", packageQuantity: 6, category: "alcohol" },
    { name: "Tanqueray Gin", baseUnit: "bottle", unitType: "package", inputUnit: "box", packageQuantity: 6, category: "alcohol" },
    { name: "Bombay Gin", baseUnit: "bottle", unitType: "package", inputUnit: "box", packageQuantity: 6, category: "alcohol" },
    { name: "Gordons Gin", baseUnit: "bottle", unitType: "package", inputUnit: "box", packageQuantity: 6, category: "alcohol" },

    // Spirits - Whiskey
    { name: "J&B Whiskey", baseUnit: "bottle", unitType: "package", inputUnit: "box", packageQuantity: 6, category: "alcohol" },
    { name: "Jack Daniels", baseUnit: "bottle", unitType: "package", inputUnit: "box", packageQuantity: 6, category: "alcohol" },
    { name: "Glenfiddich", baseUnit: "bottle", unitType: "package", inputUnit: "box", packageQuantity: 6, category: "alcohol" },
    { name: "Black Label", baseUnit: "bottle", unitType: "package", inputUnit: "box", packageQuantity: 6, category: "alcohol" },
    { name: "Red Label", baseUnit: "bottle", unitType: "package", inputUnit: "box", packageQuantity: 6, category: "alcohol" },
    { name: "Jameson", baseUnit: "bottle", unitType: "package", inputUnit: "box", packageQuantity: 6, category: "alcohol" },
    { name: "Chivas 12y", baseUnit: "bottle", unitType: "package", inputUnit: "box", packageQuantity: 6, category: "alcohol" },
    { name: "Chivas 15y", baseUnit: "bottle", unitType: "package", inputUnit: "box", packageQuantity: 6, category: "alcohol" },
    { name: "Jim Beam", baseUnit: "bottle", unitType: "package", inputUnit: "box", packageQuantity: 6, category: "alcohol" },

    // Spirits - Vodka
    { name: "Grey Goose", baseUnit: "bottle", unitType: "package", inputUnit: "box", packageQuantity: 6, category: "alcohol" },
    { name: "Belvedere", baseUnit: "bottle", unitType: "package", inputUnit: "box", packageQuantity: 6, category: "alcohol" },
    { name: "Stoli Gold", baseUnit: "bottle", unitType: "package", inputUnit: "box", packageQuantity: 6, category: "alcohol" },
    { name: "Stoli Red", baseUnit: "bottle", unitType: "package", inputUnit: "box", packageQuantity: 6, category: "alcohol" },
    { name: "Smirnoff", baseUnit: "bottle", unitType: "package", inputUnit: "box", packageQuantity: 6, category: "alcohol" },
    { name: "Russian Standard", baseUnit: "bottle", unitType: "package", inputUnit: "box", packageQuantity: 6, category: "alcohol" },

    // Non-Alcoholic Beverages
    { name: "Red Bull Energy Drink", baseUnit: "can", unitType: "package", inputUnit: "box", packageQuantity: 24, category: "beverages" },
    { name: "Water Small", baseUnit: "bottle", unitType: "package", inputUnit: "box", packageQuantity: 24, category: "beverages" },
    { name: "Water Large", baseUnit: "bottle", unitType: "package", inputUnit: "box", packageQuantity: 12, category: "beverages" },
    { name: "Soft Drinks", baseUnit: "can", unitType: "package", inputUnit: "box", packageQuantity: 24, category: "beverages" },
    { name: "7up", baseUnit: "can", unitType: "package", inputUnit: "box", packageQuantity: 24, category: "beverages" },
    { name: "Sparkling Water", baseUnit: "bottle", unitType: "package", inputUnit: "box", packageQuantity: 12, category: "beverages" },
    { name: "Bzurat", baseUnit: "bottle", unitType: "package", inputUnit: "box", packageQuantity: 24, category: "beverages" },
    { name: "Energy Drink", baseUnit: "can", unitType: "package", inputUnit: "box", packageQuantity: 24, category: "beverages" },

    // Beverage Ingredients for Smoothies, Juices, Shakes, Coffee
    { name: "Fresh Mango", baseUnit: "g", unitType: "mass", inputUnit: "kg", category: "fruits" },
    { name: "Fresh Strawberry", baseUnit: "g", unitType: "mass", inputUnit: "kg", category: "fruits" },
    { name: "Mixed Berries", baseUnit: "g", unitType: "mass", inputUnit: "kg", category: "fruits" },
    { name: "Fresh Peach", baseUnit: "g", unitType: "mass", inputUnit: "kg", category: "fruits" },
    { name: "Passion Fruit", baseUnit: "g", unitType: "mass", inputUnit: "kg", category: "fruits" },
    { name: "Fresh Orange", baseUnit: "g", unitType: "mass", inputUnit: "kg", category: "fruits" },
    { name: "Fresh Lemon", baseUnit: "g", unitType: "mass", inputUnit: "kg", category: "fruits" },
    { name: "Fresh Mint", baseUnit: "g", unitType: "mass", inputUnit: "kg", category: "other" },
    { name: "Ice Cream Vanilla", baseUnit: "ml", unitType: "volume", inputUnit: "l", category: "dairy" },
    { name: "Ice Cream Chocolate", baseUnit: "ml", unitType: "volume", inputUnit: "l", category: "dairy" },
    { name: "Ice Cream Strawberry", baseUnit: "ml", unitType: "volume", inputUnit: "l", category: "dairy" },
    { name: "Milk", baseUnit: "ml", unitType: "volume", inputUnit: "l", category: "dairy" },
    { name: "Bounty Chocolate", baseUnit: "g", unitType: "mass", inputUnit: "kg", category: "sweets" },
    { name: "Lotus Biscuits", baseUnit: "g", unitType: "mass", inputUnit: "kg", category: "sweets" },
    { name: "Oreo Cookies", baseUnit: "g", unitType: "mass", inputUnit: "kg", category: "sweets" },
    { name: "Brownie Mix", baseUnit: "g", unitType: "mass", inputUnit: "kg", category: "sweets" },
    { name: "Coffee Beans", baseUnit: "g", unitType: "mass", inputUnit: "kg", category: "beverages" },
    { name: "Nescafe Gold", baseUnit: "g", unitType: "mass", inputUnit: "kg", category: "beverages" },
    { name: "Hot Chocolate Powder", baseUnit: "g", unitType: "mass", inputUnit: "kg", category: "beverages" },
    { name: "Tea Leaves", baseUnit: "g", unitType: "mass", inputUnit: "kg", category: "beverages" },
    { name: "Turkish Coffee", baseUnit: "g", unitType: "mass", inputUnit: "kg", category: "beverages" },
    { name: "Caramel Syrup", baseUnit: "ml", unitType: "volume", inputUnit: "l", category: "spices" },
    { name: "Vanilla Syrup", baseUnit: "ml", unitType: "volume", inputUnit: "l", category: "spices" },
    { name: "Toffee Syrup", baseUnit: "ml", unitType: "volume", inputUnit: "l", category: "spices" },
    { name: "Grenadine Syrup", baseUnit: "ml", unitType: "volume", inputUnit: "l", category: "spices" },

    // Cocktail Ingredients
    { name: "Blue Curacao", baseUnit: "ml", unitType: "volume", inputUnit: "l", category: "alcohol" },
    { name: "Triple Sec", baseUnit: "ml", unitType: "volume", inputUnit: "l", category: "alcohol" },
    { name: "White Rum", baseUnit: "ml", unitType: "volume", inputUnit: "l", category: "alcohol" },
    { name: "Gold Rum", baseUnit: "ml", unitType: "volume", inputUnit: "l", category: "alcohol" },
    { name: "Coconut Syrup", baseUnit: "ml", unitType: "volume", inputUnit: "l", category: "spices" },
    { name: "Pineapple Juice", baseUnit: "ml", unitType: "volume", inputUnit: "l", category: "beverages" },
    { name: "Cranberry Juice", baseUnit: "ml", unitType: "volume", inputUnit: "l", category: "beverages" },
    { name: "Orange Juice", baseUnit: "ml", unitType: "volume", inputUnit: "l", category: "beverages" },
    { name: "Lime Juice", baseUnit: "ml", unitType: "volume", inputUnit: "l", category: "beverages" },
    { name: "Lemon Juice", baseUnit: "ml", unitType: "volume", inputUnit: "l", category: "beverages" },
    { name: "Ginger Beer", baseUnit: "ml", unitType: "volume", inputUnit: "l", category: "beverages" },
    { name: "Simple Syrup", baseUnit: "ml", unitType: "volume", inputUnit: "l", category: "spices" },
    { name: "Midori", baseUnit: "ml", unitType: "volume", inputUnit: "l", category: "alcohol" },
    { name: "Archer", baseUnit: "ml", unitType: "volume", inputUnit: "l", category: "alcohol" },
    { name: "Passion Syrup", baseUnit: "ml", unitType: "volume", inputUnit: "l", category: "spices" },
    { name: "Kahlua", baseUnit: "ml", unitType: "volume", inputUnit: "l", category: "alcohol" },
    { name: "Espresso", baseUnit: "ml", unitType: "volume", inputUnit: "l", category: "beverages" },
    { name: "Malibu", baseUnit: "ml", unitType: "volume", inputUnit: "l", category: "alcohol" },
    { name: "Bailey's", baseUnit: "ml", unitType: "volume", inputUnit: "l", category: "alcohol" },
    { name: "Jager", baseUnit: "ml", unitType: "volume", inputUnit: "l", category: "alcohol" },
    { name: "Fresh Basil", baseUnit: "g", unitType: "mass", inputUnit: "kg", category: "other" },
    { name: "Charcoal", baseUnit: "g", unitType: "mass", inputUnit: "kg", category: "tobacco" },
    { name: "Tobacco M3assal", baseUnit: "g", unitType: "mass", inputUnit: "kg", category: "tobacco" }
  ];

  let createdCount = 0;
  let existingCount = 0;

  for (const materialData of materials) {
    try {
      const existingMaterial = await Material.findOne({
        where: { name: materialData.name }
      });

      if (!existingMaterial) {
        // Convert category value to categoryId
        const { category, ...materialDataWithoutCategory } = materialData;
        const categoryId = categoryMap[category] || null;
        
        if (category && !categoryId) {
          console.warn(`⚠️ Category '${category}' not found for material '${materialData.name}'. Setting categoryId to null.`);
        }

        const finalMaterialData = {
          ...materialDataWithoutCategory,
          categoryId
        };

        await Material.create(finalMaterialData);
        console.log(`✅ Created material: ${materialData.name} (categoryId: ${categoryId})`);
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

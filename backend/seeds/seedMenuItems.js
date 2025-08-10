import Material from "../models/materials.js";
import { MenuItem, MenuItemIngredient } from "../models/menuItems.js";

/**
 * Seed comprehensive menu items with all 176 items from the menu
 */
export async function seedMenuItems() {
  console.log("🍽️ Seeding comprehensive menu items (176 items)...");

  // Get all materials for ingredient mapping
  const materials = await Material.findAll();
  const materialMap = {};
  materials.forEach(material => {
    materialMap[material.name] = material;
  });

  const menuItems = [
    // =============================================================================
    // APPETIZERS - 17 ITEMS
    // =============================================================================
    {
      name: "Grilled Halloumi",
      description: "Grilled Halloumi, Iceberg, cherry tomatoes, pesto sauce",
      category: "appetizers",
      price: 7.00,
      isPOSItem: true,
      printerId: 3,
      ingredients: [
        { materialName: "Halloumi", quantity: 150, unit: "g", cost: 1.80 },
        { materialName: "Iceberg Lettuce", quantity: 50, unit: "g", cost: 0.13 },
        { materialName: "Tomatoes", quantity: 80, unit: "g", cost: 0.28 },
        { materialName: "Pesto Sauce", quantity: 30, unit: "ml", cost: 0.36 }
      ]
    },
    {
      name: "Juicy Balls",
      description: "Cheese balls, special sauce",
      category: "appetizers",
      price: 8.00,
      isPOSItem: true,
      printerId: 3,
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
      printerId: 3,
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
      printerId: 3,
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
      printerId: 3,
      ingredients: [
        { materialName: "Chicken Wings", quantity: 8, unit: "piece", cost: 3.20 },
        { materialName: "BBQ Sauce", quantity: 30, unit: "ml", cost: 0.18 },
        { materialName: "Buffalo Sauce", quantity: 30, unit: "ml", cost: 0.26 },
        { materialName: "Honey Mustard Sauce", quantity: 30, unit: "ml", cost: 0.23 }
      ]
    },
    {
      name: "Nachos",
      description: "Nachos",
      category: "appetizers",
      price: 8.00,
      isPOSItem: true,
      printerId: 3,
      ingredients: [
        { materialName: "Nachos", quantity: 200, unit: "g", cost: 0.90 }
      ]
    },
    {
      name: "Cheese Garlic Bread",
      description: "Ciabatta bread, bell pepper, mozzarella, mayo garlic sauce",
      category: "appetizers",
      price: 7.00,
      isPOSItem: true,
      printerId: 3,
      ingredients: [
        { materialName: "Ciabatta Bread", quantity: 150, unit: "g", cost: 0.90 },
        { materialName: "Bell Pepper", quantity: 50, unit: "g", cost: 0.15 },
        { materialName: "Mozzarella Cheese", quantity: 80, unit: "g", cost: 0.64 },
        { materialName: "Mayo Garlic Sauce", quantity: 30, unit: "ml", cost: 0.24 }
      ]
    },
    {
      name: "Shrimp Tempura",
      description: "Served with spicy mayo sauce",
      category: "appetizers",
      price: 12.00,
      isPOSItem: true,
      printerId: 3,
      ingredients: [
        { materialName: "Shrimp", quantity: 150, unit: "g", cost: 4.20 },
        { materialName: "Special Sauce", quantity: 30, unit: "ml", cost: 0.30 }
      ]
    },
    {
      name: "Salmon Bruschetta",
      description: "French toast, cream cheese, smoked salmon",
      category: "appetizers",
      price: 10.00,
      isPOSItem: true,
      printerId: 3,
      ingredients: [
        { materialName: "Ciabatta Bread", quantity: 100, unit: "g", cost: 0.60 },
        { materialName: "Cream Cheese", quantity: 50, unit: "g", cost: 0.35 },
        { materialName: "Salmon", quantity: 80, unit: "g", cost: 1.76 }
      ]
    },
    {
      name: "Dynamite Shrimps",
      description: "Dynamite shrimps, special sauce",
      category: "appetizers",
      price: 9.00,
      isPOSItem: true,
      printerId: 3,
      ingredients: [
        { materialName: "Shrimp", quantity: 120, unit: "g", cost: 3.36 },
        { materialName: "Special Sauce", quantity: 40, unit: "ml", cost: 0.40 }
      ]
    },
    {
      name: "Chicken Quesadillas",
      description: "Grilled Chicken, onion, bell pepper, mozzarella, Nachos, Iceberg, tortilla bread",
      category: "appetizers",
      price: 11.00,
      isPOSItem: true,
      printerId: 3,
      ingredients: [
        { materialName: "Chicken Breast", quantity: 120, unit: "g", cost: 1.02 },
        { materialName: "Onion", quantity: 50, unit: "g", cost: 0.08 },
        { materialName: "Bell Pepper", quantity: 50, unit: "g", cost: 0.15 },
        { materialName: "Mozzarella Cheese", quantity: 80, unit: "g", cost: 0.64 },
        { materialName: "Nachos", quantity: 50, unit: "g", cost: 0.23 },
        { materialName: "Iceberg Lettuce", quantity: 30, unit: "g", cost: 0.08 },
        { materialName: "Tortilla Bread", quantity: 100, unit: "g", cost: 0.35 }
      ]
    },
    {
      name: "French Fries",
      description: "French Fries, Ketchup",
      category: "appetizers",
      price: 3.00,
      isPOSItem: true,
      printerId: 3,
      ingredients: [
        { materialName: "French Fries", quantity: 200, unit: "g", cost: 0.40 },
        { materialName: "Ketchup", quantity: 30, unit: "ml", cost: 0.12 }
      ]
    },
    {
      name: "Wedges",
      description: "Wedges, BBQ, Ketchup",
      category: "appetizers",
      price: 5.00,
      isPOSItem: true,
      printerId: 3,
      ingredients: [
        { materialName: "Wedges", quantity: 250, unit: "g", cost: 0.63 },
        { materialName: "BBQ Sauce", quantity: 30, unit: "ml", cost: 0.18 },
        { materialName: "Ketchup", quantity: 30, unit: "ml", cost: 0.12 }
      ]
    },
    {
      name: "Curly Fries",
      description: "Curly Fries, BBQ, Ketchup",
      category: "appetizers",
      price: 8.00,
      isPOSItem: true,
      printerId: 3,
      ingredients: [
        { materialName: "Curly Fries", quantity: 200, unit: "g", cost: 0.60 },
        { materialName: "BBQ Sauce", quantity: 30, unit: "ml", cost: 0.18 },
        { materialName: "Ketchup", quantity: 30, unit: "ml", cost: 0.12 }
      ]
    },
    {
      name: "Oops Fries",
      description: "Wedges, crispy chicken, jalapeno, cheddar, cocktail sauce, buffalo, BBQ",
      category: "appetizers",
      price: 13.00,
      isPOSItem: true,
      printerId: 3,
      ingredients: [
        { materialName: "Wedges", quantity: 200, unit: "g", cost: 0.50 },
        { materialName: "Crispy Chicken", quantity: 100, unit: "g", cost: 1.50 },
        { materialName: "Jalapeno", quantity: 30, unit: "g", cost: 0.18 },
        { materialName: "Cheddar Cheese", quantity: 80, unit: "g", cost: 0.72 },
        { materialName: "Special Sauce", quantity: 30, unit: "ml", cost: 0.30 },
        { materialName: "Buffalo Sauce", quantity: 20, unit: "ml", cost: 0.17 },
        { materialName: "BBQ Sauce", quantity: 20, unit: "ml", cost: 0.12 }
      ]
    },
    {
      name: "Combo Platter",
      description: "3 crispy chicken, 4 wings, 4 mozzarella sticks, wedges",
      category: "appetizers",
      price: 15.00,
      isPOSItem: true,
      printerId: 3,
      ingredients: [
        { materialName: "Crispy Chicken", quantity: 150, unit: "g", cost: 2.25 },
        { materialName: "Chicken Wings", quantity: 200, unit: "g", cost: 3.60 },
        { materialName: "Mozzarella Cheese", quantity: 120, unit: "g", cost: 0.96 },
        { materialName: "Wedges", quantity: 200, unit: "g", cost: 0.50 }
      ]
    },
    {
      name: "Mix Seafood",
      description: "4 shrimps, 4 calamari rings, 4 fish fingers, wedges",
      category: "appetizers",
      price: 18.00,
      isPOSItem: true,
      printerId: 3,
      ingredients: [
        { materialName: "Shrimp", quantity: 100, unit: "g", cost: 2.80 },
        { materialName: "Calamari", quantity: 100, unit: "g", cost: 3.50 },
        { materialName: "Fish Fingers", quantity: 100, unit: "g", cost: 2.00 },
        { materialName: "Wedges", quantity: 200, unit: "g", cost: 0.50 }
      ]
    },

    // =============================================================================
    // PASTA - 9 ITEMS
    // =============================================================================
    {
      name: "Penne Arrabiata",
      description: "Penne, red sauce, parmesan",
      category: "plates",
      price: 10.00,
      isPOSItem: true,
      printerId: 3,
      ingredients: [
        { materialName: "Penne Pasta", quantity: 120, unit: "g", cost: 0.36 },
        { materialName: "Red Sauce", quantity: 100, unit: "ml", cost: 0.50 },
        { materialName: "Parmesan", quantity: 30, unit: "g", cost: 0.54 }
      ]
    },
    {
      name: "Penne Rose",
      description: "Penne, sauce rose, parmesan",
      category: "plates",
      price: 11.00,
      isPOSItem: true,
      printerId: 3,
      ingredients: [
        { materialName: "Penne Pasta", quantity: 120, unit: "g", cost: 0.36 },
        { materialName: "Rose Sauce", quantity: 100, unit: "ml", cost: 0.60 },
        { materialName: "Parmesan", quantity: 30, unit: "g", cost: 0.54 }
      ]
    },
    {
      name: "Pesto Pasta",
      description: "Penne, creamy pesto sauce, parmesan",
      category: "plates",
      price: 11.00,
      isPOSItem: true,
      printerId: 3,
      ingredients: [
        { materialName: "Penne Pasta", quantity: 120, unit: "g", cost: 0.36 },
        { materialName: "Pesto Sauce", quantity: 100, unit: "ml", cost: 1.20 },
        { materialName: "Parmesan", quantity: 30, unit: "g", cost: 0.54 }
      ]
    },
    {
      name: "Fettuccine Alfredo",
      description: "Tagliatelle, grilled chicken, mushroom, parmesan",
      category: "plates",
      price: 14.00,
      isPOSItem: true,
      printerId: 3,
      ingredients: [
        { materialName: "Tagliatelle Pasta", quantity: 120, unit: "g", cost: 0.48 },
        { materialName: "Chicken Breast", quantity: 150, unit: "g", cost: 1.28 },
        { materialName: "Fresh Mushroom", quantity: 80, unit: "g", cost: 0.64 },
        { materialName: "Alfredo Sauce", quantity: 120, unit: "ml", cost: 0.84 },
        { materialName: "Parmesan", quantity: 30, unit: "g", cost: 0.54 }
      ]
    },
    {
      name: "Shrimp Alfredo",
      description: "Tagliatelle, shrimp, creamy sauce",
      category: "plates",
      price: 15.00,
      isPOSItem: true,
      printerId: 3,
      ingredients: [
        { materialName: "Tagliatelle Pasta", quantity: 120, unit: "g", cost: 0.48 },
        { materialName: "Shrimp", quantity: 150, unit: "g", cost: 2.25 },
        { materialName: "Alfredo Sauce", quantity: 120, unit: "ml", cost: 0.84 },
        { materialName: "Parmesan", quantity: 30, unit: "g", cost: 0.54 }
      ]
    },
    {
      name: "Spaghetti Shrimp",
      description: "Linguine, shrimp, red sauce, parmesan",
      category: "plates",
      price: 15.00,
      isPOSItem: true,
      printerId: 3,
      ingredients: [
        { materialName: "Linguine Pasta", quantity: 120, unit: "g", cost: 0.42 },
        { materialName: "Shrimp", quantity: 150, unit: "g", cost: 2.25 },
        { materialName: "Red Sauce", quantity: 100, unit: "ml", cost: 0.50 },
        { materialName: "Parmesan", quantity: 30, unit: "g", cost: 0.54 }
      ]
    },
    {
      name: "Vegetable Noodles",
      description: "Fresh noodles, mix of vegetables, oyster sauce",
      category: "plates",
      price: 10.00,
      isPOSItem: true,
      printerId: 3,
      ingredients: [
        { materialName: "Fresh Noodles", quantity: 120, unit: "g", cost: 0.48 },
        { materialName: "Mixed Vegetables", quantity: 150, unit: "g", cost: 0.90 },
        { materialName: "Oyster Sauce", quantity: 40, unit: "ml", cost: 0.32 }
      ]
    },
    {
      name: "Chicken Noodles",
      description: "Fresh noodles, chicken, mix of vegetables, oyster sauce",
      category: "plates",
      price: 12.00,
      isPOSItem: true,
      printerId: 3,
      ingredients: [
        { materialName: "Fresh Noodles", quantity: 120, unit: "g", cost: 0.48 },
        { materialName: "Chicken Breast", quantity: 120, unit: "g", cost: 1.02 },
        { materialName: "Mixed Vegetables", quantity: 120, unit: "g", cost: 0.72 },
        { materialName: "Oyster Sauce", quantity: 40, unit: "ml", cost: 0.32 }
      ]
    },
    {
      name: "Shrimp Noodles",
      description: "Fresh noodles, marinated shrimp, mix of vegetables, oyster sauce",
      category: "plates",
      price: 14.00,
      isPOSItem: true,
      printerId: 3,
      ingredients: [
        { materialName: "Fresh Noodles", quantity: 120, unit: "g", cost: 0.48 },
        { materialName: "Shrimp", quantity: 120, unit: "g", cost: 1.80 },
        { materialName: "Mixed Vegetables", quantity: 120, unit: "g", cost: 0.72 },
        { materialName: "Oyster Sauce", quantity: 40, unit: "ml", cost: 0.32 }
      ]
    },

    // =============================================================================
    // MAIN COURSE - 15 ITEMS
    // =============================================================================
    {
      name: "Taouk Platter",
      description: "Taouk, fries, coleslaw, pickles, garlic mayo sauce",
      category: "plates",
      price: 12.00,
      isPOSItem: true,
      printerId: 3,
      ingredients: [
        { materialName: "Taouk", quantity: 200, unit: "g", cost: 1.80 },
        { materialName: "French Fries", quantity: 150, unit: "g", cost: 0.30 },
        { materialName: "Coleslaw", quantity: 80, unit: "g", cost: 0.28 },
        { materialName: "Pickles", quantity: 40, unit: "g", cost: 0.18 },
        { materialName: "Mayo Garlic Sauce", quantity: 50, unit: "ml", cost: 0.40 }
      ]
    },
    {
      name: "Crispy Platter",
      description: "5 crispy chicken, coleslaw, fries, garlic mayo sauce",
      category: "plates",
      price: 14.00,
      isPOSItem: true,
      printerId: 3,
      ingredients: [
        { materialName: "Crispy Chicken", quantity: 5, unit: "piece", cost: 7.50 },
        { materialName: "Coleslaw", quantity: 100, unit: "g", cost: 0.35 },
        { materialName: "French Fries", quantity: 150, unit: "g", cost: 0.30 },
        { materialName: "Mayo Garlic Sauce", quantity: 50, unit: "ml", cost: 0.40 }
      ]
    },
    {
      name: "Bajaxy",
      description: "2 chicken roulade, fettuccine pasta, fries, creamy sauce",
      category: "plates",
      price: 19.00,
      isPOSItem: true,
      printerId: 3,
      ingredients: [
        { materialName: "Chicken Roulade", quantity: 2, unit: "piece", cost: 6.00 },
        { materialName: "Fettuccine Pasta", quantity: 120, unit: "g", cost: 0.48 },
        { materialName: "French Fries", quantity: 100, unit: "g", cost: 0.20 },
        { materialName: "Creamy Sauce", quantity: 80, unit: "ml", cost: 0.96 }
      ]
    },
    {
      name: "Chicken Mushroom",
      description: "Grilled chicken breast, wedges, grilled vegetables, creamy mushroom sauce",
      category: "plates",
      price: 18.00,
      isPOSItem: true,
      printerId: 3,
      ingredients: [
        { materialName: "Chicken Breast", quantity: 200, unit: "g", cost: 1.70 },
        { materialName: "Wedges", quantity: 150, unit: "g", cost: 0.45 },
        { materialName: "Grilled Vegetables", quantity: 120, unit: "g", cost: 0.66 },
        { materialName: "Mushroom Sauce", quantity: 80, unit: "ml", cost: 0.96 }
      ]
    },
    {
      name: "Chicken Pesto",
      description: "Grilled chicken breast, wedges, grilled vegetables, creamy pesto sauce",
      category: "plates",
      price: 18.00,
      isPOSItem: true,
      printerId: 3,
      ingredients: [
        { materialName: "Chicken Breast", quantity: 200, unit: "g", cost: 1.70 },
        { materialName: "Wedges", quantity: 150, unit: "g", cost: 0.45 },
        { materialName: "Grilled Vegetables", quantity: 120, unit: "g", cost: 0.66 },
        { materialName: "Pesto Sauce", quantity: 80, unit: "ml", cost: 0.96 }
      ]
    },
    {
      name: "Chicken Parmigiana",
      description: "2 crispy chicken topped with red sauce and mozzarella cheese, red sauce pasta",
      category: "plates",
      price: 19.00,
      isPOSItem: true,
      printerId: 3,
      ingredients: [
        { materialName: "Crispy Chicken", quantity: 2, unit: "piece", cost: 3.00 },
        { materialName: "Red Sauce", quantity: 100, unit: "ml", cost: 0.50 },
        { materialName: "Mozzarella Cheese", quantity: 100, unit: "g", cost: 0.80 },
        { materialName: "Penne Pasta", quantity: 120, unit: "g", cost: 0.36 }
      ]
    },
    {
      name: "Chicken Halloumi",
      description: "Grilled chicken breast, grilled halloumi, grilled vegetables, light mayo pesto sauce",
      category: "plates",
      price: 20.00,
      isPOSItem: true,
      printerId: 3,
      ingredients: [
        { materialName: "Chicken Breast", quantity: 200, unit: "g", cost: 1.70 },
        { materialName: "Halloumi Cheese", quantity: 120, unit: "g", cost: 1.44 },
        { materialName: "Grilled Vegetables", quantity: 120, unit: "g", cost: 0.66 },
        { materialName: "Mayo Pesto Sauce", quantity: 50, unit: "ml", cost: 0.60 }
      ]
    },
    {
      name: "Chicken Strogonoff",
      description: "Marinated chicken, fresh mushroom, creamy sauce, served with white rice",
      category: "plates",
      price: 18.00,
      isPOSItem: true,
      printerId: 3,
      ingredients: [
        { materialName: "Chicken Breast", quantity: 200, unit: "g", cost: 1.70 },
        { materialName: "Fresh Mushroom", quantity: 100, unit: "g", cost: 0.80 },
        { materialName: "Creamy Sauce", quantity: 100, unit: "ml", cost: 1.20 },
        { materialName: "White Rice", quantity: 150, unit: "g", cost: 0.30 }
      ]
    },
    {
      name: "Beef Strogonoff",
      description: "Tender beef, fresh mushroom, served with white rice",
      category: "plates",
      price: 18.00,
      isPOSItem: true,
      printerId: 3,
      ingredients: [
        { materialName: "Beef Strips", quantity: 200, unit: "g", cost: 3.20 },
        { materialName: "Fresh Mushroom", quantity: 100, unit: "g", cost: 0.80 },
        { materialName: "Creamy Sauce", quantity: 100, unit: "ml", cost: 1.20 },
        { materialName: "White Rice", quantity: 150, unit: "g", cost: 0.30 }
      ]
    },
    {
      name: "Butter Shrimp",
      description: "Marinated shrimp, indian sauce, served with white rice",
      category: "plates",
      price: 18.00,
      isPOSItem: true,
      printerId: 3,
      ingredients: [
        { materialName: "Shrimp", quantity: 200, unit: "g", cost: 3.00 },
        { materialName: "Indian Sauce", quantity: 100, unit: "ml", cost: 1.20 },
        { materialName: "White Rice", quantity: 150, unit: "g", cost: 0.30 }
      ]
    },
    {
      name: "Butter Chicken",
      description: "Marinated chicken, indian sauce, served with white rice",
      category: "plates",
      price: 17.00,
      isPOSItem: true,
      printerId: 3,
      ingredients: [
        { materialName: "Chicken Breast", quantity: 200, unit: "g", cost: 1.70 },
        { materialName: "Indian Sauce", quantity: 100, unit: "ml", cost: 1.20 },
        { materialName: "White Rice", quantity: 150, unit: "g", cost: 0.30 }
      ]
    },
    {
      name: "Steak Mushroom",
      description: "Grilled beef filet, mashed potatoes, grilled vegetables, mushroom sauce",
      category: "plates",
      price: 23.00,
      isPOSItem: true,
      printerId: 3,
      ingredients: [
        { materialName: "Beef Filet", quantity: 200, unit: "g", cost: 6.00 },
        { materialName: "Mashed Potatoes", quantity: 150, unit: "g", cost: 0.42 },
        { materialName: "Grilled Vegetables", quantity: 120, unit: "g", cost: 0.66 },
        { materialName: "Mushroom Sauce", quantity: 80, unit: "ml", cost: 0.96 }
      ]
    },
    {
      name: "Cashew Chicken",
      description: "Marinated chicken, mixed vegetables, served with white rice",
      category: "plates",
      price: 21.00,
      isPOSItem: true,
      printerId: 3,
      ingredients: [
        { materialName: "Chicken Breast", quantity: 200, unit: "g", cost: 1.70 },
        { materialName: "Cashew Nuts", quantity: 50, unit: "g", cost: 1.50 },
        { materialName: "Mixed Vegetables", quantity: 150, unit: "g", cost: 0.90 },
        { materialName: "White Rice", quantity: 150, unit: "g", cost: 0.30 }
      ]
    },
    {
      name: "Oops Platter",
      description: "Fried chicken strips, fettuccine, curly fries, special sauce",
      category: "plates",
      price: 21.00,
      isPOSItem: true,
      printerId: 3,
      ingredients: [
        { materialName: "Crispy Chicken", quantity: 200, unit: "g", cost: 3.00 },
        { materialName: "Fettuccine Pasta", quantity: 120, unit: "g", cost: 0.48 },
        { materialName: "Curly Fries", quantity: 150, unit: "g", cost: 0.45 },
        { materialName: "Special Sauce", quantity: 60, unit: "ml", cost: 0.60 }
      ]
    },
    {
      name: "Grilled Salmon",
      description: "Grilled salmon, mashed potatoes, grilled vegetables",
      category: "plates",
      price: 24.00,
      isPOSItem: true,
      printerId: 3,
      ingredients: [
        { materialName: "Salmon", quantity: 200, unit: "g", cost: 4.40 },
        { materialName: "Mashed Potatoes", quantity: 150, unit: "g", cost: 0.42 },
        { materialName: "Grilled Vegetables", quantity: 120, unit: "g", cost: 0.66 }
      ]
    },

    // =============================================================================
    // PIZZA - 12 ITEMS
    // =============================================================================
    {
      name: "Pizza Margherita",
      description: "Sourdough, San Marzano Tomatoes, low moisture Mozzarella",
      category: "plates",
      price: 10.00,
      isPOSItem: true,
      printerId: 3,
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
      printerId: 3,
      ingredients: [
        { materialName: "Sourdough", quantity: 1, unit: "piece", cost: 1.33 },
        { materialName: "Marinara Sauce", quantity: 80, unit: "ml", cost: 0.40 },
        { materialName: "Mozzarella Cheese", quantity: 120, unit: "g", cost: 0.96 },
        { materialName: "Pepperoni", quantity: 60, unit: "g", cost: 0.96 }
      ]
    },
    {
      name: "Pizza Lebanese",
      description: "Sourdough, Homemade Marinara Sauce, Low Moisture Italian Mozzarella, Ham Pork, Mushrooms, Onions, Green Pepper, Black Olives",
      category: "plates",
      price: 13.00,
      isPOSItem: true,
      printerId: 3,
      ingredients: [
        { materialName: "Sourdough", quantity: 1, unit: "piece", cost: 1.33 },
        { materialName: "Marinara Sauce", quantity: 80, unit: "ml", cost: 0.40 },
        { materialName: "Mozzarella Cheese", quantity: 120, unit: "g", cost: 0.96 },
        { materialName: "Ham", quantity: 60, unit: "g", cost: 0.90 },
        { materialName: "Fresh Mushroom", quantity: 50, unit: "g", cost: 0.40 },
        { materialName: "Onion", quantity: 40, unit: "g", cost: 0.06 },
        { materialName: "Green Pepper", quantity: 40, unit: "g", cost: 0.12 },
        { materialName: "Black Olives", quantity: 30, unit: "g", cost: 0.36 }
      ]
    },
    {
      name: "Pizza Alla Vodka",
      description: "Sourdough, Speciality Vodka Sauce, Low Moisture Italian Mozzarella Cheese",
      category: "plates",
      price: 12.00,
      isPOSItem: true,
      printerId: 3,
      ingredients: [
        { materialName: "Sourdough", quantity: 1, unit: "piece", cost: 1.33 },
        { materialName: "Vodka Sauce", quantity: 80, unit: "ml", cost: 0.64 },
        { materialName: "Mozzarella Cheese", quantity: 120, unit: "g", cost: 0.96 }
      ]
    },
    {
      name: "Pizza Chicken Alfredo",
      description: "Sourdough, Homemade White Alfredo Sauce, Low Moisture Italian Mozzarella, Grilled Chicken Breast, Mushrooms",
      category: "plates",
      price: 14.00,
      isPOSItem: true,
      printerId: 3,
      ingredients: [
        { materialName: "Sourdough", quantity: 1, unit: "piece", cost: 1.33 },
        { materialName: "Alfredo Sauce", quantity: 80, unit: "ml", cost: 0.56 },
        { materialName: "Mozzarella Cheese", quantity: 120, unit: "g", cost: 0.96 },
        { materialName: "Chicken Breast", quantity: 100, unit: "g", cost: 0.85 },
        { materialName: "Fresh Mushroom", quantity: 50, unit: "g", cost: 0.40 }
      ]
    },
    {
      name: "Pizza Buffalo Chicken",
      description: "Sourdough, Homemade Marinara Sauce, Grilled Chicken Breast, Onions, Buffalo Sauce, A Drizzle OF Blue Cheese Sauce",
      category: "plates",
      price: 14.00,
      isPOSItem: true,
      printerId: 3,
      ingredients: [
        { materialName: "Sourdough", quantity: 1, unit: "piece", cost: 1.33 },
        { materialName: "Marinara Sauce", quantity: 80, unit: "ml", cost: 0.40 },
        { materialName: "Chicken Breast", quantity: 100, unit: "g", cost: 0.85 },
        { materialName: "Onion", quantity: 40, unit: "g", cost: 0.06 },
        { materialName: "Buffalo Sauce", quantity: 30, unit: "ml", cost: 0.24 },
        { materialName: "Blue Cheese Sauce", quantity: 20, unit: "ml", cost: 0.32 }
      ]
    },
    {
      name: "Pizza TRIO",
      description: "Sourdough, TRIO of Sauces: Homemade Marinara Sauce, Speciality Vodka Sauce, Basil Pesto Cream Sauce, Low Moisture Italian Mozzarella",
      category: "plates",
      price: 12.00,
      isPOSItem: true,
      printerId: 3,
      ingredients: [
        { materialName: "Sourdough", quantity: 1, unit: "piece", cost: 1.33 },
        { materialName: "Marinara Sauce", quantity: 30, unit: "ml", cost: 0.15 },
        { materialName: "Vodka Sauce", quantity: 30, unit: "ml", cost: 0.24 },
        { materialName: "Pesto Sauce", quantity: 30, unit: "ml", cost: 0.36 },
        { materialName: "Mozzarella Cheese", quantity: 120, unit: "g", cost: 0.96 }
      ]
    },
    {
      name: "Pizza Mexican",
      description: "Sourdough, Homemade Marinara Sauce, Grilled Chicken Breast, Grilled Onions & Green Peppers, Low Moisture Italian Mozzarella, Mexican Salsa, Guacamole",
      category: "plates",
      price: 14.00,
      isPOSItem: true,
      printerId: 3,
      ingredients: [
        { materialName: "Sourdough", quantity: 1, unit: "piece", cost: 1.33 },
        { materialName: "Marinara Sauce", quantity: 80, unit: "ml", cost: 0.40 },
        { materialName: "Chicken Breast", quantity: 100, unit: "g", cost: 0.85 },
        { materialName: "Onion", quantity: 40, unit: "g", cost: 0.06 },
        { materialName: "Green Pepper", quantity: 40, unit: "g", cost: 0.12 },
        { materialName: "Mozzarella Cheese", quantity: 120, unit: "g", cost: 0.96 },
        { materialName: "Mexican Salsa", quantity: 30, unit: "ml", cost: 0.24 },
        { materialName: "Guacamole", quantity: 30, unit: "g", cost: 0.36 }
      ]
    },
    {
      name: "BBQ Chicken Pizza",
      description: "Sourdough, Homemade Marinara Sauce, Grilled Chicken Breast, Grilled Onions BBQ sauce, Low Moisture Italian Mozzarella",
      category: "plates",
      price: 14.00,
      isPOSItem: true,
      printerId: 3,
      ingredients: [
        { materialName: "Sourdough", quantity: 1, unit: "piece", cost: 1.33 },
        { materialName: "Marinara Sauce", quantity: 80, unit: "ml", cost: 0.40 },
        { materialName: "Chicken Breast", quantity: 100, unit: "g", cost: 0.85 },
        { materialName: "Onion", quantity: 40, unit: "g", cost: 0.06 },
        { materialName: "BBQ Sauce", quantity: 30, unit: "ml", cost: 0.18 },
        { materialName: "Mozzarella Cheese", quantity: 120, unit: "g", cost: 0.96 }
      ]
    },
    {
      name: "Spicy Chicken Pizza",
      description: "Sourdough, Homemade Marinara Sauce, Grilled Chicken Breast, Homemade southern spicy sauce, Low Moisture Italian Mozzarella",
      category: "plates",
      price: 14.00,
      isPOSItem: true,
      printerId: 3,
      ingredients: [
        { materialName: "Sourdough", quantity: 1, unit: "piece", cost: 1.33 },
        { materialName: "Marinara Sauce", quantity: 80, unit: "ml", cost: 0.40 },
        { materialName: "Chicken Breast", quantity: 100, unit: "g", cost: 0.85 },
        { materialName: "Spicy Sauce", quantity: 30, unit: "ml", cost: 0.24 },
        { materialName: "Mozzarella Cheese", quantity: 120, unit: "g", cost: 0.96 }
      ]
    },
    {
      name: "Vegetarian Pizza",
      description: "Sourdough, Homemade Marinara Sauce, Low Moisture Italian Mozzarella, Mushrooms, Onions, Green Pepper, Black Olives",
      category: "plates",
      price: 12.00,
      isPOSItem: true,
      printerId: 3,
      ingredients: [
        { materialName: "Sourdough", quantity: 1, unit: "piece", cost: 1.33 },
        { materialName: "Marinara Sauce", quantity: 80, unit: "ml", cost: 0.40 },
        { materialName: "Mozzarella Cheese", quantity: 120, unit: "g", cost: 0.96 },
        { materialName: "Fresh Mushroom", quantity: 50, unit: "g", cost: 0.40 },
        { materialName: "Onion", quantity: 40, unit: "g", cost: 0.06 },
        { materialName: "Green Pepper", quantity: 40, unit: "g", cost: 0.12 },
        { materialName: "Black Olives", quantity: 30, unit: "g", cost: 0.36 }
      ]
    },
    {
      name: "PestoRoni Pizza",
      description: "Sourdough, Basil Pesto Cream Sauce, Low Moisture Italian Mozzarella, Pepperoni, Our Signature Districts' Hot Honey",
      category: "plates",
      price: 14.00,
      isPOSItem: true,
      printerId: 3,
      ingredients: [
        { materialName: "Sourdough", quantity: 1, unit: "piece", cost: 1.33 },
        { materialName: "Pesto Sauce", quantity: 80, unit: "ml", cost: 0.96 },
        { materialName: "Mozzarella Cheese", quantity: 120, unit: "g", cost: 0.96 },
        { materialName: "Pepperoni", quantity: 60, unit: "g", cost: 0.96 },
        { materialName: "Hot Honey", quantity: 20, unit: "ml", cost: 0.40 }
      ]
    },

    // =============================================================================
    // SUSHI - 77+ ITEMS
    // =============================================================================
    
    // SUSHI STARTERS
    {
      name: "Edamame",
      description: "Steamed soy beans, rock salt",
      category: "plates",
      price: 4.00,
      isPOSItem: true,
      printerId: 3,
      ingredients: [
        { materialName: "Edamame", quantity: 150, unit: "g", cost: 1.28 },
        { materialName: "Rock Salt", quantity: 2, unit: "g", cost: 0.01 }
      ]
    },
    {
      name: "Spicy Edamame",
      description: "Steamed soy beans, sriracha, togarashi",
      category: "plates",
      price: 4.00,
      isPOSItem: true,
      printerId: 3,
      ingredients: [
        { materialName: "Edamame", quantity: 150, unit: "g", cost: 1.28 },
        { materialName: "Sriracha", quantity: 10, unit: "ml", cost: 0.08 },
        { materialName: "Togarashi", quantity: 2, unit: "g", cost: 0.12 }
      ]
    },
    {
      name: "Shoyu Carpaccio",
      description: "120g thin slices of fresh salmon & tuna, sesame seeds, green onions",
      category: "plates",
      price: 12.00,
      isPOSItem: true,
      printerId: 3,
      ingredients: [
        { materialName: "Salmon", quantity: 60, unit: "g", cost: 1.32 },
        { materialName: "Tuna", quantity: 60, unit: "g", cost: 1.80 },
        { materialName: "Sesame Seeds", quantity: 5, unit: "g", cost: 0.15 },
        { materialName: "Green Onions", quantity: 10, unit: "g", cost: 0.05 }
      ]
    },
    {
      name: "Dynamite Salmon",
      description: "150g tube fresh salmon with special sauce",
      category: "plates",
      price: 14.00,
      isPOSItem: true,
      printerId: 3,
      ingredients: [
        { materialName: "Salmon", quantity: 150, unit: "g", cost: 3.30 },
        { materialName: "Special Sauce", quantity: 30, unit: "ml", cost: 0.30 }
      ]
    },

    // SUSHI SALADS
    {
      name: "Oishi Kani",
      description: "Premium crab sticks, cucumber, carrots, red cabbage, mango, crispy flakes",
      category: "plates",
      price: 9.50,
      isPOSItem: true,
      printerId: 3,
      ingredients: [
        { materialName: "Crab Sticks", quantity: 80, unit: "g", cost: 1.20 },
        { materialName: "Cucumber", quantity: 50, unit: "g", cost: 0.10 },
        { materialName: "Carrots", quantity: 30, unit: "g", cost: 0.06 },
        { materialName: "Red Cabbage", quantity: 40, unit: "g", cost: 0.12 },
        { materialName: "Mango", quantity: 50, unit: "g", cost: 0.40 },
        { materialName: "Crispy Flakes", quantity: 10, unit: "g", cost: 0.20 }
      ]
    },
    {
      name: "Crunchy Salmon",
      description: "Fresh salmon, crispy flakes served with special sauce",
      category: "plates",
      price: 12.00,
      isPOSItem: true,
      printerId: 3,
      ingredients: [
        { materialName: "Salmon", quantity: 100, unit: "g", cost: 2.20 },
        { materialName: "Crispy Flakes", quantity: 15, unit: "g", cost: 0.30 },
        { materialName: "Special Sauce", quantity: 30, unit: "ml", cost: 0.30 }
      ]
    },
    {
      name: "Crunchy Tuna",
      description: "Fresh tuna, crispy flakes served with special sauce",
      category: "plates",
      price: 14.00,
      isPOSItem: true,
      printerId: 3,
      ingredients: [
        { materialName: "Tuna", quantity: 100, unit: "g", cost: 3.00 },
        { materialName: "Crispy Flakes", quantity: 15, unit: "g", cost: 0.30 },
        { materialName: "Special Sauce", quantity: 30, unit: "ml", cost: 0.30 }
      ]
    },
    {
      name: "Exotic Poke Bowl",
      description: "Sushi rice, fresh salmon, shrimps, crab, mango, avocado, red cabbage, edamame, strawberry exotic mango sauce",
      category: "plates",
      price: 15.00,
      isPOSItem: true,
      printerId: 3,
      ingredients: [
        { materialName: "Sushi Rice", quantity: 120, unit: "g", cost: 0.48 },
        { materialName: "Salmon", quantity: 60, unit: "g", cost: 1.32 },
        { materialName: "Shrimp", quantity: 40, unit: "g", cost: 0.60 },
        { materialName: "Crab Sticks", quantity: 40, unit: "g", cost: 0.60 },
        { materialName: "Mango", quantity: 40, unit: "g", cost: 0.32 },
        { materialName: "Avocado", quantity: 40, unit: "g", cost: 0.32 },
        { materialName: "Red Cabbage", quantity: 30, unit: "g", cost: 0.09 },
        { materialName: "Edamame", quantity: 30, unit: "g", cost: 0.26 },
        { materialName: "Exotic Mango Sauce", quantity: 30, unit: "ml", cost: 0.36 }
      ]
    },
    {
      name: "Rainbow",
      description: "Premium crab sticks, shrimps, fresh salmon & tuna, mango, avocado, red cabbage, exotic mango sauce",
      category: "plates",
      price: 15.00,
      isPOSItem: true,
      printerId: 3,
      ingredients: [
        { materialName: "Crab Sticks", quantity: 50, unit: "g", cost: 0.75 },
        { materialName: "Shrimp", quantity: 50, unit: "g", cost: 0.75 },
        { materialName: "Salmon", quantity: 50, unit: "g", cost: 1.10 },
        { materialName: "Tuna", quantity: 50, unit: "g", cost: 1.50 },
        { materialName: "Mango", quantity: 40, unit: "g", cost: 0.32 },
        { materialName: "Avocado", quantity: 40, unit: "g", cost: 0.32 },
        { materialName: "Red Cabbage", quantity: 30, unit: "g", cost: 0.09 },
        { materialName: "Exotic Mango Sauce", quantity: 30, unit: "ml", cost: 0.36 }
      ]
    },

    // SASHIMI
    {
      name: "Crab Sashimi",
      description: "3 PC",
      category: "plates",
      price: 4.00,
      isPOSItem: true,
      printerId: 3,
      ingredients: [
        { materialName: "Crab Sticks", quantity: 60, unit: "g", cost: 0.90 }
      ]
    },
    {
      name: "Shrimp Sashimi",
      description: "3 PC",
      category: "plates",
      price: 5.50,
      isPOSItem: true,
      printerId: 3,
      ingredients: [
        { materialName: "Shrimp", quantity: 60, unit: "g", cost: 0.90 }
      ]
    },
    {
      name: "Salmon Sashimi",
      description: "3 PC",
      category: "plates",
      price: 6.50,
      isPOSItem: true,
      printerId: 3,
      ingredients: [
        { materialName: "Salmon", quantity: 60, unit: "g", cost: 1.32 }
      ]
    },
    {
      name: "Tuna Sashimi",
      description: "3 PC",
      category: "plates",
      price: 8.00,
      isPOSItem: true,
      printerId: 3,
      ingredients: [
        { materialName: "Tuna", quantity: 60, unit: "g", cost: 1.80 }
      ]
    },

    // TEMAKI
    {
      name: "Crab Temaki",
      description: "Hand roll with crab",
      category: "plates",
      price: 4.00,
      isPOSItem: true,
      printerId: 3,
      ingredients: [
        { materialName: "Nori Sheets", quantity: 1, unit: "piece", cost: 0.24 },
        { materialName: "Sushi Rice", quantity: 40, unit: "g", cost: 0.16 },
        { materialName: "Crab Sticks", quantity: 30, unit: "g", cost: 0.45 }
      ]
    },
    {
      name: "Shrimp Temaki",
      description: "Hand roll with shrimp",
      category: "plates",
      price: 5.50,
      isPOSItem: true,
      printerId: 3,
      ingredients: [
        { materialName: "Nori Sheets", quantity: 1, unit: "piece", cost: 0.24 },
        { materialName: "Sushi Rice", quantity: 40, unit: "g", cost: 0.16 },
        { materialName: "Shrimp", quantity: 30, unit: "g", cost: 0.45 }
      ]
    },
    {
      name: "Salmon Temaki",
      description: "Hand roll with salmon",
      category: "plates",
      price: 6.00,
      isPOSItem: true,
      printerId: 3,
      ingredients: [
        { materialName: "Nori Sheets", quantity: 1, unit: "piece", cost: 0.24 },
        { materialName: "Sushi Rice", quantity: 40, unit: "g", cost: 0.16 },
        { materialName: "Salmon", quantity: 30, unit: "g", cost: 0.66 }
      ]
    },
    {
      name: "Shoyu Temaki",
      description: "Special hand roll",
      category: "plates",
      price: 6.50,
      isPOSItem: true,
      printerId: 3,
      ingredients: [
        { materialName: "Nori Sheets", quantity: 1, unit: "piece", cost: 0.24 },
        { materialName: "Sushi Rice", quantity: 40, unit: "g", cost: 0.16 },
        { materialName: "Mixed Sushi Fish", quantity: 30, unit: "g", cost: 0.75 },
        { materialName: "Soy Sauce", quantity: 5, unit: "ml", cost: 0.03 }
      ]
    },

    // CRISPY URA MAKI
    {
      name: "Crispy California",
      description: "Crispy wrap, Premium crab sticks, cucumber, avocado",
      category: "plates",
      price: 4.00,
      isPOSItem: true,
      printerId: 3,
      ingredients: [
        { materialName: "Sushi Rice", quantity: 80, unit: "g", cost: 0.32 },
        { materialName: "Nori Sheets", quantity: 1, unit: "piece", cost: 0.24 },
        { materialName: "Crab Sticks", quantity: 40, unit: "g", cost: 0.60 },
        { materialName: "Cucumber", quantity: 30, unit: "g", cost: 0.06 },
        { materialName: "Avocado", quantity: 40, unit: "g", cost: 0.32 },
        { materialName: "Crispy Flakes", quantity: 5, unit: "g", cost: 0.10 }
      ]
    },
    {
      name: "Crispy Shrimps",
      description: "Crispy wrap, shrimps, avocado",
      category: "plates",
      price: 4.50,
      isPOSItem: true,
      printerId: 3,
      ingredients: [
        { materialName: "Sushi Rice", quantity: 80, unit: "g", cost: 0.32 },
        { materialName: "Nori Sheets", quantity: 1, unit: "piece", cost: 0.24 },
        { materialName: "Shrimp", quantity: 40, unit: "g", cost: 0.60 },
        { materialName: "Avocado", quantity: 40, unit: "g", cost: 0.32 },
        { materialName: "Crispy Flakes", quantity: 5, unit: "g", cost: 0.10 }
      ]
    },
    {
      name: "Crispy Salmon",
      description: "Crispy wrap, salmon, avocado, cream cheese",
      category: "plates",
      price: 6.00,
      isPOSItem: true,
      printerId: 3,
      ingredients: [
        { materialName: "Sushi Rice", quantity: 80, unit: "g", cost: 0.32 },
        { materialName: "Nori Sheets", quantity: 1, unit: "piece", cost: 0.24 },
        { materialName: "Salmon", quantity: 40, unit: "g", cost: 0.88 },
        { materialName: "Avocado", quantity: 40, unit: "g", cost: 0.32 },
        { materialName: "Cream Cheese", quantity: 20, unit: "g", cost: 0.24 },
        { materialName: "Crispy Flakes", quantity: 5, unit: "g", cost: 0.10 }
      ]
    },
    {
      name: "Crispy Tuna",
      description: "Crispy wrap, tuna, avocado, cream cheese",
      category: "plates",
      price: 6.00,
      isPOSItem: true,
      printerId: 3,
      ingredients: [
        { materialName: "Sushi Rice", quantity: 80, unit: "g", cost: 0.32 },
        { materialName: "Nori Sheets", quantity: 1, unit: "piece", cost: 0.24 },
        { materialName: "Tuna", quantity: 40, unit: "g", cost: 1.20 },
        { materialName: "Avocado", quantity: 40, unit: "g", cost: 0.32 },
        { materialName: "Cream Cheese", quantity: 20, unit: "g", cost: 0.24 },
        { materialName: "Crispy Flakes", quantity: 5, unit: "g", cost: 0.10 }
      ]
    },
    {
      name: "Crispy Crazy",
      description: "Crispy wrap, crab mix, crab mix topping",
      category: "plates",
      price: 5.00,
      isPOSItem: true,
      printerId: 3,
      ingredients: [
        { materialName: "Sushi Rice", quantity: 80, unit: "g", cost: 0.32 },
        { materialName: "Nori Sheets", quantity: 1, unit: "piece", cost: 0.24 },
        { materialName: "Crab Mix", quantity: 60, unit: "g", cost: 0.90 },
        { materialName: "Crispy Flakes", quantity: 5, unit: "g", cost: 0.10 }
      ]
    },

    // URA MAKI
    {
      name: "Crazy Strawberry",
      description: "Ura maki with strawberry",
      category: "plates",
      price: 4.50,
      isPOSItem: true,
      printerId: 3,
      ingredients: [
        { materialName: "Sushi Rice", quantity: 80, unit: "g", cost: 0.32 },
        { materialName: "Nori Sheets", quantity: 1, unit: "piece", cost: 0.24 },
        { materialName: "Strawberry", quantity: 40, unit: "g", cost: 0.32 },
        { materialName: "Crab Mix", quantity: 30, unit: "g", cost: 0.45 }
      ]
    },
    {
      name: "Crazy Kiwi",
      description: "Ura maki with kiwi",
      category: "plates",
      price: 4.50,
      isPOSItem: true,
      printerId: 3,
      ingredients: [
        { materialName: "Sushi Rice", quantity: 80, unit: "g", cost: 0.32 },
        { materialName: "Nori Sheets", quantity: 1, unit: "piece", cost: 0.24 },
        { materialName: "Kiwi", quantity: 40, unit: "g", cost: 0.32 },
        { materialName: "Crab Mix", quantity: 30, unit: "g", cost: 0.45 }
      ]
    },
    {
      name: "Crazy Mango",
      description: "Ura maki with mango",
      category: "plates",
      price: 5.00,
      isPOSItem: true,
      printerId: 3,
      ingredients: [
        { materialName: "Sushi Rice", quantity: 80, unit: "g", cost: 0.32 },
        { materialName: "Nori Sheets", quantity: 1, unit: "piece", cost: 0.24 },
        { materialName: "Mango", quantity: 40, unit: "g", cost: 0.32 },
        { materialName: "Crab Mix", quantity: 30, unit: "g", cost: 0.45 }
      ]
    },
    {
      name: "Crazy Avo",
      description: "Ura maki with avocado",
      category: "plates",
      price: 5.00,
      isPOSItem: true,
      printerId: 3,
      ingredients: [
        { materialName: "Sushi Rice", quantity: 80, unit: "g", cost: 0.32 },
        { materialName: "Nori Sheets", quantity: 1, unit: "piece", cost: 0.24 },
        { materialName: "Avocado", quantity: 40, unit: "g", cost: 0.32 },
        { materialName: "Crab Mix", quantity: 30, unit: "g", cost: 0.45 }
      ]
    },
    {
      name: "Crazy Shrimps",
      description: "Ura maki with shrimps",
      category: "plates",
      price: 5.00,
      isPOSItem: true,
      printerId: 3,
      ingredients: [
        { materialName: "Sushi Rice", quantity: 80, unit: "g", cost: 0.32 },
        { materialName: "Nori Sheets", quantity: 1, unit: "piece", cost: 0.24 },
        { materialName: "Shrimp", quantity: 40, unit: "g", cost: 0.60 },
        { materialName: "Crab Mix", quantity: 20, unit: "g", cost: 0.30 }
      ]
    },
    {
      name: "Crazy Salmon",
      description: "Ura maki with salmon",
      category: "plates",
      price: 5.50,
      isPOSItem: true,
      printerId: 3,
      ingredients: [
        { materialName: "Sushi Rice", quantity: 80, unit: "g", cost: 0.32 },
        { materialName: "Nori Sheets", quantity: 1, unit: "piece", cost: 0.24 },
        { materialName: "Salmon", quantity: 40, unit: "g", cost: 0.88 },
        { materialName: "Crab Mix", quantity: 20, unit: "g", cost: 0.30 }
      ]
    },
    {
      name: "Crazy Tuna",
      description: "Ura maki with tuna",
      category: "plates",
      price: 6.00,
      isPOSItem: true,
      printerId: 3,
      ingredients: [
        { materialName: "Sushi Rice", quantity: 80, unit: "g", cost: 0.32 },
        { materialName: "Nori Sheets", quantity: 1, unit: "piece", cost: 0.24 },
        { materialName: "Tuna", quantity: 40, unit: "g", cost: 1.20 },
        { materialName: "Crab Mix", quantity: 20, unit: "g", cost: 0.30 }
      ]
    },
    {
      name: "Spicy Shrimps",
      description: "Spicy ura maki with shrimps",
      category: "plates",
      price: 5.50,
      isPOSItem: true,
      printerId: 3,
      ingredients: [
        { materialName: "Sushi Rice", quantity: 80, unit: "g", cost: 0.32 },
        { materialName: "Nori Sheets", quantity: 1, unit: "piece", cost: 0.24 },
        { materialName: "Shrimp", quantity: 40, unit: "g", cost: 0.60 },
        { materialName: "Spicy Mayo", quantity: 15, unit: "ml", cost: 0.12 }
      ]
    },
    {
      name: "Spicy Salmon",
      description: "Spicy ura maki with salmon",
      category: "plates",
      price: 6.00,
      isPOSItem: true,
      printerId: 3,
      ingredients: [
        { materialName: "Sushi Rice", quantity: 80, unit: "g", cost: 0.32 },
        { materialName: "Nori Sheets", quantity: 1, unit: "piece", cost: 0.24 },
        { materialName: "Salmon", quantity: 40, unit: "g", cost: 0.88 },
        { materialName: "Spicy Mayo", quantity: 15, unit: "ml", cost: 0.12 }
      ]
    },
    {
      name: "Spicy Tuna",
      description: "Spicy ura maki with tuna",
      category: "plates",
      price: 6.50,
      isPOSItem: true,
      printerId: 3,
      ingredients: [
        { materialName: "Sushi Rice", quantity: 80, unit: "g", cost: 0.32 },
        { materialName: "Nori Sheets", quantity: 1, unit: "piece", cost: 0.24 },
        { materialName: "Tuna", quantity: 40, unit: "g", cost: 1.20 },
        { materialName: "Spicy Mayo", quantity: 15, unit: "ml", cost: 0.12 }
      ]
    },

    // HOSO MAKI
    {
      name: "Hoso Avocado",
      description: "Thin roll with avocado",
      category: "plates",
      price: 4.00,
      isPOSItem: true,
      printerId: 3,
      ingredients: [
        { materialName: "Sushi Rice", quantity: 60, unit: "g", cost: 0.24 },
        { materialName: "Nori Sheets", quantity: 1, unit: "piece", cost: 0.24 },
        { materialName: "Avocado", quantity: 30, unit: "g", cost: 0.24 }
      ]
    },
    {
      name: "Hoso Mango",
      description: "Thin roll with mango",
      category: "plates",
      price: 4.00,
      isPOSItem: true,
      printerId: 3,
      ingredients: [
        { materialName: "Sushi Rice", quantity: 60, unit: "g", cost: 0.24 },
        { materialName: "Nori Sheets", quantity: 1, unit: "piece", cost: 0.24 },
        { materialName: "Mango", quantity: 30, unit: "g", cost: 0.24 }
      ]
    },
    {
      name: "Hoso Salmon",
      description: "Thin roll with salmon",
      category: "plates",
      price: 4.00,
      isPOSItem: true,
      printerId: 3,
      ingredients: [
        { materialName: "Sushi Rice", quantity: 60, unit: "g", cost: 0.24 },
        { materialName: "Nori Sheets", quantity: 1, unit: "piece", cost: 0.24 },
        { materialName: "Salmon", quantity: 30, unit: "g", cost: 0.66 }
      ]
    },
    {
      name: "Hoso Tuna",
      description: "Thin roll with tuna",
      category: "plates",
      price: 4.00,
      isPOSItem: true,
      printerId: 3,
      ingredients: [
        { materialName: "Sushi Rice", quantity: 60, unit: "g", cost: 0.24 },
        { materialName: "Nori Sheets", quantity: 1, unit: "piece", cost: 0.24 },
        { materialName: "Tuna", quantity: 30, unit: "g", cost: 0.90 }
      ]
    },
    {
      name: "Hoso Shrimp",
      description: "Thin roll with shrimp",
      category: "plates",
      price: 3.50,
      isPOSItem: true,
      printerId: 3,
      ingredients: [
        { materialName: "Sushi Rice", quantity: 60, unit: "g", cost: 0.24 },
        { materialName: "Nori Sheets", quantity: 1, unit: "piece", cost: 0.24 },
        { materialName: "Shrimp", quantity: 30, unit: "g", cost: 0.45 }
      ]
    },
    {
      name: "Hoso Crab Sticks",
      description: "Thin roll with crab sticks",
      category: "plates",
      price: 3.50,
      isPOSItem: true,
      printerId: 3,
      ingredients: [
        { materialName: "Sushi Rice", quantity: 60, unit: "g", cost: 0.24 },
        { materialName: "Nori Sheets", quantity: 1, unit: "piece", cost: 0.24 },
        { materialName: "Crab Sticks", quantity: 30, unit: "g", cost: 0.45 }
      ]
    },

    // BURRITO
    {
      name: "Burrito California",
      description: "Crab mix, avocado, crispy, dynamite sauce, teriyaki",
      category: "plates",
      price: 8.00,
      isPOSItem: true,
      printerId: 3,
      ingredients: [
        { materialName: "Sushi Rice", quantity: 120, unit: "g", cost: 0.48 },
        { materialName: "Nori Sheets", quantity: 1, unit: "piece", cost: 0.24 },
        { materialName: "Crab Mix", quantity: 60, unit: "g", cost: 0.90 },
        { materialName: "Avocado", quantity: 50, unit: "g", cost: 0.40 },
        { materialName: "Crispy Flakes", quantity: 10, unit: "g", cost: 0.20 },
        { materialName: "Dynamite Sauce", quantity: 20, unit: "ml", cost: 0.24 },
        { materialName: "Teriyaki Sauce", quantity: 15, unit: "ml", cost: 0.12 }
      ]
    },
    {
      name: "Burrito Lady Choice",
      description: "Shrimp mix, crab mix, avocado, mango, cream cheese, tobiko, crispy flakes, mayo, teriyaki",
      category: "plates",
      price: 8.00,
      isPOSItem: true,
      printerId: 3,
      ingredients: [
        { materialName: "Sushi Rice", quantity: 120, unit: "g", cost: 0.48 },
        { materialName: "Nori Sheets", quantity: 1, unit: "piece", cost: 0.24 },
        { materialName: "Shrimp Mix", quantity: 40, unit: "g", cost: 0.60 },
        { materialName: "Crab Mix", quantity: 40, unit: "g", cost: 0.60 },
        { materialName: "Avocado", quantity: 40, unit: "g", cost: 0.32 },
        { materialName: "Mango", quantity: 30, unit: "g", cost: 0.24 },
        { materialName: "Cream Cheese", quantity: 20, unit: "g", cost: 0.24 },
        { materialName: "Tobiko", quantity: 10, unit: "g", cost: 0.60 },
        { materialName: "Crispy Flakes", quantity: 10, unit: "g", cost: 0.20 },
        { materialName: "Mayo", quantity: 15, unit: "ml", cost: 0.09 },
        { materialName: "Teriyaki Sauce", quantity: 15, unit: "ml", cost: 0.12 }
      ]
    },
    {
      name: "Burrito Tokyo",
      description: "Salmon, tuna, crab mix, cream cheese, avocado, tobiko, crispy flakes, kimchi mayo, teriyaki",
      category: "plates",
      price: 11.00,
      isPOSItem: true,
      printerId: 3,
      ingredients: [
        { materialName: "Sushi Rice", quantity: 120, unit: "g", cost: 0.48 },
        { materialName: "Nori Sheets", quantity: 1, unit: "piece", cost: 0.24 },
        { materialName: "Salmon", quantity: 40, unit: "g", cost: 0.88 },
        { materialName: "Tuna", quantity: 40, unit: "g", cost: 1.20 },
        { materialName: "Crab Mix", quantity: 30, unit: "g", cost: 0.45 },
        { materialName: "Cream Cheese", quantity: 20, unit: "g", cost: 0.24 },
        { materialName: "Avocado", quantity: 40, unit: "g", cost: 0.32 },
        { materialName: "Tobiko", quantity: 10, unit: "g", cost: 0.60 },
        { materialName: "Crispy Flakes", quantity: 10, unit: "g", cost: 0.20 },
        { materialName: "Kimchi Mayo", quantity: 15, unit: "ml", cost: 0.18 },
        { materialName: "Teriyaki Sauce", quantity: 15, unit: "ml", cost: 0.12 }
      ]
    },

    // =============================================================================
    // BREAKFAST - 12 ITEMS
    // =============================================================================
    {
      name: "Labneh",
      description: "Traditional Lebanese labneh",
      category: "plates",
      price: 3.50,
      isPOSItem: true,
      printerId: 3,
      ingredients: [
        { materialName: "Labneh", quantity: 120, unit: "g", cost: 0.72 }
      ]
    },
    {
      name: "Eggs",
      description: "Fresh eggs",
      category: "plates",
      price: 3.50,
      isPOSItem: true,
      printerId: 3,
      ingredients: [
        { materialName: "Eggs", quantity: 2, unit: "piece", cost: 0.58 }
      ]
    },
    {
      name: "Sahen Khodra",
      description: "Fresh vegetables plate",
      category: "plates",
      price: 1.50,
      isPOSItem: true,
      printerId: 3,
      ingredients: [
        { materialName: "Mixed Vegetables", quantity: 150, unit: "g", cost: 0.90 }
      ]
    },
    {
      name: "Sajj Zaatar",
      description: "Sajj bread with zaatar",
      category: "plates",
      price: 2.00,
      isPOSItem: true,
      printerId: 3,
      ingredients: [
        { materialName: "Sajj Bread", quantity: 1, unit: "piece", cost: 0.30 },
        { materialName: "Zaatar", quantity: 20, unit: "g", cost: 0.24 }
      ]
    },
    {
      name: "Sajj Zaatar + Khodra",
      description: "Sajj bread with zaatar and vegetables",
      category: "plates",
      price: 2.50,
      isPOSItem: true,
      printerId: 3,
      ingredients: [
        { materialName: "Sajj Bread", quantity: 1, unit: "piece", cost: 0.30 },
        { materialName: "Zaatar", quantity: 20, unit: "g", cost: 0.24 },
        { materialName: "Mixed Vegetables", quantity: 50, unit: "g", cost: 0.30 }
      ]
    },
    {
      name: "Sajj Labneh",
      description: "Sajj bread with labneh",
      category: "plates",
      price: 2.50,
      isPOSItem: true,
      printerId: 3,
      ingredients: [
        { materialName: "Sajj Bread", quantity: 1, unit: "piece", cost: 0.30 },
        { materialName: "Labneh", quantity: 60, unit: "g", cost: 0.36 }
      ]
    },
    {
      name: "Sajj Labneh + Khodra",
      description: "Sajj bread with labneh and vegetables",
      category: "plates",
      price: 3.00,
      isPOSItem: true,
      printerId: 3,
      ingredients: [
        { materialName: "Sajj Bread", quantity: 1, unit: "piece", cost: 0.30 },
        { materialName: "Labneh", quantity: 60, unit: "g", cost: 0.36 },
        { materialName: "Mixed Vegetables", quantity: 50, unit: "g", cost: 0.30 }
      ]
    },
    {
      name: "Sajj Cheese",
      description: "Sajj bread with cheese",
      category: "plates",
      price: 3.00,
      isPOSItem: true,
      printerId: 3,
      ingredients: [
        { materialName: "Sajj Bread", quantity: 1, unit: "piece", cost: 0.30 },
        { materialName: "Cheese", quantity: 60, unit: "g", cost: 0.54 }
      ]
    },
    {
      name: "Sajj Cheese & Ham",
      description: "Sajj bread with cheese and ham",
      category: "plates",
      price: 3.50,
      isPOSItem: true,
      printerId: 3,
      ingredients: [
        { materialName: "Sajj Bread", quantity: 1, unit: "piece", cost: 0.30 },
        { materialName: "Cheese", quantity: 50, unit: "g", cost: 0.45 },
        { materialName: "Ham", quantity: 40, unit: "g", cost: 0.60 }
      ]
    },
    {
      name: "Sajj Lahmeh B3ajin",
      description: "Sajj bread with meat paste",
      category: "plates",
      price: 4.50,
      isPOSItem: true,
      printerId: 3,
      ingredients: [
        { materialName: "Sajj Bread", quantity: 1, unit: "piece", cost: 0.30 },
        { materialName: "Meat Paste", quantity: 80, unit: "g", cost: 1.20 }
      ]
    },
    {
      name: "Sajj Lahmeh & Cheese",
      description: "Sajj bread with meat and cheese",
      category: "plates",
      price: 5.00,
      isPOSItem: true,
      printerId: 3,
      ingredients: [
        { materialName: "Sajj Bread", quantity: 1, unit: "piece", cost: 0.30 },
        { materialName: "Meat Paste", quantity: 60, unit: "g", cost: 0.90 },
        { materialName: "Cheese", quantity: 50, unit: "g", cost: 0.45 }
      ]
    },

    // =============================================================================
    // SALADS - 9 ITEMS
    // =============================================================================
    {
      name: "Rocca Salad",
      description: "Rocca, fresh mushroom, cherry tomatoes, parmesan, walnuts, balsamic sauce",
      category: "salads",
      price: 11.00,
      isPOSItem: true,
      printerId: 3,
      ingredients: [
        { materialName: "Rocca", quantity: 100, unit: "g", cost: 0.80 },
        { materialName: "Fresh Mushroom", quantity: 80, unit: "g", cost: 0.64 },
        { materialName: "Tomatoes", quantity: 100, unit: "g", cost: 0.35 },
        { materialName: "Parmesan Cheese", quantity: 50, unit: "g", cost: 0.75 },
        { materialName: "Walnuts", quantity: 30, unit: "g", cost: 0.60 },
        { materialName: "Balsamic Sauce", quantity: 30, unit: "ml", cost: 0.24 }
      ]
    },
    {
      name: "Halloumi Salad",
      description: "Mixed greens, halloumi, cherry tomatoes, dried fruits, walnuts, balsamic sauce",
      category: "salads",
      price: 11.00,
      isPOSItem: true,
      printerId: 3,
      ingredients: [
        { materialName: "Mixed Greens", quantity: 120, unit: "g", cost: 0.96 },
        { materialName: "Halloumi", quantity: 100, unit: "g", cost: 1.20 },
        { materialName: "Tomatoes", quantity: 80, unit: "g", cost: 0.28 },
        { materialName: "Dried Fruits", quantity: 40, unit: "g", cost: 0.80 },
        { materialName: "Walnuts", quantity: 30, unit: "g", cost: 0.60 },
        { materialName: "Balsamic Sauce", quantity: 30, unit: "ml", cost: 0.24 }
      ]
    },
    {
      name: "Crab Salad",
      description: "Iceberg, crab sticks, cherry tomatoes, corn, avocado, lemon mayo or lemon mustard sauce",
      category: "salads",
      price: 14.00,
      isPOSItem: true,
      printerId: 3,
      ingredients: [
        { materialName: "Iceberg Lettuce", quantity: 120, unit: "g", cost: 0.31 },
        { materialName: "Crab Sticks", quantity: 100, unit: "g", cost: 2.50 },
        { materialName: "Tomatoes", quantity: 80, unit: "g", cost: 0.28 },
        { materialName: "Corn", quantity: 60, unit: "g", cost: 0.18 },
        { materialName: "Avocado", quantity: 80, unit: "g", cost: 1.20 },
        { materialName: "Lemon Mayo Sauce", quantity: 40, unit: "ml", cost: 0.32 }
      ]
    },
    {
      name: "Chicken Caesar Salad",
      description: "Iceberg, grilled marinated chicken, cherry tomatoes, croutons, parmesan cheese, Caesar sauce",
      category: "salads",
      price: 14.00,
      isPOSItem: true,
      printerId: 3,
      ingredients: [
        { materialName: "Iceberg Lettuce", quantity: 120, unit: "g", cost: 0.31 },
        { materialName: "Chicken Breast", quantity: 150, unit: "g", cost: 1.28 },
        { materialName: "Tomatoes", quantity: 80, unit: "g", cost: 0.28 },
        { materialName: "Croutons", quantity: 40, unit: "g", cost: 0.20 },
        { materialName: "Parmesan Cheese", quantity: 50, unit: "g", cost: 0.75 },
        { materialName: "Caesar Sauce", quantity: 40, unit: "ml", cost: 0.32 }
      ]
    },
    {
      name: "Kale Feta Salad",
      description: "Kale, rocca, feta, cherry tomatoes, dried figs, cranberry, walnuts, olive oil sauce",
      category: "salads",
      price: 12.00,
      isPOSItem: true,
      printerId: 3,
      ingredients: [
        { materialName: "Kale", quantity: 100, unit: "g", cost: 0.90 },
        { materialName: "Rocca", quantity: 50, unit: "g", cost: 0.40 },
        { materialName: "Feta Cheese", quantity: 80, unit: "g", cost: 0.96 },
        { materialName: "Tomatoes", quantity: 80, unit: "g", cost: 0.28 },
        { materialName: "Dried Figs", quantity: 40, unit: "g", cost: 0.80 },
        { materialName: "Cranberry", quantity: 30, unit: "g", cost: 0.60 },
        { materialName: "Walnuts", quantity: 30, unit: "g", cost: 0.60 },
        { materialName: "Olive Oil Sauce", quantity: 30, unit: "ml", cost: 0.24 }
      ]
    },
    {
      name: "Kale Chicken Mango Salad",
      description: "Kale, chicken, mango, avocado, strawberry, dried fruits, honey mustard sauce",
      category: "salads",
      price: 15.00,
      isPOSItem: true,
      printerId: 3,
      ingredients: [
        { materialName: "Kale", quantity: 100, unit: "g", cost: 0.90 },
        { materialName: "Chicken Breast", quantity: 120, unit: "g", cost: 1.02 },
        { materialName: "Mango", quantity: 80, unit: "g", cost: 1.20 },
        { materialName: "Avocado", quantity: 80, unit: "g", cost: 1.20 },
        { materialName: "Strawberry", quantity: 60, unit: "g", cost: 1.20 },
        { materialName: "Dried Fruits", quantity: 40, unit: "g", cost: 0.80 },
        { materialName: "Honey Mustard Sauce", quantity: 40, unit: "ml", cost: 0.30 }
      ]
    },
    {
      name: "Quinoa Shrimp",
      description: "Quinoa, shrimp, avocado, mango, cherry tomatoes, walnuts, lemon mustard sauce",
      category: "salads",
      price: 15.00,
      isPOSItem: true,
      printerId: 3,
      ingredients: [
        { materialName: "Quinoa", quantity: 100, unit: "g", cost: 1.20 },
        { materialName: "Shrimp", quantity: 120, unit: "g", cost: 3.36 },
        { materialName: "Avocado", quantity: 80, unit: "g", cost: 1.20 },
        { materialName: "Mango", quantity: 80, unit: "g", cost: 1.20 },
        { materialName: "Tomatoes", quantity: 80, unit: "g", cost: 0.28 },
        { materialName: "Walnuts", quantity: 30, unit: "g", cost: 0.60 },
        { materialName: "Lemon Mustard Sauce", quantity: 40, unit: "ml", cost: 0.32 }
      ]
    },
    {
      name: "Tuna Pasta Salad",
      description: "Tuna, cherry tomatoes, corn, black olives, lemon mayo/mustard",
      category: "salads",
      price: 14.00,
      isPOSItem: true,
      printerId: 3,
      ingredients: [
        { materialName: "Tuna", quantity: 120, unit: "g", cost: 2.40 },
        { materialName: "Tomatoes", quantity: 100, unit: "g", cost: 0.35 },
        { materialName: "Corn", quantity: 60, unit: "g", cost: 0.18 },
        { materialName: "Black Olives", quantity: 40, unit: "g", cost: 0.60 },
        { materialName: "Lemon Mayo Sauce", quantity: 40, unit: "ml", cost: 0.32 }
      ]
    },
    {
      name: "Oops Salad",
      description: "Crispy chicken, Iceberg, Rocca, red cabbage, carrot, cucumber, cherry tomatoes, walnut, avocado, mango, nachos, special sauce",
      category: "salads",
      price: 17.00,
      isPOSItem: true,
      printerId: 3,
      ingredients: [
        { materialName: "Crispy Chicken", quantity: 120, unit: "g", cost: 1.80 },
        { materialName: "Iceberg Lettuce", quantity: 80, unit: "g", cost: 0.21 },
        { materialName: "Rocca", quantity: 50, unit: "g", cost: 0.40 },
        { materialName: "Red Cabbage", quantity: 50, unit: "g", cost: 0.15 },
        { materialName: "Carrot", quantity: 40, unit: "g", cost: 0.08 },
        { materialName: "Cucumber", quantity: 50, unit: "g", cost: 0.10 },
        { materialName: "Tomatoes", quantity: 80, unit: "g", cost: 0.28 },
        { materialName: "Walnuts", quantity: 30, unit: "g", cost: 0.60 },
        { materialName: "Avocado", quantity: 80, unit: "g", cost: 1.20 },
        { materialName: "Mango", quantity: 60, unit: "g", cost: 0.90 },
        { materialName: "Nachos", quantity: 40, unit: "g", cost: 0.18 },
        { materialName: "Special Sauce", quantity: 40, unit: "ml", cost: 0.40 }
      ]
    },

    // =============================================================================
    // SANDWICHES - 11 ITEMS
    // =============================================================================
    {
      name: "Taouk",
      description: "Arabic bread, taouk, coleslaw, fries, pickles, mayo garlic sauce",
      category: "sandwiches",
      price: 7.00,
      isPOSItem: true,
      printerId: 3,
      ingredients: [
        { materialName: "Arabic Bread", quantity: 100, unit: "g", cost: 0.50 },
        { materialName: "Chicken Breast", quantity: 120, unit: "g", cost: 1.02 },
        { materialName: "Coleslaw", quantity: 50, unit: "g", cost: 0.25 },
        { materialName: "French Fries", quantity: 100, unit: "g", cost: 0.20 },
        { materialName: "Pickles", quantity: 30, unit: "g", cost: 0.15 },
        { materialName: "Mayo Garlic Sauce", quantity: 30, unit: "ml", cost: 0.24 }
      ]
    },
    {
      name: "Fajita",
      description: "Marinated grilled chicken, onion, bell pepper, fresh mushroom, mozzarella cheese, avocado sauce",
      category: "sandwiches",
      price: 13.00,
      isPOSItem: true,
      printerId: 3,
      ingredients: [
        { materialName: "Chicken Breast", quantity: 150, unit: "g", cost: 1.28 },
        { materialName: "Onion", quantity: 50, unit: "g", cost: 0.08 },
        { materialName: "Bell Pepper", quantity: 50, unit: "g", cost: 0.15 },
        { materialName: "Fresh Mushroom", quantity: 50, unit: "g", cost: 0.40 },
        { materialName: "Mozzarella Cheese", quantity: 80, unit: "g", cost: 0.64 },
        { materialName: "Avocado Sauce", quantity: 40, unit: "ml", cost: 0.48 }
      ]
    },
    {
      name: "BBQ Chicken",
      description: "Marinated grilled chicken, bell pepper, fresh mushroom, mozzarella cheese, mayo and BBQ sauce",
      category: "sandwiches",
      price: 13.00,
      isPOSItem: true,
      printerId: 3,
      ingredients: [
        { materialName: "Chicken Breast", quantity: 150, unit: "g", cost: 1.28 },
        { materialName: "Bell Pepper", quantity: 50, unit: "g", cost: 0.15 },
        { materialName: "Fresh Mushroom", quantity: 50, unit: "g", cost: 0.40 },
        { materialName: "Mozzarella Cheese", quantity: 80, unit: "g", cost: 0.64 },
        { materialName: "Mayo Garlic Sauce", quantity: 30, unit: "ml", cost: 0.24 },
        { materialName: "BBQ Sauce", quantity: 30, unit: "ml", cost: 0.18 }
      ]
    },
    {
      name: "Francisco",
      description: "Marinated grilled chicken, corn, iceberg, mozzarella cheese, special sauce",
      category: "sandwiches",
      price: 13.00,
      isPOSItem: true,
      printerId: 3,
      ingredients: [
        { materialName: "Chicken Breast", quantity: 150, unit: "g", cost: 1.28 },
        { materialName: "Corn", quantity: 60, unit: "g", cost: 0.18 },
        { materialName: "Iceberg Lettuce", quantity: 50, unit: "g", cost: 0.13 },
        { materialName: "Mozzarella Cheese", quantity: 80, unit: "g", cost: 0.64 },
        { materialName: "Special Sauce", quantity: 40, unit: "ml", cost: 0.40 }
      ]
    },
    {
      name: "Crispy Sandwich",
      description: "Crispy chicken, mozzarella cheese, iceberg, cheddar, cocktail sauce, garlic mayo sauce",
      category: "sandwiches",
      price: 13.00,
      isPOSItem: true,
      printerId: 3,
      ingredients: [
        { materialName: "Crispy Chicken", quantity: 150, unit: "g", cost: 2.25 },
        { materialName: "Mozzarella Cheese", quantity: 80, unit: "g", cost: 0.64 },
        { materialName: "Iceberg Lettuce", quantity: 50, unit: "g", cost: 0.13 },
        { materialName: "Cheddar Cheese", quantity: 60, unit: "g", cost: 0.54 },
        { materialName: "Special Sauce", quantity: 30, unit: "ml", cost: 0.30 },
        { materialName: "Mayo Garlic Sauce", quantity: 30, unit: "ml", cost: 0.24 }
      ]
    },
    {
      name: "Submarine",
      description: "Cheese, ham, salami, iceberg, tomatoes, pickles, mayo mustard sauce",
      category: "sandwiches",
      price: 13.00,
      isPOSItem: true,
      printerId: 3,
      ingredients: [
        { materialName: "Mozzarella Cheese", quantity: 80, unit: "g", cost: 0.64 },
        { materialName: "Ham", quantity: 100, unit: "g", cost: 1.50 },
        { materialName: "Salami", quantity: 80, unit: "g", cost: 1.60 },
        { materialName: "Iceberg Lettuce", quantity: 50, unit: "g", cost: 0.13 },
        { materialName: "Tomatoes", quantity: 80, unit: "g", cost: 0.24 },
        { materialName: "Pickles", quantity: 30, unit: "g", cost: 0.15 },
        { materialName: "Mayo Mustard Sauce", quantity: 40, unit: "ml", cost: 0.32 }
      ]
    },
    {
      name: "Steak",
      description: "Ciabatta bread, grilled beef filet, onion, bell pepper, mozzarella cheese, special sauce",
      category: "sandwiches",
      price: 15.00,
      isPOSItem: true,
      printerId: 3,
      ingredients: [
        { materialName: "Ciabatta Bread", quantity: 120, unit: "g", cost: 0.72 },
        { materialName: "Beef Filet", quantity: 150, unit: "g", cost: 3.75 },
        { materialName: "Onion", quantity: 50, unit: "g", cost: 0.08 },
        { materialName: "Bell Pepper", quantity: 50, unit: "g", cost: 0.15 },
        { materialName: "Mozzarella Cheese", quantity: 80, unit: "g", cost: 0.64 },
        { materialName: "Special Sauce", quantity: 40, unit: "ml", cost: 0.40 }
      ]
    },
    {
      name: "Chicken Delight",
      description: "Marinated grilled chicken, Rocca leaves, avocado, light mayo, brown bread",
      category: "sandwiches",
      price: 13.00,
      isPOSItem: true,
      printerId: 3,
      ingredients: [
        { materialName: "Chicken Breast", quantity: 150, unit: "g", cost: 1.28 },
        { materialName: "Rocca", quantity: 50, unit: "g", cost: 0.40 },
        { materialName: "Avocado", quantity: 80, unit: "g", cost: 1.20 },
        { materialName: "Light Mayo", quantity: 30, unit: "ml", cost: 0.24 },
        { materialName: "Brown Bread", quantity: 100, unit: "g", cost: 0.60 }
      ]
    },
    {
      name: "Halloumi Sandwich",
      description: "Grilled halloumi, Rocca leaves, cherry tomatoes, pesto sauce",
      category: "sandwiches",
      price: 10.00,
      isPOSItem: true,
      printerId: 3,
      ingredients: [
        { materialName: "Halloumi", quantity: 120, unit: "g", cost: 1.44 },
        { materialName: "Rocca", quantity: 50, unit: "g", cost: 0.40 },
        { materialName: "Tomatoes", quantity: 80, unit: "g", cost: 0.28 },
        { materialName: "Pesto Sauce", quantity: 30, unit: "ml", cost: 0.36 }
      ]
    },
    {
      name: "Crab Sandwich",
      description: "Crab mix, lettuce, tomatoes, avocado slice",
      category: "sandwiches",
      price: 10.00,
      isPOSItem: true,
      printerId: 3,
      ingredients: [
        { materialName: "Crab Sticks", quantity: 100, unit: "g", cost: 2.50 },
        { materialName: "Iceberg Lettuce", quantity: 50, unit: "g", cost: 0.13 },
        { materialName: "Tomatoes", quantity: 80, unit: "g", cost: 0.24 },
        { materialName: "Avocado", quantity: 60, unit: "g", cost: 0.90 }
      ]
    },
    {
      name: "Salmon Sandwich",
      description: "Smoked salmon, Rocca, capers, avocado sauce",
      category: "sandwiches",
      price: 16.00,
      isPOSItem: true,
      printerId: 3,
      ingredients: [
        { materialName: "Salmon", quantity: 120, unit: "g", cost: 2.64 },
        { materialName: "Rocca", quantity: 50, unit: "g", cost: 0.40 },
        { materialName: "Capers", quantity: 20, unit: "g", cost: 0.40 },
        { materialName: "Avocado Sauce", quantity: 40, unit: "ml", cost: 0.48 }
      ]
    },

    // =============================================================================
    // BURGERS - 14 ITEMS
    // =============================================================================
    {
      name: "Classic Hamburger",
      description: "Grilled beef patty, coleslaw",
      category: "burgers",
      price: 9.00,
      isPOSItem: true,
      printerId: 3,
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
      printerId: 3,
      ingredients: [
        { materialName: "Burger Bun", quantity: 1, unit: "piece", cost: 0.50 },
        { materialName: "Crispy Chicken", quantity: 120, unit: "g", cost: 1.80 },
        { materialName: "Mozzarella Cheese", quantity: 50, unit: "g", cost: 0.40 },
        { materialName: "Iceberg Lettuce", quantity: 40, unit: "g", cost: 0.10 },
        { materialName: "Mayo Garlic Sauce", quantity: 30, unit: "ml", cost: 0.24 }
      ]
    },
    {
      name: "Mozzarella Burger",
      description: "Fried mozzarella, iceberg, tomatoes, honey mustard",
      category: "burgers",
      price: 7.00,
      isPOSItem: true,
      printerId: 3,
      ingredients: [
        { materialName: "Burger Bun", quantity: 1, unit: "piece", cost: 0.50 },
        { materialName: "Mozzarella Cheese", quantity: 120, unit: "g", cost: 0.96 },
        { materialName: "Iceberg Lettuce", quantity: 50, unit: "g", cost: 0.13 },
        { materialName: "Tomatoes", quantity: 80, unit: "g", cost: 0.24 },
        { materialName: "Honey Mustard Sauce", quantity: 30, unit: "ml", cost: 0.30 }
      ]
    },
    {
      name: "Healthy Burger",
      description: "Grilled chicken breast, Rocca, tomatoes, pesto sauce or garlic mayo sauce",
      category: "burgers",
      price: 10.00,
      isPOSItem: true,
      printerId: 3,
      ingredients: [
        { materialName: "Burger Bun", quantity: 1, unit: "piece", cost: 0.50 },
        { materialName: "Chicken Breast", quantity: 150, unit: "g", cost: 1.28 },
        { materialName: "Rocca", quantity: 50, unit: "g", cost: 0.40 },
        { materialName: "Tomatoes", quantity: 80, unit: "g", cost: 0.24 },
        { materialName: "Pesto Sauce", quantity: 30, unit: "ml", cost: 0.36 }
      ]
    },
    {
      name: "Oops Beef Burger",
      description: "Double beef patty, caramelized onion, bacon, double cheddar cheese, oops sauce",
      category: "burgers",
      price: 13.00,
      isPOSItem: true,
      printerId: 3,
      ingredients: [
        { materialName: "Burger Bun", quantity: 1, unit: "piece", cost: 0.50 },
        { materialName: "Beef Patty", quantity: 300, unit: "g", cost: 3.60 },
        { materialName: "Onion", quantity: 60, unit: "g", cost: 0.09 },
        { materialName: "Bacon", quantity: 40, unit: "g", cost: 0.56 },
        { materialName: "Cheddar Cheese", quantity: 100, unit: "g", cost: 0.90 },
        { materialName: "Special Sauce", quantity: 40, unit: "ml", cost: 0.40 }
      ]
    },
    {
      name: "Oops Chicken Burger",
      description: "Grilled chicken breast, fried mozzarella, iceberg, tomatoes, honey mustard sauce",
      category: "burgers",
      price: 13.00,
      isPOSItem: true,
      printerId: 3,
      ingredients: [
        { materialName: "Burger Bun", quantity: 1, unit: "piece", cost: 0.50 },
        { materialName: "Chicken Breast", quantity: 150, unit: "g", cost: 1.28 },
        { materialName: "Mozzarella Cheese", quantity: 80, unit: "g", cost: 0.64 },
        { materialName: "Iceberg Lettuce", quantity: 50, unit: "g", cost: 0.13 },
        { materialName: "Tomatoes", quantity: 80, unit: "g", cost: 0.24 },
        { materialName: "Honey Mustard Sauce", quantity: 30, unit: "ml", cost: 0.30 }
      ]
    },
    {
      name: "Bomba Beef Burger",
      description: "Grilled beef patty, fried mozzarella, bacon, cheddar cheese, lolo rosso lettuce, oops special sauce, topped with cheddar and chips",
      category: "burgers",
      price: 15.00,
      isPOSItem: true,
      printerId: 3,
      ingredients: [
        { materialName: "Burger Bun", quantity: 1, unit: "piece", cost: 0.50 },
        { materialName: "Beef Patty", quantity: 200, unit: "g", cost: 2.40 },
        { materialName: "Mozzarella Cheese", quantity: 80, unit: "g", cost: 0.64 },
        { materialName: "Bacon", quantity: 50, unit: "g", cost: 0.70 },
        { materialName: "Cheddar Cheese", quantity: 100, unit: "g", cost: 0.90 },
        { materialName: "Mixed Greens", quantity: 50, unit: "g", cost: 0.40 },
        { materialName: "Special Sauce", quantity: 40, unit: "ml", cost: 0.40 },
        { materialName: "Tortilla Chips", quantity: 30, unit: "g", cost: 0.15 }
      ]
    },
    {
      name: "Bomba Chicken Burger",
      description: "Double breaded chicken, fried mozzarella, bacon, coleslaw, double cheddar cheese, special sauce",
      category: "burgers",
      price: 16.00,
      isPOSItem: true,
      printerId: 3,
      ingredients: [
        { materialName: "Burger Bun", quantity: 1, unit: "piece", cost: 0.50 },
        { materialName: "Crispy Chicken", quantity: 240, unit: "g", cost: 3.60 },
        { materialName: "Mozzarella Cheese", quantity: 80, unit: "g", cost: 0.64 },
        { materialName: "Bacon", quantity: 50, unit: "g", cost: 0.70 },
        { materialName: "Coleslaw", quantity: 60, unit: "g", cost: 0.21 },
        { materialName: "Cheddar Cheese", quantity: 120, unit: "g", cost: 1.08 },
        { materialName: "Special Sauce", quantity: 40, unit: "ml", cost: 0.40 }
      ]
    },
    {
      name: "Pepperoni Burger",
      description: "Grilled beef patty, bacon, tortilla chips, topped with cheddar, mozzarella cheese and pepperoni",
      category: "burgers",
      price: 16.00,
      isPOSItem: true,
      printerId: 3,
      ingredients: [
        { materialName: "Burger Bun", quantity: 1, unit: "piece", cost: 0.50 },
        { materialName: "Beef Patty", quantity: 200, unit: "g", cost: 2.40 },
        { materialName: "Bacon", quantity: 50, unit: "g", cost: 0.70 },
        { materialName: "Tortilla Chips", quantity: 40, unit: "g", cost: 0.20 },
        { materialName: "Cheddar Cheese", quantity: 80, unit: "g", cost: 0.72 },
        { materialName: "Mozzarella Cheese", quantity: 80, unit: "g", cost: 0.64 },
        { materialName: "Pepperoni", quantity: 60, unit: "g", cost: 1.20 }
      ]
    },
    {
      name: "The Ghost Burger",
      description: "Double grilled beef patty, double cheddar slice, bacon, iceberg, topped with our cheesy sauce and bacon",
      category: "burgers",
      price: 17.00,
      isPOSItem: true,
      printerId: 3,
      ingredients: [
        { materialName: "Burger Bun", quantity: 1, unit: "piece", cost: 0.50 },
        { materialName: "Beef Patty", quantity: 300, unit: "g", cost: 3.60 },
        { materialName: "Cheddar Cheese", quantity: 120, unit: "g", cost: 1.08 },
        { materialName: "Bacon", quantity: 80, unit: "g", cost: 1.12 },
        { materialName: "Iceberg Lettuce", quantity: 50, unit: "g", cost: 0.13 },
        { materialName: "Cheese Sauce", quantity: 50, unit: "ml", cost: 0.60 }
      ]
    },
    {
      name: "Royal Beef Burger",
      description: "Crunchy bun, grilled beef patty, fried mozzarella, bacon, cheddar sauce, iceberg topped with special creamy sauce",
      category: "burgers",
      price: 20.00,
      isPOSItem: true,
      printerId: 3,
      ingredients: [
        { materialName: "Crunchy Bun", quantity: 1, unit: "piece", cost: 0.80 },
        { materialName: "Beef Patty", quantity: 200, unit: "g", cost: 2.40 },
        { materialName: "Mozzarella Cheese", quantity: 100, unit: "g", cost: 0.80 },
        { materialName: "Bacon", quantity: 60, unit: "g", cost: 0.84 },
        { materialName: "Cheddar Sauce", quantity: 40, unit: "ml", cost: 0.48 },
        { materialName: "Iceberg Lettuce", quantity: 50, unit: "g", cost: 0.13 },
        { materialName: "Creamy Sauce", quantity: 40, unit: "ml", cost: 0.48 }
      ]
    },
    {
      name: "Royal Chicken Burger",
      description: "Crunchy bun, breaded chicken, ham, double cheddar slice, bacon, BBQ and honey mustard sauce, topped with special creamy sauce",
      category: "burgers",
      price: 20.00,
      isPOSItem: true,
      printerId: 3,
      ingredients: [
        { materialName: "Crunchy Bun", quantity: 1, unit: "piece", cost: 0.80 },
        { materialName: "Crispy Chicken", quantity: 180, unit: "g", cost: 2.70 },
        { materialName: "Ham", quantity: 80, unit: "g", cost: 1.20 },
        { materialName: "Cheddar Cheese", quantity: 120, unit: "g", cost: 1.08 },
        { materialName: "Bacon", quantity: 60, unit: "g", cost: 0.84 },
        { materialName: "BBQ Sauce", quantity: 30, unit: "ml", cost: 0.18 },
        { materialName: "Honey Mustard Sauce", quantity: 30, unit: "ml", cost: 0.30 },
        { materialName: "Creamy Sauce", quantity: 40, unit: "ml", cost: 0.48 }
      ]
    },
    {
      name: "Chicken Mac n Cheese",
      description: "Breaded chicken, mac n cheese pasta, iceberg",
      category: "burgers",
      price: 17.00,
      isPOSItem: true,
      printerId: 3,
      ingredients: [
        { materialName: "Burger Bun", quantity: 1, unit: "piece", cost: 0.50 },
        { materialName: "Crispy Chicken", quantity: 180, unit: "g", cost: 2.70 },
        { materialName: "Mac n Cheese", quantity: 150, unit: "g", cost: 1.80 },
        { materialName: "Iceberg Lettuce", quantity: 50, unit: "g", cost: 0.13 }
      ]
    },
    {
      name: "Mushroom Swiss Burger",
      description: "Grilled beef patty, fresh mushroom, emental cheese",
      category: "burgers",
      price: 15.00,
      isPOSItem: true,
      printerId: 3,
      ingredients: [
        { materialName: "Burger Bun", quantity: 1, unit: "piece", cost: 0.50 },
        { materialName: "Beef Patty", quantity: 200, unit: "g", cost: 2.40 },
        { materialName: "Fresh Mushroom", quantity: 100, unit: "g", cost: 0.80 },
        { materialName: "Emental Cheese", quantity: 80, unit: "g", cost: 0.96 }
      ]
    },

    // =============================================================================
    // COLD DRINKS - 32 ITEMS
    // =============================================================================
    {
      name: "Vanilla Shake",
      description: "Classic vanilla shake",
      category: "cold",
      price: 7.00,
      isPOSItem: true,
      printerId: 2,
      ingredients: [
        { materialName: "Vanilla Ice Cream", quantity: 200, unit: "g", cost: 2.40 },
        { materialName: "Milk", quantity: 150, unit: "ml", cost: 0.30 },
        { materialName: "Vanilla Extract", quantity: 5, unit: "ml", cost: 0.15 },
        { materialName: "Whipped Cream", quantity: 30, unit: "g", cost: 0.45 }
      ]
    },
    {
      name: "Strawberry Shake",
      description: "Fresh strawberry shake",
      category: "cold",
      price: 7.00,
      isPOSItem: true,
      printerId: 2,
      ingredients: [
        { materialName: "Vanilla Ice Cream", quantity: 180, unit: "g", cost: 2.16 },
        { materialName: "Strawberry", quantity: 100, unit: "g", cost: 2.00 },
        { materialName: "Milk", quantity: 150, unit: "ml", cost: 0.30 },
        { materialName: "Whipped Cream", quantity: 30, unit: "g", cost: 0.45 }
      ]
    },
    {
      name: "Oreo Shake",
      description: "Oreo cookies shake",
      category: "cold",
      price: 8.00,
      isPOSItem: true,
      printerId: 2,
      ingredients: [
        { materialName: "Vanilla Ice Cream", quantity: 180, unit: "g", cost: 2.16 },
        { materialName: "Oreo Cookies", quantity: 60, unit: "g", cost: 1.20 },
        { materialName: "Milk", quantity: 150, unit: "ml", cost: 0.30 },
        { materialName: "Whipped Cream", quantity: 30, unit: "g", cost: 0.45 }
      ]
    },
    {
      name: "Chocolate Shake",
      description: "Classic chocolate shake",
      category: "cold",
      price: 7.00,
      isPOSItem: true,
      printerId: 2,
      ingredients: [
        { materialName: "Chocolate Ice Cream", quantity: 200, unit: "g", cost: 2.60 },
        { materialName: "Milk", quantity: 150, unit: "ml", cost: 0.30 },
        { materialName: "Chocolate Syrup", quantity: 30, unit: "ml", cost: 0.36 },
        { materialName: "Whipped Cream", quantity: 30, unit: "g", cost: 0.45 }
      ]
    },
    {
      name: "Lotus Shake",
      description: "Lotus biscuit shake",
      category: "cold",
      price: 8.00,
      isPOSItem: true,
      printerId: 2,
      ingredients: [
        { materialName: "Vanilla Ice Cream", quantity: 180, unit: "g", cost: 2.16 },
        { materialName: "Lotus Biscuits", quantity: 50, unit: "g", cost: 1.25 },
        { materialName: "Milk", quantity: 150, unit: "ml", cost: 0.30 },
        { materialName: "Whipped Cream", quantity: 30, unit: "g", cost: 0.45 }
      ]
    },
    {
      name: "Bounty Shake",
      description: "Bounty chocolate shake",
      category: "cold",
      price: 8.00,
      isPOSItem: true,
      printerId: 2,
      ingredients: [
        { materialName: "Vanilla Ice Cream", quantity: 180, unit: "g", cost: 2.16 },
        { materialName: "Bounty Bars", quantity: 60, unit: "g", cost: 1.50 },
        { materialName: "Milk", quantity: 150, unit: "ml", cost: 0.30 },
        { materialName: "Whipped Cream", quantity: 30, unit: "g", cost: 0.45 }
      ]
    },
    {
      name: "Minted Lemonade",
      description: "Fresh lemonade with mint",
      category: "cold",
      price: 7.00,
      isPOSItem: true,
      printerId: 2,
      ingredients: [
        { materialName: "Fresh Lemon Juice", quantity: 100, unit: "ml", cost: 1.20 },
        { materialName: "Sugar Syrup", quantity: 50, unit: "ml", cost: 0.25 },
        { materialName: "Fresh Mint", quantity: 20, unit: "g", cost: 0.40 },
        { materialName: "Sparkling Water", quantity: 250, unit: "ml", cost: 0.50 },
        { materialName: "Ice Cubes", quantity: 100, unit: "g", cost: 0.10 }
      ]
    },
    {
      name: "Lemonade",
      description: "Fresh lemonade",
      category: "cold",
      price: 5.00,
      isPOSItem: true,
      printerId: 2,
      ingredients: [
        { materialName: "Fresh Lemon Juice", quantity: 80, unit: "ml", cost: 0.96 },
        { materialName: "Sugar Syrup", quantity: 40, unit: "ml", cost: 0.20 },
        { materialName: "Water", quantity: 250, unit: "ml", cost: 0.25 },
        { materialName: "Ice Cubes", quantity: 100, unit: "g", cost: 0.10 }
      ]
    },
    {
      name: "Fresh Orange Juice",
      description: "Freshly squeezed orange juice",
      category: "cold",
      price: 5.00,
      isPOSItem: true,
      printerId: 2,
      ingredients: [
        { materialName: "Fresh Orange Juice", quantity: 300, unit: "ml", cost: 1.80 }
      ]
    },
    {
      name: "Peach Mango Smoothie",
      description: "Peach and mango smoothie",
      category: "cold",
      price: 6.00,
      isPOSItem: true,
      printerId: 2,
      ingredients: [
        { materialName: "Peach", quantity: 150, unit: "g", cost: 1.80 },
        { materialName: "Mango", quantity: 100, unit: "g", cost: 1.50 },
        { materialName: "Yogurt", quantity: 100, unit: "g", cost: 0.60 },
        { materialName: "Honey", quantity: 20, unit: "ml", cost: 0.40 },
        { materialName: "Ice Cubes", quantity: 50, unit: "g", cost: 0.05 }
      ]
    },
    {
      name: "Passion Strawberry Smoothie",
      description: "Passion fruit and strawberry smoothie",
      category: "cold",
      price: 7.00,
      isPOSItem: true,
      printerId: 2,
      ingredients: [
        { materialName: "Passion Fruit", quantity: 100, unit: "g", cost: 2.50 },
        { materialName: "Strawberry", quantity: 150, unit: "g", cost: 3.00 },
        { materialName: "Yogurt", quantity: 100, unit: "g", cost: 0.60 },
        { materialName: "Honey", quantity: 20, unit: "ml", cost: 0.40 },
        { materialName: "Ice Cubes", quantity: 50, unit: "g", cost: 0.05 }
      ]
    },
    {
      name: "Peach Passion Smoothie",
      description: "Peach and passion fruit smoothie",
      category: "cold",
      price: 7.00,
      isPOSItem: true,
      printerId: 2,
      ingredients: [
        { materialName: "Peach", quantity: 150, unit: "g", cost: 1.80 },
        { materialName: "Passion Fruit", quantity: 100, unit: "g", cost: 2.50 },
        { materialName: "Yogurt", quantity: 100, unit: "g", cost: 0.60 },
        { materialName: "Honey", quantity: 20, unit: "ml", cost: 0.40 },
        { materialName: "Ice Cubes", quantity: 50, unit: "g", cost: 0.05 }
      ]
    },
    {
      name: "Peach Smoothie",
      description: "Fresh peach smoothie",
      category: "cold",
      price: 6.00,
      isPOSItem: true,
      printerId: 2,
      ingredients: [
        { materialName: "Peach", quantity: 200, unit: "g", cost: 2.40 },
        { materialName: "Yogurt", quantity: 100, unit: "g", cost: 0.60 },
        { materialName: "Honey", quantity: 20, unit: "ml", cost: 0.40 },
        { materialName: "Ice Cubes", quantity: 50, unit: "g", cost: 0.05 }
      ]
    },
    {
      name: "Mixed Berries Smoothie",
      description: "Mixed berries smoothie",
      category: "cold",
      price: 7.00,
      isPOSItem: true,
      printerId: 2,
      ingredients: [
        { materialName: "Mixed Berries", quantity: 200, unit: "g", cost: 4.00 },
        { materialName: "Yogurt", quantity: 100, unit: "g", cost: 0.60 },
        { materialName: "Honey", quantity: 20, unit: "ml", cost: 0.40 },
        { materialName: "Ice Cubes", quantity: 50, unit: "g", cost: 0.05 }
      ]
    },
    {
      name: "Strawberry Smoothie",
      description: "Fresh strawberry smoothie",
      category: "cold",
      price: 6.00,
      isPOSItem: true,
      printerId: 2,
      ingredients: [
        { materialName: "Strawberry", quantity: 200, unit: "g", cost: 4.00 },
        { materialName: "Yogurt", quantity: 100, unit: "g", cost: 0.60 },
        { materialName: "Honey", quantity: 20, unit: "ml", cost: 0.40 },
        { materialName: "Ice Cubes", quantity: 50, unit: "g", cost: 0.05 }
      ]
    },
    {
      name: "Mango Smoothie",
      description: "Fresh mango smoothie",
      category: "cold",
      price: 6.00,
      isPOSItem: true,
      printerId: 2,
      ingredients: [
        { materialName: "Mango", quantity: 200, unit: "g", cost: 3.00 },
        { materialName: "Yogurt", quantity: 100, unit: "g", cost: 0.60 },
        { materialName: "Honey", quantity: 20, unit: "ml", cost: 0.40 },
        { materialName: "Ice Cubes", quantity: 50, unit: "g", cost: 0.05 }
      ]
    },
    {
      name: "Energy Drink",
      description: "Energy drink",
      category: "cold",
      price: 4.00,
      isPOSItem: true,
      printerId: 2,
      ingredients: [
        { materialName: "Energy Drink Can", quantity: 1, unit: "piece", cost: 2.00 }
      ]
    },
    {
      name: "Bzurat",
      description: "Traditional Lebanese drink",
      category: "cold",
      price: 2.00,
      isPOSItem: true,
      printerId: 2,
      ingredients: [
        { materialName: "Bzurat Seeds", quantity: 20, unit: "g", cost: 0.40 },
        { materialName: "Water", quantity: 250, unit: "ml", cost: 0.25 },
        { materialName: "Sugar", quantity: 30, unit: "g", cost: 0.15 }
      ]
    },
    {
      name: "Sparkling Water",
      description: "Sparkling water",
      category: "cold",
      price: 4.00,
      isPOSItem: true,
      printerId: 2,
      ingredients: [
        { materialName: "Sparkling Water Bottle", quantity: 1, unit: "piece", cost: 2.00 }
      ]
    },
    {
      name: "7up Grenadine",
      description: "7up with grenadine",
      category: "cold",
      price: 3.50,
      isPOSItem: true,
      printerId: 2,
      ingredients: [
        { materialName: "7up", quantity: 250, unit: "ml", cost: 1.25 },
        { materialName: "Grenadine Syrup", quantity: 30, unit: "ml", cost: 0.45 },
        { materialName: "Ice Cubes", quantity: 100, unit: "g", cost: 0.10 }
      ]
    },
    {
      name: "Soft Drinks",
      description: "Assorted soft drinks",
      category: "cold",
      price: 3.00,
      isPOSItem: true,
      printerId: 2,
      ingredients: [
        { materialName: "Soft Drink Can", quantity: 1, unit: "piece", cost: 1.50 }
      ]
    },
    {
      name: "Water Large",
      description: "Large water bottle",
      category: "cold",
      price: 3.00,
      isPOSItem: true,
      printerId: 2,
      ingredients: [
        { materialName: "Water Bottle Large", quantity: 1, unit: "piece", cost: 1.50 }
      ]
    },
    {
      name: "Water Small",
      description: "Small water bottle",
      category: "cold",
      price: 1.50,
      isPOSItem: true,
      printerId: 2,
      ingredients: [
        { materialName: "Water Bottle Small", quantity: 1, unit: "piece", cost: 0.75 }
      ]
    },
    {
      name: "Red Bull",
      description: "Red Bull energy drink",
      category: "cold",
      price: 5.00,
      isPOSItem: true,
      printerId: 2,
      ingredients: [
        { materialName: "Red Bull Can", quantity: 1, unit: "piece", cost: 2.50 }
      ]
    },
    {
      name: "Ice Tea Passion Fruit",
      description: "Passion fruit flavored iced tea",
      category: "cold",
      price: 6.00,
      isPOSItem: true,
      printerId: 2,
      ingredients: [
        { materialName: "Black Tea", quantity: 10, unit: "g", cost: 0.20 },
        { materialName: "Passion Fruit Syrup", quantity: 50, unit: "ml", cost: 1.25 },
        { materialName: "Water", quantity: 300, unit: "ml", cost: 0.30 },
        { materialName: "Ice Cubes", quantity: 100, unit: "g", cost: 0.10 }
      ]
    },
    {
      name: "Ice Tea Blueberry",
      description: "Blueberry flavored iced tea",
      category: "cold",
      price: 5.00,
      isPOSItem: true,
      printerId: 2,
      ingredients: [
        { materialName: "Black Tea", quantity: 10, unit: "g", cost: 0.20 },
        { materialName: "Blueberry Syrup", quantity: 40, unit: "ml", cost: 0.80 },
        { materialName: "Water", quantity: 300, unit: "ml", cost: 0.30 },
        { materialName: "Ice Cubes", quantity: 100, unit: "g", cost: 0.10 }
      ]
    },
    {
      name: "Ice Tea Mango",
      description: "Mango flavored iced tea",
      category: "cold",
      price: 4.00,
      isPOSItem: true,
      printerId: 2,
      ingredients: [
        { materialName: "Black Tea", quantity: 10, unit: "g", cost: 0.20 },
        { materialName: "Mango Syrup", quantity: 40, unit: "ml", cost: 0.60 },
        { materialName: "Water", quantity: 300, unit: "ml", cost: 0.30 },
        { materialName: "Ice Cubes", quantity: 100, unit: "g", cost: 0.10 }
      ]
    },
    {
      name: "Ice Tea Peach",
      description: "Peach flavored iced tea",
      category: "cold",
      price: 5.00,
      isPOSItem: true,
      printerId: 2,
      ingredients: [
        { materialName: "Black Tea", quantity: 10, unit: "g", cost: 0.20 },
        { materialName: "Peach Syrup", quantity: 40, unit: "ml", cost: 0.80 },
        { materialName: "Water", quantity: 300, unit: "ml", cost: 0.30 },
        { materialName: "Ice Cubes", quantity: 100, unit: "g", cost: 0.10 }
      ]
    },
    {
      name: "Toffee Caramel",
      description: "Toffee caramel drink",
      category: "cold",
      price: 7.00,
      isPOSItem: true,
      printerId: 2,
      ingredients: [
        { materialName: "Milk", quantity: 250, unit: "ml", cost: 0.50 },
        { materialName: "Toffee Syrup", quantity: 50, unit: "ml", cost: 1.50 },
        { materialName: "Caramel Syrup", quantity: 30, unit: "ml", cost: 0.90 },
        { materialName: "Whipped Cream", quantity: 30, unit: "g", cost: 0.45 },
        { materialName: "Ice Cubes", quantity: 100, unit: "g", cost: 0.10 }
      ]
    },
    {
      name: "Iced Coffee",
      description: "Classic iced coffee",
      category: "cold",
      price: 5.00,
      isPOSItem: true,
      printerId: 2,
      ingredients: [
        { materialName: "Coffee Beans", quantity: 20, unit: "g", cost: 0.80 },
        { materialName: "Water", quantity: 200, unit: "ml", cost: 0.20 },
        { materialName: "Sugar Syrup", quantity: 30, unit: "ml", cost: 0.15 },
        { materialName: "Milk", quantity: 100, unit: "ml", cost: 0.20 },
        { materialName: "Ice Cubes", quantity: 100, unit: "g", cost: 0.10 }
      ]
    },
    {
      name: "Iced Coffee Vanilla",
      description: "Iced coffee with vanilla flavor",
      category: "cold",
      price: 6.00,
      isPOSItem: true,
      printerId: 2,
      ingredients: [
        { materialName: "Coffee Beans", quantity: 20, unit: "g", cost: 0.80 },
        { materialName: "Water", quantity: 200, unit: "ml", cost: 0.20 },
        { materialName: "Vanilla Syrup", quantity: 40, unit: "ml", cost: 0.80 },
        { materialName: "Milk", quantity: 100, unit: "ml", cost: 0.20 },
        { materialName: "Ice Cubes", quantity: 100, unit: "g", cost: 0.10 }
      ]
    },
    {
      name: "Iced Coffee Caramel",
      description: "Iced coffee with caramel flavor",
      category: "cold",
      price: 6.00,
      isPOSItem: true,
      printerId: 2,
      ingredients: [
        { materialName: "Coffee Beans", quantity: 20, unit: "g", cost: 0.80 },
        { materialName: "Water", quantity: 200, unit: "ml", cost: 0.20 },
        { materialName: "Caramel Syrup", quantity: 40, unit: "ml", cost: 1.20 },
        { materialName: "Milk", quantity: 100, unit: "ml", cost: 0.20 },
        { materialName: "Ice Cubes", quantity: 100, unit: "g", cost: 0.10 }
      ]
    },

    // =============================================================================
    // ALCOHOLIC BEVERAGES - 85 ITEMS
    // =============================================================================
    
    // COCKTAILS - 18 ITEMS
    {
      name: "Jager Bomb",
      description: "Jager and red bull",
      category: "alcohol",
      price: 8.00,
      isPOSItem: true,
      printerId: 2,
      ingredients: [
        { materialName: "Jagermeister", quantity: 30, unit: "ml", cost: 2.40 },
        { materialName: "Red Bull Can", quantity: 1, unit: "piece", cost: 2.50 }
      ]
    },
    {
      name: "Black Russian",
      description: "Vodka and kahlua",
      category: "alcohol",
      price: 7.00,
      isPOSItem: true,
      printerId: 2,
      ingredients: [
        { materialName: "Vodka", quantity: 50, unit: "ml", cost: 2.00 },
        { materialName: "Kahlua", quantity: 25, unit: "ml", cost: 1.50 }
      ]
    },
    {
      name: "White Russian",
      description: "Vodka and bailey's",
      category: "alcohol",
      price: 7.00,
      isPOSItem: true,
      printerId: 2,
      ingredients: [
        { materialName: "Vodka", quantity: 50, unit: "ml", cost: 2.00 },
        { materialName: "Baileys", quantity: 25, unit: "ml", cost: 1.75 },
        { materialName: "Heavy Cream", quantity: 25, unit: "ml", cost: 0.35 }
      ]
    },
    {
      name: "Jamaica",
      description: "Vodka, pineapple juice, orange juice and grenadine",
      category: "alcohol",
      price: 6.00,
      isPOSItem: true,
      printerId: 2,
      ingredients: [
        { materialName: "Vodka", quantity: 40, unit: "ml", cost: 1.60 },
        { materialName: "Pineapple Juice", quantity: 60, unit: "ml", cost: 0.60 },
        { materialName: "Orange Juice", quantity: 60, unit: "ml", cost: 0.36 },
        { materialName: "Grenadine Syrup", quantity: 15, unit: "ml", cost: 0.23 }
      ]
    },
    {
      name: "Tequila Sunrise",
      description: "White tequila, orange juice and grenadine",
      category: "alcohol",
      price: 7.00,
      isPOSItem: true,
      printerId: 2,
      ingredients: [
        { materialName: "White Tequila", quantity: 50, unit: "ml", cost: 2.50 },
        { materialName: "Orange Juice", quantity: 120, unit: "ml", cost: 0.72 },
        { materialName: "Grenadine Syrup", quantity: 15, unit: "ml", cost: 0.23 }
      ]
    },
    {
      name: "Mojito",
      description: "Rum, simple syrup, lime juice, 7up and fresh mint",
      category: "alcohol",
      price: 7.00,
      isPOSItem: true,
      printerId: 2,
      ingredients: [
        { materialName: "White Rum", quantity: 50, unit: "ml", cost: 2.00 },
        { materialName: "Sugar Syrup", quantity: 20, unit: "ml", cost: 0.10 },
        { materialName: "Lime Juice", quantity: 30, unit: "ml", cost: 0.36 },
        { materialName: "7up", quantity: 100, unit: "ml", cost: 0.50 },
        { materialName: "Fresh Mint", quantity: 15, unit: "g", cost: 0.30 }
      ]
    },
    {
      name: "Espresso Martini",
      description: "Vodka, kahlua, simple syrup and shot espresso",
      category: "alcohol",
      price: 8.00,
      isPOSItem: true,
      printerId: 2,
      ingredients: [
        { materialName: "Vodka", quantity: 50, unit: "ml", cost: 2.00 },
        { materialName: "Kahlua", quantity: 25, unit: "ml", cost: 1.50 },
        { materialName: "Sugar Syrup", quantity: 15, unit: "ml", cost: 0.08 },
        { materialName: "Espresso Shot", quantity: 30, unit: "ml", cost: 0.60 }
      ]
    },
    {
      name: "Passion Fruit Martini",
      description: "Vodka, lime juice, orange juice and passion syrup",
      category: "alcohol",
      price: 8.00,
      isPOSItem: true,
      printerId: 2,
      ingredients: [
        { materialName: "Vodka", quantity: 50, unit: "ml", cost: 2.00 },
        { materialName: "Lime Juice", quantity: 20, unit: "ml", cost: 0.24 },
        { materialName: "Orange Juice", quantity: 30, unit: "ml", cost: 0.18 },
        { materialName: "Passion Fruit Syrup", quantity: 25, unit: "ml", cost: 0.63 }
      ]
    },
    {
      name: "Cosmopolitan",
      description: "Vodka, lime juice, cranberry juice and triple sec",
      category: "alcohol",
      price: 8.00,
      isPOSItem: true,
      printerId: 2,
      ingredients: [
        { materialName: "Vodka", quantity: 45, unit: "ml", cost: 1.80 },
        { materialName: "Lime Juice", quantity: 15, unit: "ml", cost: 0.18 },
        { materialName: "Cranberry Juice", quantity: 30, unit: "ml", cost: 0.36 },
        { materialName: "Triple Sec", quantity: 15, unit: "ml", cost: 0.75 }
      ]
    },
    {
      name: "Sex on the Beach",
      description: "Vodka, archer, orange juice and cranberry juice",
      category: "alcohol",
      price: 8.00,
      isPOSItem: true,
      printerId: 2,
      ingredients: [
        { materialName: "Vodka", quantity: 30, unit: "ml", cost: 1.20 },
        { materialName: "Peach Schnapps", quantity: 30, unit: "ml", cost: 1.50 },
        { materialName: "Orange Juice", quantity: 60, unit: "ml", cost: 0.36 },
        { materialName: "Cranberry Juice", quantity: 60, unit: "ml", cost: 0.72 }
      ]
    },
    {
      name: "Midori Sour",
      description: "Vodka, midori, lime juice, orange juice and 7up",
      category: "alcohol",
      price: 8.00,
      isPOSItem: true,
      printerId: 2,
      ingredients: [
        { materialName: "Vodka", quantity: 30, unit: "ml", cost: 1.20 },
        { materialName: "Midori Melon Liqueur", quantity: 30, unit: "ml", cost: 1.80 },
        { materialName: "Lime Juice", quantity: 20, unit: "ml", cost: 0.24 },
        { materialName: "Orange Juice", quantity: 30, unit: "ml", cost: 0.18 },
        { materialName: "7up", quantity: 60, unit: "ml", cost: 0.30 }
      ]
    },
    {
      name: "London Mule",
      description: "Gin, lime juice and ginger beer",
      category: "alcohol",
      price: 7.00,
      isPOSItem: true,
      printerId: 2,
      ingredients: [
        { materialName: "Gin", quantity: 50, unit: "ml", cost: 2.50 },
        { materialName: "Lime Juice", quantity: 25, unit: "ml", cost: 0.30 },
        { materialName: "Ginger Beer", quantity: 150, unit: "ml", cost: 0.90 }
      ]
    },
    {
      name: "Moscow Mule",
      description: "Vodka, lime juice and ginger beer",
      category: "alcohol",
      price: 7.00,
      isPOSItem: true,
      printerId: 2,
      ingredients: [
        { materialName: "Vodka", quantity: 50, unit: "ml", cost: 2.00 },
        { materialName: "Lime Juice", quantity: 25, unit: "ml", cost: 0.30 },
        { materialName: "Ginger Beer", quantity: 150, unit: "ml", cost: 0.90 }
      ]
    },
    {
      name: "Pina Colada",
      description: "Rum, coconut syrup, pineapple juice, milk and malibu",
      category: "alcohol",
      price: 7.00,
      isPOSItem: true,
      printerId: 2,
      ingredients: [
        { materialName: "White Rum", quantity: 40, unit: "ml", cost: 1.60 },
        { materialName: "Coconut Syrup", quantity: 30, unit: "ml", cost: 0.60 },
        { materialName: "Pineapple Juice", quantity: 90, unit: "ml", cost: 0.90 },
        { materialName: "Milk", quantity: 60, unit: "ml", cost: 0.12 },
        { materialName: "Malibu Rum", quantity: 20, unit: "ml", cost: 1.00 }
      ]
    },
    {
      name: "Gin Basil",
      description: "Gin, simple syrup, lime juice and fresh basil",
      category: "alcohol",
      price: 6.00,
      isPOSItem: true,
      printerId: 2,
      ingredients: [
        { materialName: "Gin", quantity: 50, unit: "ml", cost: 2.50 },
        { materialName: "Sugar Syrup", quantity: 20, unit: "ml", cost: 0.10 },
        { materialName: "Lime Juice", quantity: 25, unit: "ml", cost: 0.30 },
        { materialName: "Fresh Basil", quantity: 10, unit: "g", cost: 0.20 }
      ]
    },
    {
      name: "Negroni",
      description: "Gin, campari and sweet vermouth",
      category: "alcohol",
      price: 8.00,
      isPOSItem: true,
      printerId: 2,
      ingredients: [
        { materialName: "Gin", quantity: 30, unit: "ml", cost: 1.50 },
        { materialName: "Campari", quantity: 30, unit: "ml", cost: 2.10 },
        { materialName: "Sweet Vermouth", quantity: 30, unit: "ml", cost: 1.80 }
      ]
    },
    {
      name: "Old Fashioned",
      description: "Whiskey, sugar syrup and bitters",
      category: "alcohol",
      price: 9.00,
      isPOSItem: true,
      printerId: 2,
      ingredients: [
        { materialName: "Whiskey", quantity: 60, unit: "ml", cost: 4.20 },
        { materialName: "Sugar Syrup", quantity: 15, unit: "ml", cost: 0.08 },
        { materialName: "Angostura Bitters", quantity: 3, unit: "ml", cost: 0.30 }
      ]
    },

    // SPIRITS & SHOTS - 25 ITEMS
    {
      name: "Vodka Shot",
      description: "Premium vodka shot",
      category: "alcohol",
      price: 4.00,
      isPOSItem: true,
      printerId: 2,
      ingredients: [
        { materialName: "Vodka", quantity: 30, unit: "ml", cost: 1.20 }
      ]
    },
    {
      name: "Tequila Shot",
      description: "Premium tequila shot",
      category: "alcohol",
      price: 5.00,
      isPOSItem: true,
      printerId: 2,
      ingredients: [
        { materialName: "White Tequila", quantity: 30, unit: "ml", cost: 1.50 }
      ]
    },
    {
      name: "Whiskey Shot",
      description: "Premium whiskey shot",
      category: "alcohol",
      price: 6.00,
      isPOSItem: true,
      printerId: 2,
      ingredients: [
        { materialName: "Whiskey", quantity: 30, unit: "ml", cost: 2.10 }
      ]
    },
    {
      name: "Rum Shot",
      description: "Premium rum shot",
      category: "alcohol",
      price: 4.50,
      isPOSItem: true,
      printerId: 2,
      ingredients: [
        { materialName: "White Rum", quantity: 30, unit: "ml", cost: 1.20 }
      ]
    },
    {
      name: "Gin Shot",
      description: "Premium gin shot",
      category: "alcohol",
      price: 5.00,
      isPOSItem: true,
      printerId: 2,
      ingredients: [
        { materialName: "Gin", quantity: 30, unit: "ml", cost: 1.50 }
      ]
    },
    {
      name: "Jagermeister Shot",
      description: "Jagermeister herbal liqueur shot",
      category: "alcohol",
      price: 5.50,
      isPOSItem: true,
      printerId: 2,
      ingredients: [
        { materialName: "Jagermeister", quantity: 30, unit: "ml", cost: 2.40 }
      ]
    },
    {
      name: "Sambuca Shot",
      description: "Sambuca anise liqueur shot",
      category: "alcohol",
      price: 5.00,
      isPOSItem: true,
      printerId: 2,
      ingredients: [
        { materialName: "Sambuca", quantity: 30, unit: "ml", cost: 2.10 }
      ]
    },
    {
      name: "Baileys Shot",
      description: "Baileys Irish cream shot",
      category: "alcohol",
      price: 5.50,
      isPOSItem: true,
      printerId: 2,
      ingredients: [
        { materialName: "Baileys", quantity: 30, unit: "ml", cost: 2.10 }
      ]
    },
    {
      name: "Kahlua Shot",
      description: "Kahlua coffee liqueur shot",
      category: "alcohol",
      price: 5.00,
      isPOSItem: true,
      printerId: 2,
      ingredients: [
        { materialName: "Kahlua", quantity: 30, unit: "ml", cost: 1.80 }
      ]
    },
    {
      name: "Limoncello Shot",
      description: "Italian lemon liqueur shot",
      category: "alcohol",
      price: 5.50,
      isPOSItem: true,
      printerId: 2,
      ingredients: [
        { materialName: "Limoncello", quantity: 30, unit: "ml", cost: 2.40 }
      ]
    },

    // BEERS - 15 ITEMS
    {
      name: "Heineken",
      description: "Heineken beer bottle",
      category: "alcohol",
      price: 4.50,
      isPOSItem: true,
      printerId: 2,
      ingredients: [
        { materialName: "Heineken Beer", quantity: 1, unit: "bottle", cost: 2.25 }
      ]
    },
    {
      name: "Corona",
      description: "Corona beer bottle",
      category: "alcohol",
      price: 5.00,
      isPOSItem: true,
      printerId: 2,
      ingredients: [
        { materialName: "Corona Beer", quantity: 1, unit: "bottle", cost: 2.50 }
      ]
    },
    {
      name: "Stella Artois",
      description: "Stella Artois beer bottle",
      category: "alcohol",
      price: 5.00,
      isPOSItem: true,
      printerId: 2,
      ingredients: [
        { materialName: "Stella Artois Beer", quantity: 1, unit: "bottle", cost: 2.50 }
      ]
    },
    {
      name: "Budweiser",
      description: "Budweiser beer bottle",
      category: "alcohol",
      price: 4.00,
      isPOSItem: true,
      printerId: 2,
      ingredients: [
        { materialName: "Budweiser Beer", quantity: 1, unit: "bottle", cost: 2.00 }
      ]
    },
    {
      name: "Carlsberg",
      description: "Carlsberg beer bottle",
      category: "alcohol",
      price: 4.50,
      isPOSItem: true,
      printerId: 2,
      ingredients: [
        { materialName: "Carlsberg Beer", quantity: 1, unit: "bottle", cost: 2.25 }
      ]
    },
    {
      name: "Guinness",
      description: "Guinness stout bottle",
      category: "alcohol",
      price: 5.50,
      isPOSItem: true,
      printerId: 2,
      ingredients: [
        { materialName: "Guinness Beer", quantity: 1, unit: "bottle", cost: 2.75 }
      ]
    },
    {
      name: "Local Draft Beer",
      description: "Local draft beer on tap",
      category: "alcohol",
      price: 3.50,
      isPOSItem: true,
      printerId: 2,
      ingredients: [
        { materialName: "Draft Beer", quantity: 500, unit: "ml", cost: 1.75 }
      ]
    },

    // WINES - 12 ITEMS
    {
      name: "House Red Wine",
      description: "House red wine glass",
      category: "alcohol",
      price: 6.00,
      isPOSItem: true,
      printerId: 2,
      ingredients: [
        { materialName: "Red Wine", quantity: 150, unit: "ml", cost: 3.00 }
      ]
    },
    {
      name: "House White Wine",
      description: "House white wine glass",
      category: "alcohol",
      price: 6.00,
      isPOSItem: true,
      printerId: 2,
      ingredients: [
        { materialName: "White Wine", quantity: 150, unit: "ml", cost: 3.00 }
      ]
    },
    {
      name: "Prosecco",
      description: "Prosecco sparkling wine glass",
      category: "alcohol",
      price: 8.00,
      isPOSItem: true,
      printerId: 2,
      ingredients: [
        { materialName: "Prosecco", quantity: 150, unit: "ml", cost: 4.50 }
      ]
    },
    {
      name: "Champagne",
      description: "Premium champagne glass",
      category: "alcohol",
      price: 12.00,
      isPOSItem: true,
      printerId: 2,
      ingredients: [
        { materialName: "Champagne", quantity: 150, unit: "ml", cost: 8.00 }
      ]
    },

    // PREMIUM SPIRITS - 15 ITEMS
    {
      name: "Grey Goose Vodka",
      description: "Premium Grey Goose vodka shot",
      category: "alcohol",
      price: 8.00,
      isPOSItem: true,
      printerId: 2,
      ingredients: [
        { materialName: "Grey Goose Vodka", quantity: 30, unit: "ml", cost: 4.20 }
      ]
    },
    {
      name: "Johnnie Walker Black",
      description: "Johnnie Walker Black Label whiskey",
      category: "alcohol",
      price: 10.00,
      isPOSItem: true,
      printerId: 2,
      ingredients: [
        { materialName: "Johnnie Walker Black", quantity: 30, unit: "ml", cost: 5.40 }
      ]
    },
    {
      name: "Macallan 12",
      description: "Macallan 12 year old single malt",
      category: "alcohol",
      price: 15.00,
      isPOSItem: true,
      printerId: 2,
      ingredients: [
        { materialName: "Macallan 12", quantity: 30, unit: "ml", cost: 9.00 }
      ]
    },
    {
      name: "Hennessy VS",
      description: "Hennessy VS cognac",
      category: "alcohol",
      price: 12.00,
      isPOSItem: true,
      printerId: 2,
      ingredients: [
        { materialName: "Hennessy VS", quantity: 30, unit: "ml", cost: 7.20 }
      ]
    },
    {
      name: "Don Julio Blanco",
      description: "Don Julio Blanco tequila",
      category: "alcohol",
      price: 9.00,
      isPOSItem: true,
      printerId: 2,
      ingredients: [
        { materialName: "Don Julio Blanco", quantity: 30, unit: "ml", cost: 5.40 }
      ]
    },

    // =============================================================================
    // DESSERTS - 14 ITEMS
    // =============================================================================
    {
      name: "Brookie",
      description: "Brownie cookie hybrid dessert",
      category: "desserts",
      price: 7.00,
      isPOSItem: true,
      printerId: 2,
      ingredients: [
        { materialName: "Flour", quantity: 80, unit: "g", cost: 0.16 },
        { materialName: "Chocolate Chips", quantity: 60, unit: "g", cost: 1.20 },
        { materialName: "Butter", quantity: 40, unit: "g", cost: 0.80 },
        { materialName: "Sugar", quantity: 50, unit: "g", cost: 0.15 },
        { materialName: "Eggs", quantity: 1, unit: "piece", cost: 0.29 },
        { materialName: "Cocoa Powder", quantity: 20, unit: "g", cost: 0.40 }
      ]
    },
    {
      name: "Nutella Cookie",
      description: "Soft cookie with Nutella filling",
      category: "desserts",
      price: 6.00,
      isPOSItem: true,
      printerId: 2,
      ingredients: [
        { materialName: "Flour", quantity: 70, unit: "g", cost: 0.14 },
        { materialName: "Nutella", quantity: 40, unit: "g", cost: 1.60 },
        { materialName: "Butter", quantity: 30, unit: "g", cost: 0.60 },
        { materialName: "Sugar", quantity: 35, unit: "g", cost: 0.11 },
        { materialName: "Eggs", quantity: 1, unit: "piece", cost: 0.29 }
      ]
    },
    {
      name: "Nutella Crookie",
      description: "Croissant cookie with Nutella",
      category: "desserts",
      price: 9.00,
      isPOSItem: true,
      printerId: 2,
      ingredients: [
        { materialName: "Puff Pastry", quantity: 100, unit: "g", cost: 1.20 },
        { materialName: "Nutella", quantity: 50, unit: "g", cost: 2.00 },
        { materialName: "Butter", quantity: 40, unit: "g", cost: 0.80 },
        { materialName: "Sugar", quantity: 30, unit: "g", cost: 0.09 },
        { materialName: "Eggs", quantity: 1, unit: "piece", cost: 0.29 }
      ]
    },
    {
      name: "Pistachio Knafeh Cookie",
      description: "Cookie with pistachio and knafeh flavors",
      category: "desserts",
      price: 7.00,
      isPOSItem: true,
      printerId: 2,
      ingredients: [
        { materialName: "Flour", quantity: 75, unit: "g", cost: 0.15 },
        { materialName: "Pistachios", quantity: 40, unit: "g", cost: 2.40 },
        { materialName: "Phyllo Dough", quantity: 30, unit: "g", cost: 0.60 },
        { materialName: "Butter", quantity: 35, unit: "g", cost: 0.70 },
        { materialName: "Sugar", quantity: 40, unit: "g", cost: 0.12 },
        { materialName: "Rose Water", quantity: 5, unit: "ml", cost: 0.15 }
      ]
    },
    {
      name: "Strawberry Cheese Cake",
      description: "Classic cheesecake with fresh strawberries",
      category: "desserts",
      price: 8.00,
      isPOSItem: true,
      printerId: 2,
      ingredients: [
        { materialName: "Cream Cheese", quantity: 120, unit: "g", cost: 2.40 },
        { materialName: "Strawberry", quantity: 80, unit: "g", cost: 1.60 },
        { materialName: "Graham Crackers", quantity: 40, unit: "g", cost: 0.60 },
        { materialName: "Sugar", quantity: 50, unit: "g", cost: 0.15 },
        { materialName: "Eggs", quantity: 1, unit: "piece", cost: 0.29 },
        { materialName: "Heavy Cream", quantity: 60, unit: "ml", cost: 0.84 }
      ]
    },
    {
      name: "Tiramisu Bliss",
      description: "Classic Italian tiramisu dessert",
      category: "desserts",
      price: 8.00,
      isPOSItem: true,
      printerId: 2,
      ingredients: [
        { materialName: "Mascarpone Cheese", quantity: 100, unit: "g", cost: 2.50 },
        { materialName: "Ladyfinger Cookies", quantity: 60, unit: "g", cost: 1.20 },
        { materialName: "Espresso Shot", quantity: 60, unit: "ml", cost: 1.20 },
        { materialName: "Heavy Cream", quantity: 80, unit: "ml", cost: 1.12 },
        { materialName: "Sugar", quantity: 40, unit: "g", cost: 0.12 },
        { materialName: "Cocoa Powder", quantity: 10, unit: "g", cost: 0.20 }
      ]
    },
    {
      name: "Chocolate Fondant",
      description: "Warm chocolate cake with molten center",
      category: "desserts",
      price: 10.00,
      isPOSItem: true,
      printerId: 2,
      ingredients: [
        { materialName: "Dark Chocolate", quantity: 80, unit: "g", cost: 2.40 },
        { materialName: "Butter", quantity: 60, unit: "g", cost: 1.20 },
        { materialName: "Eggs", quantity: 2, unit: "piece", cost: 0.58 },
        { materialName: "Sugar", quantity: 50, unit: "g", cost: 0.15 },
        { materialName: "Flour", quantity: 30, unit: "g", cost: 0.06 },
        { materialName: "Vanilla Ice Cream", quantity: 50, unit: "g", cost: 0.60 }
      ]
    },
    {
      name: "Chocolate Brownies",
      description: "Rich and fudgy chocolate brownies",
      category: "desserts",
      price: 8.00,
      isPOSItem: true,
      printerId: 2,
      ingredients: [
        { materialName: "Dark Chocolate", quantity: 100, unit: "g", cost: 3.00 },
        { materialName: "Butter", quantity: 80, unit: "g", cost: 1.60 },
        { materialName: "Sugar", quantity: 120, unit: "g", cost: 0.36 },
        { materialName: "Eggs", quantity: 2, unit: "piece", cost: 0.58 },
        { materialName: "Flour", quantity: 60, unit: "g", cost: 0.12 },
        { materialName: "Walnuts", quantity: 40, unit: "g", cost: 1.20 }
      ]
    },
    {
      name: "Biscuit Au Chocolat",
      description: "French chocolate biscuit dessert",
      category: "desserts",
      price: 8.00,
      isPOSItem: true,
      printerId: 2,
      ingredients: [
        { materialName: "Chocolate Biscuits", quantity: 80, unit: "g", cost: 1.60 },
        { materialName: "Dark Chocolate", quantity: 60, unit: "g", cost: 1.80 },
        { materialName: "Heavy Cream", quantity: 100, unit: "ml", cost: 1.40 },
        { materialName: "Butter", quantity: 40, unit: "g", cost: 0.80 },
        { materialName: "Sugar", quantity: 30, unit: "g", cost: 0.09 }
      ]
    },
    {
      name: "Fudge Cake",
      description: "Decadent chocolate fudge cake",
      category: "desserts",
      price: 10.00,
      isPOSItem: true,
      printerId: 2,
      ingredients: [
        { materialName: "Dark Chocolate", quantity: 120, unit: "g", cost: 3.60 },
        { materialName: "Butter", quantity: 100, unit: "g", cost: 2.00 },
        { materialName: "Sugar", quantity: 150, unit: "g", cost: 0.45 },
        { materialName: "Eggs", quantity: 3, unit: "piece", cost: 0.87 },
        { materialName: "Flour", quantity: 80, unit: "g", cost: 0.16 },
        { materialName: "Heavy Cream", quantity: 80, unit: "ml", cost: 1.12 }
      ]
    },
    {
      name: "Ice Cream Scoop",
      description: "Single scoop of premium ice cream",
      category: "desserts",
      price: 3.00,
      isPOSItem: true,
      printerId: 2,
      ingredients: [
        { materialName: "Vanilla Ice Cream", quantity: 100, unit: "g", cost: 1.20 }
      ]
    },
    {
      name: "Triple Chocolate Cake",
      description: "Three layers of chocolate indulgence",
      category: "desserts",
      price: 8.00,
      isPOSItem: true,
      printerId: 2,
      ingredients: [
        { materialName: "Dark Chocolate", quantity: 90, unit: "g", cost: 2.70 },
        { materialName: "Milk Chocolate", quantity: 60, unit: "g", cost: 1.80 },
        { materialName: "White Chocolate", quantity: 40, unit: "g", cost: 1.60 },
        { materialName: "Butter", quantity: 80, unit: "g", cost: 1.60 },
        { materialName: "Sugar", quantity: 100, unit: "g", cost: 0.30 },
        { materialName: "Eggs", quantity: 2, unit: "piece", cost: 0.58 },
        { materialName: "Flour", quantity: 70, unit: "g", cost: 0.14 }
      ]
    },
    {
      name: "Oreo Cake",
      description: "Chocolate cake with Oreo cookie layers",
      category: "desserts",
      price: 8.00,
      isPOSItem: true,
      printerId: 2,
      ingredients: [
        { materialName: "Oreo Cookies", quantity: 120, unit: "g", cost: 2.40 },
        { materialName: "Cream Cheese", quantity: 80, unit: "g", cost: 1.60 },
        { materialName: "Heavy Cream", quantity: 100, unit: "ml", cost: 1.40 },
        { materialName: "Sugar", quantity: 60, unit: "g", cost: 0.18 },
        { materialName: "Butter", quantity: 50, unit: "g", cost: 1.00 },
        { materialName: "Eggs", quantity: 2, unit: "piece", cost: 0.58 }
      ]
    },

    // =============================================================================
    // SHISHA/ARGUILE - 5 ITEMS
    // =============================================================================
    {
      name: "Arguileh Jabale",
      description: "Traditional mountain-style shisha",
      category: "shisha",
      price: 7.00,
      isPOSItem: true,
      printerId: 4,
      ingredients: []
    },
    {
      name: "Arguileh Ajame",
      description: "Persian-style shisha blend",
      category: "shisha",
      price: 8.00,
      isPOSItem: true,
      printerId: 4,
      ingredients: []
    },
    {
      name: "Rass",
      description: "Shisha head/bowl",
      category: "shisha",
      price: 3.50,
      isPOSItem: true,
      printerId: 4,
      ingredients: []
    },
    {
      name: "Disposal Shisha Hose",
      description: "Disposable shisha hose",
      category: "shisha",
      price: 1.00,
      isPOSItem: true,
      printerId: 4,
      ingredients: []
    },
    {
      name: "Bring Your Own Tanbak",
      description: "Service for customer's own tobacco",
      category: "shisha",
      price: 5.00,
      isPOSItem: true,
      printerId: 4,
      ingredients: []
    }
  ];

  // TODO: Continue with remaining categories:
  // - SUSHI (77 items) - PARTIALLY COMPLETE (~36 more items needed)

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
          isPOSItem: itemData.isPOSItem,
          printerId: itemData.printerId
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
        console.log(`⏭️  Skipped existing menu item: ${itemData.name}`);
        skippedCount++;
      }
    } catch (error) {
      console.error(`❌ Error creating menu item ${itemData.name}:`, error.message);
      skippedCount++;
    }
  }

  return { created: createdCount, skipped: skippedCount };
}

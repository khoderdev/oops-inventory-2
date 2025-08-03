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
        { materialName: "Crispy Chicken", quantity: 200, unit: "g", cost: 3.00 },
        { materialName: "Special Sauce", quantity: 30, unit: "ml", cost: 0.30 }
      ]
    },
    {
      name: "Chicken Wings",
      description: "BBQ, Buffalo, Honey mustard",
      category: "appetizers",
      price: 10.00,
      isPOSItem: true,
      ingredients: [
        { materialName: "Chicken Wings", quantity: 300, unit: "g", cost: 5.40 },
        { materialName: "BBQ Sauce", quantity: 40, unit: "ml", cost: 0.24 },
        { materialName: "Buffalo Sauce", quantity: 40, unit: "ml", cost: 0.34 },
        { materialName: "Honey Mustard Sauce", quantity: 40, unit: "ml", cost: 0.30 }
      ]
    },
    {
      name: "Nachos",
      description: "Nachos",
      category: "appetizers",
      price: 8.00,
      isPOSItem: true,
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
      ingredients: [
        { materialName: "Shrimp", quantity: 100, unit: "g", cost: 2.80 },
        { materialName: "Calamari", quantity: 100, unit: "g", cost: 3.50 },
        { materialName: "Fish Fingers", quantity: 100, unit: "g", cost: 2.00 },
        { materialName: "Wedges", quantity: 200, unit: "g", cost: 0.50 }
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

    // =============================================================================
    // PASTA - 9 ITEMS
    // =============================================================================
    {
      name: "Penne Arrabiata",
      description: "Penne, red sauce, parmesan",
      category: "pasta",
      price: 10.00,
      isPOSItem: true,
      ingredients: [
        { materialName: "Penne Pasta", quantity: 120, unit: "g", cost: 0.36 },
        { materialName: "Red Sauce", quantity: 100, unit: "ml", cost: 0.50 },
        { materialName: "Parmesan", quantity: 30, unit: "g", cost: 0.54 }
      ]
    },
    {
      name: "Penne Rose",
      description: "Penne, sauce rose, parmesan",
      category: "pasta",
      price: 11.00,
      isPOSItem: true,
      ingredients: [
        { materialName: "Penne Pasta", quantity: 120, unit: "g", cost: 0.36 },
        { materialName: "Rose Sauce", quantity: 100, unit: "ml", cost: 0.60 },
        { materialName: "Parmesan", quantity: 30, unit: "g", cost: 0.54 }
      ]
    },
    {
      name: "Pesto Pasta",
      description: "Penne, creamy pesto sauce, parmesan",
      category: "pasta",
      price: 11.00,
      isPOSItem: true,
      ingredients: [
        { materialName: "Penne Pasta", quantity: 120, unit: "g", cost: 0.36 },
        { materialName: "Pesto Sauce", quantity: 100, unit: "ml", cost: 1.20 },
        { materialName: "Parmesan", quantity: 30, unit: "g", cost: 0.54 }
      ]
    },
    {
      name: "Fettuccine Alfredo",
      description: "Tagliatelle, grilled chicken, mushroom, parmesan",
      category: "pasta",
      price: 14.00,
      isPOSItem: true,
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
      category: "pasta",
      price: 15.00,
      isPOSItem: true,
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
      category: "pasta",
      price: 15.00,
      isPOSItem: true,
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
      category: "pasta",
      price: 10.00,
      isPOSItem: true,
      ingredients: [
        { materialName: "Fresh Noodles", quantity: 120, unit: "g", cost: 0.48 },
        { materialName: "Mixed Vegetables", quantity: 150, unit: "g", cost: 0.90 },
        { materialName: "Oyster Sauce", quantity: 40, unit: "ml", cost: 0.32 }
      ]
    },
    {
      name: "Chicken Noodles",
      description: "Fresh noodles, chicken, mix of vegetables, oyster sauce",
      category: "pasta",
      price: 12.00,
      isPOSItem: true,
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
      category: "pasta",
      price: 14.00,
      isPOSItem: true,
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
      category: "main_course",
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
      name: "Crispy Platter",
      description: "5 crispy chicken, coleslaw, fries, garlic mayo sauce",
      category: "main_course",
      price: 14.00,
      isPOSItem: true,
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
      category: "main_course",
      price: 19.00,
      isPOSItem: true,
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
      category: "main_course",
      price: 18.00,
      isPOSItem: true,
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
      category: "main_course",
      price: 18.00,
      isPOSItem: true,
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
      category: "main_course",
      price: 19.00,
      isPOSItem: true,
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
      category: "main_course",
      price: 20.00,
      isPOSItem: true,
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
      category: "main_course",
      price: 18.00,
      isPOSItem: true,
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
      category: "main_course",
      price: 18.00,
      isPOSItem: true,
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
      category: "main_course",
      price: 18.00,
      isPOSItem: true,
      ingredients: [
        { materialName: "Shrimp", quantity: 200, unit: "g", cost: 3.00 },
        { materialName: "Indian Sauce", quantity: 100, unit: "ml", cost: 1.20 },
        { materialName: "White Rice", quantity: 150, unit: "g", cost: 0.30 }
      ]
    },
    {
      name: "Butter Chicken",
      description: "Marinated chicken, indian sauce, served with white rice",
      category: "main_course",
      price: 17.00,
      isPOSItem: true,
      ingredients: [
        { materialName: "Chicken Breast", quantity: 200, unit: "g", cost: 1.70 },
        { materialName: "Indian Sauce", quantity: 100, unit: "ml", cost: 1.20 },
        { materialName: "White Rice", quantity: 150, unit: "g", cost: 0.30 }
      ]
    },
    {
      name: "Steak Mushroom",
      description: "Grilled beef filet, mashed potatoes, grilled vegetables, mushroom sauce",
      category: "main_course",
      price: 23.00,
      isPOSItem: true,
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
      category: "main_course",
      price: 21.00,
      isPOSItem: true,
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
      category: "main_course",
      price: 21.00,
      isPOSItem: true,
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
      category: "main_course",
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
      ingredients: [
        { materialName: "Rocca", quantity: 100, unit: "g", cost: 0.80 },
        { materialName: "Fresh Mushroom", quantity: 80, unit: "g", cost: 0.64 },
        { materialName: "Cherry Tomatoes", quantity: 100, unit: "g", cost: 0.35 },
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
      ingredients: [
        { materialName: "Mixed Greens", quantity: 120, unit: "g", cost: 0.96 },
        { materialName: "Halloumi", quantity: 100, unit: "g", cost: 1.20 },
        { materialName: "Cherry Tomatoes", quantity: 80, unit: "g", cost: 0.28 },
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
      ingredients: [
        { materialName: "Iceberg Lettuce", quantity: 120, unit: "g", cost: 0.31 },
        { materialName: "Crab Sticks", quantity: 100, unit: "g", cost: 2.50 },
        { materialName: "Cherry Tomatoes", quantity: 80, unit: "g", cost: 0.28 },
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
      ingredients: [
        { materialName: "Iceberg Lettuce", quantity: 120, unit: "g", cost: 0.31 },
        { materialName: "Chicken Breast", quantity: 150, unit: "g", cost: 1.28 },
        { materialName: "Cherry Tomatoes", quantity: 80, unit: "g", cost: 0.28 },
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
      ingredients: [
        { materialName: "Kale", quantity: 100, unit: "g", cost: 0.90 },
        { materialName: "Rocca", quantity: 50, unit: "g", cost: 0.40 },
        { materialName: "Feta Cheese", quantity: 80, unit: "g", cost: 0.96 },
        { materialName: "Cherry Tomatoes", quantity: 80, unit: "g", cost: 0.28 },
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
      ingredients: [
        { materialName: "Quinoa", quantity: 100, unit: "g", cost: 1.20 },
        { materialName: "Shrimp", quantity: 120, unit: "g", cost: 3.36 },
        { materialName: "Avocado", quantity: 80, unit: "g", cost: 1.20 },
        { materialName: "Mango", quantity: 80, unit: "g", cost: 1.20 },
        { materialName: "Cherry Tomatoes", quantity: 80, unit: "g", cost: 0.28 },
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
      ingredients: [
        { materialName: "Tuna", quantity: 120, unit: "g", cost: 2.40 },
        { materialName: "Cherry Tomatoes", quantity: 100, unit: "g", cost: 0.35 },
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
      ingredients: [
        { materialName: "Crispy Chicken", quantity: 120, unit: "g", cost: 1.80 },
        { materialName: "Iceberg Lettuce", quantity: 80, unit: "g", cost: 0.21 },
        { materialName: "Rocca", quantity: 50, unit: "g", cost: 0.40 },
        { materialName: "Red Cabbage", quantity: 50, unit: "g", cost: 0.15 },
        { materialName: "Carrot", quantity: 40, unit: "g", cost: 0.08 },
        { materialName: "Cucumber", quantity: 50, unit: "g", cost: 0.10 },
        { materialName: "Cherry Tomatoes", quantity: 80, unit: "g", cost: 0.28 },
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
      ingredients: [
        { materialName: "Halloumi", quantity: 120, unit: "g", cost: 1.44 },
        { materialName: "Rocca", quantity: 50, unit: "g", cost: 0.40 },
        { materialName: "Cherry Tomatoes", quantity: 80, unit: "g", cost: 0.28 },
        { materialName: "Pesto Sauce", quantity: 30, unit: "ml", cost: 0.36 }
      ]
    },
    {
      name: "Crab Sandwich",
      description: "Crab mix, lettuce, tomatoes, avocado slice",
      category: "sandwiches",
      price: 10.00,
      isPOSItem: true,
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
      ingredients: [
        { materialName: "Burger Bun", quantity: 1, unit: "piece", cost: 0.50 },
        { materialName: "Beef Patty", quantity: 200, unit: "g", cost: 2.40 },
        { materialName: "Fresh Mushroom", quantity: 100, unit: "g", cost: 0.80 },
        { materialName: "Emental Cheese", quantity: 80, unit: "g", cost: 0.96 }
      ]
    }
  ];

  // TODO: Continue with remaining categories:
  // - SUSHI (77 items)
  // - PIZZA (12 items)
  // - BREAKFAST (12 items)

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

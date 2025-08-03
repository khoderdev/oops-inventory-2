import Material from "../models/materials.js";
import StockEntry from "../models/StockEntry.js";
import { sushiEntries } from "./sushiEntries.js";

/**
 * Seed stock entries based on materials
 */
export async function seedStockEntries() {
  console.log("📦 Seeding stock entries...");

  // Get all materials
  const materials = await Material.findAll();
  const materialMap = {};
  materials.forEach(material => {
    materialMap[material.name] = material;
  });

  const stockEntries = [
    // =============================================================================
    // APPETIZERS - POS ITEMS WITH REAL MENU PRICES
    // =============================================================================
    
    // Grilled Halloumi - $7
    { materialName: "Grilled Halloumi", quantity: 20, unit: "portions", costPerUnit: 3.50, supplier: "Charles", isPOSItem: true, menuPrice: 7.00 },
    
    // Juicy Balls (Cheese Balls) - $8
    { materialName: "Cheese Balls", quantity: 50, unit: "pieces", costPerUnit: 0.80, supplier: "Charles", isPOSItem: true, menuPrice: 8.00 },
    
    // Mozzarella Sticks - $6
    { materialName: "Mozzarella Sticks", quantity: 100, unit: "pieces", costPerUnit: 0.60, supplier: "Charles", isPOSItem: true, menuPrice: 6.00 },
    
    // Chicken Tenders - $8
    { materialName: "Chicken Tenders", quantity: 80, unit: "pieces", costPerUnit: 1.00, supplier: "Charles", isPOSItem: true, menuPrice: 8.00 },
    
    // Chicken Wings - $10
    { materialName: "Chicken Wings", quantity: 100, unit: "pieces", costPerUnit: 1.50, supplier: "Charles", isPOSItem: true, menuPrice: 10.00 },
    
    // Nachos - $8
    { materialName: "Nachos", quantity: 30, unit: "portions", costPerUnit: 2.00, supplier: "Charles", isPOSItem: true, menuPrice: 8.00 },
    
    // Cheese Garlic Bread - $7
    { materialName: "Cheese Garlic Bread", quantity: 40, unit: "portions", costPerUnit: 2.50, supplier: "Charles", isPOSItem: true, menuPrice: 7.00 },
    
    // Shrimp Tempura - $12
    { materialName: "Shrimp Tempura", quantity: 60, unit: "portions", costPerUnit: 6.00, supplier: "Charles", isPOSItem: true, menuPrice: 12.00 },
    
    // Salmon Bruschetta - $10
    { materialName: "Salmon Bruschetta", quantity: 30, unit: "portions", costPerUnit: 5.00, supplier: "Charles", isPOSItem: true, menuPrice: 10.00 },
    
    // Dynamite Shrimps - $9
    { materialName: "Dynamite Shrimps", quantity: 50, unit: "portions", costPerUnit: 4.50, supplier: "Charles", isPOSItem: true, menuPrice: 9.00 },
    
    // Chicken Quesadillas - $11
    { materialName: "Chicken Quesadillas", quantity: 40, unit: "portions", costPerUnit: 5.50, supplier: "Charles", isPOSItem: true, menuPrice: 11.00 },
    
    // French Fries - $3
    { materialName: "French Fries", quantity: 100, unit: "portions", costPerUnit: 1.00, supplier: "Charles", isPOSItem: true, menuPrice: 3.00 },
    
    // Wedges - $5
    { materialName: "Wedges", quantity: 80, unit: "portions", costPerUnit: 1.50, supplier: "Charles", isPOSItem: true, menuPrice: 5.00 },
    
    // Curly Fries - $8
    { materialName: "Curly Fries", quantity: 60, unit: "portions", costPerUnit: 2.50, supplier: "Charles", isPOSItem: true, menuPrice: 8.00 },
    
    // Oops Fries - $13
    { materialName: "Oops Fries", quantity: 40, unit: "portions", costPerUnit: 6.50, supplier: "Charles", isPOSItem: true, menuPrice: 13.00 },
    
    // Combo Platter - $15
    { materialName: "Combo Platter", quantity: 25, unit: "portions", costPerUnit: 7.50, supplier: "Charles", isPOSItem: true, menuPrice: 15.00 },
    
    // Mix Seafood - $18
    { materialName: "Mix Seafood", quantity: 20, unit: "portions", costPerUnit: 9.00, supplier: "Charles", isPOSItem: true, menuPrice: 18.00 },

    // =============================================================================
    // SALADS - POS ITEMS WITH REAL MENU PRICES
    // =============================================================================
    
    // Rocca Salad - $11
    { materialName: "Rocca Salad", quantity: 40, unit: "portions", costPerUnit: 4.50, supplier: "Charles", isPOSItem: true, menuPrice: 11.00 },
    
    // Halloumi Salad - $11
    { materialName: "Halloumi Salad", quantity: 35, unit: "portions", costPerUnit: 4.50, supplier: "Charles", isPOSItem: true, menuPrice: 11.00 },
    
    // Crab Salad - $14
    { materialName: "Crab Salad", quantity: 30, unit: "portions", costPerUnit: 7.00, supplier: "Charles", isPOSItem: true, menuPrice: 14.00 },
    
    // Chicken Caesar Salad - $14
    { materialName: "Chicken Caesar Salad", quantity: 35, unit: "portions", costPerUnit: 6.50, supplier: "Charles", isPOSItem: true, menuPrice: 14.00 },
    
    // Kale Feta Salad - $12
    { materialName: "Kale Feta Salad", quantity: 30, unit: "portions", costPerUnit: 5.50, supplier: "Charles", isPOSItem: true, menuPrice: 12.00 },
    
    // Kale Chicken Mango Salad - $15
    { materialName: "Kale Chicken Mango Salad", quantity: 25, unit: "portions", costPerUnit: 7.50, supplier: "Charles", isPOSItem: true, menuPrice: 15.00 },
    
    // Quinoa Shrimp - $15
    { materialName: "Quinoa Shrimp Salad", quantity: 25, unit: "portions", costPerUnit: 7.50, supplier: "Charles", isPOSItem: true, menuPrice: 15.00 },
    
    // Tuna Pasta Salad - $14
    { materialName: "Tuna Pasta Salad", quantity: 30, unit: "portions", costPerUnit: 6.50, supplier: "Charles", isPOSItem: true, menuPrice: 14.00 },
    
    // Oops Salad - $17
    { materialName: "Oops Salad", quantity: 20, unit: "portions", costPerUnit: 8.50, supplier: "Charles", isPOSItem: true, menuPrice: 17.00 },

    // =============================================================================
    // SANDWICHES - POS ITEMS WITH REAL MENU PRICES
    // =============================================================================
    
    // Taouk Sandwich - $7
    { materialName: "Taouk Sandwich", quantity: 50, unit: "portions", costPerUnit: 3.50, supplier: "Charles", isPOSItem: true, menuPrice: 7.00 },
    
    // Fajita Sandwich - $13
    { materialName: "Fajita Sandwich", quantity: 30, unit: "portions", costPerUnit: 6.50, supplier: "Charles", isPOSItem: true, menuPrice: 13.00 },
    
    // BBQ Chicken Sandwich - $13
    { materialName: "BBQ Chicken Sandwich", quantity: 30, unit: "portions", costPerUnit: 6.50, supplier: "Charles", isPOSItem: true, menuPrice: 13.00 },
    
    // Francisco Sandwich - $13
    { materialName: "Francisco Sandwich", quantity: 30, unit: "portions", costPerUnit: 6.50, supplier: "Charles", isPOSItem: true, menuPrice: 13.00 },
    
    // Crispy Sandwich - $13
    { materialName: "Crispy Sandwich", quantity: 30, unit: "portions", costPerUnit: 6.50, supplier: "Charles", isPOSItem: true, menuPrice: 13.00 },
    
    // Submarine Sandwich - $13
    { materialName: "Submarine Sandwich", quantity: 30, unit: "portions", costPerUnit: 6.50, supplier: "Charles", isPOSItem: true, menuPrice: 13.00 },
    
    // Steak Sandwich - $15
    { materialName: "Steak Sandwich", quantity: 25, unit: "portions", costPerUnit: 7.50, supplier: "Charles", isPOSItem: true, menuPrice: 15.00 },
    
    // Chicken Delight Sandwich - $13
    { materialName: "Chicken Delight Sandwich", quantity: 30, unit: "portions", costPerUnit: 6.50, supplier: "Charles", isPOSItem: true, menuPrice: 13.00 },
    
    // Halloumi Sandwich - $10
    { materialName: "Halloumi Sandwich", quantity: 35, unit: "portions", costPerUnit: 5.00, supplier: "Charles", isPOSItem: true, menuPrice: 10.00 },
    
    // Crab Sandwich - $10
    { materialName: "Crab Sandwich", quantity: 30, unit: "portions", costPerUnit: 5.00, supplier: "Charles", isPOSItem: true, menuPrice: 10.00 },
    
    // Salmon Sandwich - $16
    { materialName: "Salmon Sandwich", quantity: 20, unit: "portions", costPerUnit: 8.00, supplier: "Charles", isPOSItem: true, menuPrice: 16.00 },

    // =============================================================================
    // BURGERS - POS ITEMS WITH REAL MENU PRICES
    // =============================================================================
    
    // Classic Hamburger - $9
    { materialName: "Classic Hamburger", quantity: 40, unit: "portions", costPerUnit: 4.50, supplier: "Charles", isPOSItem: true, menuPrice: 9.00 },
    
    // Chicken Burger - $7.5
    { materialName: "Chicken Burger", quantity: 45, unit: "portions", costPerUnit: 3.75, supplier: "Charles", isPOSItem: true, menuPrice: 7.50 },
    
    // Mozzarella Burger - $7
    { materialName: "Mozzarella Burger", quantity: 40, unit: "portions", costPerUnit: 3.50, supplier: "Charles", isPOSItem: true, menuPrice: 7.00 },
    
    // Healthy Burger - $10
    { materialName: "Healthy Burger", quantity: 35, unit: "portions", costPerUnit: 5.00, supplier: "Charles", isPOSItem: true, menuPrice: 10.00 },
    
    // Oops Beef Burger - $13
    { materialName: "Oops Beef Burger", quantity: 30, unit: "portions", costPerUnit: 6.50, supplier: "Charles", isPOSItem: true, menuPrice: 13.00 },
    
    // Oops Chicken Burger - $13
    { materialName: "Oops Chicken Burger", quantity: 30, unit: "portions", costPerUnit: 6.50, supplier: "Charles", isPOSItem: true, menuPrice: 13.00 },
    
    // Bomba Beef Burger - $15
    { materialName: "Bomba Beef Burger", quantity: 25, unit: "portions", costPerUnit: 7.50, supplier: "Charles", isPOSItem: true, menuPrice: 15.00 },
    
    // Bomba Chicken Burger - $16
    { materialName: "Bomba Chicken Burger", quantity: 25, unit: "portions", costPerUnit: 8.00, supplier: "Charles", isPOSItem: true, menuPrice: 16.00 },
    
    // Pepperoni Burger - $16
    { materialName: "Pepperoni Burger", quantity: 25, unit: "portions", costPerUnit: 8.00, supplier: "Charles", isPOSItem: true, menuPrice: 16.00 },
    
    // The Ghost Burger - $17
    { materialName: "The Ghost Burger", quantity: 20, unit: "portions", costPerUnit: 8.50, supplier: "Charles", isPOSItem: true, menuPrice: 17.00 },
    
    // Royal Beef Burger - $20
    { materialName: "Royal Beef Burger", quantity: 15, unit: "portions", costPerUnit: 10.00, supplier: "Charles", isPOSItem: true, menuPrice: 20.00 },
    
    // Royal Chicken Burger - $20
    { materialName: "Royal Chicken Burger", quantity: 15, unit: "portions", costPerUnit: 10.00, supplier: "Charles", isPOSItem: true, menuPrice: 20.00 },
    
    // Chicken Mac n Cheese Burger - $17
    { materialName: "Chicken Mac n Cheese Burger", quantity: 20, unit: "portions", costPerUnit: 8.50, supplier: "Charles", isPOSItem: true, menuPrice: 17.00 },
    
    // Mushroom Swiss Burger - $15
    { materialName: "Mushroom Swiss Burger", quantity: 25, unit: "portions", costPerUnit: 7.50, supplier: "Charles", isPOSItem: true, menuPrice: 15.00 },

    // =============================================================================
    // PASTA - POS ITEMS WITH REAL MENU PRICES
    // =============================================================================
    
    // Penne Arrabiata - $10
    { materialName: "Penne Arrabiata", quantity: 40, unit: "portions", costPerUnit: 4.00, supplier: "Charles", isPOSItem: true, menuPrice: 10.00 },
    
    // Penne Rose - $11
    { materialName: "Penne Rose", quantity: 35, unit: "portions", costPerUnit: 4.50, supplier: "Charles", isPOSItem: true, menuPrice: 11.00 },
    
    // Pesto Pasta - $11
    { materialName: "Pesto Pasta", quantity: 35, unit: "portions", costPerUnit: 4.50, supplier: "Charles", isPOSItem: true, menuPrice: 11.00 },
    
    // Fettuccine Alfredo - $14
    { materialName: "Fettuccine Alfredo", quantity: 30, unit: "portions", costPerUnit: 6.50, supplier: "Charles", isPOSItem: true, menuPrice: 14.00 },
    
    // Shrimp Alfredo - $15
    { materialName: "Shrimp Alfredo", quantity: 25, unit: "portions", costPerUnit: 7.50, supplier: "Charles", isPOSItem: true, menuPrice: 15.00 },
    
    // Spaghetti Shrimp - $15
    { materialName: "Spaghetti Shrimp", quantity: 25, unit: "portions", costPerUnit: 7.50, supplier: "Charles", isPOSItem: true, menuPrice: 15.00 },
    
    // Vegetable Noodles - $10
    { materialName: "Vegetable Noodles", quantity: 35, unit: "portions", costPerUnit: 4.00, supplier: "Charles", isPOSItem: true, menuPrice: 10.00 },
    
    // Chicken Noodles - $12
    { materialName: "Chicken Noodles", quantity: 30, unit: "portions", costPerUnit: 5.50, supplier: "Charles", isPOSItem: true, menuPrice: 12.00 },
    
    // Shrimp Noodles - $14
    { materialName: "Shrimp Noodles", quantity: 25, unit: "portions", costPerUnit: 6.50, supplier: "Charles", isPOSItem: true, menuPrice: 14.00 },

    // =============================================================================
    // MAIN COURSE - POS ITEMS WITH REAL MENU PRICES
    // =============================================================================
    
    // Taouk Platter - $12
    { materialName: "Taouk Platter", quantity: 35, unit: "portions", costPerUnit: 6.00, supplier: "Charles", isPOSItem: true, menuPrice: 12.00 },
    
    // Crispy Platter - $14
    { materialName: "Crispy Platter", quantity: 30, unit: "portions", costPerUnit: 7.00, supplier: "Charles", isPOSItem: true, menuPrice: 14.00 },
    
    // Bajaxy - $19
    { materialName: "Bajaxy", quantity: 20, unit: "portions", costPerUnit: 9.50, supplier: "Charles", isPOSItem: true, menuPrice: 19.00 },
    
    // Chicken Mushroom - $18
    { materialName: "Chicken Mushroom", quantity: 25, unit: "portions", costPerUnit: 9.00, supplier: "Charles", isPOSItem: true, menuPrice: 18.00 },
    
    // Chicken Pesto - $18
    { materialName: "Chicken Pesto", quantity: 25, unit: "portions", costPerUnit: 9.00, supplier: "Charles", isPOSItem: true, menuPrice: 18.00 },
    
    // Chicken Parmigiana - $19
    { materialName: "Chicken Parmigiana", quantity: 20, unit: "portions", costPerUnit: 9.50, supplier: "Charles", isPOSItem: true, menuPrice: 19.00 },
    
    // Chicken Halloumi - $20
    { materialName: "Chicken Halloumi", quantity: 20, unit: "portions", costPerUnit: 10.00, supplier: "Charles", isPOSItem: true, menuPrice: 20.00 },
    
    // Chicken Strogonoff - $18
    { materialName: "Chicken Strogonoff", quantity: 25, unit: "portions", costPerUnit: 9.00, supplier: "Charles", isPOSItem: true, menuPrice: 18.00 },
    
    // Beef Strogonoff - $18
    { materialName: "Beef Strogonoff", quantity: 20, unit: "portions", costPerUnit: 9.00, supplier: "Charles", isPOSItem: true, menuPrice: 18.00 },
    
    // Butter Shrimp - $18
    { materialName: "Butter Shrimp", quantity: 20, unit: "portions", costPerUnit: 9.00, supplier: "Charles", isPOSItem: true, menuPrice: 18.00 },
    
    // Butter Chicken - $17
    { materialName: "Butter Chicken", quantity: 25, unit: "portions", costPerUnit: 8.50, supplier: "Charles", isPOSItem: true, menuPrice: 17.00 },
    
    // Steak Mushroom - $23
    { materialName: "Steak Mushroom", quantity: 15, unit: "portions", costPerUnit: 11.50, supplier: "Charles", isPOSItem: true, menuPrice: 23.00 },
    
    // Cashew Chicken - $21
    { materialName: "Cashew Chicken", quantity: 20, unit: "portions", costPerUnit: 10.50, supplier: "Charles", isPOSItem: true, menuPrice: 21.00 },
    
    // Oops Platter - $21
    { materialName: "Oops Platter", quantity: 20, unit: "portions", costPerUnit: 10.50, supplier: "Charles", isPOSItem: true, menuPrice: 21.00 },
    
    // Grilled Salmon - $24
    { materialName: "Grilled Salmon", quantity: 15, unit: "portions", costPerUnit: 12.00, supplier: "Charles", isPOSItem: true, menuPrice: 24.00 },

    // =============================================================================
    // PIZZA - POS ITEMS WITH REAL MENU PRICES
    // =============================================================================
    
    // Pizza Margherita - $10
    { materialName: "Pizza Margherita", quantity: 40, unit: "portions", costPerUnit: 4.00, supplier: "Charles", isPOSItem: true, menuPrice: 10.00 },
    
    // Pizza Pepperoni - $13
    { materialName: "Pizza Pepperoni", quantity: 30, unit: "portions", costPerUnit: 6.50, supplier: "Charles", isPOSItem: true, menuPrice: 13.00 },
    
    // Pizza Lebanese - $13
    { materialName: "Pizza Lebanese", quantity: 30, unit: "portions", costPerUnit: 6.50, supplier: "Charles", isPOSItem: true, menuPrice: 13.00 },
    
    // Pizza Alla Vodka - $12
    { materialName: "Pizza Alla Vodka", quantity: 35, unit: "portions", costPerUnit: 5.50, supplier: "Charles", isPOSItem: true, menuPrice: 12.00 },
    
    // Pizza Chicken Alfredo - $14
    { materialName: "Pizza Chicken Alfredo", quantity: 30, unit: "portions", costPerUnit: 7.00, supplier: "Charles", isPOSItem: true, menuPrice: 14.00 },
    
    // Pizza Buffalo Chicken - $14
    { materialName: "Pizza Buffalo Chicken", quantity: 30, unit: "portions", costPerUnit: 7.00, supplier: "Charles", isPOSItem: true, menuPrice: 14.00 },
    
    // Pizza TRIO - $12
    { materialName: "Pizza TRIO", quantity: 35, unit: "portions", costPerUnit: 5.50, supplier: "Charles", isPOSItem: true, menuPrice: 12.00 },
    
    // Pizza Mexican - $14
    { materialName: "Pizza Mexican", quantity: 30, unit: "portions", costPerUnit: 7.00, supplier: "Charles", isPOSItem: true, menuPrice: 14.00 },
    
    // BBQ Chicken Pizza - $14
    { materialName: "BBQ Chicken Pizza", quantity: 30, unit: "portions", costPerUnit: 7.00, supplier: "Charles", isPOSItem: true, menuPrice: 14.00 },
    
    // Spicy Chicken Pizza - $14
    { materialName: "Spicy Chicken Pizza", quantity: 30, unit: "portions", costPerUnit: 7.00, supplier: "Charles", isPOSItem: true, menuPrice: 14.00 },
    
    // Vegetarian Pizza - $12
    { materialName: "Vegetarian Pizza", quantity: 35, unit: "portions", costPerUnit: 5.50, supplier: "Charles", isPOSItem: true, menuPrice: 12.00 },
    
    // PestoRoni Pizza - $14
    { materialName: "PestoRoni Pizza", quantity: 30, unit: "portions", costPerUnit: 7.00, supplier: "Charles", isPOSItem: true, menuPrice: 14.00 },

    // =============================================================================
    // BREAKFAST - POS ITEMS WITH REAL MENU PRICES
    // =============================================================================
    
    // Labneh - $3.5
    { materialName: "Labneh", quantity: 50, unit: "portions", costPerUnit: 1.75, supplier: "Charles", isPOSItem: true, menuPrice: 3.50 },
    
    // Eggs - $3.5
    { materialName: "Eggs", quantity: 50, unit: "portions", costPerUnit: 1.75, supplier: "Charles", isPOSItem: true, menuPrice: 3.50 },
    
    // Grilled Halloumi Breakfast - $4
    { materialName: "Grilled Halloumi Breakfast", quantity: 40, unit: "portions", costPerUnit: 2.00, supplier: "Charles", isPOSItem: true, menuPrice: 4.00 },
    
    // Sahen Khodra - $1.5
    { materialName: "Sahen Khodra", quantity: 60, unit: "portions", costPerUnit: 0.75, supplier: "Charles", isPOSItem: true, menuPrice: 1.50 },
    
    // Sajj Zaatar - $2
    { materialName: "Sajj Zaatar", quantity: 50, unit: "portions", costPerUnit: 1.00, supplier: "Charles", isPOSItem: true, menuPrice: 2.00 },
    
    // Sajj Zaatar + Khodra - $2.5
    { materialName: "Sajj Zaatar Khodra", quantity: 45, unit: "portions", costPerUnit: 1.25, supplier: "Charles", isPOSItem: true, menuPrice: 2.50 },
    
    // Sajj Labneh - $2.5
    { materialName: "Sajj Labneh", quantity: 45, unit: "portions", costPerUnit: 1.25, supplier: "Charles", isPOSItem: true, menuPrice: 2.50 },
    
    // Sajj Labneh + Khodra - $3
    { materialName: "Sajj Labneh Khodra", quantity: 40, unit: "portions", costPerUnit: 1.50, supplier: "Charles", isPOSItem: true, menuPrice: 3.00 },
    
    // Sajj Cheese - $3
    { materialName: "Sajj Cheese", quantity: 40, unit: "portions", costPerUnit: 1.50, supplier: "Charles", isPOSItem: true, menuPrice: 3.00 },
    
    // Sajj Cheese & Ham - $3.5
    { materialName: "Sajj Cheese Ham", quantity: 35, unit: "portions", costPerUnit: 1.75, supplier: "Charles", isPOSItem: true, menuPrice: 3.50 },
    
    // Sajj Lahmeh b3ajin - $4.5
    { materialName: "Sajj Lahmeh b3ajin", quantity: 30, unit: "portions", costPerUnit: 2.25, supplier: "Charles", isPOSItem: true, menuPrice: 4.50 },
    
    // Sajj Lahmeh & Cheese - $5
    { materialName: "Sajj Lahmeh Cheese", quantity: 25, unit: "portions", costPerUnit: 2.50, supplier: "Charles", isPOSItem: true, menuPrice: 5.00 },

    // =============================================================================
    // SUSHI MENU - POS ITEMS WITH REAL MENU PRICES
    // =============================================================================
    ...sushiEntries,

    // =============================================================================
    // INGREDIENT MATERIALS - NON-POS ITEMS
    // =============================================================================
    { materialName: "Iceberg Lettuce", quantity: 25, unit: "kg", costPerUnit: 2.50, supplier: "Charles", isPOSItem: false },
    { materialName: "Rocca", quantity: 8, unit: "kg", costPerUnit: 4.00, supplier: "Charles", isPOSItem: false },
    { materialName: "Kale", quantity: 6, unit: "kg", costPerUnit: 5.00, supplier: "Charles", isPOSItem: false },
    { materialName: "Cherry Tomatoes", quantity: 20, unit: "kg", costPerUnit: 3.50, supplier: "Charles", isPOSItem: false },
    { materialName: "Onion", quantity: 30, unit: "kg", costPerUnit: 1.50, supplier: "Charles", isPOSItem: false },
    { materialName: "Bell Pepper", quantity: 15, unit: "kg", costPerUnit: 3.00, supplier: "Charles", isPOSItem: false },
    { materialName: "Mushroom", quantity: 12, unit: "kg", costPerUnit: 5.00, supplier: "Charles", isPOSItem: false },
    { materialName: "Avocado", quantity: 10, unit: "kg", costPerUnit: 8.00, supplier: "Charles", isPOSItem: false },
    { materialName: "Cucumber", quantity: 15, unit: "kg", costPerUnit: 2.00, supplier: "Charles", isPOSItem: false },
    { materialName: "Carrot", quantity: 20, unit: "kg", costPerUnit: 1.80, supplier: "Charles", isPOSItem: false },
    { materialName: "Red Cabbage", quantity: 10, unit: "kg", costPerUnit: 2.20, supplier: "Charles", isPOSItem: false },
    { materialName: "Corn", quantity: 8, unit: "kg", costPerUnit: 3.00, supplier: "Charles", isPOSItem: false },
    { materialName: "Pickles", quantity: 5, unit: "kg", costPerUnit: 4.50, supplier: "Charles", isPOSItem: false },
    { materialName: "Jalapeno", quantity: 3, unit: "kg", costPerUnit: 6.00, supplier: "Charles", isPOSItem: false },
    { materialName: "Black Olives", quantity: 4, unit: "kg", costPerUnit: 8.00, supplier: "Charles", isPOSItem: false },
    { materialName: "Mango", quantity: 12, unit: "kg", costPerUnit: 4.50, supplier: "Charles", isPOSItem: false },
    { materialName: "Strawberry", quantity: 6, unit: "kg", costPerUnit: 7.00, supplier: "Charles", isPOSItem: false },
    { materialName: "Kiwi", quantity: 5, unit: "kg", costPerUnit: 6.50, supplier: "Charles", isPOSItem: false },
    { materialName: "Edamame", quantity: 4, unit: "kg", costPerUnit: 8.50, supplier: "Charles", isPOSItem: false },
    { materialName: "Curly Fries", quantity: 20, unit: "kg", costPerUnit: 3.00, supplier: "Charles", isPOSItem: false },
    { materialName: "Mashed Potatoes", quantity: 15, unit: "kg", costPerUnit: 2.80, supplier: "Charles", isPOSItem: false },
    { materialName: "Coleslaw", quantity: 10, unit: "kg", costPerUnit: 3.50, supplier: "Charles", isPOSItem: false },
    { materialName: "Mixed Greens", quantity: 8, unit: "kg", costPerUnit: 4.20, supplier: "Charles", isPOSItem: false },
    { materialName: "Grilled Vegetables", quantity: 12, unit: "kg", costPerUnit: 5.50, supplier: "Charles", isPOSItem: false },

    // Bread & Grains
    { materialName: "Burger Bun", quantity: 20, unit: "pack", costPerUnit: 4.00, supplier: "Charles", isPOSItem: false },
    { materialName: "Crunchy Bun", quantity: 15, unit: "pack", costPerUnit: 5.00, supplier: "Charles", isPOSItem: false },
    { materialName: "Arabic Bread", quantity: 15, unit: "pack", costPerUnit: 2.50, supplier: "Charles", isPOSItem: false },
    { materialName: "Ciabatta Bread", quantity: 10, unit: "pack", costPerUnit: 6.00, supplier: "Charles", isPOSItem: false },
    { materialName: "Brown Bread", quantity: 12, unit: "pack", costPerUnit: 4.50, supplier: "Charles", isPOSItem: false },
    { materialName: "Tortilla Bread", quantity: 8, unit: "pack", costPerUnit: 3.50, supplier: "Charles", isPOSItem: false },
    { materialName: "Sourdough", quantity: 6, unit: "pack", costPerUnit: 8.00, supplier: "Charles", isPOSItem: false },
    { materialName: "Sajj Bread", quantity: 10, unit: "pack", costPerUnit: 3.00, supplier: "Charles", isPOSItem: false },

    // Pasta & Rice
    { materialName: "Penne Pasta", quantity: 25, unit: "kg", costPerUnit: 3.00, supplier: "Charles", isPOSItem: false },
    { materialName: "Fettuccine Pasta", quantity: 20, unit: "kg", costPerUnit: 3.50, supplier: "Charles", isPOSItem: false },
    { materialName: "Tagliatelle Pasta", quantity: 15, unit: "kg", costPerUnit: 4.00, supplier: "Charles", isPOSItem: false },
    { materialName: "Linguine Pasta", quantity: 12, unit: "kg", costPerUnit: 3.80, supplier: "Charles", isPOSItem: false },
    { materialName: "Fresh Noodles", quantity: 10, unit: "kg", costPerUnit: 5.00, supplier: "Charles", isPOSItem: false },
    { materialName: "White Rice", quantity: 20, unit: "kg", costPerUnit: 2.50, supplier: "Charles", isPOSItem: false },
    { materialName: "Sushi Rice", quantity: 15, unit: "kg", costPerUnit: 4.00, supplier: "Charles", isPOSItem: false },
    { materialName: "Quinoa", quantity: 8, unit: "kg", costPerUnit: 12.00, supplier: "Charles", isPOSItem: false },
    { materialName: "Mac n Cheese", quantity: 10, unit: "kg", costPerUnit: 6.50, supplier: "Charles", isPOSItem: false },

    // Nuts & Extras
    { materialName: "Walnuts", quantity: 5, unit: "kg", costPerUnit: 15.00, supplier: "Charles", isPOSItem: false },
    { materialName: "Cashew", quantity: 4, unit: "kg", costPerUnit: 20.00, supplier: "Charles", isPOSItem: false },
    { materialName: "Croutons", quantity: 6, unit: "kg", costPerUnit: 8.00, supplier: "Charles", isPOSItem: false },
    { materialName: "Nachos", quantity: 8, unit: "kg", costPerUnit: 4.50, supplier: "Charles", isPOSItem: false },
    { materialName: "Tortilla Chips", quantity: 10, unit: "kg", costPerUnit: 3.80, supplier: "Charles", isPOSItem: false },
    { materialName: "Dried Fruits", quantity: 3, unit: "kg", costPerUnit: 18.00, supplier: "Charles", isPOSItem: false },
    { materialName: "Cranberry", quantity: 2, unit: "kg", costPerUnit: 22.00, supplier: "Charles", isPOSItem: false },

    // Sauces (sample - key ones)
    { materialName: "Mayo Garlic Sauce", quantity: 10, unit: "l", costPerUnit: 8.00, supplier: "Charles", isPOSItem: false },
    { materialName: "BBQ Sauce", quantity: 8, unit: "l", costPerUnit: 6.00, supplier: "Charles", isPOSItem: false },
    { materialName: "Marinara Sauce", quantity: 15, unit: "l", costPerUnit: 5.00, supplier: "Charles", isPOSItem: false },
    { materialName: "Alfredo Sauce", quantity: 10, unit: "l", costPerUnit: 7.00, supplier: "Charles", isPOSItem: false },
    { materialName: "Pesto Sauce", quantity: 6, unit: "l", costPerUnit: 12.00, supplier: "Charles", isPOSItem: false },
    { materialName: "Buffalo Sauce", quantity: 5, unit: "l", costPerUnit: 8.50, supplier: "Charles", isPOSItem: false },
    { materialName: "Honey Mustard Sauce", quantity: 6, unit: "l", costPerUnit: 7.50, supplier: "Charles", isPOSItem: false },
    { materialName: "Special Sauce", quantity: 8, unit: "l", costPerUnit: 10.00, supplier: "Charles", isPOSItem: false },
    { materialName: "Oops Sauce", quantity: 5, unit: "l", costPerUnit: 12.00, supplier: "Charles", isPOSItem: false },

    // Sushi Ingredients
    { materialName: "Nori Sheets", quantity: 5, unit: "pack", costPerUnit: 12.00, supplier: "Charles", isPOSItem: false },
    { materialName: "Tobiko", quantity: 2, unit: "kg", costPerUnit: 45.00, supplier: "Charles", isPOSItem: false },
    { materialName: "Wasabi", quantity: 1, unit: "kg", costPerUnit: 80.00, supplier: "Charles", isPOSItem: false },
    { materialName: "Soy Sauce", quantity: 3, unit: "l", costPerUnit: 15.00, supplier: "Charles", isPOSItem: false },
    { materialName: "Sesame Seeds", quantity: 2, unit: "kg", costPerUnit: 12.00, supplier: "Charles", isPOSItem: false },
    { materialName: "Teriyaki Sauce", quantity: 4, unit: "l", costPerUnit: 9.00, supplier: "Charles", isPOSItem: false },

    // Condiments
    { materialName: "Zaatar", quantity: 5, unit: "kg", costPerUnit: 12.00, supplier: "Charles", isPOSItem: false },
    { materialName: "Ketchup", quantity: 8, unit: "l", costPerUnit: 4.00, supplier: "Charles", isPOSItem: false },
    { materialName: "Lahmeh", quantity: 12, unit: "kg", costPerUnit: 11.00, supplier: "Charles", isPOSItem: false }
  ];

  let createdCount = 0;
  let skippedCount = 0;

  for (const entryData of stockEntries) {
    try {
      const material = materialMap[entryData.materialName];
      if (!material) {
        console.log(`⚠️  Material not found: ${entryData.materialName}`);
        skippedCount++;
        continue;
      }

      // Check if stock entry already exists
      const existingEntry = await StockEntry.findOne({
        where: { 
          materialId: material.id,
          supplier: entryData.supplier 
        }
      });

      if (!existingEntry) {
        const stockEntryData = {
          materialId: material.id,
          supplier: entryData.supplier,
          purchasedQuantity: entryData.quantity,
          purchasedUnit: entryData.unit,
          costPerPurchasedUnit: entryData.costPerUnit,
          totalCost: entryData.quantity * entryData.costPerUnit,
          isPOSItem: entryData.isPOSItem,
          purchaseDate: new Date(),
          expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days from now
        };

        await StockEntry.create(stockEntryData);
        console.log(`✅ Created stock entry: ${entryData.materialName} - ${entryData.quantity} ${entryData.unit}`);
        createdCount++;
      } else {
        skippedCount++;
      }
    } catch (error) {
      console.error(`❌ Error creating stock entry for ${entryData.materialName}:`, error.message);
      skippedCount++;
    }
  }

  return { created: createdCount, skipped: skippedCount };
}

import Material from "../models/materials.js";
import StockEntry from "../models/StockEntry.js";

/**
 * Seed stock entries based on RAW INGREDIENTS for proper inventory management
 */
export async function seedStockEntries() {
  console.log("📦 Seeding stock entries for raw ingredients...");

  // Get all materials
  const materials = await Material.findAll();
  const materialMap = {};
  materials.forEach(material => {
    materialMap[material.name] = material;
  });

  const stockEntries = [
    // =============================================================================
    // PROTEINS
    // =============================================================================
    { materialName: "Beef Patty", quantity: 50, unit: "kg", costPerUnit: 12.0, supplier: "Charles", isPOSItem: false },
    { materialName: "Chicken Breast", quantity: 40, unit: "kg", costPerUnit: 8.5, supplier: "Charles", isPOSItem: false },
    { materialName: "Chicken Thigh", quantity: 30, unit: "kg", costPerUnit: 7.0, supplier: "Charles", isPOSItem: false },
    { materialName: "Crispy Chicken", quantity: 20, unit: "pack", costPerUnit: 15.0, supplier: "Charles", isPOSItem: false },
    { materialName: "Chicken Wings", quantity: 15, unit: "pack", costPerUnit: 18.0, supplier: "Charles", isPOSItem: false },
    { materialName: "Taouk", quantity: 25, unit: "kg", costPerUnit: 9.0, supplier: "Charles", isPOSItem: false },
    { materialName: "Beef Filet", quantity: 20, unit: "kg", costPerUnit: 25.0, supplier: "Charles", isPOSItem: false },
    { materialName: "Salmon", quantity: 15, unit: "kg", costPerUnit: 22.0, supplier: "Charles", isPOSItem: false },
    { materialName: "Shrimp", quantity: 12, unit: "kg", costPerUnit: 28.0, supplier: "Charles", isPOSItem: false },
    { materialName: "Tuna", quantity: 10, unit: "kg", costPerUnit: 30.0, supplier: "Charles", isPOSItem: false },
    { materialName: "Crab Sticks", quantity: 8, unit: "kg", costPerUnit: 25.0, supplier: "Charles", isPOSItem: false },
    { materialName: "Ham", quantity: 12, unit: "kg", costPerUnit: 15.0, supplier: "Charles", isPOSItem: false },
    { materialName: "Bacon", quantity: 8, unit: "kg", costPerUnit: 18.0, supplier: "Charles", isPOSItem: false },
    { materialName: "Pepperoni", quantity: 6, unit: "kg", costPerUnit: 20.0, supplier: "Charles", isPOSItem: false },
    { materialName: "Salami", quantity: 5, unit: "kg", costPerUnit: 22.0, supplier: "Charles", isPOSItem: false },

    // =============================================================================
    // DAIRY PRODUCTS
    // =============================================================================
    { materialName: "Mozzarella Cheese", quantity: 20, unit: "kg", costPerUnit: 12.0, supplier: "Charles", isPOSItem: false },
    { materialName: "Cheddar Cheese", quantity: 15, unit: "kg", costPerUnit: 14.0, supplier: "Charles", isPOSItem: false },
    { materialName: "Halloumi", quantity: 12, unit: "kg", costPerUnit: 16.0, supplier: "Charles", isPOSItem: false },
    { materialName: "Parmesan", quantity: 8, unit: "kg", costPerUnit: 25.0, supplier: "Charles", isPOSItem: false },
    { materialName: "Feta Cheese", quantity: 10, unit: "kg", costPerUnit: 18.0, supplier: "Charles", isPOSItem: false },
    { materialName: "Cream Cheese", quantity: 8, unit: "kg", costPerUnit: 10.0, supplier: "Charles", isPOSItem: false },
    { materialName: "Emental Cheese", quantity: 6, unit: "kg", costPerUnit: 20.0, supplier: "Charles", isPOSItem: false },
    { materialName: "Labneh", quantity: 15, unit: "kg", costPerUnit: 8.0, supplier: "Charles", isPOSItem: false },
    { materialName: "Eggs", quantity: 200, unit: "piece", costPerUnit: 0.3, supplier: "Charles", isPOSItem: false },

    // =============================================================================
    // VEGETABLES & PRODUCE
    // =============================================================================
    { materialName: "Iceberg Lettuce", quantity: 25, unit: "kg", costPerUnit: 2.5, supplier: "Charles", isPOSItem: false },
    { materialName: "Rocca", quantity: 15, unit: "kg", costPerUnit: 8.0, supplier: "Charles", isPOSItem: false },
    { materialName: "Kale", quantity: 12, unit: "kg", costPerUnit: 9.0, supplier: "Charles", isPOSItem: false },
    { materialName: "Cherry Tomatoes", quantity: 20, unit: "kg", costPerUnit: 3.5, supplier: "Charles", isPOSItem: false },
    { materialName: "Onion", quantity: 30, unit: "kg", costPerUnit: 1.8, supplier: "Charles", isPOSItem: false },
    { materialName: "Bell Pepper", quantity: 18, unit: "kg", costPerUnit: 4.0, supplier: "Charles", isPOSItem: false },
    { materialName: "Mushroom", quantity: 15, unit: "kg", costPerUnit: 8.0, supplier: "Charles", isPOSItem: false },
    { materialName: "Avocado", quantity: 20, unit: "kg", costPerUnit: 15.0, supplier: "Charles", isPOSItem: false },
    { materialName: "Cucumber", quantity: 25, unit: "kg", costPerUnit: 2.2, supplier: "Charles", isPOSItem: false },
    { materialName: "Carrot", quantity: 20, unit: "kg", costPerUnit: 1.5, supplier: "Charles", isPOSItem: false },
    { materialName: "Red Cabbage", quantity: 15, unit: "kg", costPerUnit: 2.8, supplier: "Charles", isPOSItem: false },
    { materialName: "Corn", quantity: 12, unit: "kg", costPerUnit: 3.0, supplier: "Charles", isPOSItem: false },
    { materialName: "Pickles", quantity: 10, unit: "kg", costPerUnit: 5.0, supplier: "Charles", isPOSItem: false },
    { materialName: "Jalapeno", quantity: 8, unit: "kg", costPerUnit: 6.0, supplier: "Charles", isPOSItem: false },
    { materialName: "Black Olives", quantity: 10, unit: "kg", costPerUnit: 8.0, supplier: "Charles", isPOSItem: false },
    { materialName: "Mango", quantity: 15, unit: "kg", costPerUnit: 12.0, supplier: "Charles", isPOSItem: false },
    { materialName: "Strawberry", quantity: 10, unit: "kg", costPerUnit: 15.0, supplier: "Charles", isPOSItem: false },
    { materialName: "Kiwi", quantity: 8, unit: "kg", costPerUnit: 10.0, supplier: "Charles", isPOSItem: false },
    { materialName: "Edamame", quantity: 12, unit: "kg", costPerUnit: 8.0, supplier: "Charles", isPOSItem: false },
    { materialName: "French Fries", quantity: 50, unit: "kg", costPerUnit: 3.0, supplier: "Charles", isPOSItem: false },
    { materialName: "Wedges", quantity: 40, unit: "kg", costPerUnit: 3.5, supplier: "Charles", isPOSItem: false },
    { materialName: "Curly Fries", quantity: 30, unit: "kg", costPerUnit: 4.0, supplier: "Charles", isPOSItem: false },
    { materialName: "Mashed Potatoes", quantity: 25, unit: "kg", costPerUnit: 2.8, supplier: "Charles", isPOSItem: false },
    { materialName: "Coleslaw", quantity: 15, unit: "kg", costPerUnit: 4.5, supplier: "Charles", isPOSItem: false },
    { materialName: "Mixed Greens", quantity: 20, unit: "kg", costPerUnit: 6.0, supplier: "Charles", isPOSItem: false },

    // =============================================================================
    // GRAINS & CARBS
    // =============================================================================
    { materialName: "Burger Bun", quantity: 200, unit: "piece", costPerUnit: 0.5, supplier: "Charles", isPOSItem: false },
    { materialName: "Sandwich Bread", quantity: 100, unit: "piece", costPerUnit: 0.4, supplier: "Charles", isPOSItem: false },
    { materialName: "Pita Bread", quantity: 150, unit: "piece", costPerUnit: 0.3, supplier: "Charles", isPOSItem: false },
    { materialName: "Sajj Bread", quantity: 100, unit: "piece", costPerUnit: 0.35, supplier: "Charles", isPOSItem: false },
    { materialName: "Pizza Dough", quantity: 50, unit: "piece", costPerUnit: 1.2, supplier: "Charles", isPOSItem: false },
    { materialName: "Penne", quantity: 25, unit: "kg", costPerUnit: 3.5, supplier: "Charles", isPOSItem: false },
    { materialName: "Tagliatelle", quantity: 20, unit: "kg", costPerUnit: 4.0, supplier: "Charles", isPOSItem: false },
    { materialName: "Linguine", quantity: 15, unit: "kg", costPerUnit: 4.2, supplier: "Charles", isPOSItem: false },
    { materialName: "Fresh Noodles", quantity: 20, unit: "kg", costPerUnit: 5.0, supplier: "Charles", isPOSItem: false },
    { materialName: "White Rice", quantity: 30, unit: "kg", costPerUnit: 2.8, supplier: "Charles", isPOSItem: false },
    { materialName: "Sushi Rice", quantity: 25, unit: "kg", costPerUnit: 4.0, supplier: "Charles", isPOSItem: false },
    { materialName: "Quinoa", quantity: 15, unit: "kg", costPerUnit: 8.0, supplier: "Charles", isPOSItem: false },

    // =============================================================================
    // SAUCES & CONDIMENTS
    // =============================================================================
    { materialName: "Mayo Garlic Sauce", quantity: 10, unit: "l", costPerUnit: 8.0, supplier: "Charles", isPOSItem: false },
    { materialName: "BBQ Sauce", quantity: 8, unit: "l", costPerUnit: 6.0, supplier: "Charles", isPOSItem: false },
    { materialName: "Marinara Sauce", quantity: 15, unit: "l", costPerUnit: 5.0, supplier: "Charles", isPOSItem: false },
    { materialName: "Alfredo Sauce", quantity: 10, unit: "l", costPerUnit: 7.0, supplier: "Charles", isPOSItem: false },
    { materialName: "Pesto Sauce", quantity: 6, unit: "l", costPerUnit: 12.0, supplier: "Charles", isPOSItem: false },
    { materialName: "Buffalo Sauce", quantity: 5, unit: "l", costPerUnit: 8.5, supplier: "Charles", isPOSItem: false },
    { materialName: "Honey Mustard Sauce", quantity: 6, unit: "l", costPerUnit: 7.5, supplier: "Charles", isPOSItem: false },
    { materialName: "Caesar Sauce", quantity: 8, unit: "l", costPerUnit: 9.0, supplier: "Charles", isPOSItem: false },
    { materialName: "Balsamic Sauce", quantity: 5, unit: "l", costPerUnit: 12.0, supplier: "Charles", isPOSItem: false },
    { materialName: "Lemon Mayo Sauce", quantity: 8, unit: "l", costPerUnit: 8.0, supplier: "Charles", isPOSItem: false },
    { materialName: "Olive Oil Sauce", quantity: 10, unit: "l", costPerUnit: 15.0, supplier: "Charles", isPOSItem: false },
    { materialName: "Teriyaki Sauce", quantity: 6, unit: "l", costPerUnit: 9.0, supplier: "Charles", isPOSItem: false },
    { materialName: "Soy Sauce", quantity: 5, unit: "l", costPerUnit: 8.0, supplier: "Charles", isPOSItem: false },
    { materialName: "Ketchup", quantity: 12, unit: "l", costPerUnit: 4.0, supplier: "Charles", isPOSItem: false },
    { materialName: "Zaatar", quantity: 8, unit: "kg", costPerUnit: 12.0, supplier: "Charles", isPOSItem: false },
    { materialName: "Cheese Sauce", quantity: 8, unit: "l", costPerUnit: 9.0, supplier: "Charles", isPOSItem: false },
    { materialName: "Cheddar Sauce", quantity: 6, unit: "l", costPerUnit: 10.0, supplier: "Charles", isPOSItem: false },
    { materialName: "Creamy Sauce", quantity: 10, unit: "l", costPerUnit: 8.5, supplier: "Charles", isPOSItem: false },
    { materialName: "Fresh Mushroom", quantity: 12, unit: "kg", costPerUnit: 9.0, supplier: "Charles", isPOSItem: false },

    // =============================================================================
    // SUSHI INGREDIENTS
    // =============================================================================
    { materialName: "Nori Sheets", quantity: 10, unit: "pack", costPerUnit: 12.0, supplier: "Charles", isPOSItem: false },
    { materialName: "Tobiko", quantity: 3, unit: "kg", costPerUnit: 45.0, supplier: "Charles", isPOSItem: false },
    { materialName: "Wasabi", quantity: 2, unit: "kg", costPerUnit: 80.0, supplier: "Charles", isPOSItem: false },
    { materialName: "Sesame Seeds", quantity: 5, unit: "kg", costPerUnit: 12.0, supplier: "Charles", isPOSItem: false },
    { materialName: "Crispy Flakes", quantity: 8, unit: "kg", costPerUnit: 15.0, supplier: "Charles", isPOSItem: false },

    // =============================================================================
    // NUTS & EXTRAS
    // =============================================================================
    { materialName: "Walnuts", quantity: 8, unit: "kg", costPerUnit: 18.0, supplier: "Charles", isPOSItem: false },
    { materialName: "Cashew", quantity: 6, unit: "kg", costPerUnit: 22.0, supplier: "Charles", isPOSItem: false },
    { materialName: "Croutons", quantity: 10, unit: "kg", costPerUnit: 8.0, supplier: "Charles", isPOSItem: false },
    { materialName: "Dried Fruits", quantity: 5, unit: "kg", costPerUnit: 20.0, supplier: "Charles", isPOSItem: false },
    { materialName: "Cranberry", quantity: 4, unit: "kg", costPerUnit: 25.0, supplier: "Charles", isPOSItem: false },
    { materialName: "Dried Figs", quantity: 3, unit: "kg", costPerUnit: 22.0, supplier: "Charles", isPOSItem: false },

    // =============================================================================
    // BEVERAGES - BEERS & ENERGY DRINKS
    // =============================================================================
    { materialName: "Mexican Red Bull", quantity: 48, unit: "piece", costPerUnit: 3.5, supplier: "Charles", isPOSItem: true },
    { materialName: "Almaza", quantity: 72, unit: "piece", costPerUnit: 2.5, supplier: "Charles", isPOSItem: true },
    { materialName: "Almaza Light", quantity: 48, unit: "piece", costPerUnit: 3.2, supplier: "Charles", isPOSItem: true },
    { materialName: "Mexican Beer", quantity: 60, unit: "piece", costPerUnit: 3.2, supplier: "Charles", isPOSItem: true },
    { materialName: "Almaza Rose", quantity: 36, unit: "piece", costPerUnit: 4.0, supplier: "Charles", isPOSItem: true },
    { materialName: "Mexican Energy Drink", quantity: 48, unit: "piece", costPerUnit: 2.8, supplier: "Charles", isPOSItem: true },

    // =============================================================================
    // BEVERAGES - WINES
    // =============================================================================
    { materialName: "Ksara Red Wine Glass", quantity: 100, unit: "piece", costPerUnit: 3.0, supplier: "Charles", isPOSItem: true },
    { materialName: "Ksara Red Wine Bottle", quantity: 24, unit: "piece", costPerUnit: 18.0, supplier: "Charles", isPOSItem: true },
    { materialName: "Ksara White Wine Glass", quantity: 100, unit: "piece", costPerUnit: 3.0, supplier: "Charles", isPOSItem: true },
    { materialName: "Ksara White Wine Bottle", quantity: 24, unit: "piece", costPerUnit: 18.0, supplier: "Charles", isPOSItem: true },
    { materialName: "Ksara Rose Wine Glass", quantity: 100, unit: "piece", costPerUnit: 3.0, supplier: "Charles", isPOSItem: true },
    { materialName: "Ksara Rose Wine Bottle", quantity: 24, unit: "piece", costPerUnit: 18.0, supplier: "Charles", isPOSItem: true },

    // =============================================================================
    // BEVERAGES - SPIRITS (BOTTLES)
    // =============================================================================
    { materialName: "Jose Cuervo Silver Bottle", quantity: 12, unit: "piece", costPerUnit: 25.0, supplier: "Charles", isPOSItem: true },
    { materialName: "Jose Cuervo Gold Bottle", quantity: 8, unit: "piece", costPerUnit: 38.0, supplier: "Charles", isPOSItem: true },
    { materialName: "Beefeater Bottle", quantity: 6, unit: "piece", costPerUnit: 45.0, supplier: "Charles", isPOSItem: true },
    { materialName: "Tanqueray Bottle", quantity: 6, unit: "piece", costPerUnit: 52.0, supplier: "Charles", isPOSItem: true },
    { materialName: "Bombay Bottle", quantity: 8, unit: "piece", costPerUnit: 32.0, supplier: "Charles", isPOSItem: true },
    { materialName: "Gordons Bottle", quantity: 8, unit: "piece", costPerUnit: 42.0, supplier: "Charles", isPOSItem: true },
    { materialName: "J&B Bottle", quantity: 6, unit: "piece", costPerUnit: 52.0, supplier: "Charles", isPOSItem: true },
    { materialName: "Jack Daniels Bottle", quantity: 6, unit: "piece", costPerUnit: 65.0, supplier: "Charles", isPOSItem: true },
    { materialName: "Glenfiddich Bottle", quantity: 4, unit: "piece", costPerUnit: 78.0, supplier: "Charles", isPOSItem: true },
    { materialName: "Black Label Bottle", quantity: 6, unit: "piece", costPerUnit: 58.0, supplier: "Charles", isPOSItem: true },
    { materialName: "Red Label Bottle", quantity: 8, unit: "piece", costPerUnit: 42.0, supplier: "Charles", isPOSItem: true },
    { materialName: "Jameson Bottle", quantity: 6, unit: "piece", costPerUnit: 45.0, supplier: "Charles", isPOSItem: true },
    { materialName: "Chivas 12y Bottle", quantity: 4, unit: "piece", costPerUnit: 65.0, supplier: "Charles", isPOSItem: true },
    { materialName: "Chivas 15y Bottle", quantity: 3, unit: "piece", costPerUnit: 98.0, supplier: "Charles", isPOSItem: true },
    { materialName: "Jim Beam Bottle", quantity: 6, unit: "piece", costPerUnit: 48.0, supplier: "Charles", isPOSItem: true },
    { materialName: "Grey Goose Bottle", quantity: 4, unit: "piece", costPerUnit: 78.0, supplier: "Charles", isPOSItem: true },
    { materialName: "Belvedere Bottle", quantity: 3, unit: "piece", costPerUnit: 92.0, supplier: "Charles", isPOSItem: true },
    { materialName: "Stoli Gold Bottle", quantity: 6, unit: "piece", costPerUnit: 65.0, supplier: "Charles", isPOSItem: true },
    { materialName: "Stoli Red Bottle", quantity: 8, unit: "piece", costPerUnit: 45.0, supplier: "Charles", isPOSItem: true },
    { materialName: "Smirnoff Bottle", quantity: 10, unit: "piece", costPerUnit: 38.0, supplier: "Charles", isPOSItem: true },
    { materialName: "Russian Standard Bottle", quantity: 6, unit: "piece", costPerUnit: 55.0, supplier: "Charles", isPOSItem: true },

    // =============================================================================
    // BEVERAGES - SOFT DRINKS & JUICES
    // =============================================================================
    { materialName: "Red Bull", quantity: 72, unit: "piece", costPerUnit: 3.2, supplier: "Charles", isPOSItem: true },
    { materialName: "Water Small", quantity: 200, unit: "piece", costPerUnit: 0.8, supplier: "Charles", isPOSItem: true },
    { materialName: "Water Large", quantity: 100, unit: "piece", costPerUnit: 1.8, supplier: "Charles", isPOSItem: true },
    { materialName: "Soft Drinks", quantity: 120, unit: "piece", costPerUnit: 1.8, supplier: "Charles", isPOSItem: true },
    { materialName: "Sparkling Water", quantity: 60, unit: "piece", costPerUnit: 2.5, supplier: "Charles", isPOSItem: true },
    { materialName: "Energy Drink", quantity: 72, unit: "piece", costPerUnit: 2.5, supplier: "Charles", isPOSItem: true },

    // =============================================================================
    // BEVERAGES - COFFEE INGREDIENTS
    // =============================================================================
    { materialName: "Coffee Beans", quantity: 25, unit: "kg", costPerUnit: 18.0, supplier: "Charles", isPOSItem: false },
    { materialName: "Milk", quantity: 50, unit: "l", costPerUnit: 1.2, supplier: "Charles", isPOSItem: false },
    { materialName: "Sugar", quantity: 20, unit: "kg", costPerUnit: 2.5, supplier: "Charles", isPOSItem: false },
    { materialName: "Vanilla Syrup", quantity: 10, unit: "l", costPerUnit: 8.0, supplier: "Charles", isPOSItem: false },
    { materialName: "Caramel Syrup", quantity: 10, unit: "l", costPerUnit: 8.5, supplier: "Charles", isPOSItem: false },
    { materialName: "Chocolate Syrup", quantity: 8, unit: "l", costPerUnit: 9.0, supplier: "Charles", isPOSItem: false },
    { materialName: "Whipped Cream", quantity: 15, unit: "l", costPerUnit: 6.0, supplier: "Charles", isPOSItem: false },

    // =============================================================================
    // BEVERAGES - SMOOTHIE INGREDIENTS
    // =============================================================================
    { materialName: "Frozen Mango", quantity: 20, unit: "kg", costPerUnit: 8.0, supplier: "Charles", isPOSItem: false },
    { materialName: "Frozen Strawberries", quantity: 18, unit: "kg", costPerUnit: 9.0, supplier: "Charles", isPOSItem: false },
    { materialName: "Frozen Mixed Berries", quantity: 15, unit: "kg", costPerUnit: 12.0, supplier: "Charles", isPOSItem: false },
    { materialName: "Frozen Peaches", quantity: 15, unit: "kg", costPerUnit: 8.5, supplier: "Charles", isPOSItem: false },
    { materialName: "Passion Fruit Pulp", quantity: 8, unit: "kg", costPerUnit: 15.0, supplier: "Charles", isPOSItem: false },
    { materialName: "Ice Cream Vanilla", quantity: 20, unit: "l", costPerUnit: 8.0, supplier: "Charles", isPOSItem: false },
    { materialName: "Ice Cream Chocolate", quantity: 15, unit: "l", costPerUnit: 8.5, supplier: "Charles", isPOSItem: false },
    { materialName: "Ice Cream Strawberry", quantity: 12, unit: "l", costPerUnit: 9.0, supplier: "Charles", isPOSItem: false },

    // =============================================================================
    // BEVERAGES - COCKTAIL INGREDIENTS
    // =============================================================================
    { materialName: "Lime Juice", quantity: 15, unit: "l", costPerUnit: 12.0, supplier: "Charles", isPOSItem: false },
    { materialName: "Lemon Juice", quantity: 15, unit: "l", costPerUnit: 11.0, supplier: "Charles", isPOSItem: false },
    { materialName: "Orange Juice", quantity: 25, unit: "l", costPerUnit: 8.0, supplier: "Charles", isPOSItem: false },
    { materialName: "Cranberry Juice", quantity: 12, unit: "l", costPerUnit: 10.0, supplier: "Charles", isPOSItem: false },
    { materialName: "Pineapple Juice", quantity: 15, unit: "l", costPerUnit: 9.0, supplier: "Charles", isPOSItem: false },
    { materialName: "Coconut Syrup", quantity: 8, unit: "l", costPerUnit: 12.0, supplier: "Charles", isPOSItem: false },
    { materialName: "Blue Curacao", quantity: 6, unit: "l", costPerUnit: 25.0, supplier: "Charles", isPOSItem: false },
    { materialName: "Triple Sec", quantity: 8, unit: "l", costPerUnit: 20.0, supplier: "Charles", isPOSItem: false },
    { materialName: "Grenadine", quantity: 10, unit: "l", costPerUnit: 8.0, supplier: "Charles", isPOSItem: false },
    { materialName: "Simple Syrup", quantity: 15, unit: "l", costPerUnit: 5.0, supplier: "Charles", isPOSItem: false },
    { materialName: "Ginger Beer", quantity: 48, unit: "piece", costPerUnit: 2.5, supplier: "Charles", isPOSItem: false },
    { materialName: "Tonic Water", quantity: 60, unit: "piece", costPerUnit: 2.0, supplier: "Charles", isPOSItem: false },
    { materialName: "Club Soda", quantity: 60, unit: "piece", costPerUnit: 1.8, supplier: "Charles", isPOSItem: false },
    { materialName: "Fresh Mint", quantity: 5, unit: "kg", costPerUnit: 15.0, supplier: "Charles", isPOSItem: false },
    { materialName: "Fresh Basil", quantity: 3, unit: "kg", costPerUnit: 18.0, supplier: "Charles", isPOSItem: false },

    // =============================================================================
    // SHISHA SUPPLIES
    // =============================================================================
    { materialName: "Tobacco", quantity: 50, unit: "g", costPerUnit: 0.5, supplier: "Charles", isPOSItem: false },
    { materialName: "Charcoal", quantity: 100, unit: "g", costPerUnit: 0.3, supplier: "Charles", isPOSItem: false }
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
        console.log(`⏭️  Skipped existing stock entry: ${entryData.materialName} - ${entryData.supplier}`);
        skippedCount++;
      }
    } catch (error) {
      console.error(`❌ Error creating stock entry for ${entryData.materialName}:`, error.message);
      skippedCount++;
    }
  }

  return { created: createdCount, skipped: skippedCount };
}

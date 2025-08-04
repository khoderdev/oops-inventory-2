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
    { materialName: "Beef Patty", quantity: 50, unit: "kg", costPerUnit: 12.00, supplier: "Charles", isPOSItem: false },
    { materialName: "Chicken Breast", quantity: 40, unit: "kg", costPerUnit: 8.50, supplier: "Charles", isPOSItem: false },
    { materialName: "Chicken Thigh", quantity: 30, unit: "kg", costPerUnit: 7.00, supplier: "Charles", isPOSItem: false },
    { materialName: "Crispy Chicken", quantity: 20, unit: "pack", costPerUnit: 15.00, supplier: "Charles", isPOSItem: false },
    { materialName: "Chicken Wings", quantity: 15, unit: "pack", costPerUnit: 18.00, supplier: "Charles", isPOSItem: false },
    { materialName: "Taouk", quantity: 25, unit: "kg", costPerUnit: 9.00, supplier: "Charles", isPOSItem: false },
    { materialName: "Beef Filet", quantity: 20, unit: "kg", costPerUnit: 25.00, supplier: "Charles", isPOSItem: false },
    { materialName: "Salmon", quantity: 15, unit: "kg", costPerUnit: 22.00, supplier: "Charles", isPOSItem: false },
    { materialName: "Shrimp", quantity: 12, unit: "kg", costPerUnit: 28.00, supplier: "Charles", isPOSItem: false },
    { materialName: "Tuna", quantity: 10, unit: "kg", costPerUnit: 30.00, supplier: "Charles", isPOSItem: false },
    { materialName: "Crab Sticks", quantity: 8, unit: "kg", costPerUnit: 25.00, supplier: "Charles", isPOSItem: false },
    { materialName: "Ham", quantity: 12, unit: "kg", costPerUnit: 15.00, supplier: "Charles", isPOSItem: false },
    { materialName: "Bacon", quantity: 8, unit: "kg", costPerUnit: 18.00, supplier: "Charles", isPOSItem: false },
    { materialName: "Pepperoni", quantity: 6, unit: "kg", costPerUnit: 20.00, supplier: "Charles", isPOSItem: false },
    { materialName: "Salami", quantity: 5, unit: "kg", costPerUnit: 22.00, supplier: "Charles", isPOSItem: false },

    // =============================================================================
    // DAIRY PRODUCTS
    // =============================================================================
    { materialName: "Mozzarella Cheese", quantity: 20, unit: "kg", costPerUnit: 12.00, supplier: "Charles", isPOSItem: false },
    { materialName: "Cheddar Cheese", quantity: 15, unit: "kg", costPerUnit: 14.00, supplier: "Charles", isPOSItem: false },
    { materialName: "Halloumi", quantity: 12, unit: "kg", costPerUnit: 16.00, supplier: "Charles", isPOSItem: false },
    { materialName: "Parmesan", quantity: 8, unit: "kg", costPerUnit: 25.00, supplier: "Charles", isPOSItem: false },
    { materialName: "Feta Cheese", quantity: 10, unit: "kg", costPerUnit: 18.00, supplier: "Charles", isPOSItem: false },
    { materialName: "Cream Cheese", quantity: 8, unit: "kg", costPerUnit: 10.00, supplier: "Charles", isPOSItem: false },
    { materialName: "Emental Cheese", quantity: 6, unit: "kg", costPerUnit: 20.00, supplier: "Charles", isPOSItem: false },
    { materialName: "Labneh", quantity: 15, unit: "kg", costPerUnit: 8.00, supplier: "Charles", isPOSItem: false },
    { materialName: "Eggs", quantity: 200, unit: "piece", costPerUnit: 0.30, supplier: "Charles", isPOSItem: false },

    // =============================================================================
    // VEGETABLES & PRODUCE
    // =============================================================================
    { materialName: "Iceberg Lettuce", quantity: 25, unit: "kg", costPerUnit: 2.50, supplier: "Charles", isPOSItem: false },
    { materialName: "Rocca", quantity: 15, unit: "kg", costPerUnit: 8.00, supplier: "Charles", isPOSItem: false },
    { materialName: "Kale", quantity: 12, unit: "kg", costPerUnit: 9.00, supplier: "Charles", isPOSItem: false },
    { materialName: "Cherry Tomatoes", quantity: 20, unit: "kg", costPerUnit: 3.50, supplier: "Charles", isPOSItem: false },
    { materialName: "Onion", quantity: 30, unit: "kg", costPerUnit: 1.80, supplier: "Charles", isPOSItem: false },
    { materialName: "Bell Pepper", quantity: 18, unit: "kg", costPerUnit: 4.00, supplier: "Charles", isPOSItem: false },
    { materialName: "Mushroom", quantity: 15, unit: "kg", costPerUnit: 8.00, supplier: "Charles", isPOSItem: false },
    { materialName: "Avocado", quantity: 20, unit: "kg", costPerUnit: 15.00, supplier: "Charles", isPOSItem: false },
    { materialName: "Cucumber", quantity: 25, unit: "kg", costPerUnit: 2.20, supplier: "Charles", isPOSItem: false },
    { materialName: "Carrot", quantity: 20, unit: "kg", costPerUnit: 1.50, supplier: "Charles", isPOSItem: false },
    { materialName: "Red Cabbage", quantity: 15, unit: "kg", costPerUnit: 2.80, supplier: "Charles", isPOSItem: false },
    { materialName: "Corn", quantity: 12, unit: "kg", costPerUnit: 3.00, supplier: "Charles", isPOSItem: false },
    { materialName: "Pickles", quantity: 10, unit: "kg", costPerUnit: 5.00, supplier: "Charles", isPOSItem: false },
    { materialName: "Jalapeno", quantity: 8, unit: "kg", costPerUnit: 6.00, supplier: "Charles", isPOSItem: false },
    { materialName: "Black Olives", quantity: 10, unit: "kg", costPerUnit: 8.00, supplier: "Charles", isPOSItem: false },
    { materialName: "Mango", quantity: 15, unit: "kg", costPerUnit: 12.00, supplier: "Charles", isPOSItem: false },
    { materialName: "Strawberry", quantity: 10, unit: "kg", costPerUnit: 15.00, supplier: "Charles", isPOSItem: false },
    { materialName: "Kiwi", quantity: 8, unit: "kg", costPerUnit: 10.00, supplier: "Charles", isPOSItem: false },
    { materialName: "Edamame", quantity: 12, unit: "kg", costPerUnit: 8.00, supplier: "Charles", isPOSItem: false },
    { materialName: "French Fries", quantity: 50, unit: "kg", costPerUnit: 3.00, supplier: "Charles", isPOSItem: false },
    { materialName: "Wedges", quantity: 40, unit: "kg", costPerUnit: 3.50, supplier: "Charles", isPOSItem: false },
    { materialName: "Curly Fries", quantity: 30, unit: "kg", costPerUnit: 4.00, supplier: "Charles", isPOSItem: false },
    { materialName: "Mashed Potatoes", quantity: 25, unit: "kg", costPerUnit: 2.80, supplier: "Charles", isPOSItem: false },
    { materialName: "Coleslaw", quantity: 15, unit: "kg", costPerUnit: 4.50, supplier: "Charles", isPOSItem: false },
    { materialName: "Mixed Greens", quantity: 20, unit: "kg", costPerUnit: 6.00, supplier: "Charles", isPOSItem: false },

    // =============================================================================
    // GRAINS & CARBS
    // =============================================================================
    { materialName: "Burger Bun", quantity: 200, unit: "piece", costPerUnit: 0.50, supplier: "Charles", isPOSItem: false },
    { materialName: "Sandwich Bread", quantity: 100, unit: "piece", costPerUnit: 0.40, supplier: "Charles", isPOSItem: false },
    { materialName: "Pita Bread", quantity: 150, unit: "piece", costPerUnit: 0.30, supplier: "Charles", isPOSItem: false },
    { materialName: "Sajj Bread", quantity: 100, unit: "piece", costPerUnit: 0.35, supplier: "Charles", isPOSItem: false },
    { materialName: "Pizza Dough", quantity: 50, unit: "piece", costPerUnit: 1.20, supplier: "Charles", isPOSItem: false },
    { materialName: "Penne", quantity: 25, unit: "kg", costPerUnit: 3.50, supplier: "Charles", isPOSItem: false },
    { materialName: "Tagliatelle", quantity: 20, unit: "kg", costPerUnit: 4.00, supplier: "Charles", isPOSItem: false },
    { materialName: "Linguine", quantity: 15, unit: "kg", costPerUnit: 4.20, supplier: "Charles", isPOSItem: false },
    { materialName: "Fresh Noodles", quantity: 20, unit: "kg", costPerUnit: 5.00, supplier: "Charles", isPOSItem: false },
    { materialName: "White Rice", quantity: 30, unit: "kg", costPerUnit: 2.80, supplier: "Charles", isPOSItem: false },
    { materialName: "Sushi Rice", quantity: 25, unit: "kg", costPerUnit: 4.00, supplier: "Charles", isPOSItem: false },
    { materialName: "Quinoa", quantity: 15, unit: "kg", costPerUnit: 8.00, supplier: "Charles", isPOSItem: false },

    // =============================================================================
    // SAUCES & CONDIMENTS
    // =============================================================================
    { materialName: "Mayo Garlic Sauce", quantity: 10, unit: "l", costPerUnit: 8.00, supplier: "Charles", isPOSItem: false },
    { materialName: "BBQ Sauce", quantity: 8, unit: "l", costPerUnit: 6.00, supplier: "Charles", isPOSItem: false },
    { materialName: "Marinara Sauce", quantity: 15, unit: "l", costPerUnit: 5.00, supplier: "Charles", isPOSItem: false },
    { materialName: "Alfredo Sauce", quantity: 10, unit: "l", costPerUnit: 7.00, supplier: "Charles", isPOSItem: false },
    { materialName: "Pesto Sauce", quantity: 6, unit: "l", costPerUnit: 12.00, supplier: "Charles", isPOSItem: false },
    { materialName: "Buffalo Sauce", quantity: 5, unit: "l", costPerUnit: 8.50, supplier: "Charles", isPOSItem: false },
    { materialName: "Honey Mustard Sauce", quantity: 6, unit: "l", costPerUnit: 7.50, supplier: "Charles", isPOSItem: false },
    { materialName: "Caesar Sauce", quantity: 8, unit: "l", costPerUnit: 9.00, supplier: "Charles", isPOSItem: false },
    { materialName: "Balsamic Sauce", quantity: 5, unit: "l", costPerUnit: 12.00, supplier: "Charles", isPOSItem: false },
    { materialName: "Lemon Mayo Sauce", quantity: 8, unit: "l", costPerUnit: 8.00, supplier: "Charles", isPOSItem: false },
    { materialName: "Olive Oil Sauce", quantity: 10, unit: "l", costPerUnit: 15.00, supplier: "Charles", isPOSItem: false },
    { materialName: "Teriyaki Sauce", quantity: 6, unit: "l", costPerUnit: 9.00, supplier: "Charles", isPOSItem: false },
    { materialName: "Soy Sauce", quantity: 5, unit: "l", costPerUnit: 8.00, supplier: "Charles", isPOSItem: false },
    { materialName: "Ketchup", quantity: 12, unit: "l", costPerUnit: 4.00, supplier: "Charles", isPOSItem: false },
    { materialName: "Zaatar", quantity: 8, unit: "kg", costPerUnit: 12.00, supplier: "Charles", isPOSItem: false },
    { materialName: "Cheese Sauce", quantity: 8, unit: "l", costPerUnit: 9.00, supplier: "Charles", isPOSItem: false },
    { materialName: "Cheddar Sauce", quantity: 6, unit: "l", costPerUnit: 10.00, supplier: "Charles", isPOSItem: false },
    { materialName: "Creamy Sauce", quantity: 10, unit: "l", costPerUnit: 8.50, supplier: "Charles", isPOSItem: false },
    { materialName: "Fresh Mushroom", quantity: 12, unit: "kg", costPerUnit: 9.00, supplier: "Charles", isPOSItem: false },

    // =============================================================================
    // SUSHI INGREDIENTS
    // =============================================================================
    { materialName: "Nori Sheets", quantity: 10, unit: "pack", costPerUnit: 12.00, supplier: "Charles", isPOSItem: false },
    { materialName: "Tobiko", quantity: 3, unit: "kg", costPerUnit: 45.00, supplier: "Charles", isPOSItem: false },
    { materialName: "Wasabi", quantity: 2, unit: "kg", costPerUnit: 80.00, supplier: "Charles", isPOSItem: false },
    { materialName: "Sesame Seeds", quantity: 5, unit: "kg", costPerUnit: 12.00, supplier: "Charles", isPOSItem: false },
    { materialName: "Crispy Flakes", quantity: 8, unit: "kg", costPerUnit: 15.00, supplier: "Charles", isPOSItem: false },

    // =============================================================================
    // NUTS & EXTRAS
    // =============================================================================
    { materialName: "Walnuts", quantity: 8, unit: "kg", costPerUnit: 18.00, supplier: "Charles", isPOSItem: false },
    { materialName: "Cashew", quantity: 6, unit: "kg", costPerUnit: 22.00, supplier: "Charles", isPOSItem: false },
    { materialName: "Croutons", quantity: 10, unit: "kg", costPerUnit: 8.00, supplier: "Charles", isPOSItem: false },
    { materialName: "Dried Fruits", quantity: 5, unit: "kg", costPerUnit: 20.00, supplier: "Charles", isPOSItem: false },
    { materialName: "Cranberry", quantity: 4, unit: "kg", costPerUnit: 25.00, supplier: "Charles", isPOSItem: false },
    { materialName: "Dried Figs", quantity: 3, unit: "kg", costPerUnit: 22.00, supplier: "Charles", isPOSItem: false }
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

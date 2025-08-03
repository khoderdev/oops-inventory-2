import Material from "../models/materials.js";
import StockEntry from "../models/StockEntry.js";

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
    // Proteins - POS Items
    { materialName: "Beef Patty", quantity: 50, unit: "kg", costPerUnit: 12.00, supplier: "Charles", isPOSItem: true },
    { materialName: "Chicken Breast", quantity: 30, unit: "kg", costPerUnit: 8.50, supplier: "Charles", isPOSItem: true },
    { materialName: "Crispy Chicken", quantity: 10, unit: "pack", costPerUnit: 15.00, supplier: "Charles", isPOSItem: true },
    { materialName: "Chicken Wings", quantity: 8, unit: "pack", costPerUnit: 18.00, supplier: "Charles", isPOSItem: true },
    { materialName: "Taouk", quantity: 20, unit: "kg", costPerUnit: 9.00, supplier: "Charles", isPOSItem: true },
    { materialName: "Beef Filet", quantity: 15, unit: "kg", costPerUnit: 25.00, supplier: "Charles", isPOSItem: true },
    { materialName: "Salmon", quantity: 10, unit: "kg", costPerUnit: 22.00, supplier: "Charles", isPOSItem: true },
    { materialName: "Shrimp", quantity: 8, unit: "kg", costPerUnit: 28.00, supplier: "Charles", isPOSItem: true },
    { materialName: "Tuna", quantity: 5, unit: "kg", costPerUnit: 35.00, supplier: "Charles", isPOSItem: true },
    { materialName: "Crab Sticks", quantity: 12, unit: "kg", costPerUnit: 15.00, supplier: "Charles", isPOSItem: true },
    { materialName: "Halloumi", quantity: 10, unit: "kg", costPerUnit: 12.00, supplier: "Charles", isPOSItem: true },
    { materialName: "French Fries", quantity: 50, unit: "kg", costPerUnit: 2.00, supplier: "Charles", isPOSItem: true },
    { materialName: "Wedges", quantity: 30, unit: "kg", costPerUnit: 2.50, supplier: "Charles", isPOSItem: true },
    { materialName: "Labneh", quantity: 10, unit: "kg", costPerUnit: 6.00, supplier: "Charles", isPOSItem: true },
    { materialName: "Eggs", quantity: 10, unit: "pack", costPerUnit: 3.50, supplier: "Charles", isPOSItem: true },

    // Non-POS Ingredients
    { materialName: "Chicken Thigh", quantity: 25, unit: "kg", costPerUnit: 7.00, supplier: "Charles", isPOSItem: false },
    { materialName: "Ham", quantity: 8, unit: "kg", costPerUnit: 12.00, supplier: "Charles", isPOSItem: false },
    { materialName: "Bacon", quantity: 6, unit: "kg", costPerUnit: 14.00, supplier: "Charles", isPOSItem: false },
    { materialName: "Pepperoni", quantity: 4, unit: "kg", costPerUnit: 16.00, supplier: "Charles", isPOSItem: false },
    { materialName: "Salami", quantity: 3, unit: "kg", costPerUnit: 18.00, supplier: "Charles", isPOSItem: false },

    // Dairy & Cheese
    { materialName: "Mozzarella Cheese", quantity: 20, unit: "kg", costPerUnit: 8.00, supplier: "Charles", isPOSItem: false },
    { materialName: "Cheddar Cheese", quantity: 15, unit: "kg", costPerUnit: 9.00, supplier: "Charles", isPOSItem: false },
    { materialName: "Parmesan", quantity: 5, unit: "kg", costPerUnit: 18.00, supplier: "Charles", isPOSItem: false },
    { materialName: "Feta Cheese", quantity: 8, unit: "kg", costPerUnit: 10.00, supplier: "Charles", isPOSItem: false },
    { materialName: "Cream Cheese", quantity: 6, unit: "kg", costPerUnit: 7.00, supplier: "Charles", isPOSItem: false },
    { materialName: "Emental Cheese", quantity: 4, unit: "kg", costPerUnit: 15.00, supplier: "Charles", isPOSItem: false },

    // Vegetables
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

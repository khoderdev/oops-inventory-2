import sequelize from "../config/database.js";
import "../models/index.js";
import StockEntry from "../models/StockEntry.js";
import Material from "../models/materials.js";

async function verifyStockEntries() {
  try {
    console.log("🔍 Verifying stock entries...");
    
    // Connect to database
    await sequelize.authenticate();
    console.log("✅ Database connected");
    
    // Count materials
    const materialCount = await Material.count();
    console.log(`📦 Total materials: ${materialCount}`);
    
    // Count stock entries
    const stockCount = await StockEntry.count();
    console.log(`📊 Total stock entries: ${stockCount}`);
    
    // Get stock entries with material names
    const stockEntries = await StockEntry.findAll({
      include: [{
        model: Material,
        attributes: ['name', 'category']
      }],
      order: [['materialId', 'ASC']],
      limit: 10 // Show first 10
    });
    
    console.log("\n📋 Sample stock entries:");
    stockEntries.forEach((entry, index) => {
      console.log(`${index + 1}. Material: ${entry.Material.name} | Supplier: ${entry.supplier} | Qty: ${entry.purchasedQuantity} ${entry.purchasedUnit} | Cost: $${entry.totalCost}`);
    });
    
    if (stockCount > 10) {
      console.log(`... and ${stockCount - 10} more entries`);
    }
    
    // Check if all materials have stock entries
    const materialsWithStock = await Material.findAll({
      include: [{
        model: StockEntry,
        required: true
      }]
    });
    
    console.log(`\n✅ Materials with stock entries: ${materialsWithStock.length}/${materialCount}`);
    
    if (materialsWithStock.length === materialCount) {
      console.log("🎉 SUCCESS: All materials have stock entries!");
    } else {
      console.log("⚠️ Some materials are missing stock entries");
    }
    
  } catch (error) {
    console.error("❌ Error:", error.message);
  } finally {
    await sequelize.close();
  }
}

verifyStockEntries();

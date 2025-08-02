import sequelize from "../config/database.js";
import "../models/index.js";
import StockEntry from "../models/StockEntry.js";

async function checkStockSample() {
  try {
    await sequelize.authenticate();
    
    const [results] = await sequelize.query(`
      SELECT 
        se.id,
        se."materialId",
        se.supplier,
        se."purchasedQuantity",
        se."purchasedUnit",
        se."purchasedIndividualQuantity",
        se."purchasedIndividualUnit",
        se."costPerPurchasedUnit",
        se."totalCost"
      FROM "stockEntries" se 
      ORDER BY se.id 
      LIMIT 5
    `);
    
    console.log("📊 Sample stock entries:");
    console.table(results);
    
  } catch (error) {
    console.error("❌ Error:", error.message);
  } finally {
    await sequelize.close();
  }
}

checkStockSample();

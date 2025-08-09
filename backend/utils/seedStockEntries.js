import StockEntry from "../models/StockEntry.js";
import Material from "../models/materials.js";

/**
 * Seed initial stock entries data
 * @returns {Promise<Object>} Summary of seeding operation
 */
export const seedStockEntries = async () => {
  try {
    console.log("🌱 Starting stock entries seeding...");
    
    // Get all materials first to check coverage
    const allMaterials = await Material.findAll({ order: [['id', 'ASC']] });
    
    if (allMaterials.length === 0) {
      console.log("⚠️ No materials found to create stock entries");
      return { created: 0, existing: 0 };
    }

    // Check if we have stock entries for all materials
    const existingCount = await StockEntry.count();
    const materialsWithStock = await StockEntry.count({
      distinct: true,
      col: 'materialId'
    });
    
    if (existingCount > 0 && materialsWithStock >= allMaterials.length) {
      console.log(`✅ Stock entries already exist for all ${allMaterials.length} materials (${existingCount} total entries)`);
      return { created: 0, existing: existingCount };
    }
    
    if (existingCount > 0) {
      console.log(`🗑️ Found ${existingCount} existing stock entries but only ${materialsWithStock}/${allMaterials.length} materials covered. Clearing to create complete data...`);
      await StockEntry.destroy({ where: {} });
      console.log("✅ Existing stock entries cleared");
    }

    console.log(`📦 Creating stock entries for ${allMaterials.length} materials...`);

    // Create stock entries for all materials with varied realistic data
    const suppliers = ["Charles", "Ahmed", "Maria", "John", "Sarah"];
    const baseDate = new Date();
    
    const initialStockEntries = allMaterials.map((material, index) => {
      // Generate varied but realistic data for each material
      const supplier = suppliers[index % suppliers.length];
      const baseQuantity = 10 + (index % 5) * 10; // 10, 20, 30, 40, 50
      const baseCost = 0.30 + (index % 10) * 0.10; // 0.30 to 1.20
      
      // Adjust quantities based on material type
      let purchasedQuantity, purchasedUnit, individualQuantity, individualUnit;
      
      if (material.unitType === 'mass') {
        // For mass items (meat, vegetables, etc.)
        purchasedQuantity = baseQuantity;
        purchasedUnit = "kg";
        individualQuantity = baseQuantity * 1000;
        individualUnit = "g";
      } else if (material.unitType === 'package') {
        // For packaged items (beverages, etc.)
        const packSize = material.packageQuantity || 12;
        purchasedQuantity = Math.ceil(baseQuantity / 5); // Fewer boxes
        purchasedUnit = material.inputUnit || "box";
        individualQuantity = purchasedQuantity * packSize;
        individualUnit = material.baseUnit;
      } else {
        // Default case
        purchasedQuantity = baseQuantity;
        purchasedUnit = material.inputUnit || "kg";
        individualQuantity = baseQuantity * (material.packageQuantity || 1000);
        individualUnit = material.baseUnit;
      }
      
      const totalCost = purchasedQuantity * baseCost;
      const costPerBaseUnit = totalCost / individualQuantity;
      
      // Add some time variation to purchase dates
      const purchaseDate = new Date(baseDate.getTime() - (index * 60000)); // 1 minute apart
      
      return {
        materialId: material.id,
        supplier: supplier,
        purchasedQuantity: parseFloat(purchasedQuantity.toFixed(3)),
        purchasedUnit: purchasedUnit,
        purchasedIndividualQuantity: individualQuantity,
        purchasedIndividualUnit: individualUnit,
        purchasedConvertedUnit: individualUnit,
        purchasedConvertedQuantity: individualQuantity,
        costPerPurchasedUnit: parseFloat(baseCost.toFixed(2)),
        costPerBaseUnit: parseFloat(costPerBaseUnit.toFixed(6)),
        totalCost: parseFloat(totalCost.toFixed(2)),
        purchaseDate: purchaseDate,
        expiryDate: null,
        isPOSItem: false
      };
    });

    // Create stock entries
    const createdEntries = await StockEntry.bulkCreate(initialStockEntries, {
      validate: true,
      individualHooks: true // This ensures beforeCreate hooks run
    });

    console.log(`✅ Created ${createdEntries.length} initial stock entries for all materials`);
    console.log(`📦 Stock entries created for: ${allMaterials.slice(0, 5).map(m => m.name).join(", ")}${allMaterials.length > 5 ? ` and ${allMaterials.length - 5} more...` : ""}`);
    
    return { 
      created: createdEntries.length, 
      existing: 0,
      materialsCount: allMaterials.length
    };
    
  } catch (error) {
    console.error("❌ Error seeding stock entries:", error);
    throw error;
  }
};

export default seedStockEntries;

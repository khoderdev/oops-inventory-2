import sequelize from "../config/database.js";
import Material from "../models/materials.js";
import { seedMaterials } from "../utils/seedMaterials.js";

async function initializeMaterials() {
  try {
    console.log("🚀 Starting materials initialization...");
    
    // Step 1: Test database connection
    console.log("🔌 Testing database connection...");
    await sequelize.authenticate();
    console.log("✅ Database connection established");
    
    // Step 2: Sync Material model
    console.log("🔄 Syncing Material model...");
    await Material.sync({ alter: true });
    console.log("✅ Material model synced");
    
    // Step 3: Create initial materials
    console.log("🌱 Creating initial materials...");
    const seedResult = await seedMaterials();
    
    // Step 4: Verify materials
    console.log("🔍 Verifying materials...");
    const materialCount = await Material.count();
    console.log(`📊 Total materials in database: ${materialCount}`);
    
    // List all materials
    const allMaterials = await Material.findAll({
      attributes: ['id', 'name', 'category', 'baseUnit', 'unitType'],
      order: [['name', 'ASC']]
    });
    
    console.log("\n📋 Current materials in database:");
    allMaterials.forEach(material => {
      console.log(`   ${material.id}. ${material.name} (${material.category}) - ${material.baseUnit} [${material.unitType}]`);
    });
    
    console.log("\n🎉 Materials initialization completed successfully!");
    console.log(`📊 Summary: ${seedResult.created} created, ${seedResult.existing} already existed`);
    
    return {
      success: true,
      totalMaterials: materialCount,
      seedResult
    };
    
  } catch (error) {
    console.error("❌ Materials initialization failed:", error);
    throw error;
  } finally {
    await sequelize.close();
  }
}

// Run the initialization
initializeMaterials()
  .then((result) => {
    console.log("\n🏁 Materials initialization completed successfully!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n💥 Materials initialization failed:", error);
    process.exit(1);
  });

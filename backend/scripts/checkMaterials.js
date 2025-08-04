import sequelize from "../config/database.js";
import Material from "../models/materials.js";

async function checkMaterials() {
  try {
    await sequelize.authenticate();
    console.log("✅ Database connection established");

    const materials = await Material.findAll();
    console.log(`\n📦 Total materials in database: ${materials.length}`);

    // Check for specific materials that were reported missing
    const missingMaterials = [
      "BBQ Sauce",
      "Honey Mustard Sauce", 
      "Cheese Sauce",
      "Cheddar Sauce",
      "Creamy Sauce",
      "Fresh Mushroom"
    ];

    console.log("\n🔍 Checking for specific materials:");
    for (const materialName of missingMaterials) {
      const material = materials.find(m => m.name === materialName);
      if (material) {
        console.log(`✅ Found: ${materialName} (ID: ${material.id})`);
      } else {
        console.log(`❌ Missing: ${materialName}`);
      }
    }

    // List all materials for reference
    console.log("\n📋 All materials in database:");
    materials.forEach(material => {
      console.log(`- ${material.name} (${material.category})`);
    });

    await sequelize.close();
  } catch (error) {
    console.error("❌ Error:", error);
  }
}

checkMaterials();

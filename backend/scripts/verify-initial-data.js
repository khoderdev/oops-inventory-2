import sequelize from "../config/database.js";
import Table from "../models/Table.js";
import Material from "../models/materials.js";

async function verifyInitialData() {
  try {
    console.log("🔍 Verifying initial data...");
    
    // Test database connection
    await sequelize.authenticate();
    console.log("✅ Database connection established");
    
    // Verify Tables
    console.log("\n📋 Verifying Tables...");
    const tableCount = await Table.count();
    console.log(`📊 Total tables: ${tableCount}`);
    
    if (tableCount === 0) {
      console.log("⚠️  No tables found, creating initial tables...");
      await Table.createInitialTables();
    } else {
      const tables = await Table.findAll({
        attributes: ['id', 'number', 'seats', 'status', 'section'],
        order: [['number', 'ASC']]
      });
      
      console.log("📋 Current tables:");
      tables.forEach(table => {
        console.log(`   Table ${table.number}: ${table.seats} seats, ${table.status}, ${table.section}`);
      });
    }
    
    // Verify Materials
    console.log("\n🧪 Verifying Materials...");
    const materialCount = await Material.count();
    console.log(`📊 Total materials: ${materialCount}`);
    
    if (materialCount === 0) {
      console.log("⚠️  No materials found, creating initial materials...");
      await Material.createInitialMaterials();
    } else {
      const materials = await Material.findAll({
        attributes: ['id', 'name', 'category', 'baseUnit', 'unitType', 'packageQuantity'],
        order: [['name', 'ASC']]
      });
      
      console.log("📋 Current materials:");
      materials.forEach(material => {
        const packageInfo = material.packageQuantity ? ` (${material.packageQuantity}/pack)` : '';
        console.log(`   ${material.name}: ${material.category} - ${material.baseUnit} [${material.unitType}]${packageInfo}`);
      });
    }
    
    // Summary by category
    console.log("\n📊 Materials by category:");
    const materialsByCategory = await Material.findAll({
      attributes: [
        'category',
        [sequelize.fn('COUNT', sequelize.col('id')), 'count']
      ],
      group: ['category'],
      order: [['category', 'ASC']]
    });
    
    materialsByCategory.forEach(item => {
      console.log(`   ${item.category}: ${item.dataValues.count} items`);
    });
    
    console.log("\n🎉 Initial data verification completed!");
    console.log(`📊 Summary: ${tableCount} tables, ${materialCount} materials`);
    
    return {
      success: true,
      tables: tableCount,
      materials: materialCount
    };
    
  } catch (error) {
    console.error("❌ Verification failed:", error);
    throw error;
  } finally {
    await sequelize.close();
  }
}

// Run the verification
verifyInitialData()
  .then((result) => {
    console.log("\n🏁 Verification completed successfully!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n💥 Verification failed:", error);
    process.exit(1);
  });

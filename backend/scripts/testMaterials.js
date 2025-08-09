import sequelize from "../config/database.js";
import { seedMaterials } from "../seeds/seedMaterials.js";

async function testMaterials() {
  try {
    await sequelize.authenticate();
    console.log("✅ Database connection established");

    // Clear materials first
    await sequelize.query('TRUNCATE TABLE "materials" CASCADE');
    console.log("🗑️ Cleared materials table");

    // Seed materials
    const result = await seedMaterials();
    console.log(`📦 Materials seeding result: ${result.created} created, ${result.existing} existing`);

    await sequelize.close();
  } catch (error) {
    console.error("❌ Error:", error);
  }
}

testMaterials();

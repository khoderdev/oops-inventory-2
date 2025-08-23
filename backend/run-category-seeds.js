import dotenv from "dotenv";
// Load environment variables first
dotenv.config();

import sequelize from "./config/database.js";
import "./models/index.js";
import { seedCategories } from './seeds/categorySeed.js';
import { seedMaterials } from './seeds/seedMaterials.js';

async function runSeeds() {
  try {
    console.log('🌱 Starting seed process...');
    
    // Connect to database
    console.log('🔄 Connecting to database...');
    await sequelize.authenticate();
    console.log('✅ Database connection established');
    
    // Sync database models to create tables
    console.log('🔄 Syncing database models...');
    await sequelize.sync({ force: false, alter: true });
    console.log('✅ Database models synced successfully');
    
    // First seed categories and category types
    console.log('\n📋 STEP 1: Seeding categories and category types');
    await seedCategories();
    
    // Then seed materials which depend on categories
    console.log('\n📦 STEP 2: Seeding materials');
    const materialsResult = await seedMaterials();
    
    console.log('\n✅ Seeding completed successfully!');
    console.log(`Materials created: ${materialsResult.created}`);
    console.log(`Materials already existing: ${materialsResult.existing}`);
    
    // Close database connection
    await sequelize.close();
    console.log('✅ Database connection closed');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error running seeds:', error);
    process.exit(1);
  }
}

runSeeds();

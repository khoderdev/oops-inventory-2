import { seedCategories } from './backend/seeds/categorySeed.js';
import { seedMaterials } from './backend/seeds/seedMaterials.js';

async function runSeeds() {
  try {
    console.log('🌱 Starting seed process...');
    
    // First seed categories and category types
    console.log('\n📋 STEP 1: Seeding categories and category types');
    await seedCategories();
    
    // Then seed materials which depend on categories
    console.log('\n📦 STEP 2: Seeding materials');
    const materialsResult = await seedMaterials();
    
    console.log('\n✅ Seeding completed successfully!');
    console.log(`Materials created: ${materialsResult.created}`);
    console.log(`Materials already existing: ${materialsResult.existing}`);
  } catch (error) {
    console.error('❌ Error running seeds:', error);
  }
}

runSeeds();

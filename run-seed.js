import { seedMaterials } from './backend/seeds/seedMaterials.js';

async function runSeed() {
  try {
    console.log('Starting materials seeding...');
    const result = await seedMaterials();
    console.log('Seeding result:', result);
  } catch (error) {
    console.error('Error running seed:', error);
  }
}

runSeed();

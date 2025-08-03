import sequelize from './config/database.js';
import './migrations/add-image-to-menu-items.js';

async function runMigration() {
  try {
    console.log('🔄 Running migration to add image column to menuItems table...');
    
    // Check if column already exists
    const [results] = await sequelize.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'menuItems' AND column_name = 'image'
    `);
    
    if (results.length > 0) {
      console.log('✅ Image column already exists in menuItems table');
      return;
    }
    
    // Add the image column
    await sequelize.query(`
      ALTER TABLE "menuItems" 
      ADD COLUMN "image" TEXT
    `);
    
    console.log('✅ Successfully added image column to menuItems table');
  } catch (error) {
    console.error('❌ Error running migration:', error.message);
  } finally {
    await sequelize.close();
  }
}

runMigration();

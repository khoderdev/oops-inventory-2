import sequelize from '../config/database.js';
import { QueryTypes } from 'sequelize';

async function addUserIdToSales() {
  try {
    console.log('🔧 Adding userId column to Sales table...');
    
    // Check if the column already exists
    const [results] = await sequelize.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'Sales' AND column_name = 'userId';
    `, { type: QueryTypes.SELECT });
    
    if (results && results.length > 0) {
      console.log('✅ userId column already exists in Sales table');
      return;
    }
    
    // Add the userId column
    await sequelize.query(`
      ALTER TABLE "Sales" 
      ADD COLUMN "userId" INTEGER REFERENCES "users"("id") ON UPDATE CASCADE ON DELETE SET NULL;
    `);
    
    console.log('✅ Successfully added userId column to Sales table');
    console.log('📝 Note: Existing sales will have userId = NULL until manually updated');
    
  } catch (error) {
    console.error('❌ Error adding userId column:', error);
    throw error;
  } finally {
    await sequelize.close();
  }
}

addUserIdToSales();

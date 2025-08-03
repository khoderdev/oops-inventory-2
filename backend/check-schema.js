import sequelize from './config/database.js';

async function checkSchema() {
  try {
    console.log('🔍 Checking Orders table schema...');
    
    // Get table description
    const [results] = await sequelize.query(`
      SELECT column_name, data_type, is_nullable, column_default 
      FROM information_schema.columns 
      WHERE table_name = 'Orders' 
      ORDER BY ordinal_position;
    `);
    
    console.log('📋 Orders table columns:');
    results.forEach(column => {
      console.log(`  - ${column.column_name}: ${column.data_type} (nullable: ${column.is_nullable})`);
    });
    
    // Check if furnitureItemId exists
    const furnitureItemIdExists = results.some(col => col.column_name === 'furnitureItemId');
    console.log(`\n🔍 furnitureItemId column exists: ${furnitureItemIdExists ? '✅ YES' : '❌ NO'}`);
    
    if (furnitureItemIdExists) {
      console.log('\n🔄 Testing a simple query...');
      const [testResults] = await sequelize.query('SELECT id, orderNumber, furnitureItemId FROM "Orders" LIMIT 1;');
      console.log('✅ Query successful! Sample data:', testResults[0] || 'No orders found');
    }
    
  } catch (error) {
    console.error('❌ Schema check failed:', error.message);
  } finally {
    await sequelize.close();
    process.exit(0);
  }
}

checkSchema();

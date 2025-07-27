import sequelize from './config/database.js';
import { StockEntryLogSimple } from './models/index.js';

/**
 * Clean up the stock_entry_logs_simple table to remove orphaned data
 * and recreate it without foreign key constraints
 */

async function cleanLogsTable() {
  try {
    console.log('🧹 Cleaning up stock_entry_logs_simple table...\n');

    // Connect to database
    await sequelize.authenticate();
    console.log('✅ Database connected successfully.');

    // Drop the existing table if it exists
    console.log('🗑️  Dropping existing stock_entry_logs_simple table...');
    await StockEntryLogSimple.drop({ cascade: true });
    console.log('✅ Table dropped successfully.');

    // Recreate the table
    console.log('🔄 Recreating stock_entry_logs_simple table...');
    await StockEntryLogSimple.sync({ force: true });
    console.log('✅ Table recreated successfully.');

    // Verify the table is empty and working
    const count = await StockEntryLogSimple.count();
    console.log(`✅ Table is clean with ${count} records.`);

    // Test basic functionality
    console.log('🧪 Testing basic logging functionality...');
    const testLog = await StockEntryLogSimple.create({
      actionType: 'test',
      actionDescription: 'Test log entry after cleanup',
      stockEntryId: 1,
      materialId: 1,
      materialName: 'Test Material',
      userId: 1,
      userName: 'Test User',
      quantityDelta: 0,
      costDelta: 0,
      status: 'success'
    });

    console.log(`✅ Test log created with ID: ${testLog.id}`);

    // Clean up test data
    await testLog.destroy();
    console.log('✅ Test data cleaned up.');

    console.log('\n🎉 Stock entry logs table is now clean and ready for use!');
    console.log('💡 You can now run the application without foreign key constraint errors.');

  } catch (error) {
    console.error('❌ Error cleaning logs table:', error.message);
    console.error('Stack trace:', error.stack);
  } finally {
    await sequelize.close();
    process.exit(0);
  }
}

cleanLogsTable();

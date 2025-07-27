import sequelize from './config/database.js';
import './models/index.js'; // Import all models

async function checkAndSyncAll() {
  try {
    console.log('🔄 Connecting to database...');
    await sequelize.authenticate();
    console.log('✅ Database connected successfully.');

    // List all registered models
    const modelNames = Object.keys(sequelize.models);
    console.log(`📋 Registered models: ${modelNames.join(', ')}`);

    // Check which tables exist
    console.log('\n🔍 Checking existing tables...');
    const queryInterface = sequelize.getQueryInterface();
    const tables = await queryInterface.showAllTables();
    console.log(`📋 Existing tables: ${tables.join(', ')}`);

    // Sync all models
    console.log('\n🔄 Syncing all models...');
    await sequelize.sync({ alter: true });
    console.log('✅ All models synced successfully.');

    // Check tables again
    console.log('\n🔍 Checking tables after sync...');
    const tablesAfter = await queryInterface.showAllTables();
    console.log(`📋 Tables after sync: ${tablesAfter.join(', ')}`);

    // Check if stock_entry_logs was created
    if (tablesAfter.includes('stock_entry_logs')) {
      console.log('✅ stock_entry_logs table created successfully!');
      
      // Test the StockEntryLog model
      const { StockEntryLog } = sequelize.models;
      if (StockEntryLog) {
        const count = await StockEntryLog.count();
        console.log(`✅ StockEntryLog model working. Record count: ${count}`);
      }
    } else {
      console.log('❌ stock_entry_logs table was not created.');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('Stack trace:', error.stack);
  } finally {
    await sequelize.close();
    console.log('\n🔒 Database connection closed.');
  }
}

checkAndSyncAll();

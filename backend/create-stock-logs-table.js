import sequelize from './config/database.js';
import StockEntryLog from './models/StockEntryLog.js';

async function createStockLogsTable() {
  try {
    console.log('🔄 Connecting to database...');
    await sequelize.authenticate();
    console.log('✅ Database connected successfully.');

    console.log('🔄 Creating stock_entry_logs table...');
    
    // Force sync just the StockEntryLog table
    await StockEntryLog.sync({ force: false, alter: true });
    
    console.log('✅ stock_entry_logs table created/updated successfully.');
    
    // Test if we can query the table
    console.log('🔄 Testing table access...');
    const count = await StockEntryLog.count();
    console.log(`✅ Table accessible. Current record count: ${count}`);
    
    // Show table info
    console.log('📋 Table structure created successfully.');
    
  } catch (error) {
    console.error('❌ Error creating table:', error.message);
    console.error('Stack trace:', error.stack);
  } finally {
    await sequelize.close();
    console.log('🔒 Database connection closed.');
  }
}

createStockLogsTable();

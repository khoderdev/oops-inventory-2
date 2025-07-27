import sequelize from './config/database.js';
import StockEntryLogSimple from './models/StockEntryLogSimple.js';

async function testSimpleLogging() {
  try {
    console.log('🧪 Testing Simple Stock Entry Logging...\n');

    console.log('🔄 Connecting to database...');
    await sequelize.authenticate();
    console.log('✅ Database connected successfully.');

    console.log('🔄 Creating simple stock_entry_logs table...');
    await StockEntryLogSimple.sync({ force: true });
    console.log('✅ Simple table created successfully.');

    console.log('🔄 Testing logging functionality...');
    const logEntry = await StockEntryLogSimple.logAction({
      userId: 1,
      userName: 'Test User',
      actionType: 'create',
      actionDescription: 'Test stock creation',
      stockEntryId: 999,
      materialId: 1,
      materialName: 'Test Material',
      quantityDelta: 10.5,
      costDelta: 150.00,
      status: 'success'
    });

    console.log(`✅ Created log entry with ID: ${logEntry.id}`);
    console.log(`   Action: ${logEntry.actionType}`);
    console.log(`   Material: ${logEntry.materialName}`);
    console.log(`   User: ${logEntry.userName}`);
    console.log(`   Timestamp: ${logEntry.actionTimestamp}`);

    // Test querying
    const count = await StockEntryLogSimple.count();
    console.log(`✅ Total log entries: ${count}`);

    console.log('\n🎉 Simple logging system working correctly!');
    console.log('Now we can upgrade to the full version.');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('Stack trace:', error.stack);
  } finally {
    await sequelize.close();
  }
}

testSimpleLogging();

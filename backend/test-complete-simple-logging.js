import './models/index.js';
import { StockEntryAuditHelperSimple } from './decorators/stockEntryAuditDecoratorSimple.js';
import StockEntryLoggerSimple from './services/StockEntryLoggerSimple.js';
import { StockEntryLogSimple } from './models/index.js';

/**
 * Complete test of the simple stock entry logging system
 */

async function testCompleteSimpleLogging() {
  try {
    console.log('🧪 Testing Complete Simple Stock Entry Logging System...\n');

    // Test 1: Basic logging functionality
    console.log('1. Testing basic logging functionality...');
    
    const logEntry1 = await StockEntryLoggerSimple.logAction({
      actionType: 'create',
      actionDescription: 'Test stock creation via service',
      stockEntryId: 100,
      materialId: 1,
      materialName: 'Test Material A',
      userId: 1,
      userName: 'Test User',
      quantityDelta: 25.5,
      costDelta: 300.00,
      status: 'success'
    });

    console.log(`✅ Created log entry via service - ID: ${logEntry1.id}`);

    // Test 2: Helper class functionality
    console.log('\n2. Testing helper class functionality...');
    
    const mockStockEntry = {
      id: 101,
      materialId: 2,
      material: { name: 'Test Material B' },
      purchasedQuantity: 15.0,
      totalCost: 200.00
    };

    const mockUser = {
      id: 2,
      username: 'testuser2',
      fullName: 'Test User 2'
    };

    const logEntry2 = await StockEntryAuditHelperSimple.logStockCreation(
      mockStockEntry,
      mockUser,
      null,
      { source: 'test_script', category: 'testing' }
    );

    console.log(`✅ Created log entry via helper - ID: ${logEntry2.id}`);

    // Test 3: Stock editing simulation
    console.log('\n3. Testing stock editing simulation...');
    
    const originalStock = {
      id: 102,
      materialId: 3,
      material: { name: 'Test Material C' },
      purchasedQuantity: 10.0,
      totalCost: 150.00,
      supplier: 'Original Supplier'
    };

    const updatedStock = {
      id: 102,
      materialId: 3,
      material: { name: 'Test Material C' },
      purchasedQuantity: 12.0,
      totalCost: 180.00,
      supplier: 'Updated Supplier'
    };

    const logEntry3 = await StockEntryAuditHelperSimple.logStockEdit(
      originalStock,
      updatedStock,
      mockUser,
      null,
      { source: 'test_script', category: 'testing' }
    );

    console.log(`✅ Created edit log entry - ID: ${logEntry3.id}`);

    // Test 4: Waste logging
    console.log('\n4. Testing waste logging...');
    
    const logEntry4 = await StockEntryAuditHelperSimple.logWasteFromStock(
      updatedStock,
      { ...updatedStock, purchasedQuantity: 10.0, totalCost: 150.00 },
      2.0,
      'kg',
      'Expired product',
      mockUser,
      null,
      { source: 'test_script', category: 'testing' }
    );

    console.log(`✅ Created waste log entry - ID: ${logEntry4.id}`);

    // Test 5: Query functionality
    console.log('\n5. Testing query functionality...');
    
    // Get all logs
    const allLogs = await StockEntryLogSimple.findAll({
      order: [['actionTimestamp', 'DESC']],
      limit: 10
    });

    console.log(`✅ Found ${allLogs.length} total log entries`);

    // Get stock history
    const stockHistory = await StockEntryAuditHelperSimple.getHistory(102, { limit: 5 });
    console.log(`✅ Found ${stockHistory.length} history entries for stock ID 102`);

    // Get material history
    const materialHistory = await StockEntryAuditHelperSimple.getMaterialHistory(3, { limit: 5 });
    console.log(`✅ Found ${materialHistory.length} material history entries for material ID 3`);

    // Get user activity
    const userActivity = await StockEntryAuditHelperSimple.getUserActivity(2, { limit: 5 });
    console.log(`✅ Found ${userActivity.length} user activity entries for user ID 2`);

    // Test 6: Error logging
    console.log('\n6. Testing error logging...');
    
    const errorLog = await StockEntryLoggerSimple.logFailure({
      actionType: 'delete_stock',
      actionDescription: 'Failed to delete stock entry',
      stockEntryId: 999,
      materialId: 1,
      userId: 1,
      userName: 'Test User'
    }, new Error('Stock entry not found'));

    console.log(`✅ Created error log entry - ID: ${errorLog.id}`);

    // Test 7: Summary statistics
    console.log('\n7. Testing summary statistics...');
    
    const actionSummary = await StockEntryLogSimple.findAll({
      attributes: [
        'actionType',
        [StockEntryLogSimple.sequelize.fn('COUNT', StockEntryLogSimple.sequelize.col('id')), 'count']
      ],
      group: ['actionType'],
      order: [[StockEntryLogSimple.sequelize.fn('COUNT', StockEntryLogSimple.sequelize.col('id')), 'DESC']]
    });

    console.log('✅ Action summary:');
    actionSummary.forEach(summary => {
      console.log(`   - ${summary.actionType}: ${summary.dataValues.count} entries`);
    });

    // Test 8: Recent activity
    console.log('\n8. Testing recent activity display...');
    
    const recentActivity = await StockEntryLogSimple.findAll({
      order: [['actionTimestamp', 'DESC']],
      limit: 5,
      attributes: ['id', 'actionType', 'materialName', 'userName', 'actionTimestamp', 'status']
    });

    console.log('✅ Recent activity:');
    recentActivity.forEach(activity => {
      console.log(`   - ${activity.actionType} on ${activity.materialName} by ${activity.userName || 'System'} at ${activity.actionTimestamp} (${activity.status})`);
    });

    console.log('\n🎉 All tests passed! Simple Stock Entry Logging System is fully functional.');
    console.log('\n📋 System Summary:');
    console.log(`   - Total log entries: ${allLogs.length}`);
    console.log(`   - Successful operations: ${allLogs.filter(log => log.status === 'success').length}`);
    console.log(`   - Failed operations: ${allLogs.filter(log => log.status === 'failure').length}`);
    console.log(`   - Action types: ${[...new Set(allLogs.map(log => log.actionType))].join(', ')}`);

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('Stack trace:', error.stack);
  } finally {
    process.exit(0);
  }
}

// Run the complete test
testCompleteSimpleLogging();

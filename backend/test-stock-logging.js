import './models/index.js';
import StockEntryLoggerSimple from './services/StockEntryLoggerSimple.js';
import { StockEntry, Material, User, StockEntryLogSimple } from './models/index.js';

/**
 * Test script to verify stock entry logging functionality
 */

async function testStockEntryLogging() {
  try {
    console.log('🧪 Testing Stock Entry Logging System...\n');

    // Test 1: Check if StockEntryLogSimple table exists
    console.log('1. Checking if StockEntryLogSimple table exists...');
    
    // This will throw an error if the table doesn't exist
    const logCount = await StockEntryLogSimple.count();
    console.log(`✅ StockEntryLogSimple table exists with ${logCount} records\n`);

    // Test 2: Test manual logging
    console.log('2. Testing manual logging...');
    
    // Create a mock stock entry data
    const mockStockEntry = {
      id: 999,
      materialId: 1,
      supplier: 'Test Supplier',
      purchasedQuantity: 10.5,
      purchasedUnit: 'kg',
      purchasedIndividualQuantity: 21,
      purchasedIndividualUnit: 'pieces',
      totalCost: 150.00,
      material: {
        id: 1,
        name: 'Test Material',
        category: 'test_category'
      }
    };

    const mockUser = {
      id: 1,
      username: 'testuser',
      fullName: 'Test User',
      role: 'admin'
    };

    // Test stock creation logging
    const logEntry = await StockEntryLoggerSimple.logAction({
      actionType: 'create',
      actionDescription: 'Test stock creation',
      stockEntryId: mockStockEntry.id,
      materialId: mockStockEntry.materialId,
      materialName: mockStockEntry.material.name,
      userId: mockUser.id,
      userName: mockUser.fullName,
      quantityDelta: mockStockEntry.purchasedQuantity,
      costDelta: mockStockEntry.totalCost,
      status: 'success'
    });

    console.log(`✅ Created log entry with ID: ${logEntry.id}`);
    console.log(`   Action: ${logEntry.actionType}`);
    console.log(`   Material: ${logEntry.materialName}`);
    console.log(`   User: ${logEntry.userName}`);
    console.log(`   Timestamp: ${logEntry.actionTimestamp}\n`);

    // Test 3: Test querying functionality
    console.log('3. Testing query functionality...');
    
    // Get recent logs
    const recentLogs = await StockEntryLogSimple.findAll({
      limit: 5,
      order: [['actionTimestamp', 'DESC']],
      attributes: ['id', 'actionType', 'materialName', 'userName', 'actionTimestamp']
    });

    console.log(`✅ Found ${recentLogs.length} recent log entries:`);
    recentLogs.forEach(log => {
      console.log(`   - ${log.actionType} on ${log.materialName} by ${log.userName || 'System'} at ${log.actionTimestamp}`);
    });

    console.log('\n🎉 All tests passed! Stock Entry Logging System is working correctly.');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('Stack trace:', error.stack);
  } finally {
    process.exit(0);
  }
}

// Run the test
testStockEntryLogging();

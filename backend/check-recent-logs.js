import './models/index.js';
import { StockEntryLogSimple } from './models/index.js';

async function checkLogs() {
  try {
    const logs = await StockEntryLogSimple.findAll({
      order: [['actionTimestamp', 'DESC']],
      limit: 5
    });
    
    console.log('📋 Recent Stock Entry Logs:');
    console.log('='.repeat(50));
    
    logs.forEach((log, index) => {
      console.log(`${index + 1}. Action: ${log.actionType}`);
      console.log(`   Material: ${log.materialName} (ID: ${log.materialId})`);
      console.log(`   User: ${log.userName} (ID: ${log.userId})`);
      console.log(`   Description: ${log.actionDescription}`);
      console.log(`   Timestamp: ${log.actionTimestamp}`);
      console.log(`   Status: ${log.status}`);
      console.log(`   Quantity Delta: ${log.quantityDelta}`);
      console.log(`   Cost Delta: ${log.costDelta}`);
      console.log('   ---');
    });
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error checking logs:', error);
    process.exit(1);
  }
}

checkLogs();

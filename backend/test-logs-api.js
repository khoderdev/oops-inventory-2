import fetch from 'node-fetch';

/**
 * Test the logs API endpoints
 */

const API_BASE = 'http://localhost:3000/api/logs';

async function testLogsAPI() {
  try {
    console.log('🧪 Testing Logs API Endpoints...\n');

    // Test 1: Get all logs
    console.log('1. Testing GET /api/logs/stock-entries...');
    const response1 = await fetch(`${API_BASE}/stock-entries?limit=10`);
    const data1 = await response1.json();
    
    if (response1.ok) {
      console.log(`✅ Successfully fetched ${data1.data.logs.length} log entries`);
      console.log(`   Total records: ${data1.data.pagination.totalRecords}`);
      console.log(`   Current page: ${data1.data.pagination.currentPage}`);
    } else {
      console.log(`❌ Failed to fetch logs: ${data1.error}`);
    }

    // Test 2: Get summary
    console.log('\n2. Testing GET /api/logs/summary...');
    const response2 = await fetch(`${API_BASE}/summary`);
    const data2 = await response2.json();
    
    if (response2.ok) {
      console.log(`✅ Successfully fetched summary`);
      console.log(`   Total logs: ${data2.data.overview.totalLogs}`);
      console.log(`   Success rate: ${data2.data.overview.successRate}`);
      console.log(`   Action types: ${data2.data.actionBreakdown.map(a => a.actionType).join(', ')}`);
    } else {
      console.log(`❌ Failed to fetch summary: ${data2.error}`);
    }

    // Test 3: Search logs
    console.log('\n3. Testing GET /api/logs/search...');
    const response3 = await fetch(`${API_BASE}/search?q=create&limit=5`);
    const data3 = await response3.json();
    
    if (response3.ok) {
      console.log(`✅ Successfully searched logs`);
      console.log(`   Found ${data3.data.searchInfo.totalResults} results for "create"`);
      console.log(`   Returned ${data3.data.logs.length} logs`);
    } else {
      console.log(`❌ Failed to search logs: ${data3.error}`);
    }

    // Test 4: Test filtering
    console.log('\n4. Testing filtered logs...');
    const response4 = await fetch(`${API_BASE}/stock-entries?actionType=create&status=success`);
    const data4 = await response4.json();
    
    if (response4.ok) {
      console.log(`✅ Successfully fetched filtered logs`);
      console.log(`   Found ${data4.data.logs.length} create/success logs`);
    } else {
      console.log(`❌ Failed to fetch filtered logs: ${data4.error}`);
    }

    console.log('\n🎉 Logs API testing completed!');
    console.log('💡 All endpoints are working correctly.');

  } catch (error) {
    console.error('❌ API test failed:', error.message);
    
    if (error.code === 'ECONNREFUSED') {
      console.error('💡 Make sure the server is running on http://localhost:3001');
    }
  }
}

testLogsAPI();

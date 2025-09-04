const axios = require('axios');

// Configuration
const API_BASE_URL = 'http://localhost:3000/api'; // Adjust if your API runs on a different port
const AUTH_TOKEN = 'YOUR_AUTH_TOKEN'; // Replace with a valid auth token if needed

// Test data
const testStockEntry = {
  materialId: 1, // Replace with a valid material ID from your database
  purchasedQuantity: 10,
  purchasedUnit: 'kg',
  totalCost: 100,
  purchaseDate: new Date().toISOString(),
  supplier: {
    supplierId: 1, // Replace with a valid supplier ID from your database
    supplierName: 'Test Supplier'
  }
};

// Test functions
async function testCreateStockEntry() {
  console.log('Testing createStockEntries...');
  try {
    const response = await axios.post(
      `${API_BASE_URL}/stock-entries`,
      testStockEntry,
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${AUTH_TOKEN}`
        }
      }
    );
    
    console.log('Create Stock Entry Response:', JSON.stringify(response.data, null, 2));
    console.log('Supplier object in response:', response.data.supplier);
    console.log('Create Stock Entry Test: SUCCESS');
    return response.data;
  } catch (error) {
    console.error('Create Stock Entry Test: FAILED');
    console.error('Error:', error.response ? error.response.data : error.message);
    throw error;
  }
}

async function testUpdateStockEntry(id) {
  console.log(`Testing updateStockEntries for ID ${id}...`);
  try {
    const updateData = {
      purchasedQuantity: 15,
      totalCost: 150,
      supplier: {
        supplierId: 2, // Replace with another valid supplier ID
        supplierName: 'Updated Supplier'
      }
    };
    
    const response = await axios.put(
      `${API_BASE_URL}/stock-entries/${id}`,
      updateData,
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${AUTH_TOKEN}`
        }
      }
    );
    
    console.log('Update Stock Entry Response:', JSON.stringify(response.data, null, 2));
    console.log('Supplier object in response:', response.data.supplier);
    console.log('Update Stock Entry Test: SUCCESS');
    return response.data;
  } catch (error) {
    console.error('Update Stock Entry Test: FAILED');
    console.error('Error:', error.response ? error.response.data : error.message);
    throw error;
  }
}

async function testDeleteStockEntry(id) {
  console.log(`Testing deleteStockEntries for ID ${id}...`);
  try {
    const response = await axios.delete(
      `${API_BASE_URL}/stock-entries/${id}`,
      {
        headers: {
          'Authorization': `Bearer ${AUTH_TOKEN}`
        }
      }
    );
    
    console.log('Delete Stock Entry Status:', response.status);
    console.log('Delete Stock Entry Test: SUCCESS');
  } catch (error) {
    console.error('Delete Stock Entry Test: FAILED');
    console.error('Error:', error.response ? error.response.data : error.message);
    throw error;
  }
}

// Run tests
async function runTests() {
  try {
    // Create a stock entry
    const createdEntry = await testCreateStockEntry();
    
    // Update the created stock entry
    if (createdEntry && createdEntry.id) {
      const updatedEntry = await testUpdateStockEntry(createdEntry.id);
      
      // Delete the updated stock entry
      if (updatedEntry && updatedEntry.id) {
        await testDeleteStockEntry(updatedEntry.id);
      }
    }
    
    console.log('All tests completed successfully!');
  } catch (error) {
    console.error('Test suite failed:', error.message);
  }
}

// Execute the tests
runTests();

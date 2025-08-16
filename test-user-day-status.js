/**
 * Test script for user-specific day operations
 * 
 * This script tests the individual user day status functionality by:
 * 1. Opening a day for a specific user
 * 2. Closing a day for a specific user
 * 3. Fetching user order stats to verify status
 */

// Import required modules
const axios = require('axios');
const API_URL = 'http://localhost:3001/api'; // Adjust if your API runs on a different port

// Test user credentials
const testUser = {
  id: 1, // Replace with a valid user ID from your system
  username: 'testuser',
  password: 'password' // Replace with actual password
};

// Test functions
async function login() {
  try {
    const response = await axios.post(`${API_URL}/auth/login`, {
      username: testUser.username,
      password: testUser.password
    });
    
    return response.data.token;
  } catch (error) {
    console.error('Login failed:', error.response?.data || error.message);
    throw error;
  }
}

async function openUserDay(token, userId) {
  try {
    const response = await axios.post(
      `${API_URL}/day-operations/open`,
      {
        openingCash: 100,
        openedBy: testUser.username,
        notes: 'Test opening day for specific user',
        userId
      },
      {
        headers: { Authorization: `Bearer ${token}` }
      }
    );
    
    console.log('User day opened successfully:', response.data);
    return response.data;
  } catch (error) {
    console.error('Failed to open user day:', error.response?.data || error.message);
    throw error;
  }
}

async function closeUserDay(token, userId) {
  try {
    const response = await axios.post(
      `${API_URL}/day-operations/close`,
      {
        closingCash: 150,
        closedBy: testUser.username,
        notes: 'Test closing day for specific user',
        userId
      },
      {
        headers: { Authorization: `Bearer ${token}` }
      }
    );
    
    console.log('User day closed successfully:', response.data);
    return response.data;
  } catch (error) {
    console.error('Failed to close user day:', error.response?.data || error.message);
    throw error;
  }
}

async function getUserOrderStats(token) {
  try {
    const response = await axios.get(
      `${API_URL}/day-operations/user-order-stats`,
      {
        headers: { Authorization: `Bearer ${token}` }
      }
    );
    
    console.log('User order stats:', response.data);
    return response.data;
  } catch (error) {
    console.error('Failed to get user order stats:', error.response?.data || error.message);
    throw error;
  }
}

// Run the test
async function runTest() {
  try {
    console.log('Starting user day status test...');
    
    // Login
    const token = await login();
    console.log('Login successful');
    
    // Get initial user order stats
    console.log('\n--- Initial User Order Stats ---');
    const initialStats = await getUserOrderStats(token);
    
    // Open day for user
    console.log('\n--- Opening Day for User ---');
    await openUserDay(token, testUser.id);
    
    // Get user order stats after opening
    console.log('\n--- User Order Stats After Opening ---');
    const statsAfterOpening = await getUserOrderStats(token);
    
    // Close day for user
    console.log('\n--- Closing Day for User ---');
    await closeUserDay(token, testUser.id);
    
    // Get user order stats after closing
    console.log('\n--- User Order Stats After Closing ---');
    const statsAfterClosing = await getUserOrderStats(token);
    
    console.log('\n--- Test Complete ---');
    
    // Verify user day status
    const userStats = statsAfterClosing.userOrderStats.find(stat => stat.userId === testUser.id);
    if (userStats) {
      console.log('\nUser Day Status Verification:');
      console.log('- Opening Time:', userStats.openingTime ? 'Set' : 'Not Set');
      console.log('- Closing Time:', userStats.closingTime ? 'Set' : 'Not Set');
      console.log('- Opening Cash:', userStats.openingCash);
      console.log('- Closing Cash:', userStats.closingCash);
      console.log('- Order Count:', userStats.orderCount);
      console.log('- Total Amount:', userStats.totalAmount);
    } else {
      console.log('\nWarning: User stats not found in the response');
    }
    
  } catch (error) {
    console.error('Test failed:', error);
  }
}

// Execute the test
runTest();

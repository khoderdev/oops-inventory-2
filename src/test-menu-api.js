// Simple test script for menu API endpoints
// Run with: node src/test-menu-api.js

// Import fetch for making API requests
const fetch = require('node-fetch');

// Base URL for API
const API_BASE_URL = 'http://localhost:3001/api';

// Test function to get food menu items
async function testGetFoodMenuItems(isActive = true) {
  try {
    const response = await fetch(`${API_BASE_URL}/menu-items/type/food?isActive=${isActive}`);
    const data = await response.json();
    console.log(`Food menu items (isActive=${isActive}):`);
    console.log(`Total items: ${data.length}`);
    console.log('Sample items:', data.slice(0, 3));
    return data;
  } catch (error) {
    console.error('Error fetching food menu items:', error);
    return null;
  }
}

// Test function to get beverage menu items
async function testGetBeverageMenuItems(isActive = true) {
  try {
    const response = await fetch(`${API_BASE_URL}/menu-items/type/beverage?isActive=${isActive}`);
    const data = await response.json();
    console.log(`Beverage menu items (isActive=${isActive}):`);
    console.log(`Total items: ${data.length}`);
    console.log('Sample items:', data.slice(0, 3));
    return data;
  } catch (error) {
    console.error('Error fetching beverage menu items:', error);
    return null;
  }
}

// Run all tests
async function runTests() {
  console.log('=== Testing Menu API Endpoints ===');
  
  // Test active food menu items
  console.log('\n--- Testing Active Food Menu Items ---');
  const activeFoodItems = await testGetFoodMenuItems(true);
  
  // Test inactive food menu items
  console.log('\n--- Testing Inactive Food Menu Items ---');
  const inactiveFoodItems = await testGetFoodMenuItems(false);
  
  // Test active beverage menu items
  console.log('\n--- Testing Active Beverage Menu Items ---');
  const activeBeverageItems = await testGetBeverageMenuItems(true);
  
  // Test inactive beverage menu items
  console.log('\n--- Testing Inactive Beverage Menu Items ---');
  const inactiveBeverageItems = await testGetBeverageMenuItems(false);
  
  // Summary
  console.log('\n=== Test Summary ===');
  console.log(`Active Food Items: ${activeFoodItems?.length || 0}`);
  console.log(`Inactive Food Items: ${inactiveFoodItems?.length || 0}`);
  console.log(`Active Beverage Items: ${activeBeverageItems?.length || 0}`);
  console.log(`Inactive Beverage Items: ${inactiveBeverageItems?.length || 0}`);
}

// Run the tests
runTests();

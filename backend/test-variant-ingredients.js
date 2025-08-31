const axios = require('axios');
const dotenv = require('dotenv');
dotenv.config();

// Configuration
const API_URL = process.env.API_URL || 'http://localhost:3001/api';
const AUTH_TOKEN = process.env.AUTH_TOKEN; // Set this in your .env file or replace with actual token

// Test data
const testBeverageItem = {
  name: 'Test Coffee with Variants',
  category: {
    id: 1, // Replace with an actual category ID for beverages
    name: 'Beverages',
    value: 'beverages'
  },
  price: 4.99,
  description: 'Test beverage with variant ingredients',
  isPOSItem: true,
  isBeverage: true,
  unit: 'piece',
  // Add ingredients with variantName to test variant ingredients
  ingredients: [
    // Regular ingredients
    {
      materialId: '1', // Replace with actual material ID
      quantity: 1,
      unit: 'piece',
      cost: 1.50,
      type: 'material'
    },
    // Variant ingredients for Small
    {
      materialId: '2', // Replace with actual material ID
      quantity: 30,
      unit: 'ml',
      cost: 0.50,
      type: 'material',
      variantName: 'Small'
    },
    // Variant ingredients for Medium
    {
      materialId: '2', // Replace with actual material ID
      quantity: 60,
      unit: 'ml',
      cost: 1.00,
      type: 'material',
      variantName: 'Medium'
    },
    // Variant ingredients for Large
    {
      materialId: '2', // Replace with actual material ID
      quantity: 90,
      unit: 'ml',
      cost: 1.50,
      type: 'material',
      variantName: 'Large'
    }
  ]
};

// Variants to create after menu item creation
const variants = [
  {
    name: 'Small',
    volume: 250,
    unit: 'ml',
    price: 4.99
  },
  {
    name: 'Medium',
    volume: 350,
    unit: 'ml',
    price: 5.99
  },
  {
    name: 'Large',
    volume: 450,
    unit: 'ml',
    price: 6.99
  }
];

// API client with auth
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${AUTH_TOKEN}`
  }
});

// Test functions
async function createTestBeverageItem() {
  try {
    console.log('Creating test beverage item...');
    const response = await api.post('/menu-items', testBeverageItem);
    const menuItem = response.data;
    console.log(`Created menu item with ID: ${menuItem.id}`);
    return menuItem;
  } catch (error) {
    console.error('Failed to create test beverage item:', error.response?.data || error.message);
    throw error;
  }
}

async function createVariants(menuItemId) {
  try {
    console.log('Creating variants for menu item...');
    const variantsWithMenuItemId = variants.map((variant, index) => ({
      ...variant,
      menuItemId,
      isActive: true,
      sortOrder: index
    }));
    
    const response = await api.post('/variants/bulk', { variants: variantsWithMenuItemId });
    console.log(`Created ${response.data.length} variants`);
    return response.data;
  } catch (error) {
    console.error('Failed to create variants:', error.response?.data || error.message);
    throw error;
  }
}

async function getVariantIngredients(variantIds) {
  try {
    console.log('Checking variant ingredients...');
    const allIngredients = [];
    
    for (const variantId of variantIds) {
      const response = await api.get(`/variant-ingredients/variant/${variantId}`);
      console.log(`Found ${response.data.data.length} ingredients for variant ID ${variantId}`);
      allIngredients.push(...response.data.data);
    }
    
    return allIngredients;
  } catch (error) {
    console.error('Failed to get variant ingredients:', error.response?.data || error.message);
    throw error;
  }
}

async function runTest() {
  try {
    // Step 1: Create test beverage item
    const menuItem = await createTestBeverageItem();
    
    // Step 2: Create variants for the menu item
    const createdVariants = await createVariants(menuItem.id);
    const variantIds = createdVariants.map(v => v.id);
    
    // Step 3: Check if variant ingredients were created
    const variantIngredients = await getVariantIngredients(variantIds);
    
    console.log('\n--- Test Results ---');
    console.log(`Menu Item ID: ${menuItem.id}`);
    console.log(`Variants Created: ${createdVariants.length}`);
    console.log(`Variant Ingredients Found: ${variantIngredients.length}`);
    
    if (variantIngredients.length > 0) {
      console.log('\nVariant Ingredients Details:');
      variantIngredients.forEach(ingredient => {
        console.log(`- Variant ID: ${ingredient.variantId}, Material ID: ${ingredient.materialId}, Quantity: ${ingredient.quantity} ${ingredient.unit}`);
      });
      console.log('\nTest PASSED: Variant ingredients were successfully saved!');
    } else {
      console.log('\nTest FAILED: No variant ingredients were found.');
    }
    
  } catch (error) {
    console.error('Test failed with error:', error);
  }
}

// Run the test
runTest();

/**
 * End-to-end test script for beverage variant volume conversion functionality
 * Tests the complete flow: Material → MenuItem → Variants → Order → Stock Deduction
 * Run with: node scripts/test-beverage-e2e.js
 */

import sequelize from '../config/database.js';
import { Material, MenuItem, Variants, OrderItem, StockEntry, Category } from '../models/index.js';
import { calculateBeverageDeduction, convertVolume, isValidBeverageUnit } from '../utils/volumeConversionUtils.js';

async function setupTestData() {
  console.log('🔧 Setting up test data...\n');

  // Create test category
  const [beverageCategory] = await Category.findOrCreate({
    where: { name: 'Test Beverages' },
    defaults: { value: 'test_beverages' }
  });

  // Create test beverage material
  const [cocaColaMaterial] = await Material.findOrCreate({
    where: { name: 'Test Coca Cola 330ml' },
    defaults: {
      categoryId: beverageCategory.id,
      unitType: 'volume',
      baseUnit: 'ml',
      volumePerUnit: 330,
      volumeUnit: 'ml',
      costPerUnit: 1.50
    }
  });

  // Create stock entry for the material
  const [stockEntry] = await StockEntry.findOrCreate({
    where: { materialId: cocaColaMaterial.id },
    defaults: {
      materialId: cocaColaMaterial.id,
      supplier: 'Test Supplier',
      purchasedQuantity: 24,
      purchasedUnit: 'bottle',
      purchasedIndividualQuantity: 24,
      purchasedIndividualUnit: 'bottle',
      purchasedConvertedQuantity: 24,
      purchasedConvertedUnit: 'bottle',
      costPerPurchasedUnit: 1.50,
      costPerBaseUnit: 1.50,
      totalCost: 36.00,
      purchaseDate: new Date(),
      expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days from now
    }
  });

  // Create test menu item
  const [menuItem] = await MenuItem.findOrCreate({
    where: { name: 'Test Coca Cola Drink' },
    defaults: {
      name: 'Test Coca Cola Drink',
      description: 'Test beverage menu item',
      price: 3.00,
      categoryId: beverageCategory.id,
      type: 'beverage',
      isActive: true
    }
  });

  // Create test variants
  const variantData = [
    { name: 'Small', volume: 25, unit: 'cl', price: 2.50 },
    { name: 'Regular', volume: 33, unit: 'cl', price: 3.00 },
    { name: 'Large', volume: 50, unit: 'cl', price: 4.00 }
  ];

  for (const variant of variantData) {
    await Variants.findOrCreate({
      where: { 
        menuItemId: menuItem.id,
        name: variant.name 
      },
      defaults: {
        menuItemId: menuItem.id,
        name: variant.name,
        volume: variant.volume,
        unit: variant.unit,
        price: variant.price,
        isActive: true,
        sortOrder: variantData.indexOf(variant)
      }
    });
  }

  return {
    material: cocaColaMaterial,
    stockEntry,
    menuItem,
    category: beverageCategory
  };
}

async function testVolumeConversions() {
  console.log('🧪 Testing Volume Conversions...\n');

  const tests = [
    { from: 25, fromUnit: 'cl', toUnit: 'ml', expected: 250 },
    { from: 33, fromUnit: 'cl', toUnit: 'ml', expected: 330 },
    { from: 50, fromUnit: 'cl', toUnit: 'ml', expected: 500 },
    { from: 16, fromUnit: 'fl_oz', toUnit: 'ml', expected: 473.176 }
  ];

  let passedTests = 0;
  
  for (const test of tests) {
    try {
      const result = convertVolume(test.from, test.fromUnit, test.toUnit);
      const isCorrect = Math.abs(result - test.expected) < 0.01;
      
      console.log(`${isCorrect ? '✅' : '❌'} ${test.from}${test.fromUnit} → ${result.toFixed(2)}${test.toUnit} (expected: ${test.expected})`);
      
      if (isCorrect) passedTests++;
    } catch (error) {
      console.log(`❌ ${test.from}${test.fromUnit} → ERROR: ${error.message}`);
    }
  }

  console.log(`\n📊 Volume conversion tests: ${passedTests}/${tests.length} passed\n`);
  return passedTests === tests.length;
}

async function testBeverageDeduction(material) {
  console.log('🥤 Testing Beverage Deduction Logic...\n');

  const scenarios = [
    { variant: { volume: 25, unit: 'cl' }, orderQty: 1, expectedUnits: 1, description: '1x Small (25cl)' },
    { variant: { volume: 33, unit: 'cl' }, orderQty: 1, expectedUnits: 1, description: '1x Regular (33cl)' },
    { variant: { volume: 50, unit: 'cl' }, orderQty: 1, expectedUnits: 2, description: '1x Large (50cl)' },
    { variant: { volume: 33, unit: 'cl' }, orderQty: 3, expectedUnits: 3, description: '3x Regular (33cl)' },
    { variant: { volume: 25, unit: 'cl' }, orderQty: 4, expectedUnits: 4, description: '4x Small (25cl)' }
  ];

  let passedTests = 0;

  for (const scenario of scenarios) {
    try {
      const result = calculateBeverageDeduction(
        scenario.variant.volume,
        scenario.variant.unit,
        material,
        scenario.orderQty
      );

      const isCorrect = result.unitsToDeduct === scenario.expectedUnits;
      
      console.log(`${isCorrect ? '✅' : '❌'} ${scenario.description}:`);
      console.log(`   Expected: ${scenario.expectedUnits} bottles, Got: ${result.unitsToDeduct} bottles`);
      console.log(`   Waste: ${result.wastePercentage.toFixed(1)}%, Details: ${result.calculationDetails}`);
      
      if (isCorrect) passedTests++;
    } catch (error) {
      console.log(`❌ ${scenario.description}: ERROR - ${error.message}`);
    }
  }

  console.log(`\n📊 Deduction tests: ${passedTests}/${scenarios.length} passed\n`);
  return passedTests === scenarios.length;
}

async function testUnitValidation() {
  console.log('✅ Testing Unit Validation...\n');

  const validUnits = ['ml', 'cl', 'dl', 'l', 'fl_oz', 'cup', 'pt', 'qt', 'gal'];
  const invalidUnits = ['invalid', 'xyz', '', 'liters', 'milliliters'];

  let passedTests = 0;
  const totalTests = validUnits.length + invalidUnits.length;

  validUnits.forEach(unit => {
    const isValid = isValidBeverageUnit(unit);
    console.log(`${isValid ? '✅' : '❌'} "${unit}" should be valid: ${isValid}`);
    if (isValid) passedTests++;
  });

  invalidUnits.forEach(unit => {
    const isValid = isValidBeverageUnit(unit);
    console.log(`${!isValid ? '✅' : '❌'} "${unit}" should be invalid: ${!isValid}`);
    if (!isValid) passedTests++;
  });

  console.log(`\n📊 Validation tests: ${passedTests}/${totalTests} passed\n`);
  return passedTests === totalTests;
}

async function testDatabaseIntegration(testData) {
  console.log('🗄️ Testing Database Integration...\n');

  try {
    // Test material with volume data
    const material = await Material.findByPk(testData.material.id);
    console.log(`✅ Material found: ${material.name}`);
    console.log(`   Volume per unit: ${material.volumePerUnit}${material.volumeUnit}`);

    // Test menu item with variants
    const menuItem = await MenuItem.findByPk(testData.menuItem.id, {
      include: [{
        model: Variants,
        as: 'variants',
        where: { isActive: true },
        required: false
      }]
    });

    console.log(`✅ Menu item found: ${menuItem.name}`);
    console.log(`   Variants: ${menuItem.variants?.length || 0}`);

    if (menuItem.variants?.length > 0) {
      menuItem.variants.forEach(variant => {
        console.log(`   - ${variant.name}: ${variant.volume}${variant.unit} @ $${variant.price}`);
      });
    }

    // Test stock entry
    const stockEntry = await StockEntry.findByPk(testData.stockEntry.id, {
      include: [{
        model: Material,
        as: 'material'
      }]
    });

    console.log(`✅ Stock entry found: ${stockEntry.purchasedQuantity} ${stockEntry.purchasedUnit}`);
    console.log(`   Available quantity: ${stockEntry.purchasedIndividualQuantity - (stockEntry.usedQuantity || 0)}`);

    return true;
  } catch (error) {
    console.error(`❌ Database integration test failed:`, error.message);
    return false;
  }
}

async function simulateOrderFlow(testData) {
  console.log('🛒 Simulating Order Flow...\n');

  try {
    // Get variants
    const variants = await Variants.findAll({
      where: { menuItemId: testData.menuItem.id, isActive: true }
    });

    if (variants.length === 0) {
      throw new Error('No variants found for menu item');
    }

    // Simulate ordering the "Regular" variant (33cl)
    const regularVariant = variants.find(v => v.name === 'Regular');
    if (!regularVariant) {
      throw new Error('Regular variant not found');
    }

    console.log(`📋 Simulating order: 2x ${regularVariant.name} (${regularVariant.volume}${regularVariant.unit})`);

    // Calculate deduction
    const deductionResult = calculateBeverageDeduction(
      regularVariant.volume,
      regularVariant.unit,
      testData.material,
      2 // order quantity
    );

    console.log(`🔢 Deduction calculation:`);
    console.log(`   Units to deduct: ${deductionResult.unitsToDeduct}`);
    console.log(`   Waste percentage: ${deductionResult.wastePercentage.toFixed(2)}%`);
    console.log(`   Calculation: ${deductionResult.calculationDetails}`);

    // Check current stock
    const currentStock = await StockEntry.findByPk(testData.stockEntry.id);
    const availableQuantity = currentStock.purchasedIndividualQuantity - (currentStock.usedQuantity || 0);
    
    console.log(`📦 Current stock: ${availableQuantity} bottles available`);

    if (availableQuantity >= deductionResult.unitsToDeduct) {
      console.log(`✅ Sufficient stock for order`);
      
      // Simulate stock deduction (don't actually update in test)
      const newUsedQuantity = (currentStock.usedQuantity || 0) + deductionResult.unitsToDeduct;
      const remainingStock = currentStock.purchasedIndividualQuantity - newUsedQuantity;
      
      console.log(`📊 After order simulation:`);
      console.log(`   Used quantity: ${newUsedQuantity} bottles`);
      console.log(`   Remaining stock: ${remainingStock} bottles`);
      
      return true;
    } else {
      console.log(`❌ Insufficient stock for order`);
      return false;
    }

  } catch (error) {
    console.error(`❌ Order flow simulation failed:`, error.message);
    return false;
  }
}

async function cleanupTestData(testData) {
  console.log('🧹 Cleaning up test data...\n');

  try {
    // Delete in reverse order of dependencies
    await Variants.destroy({ where: { menuItemId: testData.menuItem.id } });
    await StockEntry.destroy({ where: { id: testData.stockEntry.id } });
    await MenuItem.destroy({ where: { id: testData.menuItem.id } });
    await Material.destroy({ where: { id: testData.material.id } });
    await Category.destroy({ where: { id: testData.category.id } });
    
    console.log('✅ Test data cleaned up successfully');
  } catch (error) {
    console.error('❌ Failed to cleanup test data:', error.message);
  }
}

async function runEndToEndTest() {
  console.log('🚀 Starting End-to-End Beverage Variant Test\n');
  console.log('='.repeat(60) + '\n');

  let testData;
  const results = {
    setup: false,
    volumeConversions: false,
    beverageDeduction: false,
    unitValidation: false,
    databaseIntegration: false,
    orderFlow: false
  };

  try {
    // Setup test data
    testData = await setupTestData();
    results.setup = true;
    console.log('✅ Test data setup completed\n');

    // Run tests
    results.volumeConversions = await testVolumeConversions();
    results.beverageDeduction = await testBeverageDeduction(testData.material);
    results.unitValidation = await testUnitValidation();
    results.databaseIntegration = await testDatabaseIntegration(testData);
    results.orderFlow = await simulateOrderFlow(testData);

  } catch (error) {
    console.error('❌ Test execution failed:', error.message);
  } finally {
    // Cleanup
    if (testData) {
      await cleanupTestData(testData);
    }
  }

  // Print final results
  console.log('\n' + '='.repeat(60));
  console.log('📈 END-TO-END TEST RESULTS');
  console.log('='.repeat(60));

  const testNames = [
    'Test Data Setup',
    'Volume Conversions',
    'Beverage Deduction Logic',
    'Unit Validation',
    'Database Integration',
    'Order Flow Simulation'
  ];

  Object.entries(results).forEach(([key, passed], index) => {
    console.log(`${passed ? '✅' : '❌'} ${testNames[index]}: ${passed ? 'PASSED' : 'FAILED'}`);
  });

  const passedCount = Object.values(results).filter(Boolean).length;
  const totalCount = Object.keys(results).length;

  console.log('\n' + '-'.repeat(60));
  console.log(`📊 Overall Result: ${passedCount}/${totalCount} tests passed`);
  
  if (passedCount === totalCount) {
    console.log('🎉 ALL TESTS PASSED! Beverage variant system is working correctly.');
  } else {
    console.log('⚠️ Some tests failed. Please review the implementation.');
  }

  return passedCount === totalCount;
}

// Run the test if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runEndToEndTest()
    .then((success) => {
      process.exit(success ? 0 : 1);
    })
    .catch((error) => {
      console.error('💥 Test script failed:', error);
      process.exit(1);
    });
}

export { runEndToEndTest };

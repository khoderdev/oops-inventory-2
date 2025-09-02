/**
 * Test script for ml to bottle conversion
 * Tests the fix for adding ml quantities to bottle-based stock entries
 */

// Import required modules
import volumeUtils from './utils/volumeConversionUtils.js';
const { convertVolume } = volumeUtils;

// Test material (bottle-based)
const testMaterial = {
  name: 'Bombay Gin',
  volumePerUnit: 700,
  volumeUnit: 'ml',
  unitType: 'package',
  packageQuantity: 1,
  baseUnit: 'bottle'
};

// Test cases
console.log('===== ML TO BOTTLE CONVERSION TESTS =====');

// Test 1: Half bottle (350ml)
const halfBottle = 350;
const halfBottleResult = convertVolume(halfBottle, 'ml', 'bottle', testMaterial);
console.log(`Test 1: ${halfBottle}ml to bottles = ${halfBottleResult} bottles (Expected: ~0.5)`);

// Test 2: Full bottle (700ml)
const fullBottle = 700;
const fullBottleResult = convertVolume(fullBottle, 'ml', 'bottle', testMaterial);
console.log(`Test 2: ${fullBottle}ml to bottles = ${fullBottleResult} bottles (Expected: 1.0)`);

// Test 3: Multiple bottles (2100ml = 3 bottles)
const multipleBottles = 2100;
const multipleBottlesResult = convertVolume(multipleBottles, 'ml', 'bottle', testMaterial);
console.log(`Test 3: ${multipleBottles}ml to bottles = ${multipleBottlesResult} bottles (Expected: 3.0)`);

// Test 4: Small amount (50ml)
const smallAmount = 50;
const smallAmountResult = convertVolume(smallAmount, 'ml', 'bottle', testMaterial);
console.log(`Test 4: ${smallAmount}ml to bottles = ${smallAmountResult} bottles (Expected: ~0.07)`);

console.log('\n===== BOTTLE TO ML CONVERSION TESTS =====');

// Test 5: 1 bottle to ml
const oneBottle = 1;
const oneBottleResult = convertVolume(oneBottle, 'bottle', 'ml', testMaterial);
console.log(`Test 5: ${oneBottle} bottle to ml = ${oneBottleResult}ml (Expected: 700)`);

// Test 6: 0.5 bottles to ml
const partialBottle = 0.5;
const partialBottleResult = convertVolume(partialBottle, 'bottle', 'ml', testMaterial);
console.log(`Test 6: ${partialBottle} bottles to ml = ${partialBottleResult}ml (Expected: 350)`);

console.log('\n===== COMPLETED TESTS =====');

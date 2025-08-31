/**
 * Simple test script for beverage volume conversion without database dependencies
 * Run with: node scripts/simple-test-beverage.js
 */

// Import the volume conversion utilities directly
import { convertVolume, isValidBeverageUnit, calculateBeverageDeduction, formatVolume } from '../utils/volumeConversionUtils.js';

console.log('🧪 Testing Beverage Volume Conversion System (Standalone)\n');

// Test 1: Basic volume conversions
console.log('=== Test 1: Basic Volume Conversions ===');
const conversionTests = [
  { from: 33, fromUnit: 'cl', toUnit: 'ml', expected: 330 },
  { from: 500, fromUnit: 'ml', toUnit: 'cl', expected: 50 },
  { from: 1, fromUnit: 'l', toUnit: 'ml', expected: 1000 },
  { from: 16, fromUnit: 'fl_oz', toUnit: 'ml', expected: 473.176 }
];

let passedConversions = 0;
conversionTests.forEach(test => {
  try {
    const result = convertVolume(test.from, test.fromUnit, test.toUnit);
    const isCorrect = Math.abs(result - test.expected) < 0.01;
    console.log(`${isCorrect ? '✅' : '❌'} ${test.from}${test.fromUnit} → ${result.toFixed(2)}${test.toUnit} (expected: ${test.expected})`);
    if (isCorrect) passedConversions++;
  } catch (error) {
    console.log(`❌ ${test.from}${test.fromUnit} → ERROR: ${error.message}`);
  }
});

console.log(`\nConversion tests: ${passedConversions}/${conversionTests.length} passed\n`);

// Test 2: Unit validation
console.log('=== Test 2: Unit Validation ===');
const validUnits = ['ml', 'cl', 'dl', 'l', 'fl_oz', 'cup', 'pt', 'qt', 'gal'];
const invalidUnits = ['invalid', 'xyz', '', 'liters'];

let passedValidations = 0;
const totalValidationTests = validUnits.length + invalidUnits.length;

validUnits.forEach(unit => {
  const isValid = isValidBeverageUnit(unit);
  console.log(`${isValid ? '✅' : '❌'} "${unit}" should be valid: ${isValid}`);
  if (isValid) passedValidations++;
});

invalidUnits.forEach(unit => {
  const isValid = isValidBeverageUnit(unit);
  console.log(`${!isValid ? '✅' : '❌'} "${unit}" should be invalid: ${!isValid}`);
  if (!isValid) passedValidations++;
});

console.log(`\nValidation tests: ${passedValidations}/${totalValidationTests} passed\n`);

// Test 3: Beverage deduction calculation
console.log('=== Test 3: Beverage Deduction Calculation ===');
const mockMaterial = {
  id: 1,
  name: 'Test Coca Cola',
  volumePerUnit: 330,
  volumeUnit: 'ml',
  unitType: 'volume'
};

const deductionTests = [
  { variant: { volume: 25, unit: 'cl' }, orderQty: 1, expectedUnits: 1, description: '1x Small (25cl) from 330ml bottles' },
  { variant: { volume: 33, unit: 'cl' }, orderQty: 1, expectedUnits: 1, description: '1x Regular (33cl) from 330ml bottles' },
  { variant: { volume: 50, unit: 'cl' }, orderQty: 1, expectedUnits: 2, description: '1x Large (50cl) from 330ml bottles' },
  { variant: { volume: 33, unit: 'cl' }, orderQty: 3, expectedUnits: 3, description: '3x Regular (33cl) from 330ml bottles' }
];

let passedDeductions = 0;
deductionTests.forEach(test => {
  try {
    const result = calculateBeverageDeduction(
      test.variant.volume,
      test.variant.unit,
      mockMaterial,
      test.orderQty
    );

    const isCorrect = result.unitsToDeduct === test.expectedUnits;
    console.log(`${isCorrect ? '✅' : '❌'} ${test.description}`);
    console.log(`   Expected: ${test.expectedUnits} bottles, Got: ${result.unitsToDeduct} bottles`);
    console.log(`   Waste: ${result.wastePercentage.toFixed(1)}%, Details: ${result.calculationDetails}`);
    
    if (isCorrect) passedDeductions++;
  } catch (error) {
    console.log(`❌ ${test.description}: ERROR - ${error.message}`);
  }
});

console.log(`\nDeduction tests: ${passedDeductions}/${deductionTests.length} passed\n`);

// Test 4: Format volume function
console.log('=== Test 4: Volume Formatting ===');
const formatTests = [
  { volume: 330, unit: 'ml', expected: '330ml' },
  { volume: 33, unit: 'cl', expected: '33cl' },
  { volume: 1.5, unit: 'l', expected: '1.5l' },
  { volume: 16, unit: 'fl_oz', expected: '16fl_oz' }
];

let passedFormats = 0;
formatTests.forEach(test => {
  try {
    const result = formatVolume(test.volume, test.unit);
    const isCorrect = result === test.expected;
    console.log(`${isCorrect ? '✅' : '❌'} formatVolume(${test.volume}, '${test.unit}') → '${result}' (expected: '${test.expected}')`);
    if (isCorrect) passedFormats++;
  } catch (error) {
    console.log(`❌ formatVolume(${test.volume}, '${test.unit}') → ERROR: ${error.message}`);
  }
});

console.log(`\nFormat tests: ${passedFormats}/${formatTests.length} passed\n`);

// Summary
console.log('='.repeat(60));
console.log('📊 STANDALONE TEST SUMMARY');
console.log('='.repeat(60));

const totalTests = conversionTests.length + totalValidationTests + deductionTests.length + formatTests.length;
const totalPassed = passedConversions + passedValidations + passedDeductions + passedFormats;

console.log(`✅ Volume Conversions: ${passedConversions}/${conversionTests.length}`);
console.log(`✅ Unit Validations: ${passedValidations}/${totalValidationTests}`);
console.log(`✅ Deduction Logic: ${passedDeductions}/${deductionTests.length}`);
console.log(`✅ Volume Formatting: ${passedFormats}/${formatTests.length}`);
console.log('-'.repeat(60));
console.log(`📈 Overall: ${totalPassed}/${totalTests} tests passed`);

if (totalPassed === totalTests) {
  console.log('🎉 ALL TESTS PASSED! Volume conversion system is working correctly.');
} else {
  console.log('⚠️ Some tests failed. Please review the implementation.');
}

console.log('\n✨ Standalone testing completed!');

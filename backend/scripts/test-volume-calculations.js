import { Material, StockEntry } from '../models/index.js';
import sequelize from '../config/database.js';

async function testVolumeCalculations() {
  try {
    console.log('🧪 Testing Volume Calculations for Beverage Stock');
    console.log('=' .repeat(60));

    // First, let's create or find a Stoli Gold material with volume information
    const [stoliGold, created] = await Material.findOrCreate({
      where: { name: 'Stoli Gold' },
      defaults: {
        name: 'Stoli Gold',
        baseUnit: 'bottle',
        unitType: 'package',
        inputUnit: 'box',
        packageQuantity: 12, // 12 bottles per box
        volumePerUnit: 75, // 75cl per bottle
        volumeUnit: 'cl'
      }
    });

    if (created) {
      console.log('✅ Created Stoli Gold material with volume info');
    } else {
      console.log('📋 Found existing Stoli Gold material');
      // Update with volume info if missing
      if (!stoliGold.volumePerUnit) {
        await stoliGold.update({
          volumePerUnit: 75,
          volumeUnit: 'cl',
          packageQuantity: 12
        });
        console.log('✅ Updated Stoli Gold with volume information');
      }
    }

    console.log('📊 Material Details:', {
      name: stoliGold.name,
      baseUnit: stoliGold.baseUnit,
      unitType: stoliGold.unitType,
      inputUnit: stoliGold.inputUnit,
      packageQuantity: stoliGold.packageQuantity,
      volumePerUnit: stoliGold.volumePerUnit,
      volumeUnit: stoliGold.volumeUnit
    });

    // Test Case: 3 boxes = 36 bottles = 2,700cl, costing $432
    console.log('\n🎯 Test Case: 3 boxes of Stoli Gold ($432 total)');
    console.log('-'.repeat(50));

    const testStockEntry = await StockEntry.create({
      materialId: stoliGold.id,
      supplier: 'Test Supplier',
      purchasedQuantity: 3, // 3 boxes
      purchasedUnit: 'box',
      totalCost: 432.00,
      purchaseDate: new Date(),
      isPOSItem: true
    });

    // Fetch the created entry with all calculated fields
    const createdEntry = await StockEntry.findByPk(testStockEntry.id, {
      include: { model: Material, as: 'material' }
    });

    console.log('📦 Stock Entry Results:');
    console.log('  Purchased:', `${createdEntry.purchasedQuantity} ${createdEntry.purchasedUnit}`);
    console.log('  Individual:', `${createdEntry.purchasedIndividualQuantity} ${createdEntry.purchasedIndividualUnit}`);
    console.log('  Volume per unit:', `${createdEntry.volumePerUnit} ${createdEntry.volumeUnit}`);
    console.log('  Total volume:', `${createdEntry.totalVolume} ${createdEntry.volumeUnit}`);
    console.log('  Total cost:', `$${createdEntry.totalCost}`);
    console.log('  Cost per bottle:', `$${createdEntry.costPerBaseUnit}`);
    console.log('  Cost per ${createdEntry.volumeUnit}:', `$${createdEntry.costPerVolumeUnit}`);

    // Verify calculations
    const expectedBottles = 3 * 12; // 36 bottles
    const expectedTotalVolume = 36 * 75; // 2700cl
    const expectedCostPerBottle = 432 / 36; // $12 per bottle
    const expectedCostPerCl = 432 / 2700; // $0.16 per cl

    console.log('\n✅ Verification:');
    console.log(`  Expected bottles: ${expectedBottles}, Actual: ${createdEntry.purchasedIndividualQuantity}`);
    console.log(`  Expected total volume: ${expectedTotalVolume}cl, Actual: ${createdEntry.totalVolume}cl`);
    console.log(`  Expected cost per bottle: $${expectedCostPerBottle.toFixed(2)}, Actual: $${parseFloat(createdEntry.costPerBaseUnit).toFixed(2)}`);
    console.log(`  Expected cost per cl: $${expectedCostPerCl.toFixed(4)}, Actual: $${parseFloat(createdEntry.costPerVolumeUnit).toFixed(4)}`);

    // Validation
    const bottlesMatch = createdEntry.purchasedIndividualQuantity === expectedBottles;
    const volumeMatch = Math.abs(createdEntry.totalVolume - expectedTotalVolume) < 0.001;
    const costPerBottleMatch = Math.abs(parseFloat(createdEntry.costPerBaseUnit) - expectedCostPerBottle) < 0.01;
    const costPerClMatch = Math.abs(parseFloat(createdEntry.costPerVolumeUnit) - expectedCostPerCl) < 0.0001;

    console.log('\n🎯 Test Results:');
    console.log(`  Bottles calculation: ${bottlesMatch ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`  Volume calculation: ${volumeMatch ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`  Cost per bottle: ${costPerBottleMatch ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`  Cost per cl: ${costPerClMatch ? '✅ PASS' : '❌ FAIL'}`);

    if (bottlesMatch && volumeMatch && costPerBottleMatch && costPerClMatch) {
      console.log('\n🎉 ALL TESTS PASSED! Volume calculations are working correctly.');
    } else {
      console.log('\n❌ Some tests failed. Please check the calculations.');
    }

    // Clean up test data
    await testStockEntry.destroy();
    console.log('\n🧹 Cleaned up test data');

  } catch (error) {
    console.error('❌ Error during volume calculation test:', error);
  } finally {
    await sequelize.close();
  }
}

// Run the test
testVolumeCalculations();

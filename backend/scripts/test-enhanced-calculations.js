import { Material, StockEntry } from '../models/index.js';
import sequelize from '../config/database.js';

async function testEnhancedCalculations() {
  try {
    console.log('🧪 Testing Enhanced Calculations for All Material Types');
    console.log('=' .repeat(70));

    // Test 1: Volume Material (Beverages)
    console.log('\n🍺 TEST 1: Volume Material - Stoli Gold');
    console.log('-'.repeat(50));
    
    const [stoliGold, created1] = await Material.findOrCreate({
      where: { name: 'Stoli Gold Test' },
      defaults: {
        name: 'Stoli Gold Test',
        baseUnit: 'bottle',
        unitType: 'volume',
        inputUnit: 'box',
        packageQuantity: 12,
        volumePerUnit: 75,
        volumeUnit: 'cl'
      }
    });

    const volumeStockEntry = await StockEntry.create({
      materialId: stoliGold.id,
      supplier: 'Premium Spirits',
      purchasedQuantity: 3,
      purchasedUnit: 'box',
      totalCost: 432.00,
      purchaseDate: new Date(),
      isPOSItem: true
    });

    const volumeEntry = await StockEntry.findByPk(volumeStockEntry.id, {
      include: { model: Material, as: 'material' }
    });

    console.log('📊 Volume Results:');
    console.log(`  Purchased: ${volumeEntry.purchasedQuantity} ${volumeEntry.purchasedUnit}`);
    console.log(`  Individual: ${volumeEntry.purchasedIndividualQuantity} ${volumeEntry.purchasedIndividualUnit}`);
    console.log(`  Volume per unit: ${volumeEntry.volumePerUnit} ${volumeEntry.volumeUnit}`);
    console.log(`  Total volume: ${volumeEntry.totalVolume} ${volumeEntry.volumeUnit}`);
    console.log(`  Cost per ${volumeEntry.volumeUnit}: $${volumeEntry.costPerVolumeUnit}`);

    // Test 2: Mass Material (Flour)
    console.log('\n⚖️ TEST 2: Mass Material - All-Purpose Flour');
    console.log('-'.repeat(50));
    
    const [flour, created2] = await Material.findOrCreate({
      where: { name: 'All-Purpose Flour Test' },
      defaults: {
        name: 'All-Purpose Flour Test',
        baseUnit: 'bag',
        unitType: 'mass',
        inputUnit: 'bag',
        massPerUnit: 1000,
        massUnit: 'g',
        unitDescription: 'bags'
      }
    });

    const massStockEntry = await StockEntry.create({
      materialId: flour.id,
      supplier: 'Bakery Supply Co',
      purchasedQuantity: 10,
      purchasedUnit: 'bag',
      totalCost: 85.00,
      purchaseDate: new Date(),
      isPOSItem: false
    });

    const massEntry = await StockEntry.findByPk(massStockEntry.id, {
      include: { model: Material, as: 'material' }
    });

    console.log('📊 Mass Results:');
    console.log(`  Purchased: ${massEntry.purchasedQuantity} ${massEntry.purchasedUnit}`);
    console.log(`  Individual: ${massEntry.purchasedIndividualQuantity} ${massEntry.purchasedIndividualUnit}`);
    console.log(`  Mass per unit: ${massEntry.massPerUnit} ${massEntry.massUnit}`);
    console.log(`  Total mass: ${massEntry.totalMass} ${massEntry.massUnit}`);
    console.log(`  Cost per ${massEntry.massUnit}: $${massEntry.costPerMassUnit}`);

    // Test 3: Package Material (Napkins)
    console.log('\n📦 TEST 3: Package Material - Paper Napkins');
    console.log('-'.repeat(50));
    
    const [napkins, created3] = await Material.findOrCreate({
      where: { name: 'Paper Napkins Test' },
      defaults: {
        name: 'Paper Napkins Test',
        baseUnit: 'napkin',
        unitType: 'package',
        inputUnit: 'pack',
        packageQuantity: 50,
        piecesPerPackage: 50,
        unitDescription: 'napkins'
      }
    });

    const packageStockEntry = await StockEntry.create({
      materialId: napkins.id,
      supplier: 'Restaurant Supply',
      purchasedQuantity: 20,
      purchasedUnit: 'pack',
      totalCost: 120.00,
      purchaseDate: new Date(),
      isPOSItem: false
    });

    const packageEntry = await StockEntry.findByPk(packageStockEntry.id, {
      include: { model: Material, as: 'material' }
    });

    console.log('📊 Package Results:');
    console.log(`  Purchased: ${packageEntry.purchasedQuantity} ${packageEntry.purchasedUnit}`);
    console.log(`  Individual: ${packageEntry.purchasedIndividualQuantity} ${packageEntry.purchasedIndividualUnit}`);
    console.log(`  Pieces per package: ${packageEntry.piecesPerPackage}`);
    console.log(`  Total pieces: ${packageEntry.totalPieces} ${packageEntry.unitDescription}`);
    console.log(`  Cost per piece: $${packageEntry.costPerPiece}`);

    // Test 4: Piece Material (Plates)
    console.log('\n🔧 TEST 4: Piece Material - Ceramic Plates');
    console.log('-'.repeat(50));
    
    const [plates, created4] = await Material.findOrCreate({
      where: { name: 'Ceramic Plates Test' },
      defaults: {
        name: 'Ceramic Plates Test',
        baseUnit: 'plate',
        unitType: 'piece',
        unitDescription: 'plates'
      }
    });

    const pieceStockEntry = await StockEntry.create({
      materialId: plates.id,
      supplier: 'Kitchenware Direct',
      purchasedQuantity: 24,
      purchasedUnit: 'plate',
      totalCost: 240.00,
      purchaseDate: new Date(),
      isPOSItem: false
    });

    const pieceEntry = await StockEntry.findByPk(pieceStockEntry.id, {
      include: { model: Material, as: 'material' }
    });

    console.log('📊 Piece Results:');
    console.log(`  Purchased: ${pieceEntry.purchasedQuantity} ${pieceEntry.purchasedUnit}`);
    console.log(`  Individual: ${pieceEntry.purchasedIndividualQuantity} ${pieceEntry.purchasedIndividualUnit}`);
    console.log(`  Total pieces: ${pieceEntry.totalPieces} ${pieceEntry.unitDescription}`);
    console.log(`  Cost per piece: $${pieceEntry.costPerPiece}`);

    // Verification Summary
    console.log('\n🎯 VERIFICATION SUMMARY');
    console.log('='.repeat(70));
    
    const tests = [
      {
        name: 'Volume (Stoli Gold)',
        expected: { bottles: 36, volume: 2700, costPerCl: 0.16 },
        actual: { 
          bottles: volumeEntry.purchasedIndividualQuantity, 
          volume: volumeEntry.totalVolume, 
          costPerCl: parseFloat(volumeEntry.costPerVolumeUnit) 
        }
      },
      {
        name: 'Mass (Flour)',
        expected: { bags: 10, mass: 10000, costPerG: 0.0085 },
        actual: { 
          bags: massEntry.purchasedIndividualQuantity, 
          mass: massEntry.totalMass, 
          costPerG: parseFloat(massEntry.costPerMassUnit) 
        }
      },
      {
        name: 'Package (Napkins)',
        expected: { packs: 20, pieces: 1000, costPerPiece: 0.12 },
        actual: { 
          packs: packageEntry.purchasedQuantity, 
          pieces: packageEntry.totalPieces, 
          costPerPiece: parseFloat(packageEntry.costPerPiece) 
        }
      },
      {
        name: 'Piece (Plates)',
        expected: { pieces: 24, costPerPiece: 10.00 },
        actual: { 
          pieces: pieceEntry.totalPieces, 
          costPerPiece: parseFloat(pieceEntry.costPerPiece) 
        }
      }
    ];

    let allPassed = true;
    tests.forEach(test => {
      const passed = Object.keys(test.expected).every(key => 
        Math.abs(test.actual[key] - test.expected[key]) < 0.01
      );
      console.log(`${passed ? '✅' : '❌'} ${test.name}: ${passed ? 'PASS' : 'FAIL'}`);
      if (!passed) {
        console.log(`   Expected:`, test.expected);
        console.log(`   Actual:`, test.actual);
        allPassed = false;
      }
    });

    if (allPassed) {
      console.log('\n🎉 ALL ENHANCED CALCULATIONS WORKING CORRECTLY!');
    } else {
      console.log('\n❌ Some calculations failed verification.');
    }

    // Clean up test data
    await volumeStockEntry.destroy();
    await massStockEntry.destroy();
    await packageStockEntry.destroy();
    await pieceStockEntry.destroy();
    console.log('\n🧹 Cleaned up test data');

  } catch (error) {
    console.error('❌ Error during enhanced calculations test:', error);
  } finally {
    await sequelize.close();
  }
}

// Run the test
testEnhancedCalculations();

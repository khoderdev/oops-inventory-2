import { calculateDeductionAmount, logVariantDeduction } from '../utils/beverageVariantUtils.js';
import sequelize from '../config/database.js';
import { Material, MenuItem, Order, OrderItem, Variants, Category, StockEntry } from '../models/index.js';
import { deductIngredientStock } from '../controllers/ordersController.js';

// Test utility function
async function testVariantDeduction() {
  console.log('🧪 Starting beverage variant deduction test');
  
  try {
    // Start a transaction so we don't affect real data
    const transaction = await sequelize.transaction();
    
    try {
      // 1. Find or create a test beverage material (source)
      console.log('🔍 Looking for test beverage material');
      let testMaterial = await Material.findOne({
        where: { name: 'Test Whiskey' },
        transaction
      });
      
      if (!testMaterial) {
        console.log('➕ Creating test beverage material');
        // Create a category first if needed
        let categoryId;
        const category = await Category.findOne({
          where: { value: 'beverages', isActive: true },
          transaction
        });
        
        if (category) {
          categoryId = category.id;
        } else {
          console.log('Creating test category');
          const newCategory = await Category.create({
            name: 'Beverages',
            value: 'beverages',
            isActive: true
          }, { transaction });
          categoryId = newCategory.id;
        }
        
        testMaterial = await Material.create({
          name: 'Test Whiskey',
          baseUnit: 'ml',
          unitType: 'volume',  // Required field
          inputUnit: 'bottle', // For package materials
          packageQuantity: 750, // 750ml per bottle
          categoryId: categoryId
        }, { transaction });
        
        // Create stock entries for the test material
        console.log('➕ Creating stock entries for test material');
        await StockEntry.create({
          materialId: testMaterial.id,
          supplier: 'Test Supplier',
          purchasedQuantity: 10,
          purchasedUnit: 'bottle',
          purchasedIndividualQuantity: 10,  // 10 bottles in stock
          purchasedIndividualUnit: 'bottle',
          costPerPurchasedUnit: 30.00,
          totalCost: 300.00,
          purchaseDate: new Date(),
          expiryDate: new Date(new Date().setFullYear(new Date().getFullYear() + 1))
        }, { transaction });
      }
      
      // 2. Find or create a test menu item
      console.log('🔍 Looking for test beverage menu item');
      let testMenuItem = await MenuItem.findOne({
        where: { name: 'Test Whiskey' },
        transaction
      });
      
      if (!testMenuItem) {
        console.log('➕ Creating test beverage menu item');
        testMenuItem = await MenuItem.create({
          name: 'Test Whiskey',
          description: 'Test whiskey for variant deduction',
          price: 10.00,
          categoryId: categoryId, // Use the same category as the material
          isBeverage: true,
          unit: 'ml',
          availableQuantity: 10,
          costPerUnit: 0.05,
          isActive: true
        }, { transaction });
        
        // Create variants separately using the Variants model
        console.log('➕ Creating beverage variants');
        await Variants.bulkCreate([
          {
            menuItemId: testMenuItem.id,
            name: 'glass',
            volume: 3,
            unit: 'cl',
            price: 5.00
          },
          {
            menuItemId: testMenuItem.id,
            name: 'double',
            volume: 6,
            unit: 'cl',
            price: 9.00
          },
          {
            menuItemId: testMenuItem.id,
            name: 'bottle',
            volume: 75,
            unit: 'cl',
            price: 60.00
          }
        ], { transaction });
      }
      
      // 3. Test the deduction calculation
      console.log('\n📊 Testing deduction calculations:');
      
      // Test case 1: Single glass (3cl) from a 750ml bottle
      const variant1 = { name: 'glass', volume: 3, unit: 'cl' };
      const deduction1 = calculateDeductionAmount(
        variant1.volume, 
        variant1.unit, 
        750, // bottle size in ml
        'ml', // bottle unit
        1 // quantity ordered
      );
      
      console.log(`\n🥃 Test Case 1: Single glass (${variant1.volume}${variant1.unit})`);
      logVariantDeduction(
        'Test Whiskey',
        variant1.name,
        variant1.volume,
        variant1.unit,
        750,
        'ml',
        1,
        deduction1
      );
      
      // Test case 2: Double (6cl) from a 750ml bottle
      const variant2 = { name: 'double', volume: 6, unit: 'cl' };
      const deduction2 = calculateDeductionAmount(
        variant2.volume, 
        variant2.unit, 
        750, // bottle size in ml
        'ml', // bottle unit
        1 // quantity ordered
      );
      
      console.log(`\n🥃 Test Case 2: Double (${variant2.volume}${variant2.unit})`);
      logVariantDeduction(
        'Test Whiskey',
        variant2.name,
        variant2.volume,
        variant2.unit,
        750,
        'ml',
        1,
        deduction2
      );
      
      // Test case 3: Multiple glasses (3 glasses of 3cl each)
      const variant3 = { name: 'glass', volume: 3, unit: 'cl' };
      const quantity3 = 3;
      const deduction3 = calculateDeductionAmount(
        variant3.volume, 
        variant3.unit, 
        750, // bottle size in ml
        'ml', // bottle unit
        quantity3 // quantity ordered
      );
      
      console.log(`\n🥃 Test Case 3: Multiple glasses (${quantity3} x ${variant3.volume}${variant3.unit})`);
      logVariantDeduction(
        'Test Whiskey',
        variant3.name,
        variant3.volume,
        variant3.unit,
        750,
        'ml',
        quantity3,
        deduction3
      );
      
      // Test the actual deduction function with a variant
      console.log('\n🧪 Testing actual deduction function with variant');
      
      // Get initial stock information
      const initialStockEntries = await StockEntry.findAll({
        where: { materialId: testMaterial.id },
        transaction
      });
      
      const initialStock = initialStockEntries.reduce((total, entry) => {
        return total + Number(entry.purchasedIndividualQuantity || 0);
      }, 0);
      
      console.log(`📦 Initial stock: ${initialStock} bottles`);

      // Create a mock order item with a variant
      const mockOrderItem = {
        menuItemId: testMenuItem.id,
        quantity: 2,
        selectedVariant: { name: 'glass', volume: 3, unit: 'cl' }
      };

      // Deduct stock using the actual function
      await deductIngredientStock(mockOrderItem.menuItemId, mockOrderItem.quantity, transaction, mockOrderItem.selectedVariant);

      // Check the updated stock
      const updatedStockEntries = await StockEntry.findAll({
        where: { materialId: testMaterial.id },
        transaction
      });
      
      const updatedStock = updatedStockEntries.reduce((total, entry) => {
        return total + Number(entry.purchasedIndividualQuantity || 0);
      }, 0);
      
      console.log(`📦 Updated stock: ${updatedStock} bottles`);
      console.log(`📊 Stock change: ${initialStock - updatedStock} bottles`);
      
      // Calculate expected deduction: 2 glasses of 3cl each = 6cl total
      // 6cl = 60ml, which is 8% of a 750ml bottle
      // 2 glasses should deduct 0.08 bottles (8% of a bottle)
      const expectedDeduction = 2 * (30/750);
      console.log(`🔢 Expected deduction: ${expectedDeduction.toFixed(4)} bottles (${2 * 3}cl = ${2 * 30}ml from ${testMaterial.packageQuantity}ml bottles)`);
      
      // Rollback transaction to avoid affecting real data
      await transaction.rollback();
      console.log('✅ Test completed and transaction rolled back');
      
    } catch (error) {
      await transaction.rollback();
      console.error('❌ Test failed:', error);
      throw error;
    }
    
  } catch (error) {
    console.error('❌ Test setup failed:', error);
  }
}

// Run the test
testVariantDeduction().then(() => {
  console.log('🏁 Test script completed');
  process.exit(0);
}).catch(error => {
  console.error('💥 Test script failed:', error);
  process.exit(1);
});

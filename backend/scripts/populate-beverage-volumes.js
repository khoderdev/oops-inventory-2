/**
 * Data population script to update existing beverage materials with volume information
 * Run with: node scripts/populate-beverage-volumes.js
 */

import sequelize from '../config/database.js';
import { Material, Category } from '../models/index.js';

const beverageVolumeData = [
  // Common beverage containers and their typical volumes
  { namePattern: 'coca cola', volumePerUnit: 330, volumeUnit: 'ml' },
  { namePattern: 'pepsi', volumePerUnit: 330, volumeUnit: 'ml' },
  { namePattern: 'sprite', volumePerUnit: 330, volumeUnit: 'ml' },
  { namePattern: 'fanta', volumePerUnit: 330, volumeUnit: 'ml' },
  { namePattern: 'coke', volumePerUnit: 330, volumeUnit: 'ml' },
  { namePattern: 'diet coke', volumePerUnit: 330, volumeUnit: 'ml' },
  { namePattern: 'water', volumePerUnit: 500, volumeUnit: 'ml' },
  { namePattern: 'mineral water', volumePerUnit: 500, volumeUnit: 'ml' },
  { namePattern: 'sparkling water', volumePerUnit: 500, volumeUnit: 'ml' },
  { namePattern: 'juice', volumePerUnit: 250, volumeUnit: 'ml' },
  { namePattern: 'orange juice', volumePerUnit: 250, volumeUnit: 'ml' },
  { namePattern: 'apple juice', volumePerUnit: 250, volumeUnit: 'ml' },
  { namePattern: 'beer', volumePerUnit: 330, volumeUnit: 'ml' },
  { namePattern: 'lager', volumePerUnit: 330, volumeUnit: 'ml' },
  { namePattern: 'wine', volumePerUnit: 750, volumeUnit: 'ml' },
  { namePattern: 'red wine', volumePerUnit: 750, volumeUnit: 'ml' },
  { namePattern: 'white wine', volumePerUnit: 750, volumeUnit: 'ml' },
  { namePattern: 'champagne', volumePerUnit: 750, volumeUnit: 'ml' },
  { namePattern: 'whiskey', volumePerUnit: 700, volumeUnit: 'ml' },
  { namePattern: 'vodka', volumePerUnit: 700, volumeUnit: 'ml' },
  { namePattern: 'rum', volumePerUnit: 700, volumeUnit: 'ml' },
  { namePattern: 'gin', volumePerUnit: 700, volumeUnit: 'ml' },
  { namePattern: 'tequila', volumePerUnit: 700, volumeUnit: 'ml' },
  { namePattern: 'brandy', volumePerUnit: 700, volumeUnit: 'ml' },
  { namePattern: 'cognac', volumePerUnit: 700, volumeUnit: 'ml' },
  { namePattern: 'liqueur', volumePerUnit: 500, volumeUnit: 'ml' },
  { namePattern: 'coffee', volumePerUnit: 250, volumeUnit: 'ml' },
  { namePattern: 'tea', volumePerUnit: 250, volumeUnit: 'ml' },
  { namePattern: 'energy drink', volumePerUnit: 250, volumeUnit: 'ml' },
  { namePattern: 'red bull', volumePerUnit: 250, volumeUnit: 'ml' },
  { namePattern: 'monster', volumePerUnit: 500, volumeUnit: 'ml' },
  { namePattern: 'smoothie', volumePerUnit: 350, volumeUnit: 'ml' },
  { namePattern: 'milkshake', volumePerUnit: 400, volumeUnit: 'ml' },
  { namePattern: 'iced tea', volumePerUnit: 500, volumeUnit: 'ml' },
  { namePattern: 'lemonade', volumePerUnit: 330, volumeUnit: 'ml' },
  { namePattern: 'soda', volumePerUnit: 330, volumeUnit: 'ml' },
  { namePattern: 'soft drink', volumePerUnit: 330, volumeUnit: 'ml' }
];

async function populateBeverageVolumes() {
  console.log('🚀 Starting beverage volume data population...\n');
  
  try {
    // Get all materials that might be beverages
    const allMaterials = await Material.findAll({
      include: [{
        model: Category,
        as: 'category',
        required: false
      }]
    });

    console.log(`📊 Found ${allMaterials.length} total materials to analyze\n`);

    let updatedCount = 0;
    let skippedCount = 0;
    const updateLog = [];

    for (const material of allMaterials) {
      const materialName = material.name.toLowerCase();
      const categoryName = material.category?.name?.toLowerCase() || '';
      
      // Check if this material already has volume data
      if (material.volumePerUnit && material.volumeUnit) {
        console.log(`⏭️  Skipping ${material.name} - already has volume data (${material.volumePerUnit}${material.volumeUnit})`);
        skippedCount++;
        continue;
      }

      // Check if this is likely a beverage based on category or name
      const isBeverageCategory = categoryName.includes('beverage') || 
                                categoryName.includes('drink') || 
                                categoryName.includes('liquid') ||
                                categoryName.includes('alcohol') ||
                                categoryName.includes('wine') ||
                                categoryName.includes('beer');

      // Find matching volume data
      const volumeMatch = beverageVolumeData.find(data => 
        materialName.includes(data.namePattern)
      );

      if (volumeMatch || isBeverageCategory) {
        let volumePerUnit, volumeUnit;
        
        if (volumeMatch) {
          volumePerUnit = volumeMatch.volumePerUnit;
          volumeUnit = volumeMatch.volumeUnit;
          console.log(`🎯 Pattern match for "${material.name}": ${volumePerUnit}${volumeUnit}`);
        } else if (isBeverageCategory) {
          // Default volume for beverages without specific pattern match
          volumePerUnit = 330; // Standard can/bottle size
          volumeUnit = 'ml';
          console.log(`📂 Category-based match for "${material.name}": ${volumePerUnit}${volumeUnit} (default)`);
        }

        try {
          await material.update({
            volumePerUnit,
            volumeUnit
          });

          updatedCount++;
          updateLog.push({
            id: material.id,
            name: material.name,
            category: material.category?.name || 'No category',
            volumePerUnit,
            volumeUnit,
            matchType: volumeMatch ? 'pattern' : 'category'
          });

          console.log(`✅ Updated ${material.name}: ${volumePerUnit}${volumeUnit}`);
        } catch (updateError) {
          console.error(`❌ Failed to update ${material.name}:`, updateError.message);
        }
      } else {
        console.log(`⚪ Skipping ${material.name} - not identified as beverage`);
        skippedCount++;
      }
    }

    console.log('\n' + '='.repeat(60));
    console.log('📈 BEVERAGE VOLUME POPULATION SUMMARY');
    console.log('='.repeat(60));
    console.log(`✅ Materials updated: ${updatedCount}`);
    console.log(`⏭️  Materials skipped: ${skippedCount}`);
    console.log(`📊 Total materials processed: ${allMaterials.length}`);

    if (updateLog.length > 0) {
      console.log('\n📋 UPDATED MATERIALS:');
      console.log('-'.repeat(80));
      console.log('ID'.padEnd(5) + 'Name'.padEnd(25) + 'Category'.padEnd(20) + 'Volume'.padEnd(15) + 'Match Type');
      console.log('-'.repeat(80));
      
      updateLog.forEach(item => {
        console.log(
          String(item.id).padEnd(5) + 
          item.name.substring(0, 24).padEnd(25) + 
          item.category.substring(0, 19).padEnd(20) + 
          `${item.volumePerUnit}${item.volumeUnit}`.padEnd(15) + 
          item.matchType
        );
      });
    }

    console.log('\n🎉 Beverage volume population completed successfully!');
    
    // Verify the updates
    const beverageMaterials = await Material.findAll({
      where: {
        volumePerUnit: { [sequelize.Sequelize.Op.ne]: null }
      },
      include: [{
        model: Category,
        as: 'category',
        required: false
      }]
    });

    console.log(`\n🔍 Verification: ${beverageMaterials.length} materials now have volume data`);

  } catch (error) {
    console.error('❌ Error during beverage volume population:', error);
    throw error;
  }
}

// Run the population script
if (import.meta.url === `file://${process.argv[1]}`) {
  populateBeverageVolumes()
    .then(() => {
      console.log('\n✨ Script completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 Script failed:', error);
      process.exit(1);
    });
}

export { populateBeverageVolumes };

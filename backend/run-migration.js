import sequelize from './config/database.js';

async function runMigration() {
  try {
    console.log('🔄 Starting migration: Add furnitureItemId to Orders table...');
    
    // Add furnitureItemId column to Orders table
    await sequelize.getQueryInterface().addColumn('Orders', 'furnitureItemId', {
      type: sequelize.Sequelize.INTEGER,
      allowNull: true,
      references: {
        model: 'FurnitureItems',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
      comment: 'Reference to furniture item (table) from floor plan'
    });

    console.log('✅ Added furnitureItemId column to Orders table');

    // Add index for better query performance
    await sequelize.getQueryInterface().addIndex('Orders', ['furnitureItemId'], {
      name: 'orders_furniture_item_id_index'
    });

    console.log('✅ Added index for furnitureItemId column');
    console.log('🎉 Migration completed successfully!');
    
  } catch (error) {
    if (error.message.includes('already exists') || error.message.includes('duplicate')) {
      console.log('ℹ️ Column furnitureItemId already exists, skipping migration');
    } else {
      console.error('❌ Migration failed:', error.message);
      throw error;
    }
  } finally {
    await sequelize.close();
    process.exit(0);
  }
}

runMigration();

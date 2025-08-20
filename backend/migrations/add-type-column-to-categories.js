import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

/**
 * Migration to add 'type' column to categories table
 * This fixes the "column material->category.type does not exist" error
 */
export const up = async () => {
  const queryInterface = sequelize.getQueryInterface();
  
  try {
    console.log('🔄 Adding type column to categories table...');
    
    // Add the type column
    await queryInterface.addColumn('categories', 'type', {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: 'menu',
      validate: {
        isIn: {
          args: [['menu', 'materials', 'beverages']],
          msg: "Category type must be one of: menu, materials, beverages"
        }
      }
    });
    
    // Add index for the type column
    await queryInterface.addIndex('categories', ['type'], {
      name: 'categories_type_idx'
    });
    
    console.log('✅ Type column added successfully');
    
    // Update existing categories with appropriate types based on their values
    console.log('🔄 Updating existing categories with appropriate types...');
    
    // Material categories
    const materialCategories = [
      'vegetables', 'fruits', 'dairy', 'meat', 'seafood', 'grains', 'spices',
      'condiments', 'oils', 'beverages', 'snacks', 'frozen', 'canned', 'fresh'
    ];
    
    // Beverage categories  
    const beverageCategories = [
      'alcoholic', 'non-alcoholic', 'hot-drinks', 'cold-drinks', 'juices',
      'sodas', 'water', 'energy-drinks', 'cocktails', 'wine', 'beer', 'spirits'
    ];
    
    // Update material categories
    for (const category of materialCategories) {
      await sequelize.query(
        `UPDATE categories SET type = 'materials' WHERE value = :category`,
        { replacements: { category } }
      );
    }
    
    // Update beverage categories
    for (const category of beverageCategories) {
      await sequelize.query(
        `UPDATE categories SET type = 'beverages' WHERE value = :category`,
        { replacements: { category } }
      );
    }
    
    // All other categories remain as 'menu' (default)
    console.log('✅ Category types updated successfully');
    
  } catch (error) {
    console.error('❌ Error in migration:', error);
    throw error;
  }
};

export const down = async () => {
  const queryInterface = sequelize.getQueryInterface();
  
  try {
    console.log('🔄 Removing type column from categories table...');
    
    // Remove index first
    await queryInterface.removeIndex('categories', 'categories_type_idx');
    
    // Remove the column
    await queryInterface.removeColumn('categories', 'type');
    
    console.log('✅ Type column removed successfully');
    
  } catch (error) {
    console.error('❌ Error in rollback:', error);
    throw error;
  }
};

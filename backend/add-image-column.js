import sequelize from './config/database.js';
import { DataTypes } from 'sequelize';

async function addImageColumn() {
  try {
    console.log('🔄 Adding image column to menuItems table...');
    
    await sequelize.getQueryInterface().addColumn('menuItems', 'image', {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Base64 encoded image or image URL for the menu item'
    });
    
    console.log('✅ Successfully added image column to menuItems table');
  } catch (error) {
    if (error.message.includes('already exists') || error.message.includes('duplicate column')) {
      console.log('ℹ️ Image column already exists in menuItems table');
    } else {
      console.error('❌ Error adding image column:', error.message);
      throw error;
    }
  } finally {
    await sequelize.close();
    console.log('🔌 Database connection closed');
  }
}

addImageColumn().catch(console.error);

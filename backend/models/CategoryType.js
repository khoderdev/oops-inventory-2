import { DataTypes, Op } from "sequelize";
import sequelize from "../config/database.js";

// Define default category types as an enum
export const DEFAULT_CATEGORY_TYPES = {
  MATERIALS: 'materials',
  MENU_ITEMS: 'menu_items',
  BEVERAGES: 'beverages'
};

const CategoryType = sequelize.define(
  "CategoryType",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    type: {
      type: DataTypes.STRING(50),
      allowNull: false,
      validate: {
        notEmpty: { msg: "Type cannot be empty" },
        len: { args: [1, 50], msg: "Type must be between 1 and 50 characters" }
      }
    }
  },
  {
    tableName: "category_types",
    timestamps: true,
    indexes: [
      {
        unique: true,
        fields: ["type"]
      }
    ]
  }
);

// Function to initialize default category types
const initializeDefaultCategoryTypes = async () => {
  try {
    console.log('Checking for default category types...');
    
    // Get all default type values as an array
    const defaultTypes = Object.values(DEFAULT_CATEGORY_TYPES);
    
    // Find existing types in the database
    const existingTypes = await CategoryType.findAll({
      where: {
        type: {
          [Op.in]: defaultTypes
        }
      }
    });
    
    // Get existing type names for comparison
    const existingTypeNames = existingTypes.map(type => type.type);
    
    // Filter out types that need to be created
    const typesToCreate = defaultTypes.filter(type => !existingTypeNames.includes(type));
    
    if (typesToCreate.length > 0) {
      console.log(`Creating ${typesToCreate.length} missing category types: ${typesToCreate.join(', ')}`);
      
      // Create missing types
      await CategoryType.bulkCreate(
        typesToCreate.map(type => ({ type }))
      );
      
      console.log('Default category types created successfully');
    } else {
      console.log('All default category types already exist');
    }
  } catch (error) {
    console.error('Error initializing default category types:', error);
  }
};

// Initialize default types when this module is imported
// Using setTimeout to ensure the database connection is established first
setTimeout(() => {
  initializeDefaultCategoryTypes();
}, 1000);

export default CategoryType;

// import { DataTypes, Op } from "sequelize";
// import sequelize from "../config/database.js";

// // Define default category types as an enum
// export const DEFAULT_CATEGORY_TYPES = {
//   MATERIALS: 'materials',
//   MENU_ITEMS: 'menu_items',
//   BEVERAGES: 'beverages'
// };

// const CategoryType = sequelize.define(
//   "CategoryType",
//   {
//     id: {
//       type: DataTypes.INTEGER,
//       primaryKey: true,
//       autoIncrement: true
//     },
//     type: {
//       type: DataTypes.STRING(50),
//       allowNull: false,
//       validate: {
//         notEmpty: { msg: "Type cannot be empty" },
//         len: { args: [1, 50], msg: "Type must be between 1 and 50 characters" }
//       }
//     }
//   },
//   {
//     tableName: "category_types",
//     timestamps: true,
//     indexes: [
//       {
//         unique: true,
//         fields: ["type"]
//       }
//     ]
//   }
// );

// // Function to initialize default category types
// const initializeDefaultCategoryTypes = async () => {
//   try {
//     console.log('Checking for default category types...');

//     // Get all default type values as an array
//     const defaultTypes = Object.values(DEFAULT_CATEGORY_TYPES);

//     // Find existing types in the database
//     const existingTypes = await CategoryType.findAll({
//       where: {
//         type: {
//           [Op.in]: defaultTypes
//         }
//       }
//     });

//     // Get existing type names for comparison
//     const existingTypeNames = existingTypes.map(type => type.type);

//     // Filter out types that need to be created
//     const typesToCreate = defaultTypes.filter(type => !existingTypeNames.includes(type));

//     if (typesToCreate.length > 0) {
//       console.log(`Creating ${typesToCreate.length} missing category types: ${typesToCreate.join(', ')}`);

//       // Create missing types
//       await CategoryType.bulkCreate(
//         typesToCreate.map(type => ({ type }))
//       );

//       console.log('Default category types created successfully');
//     } else {
//       console.log('All default category types already exist');
//     }
//   } catch (error) {
//     console.error('Error initializing default category types:', error);
//   }
// };

// // Initialize default types when this module is imported
// // Using setTimeout to ensure the database connection is established first
// setTimeout(() => {
//   initializeDefaultCategoryTypes();
// }, 1000);

// export default CategoryType;
import { DataTypes, Op } from "sequelize";
import sequelize from "../config/database.js";

// Define default category types as an enum
export const DEFAULT_CATEGORY_TYPES = {
  MATERIALS: "materials",
  MENU_ITEMS: "menu_items",
  BEVERAGES: "beverages"
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

// Function to initialize default category types with graceful error handling
const initializeDefaultCategoryTypes = async () => {
  let retries = 3;
  let delay = 2000; // 2 seconds between retries

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      console.log(`🏷️ Checking for default category types (attempt ${attempt}/${retries})...`);

      // First ensure the table exists
      await CategoryType.sync({ force: false });

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
        console.log(`📋 Creating ${typesToCreate.length} missing category types: ${typesToCreate.join(", ")}`);

        // Create missing types
        await CategoryType.bulkCreate(typesToCreate.map(type => ({ type })));

        console.log("✅ Default category types created successfully");
      } else {
        console.log("✅ All default category types already exist");
      }

      return true; // Success
    } catch (error) {
      console.error(`❌ Error initializing default category types (attempt ${attempt}):`, error.message);

      // Handle specific database errors
      if (error.name === "SequelizeDatabaseError") {
        if (error.parent?.code === "42P01") {
          // Table doesn't exist
          console.log("📊 Category types table does not exist yet, will retry...");
        } else if (error.parent?.code === "23505") {
          // Unique constraint violation
          console.log("⚠️ Duplicate category types detected, continuing...");
          return true; // This is non-critical
        }
      }

      // If this was the last attempt, throw the error
      if (attempt === retries) {
        console.error("🚨 Failed to initialize category types after all retries");
        throw error;
      }

      // Wait before retrying
      console.log(`⏳ Retrying in ${delay / 1000} seconds...`);
      await new Promise(resolve => setTimeout(resolve, delay));

      // Increase delay for next retry (exponential backoff)
      delay *= 1.5;
    }
  }
};

// Export the initialization function for controlled execution
export const initializeCategoryTypes = async () => {
  try {
    return await initializeDefaultCategoryTypes();
  } catch (error) {
    console.warn("⚠️ Category type initialization failed, but application will continue:", error.message);
    return false;
  }
};

// Alternative: Safe initialization that won't crash the app
export const safeInitializeCategoryTypes = async () => {
  try {
    // Wait a bit to ensure database connection is ready
    await new Promise(resolve => setTimeout(resolve, 3000));
    return await initializeDefaultCategoryTypes();
  } catch (error) {
    // This is a non-critical initialization, so we don't throw
    console.warn("⚠️ Category type initialization failed (non-critical):", error.message);
    return false;
  }
};

// Initialize default types when this module is imported, but with better timing
// Using a longer timeout and checking if database is connected first
setTimeout(async () => {
  try {
    // Check if database is connected before attempting initialization
    await sequelize.authenticate();
    console.log("🔗 Database connected, initializing category types...");
    await safeInitializeCategoryTypes();
  } catch (dbError) {
    console.log("💤 Database not ready yet, skipping category type initialization");
  }
}, 3000); // Wait 3 seconds to ensure database connection is established

export default CategoryType;

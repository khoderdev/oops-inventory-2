import sequelize from "../config/database.js";
import VariantIngredient from "../models/VariantIngredient.js";

const createVariantIngredientsTable = async () => {
  try {
    console.log('Connecting to database...');
    await sequelize.authenticate();
    console.log('Database connection established.');

    console.log('Creating variantIngredients table...');
    await VariantIngredient.sync({ force: false });
    console.log('variantIngredients table created successfully!');

    console.log('Closing database connection...');
    await sequelize.close();
    console.log('Migration completed successfully.');
  } catch (error) {
    console.error('Error during migration:', error);
    process.exit(1);
  }
};

createVariantIngredientsTable();

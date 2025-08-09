import { Table } from "../models/index.js";
import sequelize from "../config/database.js";

export const seedTables = async () => {
  try {
    console.log("🌱 Starting table seeding process...");
    
    // Use the new createInitialTables function from the Table model
    // This function includes duplicate checking and better error handling
    const result = await Table.createInitialTables();
    
    console.log(`✅ Table seeding completed: ${result.created} created, ${result.existing} existing`);
    return result;
    
  } catch (error) {
    console.error("❌ Error seeding tables:", error);
    throw error;
  }
};

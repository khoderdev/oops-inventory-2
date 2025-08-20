import { Table } from "../models/index.js";

export const seedTables = async () => {
  try {
    console.log("🌱 Starting table seeding process...");
    const result = await Table.createInitialTables();
    console.log(`✅ Table seeding completed: ${result.created} created, ${result.existing} existing`);
    return result;
  } catch (error) {
    console.error("❌ Error seeding tables:", error);
    throw error;
  }
};

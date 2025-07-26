import { Table } from "../models/index.js";
import sequelize from "../config/database.js";

export const seedTables = async () => {
  try {
    // Check if tables already exist
    const existingTables = await Table.count();
    if (existingTables > 0) {
      console.log("Tables already exist, skipping seed");
      return;
    }

    // Force sync the Table model to ensure proper schema
    console.log("🔄 Syncing Tables schema...");
    await Table.sync({ force: true });
    
    const tables = [
      { number: 1, seats: 2, status: "available", position: { x: 20, y: 20 }, shape: "round", section: "main" },
      { number: 2, seats: 4, status: "available", position: { x: 40, y: 20 }, shape: "square", section: "main" },
      { number: 3, seats: 6, status: "available", position: { x: 60, y: 20 }, shape: "rectangle", section: "main" },
      { number: 4, seats: 2, status: "available", position: { x: 80, y: 20 }, shape: "round", section: "main" },
      { number: 5, seats: 4, status: "available", position: { x: 20, y: 50 }, shape: "square", section: "main" },
      { number: 6, seats: 8, status: "available", position: { x: 40, y: 50 }, shape: "rectangle", section: "main" },
      { number: 7, seats: 2, status: "available", position: { x: 60, y: 50 }, shape: "round", section: "main" },
      { number: 8, seats: 4, status: "available", position: { x: 80, y: 50 }, shape: "square", section: "main" },
      { number: 9, seats: 6, status: "available", position: { x: 20, y: 80 }, shape: "rectangle", section: "patio" },
      { number: 10, seats: 4, status: "available", position: { x: 40, y: 80 }, shape: "square", section: "patio" },
      { number: 11, seats: 2, status: "available", position: { x: 60, y: 80 }, shape: "round", section: "patio" },
      { number: 12, seats: 8, status: "available", position: { x: 80, y: 80 }, shape: "rectangle", section: "patio" }
    ];

    console.log("📝 Creating tables...");
    await Table.bulkCreate(tables);
    console.log("✅ Tables seeded successfully");
  } catch (error) {
    console.error("❌ Error seeding tables:", error);
    
    // If bulkCreate fails, try individual creation
    console.log("🔄 Attempting individual table creation...");
    try {
      const tables = [
        { number: 1, seats: 2, status: "available", position: { x: 20, y: 20 }, shape: "round", section: "main" },
        { number: 2, seats: 4, status: "available", position: { x: 40, y: 20 }, shape: "square", section: "main" },
        { number: 3, seats: 6, status: "available", position: { x: 60, y: 20 }, shape: "rectangle", section: "main" },
        { number: 4, seats: 2, status: "available", position: { x: 80, y: 20 }, shape: "round", section: "main" },
        { number: 5, seats: 4, status: "available", position: { x: 20, y: 50 }, shape: "square", section: "main" },
        { number: 6, seats: 8, status: "available", position: { x: 40, y: 50 }, shape: "rectangle", section: "main" },
        { number: 7, seats: 2, status: "available", position: { x: 60, y: 50 }, shape: "round", section: "main" },
        { number: 8, seats: 4, status: "available", position: { x: 80, y: 50 }, shape: "square", section: "main" },
        { number: 9, seats: 6, status: "available", position: { x: 20, y: 80 }, shape: "rectangle", section: "patio" },
        { number: 10, seats: 4, status: "available", position: { x: 40, y: 80 }, shape: "square", section: "patio" },
        { number: 11, seats: 2, status: "available", position: { x: 60, y: 80 }, shape: "round", section: "patio" },
        { number: 12, seats: 8, status: "available", position: { x: 80, y: 80 }, shape: "rectangle", section: "patio" }
      ];
      
      for (const tableData of tables) {
        await Table.create(tableData);
      }
      console.log("✅ Tables created individually");
    } catch (individualError) {
      console.error("❌ Individual table creation also failed:", individualError);
      throw individualError;
    }
  }
};

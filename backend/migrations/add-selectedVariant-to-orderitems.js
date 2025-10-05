import sequelize from "../config/database.js";
import { QueryTypes } from "sequelize";

/**
 * Migration: Add selectedVariant column to OrderItems table
 * This column stores variant information for beverage items
 */
async function addSelectedVariantColumn() {
  try {
    console.log("🔄 Starting migration: Add selectedVariant to OrderItems");

    // Check if column already exists
    const [columns] = await sequelize.query(
      `SELECT column_name 
       FROM information_schema.columns 
       WHERE table_name = 'OrderItems' 
       AND column_name = 'selectedVariant';`,
      { type: QueryTypes.SELECT }
    );

    if (columns) {
      console.log("✅ Column 'selectedVariant' already exists in OrderItems table");
      return;
    }

    // Add the column
    await sequelize.query(
      `ALTER TABLE "OrderItems" 
       ADD COLUMN "selectedVariant" JSONB;`,
      { type: QueryTypes.RAW }
    );

    // Add comment to column
    await sequelize.query(
      `COMMENT ON COLUMN "OrderItems"."selectedVariant" 
       IS 'Stores variant information like {name, volume, unit, price} for beverage variants';`,
      { type: QueryTypes.RAW }
    );

    console.log("✅ Successfully added selectedVariant column to OrderItems table");
    console.log("📝 Column type: JSONB (allows storing variant objects)");

  } catch (error) {
    console.error("❌ Migration failed:", error);
    throw error;
  }
}

// Run migration
addSelectedVariantColumn()
  .then(() => {
    console.log("✅ Migration completed successfully");
    process.exit(0);
  })
  .catch(error => {
    console.error("❌ Migration failed:", error);
    process.exit(1);
  });

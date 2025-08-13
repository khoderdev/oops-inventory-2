import sequelize from "../config/database.js";
import { QueryTypes } from "sequelize";

/**
 * Migration script to update menuItems table:
 * 1. Add categoryId column (foreign key to categories)
 * 2. Remove old category column (string)
 * 3. Handle existing data migration if needed
 */

async function migrateMenuItemsToCategories() {
  console.log("🔄 Starting menuItems table migration to categoryId foreign key...");

  try {
    // Check if categoryId column already exists
    const [categoryIdExists] = await sequelize.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'menuItems' 
      AND column_name = 'categoryId'
    `, { type: QueryTypes.SELECT });

    if (!categoryIdExists) {
      console.log("➕ Adding categoryId column...");
      await sequelize.query(`
        ALTER TABLE "menuItems" 
        ADD COLUMN "categoryId" INTEGER 
        REFERENCES categories(id) 
        ON UPDATE CASCADE 
        ON DELETE SET NULL
      `);
      console.log("✅ categoryId column added");
    } else {
      console.log("⏭️  categoryId column already exists");
    }

    // Check if old category column exists
    const [categoryExists] = await sequelize.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'menuItems' 
      AND column_name = 'category'
    `, { type: QueryTypes.SELECT });

    if (categoryExists) {
      console.log("🔄 Migrating existing category data...");
      
      // Get all menu items with category values
      const menuItemsWithCategories = await sequelize.query(`
        SELECT id, category 
        FROM "menuItems" 
        WHERE category IS NOT NULL
      `, { type: QueryTypes.SELECT });

      console.log(`📋 Found ${menuItemsWithCategories.length} menu items with category data`);

      // Update each menu item with corresponding categoryId
      for (const item of menuItemsWithCategories) {
        try {
          const [categoryRecord] = await sequelize.query(`
            SELECT id 
            FROM categories 
            WHERE value = :categoryValue 
            AND type = 'menu_items'
          `, { 
            replacements: { categoryValue: item.category },
            type: QueryTypes.SELECT 
          });

          if (categoryRecord) {
            await sequelize.query(`
              UPDATE "menuItems" 
              SET "categoryId" = :categoryId 
              WHERE id = :menuItemId
            `, {
              replacements: { 
                categoryId: categoryRecord.id, 
                menuItemId: item.id 
              }
            });
            console.log(`✅ Updated menu item ${item.id}: ${item.category} → categoryId ${categoryRecord.id}`);
          } else {
            console.warn(`⚠️  No category found for value '${item.category}' - setting categoryId to NULL`);
            await sequelize.query(`
              UPDATE "menuItems" 
              SET "categoryId" = NULL 
              WHERE id = :menuItemId
            `, {
              replacements: { menuItemId: item.id }
            });
          }
        } catch (error) {
          console.error(`❌ Error updating menu item ${item.id}:`, error.message);
        }
      }

      console.log("🗑️  Dropping old category column...");
      await sequelize.query(`ALTER TABLE "menuItems" DROP COLUMN category`);
      console.log("✅ Old category column removed");
    } else {
      console.log("⏭️  Old category column doesn't exist - migration already complete");
    }

    console.log("🎉 menuItems migration completed successfully!");
    return true;

  } catch (error) {
    console.error("❌ Migration failed:", error);
    throw error;
  }
}

// Run migration if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  migrateMenuItemsToCategories()
    .then(() => {
      console.log("✨ Migration completed!");
      process.exit(0);
    })
    .catch((error) => {
      console.error("💥 Migration failed:", error);
      process.exit(1);
    });
}

export { migrateMenuItemsToCategories };

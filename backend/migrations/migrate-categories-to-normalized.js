/**
 * Migration script to convert existing categories table to normalized structure
 * 
 * This script:
 * 1. Creates the new category_types table
 * 2. Migrates existing category data to normalized structure
 * 3. Updates categories table structure (removes type field, adds unique constraints)
 * 4. Preserves all existing data and relationships
 */

import sequelize from "../config/database.js";
import { QueryTypes } from "sequelize";

const migrateCategoriestoNormalized = async () => {
  const transaction = await sequelize.transaction();
  
  try {
    console.log("🚀 Starting categories normalization migration...");
    
    // Step 1: Create category_types table
    console.log("📝 Creating category_types table...");
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS category_types (
        id SERIAL PRIMARY KEY,
        "categoryId" INTEGER NOT NULL REFERENCES categories(id) ON DELETE CASCADE ON UPDATE CASCADE,
        type VARCHAR(255) NOT NULL CHECK (type IN ('materials', 'menu_items', 'beverages')),
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
        "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
        UNIQUE("categoryId", type)
      );
    `, { transaction });
    
    // Step 2: Create indexes on category_types
    console.log("🔍 Creating indexes on category_types...");
    await sequelize.query(`
      CREATE INDEX IF NOT EXISTS "category_types_categoryId_idx" ON category_types("categoryId");
    `, { transaction });
    
    await sequelize.query(`
      CREATE INDEX IF NOT EXISTS "category_types_type_idx" ON category_types(type);
    `, { transaction });
    
    // Step 3: Migrate existing data
    console.log("📊 Migrating existing category data...");
    
    // Get all existing categories with their types
    const existingCategories = await sequelize.query(`
      SELECT id, name, value, type, description, "isActive", "sortOrder", "createdAt", "updatedAt"
      FROM categories
      ORDER BY id;
    `, { 
      type: QueryTypes.SELECT,
      transaction 
    });
    
    console.log(`Found ${existingCategories.length} existing categories to migrate`);
    
    // Group categories by name and value to identify duplicates
    const categoryGroups = new Map();
    
    for (const category of existingCategories) {
      const key = `${category.name}|${category.value}`;
      if (!categoryGroups.has(key)) {
        categoryGroups.set(key, {
          category: {
            name: category.name,
            value: category.value,
            description: category.description,
            isActive: category.isActive,
            sortOrder: category.sortOrder,
            createdAt: category.createdAt,
            updatedAt: category.updatedAt
          },
          types: new Set(),
          oldIds: []
        });
      }
      
      const group = categoryGroups.get(key);
      group.types.add(category.type);
      group.oldIds.push(category.id);
    }
    
    console.log(`Grouped into ${categoryGroups.size} unique categories`);
    
    // Step 4: Clear existing categories table
    console.log("🗑️ Backing up and clearing existing categories...");
    
    // Create backup table
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS categories_backup AS 
      SELECT * FROM categories;
    `, { transaction });
    
    // Clear categories table
    await sequelize.query(`DELETE FROM categories;`, { transaction });
    
    // Reset sequence
    await sequelize.query(`
      SELECT setval('categories_id_seq', 1, false);
    `, { transaction });
    
    // Step 5: Remove type column and add unique constraints
    console.log("🔧 Updating categories table structure...");
    
    // Drop old indexes
    await sequelize.query(`
      DROP INDEX IF EXISTS "categories_value_type_key";
    `, { transaction });
    
    await sequelize.query(`
      DROP INDEX IF EXISTS "categories_type_idx";
    `, { transaction });
    
    // Remove type column
    await sequelize.query(`
      ALTER TABLE categories DROP COLUMN IF EXISTS type;
    `, { transaction });
    
    // Add unique constraints
    await sequelize.query(`
      ALTER TABLE categories ADD CONSTRAINT "categories_name_unique" UNIQUE (name);
    `, { transaction });
    
    await sequelize.query(`
      ALTER TABLE categories ADD CONSTRAINT "categories_value_unique" UNIQUE (value);
    `, { transaction });
    
    // Step 6: Insert normalized categories and create category types
    console.log("📥 Inserting normalized categories...");
    
    const categoryIdMapping = new Map(); // old IDs -> new ID
    
    for (const [key, group] of categoryGroups) {
      // Insert category
      const [newCategory] = await sequelize.query(`
        INSERT INTO categories (name, value, description, "isActive", "sortOrder", "createdAt", "updatedAt")
        VALUES (:name, :value, :description, :isActive, :sortOrder, :createdAt, :updatedAt)
        RETURNING id;
      `, {
        replacements: {
          name: group.category.name,
          value: group.category.value,
          description: group.category.description,
          isActive: group.category.isActive,
          sortOrder: group.category.sortOrder,
          createdAt: group.category.createdAt,
          updatedAt: group.category.updatedAt
        },
        type: QueryTypes.SELECT,
        transaction
      });
      
      const newCategoryId = newCategory.id;
      
      // Map all old IDs to new ID
      for (const oldId of group.oldIds) {
        categoryIdMapping.set(oldId, newCategoryId);
      }
      
      // Insert category types
      for (const type of group.types) {
        await sequelize.query(`
          INSERT INTO category_types ("categoryId", type, "createdAt", "updatedAt")
          VALUES (:categoryId, :type, NOW(), NOW());
        `, {
          replacements: {
            categoryId: newCategoryId,
            type: type
          },
          transaction
        });
      }
      
      console.log(`✅ Created category "${group.category.name}" (${group.category.value}) with types: ${Array.from(group.types).join(', ')}`);
    }
    
    // Step 7: Update foreign key references
    console.log("🔗 Updating foreign key references...");
    
    // Update materials table
    for (const [oldId, newId] of categoryIdMapping) {
      await sequelize.query(`
        UPDATE materials SET "categoryId" = :newId WHERE "categoryId" = :oldId;
      `, {
        replacements: { oldId, newId },
        transaction
      });
    }
    
    // Update menu_items table (if it exists and has categoryId)
    const menuItemsTableExists = await sequelize.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'menu_items'
      );
    `, { 
      type: QueryTypes.SELECT,
      transaction 
    });
    
    if (menuItemsTableExists[0].exists) {
      const menuItemsCategoryColumn = await sequelize.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.columns 
          WHERE table_schema = 'public' 
          AND table_name = 'menu_items'
          AND column_name = 'categoryId'
        );
      `, { 
        type: QueryTypes.SELECT,
        transaction 
      });
      
      if (menuItemsCategoryColumn[0].exists) {
        for (const [oldId, newId] of categoryIdMapping) {
          await sequelize.query(`
            UPDATE menu_items SET "categoryId" = :newId WHERE "categoryId" = :oldId;
          `, {
            replacements: { oldId, newId },
            transaction
          });
        }
      }
    }
    
    await transaction.commit();
    
    console.log("✅ Categories normalization migration completed successfully!");
    console.log(`📊 Migration summary:`);
    console.log(`   - Migrated ${existingCategories.length} original categories`);
    console.log(`   - Created ${categoryGroups.size} normalized categories`);
    console.log(`   - Created ${Array.from(categoryGroups.values()).reduce((sum, group) => sum + group.types.size, 0)} category type relationships`);
    console.log(`   - Updated foreign key references in materials and menu_items tables`);
    console.log(`   - Backup created in categories_backup table`);
    
  } catch (error) {
    await transaction.rollback();
    console.error("❌ Migration failed:", error);
    throw error;
  }
};

// Export for use in other scripts
export default migrateCategoriestoNormalized;

// Run migration if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  migrateCategoriestoNormalized()
    .then(() => {
      console.log("🎉 Migration completed successfully!");
      process.exit(0);
    })
    .catch((error) => {
      console.error("💥 Migration failed:", error);
      process.exit(1);
    });
}

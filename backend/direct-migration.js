import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { readdir } from 'fs/promises';
import { Sequelize, DataTypes } from 'sequelize';
import sequelize from './config/database.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function runMigrations() {
  const transaction = await sequelize.transaction();
  
  try {
    console.log('🔍 Starting database migration...');
    
    // 1. First, find and fix any invalid references
    console.log('🔄 Fixing invalid references...');
    
    // Find all SystemLogs with invalid stockEntryId references
    const invalidStockRefs = await sequelize.query(`
      SELECT id, "stockEntryId" 
      FROM "SystemLogs" 
      WHERE "stockEntryId" IS NOT NULL 
      AND "stockEntryId" NOT IN (SELECT id FROM "stockEntries")
    `, { type: sequelize.QueryTypes.SELECT, transaction });
    
    if (invalidStockRefs.length > 0) {
      console.log(`⚠️ Found ${invalidStockRefs.length} invalid stock entry references. Setting them to NULL...`);
      await sequelize.query(`
        UPDATE "SystemLogs" 
        SET "stockEntryId" = NULL 
        WHERE id IN (:ids)
      `, {
        replacements: { ids: invalidStockRefs.map(r => r.id) },
        transaction
      });
    }
    
    // Find all SystemLogs with invalid materialId references
    const invalidMaterialRefs = await sequelize.query(`
      SELECT id, "materialId" 
      FROM "SystemLogs" 
      WHERE "materialId" IS NOT NULL 
      AND "materialId" NOT IN (SELECT id FROM "materials")
    `, { type: sequelize.QueryTypes.SELECT, transaction });
    
    if (invalidMaterialRefs.length > 0) {
      console.log(`⚠️ Found ${invalidMaterialRefs.length} invalid material references. Setting them to NULL...`);
      await sequelize.query(`
        UPDATE "SystemLogs" 
        SET "materialId" = NULL 
        WHERE id IN (:ids)
      `, {
        replacements: { ids: invalidMaterialRefs.map(r => r.id) },
        transaction
      });
    }
    
    // 2. Drop existing constraints if they exist
    console.log('🔄 Dropping existing constraints...');
    await sequelize.query(`
      ALTER TABLE "SystemLogs" 
      DROP CONSTRAINT IF EXISTS "SystemLogs_stockEntryId_fkey"
    `, { transaction });
    
    await sequelize.query(`
      ALTER TABLE "SystemLogs" 
      DROP CONSTRAINT IF EXISTS "SystemLogs_materialId_fkey"
    `, { transaction });
    
    // 3. Recreate foreign key constraints with proper ON DELETE behavior
    console.log('🔧 Creating new constraints...');
    await sequelize.query(`
      ALTER TABLE "SystemLogs"
      ADD CONSTRAINT "SystemLogs_stockEntryId_fkey"
      FOREIGN KEY ("stockEntryId")
      REFERENCES "stockEntries"(id)
      ON DELETE SET NULL
      ON UPDATE CASCADE
    `, { transaction });
    
    await sequelize.query(`
      ALTER TABLE "SystemLogs"
      ADD CONSTRAINT "SystemLogs_materialId_fkey"
      FOREIGN KEY ("materialId")
      REFERENCES "materials"(id)
      ON DELETE SET NULL
      ON UPDATE CASCADE
    `, { transaction });
    
    // 3. Create indexes
    console.log('📊 Creating indexes...');
    await sequelize.query(`
      CREATE INDEX IF NOT EXISTS "idx_system_logs_stock_entry" 
      ON "SystemLogs" ("stockEntryId")
    `, { transaction });
    
    await sequelize.query(`
      CREATE INDEX IF NOT EXISTS "idx_system_logs_material" 
      ON "SystemLogs" ("materialId")
    `, { transaction });
    
    await sequelize.query(`
      CREATE INDEX IF NOT EXISTS "idx_system_logs_user" 
      ON "SystemLogs" ("userId")
    `, { transaction });
    
    await sequelize.query(`
      CREATE INDEX IF NOT EXISTS "idx_system_logs_timestamp" 
      ON "SystemLogs" ("actionTimestamp")
    `, { transaction });
    
    // Commit the transaction
    await transaction.commit();
    console.log('✅ Database migration completed successfully!');
    
  } catch (error) {
    await transaction.rollback();
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await sequelize.close();
  }
}

// Run the migration
runMigrations().catch(console.error);

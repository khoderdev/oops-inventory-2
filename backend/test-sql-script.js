import sequelize from './config/database.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function testSqlScript() {
  try {
    console.log('🔄 Testing connection to database...');
    await sequelize.authenticate();
    console.log('✅ Database connection established successfully.');

    // Read the SQL file
    const sqlFilePath = path.join(__dirname, 'data', 'database_import_script_stock_entries.sql');
    console.log(`📂 Reading SQL file from: ${sqlFilePath}`);
    const sqlScript = fs.readFileSync(sqlFilePath, 'utf8');

    console.log('🔄 Executing SQL script...');
    await sequelize.query(sqlScript);
    console.log('✅ SQL script executed successfully!');

    console.log('🔍 Verifying no NULL materialId values...');
    const [results] = await sequelize.query(`
      SELECT COUNT(*) as null_count 
      FROM "stockEntries" 
      WHERE "materialId" IS NULL
    `);
    
    const nullCount = parseInt(results[0].null_count);
    if (nullCount === 0) {
      console.log('✅ Success! No NULL materialId values found.');
    } else {
      console.error(`❌ Error: Found ${nullCount} stock entries with NULL materialId values.`);
    }

  } catch (error) {
    console.error('❌ Error executing SQL script:', error);
  } finally {
    await sequelize.close();
    console.log('🔄 Database connection closed.');
  }
}

testSqlScript();

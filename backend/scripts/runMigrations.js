import { Sequelize } from 'sequelize';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import { config } from 'dotenv';

// Load environment variables
config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Database configuration
const sequelize = new Sequelize(process.env.DATABASE_URL || 'postgres://postgres:postgres@localhost:5432/inventory_db', {
  logging: false,
  dialect: 'postgres',
  define: {
    timestamps: true,
    underscored: true,
  },
});

async function runMigrations() {
  try {
    await sequelize.authenticate();
    console.log('✅ Connection to database has been established successfully.');

    // Read migration files
    const migrationsDir = path.join(__dirname, '..', 'migrations');
    const migrationFiles = fs.readdirSync(migrationsDir)
      .filter(file => file.endsWith('.js') && file !== 'index.js')
      .sort();

    // Run each migration
    for (const file of migrationFiles) {
      try {
        console.log(`\n🔄 Running migration: ${file}`);
        const migration = await import(`file://${path.join(migrationsDir, file)}`);
        await migration.up(sequelize.getQueryInterface(), Sequelize);
        console.log(`✅ Successfully applied migration: ${file}`);
      } catch (error) {
        console.error(`❌ Error running migration ${file}:`, error.message);
        throw error;
      }
    }

    console.log('\n🎉 All migrations completed successfully!');
  } catch (error) {
    console.error('❌ Unable to run migrations:', error);
    process.exit(1);
  } finally {
    await sequelize.close();
  }
}

runMigrations();

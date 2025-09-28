import { up } from '../migrations/20250928_update_day_operations_table.js';
import sequelize from '../config/database.js';

async function runMigration() {
  try {
    console.log('Starting DayOperations table migration...');
    await up(sequelize.getQueryInterface());
    console.log('Migration completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

runMigration();

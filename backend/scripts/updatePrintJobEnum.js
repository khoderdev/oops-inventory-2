import sequelize from '../config/database.js';

async function updatePrintJobEnum() {
  try {
    console.log('🔄 Updating print_jobs jobType enum to include "void"...');
    
    // Add 'void' to the existing enum
    await sequelize.query(`
      ALTER TYPE "enum_print_jobs_jobType" ADD VALUE IF NOT EXISTS 'void';
    `);
    
    console.log('✅ Successfully added "void" to print_jobs jobType enum');
    
    // Verify the enum values
    const result = await sequelize.query(`
      SELECT unnest(enum_range(NULL::"enum_print_jobs_jobType")) AS enum_value;
    `);
    
    console.log('📋 Current jobType enum values:', result[0].map(row => row.enum_value));
    
  } catch (error) {
    console.error('❌ Failed to update enum:', error);
  } finally {
    await sequelize.close();
  }
}

updatePrintJobEnum();

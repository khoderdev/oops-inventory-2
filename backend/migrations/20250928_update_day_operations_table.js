import { DataTypes } from "sequelize";

export async function up(queryInterface) {
  try {
    // Step 1: Find and remove the unique constraint from the date column
    try {
      // First try with the specific constraint name
      await queryInterface.removeConstraint('DayOperations', 'DayOperations_date_key497');
      console.log('Removed constraint: DayOperations_date_key497');
    } catch (error) {
      console.log('Could not find constraint DayOperations_date_key497, trying to find it from information_schema...');
      
      // If that fails, try to find the constraint name from information_schema
      const constraints = await queryInterface.sequelize.query(
        `SELECT constraint_name 
         FROM information_schema.table_constraints 
         WHERE table_name = 'DayOperations' 
         AND constraint_type = 'UNIQUE' 
         AND constraint_schema = current_schema()`,
        { type: queryInterface.sequelize.QueryTypes.SELECT }
      );
      
      if (constraints.length > 0) {
        for (const constraint of constraints) {
          const constraintName = constraint.constraint_name;
          console.log(`Found constraint: ${constraintName}`);
          
          // Check if this constraint is on the date column
          const columns = await queryInterface.sequelize.query(
            `SELECT column_name 
             FROM information_schema.constraint_column_usage 
             WHERE constraint_name = '${constraintName}' 
             AND table_name = 'DayOperations'`,
            { type: queryInterface.sequelize.QueryTypes.SELECT }
          );
          
          if (columns.some(col => col.column_name === 'date')) {
            console.log(`Removing constraint: ${constraintName} on date column`);
            await queryInterface.removeConstraint('DayOperations', constraintName);
          }
        }
      } else {
        console.log('No unique constraints found on DayOperations table');
      }
    }
    
    // Step 2: Add the uniqueId column
    await queryInterface.addColumn('DayOperations', 'uniqueId', {
      type: DataTypes.STRING,
      allowNull: true,
      comment: 'Unique identifier for this day operation to differentiate multiple operations on the same day'
    });
    
    // Step 3: Add a unique index on date + uniqueId
    await queryInterface.addIndex('DayOperations', ['date', 'uniqueId'], {
      unique: true,
      name: 'day_operation_date_uniqueid_idx'
    });
    
    // Step 4: Update existing records to have a uniqueId based on their id
    const dayOperations = await queryInterface.sequelize.query(
      'SELECT id FROM "DayOperations"',
      { type: queryInterface.sequelize.QueryTypes.SELECT }
    );
    
    for (const op of dayOperations) {
      await queryInterface.sequelize.query(
        'UPDATE "DayOperations" SET "uniqueId" = ? WHERE id = ?',
        {
          replacements: [`legacy_${op.id}_${Date.now()}`, op.id],
          type: queryInterface.sequelize.QueryTypes.UPDATE
        }
      );
    }
    
    console.log('Migration completed successfully');
    return true;
  } catch (error) {
    console.error('Migration failed:', error);
    throw error;
  }
}

export async function down(queryInterface) {
  try {
    // Step 1: Remove the unique index on date + uniqueId
    try {
      await queryInterface.removeIndex('DayOperations', 'day_operation_date_uniqueid_idx');
      console.log('Removed index: day_operation_date_uniqueid_idx');
    } catch (error) {
      console.log('Could not remove index day_operation_date_uniqueid_idx:', error.message);
    }
    
    // Step 2: Remove the uniqueId column
    await queryInterface.removeColumn('DayOperations', 'uniqueId');
    console.log('Removed column: uniqueId');
    
    // Step 3: Add the unique constraint back to the date column
    await queryInterface.addConstraint('DayOperations', {
      fields: ['date'],
      type: 'unique',
      name: 'DayOperations_date_key'
    });
    console.log('Added constraint: DayOperations_date_key');
    
    console.log('Rollback completed successfully');
    return true;
  } catch (error) {
    console.error('Rollback failed:', error);
    throw error;
  }
}

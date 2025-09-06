const { DataTypes } = require('sequelize');
const { QueryTypes } = require('sequelize');

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const transaction = await queryInterface.sequelize.transaction();
    
    try {
      // 1. Check if the column exists and get its current type
      const tableInfo = await queryInterface.describeTable('stockEntries');
      
      if (tableInfo.purchasedIndividualQuantity) {
        // 2. Create a backup of the column
        await queryInterface.sequelize.query(
          'ALTER TABLE "stockEntries" RENAME COLUMN "purchasedIndividualQuantity" TO "purchasedIndividualQuantity_old";',
          { transaction }
        );

        // 3. Create the new column with the correct type
        await queryInterface.addColumn(
          'stockEntries',
          'purchasedIndividualQuantity',
          {
            type: DataTypes.DECIMAL(10, 3),
            allowNull: true
          },
          { transaction }
        );

        // 4. Copy data from the old column to the new one, converting to decimal
        await queryInterface.sequelize.query(
          `UPDATE "stockEntries" 
           SET "purchasedIndividualQuantity" = "purchasedIndividualQuantity_old"::DECIMAL(10,3) 
           WHERE "purchasedIndividualQuantity_old" IS NOT NULL;`,
          { transaction }
        );

        // 5. Drop the old column
        await queryInterface.removeColumn('stockEntries', 'purchasedIndividualQuantity_old', { transaction });
      }
      
      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  },

  down: async (queryInterface, Sequelize) => {
    // In case we need to rollback, we'll need to reverse the changes
    const transaction = await queryInterface.sequelize.transaction();
    
    try {
      const tableInfo = await queryInterface.describeTable('stockEntries');
      
      if (tableInfo.purchasedIndividualQuantity) {
        // Rename the current column
        await queryInterface.sequelize.query(
          'ALTER TABLE "stockEntries" RENAME COLUMN "purchasedIndividualQuantity" TO "purchasedIndividualQuantity_new";',
          { transaction }
        );

        // Recreate the original column
        await queryInterface.addColumn(
          'stockEntries',
          'purchasedIndividualQuantity',
          {
            type: DataTypes.INTEGER,
            allowNull: true
          },
          { transaction }
        );

        // Copy data back, converting to integer
        await queryInterface.sequelize.query(
          `UPDATE "stockEntries" 
           SET "purchasedIndividualQuantity" = ROUND("purchasedIndividualQuantity_new") 
           WHERE "purchasedIndividualQuantity_new" IS NOT NULL;`,
          { transaction }
        );

        // Drop the temporary column
        await queryInterface.removeColumn('stockEntries', 'purchasedIndividualQuantity_new', { transaction });
      }
      
      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }
};

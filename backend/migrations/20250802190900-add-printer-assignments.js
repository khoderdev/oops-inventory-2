'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Add printerId column to StockEntries table
    await queryInterface.addColumn('StockEntries', 'printerId', {
      type: Sequelize.INTEGER,
      allowNull: true,
      references: {
        model: 'Printers',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
      comment: 'Assigned printer for this stock entry item when used in POS orders'
    });

    // Add printerId column to menuItems table
    await queryInterface.addColumn('menuItems', 'printerId', {
      type: Sequelize.INTEGER,
      allowNull: true,
      references: {
        model: 'Printers',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
      comment: 'Assigned printer for this menu item when ordered in POS'
    });

    // Add indexes for better performance
    await queryInterface.addIndex('StockEntries', ['printerId'], {
      name: 'stockentries_printer_id_idx'
    });

    await queryInterface.addIndex('menuItems', ['printerId'], {
      name: 'menuitems_printer_id_idx'
    });
  },

  async down(queryInterface, Sequelize) {
    // Remove indexes first
    await queryInterface.removeIndex('StockEntries', 'stockentries_printer_id_idx');
    await queryInterface.removeIndex('menuItems', 'menuitems_printer_id_idx');

    // Remove columns
    await queryInterface.removeColumn('StockEntries', 'printerId');
    await queryInterface.removeColumn('menuItems', 'printerId');
  }
};

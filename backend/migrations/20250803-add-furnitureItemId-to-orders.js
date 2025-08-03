'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // Add furnitureItemId column to Orders table
    await queryInterface.addColumn('Orders', 'furnitureItemId', {
      type: Sequelize.INTEGER,
      allowNull: true,
      references: {
        model: 'FurnitureItems',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
      comment: 'Reference to furniture item (table) from floor plan'
    });

    // Add index for better query performance
    await queryInterface.addIndex('Orders', ['furnitureItemId'], {
      name: 'orders_furniture_item_id_index'
    });
  },

  async down(queryInterface, Sequelize) {
    // Remove index first
    await queryInterface.removeIndex('Orders', 'orders_furniture_item_id_index');
    
    // Remove the column
    await queryInterface.removeColumn('Orders', 'furnitureItemId');
  }
};

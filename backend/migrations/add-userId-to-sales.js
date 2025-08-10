module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('Sales', 'userId', {
      type: Sequelize.INTEGER,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL'
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('Sales', 'userId');
  }
};

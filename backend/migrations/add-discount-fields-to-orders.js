export const up = async (queryInterface, Sequelize) => {
  await queryInterface.addColumn('Orders', 'discountType', {
    type: Sequelize.ENUM('percentage', 'fixed'),
    allowNull: true,
    comment: 'Type of discount applied - percentage or fixed amount'
  });

  await queryInterface.addColumn('Orders', 'discountValue', {
    type: Sequelize.DECIMAL(10, 2),
    allowNull: true,
    comment: 'Discount value - percentage (0-100) or fixed amount'
  });

  await queryInterface.addColumn('Orders', 'discountAmount', {
    type: Sequelize.DECIMAL(10, 2),
    allowNull: true,
    defaultValue: 0,
    comment: 'Calculated discount amount in currency'
  });

  await queryInterface.addColumn('Orders', 'discountReason', {
    type: Sequelize.TEXT,
    allowNull: true,
    comment: 'Reason for applying the discount'
  });
};

export const down = async (queryInterface, Sequelize) => {
  await queryInterface.removeColumn('Orders', 'discountReason');
  await queryInterface.removeColumn('Orders', 'discountAmount');
  await queryInterface.removeColumn('Orders', 'discountValue');
  await queryInterface.removeColumn('Orders', 'discountType');
};

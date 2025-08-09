import { DataTypes } from "sequelize";

export const up = async (queryInterface, Sequelize) => {
  await queryInterface.addColumn('menuItems', 'image', {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: "Base64 encoded image or image URL for the menu item"
  });
};

export const down = async (queryInterface, Sequelize) => {
  await queryInterface.removeColumn('menuItems', 'image');
};

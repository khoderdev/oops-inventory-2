import { DataTypes } from 'sequelize';

export const up = async (queryInterface, Sequelize) => {
  // Add enhanced calculation fields to Materials table
  await queryInterface.addColumn('materials', 'massPerUnit', {
    type: DataTypes.DECIMAL(10, 3),
    allowNull: true,
    comment: "Mass per unit for mass materials (e.g., 500g per bag, 1kg per box)"
  });

  await queryInterface.addColumn('materials', 'massUnit', {
    type: DataTypes.STRING,
    allowNull: true,
    comment: "Unit for massPerUnit field (g, kg, lb, etc.)"
  });

  await queryInterface.addColumn('materials', 'piecesPerPackage', {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: "Number of pieces per package (e.g., 50 napkins per pack, 100 cups per sleeve)"
  });

  await queryInterface.addColumn('materials', 'unitDescription', {
    type: DataTypes.STRING,
    allowNull: true,
    comment: "Description of the unit (e.g., 'napkins', 'cups', 'plates', 'pieces')"
  });

  // Add enhanced calculation fields to StockEntries table
  await queryInterface.addColumn('stockEntries', 'massPerUnit', {
    type: DataTypes.DECIMAL(10, 3),
    allowNull: true,
    comment: "Mass per individual unit (e.g., 500g per bag)"
  });

  await queryInterface.addColumn('stockEntries', 'massUnit', {
    type: DataTypes.STRING,
    allowNull: true,
    comment: "Unit for massPerUnit (g, kg, lb, etc.)"
  });

  await queryInterface.addColumn('stockEntries', 'totalMass', {
    type: DataTypes.DECIMAL(15, 3),
    allowNull: true,
    comment: "Total mass available (massPerUnit × individual quantity)"
  });

  await queryInterface.addColumn('stockEntries', 'costPerMassUnit', {
    type: DataTypes.DECIMAL(10, 6),
    allowNull: true,
    comment: "Cost per mass unit (e.g., cost per gram)"
  });

  await queryInterface.addColumn('stockEntries', 'piecesPerPackage', {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: "Number of pieces per package (e.g., 50 napkins per pack)"
  });

  await queryInterface.addColumn('stockEntries', 'totalPieces', {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: "Total pieces available (piecesPerPackage × package quantity)"
  });

  await queryInterface.addColumn('stockEntries', 'costPerPiece', {
    type: DataTypes.DECIMAL(10, 6),
    allowNull: true,
    comment: "Cost per individual piece"
  });

  await queryInterface.addColumn('stockEntries', 'unitDescription', {
    type: DataTypes.STRING,
    allowNull: true,
    comment: "Description of the unit (e.g., 'napkins', 'cups', 'plates')"
  });

  console.log('✅ Added enhanced calculation fields to materials and stockEntries tables');
};

export const down = async (queryInterface, Sequelize) => {
  // Remove fields from materials table
  await queryInterface.removeColumn('materials', 'massPerUnit');
  await queryInterface.removeColumn('materials', 'massUnit');
  await queryInterface.removeColumn('materials', 'piecesPerPackage');
  await queryInterface.removeColumn('materials', 'unitDescription');

  // Remove fields from stockEntries table
  await queryInterface.removeColumn('stockEntries', 'massPerUnit');
  await queryInterface.removeColumn('stockEntries', 'massUnit');
  await queryInterface.removeColumn('stockEntries', 'totalMass');
  await queryInterface.removeColumn('stockEntries', 'costPerMassUnit');
  await queryInterface.removeColumn('stockEntries', 'piecesPerPackage');
  await queryInterface.removeColumn('stockEntries', 'totalPieces');
  await queryInterface.removeColumn('stockEntries', 'costPerPiece');
  await queryInterface.removeColumn('stockEntries', 'unitDescription');
  
  console.log('✅ Removed enhanced calculation fields from materials and stockEntries tables');
};

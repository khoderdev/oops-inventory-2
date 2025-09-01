import { DataTypes } from 'sequelize';

export const up = async (queryInterface, Sequelize) => {
  await queryInterface.addColumn('stockEntries', 'volumePerUnit', {
    type: DataTypes.DECIMAL(10, 3),
    allowNull: true,
    comment: "Volume per individual unit (e.g., 75cl per bottle)"
  });

  await queryInterface.addColumn('stockEntries', 'volumeUnit', {
    type: DataTypes.STRING,
    allowNull: true,
    comment: "Unit for volumePerUnit (ml, cl, l, etc.)"
  });

  await queryInterface.addColumn('stockEntries', 'totalVolume', {
    type: DataTypes.DECIMAL(15, 3),
    allowNull: true,
    comment: "Total volume available (volumePerUnit × individual quantity)"
  });

  await queryInterface.addColumn('stockEntries', 'costPerVolumeUnit', {
    type: DataTypes.DECIMAL(10, 6),
    allowNull: true,
    comment: "Cost per volume unit (e.g., cost per cl)"
  });

  console.log('✅ Added volume calculation fields to stockEntries table');
};

export const down = async (queryInterface, Sequelize) => {
  await queryInterface.removeColumn('stockEntries', 'volumePerUnit');
  await queryInterface.removeColumn('stockEntries', 'volumeUnit');
  await queryInterface.removeColumn('stockEntries', 'totalVolume');
  await queryInterface.removeColumn('stockEntries', 'costPerVolumeUnit');
  
  console.log('✅ Removed volume calculation fields from stockEntries table');
};

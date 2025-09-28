import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";

const DayOperationStockVariance = sequelize.define(
  "DayOperationStockVariance",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false
    },
    dayOperationId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'DayOperations',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE'
    },
    stockEntryId: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    materialId: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    materialName: {
      type: DataTypes.STRING,
      allowNull: false
    },
    openingQuantity: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0
    },
    closingQuantity: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0
    },
    variance: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0
    },
    unit: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: 'unit'
    },
    varianceType: {
      type: DataTypes.ENUM('gain', 'loss', 'none'),
      allowNull: false,
      defaultValue: 'none'
    }
  },
  {
    tableName: "DayOperationStockVariances",
    timestamps: true,
    indexes: [
      {
        fields: ["dayOperationId"]
      },
      {
        fields: ["materialId"]
      },
      {
        fields: ["stockEntryId"]
      },
      {
        fields: ["varianceType"]
      }
    ]
  }
);

export default DayOperationStockVariance;

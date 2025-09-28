import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";

const DayOperationStockSnapshot = sequelize.define(
  "DayOperationStockSnapshot",
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
    type: {
      type: DataTypes.ENUM('opening', 'closing'),
      allowNull: false,
      validate: {
        isIn: {
          args: [['opening', 'closing']],
          msg: "Type must be either 'opening' or 'closing'"
        }
      }
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
    materialCategory: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    quantity: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0
    },
    unit: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: 'unit'
    },
    costPerUnit: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0
    },
    snapshotTime: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    }
  },
  {
    tableName: "DayOperationStockSnapshots",
    timestamps: true,
    indexes: [
      {
        fields: ["dayOperationId", "type"],
      },
      {
        fields: ["materialId"]
      },
      {
        fields: ["stockEntryId"]
      }
    ]
  }
);

export default DayOperationStockSnapshot;

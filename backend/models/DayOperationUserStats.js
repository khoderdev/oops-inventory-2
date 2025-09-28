import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";

const DayOperationUserStats = sequelize.define(
  "DayOperationUserStats",
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
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    userName: {
      type: DataTypes.STRING,
      allowNull: false
    },
    openingTime: {
      type: DataTypes.DATE,
      allowNull: true
    },
    closingTime: {
      type: DataTypes.DATE,
      allowNull: true
    },
    openingCash: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
      defaultValue: 0
    },
    closingCash: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true
    },
    orderCount: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0
    },
    totalAmount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0
    },
    cashSales: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0
    },
    cardSales: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true
    }
  },
  {
    tableName: "DayOperationUserStats",
    timestamps: true,
    indexes: [
      {
        fields: ["dayOperationId"]
      },
      {
        fields: ["userId"]
      },
      {
        fields: ["dayOperationId", "userId"],
        unique: true
      }
    ]
  }
);

export default DayOperationUserStats;

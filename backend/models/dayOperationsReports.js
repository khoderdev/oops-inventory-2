import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";

const DayOperationReport = sequelize.define(
  "DayOperationReport",
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
      }
    },
    reportDate: {
      type: DataTypes.DATEONLY,
      allowNull: false
    },
    reportType: {
      type: DataTypes.ENUM('daily', 'weekly', 'monthly', 'custom'),
      allowNull: false,
      defaultValue: 'daily'
    },
    salesSummary: {
      type: DataTypes.JSONB,
      allowNull: false,
      defaultValue: {}
    },
    cashSummary: {
      type: DataTypes.JSONB,
      allowNull: false,
      defaultValue: {}
    },
    inventorySummary: {
      type: DataTypes.JSONB,
      allowNull: false,
      defaultValue: {}
    },
    topSellingItems: {
      type: DataTypes.JSONB,
      allowNull: true,
      defaultValue: []
    },
    salesByCategory: {
      type: DataTypes.JSONB,
      allowNull: true,
      defaultValue: {}
    },
    salesBySection: {
      type: DataTypes.JSONB,
      allowNull: true,
      defaultValue: {}
    },
    salesByHour: {
      type: DataTypes.JSONB,
      allowNull: true,
      defaultValue: []
    },
    paymentMethodBreakdown: {
      type: DataTypes.JSONB,
      allowNull: true,
      defaultValue: {}
    },
    stockMovements: {
      type: DataTypes.JSONB,
      allowNull: true,
      defaultValue: []
    },
    significantVariances: {
      type: DataTypes.JSONB,
      allowNull: true,
      defaultValue: []
    },
    generatedBy: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: 'System'
    },
    generatedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    },
    reportStatus: {
      type: DataTypes.ENUM('draft', 'final', 'amended'),
      allowNull: false,
      defaultValue: 'final'
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    createdAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    },
    updatedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    }
  },
  {
    tableName: "DayOperationReports",
    timestamps: true,
    indexes: [
      {
        fields: ["dayOperationId"]
      },
      {
        fields: ["reportDate"]
      },
      {
        fields: ["reportType"]
      }
    ]
  }
);

export default DayOperationReport;

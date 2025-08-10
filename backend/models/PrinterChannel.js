import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";

const PrinterChannel = sequelize.define(
  "PrinterChannel",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false
    },
    name: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: {
        msg: "Channel name already exists"
      },
      validate: {
        len: {
          args: [1, 100],
          msg: "Channel name must be between 1 and 100 characters"
        }
      }
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      field: "isActive", // Explicitly map to snake_case column
      defaultValue: true,
      allowNull: false
    },
    priority: {
      type: DataTypes.INTEGER,
      defaultValue: 1,
      allowNull: false,
      validate: {
        min: {
          args: [1],
          msg: "Priority must be at least 1"
        },
        max: {
          args: [10],
          msg: "Priority cannot exceed 10"
        }
      }
    },
    settings: {
      type: DataTypes.JSONB,
      defaultValue: {
        autoRetry: true,
        retryAttempts: 3,
        retryDelay: 5000,
        fallbackChannelId: null
      },
      allowNull: false
    },
    createdBy: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: "createdBy", // Explicitly map to snake_case column
      references: {
        model: "users",
        key: "id"
      }
    },
    createdAt: {
      type: DataTypes.DATE,
      field: "createdAt",
      allowNull: false
    },
    updatedAt: {
      type: DataTypes.DATE,
      field: "updatedAt",
      allowNull: false
    }
  },
  {
    tableName: "printer_channels",
    timestamps: true,
    underscored: true, // This will automatically add underscored fields for timestamps
    indexes: [
      {
        fields: ["name"]
      },
      {
        fields: ["isActive", "priority"]
      },
      {
        fields: ["createdBy"]
      }
    ]
  }
);

export default PrinterChannel;

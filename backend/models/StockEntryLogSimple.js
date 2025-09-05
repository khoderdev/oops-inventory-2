import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";

const SystemLogs = sequelize.define(
  "SystemLogs",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false
    },

    // User Information
    userId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: "ID of the user performing the action"
    },
    userName: {
      type: DataTypes.STRING(100),
      allowNull: true,
      comment: "Name of the user performing the action"
    },

    // Action Information
    actionType: {
      type: DataTypes.STRING(50),
      allowNull: false,
      comment: "Type of action performed on the stock entry"
    },
    actionDescription: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: "Human-readable description of the action performed"
    },

    // Timestamp Information
    actionTimestamp: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
      comment: "Precise timestamp when the action occurred"
    },

    // Item Details
    stockEntryId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: "ID of the stock entry being affected",
      references: {
        model: 'stockEntries',
        key: 'id'
      },
      onDelete: 'SET NULL',
      onUpdate: 'CASCADE'
    },
    materialId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: "ID of the material associated with the stock entry",
      references: {
        model: 'materials',
        key: 'id'
      },
      onDelete: 'SET NULL',
      onUpdate: 'CASCADE'
    },
    materialName: {
      type: DataTypes.STRING(200),
      allowNull: false,
      comment: "Name of the material"
    },

    // Quantity Changes
    quantityDelta: {
      type: DataTypes.DECIMAL(10, 3),
      allowNull: true,
      comment: "Change in quantity"
    },
    costDelta: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
      comment: "Change in total cost"
    },

    // Status
    status: {
      type: DataTypes.STRING(20),
      allowNull: false,
      defaultValue: "success",
      comment: "Status of the action execution"
    },

    // Error handling
    errorMessage: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: "Error message if the action failed"
    }
  },
  {
    tableName: "SystemLogs",
    timestamps: false,
    // Add paranoid: true if you want soft deletes
    // paranoid: true,
    // Add indexes for better query performance
    indexes: [
      {
        name: 'idx_system_logs_stock_entry',
        fields: ['stockEntryId']
      },
      {
        name: 'idx_system_logs_material',
        fields: ['materialId']
      },
      {
        name: 'idx_system_logs_user',
        fields: ['userId']
      },
      {
        name: 'idx_system_logs_timestamp',
        fields: ['actionTimestamp']
      }
    ]
  }
);

// Static method for logging
SystemLogs.logAction = async function (actionData, transaction = null) {
  try {
    const logEntry = await this.create({
      ...actionData,
      actionTimestamp: actionData.actionTimestamp || new Date()
    }, transaction ? { transaction } : undefined);
    return logEntry;
  } catch (error) {
    console.error("Failed to create stock entry log:", error);
    throw error;
  }
};

export default SystemLogs;

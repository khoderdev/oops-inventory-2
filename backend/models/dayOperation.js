import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";
// Note: These imports will be used in models/index.js for associations

const DayOperation = sequelize.define(
  "DayOperation",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false
    },
    date: {
      type: DataTypes.DATEONLY,
      allowNull: false,
      // Removed unique constraint to allow multiple operations per day
      validate: {
        isDate: {
          msg: "Invalid date"
        }
      }
    },
    uniqueId: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: 'Unique identifier for this day operation to differentiate multiple operations on the same day'
    },
    status: {
      type: DataTypes.ENUM('opened', 'closed'),
      allowNull: false,
      defaultValue: 'opened',
      validate: {
        isIn: {
          args: [['opened', 'closed']],
          msg: "Status must be either 'opened' or 'closed'"
        }
      }
    },
    openedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    },
    closedAt: {
      type: DataTypes.DATE,
      allowNull: true
    },
    openedBy: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: 'System'
    },
    closedBy: {
      type: DataTypes.STRING,
      allowNull: true
    },
    openingCash: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
      defaultValue: 0.00,
      validate: {
        min: {
          args: [0],
          msg: "Opening cash cannot be negative"
        }
      }
    },
    closingCash: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
      validate: {
        min: {
          args: [0],
          msg: "Closing cash cannot be negative"
        }
      }
    },
    expectedCash: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
      defaultValue: 0.00
    },
    cashVariance: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
      defaultValue: 0.00
    },
    totalSales: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0.00,
      validate: {
        min: {
          args: [0],
          msg: "Total sales cannot be negative"
        }
      }
    },
    totalTransactions: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      validate: {
        min: {
          args: [0],
          msg: "Total transactions cannot be negative"
        }
      }
    },
    averageTicket: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0.00
    },
    // These fields have been moved to separate tables
    // Keeping legacy fields for backward compatibility during migration
    openingStockSnapshot: {
      type: DataTypes.JSONB,
      allowNull: true,
      defaultValue: [],
      comment: 'Legacy field - use DayOperationStockSnapshot table instead'
    },
    closingStockSnapshot: {
      type: DataTypes.JSONB,
      allowNull: true,
      defaultValue: [],
      comment: 'Legacy field - use DayOperationStockSnapshot table instead'
    },
    stockVariances: {
      type: DataTypes.JSONB,
      allowNull: true,
      defaultValue: [],
      comment: 'Legacy field - use DayOperationStockVariance table instead'
    },
    autoReportGenerated: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false
    },
    // Keeping reportData as JSONB since it has a complex structure
    // that would require multiple tables to fully normalize
    reportData: {
      type: DataTypes.JSONB,
      allowNull: true,
      defaultValue: {}
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    // This field has been moved to a separate table
    // Keeping legacy field for backward compatibility during migration
    activityLogs: {
      type: DataTypes.JSONB,
      allowNull: true,
      defaultValue: [],
      comment: 'Legacy field - use DayOperationActivity table instead'
    },
    lastActivity: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: 'Timestamp of the last business activity recorded'
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
    tableName: "DayOperations",
    timestamps: true,
    indexes: [
      {
        fields: ["date"],
        // Removed unique constraint
        unique: false
      },
      {
        fields: ["status"]
      },
      {
        fields: ["openedAt"]
      },
      {
        fields: ["closedAt"]
      },
      {
        // Add index for uniqueId
        fields: ["uniqueId"]
      },
      {
        // Add composite index for date + uniqueId to ensure uniqueness
        fields: ["date", "uniqueId"],
        unique: true,
        name: "day_operation_date_uniqueid_idx"
      }
    ]
  }
);

export default DayOperation;

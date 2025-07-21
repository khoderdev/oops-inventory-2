import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";

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
      unique: true,
      validate: {
        isDate: {
          msg: "Invalid date"
        }
      }
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
    openingStockSnapshot: {
      type: DataTypes.JSONB,
      allowNull: true,
      defaultValue: []
    },
    closingStockSnapshot: {
      type: DataTypes.JSONB,
      allowNull: true,
      defaultValue: []
    },
    stockVariances: {
      type: DataTypes.JSONB,
      allowNull: true,
      defaultValue: []
    },
    autoReportGenerated: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false
    },
    reportData: {
      type: DataTypes.JSONB,
      allowNull: true,
      defaultValue: {}
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    activityLogs: {
      type: DataTypes.JSONB,
      allowNull: true,
      defaultValue: [],
      comment: 'Array of business activity logs during the day (sales, stock changes, etc.)'
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
        unique: true
      },
      {
        fields: ["status"]
      },
      {
        fields: ["openedAt"]
      },
      {
        fields: ["closedAt"]
      }
    ]
  }
);

export default DayOperation;

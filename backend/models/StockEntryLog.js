import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";

const StockEntryLog = sequelize.define(
  "StockEntryLog",
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
      allowNull: true, // Null for system actions
      comment: "ID of the user performing the action"
    },
    userName: {
      type: DataTypes.STRING(100),
      allowNull: true,
      comment: "Name of the user performing the action (cached for performance)"
    },
    userRole: {
      type: DataTypes.STRING(50),
      allowNull: true,
      comment: "Role of the user at the time of action"
    },

    // Action Information
    actionType: {
      type: DataTypes.ENUM(
        'create',
        'edit', 
        'add_to_stock',
        'waste_from_stock',
        'delete_stock',
        'adjust_quantity',
        'transfer_stock',
        'pos_toggle',
        'cost_update',
        'bulk_operation',
        'system_correction'
      ),
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
      comment: "Precise timestamp when the action occurred (YYYY-MM-DD HH:MM:SS)"
    },
    sessionId: {
      type: DataTypes.STRING(100),
      allowNull: true,
      comment: "Session ID for tracking user sessions"
    },

    // Item Details
    stockEntryId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      comment: "ID of the stock entry being affected"
    },
    materialId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      comment: "ID of the material associated with the stock entry"
    },
    materialName: {
      type: DataTypes.STRING(200),
      allowNull: false,
      comment: "Name of the material (cached for performance and historical accuracy)"
    },
    materialCategory: {
      type: DataTypes.STRING(100),
      allowNull: true,
      comment: "Category of the material at the time of action"
    },
    supplier: {
      type: DataTypes.STRING(200),
      allowNull: true,
      comment: "Supplier information at the time of action"
    },

    // Stock Modifications - Previous Values
    previousValues: {
      type: DataTypes.JSONB,
      allowNull: true,
      comment: "Complete previous state of the stock entry before changes"
    },
    previousQuantity: {
      type: DataTypes.DECIMAL(10, 3),
      allowNull: true,
      comment: "Previous purchased quantity"
    },
    previousIndividualQuantity: {
      type: DataTypes.DECIMAL(10, 3),
      allowNull: true,
      comment: "Previous individual quantity"
    },
    previousTotalCost: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
      comment: "Previous total cost"
    },

    // Stock Modifications - New Values
    newValues: {
      type: DataTypes.JSONB,
      allowNull: true,
      comment: "Complete new state of the stock entry after changes"
    },
    newQuantity: {
      type: DataTypes.DECIMAL(10, 3),
      allowNull: true,
      comment: "New purchased quantity"
    },
    newIndividualQuantity: {
      type: DataTypes.DECIMAL(10, 3),
      allowNull: true,
      comment: "New individual quantity"
    },
    newTotalCost: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
      comment: "New total cost"
    },

    // Quantity Changes
    quantityDelta: {
      type: DataTypes.DECIMAL(10, 3),
      allowNull: true,
      comment: "Change in quantity (positive for additions, negative for reductions)"
    },
    individualQuantityDelta: {
      type: DataTypes.DECIMAL(10, 3),
      allowNull: true,
      comment: "Change in individual quantity"
    },
    costDelta: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
      comment: "Change in total cost"
    },

    // Units Information
    purchasedUnit: {
      type: DataTypes.STRING(50),
      allowNull: true,
      comment: "Unit of measurement for purchased quantity"
    },
    individualUnit: {
      type: DataTypes.STRING(50),
      allowNull: true,
      comment: "Unit of measurement for individual quantity"
    },

    // Additional Metadata
    metadata: {
      type: DataTypes.JSONB,
      allowNull: true,
      comment: "Additional contextual data for traceability and auditing"
    },
    reason: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: "Reason provided for the action (especially for waste, adjustments, deletions)"
    },
    batchId: {
      type: DataTypes.STRING(100),
      allowNull: true,
      comment: "Batch ID for grouping related operations"
    },
    correlationId: {
      type: DataTypes.STRING(100),
      allowNull: true,
      comment: "Correlation ID for tracking related actions across different resources"
    },



    // Business Context
    businessImpact: {
      type: DataTypes.ENUM('low', 'medium', 'high', 'critical'),
      allowNull: false,
      defaultValue: 'low',
      comment: "Business impact level of the action"
    },
    financialImpact: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
      comment: "Estimated financial impact of the action"
    },
    complianceRelevant: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      comment: "Whether this action is relevant for compliance reporting"
    },

    // Status and Validation
    status: {
      type: DataTypes.ENUM('success', 'failure', 'partial', 'warning'),
      allowNull: false,
      defaultValue: 'success',
      comment: "Status of the action execution"
    },
    errorMessage: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: "Error message if the action failed"
    },
    validationErrors: {
      type: DataTypes.JSONB,
      allowNull: true,
      comment: "Validation errors encountered during the action"
    },

    // Approval and Authorization
    requiresApproval: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      comment: "Whether this action requires approval"
    },
    approvedBy: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: "ID of the user who approved the action"
    },
    approvedAt: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: "Timestamp when the action was approved"
    },

    // Data Integrity
    dataHash: {
      type: DataTypes.STRING(64),
      allowNull: true,
      comment: "SHA-256 hash of the action data for integrity verification"
    },
    version: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1,
      comment: "Version number for tracking schema changes"
    }
  },
  {
    tableName: "stock_entry_logs",
    timestamps: false, // We use our own timestamp field
    comment: "Comprehensive logging table for all stock entry operations and modifications"
    // Indexes will be added later
    /*indexes: [
      {
        fields: ["stockEntryId"],
        name: "idx_stock_entry_logs_stock_entry_id"
      },
      {
        fields: ["materialId"],
        name: "idx_stock_entry_logs_material_id"
      },
      {
        fields: ["userId"],
        name: "idx_stock_entry_logs_user_id"
      },
      {
        fields: ["actionType"],
        name: "idx_stock_entry_logs_action_type"
      },
      {
        fields: ["actionTimestamp"],
        name: "idx_stock_entry_logs_timestamp"
      },
      {
        fields: ["materialName"],
        name: "idx_stock_entry_logs_material_name"
      },
      {
        fields: ["status"],
        name: "idx_stock_entry_logs_status"
      },
      {
        fields: ["businessImpact"],
        name: "idx_stock_entry_logs_business_impact"
      },
      {
        fields: ["batchId"],
        name: "idx_stock_entry_logs_batch_id"
      },
      {
        fields: ["correlationId"],
        name: "idx_stock_entry_logs_correlation_id"
      },
      {
        fields: ["actionTimestamp", "actionType"],
        name: "idx_stock_entry_logs_timestamp_action"
      },
      {
        fields: ["materialId", "actionTimestamp"],
        name: "idx_stock_entry_logs_material_timestamp"
      },
      {
        fields: ["userId", "actionTimestamp"],
        name: "idx_stock_entry_logs_user_timestamp"
      }
    ]*/
  }
);

// Static methods for common logging operations
StockEntryLog.logStockAction = async function (actionData) {
  try {
    // Generate data hash for integrity
    const dataForHash = {
      stockEntryId: actionData.stockEntryId,
      actionType: actionData.actionType,
      previousValues: actionData.previousValues,
      newValues: actionData.newValues,
      timestamp: actionData.actionTimestamp
    };

    const crypto = await import("crypto");
    const dataHash = crypto
      .createHash("sha256")
      .update(JSON.stringify(dataForHash, Object.keys(dataForHash).sort()))
      .digest("hex");

    const logEntry = await this.create({
      ...actionData,
      dataHash,
      actionTimestamp: actionData.actionTimestamp || new Date()
    });

    return logEntry;
  } catch (error) {
    console.error("Failed to create stock entry log:", error);
    throw error;
  }
};

StockEntryLog.getStockHistory = async function (stockEntryId, options = {}) {
  const { limit = 50, offset = 0, actionTypes = null, startDate = null, endDate = null } = options;

  let whereClause = { stockEntryId };

  if (actionTypes && actionTypes.length > 0) {
    whereClause.actionType = { [Op.in]: actionTypes };
  }

  if (startDate && endDate) {
    whereClause.actionTimestamp = {
      [Op.between]: [new Date(startDate), new Date(endDate)]
    };
  }

  return await this.findAll({
    where: whereClause,
    order: [["actionTimestamp", "DESC"]],
    limit,
    offset,
    include: [
      {
        model: sequelize.models.User,
        as: "user",
        attributes: ["id", "username", "fullName"],
        required: false
      }
    ]
  });
};

StockEntryLog.getMaterialHistory = async function (materialId, options = {}) {
  const { limit = 100, actionTypes = null, startDate = null, endDate = null } = options;

  let whereClause = { materialId };

  if (actionTypes && actionTypes.length > 0) {
    whereClause.actionType = { [Op.in]: actionTypes };
  }

  if (startDate && endDate) {
    whereClause.actionTimestamp = {
      [Op.between]: [new Date(startDate), new Date(endDate)]
    };
  }

  return await this.findAll({
    where: whereClause,
    order: [["actionTimestamp", "DESC"]],
    limit,
    attributes: ["id", "actionType", "actionTimestamp", "stockEntryId", "quantityDelta", "individualQuantityDelta", "costDelta", "userName", "reason", "status"]
  });
};

StockEntryLog.getUserActivity = async function (userId, options = {}) {
  const { limit = 50, startDate = null, endDate = null } = options;

  let whereClause = { userId };

  if (startDate && endDate) {
    whereClause.actionTimestamp = {
      [Op.between]: [new Date(startDate), new Date(endDate)]
    };
  }

  return await this.findAll({
    where: whereClause,
    order: [["actionTimestamp", "DESC"]],
    limit,
    attributes: ["id", "actionType", "actionTimestamp", "materialName", "quantityDelta", "businessImpact", "status"]
  });
};

StockEntryLog.getActionSummary = async function (options = {}) {
  const { startDate = null, endDate = null, groupBy = "actionType" } = options;

  let whereClause = {};

  if (startDate && endDate) {
    whereClause.actionTimestamp = {
      [Op.between]: [new Date(startDate), new Date(endDate)]
    };
  }

  return await this.findAll({
    where: whereClause,
    attributes: [groupBy, [sequelize.fn("COUNT", sequelize.col("id")), "count"], [sequelize.fn("SUM", sequelize.col("quantityDelta")), "totalQuantityChange"], [sequelize.fn("SUM", sequelize.col("costDelta")), "totalCostChange"]],
    group: [groupBy],
    order: [[sequelize.fn("COUNT", sequelize.col("id")), "DESC"]]
  });
};

export default StockEntryLog;

import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";

const AuditLog = sequelize.define(
  "AuditLog",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: true, // Null for system actions
      references: {
        model: "users",
        key: "id"
      }
    },
    action: {
      type: DataTypes.STRING(100),
      allowNull: false,
      validate: {
        len: {
          args: [1, 100],
          msg: "Action must be between 1 and 100 characters"
        }
      }
    },
    resource: {
      type: DataTypes.STRING(50),
      allowNull: false,
      validate: {
        len: {
          args: [1, 50],
          msg: "Resource must be between 1 and 50 characters"
        }
      }
    },
    resourceId: {
      type: DataTypes.STRING(50),
      allowNull: true,
      comment: "ID of the affected resource"
    },
    oldValues: {
      type: DataTypes.JSONB,
      allowNull: true,
      comment: "Previous values before the change"
    },
    newValues: {
      type: DataTypes.JSONB,
      allowNull: true,
      comment: "New values after the change"
    },
    metadata: {
      type: DataTypes.JSONB,
      allowNull: true,
      comment: "Additional context information"
    },
    ipAddress: {
      type: DataTypes.INET,
      allowNull: true
    },
    userAgent: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    status: {
      type: DataTypes.ENUM("success", "failure", "warning"),
      allowNull: false,
      defaultValue: "success"
    },
    errorMessage: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    timestamp: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    }
  },
  {
    tableName: "audit_logs",
    timestamps: false, // We use our own timestamp field
    indexes: [
      {
        fields: ["userId"]
      },
      {
        fields: ["action"]
      },
      {
        fields: ["resource"]
      },
      {
        fields: ["timestamp"]
      },
      {
        fields: ["status"]
      }
    ]
  }
);

// Static methods for common audit actions
AuditLog.logUserAction = async function(userId, action, resource, resourceId = null, oldValues = null, newValues = null, req = null) {
  try {
    const logData = {
      userId,
      action,
      resource,
      resourceId: resourceId ? String(resourceId) : null,
      oldValues,
      newValues,
      status: "success"
    };

    if (req) {
      logData.ipAddress = req.ip || req.connection.remoteAddress;
      logData.userAgent = req.get("User-Agent");
    }

    await this.create(logData);
  } catch (error) {
    console.error("Failed to create audit log:", error);
    // Don't throw error to avoid breaking the main operation
  }
};

AuditLog.logFailedAction = async function(userId, action, resource, errorMessage, req = null) {
  try {
    const logData = {
      userId,
      action,
      resource,
      status: "failure",
      errorMessage
    };

    if (req) {
      logData.ipAddress = req.ip || req.connection.remoteAddress;
      logData.userAgent = req.get("User-Agent");
    }

    await this.create(logData);
  } catch (error) {
    console.error("Failed to create audit log:", error);
  }
};

AuditLog.logSystemAction = async function(action, resource, metadata = null) {
  try {
    await this.create({
      userId: null, // System action
      action,
      resource,
      metadata,
      status: "success"
    });
  } catch (error) {
    console.error("Failed to create system audit log:", error);
  }
};

AuditLog.getRecentActivity = async function(userId = null, limit = 50) {
  const whereClause = userId ? { userId } : {};
  
  return await this.findAll({
    where: whereClause,
    order: [["timestamp", "DESC"]],
    limit,
    include: [
      {
        model: sequelize.models.User,
        as: "user",
        attributes: ["id", "username", "firstName", "lastName"],
        required: false
      }
    ]
  });
};

AuditLog.getSecurityEvents = async function(hours = 24) {
  const since = new Date(Date.now() - hours * 60 * 60 * 1000);
  
  return await this.findAll({
    where: {
      timestamp: {
        [sequelize.Sequelize.Op.gte]: since
      },
      action: {
        [sequelize.Sequelize.Op.in]: [
          "login",
          "login_failed",
          "logout",
          "password_change",
          "account_locked",
          "permission_denied"
        ]
      }
    },
    order: [["timestamp", "DESC"]],
    include: [
      {
        model: sequelize.models.User,
        as: "user",
        attributes: ["id", "username", "firstName", "lastName"],
        required: false
      }
    ]
  });
};

export default AuditLog;

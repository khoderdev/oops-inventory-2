import crypto from "crypto";
import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";

const Session = sequelize.define(
  "Session",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false
    },
    token: {
      type: DataTypes.STRING(255),
      allowNull: false,
      unique: true,
      defaultValue: () => crypto.randomBytes(32).toString("hex")
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "users",
        key: "id"
      }
    },
    // Real-time tracking fields
    deviceId: {
      type: DataTypes.STRING(128),
      allowNull: true,
      comment: "Unique identifier for the device/terminal"
    },
    deviceName: {
      type: DataTypes.STRING(255),
      allowNull: true,
      comment: "Human-readable device name (e.g., 'POS Terminal 1', 'Admin Laptop')"
    },
    deviceType: {
      type: DataTypes.ENUM("web", "pos", "mobile", "tablet", "desktop"),
      allowNull: false,
      defaultValue: "web"
    },
    status: {
      type: DataTypes.ENUM("online", "offline", "idle", "away"),
      allowNull: false,
      defaultValue: "online"
    },
    socketId: {
      type: DataTypes.STRING(255),
      allowNull: true,
      comment: "Socket.IO connection ID for real-time communication"
    },
    lastHeartbeat: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    },
    logoutTime: {
      type: DataTypes.DATE,
      allowNull: true
    },
    // Existing fields
    ipAddress: {
      type: DataTypes.INET,
      allowNull: true
    },
    userAgent: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    expiresAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: () => new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true
    },
    lastActivity: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    },
    metadata: {
      type: DataTypes.JSONB,
      allowNull: true,
      defaultValue: {},
      comment: "Additional session metadata (browser info, screen resolution, etc.)"
    }
  },
  {
    tableName: "sessions",
    schema: "public",
    underscored: false,
    timestamps: true,
    indexes: [
      {
        fields: ["token"]
      },
      {
        fields: ["userId"]
      },
      {
        fields: ["expiresAt"]
      },
      {
        fields: ["deviceId"]
      },
      {
        fields: ["status"]
      },
      {
        fields: ["lastActivity"]
      },
      {
        fields: ["lastHeartbeat"]
      },
      {
        fields: ["socketId"]
      },
      {
        // Composite index for user + device tracking
        fields: ["userId", "deviceId"]
      },
      {
        // Index for active sessions
        fields: ["isActive", "status"]
      }
    ]
  }
);

// Instance methods
Session.prototype.isExpired = function () {
  return this.expiresAt < new Date();
};

Session.prototype.isOnline = function () {
  const now = new Date();
  const heartbeatThreshold = 5 * 60 * 1000; // 5 minutes
  return this.isActive && this.status === "online" && now - new Date(this.lastHeartbeat) < heartbeatThreshold;
};

Session.prototype.updateHeartbeat = async function () {
  this.lastHeartbeat = new Date();
  this.lastActivity = new Date();
  if (this.status === "offline") {
    this.status = "online";
  }
  await this.save();
  return this;
};

Session.prototype.setOffline = async function () {
  this.status = "offline";
  this.logoutTime = new Date();
  this.socketId = null;
  await this.save();
  return this;
};

Session.prototype.updateSocketId = async function (socketId) {
  this.socketId = socketId;
  this.status = "online";
  this.lastActivity = new Date();
  this.lastHeartbeat = new Date();
  await this.save();
  return this;
};

Session.prototype.extend = async function (hours = 24) {
  this.expiresAt = new Date(Date.now() + hours * 60 * 60 * 1000);
  this.lastActivity = new Date();
  await this.save();
  return this;
};

// Static methods
Session.getActiveUserSessions = async function (userId = null) {
  const whereClause = {
    isActive: true,
    status: ["online", "idle", "away"]
  };

  if (userId) {
    whereClause.userId = userId;
  }

  return await this.findAll({
    where: whereClause,
    include: [
      {
        model: sequelize.models.User,
        as: "user",
        attributes: ["id", "username", "firstName", "lastName", "role"]
      }
    ],
    order: [["lastActivity", "DESC"]]
  });
};

Session.getOnlineUsers = async function () {
  const now = new Date();
  const heartbeatThreshold = 5 * 60 * 1000; // 5 minutes

  return await this.findAll({
    where: {
      isActive: true,
      status: "online",
      lastHeartbeat: {
        [sequelize.Sequelize.Op.gte]: new Date(now - heartbeatThreshold)
      }
    },
    include: [
      {
        model: sequelize.models.User,
        as: "user",
        attributes: ["id", "username", "firstName", "lastName", "role"]
      }
    ],
    order: [["lastActivity", "DESC"]]
  });
};

Session.getUserDevices = async function (userId) {
  return await this.findAll({
    where: {
      userId,
      isActive: true
    },
    order: [["lastActivity", "DESC"]]
  });
};

Session.getSessionStats = async function () {
  const [totalSessions, activeSessions, onlineUsers] = await Promise.all([
    this.count(),
    this.count({ where: { isActive: true } }),
    this.count({
      where: {
        isActive: true,
        status: "online",
        lastHeartbeat: {
          [sequelize.Sequelize.Op.gte]: new Date(Date.now() - 5 * 60 * 1000)
        }
      }
    })
  ]);

  return {
    totalSessions,
    activeSessions,
    onlineUsers,
    offlineUsers: activeSessions - onlineUsers
  };
};

Session.revokeDeviceSession = async function (userId, deviceId) {
  const result = await this.update(
    {
      isActive: false,
      status: "offline",
      logoutTime: new Date(),
      socketId: null
    },
    {
      where: {
        userId,
        deviceId,
        isActive: true
      }
    }
  );

  return result[0]; // Number of affected rows
};

Session.cleanupExpired = async function () {
  const result = await this.update(
    {
      isActive: false,
      status: "offline",
      logoutTime: new Date()
    },
    {
      where: {
        [sequelize.Sequelize.Op.or]: [
          {
            expiresAt: {
              [sequelize.Sequelize.Op.lt]: new Date()
            }
          },
          {
            // Sessions without heartbeat for more than 10 minutes
            lastHeartbeat: {
              [sequelize.Sequelize.Op.lt]: new Date(Date.now() - 10 * 60 * 1000)
            },
            isActive: true
          }
        ]
      }
    }
  );

  console.log(`Cleaned up ${result[0]} expired/inactive sessions`);
  return result[0];
};

Session.revokeUserSessions = async function (userId, exceptToken = null) {
  const whereClause = { userId, isActive: true };
  if (exceptToken) {
    whereClause.token = { [sequelize.Sequelize.Op.ne]: exceptToken };
  }

  const result = await this.update(
    {
      isActive: false,
      status: "offline",
      logoutTime: new Date(),
      socketId: null
    },
    { where: whereClause }
  );

  return result[0]; // Number of affected rows
};

export default Session;

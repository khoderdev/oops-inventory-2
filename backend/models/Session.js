import { DataTypes } from "sequelize";
import crypto from "crypto";
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
    }
  },
  {
    tableName: "sessions",
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
      }
    ]
  }
);

// Instance methods
Session.prototype.isExpired = function() {
  return this.expiresAt < new Date();
};

Session.prototype.extend = async function(hours = 24) {
  this.expiresAt = new Date(Date.now() + hours * 60 * 60 * 1000);
  this.lastActivity = new Date();
  await this.save();
};

// Static methods
Session.cleanupExpired = async function() {
  const result = await this.destroy({
    where: {
      expiresAt: {
        [sequelize.Sequelize.Op.lt]: new Date()
      }
    }
  });
  console.log(`Cleaned up ${result} expired sessions`);
  return result;
};

Session.revokeUserSessions = async function(userId, exceptToken = null) {
  const whereClause = { userId, isActive: true };
  if (exceptToken) {
    whereClause.token = { [sequelize.Sequelize.Op.ne]: exceptToken };
  }
  
  const result = await this.update(
    { isActive: false },
    { where: whereClause }
  );
  
  return result[0]; // Number of affected rows
};

export default Session;

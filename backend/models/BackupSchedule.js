import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";

const BackupSchedule = sequelize.define(
  "BackupSchedule",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notEmpty: true,
      },
    },
    enabled: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
    frequency: {
      type: DataTypes.ENUM('daily', 'weekly', 'monthly'),
      allowNull: false,
    },
    time: {
      type: DataTypes.STRING, // HH:MM format
      allowNull: false,
      validate: {
        is: /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/,
      },
    },
    dayOfWeek: {
      type: DataTypes.INTEGER, // 0-6 for weekly (0 = Sunday)
      allowNull: true,
      validate: {
        min: 0,
        max: 6,
      },
    },
    dayOfMonth: {
      type: DataTypes.INTEGER, // 1-31 for monthly
      allowNull: true,
      validate: {
        min: 1,
        max: 31,
      },
    },
    backupType: {
      type: DataTypes.ENUM('custom', 'directory', 'sql'),
      allowNull: false,
      defaultValue: 'custom',
    },
    includeData: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
    includeSchema: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
    retentionDays: {
      type: DataTypes.INTEGER,
      defaultValue: 30,
      validate: {
        min: 1,
        max: 365,
      },
    },
    lastRun: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    nextRun: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    status: {
      type: DataTypes.ENUM('active', 'paused', 'error'),
      defaultValue: 'active',
    },
    lastError: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  },
  {
    tableName: "backup_schedules",
    timestamps: true,
    indexes: [
      {
        fields: ['enabled', 'status'],
      },
      {
        fields: ['nextRun'],
      },
    ],
  }
);

export default BackupSchedule;

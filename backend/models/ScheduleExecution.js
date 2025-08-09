import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";
import BackupSchedule from "./BackupSchedule.js";

const ScheduleExecution = sequelize.define(
  "ScheduleExecution",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    scheduleId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: BackupSchedule,
        key: 'id',
      },
    },
    scheduleName: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    startTime: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    endTime: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    status: {
      type: DataTypes.ENUM('running', 'completed', 'failed'),
      allowNull: false,
      defaultValue: 'running',
    },
    backupId: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    error: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    duration: {
      type: DataTypes.INTEGER, // in seconds
      allowNull: true,
    },
    backupSize: {
      type: DataTypes.BIGINT,
      allowNull: true,
    },
  },
  {
    tableName: "schedule_executions",
    timestamps: true,
    indexes: [
      {
        fields: ['scheduleId'],
      },
      {
        fields: ['status'],
      },
      {
        fields: ['startTime'],
      },
    ],
  }
);

// Define associations
BackupSchedule.hasMany(ScheduleExecution, {
  foreignKey: 'scheduleId',
  as: 'executions',
});

ScheduleExecution.belongsTo(BackupSchedule, {
  foreignKey: 'scheduleId',
  as: 'schedule',
});

export default ScheduleExecution;

import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";

const DayOperationActivity = sequelize.define(
  "DayOperationActivity",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false
    },
    dayOperationId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'DayOperations',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE'
    },
    activityType: {
      type: DataTypes.STRING,
      allowNull: false
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    userName: {
      type: DataTypes.STRING,
      allowNull: true
    },
    entityId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: 'ID of the related entity (sale, order, stock entry, etc.)'
    },
    entityType: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: 'Type of the related entity (sale, order, stock entry, etc.)'
    },
    metadata: {
      type: DataTypes.JSONB,
      allowNull: true,
      defaultValue: {},
      comment: 'Additional metadata for the activity'
    },
    timestamp: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    }
  },
  {
    tableName: "DayOperationActivities",
    timestamps: true,
    indexes: [
      {
        fields: ["dayOperationId"]
      },
      {
        fields: ["activityType"]
      },
      {
        fields: ["userId"]
      },
      {
        fields: ["timestamp"]
      },
      {
        fields: ["entityType", "entityId"]
      }
    ]
  }
);

export default DayOperationActivity;

import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";

const Order = sequelize.define(
  "Order",
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true
    },
    orderNumber: {
      type: DataTypes.STRING,
      unique: true,
      allowNull: false
    },
    orderType: {
      type: DataTypes.ENUM("delivery", "takeaway", "table", "employees"),
      allowNull: false,
      defaultValue: "takeaway"
    },
    status: {
      type: DataTypes.ENUM("draft", "confirmed", "preparing", "ready", "served", "paid", "cancelled"),
      allowNull: false,
      defaultValue: "draft"
    },
    tableId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: "Tables",
        key: "id"
      }
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    subtotal: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0.0
    },
    total: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0.0
    },
    discountType: {
      type: DataTypes.ENUM("percentage", "fixed"),
      allowNull: true
    },
    discountValue: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true
    },
    discountAmount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
      defaultValue: 0.0
    },
    discountReason: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    paymentAmount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true
    },
    saleId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: "Sales",
        key: "id"
      }
    },
    createdBy: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: "users",
        key: "id"
      }
    },
    updatedBy: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: "users",
        key: "id"
      }
    },
    completedAt: {
      type: DataTypes.DATE,
      allowNull: true
    },
    cancelledAt: {
      type: DataTypes.DATE,
      allowNull: true
    },
    cancelReason: {
      type: DataTypes.TEXT,
      allowNull: true
    }
  },
  {
    tableName: "Orders",
    timestamps: true,
    indexes: [
      {
        fields: ["orderNumber"],
        unique: true
      },
      {
        fields: ["status"]
      },
      {
        fields: ["orderType"]
      },
      {
        fields: ["tableId"]
      },
      {
        fields: ["createdAt"]
      }
    ]
  }
);

export default Order;

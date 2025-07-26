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
      type: DataTypes.ENUM("delivery", "takeaway", "table"),
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
    ],
    hooks: {
      beforeCreate: async order => {
        if (!order.orderNumber) {
          // Generate order number: ORD-YYYYMMDD-XXXX
          const today = new Date();
          const dateStr = today.toISOString().slice(0, 10).replace(/-/g, "");

          // Find the last order number for today
          const lastOrder = await Order.findOne({
            where: {
              orderNumber: {
                [sequelize.Sequelize.Op.like]: `ORD-${dateStr}-%`
              }
            },
            order: [["orderNumber", "DESC"]]
          });

          let sequence = 1;
          if (lastOrder) {
            const lastSequence = parseInt(lastOrder.orderNumber.split("-")[2]);
            sequence = lastSequence + 1;
          }

          order.orderNumber = `ORD-${dateStr}-${sequence.toString().padStart(4, "0")}`;
        }
      }
    }
  }
);

export default Order;

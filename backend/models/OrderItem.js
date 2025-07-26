import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";

const OrderItem = sequelize.define(
  "OrderItem",
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true
    },
    orderId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "Orders",
        key: "id"
      }
    },
    materialId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: "materials",
        key: "id"
      }
    },
    menuItemId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: "menuItems",
        key: "id"
      }
    },
    assignmentId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: "assignments",
        key: "id"
      }
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false
    },
    type: {
      type: DataTypes.ENUM("material", "menu"),
      allowNull: false
    },
    quantity: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1,
      validate: {
        min: 1
      }
    },
    unitPrice: {
      type: DataTypes.DECIMAL(10, 4),
      allowNull: false,
      defaultValue: 0.0
    },
    totalPrice: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0.0
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    status: {
      type: DataTypes.ENUM("pending", "preparing", "ready", "served", "cancelled"),
      allowNull: false,
      defaultValue: "pending"
    }
  },
  {
    tableName: "OrderItems",
    timestamps: true,
    indexes: [
      {
        fields: ["orderId"]
      },
      {
        fields: ["materialId"]
      },
      {
        fields: ["menuItemId"]
      },
      {
        fields: ["assignmentId"]
      },
      {
        fields: ["type"]
      },
      {
        fields: ["status"]
      }
    ],
    validate: {
      // Ensure either materialId or menuItemId is provided, but not both
      eitherMaterialOrMenuItem() {
        if (!this.materialId && !this.menuItemId) {
          throw new Error("Either materialId or menuItemId must be provided");
        }
        if (this.materialId && this.menuItemId) {
          throw new Error("Cannot have both materialId and menuItemId");
        }
        if (this.type === "material" && !this.materialId) {
          throw new Error("materialId is required for material type items");
        }
        if (this.type === "menu" && !this.menuItemId) {
          throw new Error("menuItemId is required for menu type items");
        }
      }
    },
    hooks: {
      beforeSave: orderItem => {
        // Calculate total price
        orderItem.totalPrice = (parseFloat(orderItem.unitPrice) * orderItem.quantity).toFixed(2);
      }
    }
  }
);

export default OrderItem;

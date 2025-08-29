import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";

const SupplierInvoice = sequelize.define(
  "SupplierInvoice",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    supplierId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "suppliers",
        key: "id"
      },
      onUpdate: "CASCADE",
      onDelete: "CASCADE"
    },
    invoiceNumber: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true
    },
    invoiceDate: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    },
    dueDate: {
      type: DataTypes.DATE,
      allowNull: false
    },
    totalAmount: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: false,
      validate: {
        min: { args: [0.01], msg: "Invoice amount must be greater than 0" }
      }
    },
    paidAmount: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: false,
      defaultValue: 0.0,
      validate: {
        min: { args: [0], msg: "Paid amount cannot be negative" }
      }
    },
    status: {
      type: DataTypes.ENUM("draft", "sent", "overdue", "partial", "paid", "cancelled"),
      allowNull: false,
      defaultValue: "draft"
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true
    }
  },
  {
    tableName: "supplier_invoices",
    timestamps: true,
    indexes: [
      {
        fields: ["invoiceNumber"],
        unique: true
      },
      {
        fields: ["supplierId"]
      },
      {
        fields: ["status"]
      }
    ]
  }
);

export default SupplierInvoice;

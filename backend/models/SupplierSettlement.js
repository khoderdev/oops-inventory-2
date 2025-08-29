import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";

const SupplierSettlement = sequelize.define(
  "SupplierSettlement",
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
        model: 'suppliers',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE'
    },
    amount: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: false,
      validate: {
        min: { args: [0.01], msg: "Settlement amount must be greater than 0" }
      }
    },
    paymentMethod: {
      type: DataTypes.ENUM('cash', 'bank_transfer', 'check', 'digital_wallet', 'other'),
      allowNull: false,
      defaultValue: 'bank_transfer'
    },
    referenceNumber: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: "Payment reference number (check number, transaction ID, etc.)"
    },
    paymentDate: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    },
    status: {
      type: DataTypes.ENUM('pending', 'completed', 'failed', 'cancelled'),
      allowNull: false,
      defaultValue: 'pending'
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    settledBy: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
      comment: 'User who processed the settlement'
    }
  },
  {
    tableName: "supplier_settlements",
    timestamps: true
  }
);

export default SupplierSettlement;
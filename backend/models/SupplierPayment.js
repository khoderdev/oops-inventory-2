import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";
import Supplier from "./Supplier.js";

const SupplierPayment = sequelize.define(
  "SupplierPayment",
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
        model: Supplier,
        key: "id"
      }
    },
    amount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      validate: {
        isDecimal: true,
        min: 0.01
      },
      get() {
        const rawValue = this.getDataValue("amount");
        if (rawValue === null || rawValue === undefined) return null;
        return parseFloat(rawValue).toFixed(2);
      }
    },
    paymentDate: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    },
    paymentMethod: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: "Cash",
      validate: {
        isIn: [["Cash", "Bank Transfer", "Credit Card", "Check", "Online Payment", "Other"]]
      }
    },
    referenceNumber: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: "Payment reference number, invoice number, or transaction ID"
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    status: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: "Completed",
      validate: {
        isIn: [["Pending", "Completed", "Failed", "Cancelled"]]
      }
    },
    attachmentUrl: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: "URL to payment receipt or invoice document"
    },
    stockEntryIds: {
      type: DataTypes.JSON,
      allowNull: true,
      comment: "Array of stock entry IDs this payment is associated with"
    }
  },
  {
    tableName: "supplierPayments",
    timestamps: true,
    indexes: [
      { fields: ['supplierId'] },
      { fields: ['paymentDate'] },
      { fields: ['status'] }
    ]
  }
);

// Define association
SupplierPayment.belongsTo(Supplier, { foreignKey: 'supplierId', as: 'supplier' });
Supplier.hasMany(SupplierPayment, { foreignKey: 'supplierId', as: 'payments' });

export default SupplierPayment;

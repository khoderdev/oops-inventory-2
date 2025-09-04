import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";

const Supplier = sequelize.define(
  "Supplier",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true
    },
    contactPerson: {
      type: DataTypes.STRING,
      allowNull: true
    },
    email: {
      type: DataTypes.STRING,
      allowNull: true,
      validate: {
        isEmail: function(val) {
          // Only validate if value is not empty
          if (val && val.length > 0) {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(val)) {
              throw new Error('Invalid email format');
            }
          }
        }
      }
    },
    phone: {
      type: DataTypes.STRING,
      allowNull: true
    },
    address: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    paymentTerms: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: "Payment terms (e.g., Net 30, COD)"
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true
    },
    website: {
      type: DataTypes.STRING,
      allowNull: true,
      validate: {
        isUrl: function(val) {
          // Only validate if value is not empty
          if (val && val.length > 0) {
            const urlRegex = /^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,6})([/\w .-]*)*\/?$/;
            if (!urlRegex.test(val)) {
              throw new Error('Invalid URL format');
            }
          }
        }
      }
    },
    taxId: {
      type: DataTypes.STRING,
      allowNull: true
    }
  },
  {
    tableName: "suppliers",
    timestamps: true,
    indexes: [
      { fields: ['name'] },
      { fields: ['isActive'] }
    ]
  }
);

export default Supplier;

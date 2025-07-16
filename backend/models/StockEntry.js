import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";
import Material from "./materials.js";

const StockEntry = sequelize.define(
  "StockEntry",
  {
    id: {
      type: DataTypes.STRING,
      primaryKey: true,
      autoIncrement: true
    },
    materialId: {
      type: DataTypes.STRING,
      allowNull: false,
      references: {
        model: Material,
        key: "id"
      }
    },
    supplier: {
      type: DataTypes.STRING,
      allowNull: true
    },
    purchasedQuantity: {
      type: DataTypes.FLOAT,
      allowNull: true
    },
    purchasedUnit: {
      type: DataTypes.STRING,
      allowNull: true
    },
    costPerPurchasedUnit: {
      type: DataTypes.FLOAT,
      allowNull: true
    },
    totalCost: {
      type: DataTypes.FLOAT,
      allowNull: true
    },
    purchaseDate: {
      type: DataTypes.DATE,
      allowNull: true
    },
    expiryDate: {
      type: DataTypes.DATE,
      allowNull: true
    },
    batchNumber: {
      type: DataTypes.STRING,
      allowNull: true
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true
    }
  },
  {
    tableName: "stockEntries",
    timestamps: true
  }
);

export default StockEntry;

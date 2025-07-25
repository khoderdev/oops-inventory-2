import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";

const Wasting = sequelize.define(
  "Wasting",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    stockEntryId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "stockEntries",
        key: "id"
      }
    },
    materialName: {
      type: DataTypes.STRING,
      allowNull: false
    },
    category: {
      type: DataTypes.STRING,
      allowNull: false
    },
    quantity: {
      type: DataTypes.DECIMAL,
      allowNull: false
    },
    unit: {
      type: DataTypes.STRING,
      allowNull: false
    },
    costPerBaseUnit: {
      type: DataTypes.DECIMAL,
      defaultValue: 0
    },
    totalCost: {
      type: DataTypes.DECIMAL,
      defaultValue: 0
    },
    wasteReason: {
      type: DataTypes.STRING,
      allowNull: false
    },
    wasteDate: {
      type: DataTypes.DATE,
      allowNull: false
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true
    }
  },
  {
    tableName: "wastings",
    timestamps: true
  }
);

export default Wasting;

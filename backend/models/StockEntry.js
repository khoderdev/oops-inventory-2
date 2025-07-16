import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";
import Material from "./materials.js";

const StockEntry = sequelize.define(
  "StockEntry",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    materialId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: Material,
        key: "id"
      }
    },
    purchasedQuantity: {
      type: DataTypes.FLOAT,
      allowNull: false
    },
    purchasedUnit: {
      type: DataTypes.STRING,
      allowNull: false
    },
    totalCost: {
      type: DataTypes.FLOAT,
      allowNull: false
    }
  },
  {
    tableName: "stockEntries",
    timestamps: false
  }
);

StockEntry.belongsTo(Material, { foreignKey: "materialId" });

export default StockEntry;

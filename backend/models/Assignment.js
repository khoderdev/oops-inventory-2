import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";
import Material from "./materials.js";
import Section from "./sections.js";
import StockEntry from "./StockEntry.js";

const Assignment = sequelize.define(
  "Assignment",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    sectionId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: Section,
        key: "id"
      }
    },
    materialId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: Material,
        key: "id"
      }
    },
    stockEntryId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: StockEntry,
        key: "id"
      }
    },
    assignedQuantity: {
      type: DataTypes.FLOAT,
      allowNull: false
    },
    assignedUnit: {
      type: DataTypes.STRING,
      allowNull: false
    }
  },
  {
    tableName: "assignments",
    timestamps: false
  }
);

export default Assignment;

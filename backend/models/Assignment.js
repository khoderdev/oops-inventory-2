import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";
import Material from "./materials.js";
import { MenuItem } from "./menuItems.js";
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
      allowNull: true,
      references: {
        model: Material,
        key: "id"
      }
    },
    menuItemId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: MenuItem,
        key: "id"
      }
    },
    stockEntryId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: StockEntry,
        key: "id"
      }
    },
    assignedQuantity: {
      type: DataTypes.FLOAT,
      allowNull: true
    },
    assignedUnit: {
      type: DataTypes.STRING,
      allowNull: true
    },
    assignedIndividualQuantity: {
      type: DataTypes.INTEGER,
      allowNull: true
    }
  },
  {
    tableName: "assignments",
    timestamps: false
  }
);

export default Assignment;

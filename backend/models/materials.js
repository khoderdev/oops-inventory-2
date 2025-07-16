import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";
import { MATERIAL_CATEGORIES, UNIT_OPTIONS, isValidMaterialCategory, isValidUnitType } from "../utils/conversions.js";

const Material = sequelize.define(
  "Material",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notEmpty: { msg: "Name cannot be empty" }
      }
    },
    baseUnit: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notEmpty: { msg: "Base unit cannot be empty" },
        isValidBaseUnit(value) {
          if (!this.unitType || !UNIT_OPTIONS[this.unitType].includes(value)) {
            throw new Error(`Invalid base unit for unit type ${this.unitType}`);
          }
        }
      }
    },
    unitType: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        isValidUnitType(value) {
          if (!isValidUnitType(value)) {
            throw new Error(`Invalid unit type. Must be one of: ${Object.keys(UNIT_OPTIONS).join(", ")}`);
          }
        }
      }
    },
    category: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        isValidCategory(value) {
          if (!isValidMaterialCategory(value)) {
            throw new Error(`Invalid category. Must be one of: ${MATERIAL_CATEGORIES.map(c => c.value).join(", ")}`);
          }
        }
      }
    },
    description: {
      type: DataTypes.STRING,
      allowNull: true
    }
  },
  {
    tableName: "materials",
    timestamps: false
  }
);

export default Material;

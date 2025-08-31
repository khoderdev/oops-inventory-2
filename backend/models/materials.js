import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";
import { UNIT_OPTIONS, isValidUnitType } from "../utils/conversions.js";

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
          // Skip validation during table creation when unitType might not be set
          if (this.unitType && UNIT_OPTIONS[this.unitType] && !UNIT_OPTIONS[this.unitType].includes(value)) {
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

    inputUnit: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: "Original input unit from MaterialForm (e.g., 'box', 'pack')"
    },

    packageQuantity: {
      type: DataTypes.INTEGER,
      allowNull: true,
      validate: {
        min: { args: [1], msg: "Package quantity must be at least 1" }
      },
      comment: "For package units: how many base units per package"
    },

    categoryId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'categories',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
      comment: 'Foreign key reference to categories table'
    },

    volumePerUnit: {
      type: DataTypes.DECIMAL(10, 3),
      allowNull: true,
      validate: {
        min: { args: [0], msg: "Volume per unit must be non-negative" }
      },
      comment: "Volume per unit for beverages (e.g., 330ml per bottle, 750ml per wine bottle)"
    },

    volumeUnit: {
      type: DataTypes.STRING,
      allowNull: true,
      validate: {
        isIn: {
          args: [['ml', 'cl', 'dl', 'l', 'fl_oz', 'cup', 'pt', 'qt', 'gal']],
          msg: "Volume unit must be a valid volume measurement"
        }
      },
      comment: "Unit for volumePerUnit field (ml, cl, l, etc.)"
    }
  },
  {
    tableName: "materials",
    timestamps: true
  }
);



export default Material;

import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";
import { Section } from "./index.js";

const InnerSection = sequelize.define(
  "InnerSection",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false
    },
    sectionId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: Section,
        key: "id"
      }
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notEmpty: { msg: "Inner section name cannot be empty" }
      }
    },
    type: {
      type: DataTypes.ENUM("indoor", "outdoor"),
      allowNull: false,
      validate: {
        isIn: {
          args: [["indoor", "outdoor"]],
          msg: "Type must be either 'indoor' or 'outdoor'"
        }
      }
    }
  },
  {
    tableName: "innerSections",
    timestamps: false
  }
);

const Table = sequelize.define(
  "Table",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false
    },
    innerSectionId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: InnerSection,
        key: "id"
      }
    },
    tableNumber: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notEmpty: { msg: "Table number cannot be empty" }
      }
    },
    capacity: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        min: { args: [1], msg: "Capacity must be at least 1" }
      }
    },
    isReserved: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false
    }
  },
  {
    tableName: "tables",
    timestamps: false,
    indexes: [
      {
        unique: true,
        fields: ["innerSectionId", "tableNumber"]
      }
    ]
  }
);
export { InnerSection, Table };

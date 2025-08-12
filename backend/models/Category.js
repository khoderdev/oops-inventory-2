import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";

const Category = sequelize.define(
  "Category",
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
        notEmpty: { msg: "Category name cannot be empty" },
        len: { args: [1, 100], msg: "Category name must be between 1 and 100 characters" }
      }
    },
    value: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: {
        notEmpty: { msg: "Category value cannot be empty" },
        len: { args: [1, 50], msg: "Category value must be between 1 and 50 characters" },
        is: { args: /^[a-z0-9_-]+$/, msg: "Category value must contain only lowercase letters, numbers, underscores, and hyphens" }
      }
    },
    type: {
      type: DataTypes.ENUM("materials", "menu_items"),
      allowNull: false,
      validate: {
        isIn: {
          args: [["materials", "menu_items"]],
          msg: "Category type must be either 'materials' or 'menu_items'"
        }
      }
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true
    },
    sortOrder: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: 0,
      validate: {
        min: { args: [0], msg: "Sort order cannot be negative" }
      }
    }
  },
  {
    tableName: "categories",
    timestamps: true,
    indexes: [
      {
        unique: true,
        fields: ["value"]
      },
      {
        fields: ["type"]
      },
      {
        fields: ["isActive"]
      },
      {
        fields: ["sortOrder"]
      }
    ]
  }
);

export default Category;

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
      unique: true,
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
    },
    categoryTypeIds: {
      type: DataTypes.ARRAY(DataTypes.INTEGER),
      allowNull: true,
      defaultValue: [],
      validate: {
        isArrayOfIntegers(value) {
          if (value && !Array.isArray(value)) {
            throw new Error('CategoryTypeIds must be an array');
          }
          if (value && value.some(id => typeof id !== 'number' || id <= 0)) {
            throw new Error('All CategoryTypeIds must be positive integers');
          }
        }
      }
    }
  },
  {
    tableName: "categories",
    timestamps: true,
    indexes: [
      {
        unique: true,
        fields: ["name"]
      },
      {
        unique: true,
        fields: ["value"]
      },
      {
        fields: ["isActive"]
      },
      {
        fields: ["sortOrder"]
      },
      {
        fields: ["categoryTypeIds"],
        using: "gin"
      },
    ]
  }
);

export default Category;

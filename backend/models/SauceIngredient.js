import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";

const SauceIngredient = sequelize.define(
  "SauceIngredient",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    sauceId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'sauces',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE'
    },
    materialId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'materials',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE'
    },
    quantity: {
      type: DataTypes.DECIMAL(10, 6),
      allowNull: false,
      validate: {
        min: { args: [0.000001], msg: "Quantity must be greater than 0" }
      }
    },
    unit: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notEmpty: { msg: "Unit cannot be empty" }
      }
    },
    cost: {
      type: DataTypes.DECIMAL(10, 6),
      allowNull: false,
      defaultValue: 0,
      validate: {
        min: { args: [0], msg: "Cost must be non-negative" }
      }
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    sortOrder: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0
    }
  },
  {
    tableName: "sauce_ingredients",
    timestamps: true,
    indexes: [
      {
        fields: ['sauceId']
      },
      {
        fields: ['materialId']
      },
      {
        unique: true,
        fields: ['sauceId', 'materialId'],
        name: 'sauce_ingredient_unique'
      },
      {
        fields: ['sortOrder']
      }
    ]
  }
);

export default SauceIngredient;

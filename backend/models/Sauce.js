import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";

const Sauce = sequelize.define(
  "Sauce",
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
        notEmpty: { msg: "Sauce name cannot be empty" },
        len: { args: [1, 100], msg: "Sauce name must be between 1 and 100 characters" }
      }
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    category: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notEmpty: { msg: "Category cannot be empty" },
        isIn: {
          args: [["Hot Sauces", "Cold Sauces", "Dressings", "Marinades", "Dips", "Gravies", "Reductions", "Emulsions", "Compound Butters", "Salsas", "Chutneys", "Aiolis", "Vinaigrettes", "Other"]],
          msg: "Invalid sauce category"
        }
      }
    },
    totalCost: {
      type: DataTypes.DECIMAL(10, 6),
      allowNull: false,
      defaultValue: 0,
      validate: {
        min: { args: [0], msg: "Total cost must be non-negative" }
      }
    },
    costPerUnit: {
      type: DataTypes.DECIMAL(10, 6),
      allowNull: false,
      defaultValue: 0,
      validate: {
        min: { args: [0], msg: "Cost per unit must be non-negative" }
      }
    },
    unit: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notEmpty: { msg: "Unit cannot be empty" },
        isIn: {
          args: [["ml", "l", "fl oz", "cup", "pint", "quart", "gallon", "g", "kg", "oz", "lb", "portion", "serving"]],
          msg: "Invalid unit"
        }
      }
    },
    yieldQuantity: {
      type: DataTypes.DECIMAL(10, 3),
      allowNull: false,
      validate: {
        min: { args: [0.001], msg: "Yield quantity must be greater than 0" }
      }
    },
    preparationTime: {
      type: DataTypes.INTEGER,
      allowNull: true,
      validate: {
        min: { args: [0], msg: "Preparation time must be non-negative" }
      },
      comment: "Preparation time in minutes"
    },
    isPOSItem: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true
    },
    createdBy: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: "users",
        key: "id"
      },
      onUpdate: "CASCADE",
      onDelete: "SET NULL"
    },
    updatedBy: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: "users",
        key: "id"
      },
      onUpdate: "CASCADE",
      onDelete: "SET NULL"
    }
  },
  {
    tableName: "sauces",
    timestamps: true,
    indexes: [
      {
        fields: ["name"]
      },
      {
        fields: ["category"]
      },
      {
        fields: ["isActive"]
      },
      {
        fields: ["isPOSItem"]
      },
      {
        fields: ["createdAt"]
      }
    ]
  }
);

export default Sauce;

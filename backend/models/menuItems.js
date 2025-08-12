import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";
import Material from "./materials.js";
import Printer from "./Printer.js";
import { isValidCategory } from "../utils/categoryHelpers.js";

const MenuItem = sequelize.define(
  "MenuItem",
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
    description: {
      type: DataTypes.STRING,
      allowNull: true
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
    price: {
      type: DataTypes.FLOAT,
      allowNull: false,
      validate: {
        min: { args: [0], msg: "Price cannot be negative" }
      }
    },
    isPOSItem: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
      defaultValue: false
    },
    image: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: "Base64 encoded image or image URL for the menu item"
    },
    printerId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: Printer,
        key: "id"
      },
      comment: "Assigned printer for this menu item when ordered in POS"
    },
    createdAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    },
    updatedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    }
  },
  {
    tableName: "menuItems",
    timestamps: true
  }
);

// Junction table for MenuItem-Material relationship (ingredients)
const MenuItemIngredient = sequelize.define(
  "MenuItemIngredient",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    menuItemId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: MenuItem,
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
    quantity: {
      type: DataTypes.FLOAT,
      allowNull: false,
      validate: {
        min: { args: [0], msg: "Quantity must be non-negative" }
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
      type: DataTypes.FLOAT,
      allowNull: false,
      validate: {
        min: { args: [0], msg: "Cost cannot be negative" }
      }
    }
  },
  {
    tableName: "menuItemIngredients",
    timestamps: false
  }
);

export { MenuItem, MenuItemIngredient };

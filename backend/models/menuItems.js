import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";
import Material from "./materials.js";

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
    category: {
      type: DataTypes.ENUM("appetizers", "mains", "sides", "desserts", "beverages", "other"),
      allowNull: false
    },
    price: {
      type: DataTypes.FLOAT,
      allowNull: false,
      validate: {
        min: { args: [0], msg: "Price cannot be negative" }
      }
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

// Define associations
MenuItem.belongsToMany(Material, {
  through: MenuItemIngredient,
  foreignKey: "menuItemId",
  otherKey: "materialId",
  as: "ingredients"
});
Material.belongsToMany(MenuItem, {
  through: MenuItemIngredient,
  foreignKey: "materialId",
  otherKey: "menuItemId",
  as: "menuItems"
});

// Additional associations to access MenuItemIngredient directly
MenuItem.hasMany(MenuItemIngredient, {
  foreignKey: "menuItemId",
  as: "menuItemIngredients"
});
MenuItemIngredient.belongsTo(MenuItem, { foreignKey: "menuItemId" });
Material.hasMany(MenuItemIngredient, {
  foreignKey: "materialId",
  as: "menuItemIngredients"
});
MenuItemIngredient.belongsTo(Material, { foreignKey: "materialId" });

export { MenuItem, MenuItemIngredient };

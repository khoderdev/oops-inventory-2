import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";

const Variants = sequelize.define(
  "Variants",
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
        model: 'menuItems',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE',
      comment: 'Foreign key reference to menuItems table'
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notEmpty: { msg: "Variant name cannot be empty" }
      },
      comment: 'Variant name (e.g., glass, shot, small, medium, large)'
    },
    volume: {
      type: DataTypes.DECIMAL(10, 3),
      allowNull: false,
      validate: {
        min: { args: [0], msg: "Volume cannot be negative" }
      },
      comment: 'Volume amount for this variant'
    },
    unit: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notEmpty: { msg: "Unit cannot be empty" }
      },
      comment: 'Unit of measurement (e.g., cl, ml, oz)'
    },
    price: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      validate: {
        min: { args: [0], msg: "Price cannot be negative" }
      },
      comment: 'Price for this variant'
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
      comment: 'Whether this variant is active/available'
    },
    sortOrder: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: 0,
      comment: 'Sort order for displaying variants'
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
    tableName: "variants",
    timestamps: true,
    indexes: [
      {
        fields: ['menuItemId'],
        name: 'idx_variants_menu_item_id'
      },
      {
        fields: ['menuItemId', 'isActive'],
        name: 'idx_variants_menu_item_active'
      },
      {
        fields: ['name'],
        name: 'idx_variants_name'
      }
    ]
  }
);

export default Variants;

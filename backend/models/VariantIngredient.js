import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";

const VariantIngredient = sequelize.define(
  "VariantIngredient",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    variantId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "variants",
        key: "id"
      },
      onUpdate: "CASCADE",
      onDelete: "CASCADE",
      comment: "Foreign key reference to variants table"
    },
    materialId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: "materials",
        key: "id"
      },
      onUpdate: "CASCADE",
      onDelete: "CASCADE",
      comment: "Foreign key reference to materials table (null if using sauce)"
    },
    sauceId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: "sauces",
        key: "id"
      },
      onUpdate: "CASCADE",
      onDelete: "CASCADE",
      comment: "Foreign key reference to sauces table (null if using material)"
    },
    quantity: {
      type: DataTypes.DECIMAL(10, 6),
      allowNull: false,
      validate: {
        min: { args: [0], msg: "Quantity cannot be negative" }
      },
      comment: "Quantity of ingredient needed for this variant"
    },
    unit: {
      type: DataTypes.STRING(50),
      allowNull: false,
      validate: {
        notEmpty: { msg: "Unit cannot be empty" }
      },
      comment: "Unit of measurement for the ingredient"
    },
    cost: {
      type: DataTypes.DECIMAL(10, 6),
      allowNull: false,
      defaultValue: 0,
      validate: {
        min: { args: [0], msg: "Cost cannot be negative" }
      },
      comment: "Calculated cost for this ingredient in this variant"
    },
    sortOrder: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      comment: "Sort order for displaying ingredients"
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
      comment: "Whether this ingredient is active in the variant"
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: "Optional notes about this ingredient in the variant"
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
    tableName: "variantIngredients",
    timestamps: true,
    indexes: [
      {
        fields: ["variantId"],
        name: "idx_variant_ingredients_variant_id"
      },
      {
        fields: ["materialId"],
        name: "idx_variant_ingredients_material_id"
      },
      {
        fields: ["sauceId"],
        name: "idx_variant_ingredients_sauce_id"
      },
      {
        fields: ["variantId", "sortOrder"],
        name: "idx_variant_ingredients_variant_sort"
      },
      {
        fields: ["variantId", "isActive"],
        name: "idx_variant_ingredients_variant_active"
      }
    ],
    validate: {
      eitherMaterialOrSauce() {
        if ((this.materialId && this.sauceId) || (!this.materialId && !this.sauceId)) {
          throw new Error("Must specify either materialId or sauceId, but not both");
        }
      }
    }
  }
);

export default VariantIngredient;

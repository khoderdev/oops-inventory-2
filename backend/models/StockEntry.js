import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";
import Material from "./materials.js";
import Printer from "./Printer.js";

const StockEntry = sequelize.define(
  "StockEntry",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    materialId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: Material,
        key: "id"
      }
    },
    supplier: {
      type: DataTypes.STRING,
      allowNull: true
    },
    purchasedQuantity: {
      type: DataTypes.DECIMAL(10, 0),
      allowNull: true
    },
    purchasedUnit: {
      type: DataTypes.STRING,
      allowNull: true
    },
    purchasedIndividualQuantity: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    purchasedIndividualUnit: {
      type: DataTypes.STRING,
      allowNull: true
    },
    purchasedConvertedUnit: {
      type: DataTypes.STRING,
      allowNull: true
    },
    purchasedConvertedQuantity: {
      type: DataTypes.DECIMAL(10, 0),
      allowNull: true
    },
    costPerPurchasedUnit: {
      type: DataTypes.DECIMAL(10, 6),
      allowNull: true,
      get() {
        const rawValue = this.getDataValue('costPerPurchasedUnit');
        if (rawValue === null || rawValue === undefined) return null;
        // Remove trailing zeros and unnecessary decimal point
        return parseFloat(rawValue).toString();
      }
    },
    costPerBaseUnit: {
      type: DataTypes.DECIMAL(10, 6),
      allowNull: true
    },
    totalCost: {
      type: DataTypes.DECIMAL(10, 6),
      allowNull: true,
      get() {
        const rawValue = this.getDataValue('totalCost');
        if (rawValue === null || rawValue === undefined) return null;
        // For currency, keep 2 decimal places but remove trailing zeros
        const formatted = parseFloat(rawValue).toFixed(2);
        return parseFloat(formatted).toString();
      }
    },
    printerId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: Printer,
        key: "id"
      },
      comment: "Assigned printer for this stock entry item when used in POS orders"
    },
    purchaseDate: {
      type: DataTypes.DATE,
      allowNull: true
    },
    expiryDate: {
      type: DataTypes.DATE,
      allowNull: true
    },
    isPOSItem: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      comment: "Whether this material should be visible in the POS system"
    }
  },
  {
    tableName: "stockEntries",
    timestamps: true,
    hooks: {
      beforeCreate: async (stockEntry, options) => {
        await calculateConvertedValues(stockEntry);
      },
      beforeUpdate: async (stockEntry, options) => {
        await calculateConvertedValues(stockEntry);
      }
    }
  }
);

// Helper function to check if a unit is a mass unit
function isMassUnit(unit) {
  return ["kg", "g", "lb", "oz"].includes(unit.toLowerCase());
}

// Helper function to check if a unit is a volume unit
function isVolumeUnit(unit) {
  return ["l", "ml", "gallon", "qt", "pt"].includes(unit.toLowerCase());
}

// Helper function to convert any mass unit to grams
function convertMassToGrams(value, fromUnit) {
  const unitsToGrams = {
    kg: 1000,
    g: 1,
    lb: 453.592,
    oz: 28.3495
  };

  const conversionFactor = unitsToGrams[fromUnit.toLowerCase()];
  if (!conversionFactor) {
    console.warn(`Unknown mass unit: ${fromUnit}, returning original value`);
    return value;
  }

  return value * conversionFactor;
}

// Helper function to convert any volume unit to milliliters
function convertVolumeToMilliliters(value, fromUnit) {
  const unitsToMilliliters = {
    l: 1000,
    ml: 1,
    gallon: 3785.41,
    qt: 946.353,
    pt: 473.176
  };

  const conversionFactor = unitsToMilliliters[fromUnit.toLowerCase()];
  if (!conversionFactor) {
    console.warn(`Unknown volume unit: ${fromUnit}, returning original value`);
    return value;
  }

  return value * conversionFactor;
}

// Helper function to calculate converted values
async function calculateConvertedValues(stockEntry) {
  try {
    const material = await Material.findByPk(stockEntry.materialId);
    if (!material) {
      console.warn(`Material not found for stockEntry with materialId: ${stockEntry.materialId}`);
      stockEntry.purchasedConvertedQuantity = stockEntry.purchasedQuantity;
      stockEntry.purchasedConvertedUnit = stockEntry.purchasedUnit;
      return;
    }

    const isMassMaterial = material.unitType === "mass" && isMassUnit(stockEntry.purchasedUnit);
    const isVolumeMaterial = material.unitType === "volume" && isVolumeUnit(stockEntry.purchasedUnit);

    if (isMassMaterial) {
      const convertedQuantity = convertMassToGrams(stockEntry.purchasedQuantity, stockEntry.purchasedUnit);
      stockEntry.purchasedConvertedQuantity = Math.round(convertedQuantity);
      stockEntry.purchasedConvertedUnit = "g";
    } else if (isVolumeMaterial) {
      const convertedQuantity = convertVolumeToMilliliters(stockEntry.purchasedQuantity, stockEntry.purchasedUnit);
      stockEntry.purchasedConvertedQuantity = Math.round(convertedQuantity);
      stockEntry.purchasedConvertedUnit = "ml";
    } else {
      // For non-mass and non-volume materials, keep original values
      stockEntry.purchasedConvertedQuantity = stockEntry.purchasedQuantity;
      stockEntry.purchasedConvertedUnit = stockEntry.purchasedUnit;
    }
  } catch (error) {
    console.error("Error calculating converted values:", error);
    stockEntry.purchasedConvertedQuantity = stockEntry.purchasedQuantity;
    stockEntry.purchasedConvertedUnit = stockEntry.purchasedUnit;
  }
}

export default StockEntry;

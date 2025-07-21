// import { DataTypes } from "sequelize";
// import sequelize from "../config/database.js";
// import Material from "./materials.js";

// const StockEntry = sequelize.define(
//   "StockEntry",
//   {
//     id: {
//       type: DataTypes.INTEGER,
//       primaryKey: true,
//       autoIncrement: true
//     },
//     materialId: {
//       type: DataTypes.INTEGER,
//       allowNull: false,
//       references: {
//         model: Material,
//         key: "id"
//       }
//     },
//     supplier: {
//       type: DataTypes.STRING,
//       allowNull: true
//     },
//     purchasedQuantity: {
//       type: DataTypes.DECIMAL(10, 3),
//       allowNull: true
//     },
//     purchasedUnit: {
//       type: DataTypes.STRING,
//       allowNull: true
//     },
//     purchasedIndividualQuantity: {
//       type: DataTypes.INTEGER,
//       allowNull: true
//     },
//     purchasedIndividualUnit: {
//       type: DataTypes.STRING,
//       allowNull: true
//     },
//     purchasedConvertedUnit: {
//       type: DataTypes.STRING,
//       allowNull: true
//     },
//     purchasedConvertedQuantity: {
//       type: DataTypes.DECIMAL(10, 0),
//       allowNull: true
//     },
//     costPerPurchasedUnit: {
//       type: DataTypes.DECIMAL(10, 2),
//       allowNull: true
//     },
//     costPerBaseUnit: {
//       type: DataTypes.DECIMAL(10, 2),
//       allowNull: true
//     },
//     totalCost: {
//       type: DataTypes.DECIMAL(10, 2),
//       allowNull: true
//     },
//     purchaseDate: {
//       type: DataTypes.DATE,
//       allowNull: true
//     },
//     expiryDate: {
//       type: DataTypes.DATE,
//       allowNull: true
//     }
//   },
//   {
//     tableName: "stockEntries",
//     timestamps: true,
//     hooks: {
//       // Hook to automatically calculate converted values before creating
//       beforeCreate: async (stockEntry, options) => {
//         await calculateConvertedValues(stockEntry);
//       },
//       // Hook to automatically calculate converted values before updating
//       beforeUpdate: async (stockEntry, options) => {
//         await calculateConvertedValues(stockEntry);
//       }
//     }
//   }
// );

// // Helper function to check if a unit is a mass unit
// function isMassUnit(unit) {
//   return ["kg", "g", "lb", "oz"].includes(unit.toLowerCase());
// }

// // Helper function to convert any mass unit to grams
// function convertMassToGrams(value, fromUnit) {
//   const unitsToGrams = {
//     kg: 1000,
//     g: 1,
//     lb: 453.592,
//     oz: 28.3495
//   };

//   const conversionFactor = unitsToGrams[fromUnit.toLowerCase()];
//   if (!conversionFactor) {
//     console.warn(`Unknown mass unit: ${fromUnit}, returning original value`);
//     return value;
//   }

//   return value * conversionFactor;
// }

// // Helper function to calculate converted values
// async function calculateConvertedValues(stockEntry) {
//   try {
//     // Get the associated material
//     const material = await Material.findByPk(stockEntry.materialId);
//     if (!material) {
//       console.warn(`Material not found for stockEntry with materialId: ${stockEntry.materialId}`);
//       // Set fallback values
//       stockEntry.purchasedConvertedQuantity = stockEntry.purchasedQuantity;
//       stockEntry.purchasedConvertedUnit = stockEntry.purchasedUnit;
//       return;
//     }

//     // Check if this is a mass unit that needs conversion
//     const isMassMaterial = material.unitType === "mass" && isMassUnit(stockEntry.purchasedUnit);

//     if (!isMassMaterial) {
//       // No conversion needed - set values as-is
//       stockEntry.purchasedConvertedQuantity = stockEntry.purchasedQuantity;
//       stockEntry.purchasedConvertedUnit = stockEntry.purchasedUnit;
//       return;
//     }
//     const convertedQuantity = convertMassToGrams(stockEntry.purchasedQuantity, stockEntry.purchasedUnit);
//     stockEntry.purchasedConvertedQuantity = Math.round(convertedQuantity);
//     stockEntry.purchasedConvertedUnit = "g";
//   } catch (error) {
//     console.error("Error calculating converted values:", error);
//     console.error("Stack trace:", error.stack);
//     // Set fallback values if conversion fails
//     stockEntry.purchasedConvertedQuantity = stockEntry.purchasedQuantity;
//     stockEntry.purchasedConvertedUnit = stockEntry.purchasedUnit;
//   }
// }

// export default StockEntry;

import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";
import Material from "./materials.js";

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
      type: DataTypes.DECIMAL(10, 3),
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
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true
    },
    costPerBaseUnit: {
      type: DataTypes.DECIMAL(10, 6), // Supports 6 decimal places
      allowNull: true
    },
    totalCost: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true
    },
    purchaseDate: {
      type: DataTypes.DATE,
      allowNull: true
    },
    expiryDate: {
      type: DataTypes.DATE,
      allowNull: true
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

    if (!isMassMaterial) {
      stockEntry.purchasedConvertedQuantity = stockEntry.purchasedQuantity;
      stockEntry.purchasedConvertedUnit = stockEntry.purchasedUnit;
      return;
    }
    const convertedQuantity = convertMassToGrams(stockEntry.purchasedQuantity, stockEntry.purchasedUnit);
    stockEntry.purchasedConvertedQuantity = Math.round(convertedQuantity);
    stockEntry.purchasedConvertedUnit = "g";
  } catch (error) {
    console.error("Error calculating converted values:", error);
    stockEntry.purchasedConvertedQuantity = stockEntry.purchasedQuantity;
    stockEntry.purchasedConvertedUnit = stockEntry.purchasedUnit;
  }
}

export default StockEntry;

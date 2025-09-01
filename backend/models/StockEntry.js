import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";
import Material from "./materials.js";
import Printer from "./Printer.js";

const StockEntry = sequelize.define(
  "StockEntry",
  {
    // ==========================================
    // CORE IDENTIFICATION
    // ==========================================
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

    // ==========================================
    // PURCHASE INFORMATION
    // ==========================================
    purchaseDate: {
      type: DataTypes.DATE,
      allowNull: true
    },
    expiryDate: {
      type: DataTypes.DATE,
      allowNull: true
    },

    // ==========================================
    // QUANTITY & UNITS (Raw Purchase Data)
    // ==========================================
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

    // ==========================================
    // CONVERTED VALUES (Normalized)
    // ==========================================
    purchasedConvertedQuantity: {
      type: DataTypes.DECIMAL(10, 0),
      allowNull: true
    },
    purchasedConvertedUnit: {
      type: DataTypes.STRING,
      allowNull: true
    },

    // ==========================================
    // COST INFORMATION
    // ==========================================
    totalCost: {
      type: DataTypes.DECIMAL(10, 6),
      allowNull: true,
      get() {
        const rawValue = this.getDataValue("totalCost");
        if (rawValue === null || rawValue === undefined) return null;
        // For currency, keep 2 decimal places but remove trailing zeros
        const formatted = parseFloat(rawValue).toFixed(2);
        return parseFloat(formatted).toString();
      }
    },
    costPerPurchasedUnit: {
      type: DataTypes.DECIMAL(10, 6),
      allowNull: true,
      get() {
        const rawValue = this.getDataValue("costPerPurchasedUnit");
        if (rawValue === null || rawValue === undefined) return null;
        // Remove trailing zeros and unnecessary decimal point
        return parseFloat(rawValue).toString();
      }
    },
    costPerBaseUnit: {
      type: DataTypes.DECIMAL(10, 6),
      allowNull: true
    },

    // ==========================================
    // VOLUME CALCULATIONS (Beverages)
    // ==========================================
    volumePerUnit: {
      type: DataTypes.DECIMAL(10, 3),
      allowNull: true,
      comment: "Volume per individual unit (e.g., 75cl per bottle)"
    },
    volumeUnit: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: "Unit for volumePerUnit (ml, cl, l, etc.)"
    },
    totalVolume: {
      type: DataTypes.DECIMAL(15, 3),
      allowNull: true,
      comment: "Total volume available (volumePerUnit × individual quantity)"
    },
    costPerVolumeUnit: {
      type: DataTypes.DECIMAL(10, 6),
      allowNull: true,
      comment: "Cost per volume unit (e.g., cost per cl)"
    },

    // ==========================================
    // MASS CALCULATIONS (Ingredients)
    // ==========================================
    massPerUnit: {
      type: DataTypes.DECIMAL(10, 3),
      allowNull: true,
      comment: "Mass per individual unit (e.g., 500g per bag)"
    },
    massUnit: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: "Unit for massPerUnit (g, kg, lb, etc.)"
    },
    totalMass: {
      type: DataTypes.DECIMAL(15, 3),
      allowNull: true,
      comment: "Total mass available (massPerUnit × individual quantity)"
    },
    costPerMassUnit: {
      type: DataTypes.DECIMAL(10, 6),
      allowNull: true,
      comment: "Cost per mass unit (e.g., cost per gram)"
    },

    // ==========================================
    // PACKAGE/PIECE CALCULATIONS (Supplies)
    // ==========================================
    piecesPerPackage: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: "Number of pieces per package (e.g., 50 napkins per pack)"
    },
    totalPieces: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: "Total pieces available (piecesPerPackage × package quantity)"
    },
    costPerPiece: {
      type: DataTypes.DECIMAL(10, 6),
      allowNull: true,
      comment: "Cost per individual piece"
    },
    unitDescription: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: "Description of the unit (e.g., 'napkins', 'cups', 'plates')"
    },

    // ==========================================
    // SYSTEM CONFIGURATION
    // ==========================================
    isPOSItem: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      comment: "Whether this material should be visible in the POS system"
    },
    printerId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: Printer,
        key: "id"
      },
      comment: "Assigned printer for this stock entry item when used in POS orders"
    }
  },
  {
    tableName: "stockEntries",
    timestamps: true,
    hooks: {
      beforeCreate: async (stockEntry, options) => {
        await calculateConvertedValues(stockEntry, options);
        await calculateEnhancedValues(stockEntry, options);
      },
      beforeUpdate: async (stockEntry, options) => {
        await calculateConvertedValues(stockEntry, options);
        await calculateEnhancedValues(stockEntry, options);
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
async function calculateConvertedValues(stockEntry, options) {
  try {
    const material = await Material.findByPk(stockEntry.materialId, { transaction: options?.transaction });
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

// Helper function to calculate enhanced values for all material types
async function calculateEnhancedValues(stockEntry, options) {
  try {
    const material = await Material.findByPk(stockEntry.materialId, { transaction: options?.transaction });
    if (!material) {
      console.warn(`Material not found for enhanced calculations with materialId: ${stockEntry.materialId}`);
      return;
    }

    // Check if this is a manual update (totalVolume being explicitly set)
    const isManualVolumeUpdate = stockEntry.changed("totalVolume") && stockEntry.totalVolume !== null;
    const isManualMassUpdate = stockEntry.changed("totalMass") && stockEntry.totalMass !== null;
    const isManualPiecesUpdate = stockEntry.changed("totalPieces") && stockEntry.totalPieces !== null;

    // Clear all enhanced fields first (but preserve manually set values)
    const preservedTotalVolume = isManualVolumeUpdate ? stockEntry.totalVolume : null;
    const preservedTotalMass = isManualMassUpdate ? stockEntry.totalMass : null;
    const preservedTotalPieces = isManualPiecesUpdate ? stockEntry.totalPieces : null;

    clearEnhancedFields(stockEntry);

    // Restore manually set values
    if (preservedTotalVolume !== null) stockEntry.totalVolume = preservedTotalVolume;
    if (preservedTotalMass !== null) stockEntry.totalMass = preservedTotalMass;
    if (preservedTotalPieces !== null) stockEntry.totalPieces = preservedTotalPieces;

    const individualQuantity = parseFloat(stockEntry.purchasedIndividualQuantity || 0);
    const totalCost = parseFloat(stockEntry.totalCost || 0);

    // Volume calculations for beverage materials (both volume and package types with volume data)
    if ((material.unitType === "volume" || material.unitType === "package") && material.volumePerUnit && material.volumeUnit && individualQuantity > 0) {
      stockEntry.volumePerUnit = material.volumePerUnit;
      stockEntry.volumeUnit = material.volumeUnit;

      // Only recalculate totalVolume if it wasn't manually set
      if (!isManualVolumeUpdate) {
        const totalVolume = individualQuantity * parseFloat(material.volumePerUnit);
        stockEntry.totalVolume = Math.round(totalVolume * 1000) / 1000;
        console.log(`🍺 [Volume] ${material.name}: ${individualQuantity} × ${material.volumePerUnit}${material.volumeUnit} = ${stockEntry.totalVolume}${material.volumeUnit}`);
      } else {
        console.log(`🔒 [Volume] ${material.name}: Manual totalVolume preserved: ${stockEntry.totalVolume}${material.volumeUnit}`);
      }

      // Always recalculate cost per unit based on current totalVolume
      if (totalCost > 0 && stockEntry.totalVolume > 0) {
        stockEntry.costPerVolumeUnit = Math.round((totalCost / stockEntry.totalVolume) * 1000000) / 1000000;
      }
    }

    // Mass calculations for mass materials
    else if (material.unitType === "mass" && material.massPerUnit && material.massUnit && individualQuantity > 0) {
      stockEntry.massPerUnit = material.massPerUnit;
      stockEntry.massUnit = material.massUnit;
      stockEntry.unitDescription = material.unitDescription;

      const totalMass = individualQuantity * parseFloat(material.massPerUnit);
      stockEntry.totalMass = Math.round(totalMass * 1000) / 1000;

      if (totalCost > 0 && totalMass > 0) {
        stockEntry.costPerMassUnit = Math.round((totalCost / totalMass) * 1000000) / 1000000;
      }

      console.log(`⚖️ [Mass] ${material.name}: ${individualQuantity} × ${material.massPerUnit}${material.massUnit} = ${stockEntry.totalMass}${material.massUnit}`);
    }

    // Package calculations for package materials (only if no volume data)
    else if (
      material.unitType === "package" &&
      !material.volumePerUnit && // Only if no volume data
      (material.piecesPerPackage || material.packageQuantity) &&
      stockEntry.purchasedQuantity > 0
    ) {
      const piecesPerPkg = material.piecesPerPackage || material.packageQuantity;
      stockEntry.piecesPerPackage = piecesPerPkg;
      stockEntry.unitDescription = material.unitDescription;

      const totalPieces = parseFloat(stockEntry.purchasedQuantity) * piecesPerPkg;
      stockEntry.totalPieces = Math.round(totalPieces);

      if (totalCost > 0 && totalPieces > 0) {
        stockEntry.costPerPiece = Math.round((totalCost / totalPieces) * 1000000) / 1000000;
      }

      console.log(`📦 [Package] ${material.name}: ${stockEntry.purchasedQuantity} × ${piecesPerPkg} = ${stockEntry.totalPieces} ${material.unitDescription || "pieces"}`);
    }

    // Individual piece calculations for piece materials
    else if (material.unitType === "piece" && individualQuantity > 0) {
      stockEntry.unitDescription = material.unitDescription;
      stockEntry.totalPieces = Math.round(individualQuantity);

      if (totalCost > 0 && individualQuantity > 0) {
        stockEntry.costPerPiece = Math.round((totalCost / individualQuantity) * 1000000) / 1000000;
      }

      console.log(`🔧 [Piece] ${material.name}: ${individualQuantity} ${material.unitDescription || "pieces"}`);
    }
  } catch (error) {
    console.error("Error calculating enhanced values:", error);
    clearEnhancedFields(stockEntry);
  }
}

// Helper function to clear all enhanced calculation fields
function clearEnhancedFields(stockEntry) {
  // Volume fields
  stockEntry.volumePerUnit = null;
  stockEntry.volumeUnit = null;
  stockEntry.totalVolume = null;
  stockEntry.costPerVolumeUnit = null;

  // Mass fields
  stockEntry.massPerUnit = null;
  stockEntry.massUnit = null;
  stockEntry.totalMass = null;
  stockEntry.costPerMassUnit = null;

  // Package/piece fields
  stockEntry.piecesPerPackage = null;
  stockEntry.totalPieces = null;
  stockEntry.costPerPiece = null;
  stockEntry.unitDescription = null;
}

export default StockEntry;

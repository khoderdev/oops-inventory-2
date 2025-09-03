import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";
import Material from "./materials.js";
import Printer from "./Printer.js";
import StockCalculationService from "../services/stockCalculationService.js";

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

    // ==========================================
    // CONVERTED VALUES (Normalized)
    // ==========================================
    purchasedConvertedQuantity: {
      type: DataTypes.DECIMAL(10, 3),
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
        await calculateStockValues(stockEntry, options);
      },
      beforeUpdate: async (stockEntry, options) => {
        await calculateStockValues(stockEntry, options);
      }
    }
  }
);

/**
 * Simplified stock calculation hook using the unified service
 */
async function calculateStockValues(stockEntry, options) {
  try {
    // Skip calculation if this is a manual update with explicit values
    const hasManualValues = stockEntry.changed("totalVolume") || 
                           stockEntry.changed("totalMass") || 
                           stockEntry.changed("totalPieces") ||
                           stockEntry.changed("massUnit") ||
                           stockEntry.changed("massPerUnit") ||
                           stockEntry.changed("costPerMassUnit");

    if (hasManualValues) {
      console.log(`🔒 [calculateStockValues] Manual values detected, preserving user input`);
      return;
    }

    const material = await Material.findByPk(stockEntry.materialId, { transaction: options?.transaction });
    if (!material) {
      console.warn(`Material not found for stockEntry with materialId: ${stockEntry.materialId}`);
      return;
    }

    // Use the unified calculation service
    const calculatedValues = StockCalculationService.calculateAllValues({
      purchasedQuantity: stockEntry.purchasedQuantity,
      purchasedUnit: stockEntry.purchasedUnit,
      totalCost: stockEntry.totalCost
    }, material);

    // Apply calculated values to stock entry
    Object.assign(stockEntry, calculatedValues);

    console.log(`✅ [calculateStockValues] Calculated values for ${material.name}:`, {
      individualQuantity: calculatedValues.purchasedIndividualQuantity,
      convertedQuantity: calculatedValues.purchasedConvertedQuantity,
      totalVolume: calculatedValues.totalVolume,
      totalMass: calculatedValues.totalMass,
      totalPieces: calculatedValues.totalPieces
    });

  } catch (error) {
    console.error("Error calculating stock values:", error);
    // Fallback to basic values
    stockEntry.purchasedConvertedQuantity = stockEntry.purchasedQuantity;
    stockEntry.purchasedConvertedUnit = stockEntry.purchasedUnit;
    stockEntry.purchasedIndividualQuantity = stockEntry.purchasedQuantity;
    stockEntry.purchasedIndividualUnit = stockEntry.purchasedUnit;
  }
}

export default StockEntry;

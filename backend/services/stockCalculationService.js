import { convertVolume, convertToMl, isValidBeverageUnit, getMaterialVolumeUnit } from "../utils/volumeConversionUtils.js";

/**
 * Unified Stock Calculation Service
 * Consolidates all conversion and calculation logic for stock entries
 */
class StockCalculationService {
  
  /**
   * Mass unit conversion factors (to grams)
   */
  static MASS_CONVERSIONS = {
    kg: 1000,
    g: 1,
    lb: 453.592,
    oz: 28.3495
  };

  /**
   * Volume unit conversion factors (to milliliters)
   */
  static VOLUME_CONVERSIONS = {
    l: 1000,
    ml: 1,
    cl: 10,
    dl: 100,
    gallon: 3785.41,
    qt: 946.353,
    pt: 473.176
  };

  /**
   * Check if a unit is a mass unit
   */
  static isMassUnit(unit) {
    return Object.keys(this.MASS_CONVERSIONS).includes(unit.toLowerCase());
  }

  /**
   * Check if a unit is a volume unit
   */
  static isVolumeUnit(unit) {
    return Object.keys(this.VOLUME_CONVERSIONS).includes(unit.toLowerCase()) || isValidBeverageUnit(unit);
  }

  /**
   * Convert mass to grams
   */
  static convertMassToGrams(value, fromUnit) {
    const conversionFactor = this.MASS_CONVERSIONS[fromUnit.toLowerCase()];
    if (!conversionFactor) {
      console.warn(`Unknown mass unit: ${fromUnit}, returning original value`);
      return value;
    }
    return value * conversionFactor;
  }

  /**
   * Convert volume to milliliters using enhanced conversion system
   */
  static convertVolumeToMl(value, fromUnit, material = null) {
    try {
      // Use enhanced conversion system if material context is available
      if (material && isValidBeverageUnit(fromUnit)) {
        return convertToMl(value, fromUnit, material);
      }
      
      // Fallback to basic conversion
      const conversionFactor = this.VOLUME_CONVERSIONS[fromUnit.toLowerCase()];
      if (!conversionFactor) {
        console.warn(`Unknown volume unit: ${fromUnit}, returning original value`);
        return value;
      }
      return value * conversionFactor;
    } catch (error) {
      console.error(`Volume conversion failed: ${value} ${fromUnit}`, error);
      return value;
    }
  }

  /**
   * Calculate individual quantity and unit based on material type
   */
  static calculateIndividualQuantity(purchasedQuantity, purchasedUnit, material) {
    let individualQuantity = purchasedQuantity;
    let individualUnit = purchasedUnit;

    if (material.unitType === "package" && material.packageQuantity && material.packageQuantity > 0) {
      if (purchasedUnit === material.inputUnit) {
        // Purchasing by boxes/packs - multiply by packageQuantity
        individualQuantity = Math.round(purchasedQuantity * material.packageQuantity);
        individualUnit = material.baseUnit;
      } else if (purchasedUnit === material.baseUnit) {
        // Purchasing by individual units - keep as is
        individualQuantity = purchasedQuantity;
        individualUnit = material.baseUnit;
      } else {
        // Default behavior - multiply by packageQuantity
        individualQuantity = Math.round(purchasedQuantity * material.packageQuantity);
        individualUnit = material.baseUnit;
      }
    } else if (material.unitType === "mass") {
      if (this.isMassUnit(purchasedUnit)) {
        individualQuantity = Math.round(this.convertMassToGrams(purchasedQuantity, purchasedUnit));
        individualUnit = material.baseUnit || "g";
      }
    } else if (material.unitType === "volume") {
      if (this.isVolumeUnit(purchasedUnit)) {
        const materialVolumeUnit = getMaterialVolumeUnit(material);
        if (isValidBeverageUnit(purchasedUnit)) {
          individualQuantity = Math.round(convertVolume(purchasedQuantity, purchasedUnit, materialVolumeUnit, material) * 1000) / 1000;
          individualUnit = materialVolumeUnit;
        } else {
          individualQuantity = Math.round(this.convertVolumeToMl(purchasedQuantity, purchasedUnit));
          individualUnit = material.baseUnit || "ml";
        }
      }
    }

    return { individualQuantity, individualUnit };
  }

  /**
   * Calculate converted quantity and unit for normalization
   */
  static calculateConvertedQuantity(purchasedQuantity, purchasedUnit, individualQuantity, individualUnit, material) {
    let convertedQuantity = purchasedQuantity;
    let convertedUnit = purchasedUnit;

    if (material.unitType === "mass" && this.isMassUnit(purchasedUnit)) {
      convertedQuantity = Math.round(this.convertMassToGrams(purchasedQuantity, purchasedUnit) * 1000) / 1000;
      convertedUnit = "g";
    } else if (material.unitType === "volume" && this.isVolumeUnit(purchasedUnit)) {
      convertedQuantity = Math.round(this.convertVolumeToMl(purchasedQuantity, purchasedUnit, material) * 1000) / 1000;
      convertedUnit = "ml";
    } else if (material.unitType === "package") {
      convertedQuantity = purchasedQuantity;
      convertedUnit = purchasedUnit;
    } else {
      convertedQuantity = individualQuantity;
      convertedUnit = individualUnit;
    }

    return { convertedQuantity, convertedUnit };
  }

  /**
   * Calculate enhanced values (totalVolume, totalMass, totalPieces, costs)
   */
  static calculateEnhancedValues(stockEntry, material, totalCost) {
    const individualQuantity = parseFloat(stockEntry.purchasedIndividualQuantity || 0);
    const enhancedValues = {
      // Volume fields
      volumePerUnit: null,
      volumeUnit: null,
      totalVolume: null,
      costPerVolumeUnit: null,
      
      // Mass fields
      massPerUnit: null,
      massUnit: null,
      totalMass: null,
      costPerMassUnit: null,
      
      // Package/piece fields
      piecesPerPackage: null,
      totalPieces: null,
      costPerPiece: null,
      unitDescription: null
    };

    // Volume calculations for beverage materials
    if ((material.unitType === "volume" || material.unitType === "package") && 
        material.volumePerUnit && material.volumeUnit && individualQuantity > 0) {
      
      enhancedValues.volumePerUnit = material.volumePerUnit;
      enhancedValues.volumeUnit = material.volumeUnit;
      enhancedValues.totalVolume = Math.round(individualQuantity * parseFloat(material.volumePerUnit) * 1000) / 1000;
      
      if (totalCost > 0 && enhancedValues.totalVolume > 0) {
        enhancedValues.costPerVolumeUnit = parseFloat((totalCost / enhancedValues.totalVolume).toFixed(6));
      } else {
        enhancedValues.costPerVolumeUnit = 0;
      }
    }
    
    // Mass calculations for mass materials
    else if (material.unitType === "mass") {
      // Always set mass fields for mass materials
      enhancedValues.massUnit = "g"; // Standardize to grams
      
      if (material.massPerUnit && material.massUnit) {
        enhancedValues.massPerUnit = material.massPerUnit;
        enhancedValues.totalMass = Math.round(individualQuantity * parseFloat(material.massPerUnit) * 1000) / 1000;
      } else {
        // Calculate from purchased unit if material doesn't have mass data
        const purchasedUnit = stockEntry.purchasedUnit;
        if (this.isMassUnit(purchasedUnit)) {
          const conversionFactor = this.MASS_CONVERSIONS[purchasedUnit.toLowerCase()] || 1;
          enhancedValues.massPerUnit = conversionFactor;
          enhancedValues.totalMass = Math.round(parseFloat(stockEntry.purchasedQuantity) * conversionFactor * 1000) / 1000;
        } else {
          enhancedValues.massPerUnit = 1;
          enhancedValues.totalMass = individualQuantity;
        }
      }
      
      enhancedValues.unitDescription = material.unitDescription;
      
      if (totalCost > 0 && enhancedValues.totalMass > 0) {
        enhancedValues.costPerMassUnit = Math.round((totalCost / enhancedValues.totalMass) * 1000000) / 1000000;
      } else {
        enhancedValues.costPerMassUnit = 0;
      }
    }
    
    // Package calculations for package materials (only if no volume data)
    else if (material.unitType === "package" && 
             !material.volumePerUnit && 
             (material.piecesPerPackage || material.packageQuantity) &&
             stockEntry.purchasedQuantity > 0) {
      
      const piecesPerPkg = material.piecesPerPackage || material.packageQuantity;
      enhancedValues.piecesPerPackage = piecesPerPkg;
      enhancedValues.unitDescription = material.unitDescription;
      enhancedValues.totalPieces = Math.round(parseFloat(stockEntry.purchasedQuantity) * piecesPerPkg);
      
      if (totalCost > 0 && enhancedValues.totalPieces > 0) {
        enhancedValues.costPerPiece = Math.round((totalCost / enhancedValues.totalPieces) * 1000000) / 1000000;
      } else {
        enhancedValues.costPerPiece = 0;
      }
    }
    
    // Individual piece calculations for piece materials
    else if (material.unitType === "piece" && individualQuantity > 0) {
      enhancedValues.unitDescription = material.unitDescription;
      enhancedValues.totalPieces = Math.round(individualQuantity);
      
      if (totalCost > 0 && individualQuantity > 0) {
        enhancedValues.costPerPiece = Math.round((totalCost / individualQuantity) * 1000000) / 1000000;
      } else {
        enhancedValues.costPerPiece = 0;
      }
    }

    return enhancedValues;
  }

  /**
   * Calculate all stock entry values in one operation
   */
  static calculateAllValues(stockEntryData, material) {
    const { purchasedQuantity, purchasedUnit, totalCost } = stockEntryData;
    
    // Calculate individual quantity and unit
    const { individualQuantity, individualUnit } = this.calculateIndividualQuantity(
      purchasedQuantity, purchasedUnit, material
    );
    
    // Calculate converted quantity and unit
    const { convertedQuantity, convertedUnit } = this.calculateConvertedQuantity(
      purchasedQuantity, purchasedUnit, individualQuantity, individualUnit, material
    );
    
    // Calculate enhanced values
    const enhancedValues = this.calculateEnhancedValues(
      { ...stockEntryData, purchasedIndividualQuantity: individualQuantity }, 
      material, 
      totalCost
    );
    
    return {
      purchasedIndividualQuantity: individualQuantity,
      purchasedIndividualUnit: individualUnit,
      purchasedConvertedQuantity: convertedQuantity,
      purchasedConvertedUnit: convertedUnit,
      ...enhancedValues
    };
  }
}

export default StockCalculationService;

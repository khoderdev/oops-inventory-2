/**
 * Comprehensive Volume Conversion Utility for Beverage Management
 * Handles all standard volume units and beverage-specific conversions
 */

// Volume conversion factors to milliliters (ml) as base unit
export const VOLUME_CONVERSIONS = {
  // Metric units
  ml: 1,
  cl: 10,
  dl: 100,
  l: 1000,
  
  // Imperial units
  fl_oz: 29.5735,  // Fluid ounce
  cup: 236.588,    // US cup
  pt: 473.176,     // US pint
  qt: 946.353,     // US quart
  gal: 3785.41,    // US gallon
  
  // UK Imperial units
  uk_fl_oz: 28.4131,
  uk_pt: 568.261,
  uk_qt: 1136.52,
  uk_gal: 4546.09,
  
  // Common beverage units
  shot: 44.36,     // Standard shot (1.5 fl oz)
  jigger: 44.36,   // Same as shot
  pony: 29.57,     // 1 fl oz
  
  // Package units (these need material-specific context)
  bottle: null,    // Requires material.volumePerUnit
  can: null,       // Requires material.volumePerUnit
  glass: null,     // Requires material.volumePerUnit
  serving: null,   // Requires material.volumePerUnit
  portion: null,   // Requires material.volumePerUnit
  unit: null,      // Requires material.volumePerUnit
  piece: null      // Requires material.volumePerUnit
};

// Valid volume units for beverage variants
export const VALID_BEVERAGE_UNITS = [
  'ml', 'cl', 'dl', 'l',
  'fl_oz', 'cup', 'pt', 'qt', 'gal',
  'uk_fl_oz', 'uk_pt', 'uk_qt', 'uk_gal',
  'shot', 'jigger', 'pony'
];

// Package units that require material context
export const PACKAGE_UNITS = [
  'bottle', 'can', 'glass', 'serving', 'portion', 'unit', 'piece'
];

/**
 * Convert volume from one unit to another with material context support
 * @param {number} value - The value to convert
 * @param {string} fromUnit - The unit to convert from
 * @param {string} toUnit - The unit to convert to
 * @param {Object} materialContext - Optional material context for package units
 * @returns {number} The converted value
 */
export function convertVolume(value, fromUnit, toUnit, materialContext = null) {
  if (fromUnit === toUnit) return value;
  
  // Handle package units with material context
  if ((fromUnit === 'bottle' || fromUnit === 'can' || fromUnit === 'package') && materialContext) {
    const volumePerUnit = materialContext.volumePerUnit || materialContext.volume || 700; // Default 700ml
    const volumeUnit = materialContext.volumeUnit || 'ml';
    
    console.log(`🔄 Converting ${value} ${fromUnit} to ${toUnit} using material context: ${volumePerUnit}${volumeUnit} per unit`);
    
    // Convert package to volume first
    const totalVolume = value * volumePerUnit;
    console.log(`🔄 Package to volume: ${value} × ${volumePerUnit} = ${totalVolume}${volumeUnit}`);
    
    // Use direct conversion to avoid recursion
    if (volumeUnit === toUnit) {
      return totalVolume;
    } else {
      return convertVolumeStandard(totalVolume, volumeUnit, toUnit);
    }
  }
  
  if ((toUnit === 'bottle' || toUnit === 'can' || toUnit === 'package') && materialContext) {
    const volumePerUnit = materialContext.volumePerUnit || materialContext.volume || 700; // Default 700ml
    const volumeUnit = materialContext.volumeUnit || 'ml';
    
    console.log(`🔄 Converting ${value} ${fromUnit} to ${toUnit} using material context: ${volumePerUnit}${volumeUnit} per unit`);
    
    // Convert to volume first, then to packages
    const volumeInTargetUnit = convertVolumeStandard(value, fromUnit, volumeUnit);
    const packageCount = volumeInTargetUnit / volumePerUnit;
    console.log(`🔄 Volume to package: ${volumeInTargetUnit}${volumeUnit} ÷ ${volumePerUnit} = ${packageCount} ${toUnit}`);
    return packageCount;
  }
  
  // Standard volume conversions
  return convertVolumeStandard(value, fromUnit, toUnit);
}

/**
 * Standard volume conversion without material context (prevents recursion)
 */
function convertVolumeStandard(value, fromUnit, toUnit) {
  if (fromUnit === toUnit) return value;
  
  // Convert to ml first
  let mlValue = value;
  
  switch (fromUnit.toLowerCase()) {
    case 'l': case 'liter': case 'litre':
      mlValue = value * 1000;
      break;
    case 'cl': case 'centiliter': case 'centilitre':
      mlValue = value * 10;
      break;
    case 'dl': case 'deciliter': case 'decilitre':
      mlValue = value * 100;
      break;
    case 'fl_oz': case 'fluid_ounce':
      mlValue = value * 29.5735;
      break;
    case 'cup':
      mlValue = value * 236.588;
      break;
    case 'pt': case 'pint':
      mlValue = value * 473.176;
      break;
    case 'qt': case 'quart':
      mlValue = value * 946.353;
      break;
    case 'gal': case 'gallon':
      mlValue = value * 3785.41;
      break;
    case 'ml': case 'milliliter': case 'millilitre':
      mlValue = value;
      break;
    default:
      mlValue = value; // Assume ml if unknown
  }
  
  // Convert from ml to target unit
  switch (toUnit.toLowerCase()) {
    case 'l': case 'liter': case 'litre':
      return mlValue / 1000;
    case 'cl': case 'centiliter': case 'centilitre':
      return mlValue / 10;
    case 'dl': case 'deciliter': case 'decilitre':
      return mlValue / 100;
    case 'fl_oz': case 'fluid_ounce':
      return mlValue / 29.5735;
    case 'cup':
      return mlValue / 236.588;
    case 'pt': case 'pint':
      return mlValue / 473.176;
    case 'qt': case 'quart':
      return mlValue / 946.353;
    case 'gal': case 'gallon':
      return mlValue / 3785.41;
    case 'ml': case 'milliliter': case 'millilitre':
      return mlValue;
    default:
      return mlValue; // Return ml if unknown target unit
  }
}

/**
 * Enhanced conversion with automatic material context fetching
 * @param {number} value - The value to convert
 * @param {string} fromUnit - The unit to convert from
 * @param {string} toUnit - The unit to convert to
 * @param {Object} material - Material object with volumePerUnit and volumeUnit
 * @returns {number} The converted value
 */
export function convertVolumeWithMaterial(value, fromUnit, toUnit, material) {
  if (fromUnit === toUnit) return value;
  
  // Create material context from material object
  const materialContext = {
    volumePerUnit: material.volumePerUnit,
    volumeUnit: material.volumeUnit || 'ml',
    volume: material.volumePerUnit // Alias for compatibility
  };
  
  console.log(`🔄 Converting with material context: ${material.name} (${materialContext.volumePerUnit}${materialContext.volumeUnit} per unit)`);
  
  return convertVolume(value, fromUnit, toUnit, materialContext);
}

/**
 * Convert volume to milliliters (base unit)
 * @param {number} volume - Volume amount
 * @param {string} unit - Volume unit
 * @param {Object} materialContext - Material info for package units
 * @returns {number} Volume in milliliters
 */
export const convertToMl = (volume, unit, materialContext = null) => {
  return convertVolume(volume, unit, 'ml', materialContext);
};

/**
 * Convert volume from milliliters to target unit
 * @param {number} volumeInMl - Volume in milliliters
 * @param {string} targetUnit - Target unit
 * @param {Object} materialContext - Material info for package units
 * @returns {number} Converted volume
 */
export const convertFromMl = (volumeInMl, targetUnit, materialContext = null) => {
  return convertVolume(volumeInMl, 'ml', targetUnit, materialContext);
};

/**
 * Calculate deduction from calculated total fields (aligned with stock deduction logic)
 * @param {Object} stockEntry - Stock entry with calculated total fields
 * @param {number} variantVolume - Volume of the variant being sold
 * @param {string} variantUnit - Unit of the variant volume
 * @param {number} quantity - Quantity being sold
 * @returns {Object} Deduction details for calculated total fields
 */
export const calculateTotalVolumeDeduction = (stockEntry, variantVolume, variantUnit, quantity) => {
  try {
    if (!stockEntry.totalVolume || stockEntry.totalVolume <= 0) {
      console.warn('Stock entry has no totalVolume available for deduction');
      return {
        deductionAmount: 0,
        isValid: false,
        message: 'No volume available in totalVolume field'
      };
    }

    // Convert variant volume to ml for consistent calculation
    const variantVolumeInMl = convertToMl(variantVolume, variantUnit);
    const totalDeductionInMl = variantVolumeInMl * quantity;

    // Convert back to the stock entry's volume unit if needed
    const stockVolumeUnit = stockEntry.volumeUnit || 'ml';
    const deductionAmount = convertVolume(totalDeductionInMl, 'ml', stockVolumeUnit);

    const result = {
      deductionAmount,
      variantVolumeInMl,
      totalDeductionInMl,
      stockVolumeUnit,
      availableVolume: stockEntry.totalVolume,
      isValid: stockEntry.totalVolume >= deductionAmount,
      message: stockEntry.totalVolume >= deductionAmount 
        ? 'Sufficient volume available in totalVolume' 
        : `Insufficient volume: ${stockEntry.totalVolume} available, ${deductionAmount} required`
    };

    console.log(`🥃 [calculateTotalVolumeDeduction] Result:`, result);
    return result;
  } catch (error) {
    console.error(`❌ [calculateTotalVolumeDeduction] Error:`, error);
    throw new Error(`Failed to calculate total volume deduction: ${error.message}`);
  }
};

/**
 * Legacy beverage deduction calculation (kept for backward compatibility)
 * @param {number} variantVolume - Volume of the variant
 * @param {string} variantUnit - Unit of the variant
 * @param {Object} material - Material object with volume info
 * @param {number} orderQuantity - Number of variants ordered
 * @returns {Object} Deduction details
 */
export const calculateBeverageDeduction = (variantVolume, variantUnit, material, orderQuantity = 1) => {
  try {
    // Get material volume per unit
    const materialVolumePerUnit = getMaterialVolumePerUnit(material);
    const materialUnit = getMaterialVolumeUnit(material);
    
    console.log(` [calculateBeverageDeduction] Input:`, {
      variantVolume,
      variantUnit,
      materialName: material.name,
      materialVolumePerUnit,
      materialUnit,
      orderQuantity
    });
    
    // Convert variant volume to ml
    const variantVolumeInMl = convertToMl(variantVolume, variantUnit);
    
    // Convert material volume to ml
    const materialVolumeInMl = convertToMl(materialVolumePerUnit, materialUnit, material);
    
    // Calculate how many material units are needed
    const totalVariantVolumeInMl = variantVolumeInMl * orderQuantity;
    const unitsNeeded = totalVariantVolumeInMl / materialVolumeInMl;
    
    // For beverages, we typically need whole units (bottles, cans, etc.)
    const wholeUnitsNeeded = Math.ceil(unitsNeeded);
    
    // Calculate waste (if any)
    const actualVolumeUsed = wholeUnitsNeeded * materialVolumeInMl;
    const wasteVolumeInMl = actualVolumeUsed - totalVariantVolumeInMl;
    const wastePercentage = (wasteVolumeInMl / actualVolumeUsed) * 100;
    
    const result = {
      unitsToDeduct: wholeUnitsNeeded,
      exactUnitsNeeded: unitsNeeded,
      variantVolumeInMl,
      materialVolumeInMl,
      totalVariantVolumeInMl,
      actualVolumeUsed,
      wasteVolumeInMl,
      wastePercentage: Math.round(wastePercentage * 100) / 100,
      materialUnit: material.baseUnit || 'unit'
    };
    
    console.log(`✅ [calculateBeverageDeduction] Result:`, result);
    
    return result;
  } catch (error) {
    console.error(`❌ [calculateBeverageDeduction] Error:`, error);
    throw new Error(`Failed to calculate beverage deduction: ${error.message}`);
  }
};

/**
 * Validate if a unit is valid for beverage variants
 * @param {string} unit - Unit to validate
 * @returns {boolean} True if valid
 */
export const isValidBeverageUnit = (unit) => {
  const normalizedUnit = normalizeUnit(unit);
  return VALID_BEVERAGE_UNITS.includes(normalizedUnit);
};

/**
 * Get material volume per unit with fallbacks
 * @param {Object} material - Material object
 * @returns {number} Volume per unit
 */
export const getMaterialVolumePerUnit = (material) => {
  // Priority order for volume information
  if (material.volumePerUnit && material.volumePerUnit > 0) {
    return material.volumePerUnit;
  }
  
  // Fallback to packageQuantity if it represents volume
  if (material.unitType === 'volume' && material.packageQuantity && material.packageQuantity > 0) {
    return material.packageQuantity;
  }
  
  // Common beverage defaults (in ml)
  const commonBeverageVolumes = {
    'coca cola': 330,
    'pepsi': 330,
    'sprite': 330,
    '7up': 330,
    'mirinda': 330,
    'fanta': 330,
    'beer': 330,
    'water': 500,
    'juice': 250,
    'energy drink': 250,
    'coffee': 240,
    'tea': 240,
    'wine': 750,
    'champagne': 750,
    'whiskey': 750,
    'vodka': 750,
    'rum': 750,
    'gin': 750
  };
  
  // Try to match by name
  const materialNameLower = material.name.toLowerCase();
  for (const [beverage, volume] of Object.entries(commonBeverageVolumes)) {
    if (materialNameLower.includes(beverage)) {
      console.log(`📋 [getMaterialVolumePerUnit] Using default volume for ${material.name}: ${volume}ml`);
      return volume;
    }
  }
  
  // Final fallback
  console.warn(`⚠️ [getMaterialVolumePerUnit] No volume info found for ${material.name}, using default 330ml`);
  return 330; // Standard bottle/can size
};

/**
 * Get material volume unit with fallbacks
 * @param {Object} material - Material object
 * @returns {string} Volume unit
 */
export const getMaterialVolumeUnit = (material) => {
  // Priority order for unit information
  if (material.volumeUnit) {
    return material.volumeUnit;
  }
  
  if (material.unitType === 'volume' && material.baseUnit) {
    return material.baseUnit;
  }
  
  // Default to ml for beverages
  return 'ml';
};

/**
 * Normalize unit names to handle variations
 * @param {string} unit - Unit to normalize
 * @returns {string} Normalized unit
 */
const normalizeUnit = (unit) => {
  if (!unit) return 'ml';
  
  const unitLower = unit.toLowerCase().trim();
  
  // Handle common variations
  const unitMappings = {
    'milliliter': 'ml',
    'millilitre': 'ml',
    'centiliter': 'cl',
    'centilitre': 'cl',
    'deciliter': 'dl',
    'decilitre': 'dl',
    'liter': 'l',
    'litre': 'l',
    'ounce': 'fl_oz',
    'oz': 'fl_oz',
    'fluid ounce': 'fl_oz',
    'pint': 'pt',
    'quart': 'qt',
    'gallon': 'gal',
    'bottles': 'bottle',
    'cans': 'can',
    'glasses': 'glass',
    'servings': 'serving',
    'portions': 'portion',
    'units': 'unit',
    'pieces': 'piece',
    'pc': 'piece',
    'pcs': 'piece'
  };
  
  return unitMappings[unitLower] || unitLower;
};

/**
 * Get conversion factor for a unit
 * @param {string} unit - Normalized unit
 * @param {Object} materialContext - Material context for package units
 * @returns {number|null} Conversion factor to ml
 */
const getConversionFactor = (unit, materialContext = null) => {
  // Direct conversion available
  if (VOLUME_CONVERSIONS[unit] !== undefined && VOLUME_CONVERSIONS[unit] !== null) {
    return VOLUME_CONVERSIONS[unit];
  }
  
  // Package unit requiring material context
  if (PACKAGE_UNITS.includes(unit)) {
    if (!materialContext) {
      return null;
    }
    
    const volumePerUnit = getMaterialVolumePerUnit(materialContext);
    const volumeUnit = getMaterialVolumeUnit(materialContext);
    
    // If material volume is already in ml, return it directly
    if (volumeUnit === 'ml') {
      return volumePerUnit;
    }
    
    // Convert material volume to ml
    const volumeUnitFactor = VOLUME_CONVERSIONS[volumeUnit];
    if (volumeUnitFactor) {
      return volumePerUnit * volumeUnitFactor;
    }
  }
  
  return null;
};

/**
 * Format volume for display
 * @param {number} volume - Volume amount
 * @param {string} unit - Volume unit
 * @returns {string} Formatted volume string
 */
export const formatVolume = (volume, unit) => {
  if (!volume || volume <= 0) return '0';
  
  const rounded = Math.round(volume * 1000) / 1000;
  return `${rounded} ${unit}`;
};

/**
 * Get suggested units for a volume amount
 * @param {number} volumeInMl - Volume in milliliters
 * @returns {Array} Array of suggested unit conversions
 */
export const getSuggestedUnits = (volumeInMl) => {
  const suggestions = [];
  
  if (volumeInMl >= 1000) {
    suggestions.push({ unit: 'l', value: volumeInMl / 1000 });
  }
  if (volumeInMl >= 100) {
    suggestions.push({ unit: 'dl', value: volumeInMl / 100 });
  }
  if (volumeInMl >= 10) {
    suggestions.push({ unit: 'cl', value: volumeInMl / 10 });
  }
  suggestions.push({ unit: 'ml', value: volumeInMl });
  
  return suggestions.filter(s => s.value > 0);
};

/**
 * Calculate beverage variant deduction using calculated total fields
 * Updated to work with backend stock deduction logic that uses totalVolume, totalMass, totalPieces
 */
export function calculateSourceFraction(variantVolume, variantUnit, sourceVolume, sourceUnit) {
  const normalizedVariantVolume = convertVolume(variantVolume, variantUnit, 'ml');
  const normalizedSourceVolume = convertVolume(sourceVolume, sourceUnit, 'ml');
  return normalizedVariantVolume / normalizedSourceVolume;
}

export function calculateDeductionAmount(variantVolume, variantUnit, sourceVolume, sourceUnit, quantity) {
  const fractionPerUnit = calculateSourceFraction(variantVolume, variantUnit, sourceVolume, sourceUnit);
  return fractionPerUnit * quantity;
}

/**
 * Validate if stock entry has sufficient volume for deduction
 * @param {Object} stockEntry - Stock entry with calculated total fields
 * @param {number} deductionAmount - Amount to deduct
 * @returns {Object} Validation result with isValid and message
 */
export function validateVolumeDeduction(stockEntry, deductionAmount) {
  const availableVolume = stockEntry.totalVolume || 0;
  const isValid = availableVolume >= deductionAmount;
  
  return {
    isValid,
    availableVolume,
    deductionAmount,
    message: isValid 
      ? 'Sufficient volume available' 
      : `Insufficient volume: ${availableVolume} available, ${deductionAmount} required`
  };
}

export function logVariantDeduction(menuItemName, variantName, variantVolume, variantUnit, sourceVolume, sourceUnit, quantity, deductionAmount) {
  const normalizedVariantVolume = convertVolume(variantVolume, variantUnit, 'ml');
  const normalizedSourceVolume = convertVolume(sourceVolume, sourceUnit, 'ml');
  const totalDeducted = normalizedVariantVolume * quantity;
  
  console.log(`🥃 Beverage Variant Deduction (Using Calculated Totals):
  - Menu Item: ${menuItemName}
  - Variant: ${variantName} (${variantVolume}${variantUnit})
  - Source: ${sourceVolume}${sourceUnit} (${normalizedSourceVolume}ml)
  - Quantity Sold: ${quantity}
  - Volume Per Unit: ${normalizedVariantVolume}ml
  - Total Volume Deducted: ${totalDeducted}ml
  - Fraction of Source: ${(deductionAmount * 100).toFixed(2)}%
  - Note: Deduction applied to totalVolume field`);
}

export default {
  VOLUME_CONVERSIONS,
  VALID_BEVERAGE_UNITS,
  PACKAGE_UNITS,
  convertVolume,
  convertToMl,
  convertFromMl,
  calculateBeverageDeduction,
  calculateTotalVolumeDeduction,
  calculateSourceFraction,
  calculateDeductionAmount,
  validateVolumeDeduction,
  logVariantDeduction,
  isValidBeverageUnit,
  getMaterialVolumePerUnit,
  getMaterialVolumeUnit,
  formatVolume,
  getSuggestedUnits
};

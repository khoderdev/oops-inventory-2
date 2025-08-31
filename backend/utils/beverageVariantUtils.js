/**
 * Enhanced Backend Unit Conversion System
 * Aligned with frontend UNIT_DEFINITIONS for consistency
 */

// Comprehensive unit definitions matching frontend system
export const UNIT_DEFINITIONS = {
  // Mass units
  kg: { name: "kilogram", baseQuantity: 1, baseUnit: "kg", category: "mass" },
  g: { name: "gram", baseQuantity: 0.001, baseUnit: "kg", category: "mass" },
  mg: { name: "milligram", baseQuantity: 0.000001, baseUnit: "kg", category: "mass" },
  lb: { name: "pound", baseQuantity: 0.453592, baseUnit: "kg", category: "mass" },
  oz: { name: "ounce", baseQuantity: 0.0283495, baseUnit: "kg", category: "mass" },
  ton: { name: "metric ton", baseQuantity: 1000, baseUnit: "kg", category: "mass" },

  // Volume units
  l: { name: "liter", baseQuantity: 1, baseUnit: "liter", category: "volume" },
  ml: { name: "milliliter", baseQuantity: 0.001, baseUnit: "liter", category: "volume" },
  cl: { name: "centiliter", baseQuantity: 0.01, baseUnit: "liter", category: "volume" },
  dl: { name: "deciliter", baseQuantity: 0.1, baseUnit: "liter", category: "volume" },
  fl_oz: { name: "fluid ounce", baseQuantity: 0.0295735, baseUnit: "liter", category: "volume" },
  gallon: { name: "gallon", baseQuantity: 3.78541, baseUnit: "liter", category: "volume" },
  quart: { name: "quart", baseQuantity: 0.946353, baseUnit: "liter", category: "volume" },
  pint: { name: "pint", baseQuantity: 0.473176, baseUnit: "liter", category: "volume" },
  cup: { name: "cup", baseQuantity: 0.236588, baseUnit: "liter", category: "volume" },

  // Piece units
  piece: { name: "piece", baseQuantity: 1, baseUnit: "piece", category: "piece" },
  item: { name: "item", baseQuantity: 1, baseUnit: "piece", category: "piece" },
  unit: { name: "unit", baseQuantity: 1, baseUnit: "piece", category: "piece" },
  each: { name: "each", baseQuantity: 1, baseUnit: "piece", category: "piece" },
  dozen: { name: "dozen", baseQuantity: 12, baseUnit: "piece", category: "piece" },

  // Package units
  box: { name: "box", baseQuantity: 1, baseUnit: "box", category: "package" },
  pack: { name: "pack", baseQuantity: 1, baseUnit: "pack", category: "package" },
  case: { name: "case", baseQuantity: 1, baseUnit: "case", category: "package" },
  bottle: { name: "bottle", baseQuantity: 1, baseUnit: "bottle", category: "package" },
  can: { name: "can", baseQuantity: 1, baseUnit: "can", category: "package" },
  jar: { name: "jar", baseQuantity: 1, baseUnit: "jar", category: "package" }
};

// Updated unit options matching frontend
export const UNIT_OPTIONS = {
  mass: ["kg", "g", "mg", "lb", "oz", "ton"],
  volume: ["l", "ml", "cl", "dl", "fl_oz", "gallon", "quart", "pint", "cup"],
  piece: ["piece", "item", "unit", "each", "dozen"],
  package: ["box", "pack", "case", "bottle", "can", "jar"]
};

/**
 * Enhanced unit conversion using UNIT_DEFINITIONS
 */
export function convertUnits(value, fromUnit, toUnit, packageQuantity = null, materialContext = null) {
  if (!value || value <= 0) return 0;
  if (fromUnit === toUnit) return value;

  const fromDef = UNIT_DEFINITIONS[fromUnit];
  const toDef = UNIT_DEFINITIONS[toUnit];

  if (!fromDef || !toDef) {
    console.warn(`Unknown units: ${fromUnit} or ${toUnit}`);
    return value;
  }

  // Same category conversion
  if (fromDef.category === toDef.category && fromDef.baseUnit === toDef.baseUnit) {
    return (value * fromDef.baseQuantity) / toDef.baseQuantity;
  }

  // Package unit conversion
  if (fromDef.category === 'package' || toDef.category === 'package') {
    if (packageQuantity && packageQuantity > 0) {
      if (fromDef.category === 'package') {
        return value * packageQuantity;
      } else if (toDef.category === 'package') {
        return value / packageQuantity;
      }
    }
  }

  console.warn(`Cannot convert between different unit categories: ${fromUnit} (${fromDef.category}) to ${toUnit} (${toDef.category})`);
  return value;
}

/**
 * Enhanced volume conversion with comprehensive unit support
 */
export function convertVolume(value, fromUnit, toUnit) {
  if (!fromUnit || !toUnit) {
    console.warn(`Invalid volume units: fromUnit=${fromUnit}, toUnit=${toUnit}`);
    return value;
  }
  if (fromUnit === toUnit) return value;

  // Normalize unit names
  const normalizedFrom = normalizeVolumeUnit(fromUnit);
  const normalizedTo = normalizeVolumeUnit(toUnit);

  const fromDef = UNIT_DEFINITIONS[normalizedFrom];
  const toDef = UNIT_DEFINITIONS[normalizedTo];

  if (fromDef && toDef && fromDef.category === 'volume' && toDef.category === 'volume') {
    return (value * fromDef.baseQuantity) / toDef.baseQuantity;
  }

  // Fallback to legacy conversion for compatibility
  return legacyVolumeConversion(value, fromUnit, toUnit);
}

/**
 * Enhanced mass conversion
 */
export function convertMass(value, fromUnit, toUnit) {
  if (!fromUnit || !toUnit) return value;
  if (fromUnit === toUnit) return value;

  const fromDef = UNIT_DEFINITIONS[fromUnit];
  const toDef = UNIT_DEFINITIONS[toUnit];

  if (fromDef && toDef && fromDef.category === 'mass' && toDef.category === 'mass') {
    return (value * fromDef.baseQuantity) / toDef.baseQuantity;
  }

  console.warn(`Cannot convert mass units: ${fromUnit} to ${toUnit}`);
  return value;
}

/**
 * Normalize volume unit names for compatibility
 */
function normalizeVolumeUnit(unit) {
  const unitLower = unit.toLowerCase().trim();
  const mappings = {
    'milliliter': 'ml', 'millilitre': 'ml',
    'centiliter': 'cl', 'centilitre': 'cl', 
    'deciliter': 'dl', 'decilitre': 'dl',
    'liter': 'l', 'litre': 'l',
    'fluid ounce': 'fl_oz', 'fl oz': 'fl_oz', 'ounce': 'fl_oz'
  };
  return mappings[unitLower] || unit;
}

/**
 * Legacy volume conversion for backward compatibility
 */
function legacyVolumeConversion(value, fromUnit, toUnit) {
  const normalizedFrom = fromUnit.toLowerCase();
  const normalizedTo = toUnit.toLowerCase();

  let ml;
  switch (normalizedFrom) {
    case "l": case "liter": case "liters": ml = value * 1000; break;
    case "ml": case "milliliter": case "milliliters": ml = value; break;
    case "cl": case "centiliter": case "centiliters": ml = value * 10; break;
    case "dl": case "deciliter": case "deciliters": ml = value * 100; break;
    case "gal": case "gallon": case "gallons": ml = value * 3785.41; break;
    case "fl oz": case "fluid ounce": case "fluid ounces": ml = value * 29.5735; break;
    default: console.error(`Unknown volume unit: ${fromUnit}`); return value;
  }

  switch (normalizedTo) {
    case "l": case "liter": case "liters": return ml / 1000;
    case "ml": case "milliliter": case "milliliters": return ml;
    case "cl": case "centiliter": case "centiliters": return ml / 10;
    case "dl": case "deciliter": case "deciliters": return ml / 100;
    case "gal": case "gallon": case "gallons": return ml / 3785.41;
    case "fl oz": case "fluid ounce": case "fluid ounces": return ml / 29.5735;
    default: console.error(`Unknown volume unit: ${toUnit}`); return value;
  }
}

/**
 * Calculate beverage variant deduction using enhanced conversions
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

export function logVariantDeduction(menuItemName, variantName, variantVolume, variantUnit, sourceVolume, sourceUnit, quantity, deductionAmount) {
  const normalizedVariantVolume = convertVolume(variantVolume, variantUnit, 'ml');
  const normalizedSourceVolume = convertVolume(sourceVolume, sourceUnit, 'ml');
  const totalDeducted = normalizedVariantVolume * quantity;
  
  console.log(`🥃 Beverage Variant Deduction:
  - Menu Item: ${menuItemName}
  - Variant: ${variantName} (${variantVolume}${variantUnit})
  - Source: ${sourceVolume}${sourceUnit} (${normalizedSourceVolume}ml)
  - Quantity Sold: ${quantity}
  - Volume Per Unit: ${normalizedVariantVolume}ml
  - Total Volume Deducted: ${totalDeducted}ml
  - Fraction of Source: ${(deductionAmount * 100).toFixed(2)}%`);
}

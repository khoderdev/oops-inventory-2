import { CalculationBreakdown, ConversionInput, PackagedGood } from "@/types/conversion";
import { Material } from "@/types/inventory";

export const MASS_CONVERSIONS = {
  kg: { toGrams: 1000, toLbs: 2.20462 },
  gram: { toKg: 0.001, toLbs: 0.00220462 },
  lb: { toKg: 0.453592, toGrams: 453.592 }
};

export const VOLUME_CONVERSIONS = {
  l: { toMl: 1000, toGallon: 0.264172 },
  ml: { toLiter: 0.001, toGallon: 0.000264172 },
  gallon: { toLiter: 3.78541, toMl: 3785.41 }
};

// Convert between mass units
export function convertMass(value: number, fromUnit: string | undefined, toUnit: string | undefined): number {
  if (!fromUnit || !toUnit) {
    console.warn(`Invalid mass units: fromUnit=${fromUnit}, toUnit=${toUnit}`);
    return value;
  }
  if (fromUnit === toUnit) return value;

  const normalizedFrom = fromUnit.toLowerCase();
  const normalizedTo = toUnit.toLowerCase();

  let grams: number;
  switch (normalizedFrom) {
    case "kg":
    case "kgs":
      grams = value * 1000;
      break;
    case "g":
    case "gram":
    case "grams":
      grams = value;
      break;
    case "lb":
    case "lbs":
    case "pound":
    case "pounds":
      grams = value * 453.592;
      break;
    case "oz":
    case "ounce":
    case "ounces":
      grams = value * 28.3495;
      break;
    default:
      console.error(`Unknown mass unit: ${fromUnit}`);
      return value;
  }

  switch (normalizedTo) {
    case "kg":
    case "kgs":
      return grams / 1000;
    case "g":
    case "gram":
    case "grams":
      return grams;
    case "lb":
    case "lbs":
    case "pound":
    case "pounds":
      return grams / 453.592;
    case "oz":
    case "ounce":
    case "ounces":
      return grams / 28.3495;
    default:
      console.error(`Unknown mass unit: ${toUnit}`);
      return value;
  }
}

// Convert between volume units
export function convertVolume(value: number, fromUnit: string | undefined, toUnit: string | undefined): number {
  if (!fromUnit || !toUnit) {
    console.warn(`Invalid volume units: fromUnit=${fromUnit}, toUnit=${toUnit}`);
    return value;
  }
  if (fromUnit === toUnit) return value;

  const normalizedFrom = fromUnit.toLowerCase();
  const normalizedTo = toUnit.toLowerCase();

  let ml: number;
  switch (normalizedFrom) {
    case "l":
    case "liter":
    case "liters":
      ml = value * 1000;
      break;
    case "ml":
    case "milliliter":
    case "milliliters":
      ml = value;
      break;
    case "gal":
    case "gallon":
    case "gallons":
      ml = value * 3785.41;
      break;
    case "fl oz":
    case "fluid ounce":
    case "fluid ounces":
      ml = value * 29.5735;
      break;
    default:
      console.error(`Unknown volume unit: ${fromUnit}`);
      return value;
  }

  switch (normalizedTo) {
    case "l":
    case "liter":
    case "liters":
      return ml / 1000;
    case "ml":
    case "milliliter":
    case "milliliters":
      return ml;
    case "gal":
    case "gallon":
    case "gallons":
      return ml / 3785.41;
    case "fl oz":
    case "fluid ounce":
    case "fluid ounces":
      return ml / 29.5735;
    default:
      console.error(`Unknown volume unit: ${toUnit}`);
      return value;
  }
}

export function calculateCostPerUnit(totalCost: number, totalQuantity: number): number {
  // Return the exact calculation result without rounding for backend
  return totalCost / totalQuantity;
}

export function calculateTotalCost(quantity: number, costPerUnit: number): number {
  // Return the exact calculation result without rounding for backend
  return quantity * costPerUnit;
}

export function calculateIngredientCost(material: Material, quantity: number, unit: string): number {
  const baseUnit = material.baseUnit;
  let normalizedQuantity = quantity;

  if (isMassUnit(unit) && isMassUnit(baseUnit)) {
    normalizedQuantity = convertMass(quantity, unit, baseUnit);
  } else if (isVolumeUnit(unit) && isVolumeUnit(baseUnit)) {
    normalizedQuantity = convertVolume(quantity, unit, baseUnit);
  } else if (unit !== baseUnit) {
    // If units don't match and aren't convertible, return 0 or handle error
    console.warn(`Cannot convert between incompatible units: ${unit} and ${baseUnit}`);
    return 0;
  }

  // Calculate cost based on normalized quantity - preserve exact value for backend
  return normalizedQuantity * material.costPerUnit;
}

export function formatCurrency(amount: number): string {
  // Handle invalid inputs (NaN, undefined, null)
  if (amount == null || isNaN(amount) || !isFinite(amount)) {
    return "$0.00";
  }

  // For very small amounts, use more decimal places and adjust minimum digits
  if (amount < 0.01 && amount > 0) {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 4,
      maximumFractionDigits: 6
    }).format(amount);
  }

  // For normal amounts, use standard formatting
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount);
}

export function formatCurrencyUI(amount: number): string {
  // Handle invalid inputs
  if (amount == null || isNaN(amount) || !isFinite(amount)) {
    return "$0.00";
  }
  
  // Handle recurring decimals like 8.333333333333334
  // Check if this is likely a recurring decimal by comparing rounded values
  const decimalPart = Math.abs(amount - Math.round(amount));
  
  // If it has significant decimal places
  if (decimalPart > 0.0001) {
    // Check for common recurring decimal patterns
    const decimalStr = amount.toString();
    
    // Pattern for 1/3 (0.3333...), 1/6 (0.1666...), 1/12 (0.0833...)
    if ((decimalStr.includes("33333") || decimalStr.includes("66666") || 
         decimalStr.includes("83333") || decimalStr.includes("16666") || 
         decimalStr.includes("41666") || decimalStr.includes("58333") || 
         decimalStr.includes("91666") || decimalStr.includes("08333") || 
         decimalStr.includes("25") && decimalStr.length > 6) || 
         (decimalStr.length > 8 && decimalStr.includes("."))) {
      
      // For recurring decimals, show 4 decimal places
      return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
        minimumFractionDigits: 4,
        maximumFractionDigits: 4
      }).format(amount);
    }
  }
  
  // Use standard formatting for normal amounts
  return formatCurrency(amount);
}

// Helper functions for unit type checking
export function isMassUnit(unit: string): boolean {
  if (!unit) return false;
  const normalized = unit.toLowerCase();
  return ["kg", "g", "mg", "lb", "lbs", "oz", "gram", "grams", "kilogram", "kilograms", "pound", "pounds", "ounce", "ounces"].includes(normalized);
}

export function isVolumeUnit(unit: string): boolean {
  if (!unit) return false;
  const normalized = unit.toLowerCase();
  return ["l", "ml", "gal", "qt", "pt", "liter", "liters", "milliliter", "milliliters", "gallon", "gallons", "quart", "quarts", "pint", "pints"].includes(normalized);
}

export function formatNumber(num: number | string | null | undefined, unit?: string): string {
  // Handle null or undefined values
  if (num === null || num === undefined) {
    return "0";
  }

  // Convert string input to number if needed
  if (typeof num === "string") {
    num = parseFloat(num);
    if (isNaN(num)) {
      console.warn("formatNumber received invalid num:", num);
      return "0";
    }
  }

  // Handle case where num is still not a number (shouldn't happen with TypeScript but good to check)
  if (typeof num !== "number" || isNaN(num)) {
    console.warn("formatNumber received invalid num:", num);
    return "0";
  }

  // Handle whole number units
  const wholeNumberUnits = ["piece", "unit", "each", "dozen", "package", "box", "case"];
  if (unit && wholeNumberUnits.includes(unit.toLowerCase())) {
    return Number.isInteger(num) ? num.toString() : num.toFixed(2);
  }

  // Determine decimal places based on unit type
  const decimals = (unit && isMassUnit(unit)) || (unit && isVolumeUnit(unit)) ? 3 : 2;

  // Format the number and remove trailing zeros after decimal
  return num.toFixed(decimals).replace(/\.?0+$/, "");
}

export function formatNumberUI(num: number | string | null | undefined, unit?: string): string {
  // Handle invalid inputs
  if (num === null || num === undefined) {
    return "0";
  }
  
  // Convert to number if needed
  const numValue = typeof num === "string" ? parseFloat(num) : num;
  if (typeof numValue !== "number" || isNaN(numValue)) {
    return "0";
  }
  
  // Handle recurring decimals like 8.333333333333334
  // Check if this is likely a recurring decimal by comparing rounded values
  const decimalPart = Math.abs(numValue - Math.round(numValue));
  
  // If it has significant decimal places
  if (decimalPart > 0.0001) {
    // Check for common recurring decimal patterns
    const numStr = numValue.toString();
    
    // Pattern for 1/3 (0.3333...), 1/6 (0.1666...), 1/12 (0.0833...)
    if ((numStr.includes("33333") || numStr.includes("66666") || 
         numStr.includes("83333") || numStr.includes("16666") || 
         numStr.includes("41666") || numStr.includes("58333") || 
         numStr.includes("91666") || numStr.includes("08333") || 
         numStr.includes("25") && numStr.length > 6) || 
         (numStr.length > 8 && numStr.includes("."))) {
      
      // For recurring decimals, show 4 decimal places
      return numValue.toFixed(4);
    }
  }
  
  // Otherwise use standard formatting
  return formatNumber(numValue, unit);
}

export function calculatePackagedGoodCost(packagedGood: PackagedGood, requestedQuantity: number, requestedUnit: string): CalculationBreakdown {
  const steps: string[] = [];

  // Calculate cost per individual unit - preserve exact value
  const costPerUnit = packagedGood.costPerPackage / packagedGood.unitsPerPackage;
  steps.push(`Cost per ${packagedGood.baseUnit}: $${packagedGood.costPerPackage} ÷ ${packagedGood.unitsPerPackage} = $${formatCurrencyUI(costPerUnit)}`);

  // If requesting in same unit as base unit
  if (requestedUnit === packagedGood.baseUnit) {
    const totalCost = costPerUnit * requestedQuantity;
    steps.push(`Total cost: $${formatCurrencyUI(costPerUnit)} × ${requestedQuantity} ${requestedUnit} = $${formatCurrencyUI(totalCost)}`);
    return {
      originalValue: requestedQuantity,
      originalUnit: requestedUnit,
      convertedValue: requestedQuantity,
      convertedUnit: packagedGood.baseUnit,
      costCalculation: `${requestedQuantity} × ${formatCurrencyUI(costPerUnit)}`,
      totalCost: totalCost, // Preserve exact value for backend
      steps
    };
  }

  // If units need conversion
  let convertedQuantity: number;
  if (isMassUnit(packagedGood.baseUnit) && isMassUnit(requestedUnit)) {
    convertedQuantity = convertMass(requestedQuantity, requestedUnit, packagedGood.baseUnit);
    steps.push(`Convert ${requestedQuantity} ${requestedUnit} to ${formatNumberUI(convertedQuantity)} ${packagedGood.baseUnit}`);
  } else if (isVolumeUnit(packagedGood.baseUnit) && isVolumeUnit(requestedUnit)) {
    convertedQuantity = convertVolume(requestedQuantity, requestedUnit, packagedGood.baseUnit);
    steps.push(`Convert ${requestedQuantity} ${requestedUnit} to ${formatNumberUI(convertedQuantity)} ${packagedGood.baseUnit}`);
  } else {
    // If units are incompatible
    steps.push(`Error: Cannot convert between ${requestedUnit} and ${packagedGood.baseUnit}`);
    return {
      originalValue: requestedQuantity,
      originalUnit: requestedUnit,
      convertedValue: 0,
      convertedUnit: packagedGood.baseUnit,
      costCalculation: "",
      totalCost: 0,
      steps
    };
  }

  const totalCost = costPerUnit * convertedQuantity;
  const costCalculation = `${formatNumberUI(convertedQuantity)} × ${formatCurrencyUI(costPerUnit)}`;
  steps.push(`Total cost: $${formatCurrencyUI(costPerUnit)} × ${formatNumberUI(convertedQuantity)} ${packagedGood.baseUnit} = $${formatCurrencyUI(totalCost)}`);

  return {
    originalValue: requestedQuantity,
    originalUnit: requestedUnit,
    convertedValue: convertedQuantity,
    convertedUnit: packagedGood.baseUnit,
    costCalculation,
    totalCost: totalCost, // Preserve exact value for backend
    steps
  };
}

export function performConversion(input: ConversionInput): CalculationBreakdown {
  const steps: string[] = [];
  let convertedValue: number;

  if (isMassUnit(input.fromUnit) && isMassUnit(input.toUnit)) {
    convertedValue = convertMass(input.value, input.fromUnit, input.toUnit);
    if (input.fromUnit !== input.toUnit) {
      steps.push(`Convert ${input.value} ${input.fromUnit} to ${input.toUnit}: ${formatNumberUI(convertedValue)} ${input.toUnit}`);
    }
  } else if (isVolumeUnit(input.fromUnit) && isVolumeUnit(input.toUnit)) {
    convertedValue = convertVolume(input.value, input.fromUnit, input.toUnit);
    if (input.fromUnit !== input.toUnit) {
      steps.push(`Convert ${input.value} ${input.fromUnit} to ${input.toUnit}: ${formatNumberUI(convertedValue)} ${input.toUnit}`);
    }
  } else {
    // No conversion needed or unsupported conversion
    convertedValue = input.value;
    steps.push(`No conversion needed: ${input.value} ${input.fromUnit}`);
  }

  // Calculate cost if provided - preserve exact values for backend
  let totalCost = 0;
  let costCalculation = "";

  if (input.costPer && input.costUnit) {
    if (input.costUnit === input.toUnit) {
      // Direct cost calculation - preserve exact value
      totalCost = convertedValue * input.costPer;
      costCalculation = `${formatNumberUI(convertedValue)} × ${formatCurrencyUI(input.costPer)}`;
      steps.push(`Cost calculation: ${costCalculation} = ${formatCurrencyUI(totalCost)}`);
    } else {
      // Need to convert cost unit to target unit - preserve exact values
      let costPerTargetUnit: number;

      if (isMassUnit(input.costUnit) && isMassUnit(input.toUnit)) {
        const oneUnitInCostUnit = convertMass(1, input.toUnit, input.costUnit);
        costPerTargetUnit = input.costPer * oneUnitInCostUnit;
      } else if (isVolumeUnit(input.costUnit) && isVolumeUnit(input.toUnit)) {
        const oneUnitInCostUnit = convertVolume(1, input.toUnit, input.costUnit);
        costPerTargetUnit = input.costPer * oneUnitInCostUnit;
      } else {
        costPerTargetUnit = input.costPer; // Fallback
      }

      totalCost = convertedValue * costPerTargetUnit;
      costCalculation = `${formatNumberUI(convertedValue)} × ${formatCurrencyUI(costPerTargetUnit)}`;
      steps.push(`Cost per ${input.toUnit}: ${formatCurrencyUI(input.costPer)} per ${input.costUnit} = ${formatCurrencyUI(costPerTargetUnit)} per ${input.toUnit}`);
      steps.push(`Total cost: ${costCalculation} = ${formatCurrencyUI(totalCost)}`);
    }
  }

  return {
    originalValue: input.value,
    originalUnit: input.fromUnit,
    convertedValue, // Preserve exact value for backend
    convertedUnit: input.toUnit,
    costCalculation,
    totalCost, // Preserve exact value for backend
    steps
  };
}

// Custom price formatter for POS items
export const formatPOSPrice = (amount: number): string => {
  if (amount == null || isNaN(amount) || !isFinite(amount)) {
    return "$0";
  }

  // Check if the number is a whole number (no decimal part)
  if (amount % 1 === 0) {
    return `$${amount}`;
  } else {
    // Has decimal places, format normally with decimals
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  }
};


/**
 * Format volume values for display:
 * - For values with decimals like 3.888888077, show only 6 decimal places
 * - For values with .00 decimals like 3.00, show only the integer part (3)
 */
export function formatVolume(value: number | string): string {
  // Convert to number if it's a string
  const numValue = typeof value === 'string' ? parseFloat(value) : value;
  
  // Handle invalid values
  if (numValue === null || numValue === undefined || isNaN(numValue)) {
    return '0';
  }
  
  // Check if it's a whole number (no decimal part)
  if (Number.isInteger(numValue)) {
    return numValue.toString();
  }
  
  // Check if it has only zeros after decimal point (like 3.00)
  if (numValue % 1 === 0) {
    return Math.floor(numValue).toString();
  }
  
  // For numbers with significant decimals, limit to 6 decimal places
  // and remove trailing zeros
  return numValue.toFixed(6).replace(/\.?0+$/, '');
}

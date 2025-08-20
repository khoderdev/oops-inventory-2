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
  
  // Check if the number has many decimal places (recurring decimals)
  const decimalStr = amount.toString();
  if (decimalStr.length > 6 && decimalStr.includes(".")) {
    // Format with 3 decimal places and add ellipsis for recurring decimals
    return `$${amount.toFixed(3)}...`;
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
  
  // Get the string representation to check decimal length
  const numStr = numValue.toString();
  
  // For recurring decimals (like 0.0833333...)
  if (numStr.length > 6 && numStr.includes(".")) {
    // Show 3 decimal places with ellipsis for long decimals
    return `${numValue.toFixed(3)}...`;
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

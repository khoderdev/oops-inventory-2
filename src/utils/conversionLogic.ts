import { CalculationBreakdown, ConversionInput, PackagedGood } from "@/types/conversion";

// Base conversion factors
export const MASS_CONVERSIONS = {
  kg: { toGrams: 1000, toLbs: 2.20462 },
  gram: { toKg: 0.001, toLbs: 0.00220462 },
  lb: { toKg: 0.453592, toGrams: 453.592 }
};

export const VOLUME_CONVERSIONS = {
  liter: { toMl: 1000, toGallon: 0.264172 },
  ml: { toLiter: 0.001, toGallon: 0.000264172 },
  gallon: { toLiter: 3.78541, toMl: 3785.41 }
};

// Convert between mass units
export function convertMass(value: number, fromUnit: string, toUnit: string): number {
  if (fromUnit === toUnit) return value;

  // Normalize units
  const normalizedFrom = fromUnit.toLowerCase();
  const normalizedTo = toUnit.toLowerCase();

  // Convert to grams first (base unit)
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
      throw new Error(`Unknown mass unit: ${fromUnit}`);
  }

  // Convert from grams to target unit
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
      throw new Error(`Unknown mass unit: ${toUnit}`);
  }
}

// Convert between volume units
export function convertVolume(value: number, fromUnit: string, toUnit: string): number {
  if (fromUnit === toUnit) return value;

  // Normalize units
  const normalizedFrom = fromUnit.toLowerCase();
  const normalizedTo = toUnit.toLowerCase();

  // Convert to ml first (base unit)
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
      throw new Error(`Unknown volume unit: ${fromUnit}`);
  }

  // Convert from ml to target unit
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
      throw new Error(`Unknown volume unit: ${toUnit}`);
  }
}
// Calculate cost per unit
export function calculateCostPerUnit(totalCost: number, totalQuantity: number, unit: string): number {
  return totalCost / totalQuantity;
}

// Calculate total cost for a given quantity
export function calculateTotalCost(quantity: number, costPerUnit: number): number {
  return quantity * costPerUnit;
}

// Handle packaged goods calculations
export function calculatePackagedGoodCost(packagedGood: PackagedGood, requestedQuantity: number, requestedUnit: string): CalculationBreakdown {
  const steps: string[] = [];

  // Calculate cost per individual unit
  const costPerUnit = packagedGood.costPerPackage / packagedGood.unitsPerPackage;
  steps.push(`Cost per ${packagedGood.baseUnit}: $${packagedGood.costPerPackage} ÷ ${packagedGood.unitsPerPackage} = $${costPerUnit.toFixed(4)}`);

  // If requesting in same unit as base unit
  if (requestedUnit.toLowerCase() === packagedGood.baseUnit.toLowerCase()) {
    const totalCost = requestedQuantity * costPerUnit;
    steps.push(`Total cost: ${requestedQuantity} × $${costPerUnit.toFixed(4)} = $${totalCost.toFixed(2)}`);

    return {
      originalValue: requestedQuantity,
      originalUnit: requestedUnit,
      convertedValue: requestedQuantity,
      convertedUnit: requestedUnit,
      costCalculation: `${requestedQuantity} × $${costPerUnit.toFixed(4)}`,
      totalCost,
      steps
    };
  }

  // Handle unit conversions if needed
  let convertedQuantity = requestedQuantity;
  let conversionUsed = false;

  // Check if we need mass or volume conversion
  if (isMassUnit(requestedUnit) && isMassUnit(packagedGood.baseUnit)) {
    convertedQuantity = convertMass(requestedQuantity, requestedUnit, packagedGood.baseUnit);
    conversionUsed = true;
    steps.push(`Convert ${requestedQuantity} ${requestedUnit} to ${packagedGood.baseUnit}: ${convertedQuantity.toFixed(3)} ${packagedGood.baseUnit}`);
  } else if (isVolumeUnit(requestedUnit) && isVolumeUnit(packagedGood.baseUnit)) {
    convertedQuantity = convertVolume(requestedQuantity, requestedUnit, packagedGood.baseUnit);
    conversionUsed = true;
    steps.push(`Convert ${requestedQuantity} ${requestedUnit} to ${packagedGood.baseUnit}: ${convertedQuantity.toFixed(3)} ${packagedGood.baseUnit}`);
  }

  const totalCost = convertedQuantity * costPerUnit;
  steps.push(`Total cost: ${convertedQuantity.toFixed(3)} × $${costPerUnit.toFixed(4)} = $${totalCost.toFixed(2)}`);

  return {
    originalValue: requestedQuantity,
    originalUnit: requestedUnit,
    convertedValue: convertedQuantity,
    convertedUnit: packagedGood.baseUnit,
    costCalculation: `${convertedQuantity.toFixed(3)} × $${costPerUnit.toFixed(4)}`,
    totalCost,
    steps
  };
}

// Utility functions
export function isMassUnit(unit: string): boolean {
  const normalized = unit.toLowerCase();
  return ["kg", "kgs", "g", "gram", "grams", "lb", "lbs", "pound", "pounds", "oz", "ounce", "ounces"].includes(normalized);
}

export function isVolumeUnit(unit: string): boolean {
  const normalized = unit.toLowerCase();
  return ["l", "liter", "liters", "ml", "milliliter", "milliliters", "gal", "gallon", "gallons", "fl oz", "fluid ounce", "fluid ounces"].includes(normalized);
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 4
  }).format(amount);
}

export function formatNumber(num: number, unit?: string): string {
  // For piece/unit items, show no decimals if whole number
  if (unit && ["piece", "unit", "each", "dozen", "package", "box", "case"].includes(unit.toLowerCase())) {
    return Number.isInteger(num) ? num.toString() : num.toFixed(2);
  }

  // For mass/volume, show 3 decimal places by default
  const decimals = (unit && isMassUnit(unit)) || (unit && isVolumeUnit(unit)) ? 3 : 2;
  return num.toFixed(decimals).replace(/\.?0+$/, "");
}

// Main conversion function with cost calculation
export function performConversion(input: ConversionInput): CalculationBreakdown {
  const steps: string[] = [];
  let convertedValue: number;
  const conversionFactor: number = 1;

  // Determine conversion type and perform conversion
  if (isMassUnit(input.fromUnit) && isMassUnit(input.toUnit)) {
    convertedValue = convertMass(input.value, input.fromUnit, input.toUnit);
    if (input.fromUnit !== input.toUnit) {
      steps.push(`Convert ${input.value} ${input.fromUnit} to ${input.toUnit}: ${formatNumber(convertedValue)} ${input.toUnit}`);
    }
  } else if (isVolumeUnit(input.fromUnit) && isVolumeUnit(input.toUnit)) {
    convertedValue = convertVolume(input.value, input.fromUnit, input.toUnit);
    if (input.fromUnit !== input.toUnit) {
      steps.push(`Convert ${input.value} ${input.fromUnit} to ${input.toUnit}: ${formatNumber(convertedValue)} ${input.toUnit}`);
    }
  } else {
    // No conversion needed or unsupported conversion
    convertedValue = input.value;
    steps.push(`No conversion needed: ${input.value} ${input.fromUnit}`);
  }

  // Calculate cost if provided
  let totalCost = 0;
  let costCalculation = "";

  if (input.costPer && input.costUnit) {
    if (input.costUnit === input.toUnit) {
      // Direct cost calculation
      totalCost = convertedValue * input.costPer;
      costCalculation = `${formatNumber(convertedValue)} × ${formatCurrency(input.costPer)}`;
      steps.push(`Cost calculation: ${costCalculation} = ${formatCurrency(totalCost)}`);
    } else {
      // Need to convert cost unit to target unit
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
      costCalculation = `${formatNumber(convertedValue)} × ${formatCurrency(costPerTargetUnit)}`;
      steps.push(`Cost per ${input.toUnit}: ${formatCurrency(input.costPer)} per ${input.costUnit} = ${formatCurrency(costPerTargetUnit)} per ${input.toUnit}`);
      steps.push(`Total cost: ${costCalculation} = ${formatCurrency(totalCost)}`);
    }
  }

  return {
    originalValue: input.value,
    originalUnit: input.fromUnit,
    convertedValue,
    convertedUnit: input.toUnit,
    costCalculation,
    totalCost,
    steps
  };
}

import { CalculationBreakdown, ConversionInput, PackagedGood } from "@/types/conversion";
import { Material, SauceCalculationResult, SauceIngredient } from "@/types/inventory";

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
    if (decimalStr.includes("33333") || decimalStr.includes("66666") || decimalStr.includes("83333") || decimalStr.includes("16666") || decimalStr.includes("41666") || decimalStr.includes("58333") || decimalStr.includes("91666") || decimalStr.includes("08333") || (decimalStr.includes("25") && decimalStr.length > 6) || (decimalStr.length > 8 && decimalStr.includes("."))) {
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
    if (numStr.includes("33333") || numStr.includes("66666") || numStr.includes("83333") || numStr.includes("16666") || numStr.includes("41666") || numStr.includes("58333") || numStr.includes("91666") || numStr.includes("08333") || (numStr.includes("25") && numStr.length > 6) || (numStr.length > 8 && numStr.includes("."))) {
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
  const numValue = typeof value === "string" ? parseFloat(value) : value;

  // Handle invalid values
  if (numValue === null || numValue === undefined || isNaN(numValue)) {
    return "0";
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
  return numValue.toFixed(6).replace(/\.?0+$/, "");
}

// ============================================================================
// SMART SAUCE CALCULATION SYSTEM
// ============================================================================

/**
 * Determines the best unit for sauce yield based on ingredient types
 */
export function determineBestYieldUnit(ingredients: SauceIngredient[], materials: Material[]): string {
  const materialMap = new Map(materials.map(m => [m.id.toString(), m]));

  let hasLiquid = false;
  let hasSolid = false;
  let totalVolume = 0;
  let totalMass = 0;

  for (const ingredient of ingredients) {
    const material = materialMap.get(ingredient.materialId);
    if (!material) continue;

    const unit = ingredient.unit.toLowerCase();

    // Check if ingredient is liquid-based
    if (isVolumeUnit(unit) || material.name.toLowerCase().includes("oil") || material.name.toLowerCase().includes("water") || material.name.toLowerCase().includes("milk") || material.name.toLowerCase().includes("cream") || material.name.toLowerCase().includes("juice")) {
      hasLiquid = true;

      // Convert to ml for comparison
      if (isVolumeUnit(unit)) {
        totalVolume += convertVolume(ingredient.quantity, unit, "ml");
      }
    }

    // Check if ingredient is solid-based
    if (isMassUnit(unit) || material.unitType === "mass" || material.unitType === "package") {
      hasSolid = true;

      // Convert to grams for comparison
      if (isMassUnit(unit)) {
        totalMass += convertMass(ingredient.quantity, unit, "g");
      } else if (material.unitType === "package" && material.packageQuantity) {
        // Estimate mass for package items
        totalMass += ingredient.quantity * (material.packageQuantity || 1) * 10; // rough estimate
      }
    }
  }

  // Decision logic for yield unit
  if (hasLiquid && !hasSolid) {
    return totalVolume > 1000 ? "l" : "ml";
  } else if (hasSolid && !hasLiquid) {
    return totalMass > 1000 ? "kg" : "g";
  } else if (hasLiquid && hasSolid) {
    // Mixed ingredients - prefer volume for sauces
    return totalVolume > 500 ? "l" : "ml";
  }

  // Default to ml for sauces
  return "ml";
}

/**
 * Estimates sauce yield based on ingredients with smart reduction factors
 */
export function estimateSauceYield(ingredients: SauceIngredient[], materials: Material[], targetUnit: string): number {
  const materialMap = new Map(materials.map(m => [m.id.toString(), m]));

  let totalVolume = 0; // in ml
  let totalMass = 0; // in grams
  let reductionFactor = 1.0;

  const steps: string[] = [];

  for (const ingredient of ingredients) {
    const material = materialMap.get(ingredient.materialId);
    if (!material) continue;

    const unit = ingredient.unit.toLowerCase();
    const quantity = ingredient.quantity;

    // Convert all ingredients to base units for calculation
    if (isVolumeUnit(unit)) {
      const volumeInMl = convertVolume(quantity, unit, "ml");
      totalVolume += volumeInMl;
      steps.push(`${material.name}: ${quantity} ${unit} = ${formatVolume(volumeInMl)} ml`);

      // Apply reduction factors for cooking processes
      if (material.name.toLowerCase().includes("wine") || material.name.toLowerCase().includes("alcohol")) {
        reductionFactor *= 0.7; // Alcohol evaporation
      }
    } else if (isMassUnit(unit)) {
      const massInGrams = convertMass(quantity, unit, "g");
      totalMass += massInGrams;
      steps.push(`${material.name}: ${quantity} ${unit} = ${formatVolume(massInGrams)} g`);

      // Convert mass to approximate volume for sauces (density ~1g/ml for most ingredients)
      let volumeEquivalent = massInGrams;

      // Adjust for different ingredient densities
      const name = material.name.toLowerCase();
      if (name.includes("oil") || name.includes("butter")) {
        volumeEquivalent = massInGrams * 1.1; // Oils are less dense
      } else if (name.includes("flour") || name.includes("starch")) {
        volumeEquivalent = massInGrams * 0.6; // Flour absorbs liquid
        reductionFactor *= 0.9; // Thickening agents reduce final volume
      } else if (name.includes("sugar") || name.includes("salt")) {
        volumeEquivalent = massInGrams * 0.8; // Dissolves, reduces volume
      }

      totalVolume += volumeEquivalent;
    } else if (material.unitType === "package") {
      // Handle package items (estimate volume)
      const packageVolume = (material.packageQuantity || 1) * quantity * 10; // rough estimate
      totalVolume += packageVolume;
      steps.push(`${material.name}: ${quantity} ${unit} ≈ ${formatVolume(packageVolume)} ml (estimated)`);
    } else {
      // Handle piece/unit items
      const pieceVolume = quantity * 15; // rough estimate: 15ml per piece
      totalVolume += pieceVolume;
      steps.push(`${material.name}: ${quantity} ${unit} ≈ ${formatVolume(pieceVolume)} ml (estimated)`);
    }
  }

  // Apply cooking reduction factor
  const finalVolume = totalVolume * reductionFactor;

  // Convert to target unit
  if (isVolumeUnit(targetUnit)) {
    return convertVolume(finalVolume, "ml", targetUnit);
  } else if (isMassUnit(targetUnit)) {
    // Convert volume back to mass (assuming sauce density ~1g/ml)
    const massInGrams = finalVolume * 1.0;
    return convertMass(massInGrams, "g", targetUnit);
  }

  return finalVolume;
}

// Calculates comprehensive sauce metrics with automatic yield estimation
export function calculateSauceMetrics(ingredients: SauceIngredient[], materials: Material[], manualYield?: { quantity: number; unit: string }): SauceCalculationResult {
  const materialMap = new Map(materials.map(m => [m.id.toString(), m]));
  const steps: string[] = [];
  const processedIngredients: SauceCalculationResult["ingredients"] = [];
  let totalCost = 0;

  for (const ingredient of ingredients) {
    const material = materialMap.get(ingredient.materialId);
    if (!material) {
      console.warn(`⚠️ Material not found for ingredient ID: ${ingredient.materialId}`);
      steps.push(`⚠️ Material not found for ingredient: ${ingredient.materialId}`);
      continue;
    }
    let ingredientCost = ingredient.cost;
    let normalizedQuantity = ingredient.quantity;
    let normalizedUnit = ingredient.unit;
    let costPerUnit = typeof material.costPerUnit === "string" ? parseFloat(material.costPerUnit) : material.costPerUnit || 0;
    if (ingredientCost <= 0 || isNaN(ingredientCost)) {
      if (costPerUnit <= 0 || isNaN(costPerUnit)) {
        console.warn(`⚠️ Invalid costPerUnit for material ${material.name}: ${costPerUnit}`);
        steps.push(`⚠️ Invalid cost for ${material.name} (costPerUnit: ${costPerUnit})`);
        ingredientCost = 0;
      } else {
        try {
          if (ingredient.unit !== material.baseUnit) {
            if (isMassUnit(ingredient.unit) && isMassUnit(material.baseUnit)) {
              normalizedQuantity = convertMass(ingredient.quantity, ingredient.unit, material.baseUnit);
              normalizedUnit = material.baseUnit;
            } else if (isVolumeUnit(ingredient.unit) && isVolumeUnit(material.baseUnit)) {
              normalizedQuantity = convertVolume(ingredient.quantity, ingredient.unit, material.baseUnit);
              normalizedUnit = material.baseUnit;
            } else if (material.unitType === "package" && material.packageQuantity) {
              normalizedQuantity = ingredient.quantity * material.packageQuantity;
              normalizedUnit = material.baseUnit;
            }
          }
          ingredientCost = normalizedQuantity * costPerUnit;
        } catch (error) {
          console.error(`❌ Error converting units for material ${material.name}:`, error);
          steps.push(`⚠️ Error converting ${ingredient.unit} to ${material.baseUnit} for ${material.name}`);
          ingredientCost = 0;
        }
      }
    }
    totalCost += ingredientCost;
    processedIngredients.push({
      materialId: ingredient.materialId,
      name: material.name,
      quantity: ingredient.quantity,
      unit: ingredient.unit,
      cost: ingredientCost,
      normalizedQuantity,
      normalizedUnit
    });
    const conversionNote = normalizedQuantity !== ingredient.quantity ? ` (converted from ${ingredient.quantity} ${ingredient.unit})` : "";
    steps.push(`${material.name}: ${normalizedQuantity} ${normalizedUnit}${conversionNote} × $${costPerUnit.toFixed(4)} = $${ingredientCost.toFixed(2)}`);
  }
  let finalYield: number;
  let yieldUnit: string;
  try {
    if (manualYield?.quantity && !isNaN(manualYield.quantity)) {
      finalYield = manualYield.quantity;
      yieldUnit = manualYield.unit;
      steps.push(`📏 Using manual yield: ${finalYield} ${yieldUnit}`);
    } else {
      const totalVolume = processedIngredients.reduce((sum, ing) => {
        if (isVolumeUnit(ing.unit) || isVolumeUnit(ing.normalizedUnit)) {
          return sum + (ing.normalizedQuantity || 0);
        }
        return sum;
      }, 0);

      yieldUnit = totalVolume > 0 ? "ml" : "unit";
      finalYield = totalVolume > 0 ? totalVolume : 1;
      steps.push(`📏 Estimated yield: ${finalYield} ${yieldUnit} (auto-calculated)`);
    }
  } catch (error) {
    console.error(`❌ Error calculating yield:`, error);
    steps.push(`⚠️ Error calculating yield`);
    finalYield = 1;
    yieldUnit = "unit";
  }
  const costPerUnit = finalYield > 0 ? totalCost / finalYield : 0;
  steps.push(`💰 Total cost: $${totalCost.toFixed(2)}`);
  steps.push(`📊 Cost per ${yieldUnit}: $${costPerUnit.toFixed(4)}`);
  const result: SauceCalculationResult = {
    totalCost,
    costPerUnit,
    estimatedYield: finalYield,
    yieldUnit,
    ingredients: processedIngredients,
    calculationSteps: steps
  };
  return result;
}

export function calculateIngredientCostSmart(materialId: string, quantity: number, unit: string, materials: Material[]): number {
  const material = materials.find(m => m.id.toString() === materialId);
  if (!material) {
    console.warn(`❌ Material not found for ID: ${materialId}`);
    return 0;
  }

  if (quantity <= 0 || isNaN(quantity)) {
    console.warn(`❌ Invalid quantity for material ${material.name}: ${quantity}`);
    return 0;
  }

  // Get material cost per unit
  const materialCostPerUnit = typeof material.costPerUnit === "string" ? parseFloat(material.costPerUnit) : material.costPerUnit || 0;

  if (materialCostPerUnit <= 0 || isNaN(materialCostPerUnit)) {
    console.warn(`❌ Invalid costPerUnit for material ${material.name}: ${materialCostPerUnit}`);
    return 0;
  }

  // Convert quantity to material's base unit for accurate cost calculation
  let normalizedQuantity = quantity;
  let normalizedUnit = unit;

  if (unit !== material.baseUnit) {
    try {
      if (isMassUnit(unit) && isMassUnit(material.baseUnit)) {
        normalizedQuantity = convertMass(quantity, unit, material.baseUnit);
        normalizedUnit = material.baseUnit;
      } else if (isVolumeUnit(unit) && isVolumeUnit(material.baseUnit)) {
        normalizedQuantity = convertVolume(quantity, unit, material.baseUnit);
        normalizedUnit = material.baseUnit;
      } else if (material.unitType === "package" && material.packageQuantity) {
        normalizedQuantity = quantity * material.packageQuantity;
        normalizedUnit = material.baseUnit;
      }
    } catch (error) {
      console.error(`❌ Error converting ${unit} to ${material.baseUnit} for ${material.name}:`, error);
      return 0;
    }
  }

  const cost = normalizedQuantity * materialCostPerUnit;
  console.log("💰 Cost Calculation:", {
    material: material.name,
    inputQuantity: quantity,
    inputUnit: unit,
    normalizedQuantity,
    normalizedUnit,
    materialCostPerUnit,
    calculatedCost: cost
  });

  return cost;
}
/**
 * Auto-updates sauce yield when ingredients change
 */
export function autoUpdateSauceYield(ingredients: SauceIngredient[], materials: Material[], currentYieldUnit?: string): { quantity: number; unit: string } {
  if (!ingredients.length) {
    return { quantity: 0, unit: currentYieldUnit || "ml" };
  }

  // Determine best unit if not specified
  const yieldUnit = currentYieldUnit || determineBestYieldUnit(ingredients, materials);

  // Calculate estimated yield
  const estimatedQuantity = estimateSauceYield(ingredients, materials, yieldUnit);

  return {
    quantity: Math.round(estimatedQuantity * 100) / 100, // Round to 2 decimal places
    unit: yieldUnit
  };
}

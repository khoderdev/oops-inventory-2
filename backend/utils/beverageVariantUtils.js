/**
 * Calculates what fraction of the source material is used by a variant
 * @param {number} variantVolume The volume of the variant (e.g., 3cl for a glass)
 * @param {string} variantUnit The unit of the variant volume (e.g., 'cl')
 * @param {number} sourceVolume The volume of the source material (e.g., 750ml for a bottle)
 * @param {string} sourceUnit The unit of the source material volume (e.g., 'ml')
 * @returns {number} Fraction of the source material used (e.g., 0.04 meaning 4% of the bottle)
 */
export function calculateSourceFraction(
  variantVolume,
  variantUnit,
  sourceVolume,
  sourceUnit
) {
  // Convert both volumes to the same unit (ml) for comparison
  const normalizedVariantVolume = convertVolume(variantVolume, variantUnit, 'ml');
  const normalizedSourceVolume = convertVolume(sourceVolume, sourceUnit, 'ml');
  
  // Calculate what fraction of the source this variant represents
  return normalizedVariantVolume / normalizedSourceVolume;
}

/**
 * Calculates the amount of source material to deduct when selling a variant
 * @param {number} variantVolume The volume of the variant (e.g., 3cl for a glass)
 * @param {string} variantUnit The unit of the variant volume (e.g., 'cl')
 * @param {number} sourceVolume The volume of the source material (e.g., 750ml for a bottle)
 * @param {string} sourceUnit The unit of the source material volume (e.g., 'ml')
 * @param {number} quantity The quantity of variants sold (e.g., 2 glasses)
 * @returns {number} The amount of source material to deduct (as a fraction of 1 unit)
 */
export function calculateDeductionAmount(
  variantVolume,
  variantUnit,
  sourceVolume,
  sourceUnit,
  quantity
) {
  const fractionPerUnit = calculateSourceFraction(variantVolume, variantUnit, sourceVolume, sourceUnit);
  return fractionPerUnit * quantity;
}

/**
 * Convert between volume units
 * @param {number} value The value to convert
 * @param {string} fromUnit The unit to convert from
 * @param {string} toUnit The unit to convert to
 * @returns {number} The converted value
 */
export function convertVolume(value, fromUnit, toUnit) {
  if (!fromUnit || !toUnit) {
    console.warn(`Invalid volume units: fromUnit=${fromUnit}, toUnit=${toUnit}`);
    return value;
  }
  if (fromUnit === toUnit) return value;

  const normalizedFrom = fromUnit.toLowerCase();
  const normalizedTo = toUnit.toLowerCase();

  let ml;
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
    case "cl":
    case "centiliter":
    case "centiliters":
      ml = value * 10;
      break;
    case "dl":
    case "deciliter":
    case "deciliters":
      ml = value * 100;
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
    case "cl":
    case "centiliter":
    case "centiliters":
      return ml / 10;
    case "dl":
    case "deciliter":
    case "deciliters":
      return ml / 100;
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

/**
 * Logs detailed information about variant deduction for debugging
 */
export function logVariantDeduction(
  menuItemName,
  variantName,
  variantVolume,
  variantUnit,
  sourceVolume,
  sourceUnit,
  quantity,
  deductionAmount
) {
  const normalizedVariantVolume = convertVolume(variantVolume, variantUnit, 'ml');
  const normalizedSourceVolume = convertVolume(sourceVolume, sourceUnit, 'ml');
  const totalDeducted = normalizedVariantVolume * quantity;
  
  console.log(`
🥃 Beverage Variant Deduction:
  - Menu Item: ${menuItemName}
  - Variant: ${variantName} (${variantVolume}${variantUnit})
  - Source: ${sourceVolume}${sourceUnit} (${normalizedSourceVolume}ml)
  - Quantity Sold: ${quantity}
  - Volume Per Unit: ${normalizedVariantVolume}ml
  - Total Volume Deducted: ${totalDeducted}ml
  - Fraction of Source: ${(deductionAmount * 100).toFixed(2)}%
  `);
}

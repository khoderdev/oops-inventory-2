import { convertVolume } from './conversionLogic';

/**
 * Represents a beverage variant with volume information
 */
export interface BeverageVariant {
  id?: string;
  name: string;
  volume: number;
  unit: string;
  price: number;
}

/**
 * Calculates what fraction of the source material is used by a variant
 * @param variantVolume The volume of the variant (e.g., 3cl for a glass)
 * @param variantUnit The unit of the variant volume (e.g., 'cl')
 * @param sourceVolume The volume of the source material (e.g., 750ml for a bottle)
 * @param sourceUnit The unit of the source material volume (e.g., 'ml')
 * @returns Fraction of the source material used (e.g., 0.04 meaning 4% of the bottle)
 */
export function calculateSourceFraction(
  variantVolume: number,
  variantUnit: string,
  sourceVolume: number,
  sourceUnit: string
): number {
  // Convert both volumes to the same unit (ml) for comparison
  const normalizedVariantVolume = convertVolume(variantVolume, variantUnit, 'ml');
  const normalizedSourceVolume = convertVolume(sourceVolume, sourceUnit, 'ml');
  
  // Calculate what fraction of the source this variant represents
  return normalizedVariantVolume / normalizedSourceVolume;
}

/**
 * Calculates the amount of source material to deduct when selling a variant
 * @param variantVolume The volume of the variant (e.g., 3cl for a glass)
 * @param variantUnit The unit of the variant volume (e.g., 'cl')
 * @param sourceVolume The volume of the source material (e.g., 750ml for a bottle)
 * @param sourceUnit The unit of the source material volume (e.g., 'ml')
 * @param quantity The quantity of variants sold (e.g., 2 glasses)
 * @returns The amount of source material to deduct (as a fraction of 1 unit)
 */
export function calculateDeductionAmount(
  variantVolume: number,
  variantUnit: string,
  sourceVolume: number,
  sourceUnit: string,
  quantity: number
): number {
  const fractionPerUnit = calculateSourceFraction(variantVolume, variantUnit, sourceVolume, sourceUnit);
  return fractionPerUnit * quantity;
}

/**
 * Normalizes variant volume to standard units
 * @param variant The beverage variant
 * @returns The variant volume in milliliters
 */
export function normalizeVariantVolume(variant: BeverageVariant): number {
  return convertVolume(variant.volume, variant.unit, 'ml');
}

/**
 * Calculates the total volume from multiple variants
 * @param variants List of variants with quantities
 * @returns Total volume in milliliters
 */
export function calculateTotalVariantVolume(
  variants: Array<BeverageVariant & { quantity: number }>
): number {
  return variants.reduce((total, variant) => {
    const normalizedVolume = normalizeVariantVolume(variant);
    return total + (normalizedVolume * variant.quantity);
  }, 0);
}

/**
 * Logs detailed information about variant deduction for debugging
 */
export function logVariantDeduction(
  menuItemName: string,
  variantName: string,
  variantVolume: number,
  variantUnit: string,
  sourceVolume: number,
  sourceUnit: string,
  quantity: number,
  deductionAmount: number
): void {
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

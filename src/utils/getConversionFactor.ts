import { Material, UnitType } from "@/types/inventory";
import { convertMass, convertVolume } from "./conversionLogic";

// Helper function to detect if a unit is a mass unit
function isMassUnit(unit: string): boolean {
  const massUnits = ['kg', 'kgs', 'g', 'gram', 'grams', 'lb', 'lbs', 'pound', 'pounds', 'oz', 'ounce', 'ounces'];
  return massUnits.includes(unit.toLowerCase());
}

// Helper function to detect if a unit is a volume unit
function isVolumeUnit(unit: string): boolean {
  const volumeUnits = ['l', 'liter', 'liters', 'ml', 'milliliter', 'milliliters', 'gal', 'gallon', 'gallons', 'fl oz', 'fluid ounce', 'fluid ounces'];
  return volumeUnits.includes(unit.toLowerCase());
}

export function getConversionFactor(fromUnit: string | undefined, toUnit: string | undefined, unitType: UnitType, material?: Material): number {
  if (!fromUnit || !toUnit) {
    console.warn(`Invalid units: fromUnit=${fromUnit}, toUnit=${toUnit}`);
    return 1; // Return 1:1 if units are undefined or empty
  }
  if (fromUnit === toUnit) return 1;

  try {
    // Smart unit type detection - check actual units first, then fall back to material unitType
    const actualFromIsMass = isMassUnit(fromUnit);
    const actualToIsMass = isMassUnit(toUnit);
    const actualFromIsVolume = isVolumeUnit(fromUnit);
    const actualToIsVolume = isVolumeUnit(toUnit);

    // If both units are mass units, use mass conversion regardless of material unitType
    if (actualFromIsMass && actualToIsMass) {
      return convertMass(1, fromUnit, toUnit);
    }
    
    // If both units are volume units, use volume conversion regardless of material unitType
    if (actualFromIsVolume && actualToIsVolume) {
      return convertVolume(1, fromUnit, toUnit);
    }

    // If units are mixed types, log warning and return 1:1 (but don't throw error)
    if ((actualFromIsMass && actualToIsVolume) || (actualFromIsVolume && actualToIsMass)) {
      console.warn(`⚠️ Data inconsistency: Cannot convert between different unit types: ${fromUnit} (${actualFromIsMass ? 'mass' : 'volume'}) to ${toUnit} (${actualToIsMass ? 'mass' : 'volume'}). Using 1:1 ratio. Please check material data.`);
      return 1;
    }

    // Fall back to material unitType for non-standard units
    if (unitType === "mass") {
      return convertMass(1, fromUnit, toUnit);
    } else if (unitType === "volume") {
      return convertVolume(1, fromUnit, toUnit);
    } else if (unitType === "package" && material?.packageQuantity) {
      // For package types, use the packageQuantity to convert from pack to pieces
      if (fromUnit === material.inputUnit && toUnit === material.baseUnit) {
        return material.packageQuantity; // 1 pack = packageQuantity pieces
      } else if (fromUnit === material.baseUnit && toUnit === material.inputUnit) {
        return 1 / material.packageQuantity; // 1 piece = 1/packageQuantity packs
      }
    }
    return 1; // For piece types or when no conversion is needed
  } catch (error) {
    console.error(`Conversion error from ${fromUnit} to ${toUnit}:`, error);
    return 1; // Fallback to 1:1 if conversion fails
  }
}

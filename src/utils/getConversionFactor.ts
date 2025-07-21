import { Material, UnitType } from "@/types/inventory";
import { convertMass, convertVolume } from "./conversionLogic";

export function getConversionFactor(fromUnit: string | undefined, toUnit: string | undefined, unitType: UnitType, material?: Material): number {
  if (!fromUnit || !toUnit) {
    console.warn(`Invalid units: fromUnit=${fromUnit}, toUnit=${toUnit}`);
    return 1; // Return 1:1 if units are undefined or empty
  }
  if (fromUnit === toUnit) return 1;

  try {
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

import { UnitType } from "@/types/inventory";
import { convertMass, convertVolume } from "./conversionLogic";

export function getConversionFactor(fromUnit: string, toUnit: string, unitType: UnitType): number {
  if (fromUnit === toUnit) return 1;

  try {
    if (unitType === "mass") {
      return convertMass(1, fromUnit, toUnit);
    } else if (unitType === "volume") {
      return convertVolume(1, fromUnit, toUnit);
    }
    return 1; // For piece and package types, assume 1:1
  } catch (error) {
    console.error(`Conversion error from ${fromUnit} to ${toUnit}:`, error);
    return 1; // Fallback to 1:1 if conversion fails
  }
}

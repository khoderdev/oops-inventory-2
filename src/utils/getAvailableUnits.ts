import { Material, UNIT_OPTIONS, UnitType } from "@/types/inventory";

export function getAvailableUnits(materialId: string, materials: Material[]): readonly string[] {
  const material = materials.find(m => m.id === materialId);
  if (!material) return [];

  return UNIT_OPTIONS[material.unitType] || [];
}

export function getAvailableUnitsByType(unitType: UnitType): readonly string[] {
  return UNIT_OPTIONS[unitType] || [];
}

export function getUnitDisplayName(unit: string): string {
  const unitMap: Record<string, string> = {
    g: "Gram",
    kg: "Kilogram",
    lb: "Pound",
    oz: "Ounce",
    ml: "Milliliter",
    l: "Liter",
    gal: "Gallon",
    "fl oz": "Fluid Ounce",
    each: "Each",
    dozen: "Dozen",
    package: "Package",
    box: "Box",
    case: "Case"
  };

  return unitMap[unit] || unit;
}

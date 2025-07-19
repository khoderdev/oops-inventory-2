import { Material, UNIT_OPTIONS, UnitType } from "@/types/inventory";

export function getAvailableUnits(materialId: string, materials: Material[]): readonly string[] {
  console.log('getAvailableUnits called with materialId:', materialId);
  console.log('getAvailableUnits materials array:', materials);
  
  // Handle both string and number IDs for compatibility
  const material = materials.find(m => m.id === materialId || String(m.id) === materialId);
  console.log('Found material:', material);
  
  if (!material) {
    console.log('Material not found, returning empty array');
    return [];
  }

  console.log('Material unitType:', material.unitType);
  console.log('UNIT_OPTIONS for unitType:', UNIT_OPTIONS[material.unitType]);
  
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

import { Material, StockEntry } from "@/types/inventory";
import { convertMass, convertVolume, formatCurrency, formatNumber } from "./conversionLogic";

// Enhanced unit conversion system with packaging support
export interface ConversionResult {
  convertedQuantity: number;
  convertedUnit: string;
  conversionFactor: number;
  cost: number;
  costPerUnit: number;
  steps: string[];
  warnings: string[];
}

export interface PackagingUnit {
  name: string;
  baseQuantity: number;
  baseUnit: string;
  category: "mass" | "volume" | "piece" | "package";
}

// Comprehensive unit definitions with packaging
export const UNIT_DEFINITIONS: Record<string, PackagingUnit> = {
  // Mass units
  kg: { name: "kilogram", baseQuantity: 1, baseUnit: "kg", category: "mass" },
  g: { name: "gram", baseQuantity: 0.001, baseUnit: "kg", category: "mass" },
  mg: { name: "milligram", baseQuantity: 0.000001, baseUnit: "kg", category: "mass" },
  lb: { name: "pound", baseQuantity: 0.453592, baseUnit: "kg", category: "mass" },
  oz: { name: "ounce", baseQuantity: 0.0283495, baseUnit: "kg", category: "mass" },
  ton: { name: "metric ton", baseQuantity: 1000, baseUnit: "kg", category: "mass" },
  stone: { name: "stone", baseQuantity: 6.35029, baseUnit: "kg", category: "mass" },

  // Volume units
  l: { name: "liter", baseQuantity: 1, baseUnit: "liter", category: "volume" },
  ml: { name: "milliliter", baseQuantity: 0.001, baseUnit: "liter", category: "volume" },
  cl: { name: "centiliter", baseQuantity: 0.01, baseUnit: "liter", category: "volume" },
  dl: { name: "deciliter", baseQuantity: 0.1, baseUnit: "liter", category: "volume" },
  fl_oz: { name: "fluid ounce", baseQuantity: 0.0295735, baseUnit: "liter", category: "volume" },
  gallon: { name: "gallon", baseQuantity: 3.78541, baseUnit: "liter", category: "volume" },
  quart: { name: "quart", baseQuantity: 0.946353, baseUnit: "liter", category: "volume" },
  pint: { name: "pint", baseQuantity: 0.473176, baseUnit: "liter", category: "volume" },
  cup: { name: "cup", baseQuantity: 0.236588, baseUnit: "liter", category: "volume" },
  tablespoon: { name: "tablespoon", baseQuantity: 0.0147868, baseUnit: "liter", category: "volume" },
  teaspoon: { name: "teaspoon", baseQuantity: 0.00492892, baseUnit: "liter", category: "volume" },
  imperial_gallon: { name: "imperial gallon", baseQuantity: 4.54609, baseUnit: "liter", category: "volume" },
  imperial_pint: { name: "imperial pint", baseQuantity: 0.568261, baseUnit: "liter", category: "volume" },

  // Piece units
  piece: { name: "piece", baseQuantity: 1, baseUnit: "piece", category: "piece" },
  item: { name: "item", baseQuantity: 1, baseUnit: "piece", category: "piece" },
  unit: { name: "unit", baseQuantity: 1, baseUnit: "piece", category: "piece" },
  each: { name: "each", baseQuantity: 1, baseUnit: "piece", category: "piece" },
  dozen: { name: "dozen", baseQuantity: 12, baseUnit: "piece", category: "piece" },
  pair: { name: "pair", baseQuantity: 2, baseUnit: "piece", category: "piece" },
  head: { name: "head", baseQuantity: 1, baseUnit: "piece", category: "piece" }, // for lettuce, cabbage
  bunch: { name: "bunch", baseQuantity: 1, baseUnit: "piece", category: "piece" }, // for herbs, bananas
  clove: { name: "clove", baseQuantity: 1, baseUnit: "piece", category: "piece" }, // for garlic

  // Package units - these need context-specific conversion
  box: { name: "box", baseQuantity: 1, baseUnit: "box", category: "package" },
  pack: { name: "pack", baseQuantity: 1, baseUnit: "pack", category: "package" },
  case: { name: "case", baseQuantity: 1, baseUnit: "case", category: "package" },
  bag: { name: "bag", baseQuantity: 1, baseUnit: "bag", category: "package" },
  bottle: { name: "bottle", baseQuantity: 1, baseUnit: "bottle", category: "package" },
  can: { name: "can", baseQuantity: 1, baseUnit: "can", category: "package" },
  jar: { name: "jar", baseQuantity: 1, baseUnit: "jar", category: "package" },
  container: { name: "container", baseQuantity: 1, baseUnit: "container", category: "package" },
  crate: { name: "crate", baseQuantity: 1, baseUnit: "crate", category: "package" },
  carton: { name: "carton", baseQuantity: 1, baseUnit: "carton", category: "package" },
  tray: { name: "tray", baseQuantity: 1, baseUnit: "tray", category: "package" },
  sack: { name: "sack", baseQuantity: 1, baseUnit: "sack", category: "package" },
  barrel: { name: "barrel", baseQuantity: 1, baseUnit: "barrel", category: "package" },
  keg: { name: "keg", baseQuantity: 1, baseUnit: "keg", category: "package" },
  pallet: { name: "pallet", baseQuantity: 1, baseUnit: "pallet", category: "package" },
  bundle: { name: "bundle", baseQuantity: 1, baseUnit: "bundle", category: "package" },
  roll: { name: "roll", baseQuantity: 1, baseUnit: "roll", category: "package" },
  tube: { name: "tube", baseQuantity: 1, baseUnit: "tube", category: "package" },
  pouch: { name: "pouch", baseQuantity: 1, baseUnit: "pouch", category: "package" },
  sleeve: { name: "sleeve", baseQuantity: 1, baseUnit: "sleeve", category: "package" }
};

// Material-specific packaging definitions
export interface MaterialPackaging {
  materialId: string;
  packageType: string;
  quantityPerPackage: number;
  packageUnit: string;
  baseUnit: string;
}

// Middle Eastern Beverage Packaging Standards
export const BEVERAGE_PACKAGING_STANDARDS = {
  // Wine bottle sizes (Lebanon & Middle East standards)
  wine: {
    quarter_bottle: { volume: 187.5, unit: "ml", name: "Quarter/Piccolo" },
    half_bottle: { volume: 375, unit: "ml", name: "Half Bottle" },
    half_liter: { volume: 500, unit: "ml", name: "Half-Liter" },
    standard_bottle: { volume: 750, unit: "ml", name: "Standard Bottle" },
    liter_bottle: { volume: 1000, unit: "ml", name: "Liter Bottle" },
    magnum: { volume: 1500, unit: "ml", name: "Magnum" },
    jeroboam: { volume: 3000, unit: "ml", name: "Jeroboam" }
  },

  // Spirits bottle sizes (EU/US standards used in Middle East)
  spirits: {
    miniature_20ml: { volume: 20, unit: "ml", name: "Tiny Nip" },
    miniature_50ml: { volume: 50, unit: "ml", name: "Standard Nip" },
    eighth_bottle: { volume: 100, unit: "ml", name: "Eighth Bottle" },
    quarter_bottle: { volume: 200, unit: "ml", name: "Quarter Bottle" },
    half_bottle_eu: { volume: 350, unit: "ml", name: "Half Bottle (EU)" },
    half_bottle_us: { volume: 375, unit: "ml", name: "Half Bottle (US)" },
    half_liter: { volume: 500, unit: "ml", name: "Half Liter" },
    standard_eu: { volume: 700, unit: "ml", name: "Standard (EU)" },
    standard_us: { volume: 750, unit: "ml", name: "Standard (US)" },
    liter_bottle: { volume: 1000, unit: "ml", name: "Liter Bottle" },
    magnum: { volume: 1500, unit: "ml", name: "Magnum" },
    half_gallon: { volume: 1750, unit: "ml", name: "Half-Gallon" }
  },

  // Beer container sizes (Lebanon & regional standards)
  beer: {
    small_bottle: { volume: 330, unit: "ml", name: "Small Bottle/Can" },
    large_bottle: { volume: 500, unit: "ml", name: "Large Bottle/Can" },
    european_bottle: { volume: 650, unit: "ml", name: "European Bottle" },
    specialty_bottle: { volume: 750, unit: "ml", name: "Specialty Bottle" },
    euro_liter: { volume: 1000, unit: "ml", name: "Euro Liter" },
    small_keg: { volume: 20, unit: "l", name: "Small Keg" },
    mini_keg: { volume: 30, unit: "l", name: "Mini Keg" },
    standard_keg: { volume: 50, unit: "l", name: "Standard Keg" }
  }
};

// Common packaging configurations
export const COMMON_PACKAGING: Record<string, MaterialPackaging[]> = {
  pickles: [
    { materialId: "pickles", packageType: "jar", quantityPerPackage: 0.5, packageUnit: "kg", baseUnit: "kg" },
    { materialId: "pickles", packageType: "case", quantityPerPackage: 12, packageUnit: "jar", baseUnit: "kg" }
  ],
  beef_patties: [
    { materialId: "beef_patties", packageType: "pack", quantityPerPackage: 8, packageUnit: "piece", baseUnit: "piece" },
    { materialId: "beef_patties", packageType: "box", quantityPerPackage: 4, packageUnit: "pack", baseUnit: "piece" }
  ],
  buns: [
    { materialId: "buns", packageType: "pack", quantityPerPackage: 8, packageUnit: "piece", baseUnit: "piece" },
    { materialId: "buns", packageType: "case", quantityPerPackage: 6, packageUnit: "pack", baseUnit: "piece" }
  ],
  cheese_slices: [
    { materialId: "cheese_slices", packageType: "pack", quantityPerPackage: 24, packageUnit: "piece", baseUnit: "piece" },
    { materialId: "cheese_slices", packageType: "case", quantityPerPackage: 12, packageUnit: "pack", baseUnit: "piece" }
  ],

  // Beverage packaging examples
  wine_bottles: [
    { materialId: "wine", packageType: "bottle", quantityPerPackage: 750, packageUnit: "ml", baseUnit: "ml" },
    { materialId: "wine", packageType: "case", quantityPerPackage: 12, packageUnit: "bottle", baseUnit: "ml" }
  ],
  vodka_bottles: [
    { materialId: "vodka", packageType: "bottle", quantityPerPackage: 700, packageUnit: "ml", baseUnit: "ml" },
    { materialId: "vodka", packageType: "box", quantityPerPackage: 12, packageUnit: "bottle", baseUnit: "ml" }
  ],
  beer_bottles: [
    { materialId: "beer", packageType: "bottle", quantityPerPackage: 330, packageUnit: "ml", baseUnit: "ml" },
    { materialId: "beer", packageType: "case", quantityPerPackage: 24, packageUnit: "bottle", baseUnit: "ml" },
    { materialId: "beer", packageType: "keg", quantityPerPackage: 30, packageUnit: "l", baseUnit: "ml" }
  ]
};

export class EnhancedUnitConverter {
  private materialPackaging: Map<string, MaterialPackaging[]> = new Map();

  constructor() {
    // Initialize with common packaging
    Object.entries(COMMON_PACKAGING).forEach(([materialId, packaging]) => {
      this.materialPackaging.set(materialId, packaging);
    });
  }

  // Add custom packaging for a material
  addMaterialPackaging(materialId: string, packaging: MaterialPackaging[]) {
    this.materialPackaging.set(materialId, packaging);
  }

  // Get packaging info for a material
  getMaterialPackaging(materialId: string): MaterialPackaging[] {
    return this.materialPackaging.get(materialId) || [];
  }

  // Convert between units with comprehensive support
  convertUnits(quantity: number, fromUnit: string, toUnit: string, material?: Material, stockEntry?: StockEntry): ConversionResult {
    const steps: string[] = [];
    const warnings: string[] = [];
    let convertedQuantity = quantity;
    let conversionFactor = 1;

    steps.push(`Starting with ${formatNumber(quantity)} ${fromUnit}`);

    // Handle same unit
    if (fromUnit === toUnit) {
      steps.push(`No conversion needed - same unit`);
      return {
        convertedQuantity: quantity,
        convertedUnit: toUnit,
        conversionFactor: 1,
        cost: 0,
        costPerUnit: 0,
        steps,
        warnings
      };
    }

    // Get unit definitions
    const fromUnitDef = UNIT_DEFINITIONS[fromUnit.toLowerCase()];
    const toUnitDef = UNIT_DEFINITIONS[toUnit.toLowerCase()];

    if (!fromUnitDef || !toUnitDef) {
      // Handle package units with material context
      if (material && (fromUnitDef?.category === "package" || toUnitDef?.category === "package")) {
        return this.convertPackageUnits(quantity, fromUnit, toUnit, material, steps, warnings);
      }

      warnings.push(`Unknown unit conversion: ${fromUnit} to ${toUnit}`);
      return {
        convertedQuantity: quantity,
        convertedUnit: toUnit,
        conversionFactor: 1,
        cost: 0,
        costPerUnit: 0,
        steps,
        warnings
      };
    }

    // Convert within same category
    if (fromUnitDef.category === toUnitDef.category) {
      if (fromUnitDef.category === "mass") {
        convertedQuantity = convertMass(quantity, fromUnit, toUnit);
        conversionFactor = convertedQuantity / quantity;
        steps.push(`Mass conversion: ${formatNumber(quantity)} ${fromUnit} = ${formatNumber(convertedQuantity)} ${toUnit}`);
      } else if (fromUnitDef.category === "volume") {
        convertedQuantity = convertVolume(quantity, fromUnit, toUnit);
        conversionFactor = convertedQuantity / quantity;
        steps.push(`Volume conversion: ${formatNumber(quantity)} ${fromUnit} = ${formatNumber(convertedQuantity)} ${toUnit}`);
      } else if (fromUnitDef.category === "piece") {
        // Direct piece conversion
        convertedQuantity = quantity * (fromUnitDef.baseQuantity / toUnitDef.baseQuantity);
        conversionFactor = convertedQuantity / quantity;
        steps.push(`Piece conversion: ${formatNumber(quantity)} ${fromUnit} = ${formatNumber(convertedQuantity)} ${toUnit}`);
      }
    } else {
      warnings.push(`Cannot convert between different unit categories: ${fromUnitDef.category} to ${toUnitDef.category}`);
      convertedQuantity = quantity;
    }

    // Calculate cost if stock entry is provided
    let cost = 0;
    let costPerUnit = 0;
    if (stockEntry) {
      const baseCostPerUnit = stockEntry.costPerPurchasedUnit;
      costPerUnit = baseCostPerUnit / conversionFactor;
      cost = convertedQuantity * costPerUnit;
      steps.push(`Cost calculation: ${formatNumber(convertedQuantity)} ${toUnit} × ${formatCurrency(costPerUnit)}/${toUnit} = ${formatCurrency(cost)}`);
    }

    return {
      convertedQuantity,
      convertedUnit: toUnit,
      conversionFactor,
      cost,
      costPerUnit,
      steps,
      warnings
    };
  }

  // Handle package unit conversions
  private convertPackageUnits(quantity: number, fromUnit: string, toUnit: string, material: Material, steps: string[], warnings: string[]): ConversionResult {
    const packaging = this.getMaterialPackaging(material.id);

    if (packaging.length === 0) {
      warnings.push(`No packaging information available for ${material.name}`);
      return {
        convertedQuantity: quantity,
        convertedUnit: toUnit,
        conversionFactor: 1,
        cost: 0,
        costPerUnit: 0,
        steps,
        warnings
      };
    }

    // Find conversion path through packaging hierarchy
    const fromPackage = packaging.find(p => p.packageType === fromUnit);
    const toPackage = packaging.find(p => p.packageType === toUnit);

    if (!fromPackage && !toPackage) {
      warnings.push(`No packaging conversion available from ${fromUnit} to ${toUnit}`);
      return {
        convertedQuantity: quantity,
        convertedUnit: toUnit,
        conversionFactor: 1,
        cost: 0,
        costPerUnit: 0,
        steps,
        warnings
      };
    }

    // Convert through base unit
    let convertedQuantity = quantity;
    let conversionFactor = 1;

    if (fromPackage) {
      // Convert from package to base unit
      convertedQuantity = quantity * fromPackage.quantityPerPackage;
      steps.push(`${formatNumber(quantity)} ${fromUnit} = ${formatNumber(convertedQuantity)} ${fromPackage.packageUnit}`);

      if (toPackage) {
        // Convert from base unit to target package
        convertedQuantity = convertedQuantity / toPackage.quantityPerPackage;
        steps.push(`${formatNumber(convertedQuantity * toPackage.quantityPerPackage)} ${toPackage.packageUnit} = ${formatNumber(convertedQuantity)} ${toUnit}`);
        conversionFactor = convertedQuantity / quantity;
      }
    }

    return {
      convertedQuantity,
      convertedUnit: toUnit,
      conversionFactor,
      cost: 0,
      costPerUnit: 0,
      steps,
      warnings
    };
  }

  // Calculate cost for a specific quantity and unit
  calculateCostForQuantity(material: Material, quantity: number, unit: string, stockEntries: StockEntry[]): ConversionResult {
    const steps: string[] = [];
    const warnings: string[] = [];

    if (stockEntries.length === 0) {
      warnings.push(`No stock entries available for ${material.name}`);
      return {
        convertedQuantity: quantity,
        convertedUnit: unit,
        conversionFactor: 1,
        cost: 0,
        costPerUnit: 0,
        steps,
        warnings
      };
    }

    // Calculate weighted average cost per base unit
    let totalQuantityInBaseUnit = 0;
    let totalCost = 0;

    stockEntries.forEach(entry => {
      const conversion = this.convertUnits(entry.purchasedQuantity, entry.purchasedUnit, material.baseUnit, material, entry);

      totalQuantityInBaseUnit += conversion.convertedQuantity;
      totalCost += entry.totalCost;
    });

    const averageCostPerBaseUnit = totalQuantityInBaseUnit > 0 ? totalCost / totalQuantityInBaseUnit : 0;
    steps.push(`Average cost per ${material.baseUnit}: ${formatCurrency(averageCostPerBaseUnit)}`);

    // Convert requested quantity to base unit
    const baseConversion = this.convertUnits(quantity, unit, material.baseUnit, material);
    steps.push(...baseConversion.steps);
    warnings.push(...baseConversion.warnings);

    // Calculate total cost
    const totalCostForQuantity = baseConversion.convertedQuantity * averageCostPerBaseUnit;
    const costPerRequestedUnit = totalCostForQuantity / quantity;

    steps.push(`Total cost: ${formatNumber(baseConversion.convertedQuantity)} ${material.baseUnit} × ${formatCurrency(averageCostPerBaseUnit)} = ${formatCurrency(totalCostForQuantity)}`);
    steps.push(`Cost per ${unit}: ${formatCurrency(costPerRequestedUnit)}`);

    return {
      convertedQuantity: quantity,
      convertedUnit: unit,
      conversionFactor: baseConversion.conversionFactor,
      cost: totalCostForQuantity,
      costPerUnit: costPerRequestedUnit,
      steps,
      warnings
    };
  }

  // Get all available units for a material
  getAvailableUnits(material: Material): string[] {
    const units = new Set<string>();

    // Add base unit
    units.add(material.baseUnit);

    // Add units from same category
    Object.entries(UNIT_DEFINITIONS).forEach(([unit, def]) => {
      if (def.category === material.unitType) {
        units.add(unit);
      }
    });

    // Add packaging units
    const packaging = this.getMaterialPackaging(material.id);
    packaging.forEach(p => {
      units.add(p.packageType);
    });

    return Array.from(units);
  }

  // Validate unit compatibility
  isUnitCompatible(unit: string, material: Material): boolean {
    const unitDef = UNIT_DEFINITIONS[unit.toLowerCase()];

    if (!unitDef) {
      // Check if it's a package unit
      const packaging = this.getMaterialPackaging(material.id);
      return packaging.some(p => p.packageType === unit);
    }

    return unitDef.category === material.unitType;
  }

  // Get suggested units for a material
  getSuggestedUnits(material: Material): string[] {
    const suggestions = this.getAvailableUnits(material);

    // Sort by relevance
    const relevanceOrder = {
      [material.baseUnit]: 1,
      piece: 2,
      item: 2,
      unit: 2,
      kg: 3,
      g: 3,
      l: 3,
      ml: 3,
      pack: 4,
      box: 4,
      case: 5
    };

    return suggestions.sort((a, b) => {
      const aRelevance = relevanceOrder[a] || 10;
      const bRelevance = relevanceOrder[b] || 10;
      return aRelevance - bRelevance;
    });
  }
}

// Helper functions for beverage packaging standards
export function getBeverageStandardSizes(beverageType: "wine" | "spirits" | "beer") {
  return BEVERAGE_PACKAGING_STANDARDS[beverageType];
}

export function getStandardBottleSize(beverageType: "wine" | "spirits" | "beer", sizeKey: string) {
  const standards = BEVERAGE_PACKAGING_STANDARDS[beverageType];
  return standards[sizeKey] || null;
}

export function getCommonBeverageSizes(beverageType: "wine" | "spirits" | "beer"): Array<{ key: string; volume: number; unit: string; name: string }> {
  const standards = BEVERAGE_PACKAGING_STANDARDS[beverageType];
  return Object.entries(standards).map(([key, value]) => ({
    key,
    volume: value.volume,
    unit: value.unit,
    name: value.name
  }));
}

export function getRecommendedBottleSize(beverageType: "wine" | "spirits" | "beer"): { volume: number; unit: string; name: string } {
  const recommendations = {
    wine: BEVERAGE_PACKAGING_STANDARDS.wine.standard_bottle, // 750ml
    spirits: BEVERAGE_PACKAGING_STANDARDS.spirits.standard_eu, // 700ml (EU standard for Middle East)
    beer: BEVERAGE_PACKAGING_STANDARDS.beer.small_bottle // 330ml
  };
  return recommendations[beverageType];
}

export function convertBeverageVolume(volume: number, fromUnit: string, toUnit: string): number {
  const conversions = {
    ml: 1,
    cl: 10,
    dl: 100,
    l: 1000,
    fl_oz: 29.5735
  };

  const fromFactor = conversions[fromUnit] || 1;
  const toFactor = conversions[toUnit] || 1;

  return (volume * fromFactor) / toFactor;
}

export function formatBeverageVolume(volume: number, unit: string): string {
  if (unit === "ml" && volume >= 1000) {
    return `${(volume / 1000).toFixed(1)}L`;
  }
  if (unit === "cl" && volume >= 100) {
    return `${(volume / 100).toFixed(1)}L`;
  }
  return `${volume}${unit}`;
}

export function validateBeveragePackaging(beverageType: "wine" | "spirits" | "beer", volume: number, unit: string): { isValid: boolean; suggestion?: string } {
  const standards = getCommonBeverageSizes(beverageType);
  const volumeInMl = convertBeverageVolume(volume, unit, "ml");

  const exactMatch = standards.find(s => convertBeverageVolume(s.volume, s.unit, "ml") === volumeInMl);
  if (exactMatch) {
    return { isValid: true };
  }

  // Find closest standard size
  const closest = standards.reduce((prev, curr) => {
    const prevDiff = Math.abs(convertBeverageVolume(prev.volume, prev.unit, "ml") - volumeInMl);
    const currDiff = Math.abs(convertBeverageVolume(curr.volume, curr.unit, "ml") - volumeInMl);
    return currDiff < prevDiff ? curr : prev;
  });

  return {
    isValid: false,
    suggestion: `Consider using standard ${beverageType} size: ${closest.name} (${formatBeverageVolume(closest.volume, closest.unit)})`
  };
}

// Export singleton instance
export const unitConverter = new EnhancedUnitConverter();

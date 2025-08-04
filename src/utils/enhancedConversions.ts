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
  lb: { name: "pound", baseQuantity: 0.453592, baseUnit: "kg", category: "mass" },
  oz: { name: "ounce", baseQuantity: 0.0283495, baseUnit: "kg", category: "mass" },

  // Volume units
  l: { name: "liter", baseQuantity: 1, baseUnit: "liter", category: "volume" },
  ml: { name: "milliliter", baseQuantity: 0.001, baseUnit: "liter", category: "volume" },
  gallon: { name: "gallon", baseQuantity: 3.78541, baseUnit: "liter", category: "volume" },
  cup: { name: "cup", baseQuantity: 0.236588, baseUnit: "liter", category: "volume" },
  tablespoon: { name: "tablespoon", baseQuantity: 0.0147868, baseUnit: "liter", category: "volume" },
  teaspoon: { name: "teaspoon", baseQuantity: 0.00492892, baseUnit: "liter", category: "volume" },

  // Piece units
  piece: { name: "piece", baseQuantity: 1, baseUnit: "piece", category: "piece" },
  item: { name: "item", baseQuantity: 1, baseUnit: "piece", category: "piece" },
  unit: { name: "unit", baseQuantity: 1, baseUnit: "piece", category: "piece" },

  // Package units - these need context-specific conversion
  box: { name: "box", baseQuantity: 1, baseUnit: "box", category: "package" },
  pack: { name: "pack", baseQuantity: 1, baseUnit: "pack", category: "package" },
  case: { name: "case", baseQuantity: 1, baseUnit: "case", category: "package" },
  bag: { name: "bag", baseQuantity: 1, baseUnit: "bag", category: "package" },
  bottle: { name: "bottle", baseQuantity: 1, baseUnit: "bottle", category: "package" },
  can: { name: "can", baseQuantity: 1, baseUnit: "can", category: "package" },
  jar: { name: "jar", baseQuantity: 1, baseUnit: "jar", category: "package" },
  container: { name: "container", baseQuantity: 1, baseUnit: "container", category: "package" }
};

// Material-specific packaging definitions
export interface MaterialPackaging {
  materialId: string;
  packageType: string;
  quantityPerPackage: number;
  packageUnit: string;
  baseUnit: string;
}

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

// Export singleton instance
export const unitConverter = new EnhancedUnitConverter();

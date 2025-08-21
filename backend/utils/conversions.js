export const MATERIAL_CATEGORIES = [
  { value: "meat", label: "Meat & Poultry" },
  { value: "seafood", label: "Seafood & Fish" },
  { value: "dairy", label: "Dairy Products" },
  { value: "vegetables", label: "Vegetables" },
  { value: "fruits", label: "Fruits" },
  { value: "sweets", label: "Sweets" },
  { value: "grains", label: "Grains & Cereals" },
  { value: "spices", label: "Spices & Seasonings" },
  { value: "beverages", label: "Beverages" },
  { value: "alcohol", label: "Alcohol" },
  { value: "hot", label: "Hot" },
  { value: "cold", label: "Cold" },
  { value: "tobacco", label: "Tobacco" },
  { value: "packaging", label: "Packaging" },
  { value: "other", label: "Other" }
];

export const UNIT_OPTIONS = {
  mass: ["kg", "g", "lb", "oz"],
  volume: ["l", "ml", "gal", "fl oz"],
  piece: ["piece", "unit", "dozen"],
  package: ["piece", "bottle", "item", "unit", "ml"] // Base units that packages can contain (ml added for bottles)
};

// Helper function to validate material category
export function isValidMaterialCategory(category) {
  return MATERIAL_CATEGORIES.some(c => c.value === category);
}

// Helper function to validate unit type
export function isValidUnitType(unitType) {
  return Object.keys(UNIT_OPTIONS).includes(unitType);
}

// Helper function to validate unit for a given unit type
export function isValidUnit(unit, unitType) {
  return UNIT_OPTIONS[unitType] && UNIT_OPTIONS[unitType].includes(unit);
}

function isMassUnit(unit) {
  return ["kg", "g", "lb", "oz"].includes(unit.toLowerCase());
}

function isVolumeUnit(unit) {
  return ["l", "ml", "gal", "fl oz"].includes(unit.toLowerCase());
}

function convertMass(value, fromUnit, toUnit) {
  const units = {
    kg: 1,
    g: 0.001,
    lb: 0.453592,
    oz: 0.0283495
  };
  return units[fromUnit] && units[toUnit] ? (value * units[fromUnit]) / units[toUnit] : value;
}

function convertVolume(value, fromUnit, toUnit) {
  const units = {
    l: 1,
    ml: 0.001,
    gal: 3.78541,
    "fl oz": 0.0295735
  };
  return units[fromUnit] && units[toUnit] ? (value * units[fromUnit]) / units[toUnit] : value;
}

function calculateStockConversion(stockEntry, material) {
  // Use remaining individual quantity if available, otherwise fall back to purchased quantity
  let convertedQuantity = stockEntry.purchasedIndividualQuantity !== undefined ? stockEntry.purchasedIndividualQuantity : stockEntry.purchasedQuantity;

  let conversionFactor = 1;

  // For individual quantities, they should already be in base units
  if (stockEntry.purchasedIndividualQuantity !== undefined && stockEntry.purchasedIndividualUnit) {
    // Individual quantities are already converted to base units
    convertedQuantity = stockEntry.purchasedIndividualQuantity;
    conversionFactor = 1;
  } else {
    // Legacy fallback: Convert purchased quantity to base unit
    if (stockEntry.purchasedUnit !== material.baseUnit) {
      if (isMassUnit(stockEntry.purchasedUnit) && isMassUnit(material.baseUnit)) {
        convertedQuantity = convertMass(stockEntry.purchasedQuantity, stockEntry.purchasedUnit, material.baseUnit);
        conversionFactor = convertedQuantity / stockEntry.purchasedQuantity;
      } else if (isVolumeUnit(stockEntry.purchasedUnit) && isVolumeUnit(material.baseUnit)) {
        convertedQuantity = convertVolume(stockEntry.purchasedQuantity, stockEntry.purchasedUnit, material.baseUnit);
        conversionFactor = convertedQuantity / stockEntry.purchasedQuantity;
      } else if (material.unitType === "package") {
        // Handle package unit conversions using dynamic packageQuantity
        if (material.packageQuantity && material.packageQuantity > 0) {
          convertedQuantity = stockEntry.purchasedQuantity * material.packageQuantity;
          conversionFactor = material.packageQuantity;
        } else {
          console.warn(`Material "${material.name}" (ID: ${material.id}) is a package unit but has no packageQuantity set. Using 1:1 conversion.`);
          convertedQuantity = stockEntry.purchasedQuantity;
          conversionFactor = 1;
        }
      }
    }
  }

  const costPerBaseUnit = convertedQuantity > 0 ? stockEntry.totalCost / convertedQuantity : 0;
  return {
    convertedQuantity,
    convertedUnit: stockEntry.purchasedIndividualUnit || material.baseUnit,
    costPerBaseUnit,
    totalCostInBaseUnit: stockEntry.totalCost,
    conversionFactor
  };
}

export default { calculateStockConversion };

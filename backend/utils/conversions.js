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
  let convertedQuantity = stockEntry.purchasedQuantity;
  let conversionFactor = 1;

  if (stockEntry.purchasedUnit !== material.baseUnit) {
    if (isMassUnit(stockEntry.purchasedUnit)) {
      convertedQuantity = convertMass(stockEntry.purchasedQuantity, stockEntry.purchasedUnit, material.baseUnit);
      conversionFactor = convertedQuantity / stockEntry.purchasedQuantity;
    } else if (isVolumeUnit(stockEntry.purchasedUnit)) {
      convertedQuantity = convertVolume(stockEntry.purchasedQuantity, stockEntry.purchasedUnit, material.baseUnit);
      conversionFactor = convertedQuantity / stockEntry.purchasedQuantity;
    }
  }

  const costPerBaseUnit = convertedQuantity > 0 ? stockEntry.totalCost / convertedQuantity : 0;
  return {
    convertedQuantity,
    convertedUnit: material.baseUnit,
    costPerBaseUnit,
    totalCostInBaseUnit: stockEntry.totalCost,
    conversionFactor
  };
}

export default { calculateStockConversion };

import StockCalculationService from "./stockCalculationService.js";

/**
 * Stock Validation Service
 * Validates data consistency before database operations
 */
class StockValidationService {
  
  /**
   * Validation error types
   */
  static ERROR_TYPES = {
    INVALID_QUANTITY: 'INVALID_QUANTITY',
    INVALID_UNIT: 'INVALID_UNIT',
    INVALID_COST: 'INVALID_COST',
    MATERIAL_NOT_FOUND: 'MATERIAL_NOT_FOUND',
    UNIT_MISMATCH: 'UNIT_MISMATCH',
    INSUFFICIENT_STOCK: 'INSUFFICIENT_STOCK',
    INVALID_CONVERSION: 'INVALID_CONVERSION'
  };

  /**
   * Create validation error
   */
  static createError(type, message, field = null, value = null) {
    return {
      type,
      message,
      field,
      value,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Validate basic stock entry data
   */
  static validateStockEntryData(data) {
    const errors = [];

    // Validate required fields
    if (!data.materialId) {
      errors.push(this.createError(
        this.ERROR_TYPES.MATERIAL_NOT_FOUND,
        'Material ID is required',
        'materialId',
        data.materialId
      ));
    }

    if (!data.purchasedQuantity || data.purchasedQuantity <= 0) {
      errors.push(this.createError(
        this.ERROR_TYPES.INVALID_QUANTITY,
        'Purchased quantity must be a positive number',
        'purchasedQuantity',
        data.purchasedQuantity
      ));
    }

    if (!data.purchasedUnit || data.purchasedUnit.trim() === '') {
      errors.push(this.createError(
        this.ERROR_TYPES.INVALID_UNIT,
        'Purchased unit is required',
        'purchasedUnit',
        data.purchasedUnit
      ));
    }

    if (data.totalCost !== undefined && data.totalCost < 0) {
      errors.push(this.createError(
        this.ERROR_TYPES.INVALID_COST,
        'Total cost cannot be negative',
        'totalCost',
        data.totalCost
      ));
    }

    if (data.costPerPurchasedUnit !== undefined && data.costPerPurchasedUnit < 0) {
      errors.push(this.createError(
        this.ERROR_TYPES.INVALID_COST,
        'Cost per unit cannot be negative',
        'costPerPurchasedUnit',
        data.costPerPurchasedUnit
      ));
    }

    return errors;
  }

  /**
   * Validate unit compatibility with material
   */
  static validateUnitCompatibility(unit, material) {
    const errors = [];

    if (!material) {
      errors.push(this.createError(
        this.ERROR_TYPES.MATERIAL_NOT_FOUND,
        'Material not found for unit validation',
        'material',
        null
      ));
      return errors;
    }

    const isMassUnit = StockCalculationService.isMassUnit(unit);
    const isVolumeUnit = StockCalculationService.isVolumeUnit(unit);

    // Check unit compatibility with material type
    if (material.unitType === 'mass' && !isMassUnit && unit !== material.baseUnit && unit !== material.inputUnit) {
      errors.push(this.createError(
        this.ERROR_TYPES.UNIT_MISMATCH,
        `Unit '${unit}' is not compatible with mass material '${material.name}'`,
        'purchasedUnit',
        unit
      ));
    }

    if (material.unitType === 'volume' && !isVolumeUnit && unit !== material.baseUnit && unit !== material.inputUnit) {
      errors.push(this.createError(
        this.ERROR_TYPES.UNIT_MISMATCH,
        `Unit '${unit}' is not compatible with volume material '${material.name}'`,
        'purchasedUnit',
        unit
      ));
    }

    return errors;
  }

  /**
   * Validate conversion calculations
   */
  static validateConversions(data, material) {
    const errors = [];

    try {
      // Test individual quantity calculation
      const { individualQuantity, individualUnit } = StockCalculationService.calculateIndividualQuantity(
        data.purchasedQuantity, data.purchasedUnit, material
      );

      if (isNaN(individualQuantity) || individualQuantity < 0) {
        errors.push(this.createError(
          this.ERROR_TYPES.INVALID_CONVERSION,
          'Individual quantity conversion resulted in invalid value',
          'individualQuantity',
          individualQuantity
        ));
      }

      // Test converted quantity calculation
      const { convertedQuantity, convertedUnit } = StockCalculationService.calculateConvertedQuantity(
        data.purchasedQuantity, data.purchasedUnit, individualQuantity, individualUnit, material
      );

      if (isNaN(convertedQuantity) || convertedQuantity < 0) {
        errors.push(this.createError(
          this.ERROR_TYPES.INVALID_CONVERSION,
          'Converted quantity calculation resulted in invalid value',
          'convertedQuantity',
          convertedQuantity
        ));
      }

      // Test enhanced values calculation
      const enhancedValues = StockCalculationService.calculateEnhancedValues(
        { ...data, purchasedIndividualQuantity: individualQuantity },
        material,
        data.totalCost
      );

      // Validate enhanced values are reasonable
      if (enhancedValues.totalMass && (isNaN(enhancedValues.totalMass) || enhancedValues.totalMass < 0)) {
        errors.push(this.createError(
          this.ERROR_TYPES.INVALID_CONVERSION,
          'Total mass calculation resulted in invalid value',
          'totalMass',
          enhancedValues.totalMass
        ));
      }

      if (enhancedValues.totalVolume && (isNaN(enhancedValues.totalVolume) || enhancedValues.totalVolume < 0)) {
        errors.push(this.createError(
          this.ERROR_TYPES.INVALID_CONVERSION,
          'Total volume calculation resulted in invalid value',
          'totalVolume',
          enhancedValues.totalVolume
        ));
      }

      if (enhancedValues.totalPieces && (isNaN(enhancedValues.totalPieces) || enhancedValues.totalPieces < 0)) {
        errors.push(this.createError(
          this.ERROR_TYPES.INVALID_CONVERSION,
          'Total pieces calculation resulted in invalid value',
          'totalPieces',
          enhancedValues.totalPieces
        ));
      }

    } catch (conversionError) {
      errors.push(this.createError(
        this.ERROR_TYPES.INVALID_CONVERSION,
        `Conversion calculation failed: ${conversionError.message}`,
        'conversion',
        null
      ));
    }

    return errors;
  }

  /**
   * Validate waste operation
   */
  static validateWasteOperation(wasteQuantity, wasteUnit, stockEntry, material) {
    const errors = [];

    if (!wasteQuantity || wasteQuantity <= 0) {
      errors.push(this.createError(
        this.ERROR_TYPES.INVALID_QUANTITY,
        'Waste quantity must be a positive number',
        'wasteQuantity',
        wasteQuantity
      ));
    }

    if (!wasteUnit || wasteUnit.trim() === '') {
      errors.push(this.createError(
        this.ERROR_TYPES.INVALID_UNIT,
        'Waste unit is required',
        'wasteUnit',
        wasteUnit
      ));
    }

    // Validate sufficient stock
    if (stockEntry && material) {
      try {
        // Determine available quantity based on material type
        let availableQuantity = 0;
        let availableUnit = '';

        if (material.unitType === 'volume' && stockEntry.totalVolume > 0) {
          availableQuantity = stockEntry.totalVolume;
          availableUnit = stockEntry.volumeUnit || 'ml';
        } else if (material.unitType === 'mass') {
          // For mass materials, use totalMass if available, otherwise calculate from purchased quantity
          if (stockEntry.totalMass > 0) {
            availableQuantity = stockEntry.totalMass;
            availableUnit = stockEntry.massUnit || 'g';
          } else {
            // Calculate mass from purchased quantity
            availableQuantity = parseFloat(stockEntry.purchasedQuantity) || 0;
            availableUnit = stockEntry.purchasedUnit;
            
            // Convert to grams if it's a mass unit
            if (StockCalculationService.isMassUnit(availableUnit)) {
              availableQuantity = StockCalculationService.convertMassToGrams(availableQuantity, availableUnit);
              availableUnit = 'g';
            }
          }
        } else if (stockEntry.totalPieces > 0) {
          availableQuantity = stockEntry.totalPieces;
          availableUnit = material.baseUnit || 'piece';
        } else {
          availableQuantity = parseFloat(stockEntry.purchasedQuantity) || 0;
          availableUnit = stockEntry.purchasedUnit;
        }

        // Convert waste quantity to available unit for comparison
        let wasteInAvailableUnit = wasteQuantity;
        if (wasteUnit !== availableUnit) {
          if (material.unitType === 'mass') {
            const wasteInGrams = StockCalculationService.convertMassToGrams(wasteQuantity, wasteUnit);
            const availableInGrams = StockCalculationService.convertMassToGrams(availableQuantity, availableUnit);
            wasteInAvailableUnit = wasteInGrams;
            availableQuantity = availableInGrams;
          } else if (material.unitType === 'volume') {
            const wasteInMl = StockCalculationService.convertVolumeToMl(wasteQuantity, wasteUnit, material);
            const availableInMl = StockCalculationService.convertVolumeToMl(availableQuantity, availableUnit, material);
            wasteInAvailableUnit = wasteInMl;
            availableQuantity = availableInMl;
          }
        }

        if (wasteInAvailableUnit > availableQuantity) {
          errors.push(this.createError(
            this.ERROR_TYPES.INSUFFICIENT_STOCK,
            `Insufficient stock. Available: ${availableQuantity} ${availableUnit}, Requested: ${wasteInAvailableUnit.toFixed(3)} ${availableUnit}`,
            'wasteQuantity',
            wasteQuantity
          ));
        }

      } catch (validationError) {
        errors.push(this.createError(
          this.ERROR_TYPES.INVALID_CONVERSION,
          `Stock validation failed: ${validationError.message}`,
          'stockValidation',
          null
        ));
      }
    }

    return errors;
  }

  /**
   * Comprehensive validation for stock entry creation
   */
  static async validateStockEntryCreation(data, material) {
    const errors = [];

    // Basic data validation
    errors.push(...this.validateStockEntryData(data));

    if (material) {
      // Unit compatibility validation
      errors.push(...this.validateUnitCompatibility(data.purchasedUnit, material));

      // Conversion validation (only if basic validation passes)
      if (errors.length === 0) {
        errors.push(...this.validateConversions(data, material));
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      summary: errors.length > 0 ? `${errors.length} validation error(s) found` : 'Validation passed'
    };
  }

  /**
   * Comprehensive validation for waste operation
   */
  static async validateWasteFromStock(wasteData, stockEntry, material) {
    const errors = [];

    // Waste operation validation
    errors.push(...this.validateWasteOperation(
      wasteData.wasteQuantity,
      wasteData.unit,
      stockEntry,
      material
    ));

    // Validate waste reason
    if (!wasteData.wasteReason || wasteData.wasteReason.trim() === '') {
      errors.push(this.createError(
        this.ERROR_TYPES.INVALID_UNIT,
        'Waste reason is required',
        'wasteReason',
        wasteData.wasteReason
      ));
    }

    return {
      isValid: errors.length === 0,
      errors,
      summary: errors.length > 0 ? `${errors.length} validation error(s) found` : 'Validation passed'
    };
  }

  /**
   * Format validation errors for API response
   */
  static formatValidationErrors(validationResult) {
    if (validationResult.isValid) {
      return null;
    }

    return {
      message: 'Validation failed',
      summary: validationResult.summary,
      errors: validationResult.errors.map(error => ({
        type: error.type,
        message: error.message,
        field: error.field,
        value: error.value
      }))
    };
  }
}

export default StockValidationService;

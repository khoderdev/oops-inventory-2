import { describe, it, expect, beforeEach } from 'vitest';
import StockValidationService from '../services/stockValidationService.js';

describe('StockValidationService', () => {
  let mockMaterials;
  let mockStockEntry;

  beforeEach(() => {
    mockMaterials = {
      massType: {
        id: 1,
        name: 'Flour',
        unitType: 'mass',
        baseUnit: 'g',
        inputUnit: 'kg',
        massPerUnit: 1000,
        massUnit: 'g'
      },
      volumeType: {
        id: 2,
        name: 'Milk',
        unitType: 'volume',
        baseUnit: 'ml',
        inputUnit: 'l',
        volumePerUnit: 1000,
        volumeUnit: 'ml'
      },
      packageType: {
        id: 3,
        name: 'Napkins',
        unitType: 'package',
        baseUnit: 'piece',
        inputUnit: 'pack',
        packageQuantity: 50,
        piecesPerPackage: 50
      }
    };

    mockStockEntry = {
      id: 1,
      materialId: 1,
      purchasedQuantity: 5000,
      purchasedUnit: 'g',
      totalMass: 5000,
      massUnit: 'g',
      totalVolume: 0,
      volumeUnit: 'ml',
      totalPieces: 0,
      totalCost: 25
    };
  });

  describe('Basic Data Validation', () => {
    it('should validate required fields', () => {
      const invalidData = {};
      const errors = StockValidationService.validateStockEntryData(invalidData);

      expect(errors).toHaveLength(3);
      expect(errors[0].type).toBe(StockValidationService.ERROR_TYPES.MATERIAL_NOT_FOUND);
      expect(errors[1].type).toBe(StockValidationService.ERROR_TYPES.INVALID_QUANTITY);
      expect(errors[2].type).toBe(StockValidationService.ERROR_TYPES.INVALID_UNIT);
    });

    it('should validate positive quantities', () => {
      const invalidData = {
        materialId: 1,
        purchasedQuantity: -5,
        purchasedUnit: 'kg'
      };
      const errors = StockValidationService.validateStockEntryData(invalidData);

      expect(errors).toHaveLength(1);
      expect(errors[0].type).toBe(StockValidationService.ERROR_TYPES.INVALID_QUANTITY);
      expect(errors[0].field).toBe('purchasedQuantity');
    });

    it('should validate non-negative costs', () => {
      const invalidData = {
        materialId: 1,
        purchasedQuantity: 5,
        purchasedUnit: 'kg',
        totalCost: -10
      };
      const errors = StockValidationService.validateStockEntryData(invalidData);

      expect(errors).toHaveLength(1);
      expect(errors[0].type).toBe(StockValidationService.ERROR_TYPES.INVALID_COST);
      expect(errors[0].field).toBe('totalCost');
    });

    it('should pass validation for valid data', () => {
      const validData = {
        materialId: 1,
        purchasedQuantity: 5,
        purchasedUnit: 'kg',
        totalCost: 25,
        costPerPurchasedUnit: 5
      };
      const errors = StockValidationService.validateStockEntryData(validData);

      expect(errors).toHaveLength(0);
    });
  });

  describe('Unit Compatibility Validation', () => {
    it('should validate mass units for mass materials', () => {
      const errors = StockValidationService.validateUnitCompatibility('kg', mockMaterials.massType);
      expect(errors).toHaveLength(0);
    });

    it('should validate volume units for volume materials', () => {
      const errors = StockValidationService.validateUnitCompatibility('l', mockMaterials.volumeType);
      expect(errors).toHaveLength(0);
    });

    it('should allow base units for any material', () => {
      const errors = StockValidationService.validateUnitCompatibility('g', mockMaterials.massType);
      expect(errors).toHaveLength(0);
    });

    it('should allow input units for any material', () => {
      const errors = StockValidationService.validateUnitCompatibility('kg', mockMaterials.massType);
      expect(errors).toHaveLength(0);
    });

    it('should reject incompatible units', () => {
      const errors = StockValidationService.validateUnitCompatibility('l', mockMaterials.massType);
      expect(errors).toHaveLength(1);
      expect(errors[0].type).toBe(StockValidationService.ERROR_TYPES.UNIT_MISMATCH);
    });

    it('should handle missing material', () => {
      const errors = StockValidationService.validateUnitCompatibility('kg', null);
      expect(errors).toHaveLength(1);
      expect(errors[0].type).toBe(StockValidationService.ERROR_TYPES.MATERIAL_NOT_FOUND);
    });
  });

  describe('Conversion Validation', () => {
    it('should validate successful conversions', () => {
      const validData = {
        purchasedQuantity: 2,
        purchasedUnit: 'kg',
        totalCost: 20
      };
      const errors = StockValidationService.validateConversions(validData, mockMaterials.massType);
      expect(errors).toHaveLength(0);
    });

    it('should detect invalid conversion results', () => {
      const invalidData = {
        purchasedQuantity: NaN,
        purchasedUnit: 'kg',
        totalCost: 20
      };
      const errors = StockValidationService.validateConversions(invalidData, mockMaterials.massType);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].type).toBe(StockValidationService.ERROR_TYPES.INVALID_CONVERSION);
    });
  });

  describe('Waste Operation Validation', () => {
    it('should validate positive waste quantities', () => {
      const errors = StockValidationService.validateWasteOperation(
        -5, 'g', mockStockEntry, mockMaterials.massType
      );
      expect(errors).toHaveLength(1);
      expect(errors[0].type).toBe(StockValidationService.ERROR_TYPES.INVALID_QUANTITY);
    });

    it('should validate waste unit is provided', () => {
      const errors = StockValidationService.validateWasteOperation(
        5, '', mockStockEntry, mockMaterials.massType
      );
      expect(errors).toHaveLength(1);
      expect(errors[0].type).toBe(StockValidationService.ERROR_TYPES.INVALID_UNIT);
    });

    it('should validate sufficient stock for mass materials', () => {
      const errors = StockValidationService.validateWasteOperation(
        6000, 'g', mockStockEntry, mockMaterials.massType
      );
      expect(errors).toHaveLength(1);
      expect(errors[0].type).toBe(StockValidationService.ERROR_TYPES.INSUFFICIENT_STOCK);
    });

    it('should allow valid waste operations', () => {
      const errors = StockValidationService.validateWasteOperation(
        1000, 'g', mockStockEntry, mockMaterials.massType
      );
      expect(errors).toHaveLength(0);
    });

    it('should handle unit conversions in waste validation', () => {
      const errors = StockValidationService.validateWasteOperation(
        1, 'kg', mockStockEntry, mockMaterials.massType
      );
      expect(errors).toHaveLength(0);
    });

    it('should detect excessive waste with unit conversion', () => {
      const errors = StockValidationService.validateWasteOperation(
        10, 'kg', mockStockEntry, mockMaterials.massType
      );
      expect(errors).toHaveLength(1);
      expect(errors[0].type).toBe(StockValidationService.ERROR_TYPES.INSUFFICIENT_STOCK);
    });
  });

  describe('Comprehensive Validation', () => {
    it('should perform complete stock entry creation validation', async () => {
      const validData = {
        materialId: 1,
        purchasedQuantity: 2,
        purchasedUnit: 'kg',
        totalCost: 20
      };

      const result = await StockValidationService.validateStockEntryCreation(
        validData, mockMaterials.massType
      );

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.summary).toBe('Validation passed');
    });

    it('should perform complete waste operation validation', async () => {
      const validWasteData = {
        wasteQuantity: 500,
        unit: 'g',
        wasteReason: 'Expired'
      };

      const result = await StockValidationService.validateWasteFromStock(
        validWasteData, mockStockEntry, mockMaterials.massType
      );

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.summary).toBe('Validation passed');
    });

    it('should require waste reason', async () => {
      const invalidWasteData = {
        wasteQuantity: 500,
        unit: 'g',
        wasteReason: ''
      };

      const result = await StockValidationService.validateWasteFromStock(
        invalidWasteData, mockStockEntry, mockMaterials.massType
      );

      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].field).toBe('wasteReason');
    });
  });

  describe('Error Formatting', () => {
    it('should format validation errors for API response', () => {
      const invalidData = {
        materialId: null,
        purchasedQuantity: -5,
        purchasedUnit: ''
      };

      const errors = StockValidationService.validateStockEntryData(invalidData);
      const validationResult = {
        isValid: false,
        errors,
        summary: `${errors.length} validation error(s) found`
      };

      const formatted = StockValidationService.formatValidationErrors(validationResult);

      expect(formatted).toBeDefined();
      expect(formatted.message).toBe('Validation failed');
      expect(formatted.errors).toHaveLength(3);
      expect(formatted.errors[0]).toHaveProperty('type');
      expect(formatted.errors[0]).toHaveProperty('message');
      expect(formatted.errors[0]).toHaveProperty('field');
    });

    it('should return null for valid data', () => {
      const validResult = {
        isValid: true,
        errors: [],
        summary: 'Validation passed'
      };

      const formatted = StockValidationService.formatValidationErrors(validResult);
      expect(formatted).toBeNull();
    });
  });

  describe('Error Types', () => {
    it('should have all required error types defined', () => {
      expect(StockValidationService.ERROR_TYPES.INVALID_QUANTITY).toBeDefined();
      expect(StockValidationService.ERROR_TYPES.INVALID_UNIT).toBeDefined();
      expect(StockValidationService.ERROR_TYPES.INVALID_COST).toBeDefined();
      expect(StockValidationService.ERROR_TYPES.MATERIAL_NOT_FOUND).toBeDefined();
      expect(StockValidationService.ERROR_TYPES.UNIT_MISMATCH).toBeDefined();
      expect(StockValidationService.ERROR_TYPES.INSUFFICIENT_STOCK).toBeDefined();
      expect(StockValidationService.ERROR_TYPES.INVALID_CONVERSION).toBeDefined();
    });

    it('should create error objects with correct structure', () => {
      const error = StockValidationService.createError(
        StockValidationService.ERROR_TYPES.INVALID_QUANTITY,
        'Test message',
        'testField',
        'testValue'
      );

      expect(error.type).toBe(StockValidationService.ERROR_TYPES.INVALID_QUANTITY);
      expect(error.message).toBe('Test message');
      expect(error.field).toBe('testField');
      expect(error.value).toBe('testValue');
      expect(error.timestamp).toBeDefined();
    });
  });
});

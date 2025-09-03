import { describe, it, expect, beforeEach } from 'vitest';
import StockCalculationService from '../services/stockCalculationService.js';

describe('StockCalculationService', () => {
  let mockMaterials;

  beforeEach(() => {
    mockMaterials = {
      massType: {
        id: 1,
        name: 'Flour',
        unitType: 'mass',
        baseUnit: 'g',
        massPerUnit: 1000,
        massUnit: 'g'
      },
      volumeType: {
        id: 2,
        name: 'Milk',
        unitType: 'volume',
        baseUnit: 'ml',
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
      },
      beverageType: {
        id: 4,
        name: 'Beer',
        unitType: 'package',
        baseUnit: 'bottle',
        volumePerUnit: 330,
        volumeUnit: 'ml',
        packageQuantity: 6
      },
      pieceType: {
        id: 5,
        name: 'Plates',
        unitType: 'piece',
        baseUnit: 'piece',
        unitDescription: 'plates'
      }
    };
  });

  describe('Unit Type Detection', () => {
    it('should correctly identify mass units', () => {
      expect(StockCalculationService.isMassUnit('kg')).toBe(true);
      expect(StockCalculationService.isMassUnit('g')).toBe(true);
      expect(StockCalculationService.isMassUnit('lb')).toBe(true);
      expect(StockCalculationService.isMassUnit('oz')).toBe(true);
      expect(StockCalculationService.isMassUnit('ml')).toBe(false);
      expect(StockCalculationService.isMassUnit('piece')).toBe(false);
    });

    it('should correctly identify volume units', () => {
      expect(StockCalculationService.isVolumeUnit('ml')).toBe(true);
      expect(StockCalculationService.isVolumeUnit('l')).toBe(true);
      expect(StockCalculationService.isVolumeUnit('cl')).toBe(true);
      expect(StockCalculationService.isVolumeUnit('kg')).toBe(false);
      expect(StockCalculationService.isVolumeUnit('piece')).toBe(false);
    });
  });

  describe('Mass Conversions', () => {
    it('should convert kg to grams correctly', () => {
      expect(StockCalculationService.convertMassToGrams(1, 'kg')).toBe(1000);
      expect(StockCalculationService.convertMassToGrams(2.5, 'kg')).toBe(2500);
    });

    it('should convert pounds to grams correctly', () => {
      expect(StockCalculationService.convertMassToGrams(1, 'lb')).toBeCloseTo(453.592, 2);
    });

    it('should convert ounces to grams correctly', () => {
      expect(StockCalculationService.convertMassToGrams(1, 'oz')).toBeCloseTo(28.3495, 2);
    });

    it('should handle grams as identity conversion', () => {
      expect(StockCalculationService.convertMassToGrams(500, 'g')).toBe(500);
    });

    it('should handle unknown units gracefully', () => {
      expect(StockCalculationService.convertMassToGrams(100, 'unknown')).toBe(100);
    });
  });

  describe('Volume Conversions', () => {
    it('should convert liters to milliliters correctly', () => {
      expect(StockCalculationService.convertVolumeToMl(1, 'l')).toBe(1000);
      expect(StockCalculationService.convertVolumeToMl(2.5, 'l')).toBe(2500);
    });

    it('should convert centiliters to milliliters correctly', () => {
      expect(StockCalculationService.convertVolumeToMl(10, 'cl')).toBe(100);
    });

    it('should handle milliliters as identity conversion', () => {
      expect(StockCalculationService.convertVolumeToMl(500, 'ml')).toBe(500);
    });

    it('should handle unknown units gracefully', () => {
      expect(StockCalculationService.convertVolumeToMl(100, 'unknown')).toBe(100);
    });
  });

  describe('Individual Quantity Calculations', () => {
    it('should calculate individual quantity for mass materials', () => {
      const result = StockCalculationService.calculateIndividualQuantity(
        2, 'kg', mockMaterials.massType
      );
      expect(result.individualQuantity).toBe(2000);
      expect(result.individualUnit).toBe('g');
    });

    it('should calculate individual quantity for volume materials', () => {
      const result = StockCalculationService.calculateIndividualQuantity(
        2, 'l', mockMaterials.volumeType
      );
      expect(result.individualQuantity).toBeCloseTo(2000, 2);
      expect(result.individualUnit).toBe('ml');
    });

    it('should calculate individual quantity for package materials by input unit', () => {
      const result = StockCalculationService.calculateIndividualQuantity(
        5, 'pack', mockMaterials.packageType
      );
      expect(result.individualQuantity).toBe(250); // 5 packs × 50 pieces
      expect(result.individualUnit).toBe('piece');
    });

    it('should calculate individual quantity for package materials by base unit', () => {
      const result = StockCalculationService.calculateIndividualQuantity(
        100, 'piece', mockMaterials.packageType
      );
      expect(result.individualQuantity).toBe(100);
      expect(result.individualUnit).toBe('piece');
    });

    it('should handle piece materials correctly', () => {
      const result = StockCalculationService.calculateIndividualQuantity(
        25, 'piece', mockMaterials.pieceType
      );
      expect(result.individualQuantity).toBe(25);
      expect(result.individualUnit).toBe('piece');
    });
  });

  describe('Converted Quantity Calculations', () => {
    it('should calculate converted quantity for mass materials', () => {
      const result = StockCalculationService.calculateConvertedQuantity(
        2, 'kg', 2000, 'g', mockMaterials.massType
      );
      expect(result.convertedQuantity).toBeCloseTo(2000, 2);
      expect(result.convertedUnit).toBe('g');
    });

    it('should calculate converted quantity for volume materials', () => {
      const result = StockCalculationService.calculateConvertedQuantity(
        2, 'l', 2000, 'ml', mockMaterials.volumeType
      );
      expect(result.convertedQuantity).toBeCloseTo(2000, 2);
      expect(result.convertedUnit).toBe('ml');
    });

    it('should calculate converted quantity for package materials', () => {
      const result = StockCalculationService.calculateConvertedQuantity(
        5, 'pack', 250, 'piece', mockMaterials.packageType
      );
      expect(result.convertedQuantity).toBe(5);
      expect(result.convertedUnit).toBe('pack');
    });
  });

  describe('Enhanced Values Calculations', () => {
    it('should calculate enhanced values for mass materials', () => {
      const stockEntry = {
        purchasedQuantity: 2,
        purchasedUnit: 'kg',
        purchasedIndividualQuantity: 2000
      };
      
      const result = StockCalculationService.calculateEnhancedValues(
        stockEntry, mockMaterials.massType, 20
      );

      expect(result.massUnit).toBe('g');
      expect(result.massPerUnit).toBe(1000);
      expect(result.totalMass).toBeCloseTo(2000000, 2); // 2000 × 1000
      expect(result.costPerMassUnit).toBeCloseTo(0.00001, 6); // 20 ÷ 2000000
    });

    it('should calculate enhanced values for volume materials', () => {
      const stockEntry = {
        purchasedQuantity: 2,
        purchasedUnit: 'l',
        purchasedIndividualQuantity: 2000
      };
      
      const result = StockCalculationService.calculateEnhancedValues(
        stockEntry, mockMaterials.volumeType, 15
      );

      expect(result.volumePerUnit).toBe(1000);
      expect(result.volumeUnit).toBe('ml');
      expect(result.totalVolume).toBeCloseTo(2000000, 2); // 2000 × 1000
      expect(result.costPerVolumeUnit).toBeCloseTo(0.0000075, 6); // 15 ÷ 2000000
    });

    it('should calculate enhanced values for package materials without volume', () => {
      const stockEntry = {
        purchasedQuantity: 10,
        purchasedUnit: 'pack',
        purchasedIndividualQuantity: 500
      };
      
      const result = StockCalculationService.calculateEnhancedValues(
        stockEntry, mockMaterials.packageType, 25
      );

      expect(result.piecesPerPackage).toBe(50);
      expect(result.totalPieces).toBe(500); // 10 × 50
      expect(result.costPerPiece).toBeCloseTo(0.05, 6); // 25 ÷ 500
    });

    it('should calculate enhanced values for beverage package materials', () => {
      const stockEntry = {
        purchasedQuantity: 4,
        purchasedUnit: 'pack',
        purchasedIndividualQuantity: 24
      };
      
      const result = StockCalculationService.calculateEnhancedValues(
        stockEntry, mockMaterials.beverageType, 30
      );

      expect(result.volumePerUnit).toBe(330);
      expect(result.volumeUnit).toBe('ml');
      expect(result.totalVolume).toBeCloseTo(7920, 2); // 24 × 330
      expect(result.costPerVolumeUnit).toBeCloseTo(0.003787, 5); // 30 ÷ 7920
    });

    it('should calculate enhanced values for piece materials', () => {
      const stockEntry = {
        purchasedQuantity: 50,
        purchasedUnit: 'piece',
        purchasedIndividualQuantity: 50
      };
      
      const result = StockCalculationService.calculateEnhancedValues(
        stockEntry, mockMaterials.pieceType, 12.5
      );

      expect(result.totalPieces).toBe(50);
      expect(result.costPerPiece).toBe(0.25); // 12.5 ÷ 50
      expect(result.unitDescription).toBe('plates');
    });
  });

  describe('Complete Calculations', () => {
    it('should perform complete calculations for mass materials', () => {
      const stockEntryData = {
        purchasedQuantity: 5,
        purchasedUnit: 'kg',
        totalCost: 50
      };

      const result = StockCalculationService.calculateAllValues(
        stockEntryData, mockMaterials.massType
      );

      expect(result.purchasedIndividualQuantity).toBe(5000);
      expect(result.purchasedIndividualUnit).toBe('g');
      expect(result.purchasedConvertedQuantity).toBeCloseTo(5000, 2);
      expect(result.purchasedConvertedUnit).toBe('g');
      expect(result.massUnit).toBe('g');
      expect(result.totalMass).toBeCloseTo(5000000, 2);
      expect(result.costPerMassUnit).toBeCloseTo(0.00001, 6);
    });

    it('should perform complete calculations for volume materials', () => {
      const stockEntryData = {
        purchasedQuantity: 3,
        purchasedUnit: 'l',
        totalCost: 30
      };

      const result = StockCalculationService.calculateAllValues(
        stockEntryData, mockMaterials.volumeType
      );

      expect(result.purchasedIndividualQuantity).toBeCloseTo(3000, 2);
      expect(result.purchasedIndividualUnit).toBe('ml');
      expect(result.purchasedConvertedQuantity).toBeCloseTo(3000, 2);
      expect(result.purchasedConvertedUnit).toBe('ml');
      expect(result.volumePerUnit).toBe(1000);
      expect(result.totalVolume).toBeCloseTo(3000000, 2);
      expect(result.costPerVolumeUnit).toBeCloseTo(0.00001, 6);
    });

    it('should perform complete calculations for package materials', () => {
      const stockEntryData = {
        purchasedQuantity: 8,
        purchasedUnit: 'pack',
        totalCost: 40
      };

      const result = StockCalculationService.calculateAllValues(
        stockEntryData, mockMaterials.packageType
      );

      expect(result.purchasedIndividualQuantity).toBe(400); // 8 × 50
      expect(result.purchasedIndividualUnit).toBe('piece');
      expect(result.purchasedConvertedQuantity).toBe(8);
      expect(result.purchasedConvertedUnit).toBe('pack');
      expect(result.piecesPerPackage).toBe(50);
      expect(result.totalPieces).toBe(400);
      expect(result.costPerPiece).toBe(0.1); // 40 ÷ 400
    });
  });

  describe('Edge Cases', () => {
    it('should handle zero quantities gracefully', () => {
      const stockEntryData = {
        purchasedQuantity: 0,
        purchasedUnit: 'kg',
        totalCost: 0
      };

      const result = StockCalculationService.calculateAllValues(
        stockEntryData, mockMaterials.massType
      );

      expect(result.purchasedIndividualQuantity).toBe(0);
      expect(result.totalMass).toBe(0);
      expect(result.costPerMassUnit).toBe(0);
    });

    it('should handle zero cost gracefully', () => {
      const stockEntryData = {
        purchasedQuantity: 5,
        purchasedUnit: 'kg',
        totalCost: 0
      };

      const result = StockCalculationService.calculateAllValues(
        stockEntryData, mockMaterials.massType
      );

      expect(result.purchasedIndividualQuantity).toBe(5000);
      expect(result.totalMass).toBeCloseTo(5000000, 2);
      expect(result.costPerMassUnit).toBe(0);
    });

    it('should handle materials without enhanced properties', () => {
      const simpleMaterial = {
        id: 6,
        name: 'Simple Item',
        unitType: 'mass',
        baseUnit: 'g'
        // No massPerUnit or massUnit
      };

      const stockEntryData = {
        purchasedQuantity: 2,
        purchasedUnit: 'kg',
        totalCost: 20
      };

      const result = StockCalculationService.calculateAllValues(
        stockEntryData, simpleMaterial
      );

      expect(result.purchasedIndividualQuantity).toBe(2000);
      expect(result.massUnit).toBe('g');
      expect(result.totalMass).toBeCloseTo(2000, 2);
      expect(result.costPerMassUnit).toBeCloseTo(0.01, 6);
    });
  });
});

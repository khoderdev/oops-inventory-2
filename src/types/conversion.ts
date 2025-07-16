// Core conversion types and interfaces

export type MassUnit = 'kg' | 'gram' | 'lb';
export type VolumeUnit = 'liter' | 'ml' | 'gallon';
export type PackageUnit = 'box' | 'pack' | 'case' | 'piece' | 'bottle';

export interface ConversionResult {
  value: number;
  unit: string;
  cost: number;
  breakdown: string[];
}

export interface PackagedGood {
  name: string;
  packageType: PackageUnit;
  unitsPerPackage: number;
  costPerPackage: number;
  baseUnit: string;
}

export interface ConversionInput {
  value: number;
  fromUnit: string;
  toUnit: string;
  costPer?: number;
  costUnit?: string;
}

export interface CalculationBreakdown {
  originalValue: number;
  originalUnit: string;
  convertedValue: number;
  convertedUnit: string;
  costCalculation: string;
  totalCost: number;
  steps: string[];
}
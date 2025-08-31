import React, { useState, useEffect, useMemo } from 'react';
import { UnitType, Material } from '@/types/inventory';
import { EnhancedUnitConverter } from '@/utils/enhancedConversions';
import { getSuggestedUnits } from '@/utils/inventoryCalculations';
import { UNIT_DEFINITIONS } from '@/utils/enhancedConversions';

export interface UnitConverterProps {
  // Core conversion data
  materialType?: 'food' | 'beverage' | 'other';
  unitType: UnitType;
  baseUnit: string;
  inputUnit?: string;
  packageQuantity?: number;
  
  // Quantity and cost inputs
  quantity: number;
  costPerUnit: number;
  totalCost?: number;
  
  // Beverage-specific inputs
  volumePerBottle?: number;
  volumeUnit?: string;
  
  // Callbacks for data updates
  onQuantityChange?: (quantity: number) => void;
  onInputUnitChange?: (unit: string) => void;
  onCostPerUnitChange?: (cost: number) => void;
  onTotalCostChange?: (cost: number) => void;
  onVolumePerBottleChange?: (volume: number) => void;
  onVolumeUnitChange?: (unit: string) => void;
  onPackageQuantityChange?: (quantity: number) => void;
  
  // Display options
  showConversionInfo?: boolean;
  showCostBreakdown?: boolean;
  showVolumeInputs?: boolean;
  showPackageInputs?: boolean;
  
  // Form integration
  className?: string;
  disabled?: boolean;
  
  // Material context (optional)
  material?: Material;
}

export const UnitConverter: React.FC<UnitConverterProps> = ({
  materialType = 'other',
  unitType,
  baseUnit,
  inputUnit,
  packageQuantity,
  quantity,
  costPerUnit,
  totalCost,
  volumePerBottle,
  volumeUnit = 'ml',
  onQuantityChange,
  onInputUnitChange,
  onCostPerUnitChange,
  onTotalCostChange,
  onVolumePerBottleChange,
  onVolumeUnitChange,
  onPackageQuantityChange,
  showConversionInfo = true,
  showCostBreakdown = true,
  showVolumeInputs = false,
  showPackageInputs = false,
  className = '',
  disabled = false,
  material
}) => {
  // Internal state for calculations
  const [conversionResult, setConversionResult] = useState<any>(null);
  const [calculationSteps, setCalculationSteps] = useState<string[]>([]);
  const [warnings, setWarnings] = useState<string[]>([]);

  // Get available units based on unit type
  const availableUnits = useMemo(() => {
    const suggested = getSuggestedUnits(materialType, unitType);
    return suggested.length > 0 ? suggested : Object.keys(UNIT_DEFINITIONS).filter(
      unit => UNIT_DEFINITIONS[unit].category === unitType
    );
  }, [materialType, unitType]);

  // Get volume units for beverage inputs
  const volumeUnits = useMemo(() => {
    return Object.keys(UNIT_DEFINITIONS).filter(
      unit => UNIT_DEFINITIONS[unit].category === 'volume'
    );
  }, []);

  // Calculate conversions and costs
  useEffect(() => {
    if (!inputUnit || !quantity || !costPerUnit) {
      setConversionResult(null);
      setCalculationSteps([]);
      setWarnings([]);
      return;
    }

    try {
      const result = EnhancedUnitConverter.convertUnits(
        quantity,
        inputUnit,
        baseUnit,
        costPerUnit,
        packageQuantity,
        volumePerBottle,
        volumeUnit
      );

      setConversionResult(result);
      setCalculationSteps(result.steps || []);
      setWarnings(result.warnings || []);
    } catch (error) {
      console.error('Conversion error:', error);
      setConversionResult(null);
      setCalculationSteps([]);
      setWarnings([`Conversion error: ${error instanceof Error ? error.message : 'Unknown error'}`]);
    }
  }, [quantity, inputUnit, baseUnit, costPerUnit, packageQuantity, volumePerBottle, volumeUnit]);

  // Handle input changes with validation
  const handleQuantityChange = (value: string) => {
    const numValue = parseFloat(value) || 0;
    onQuantityChange?.(numValue);
  };

  const handleCostPerUnitChange = (value: string) => {
    const numValue = parseFloat(value) || 0;
    onCostPerUnitChange?.(numValue);
    
    // Auto-calculate total cost if quantity is available
    if (quantity && numValue) {
      onTotalCostChange?.(quantity * numValue);
    }
  };

  const handleTotalCostChange = (value: string) => {
    const numValue = parseFloat(value) || 0;
    onTotalCostChange?.(numValue);
    
    // Auto-calculate cost per unit if quantity is available
    if (quantity && numValue) {
      onCostPerUnitChange?.(numValue / quantity);
    }
  };

  const handleVolumePerBottleChange = (value: string) => {
    const numValue = parseFloat(value) || 0;
    onVolumePerBottleChange?.(numValue);
  };

  const handlePackageQuantityChange = (value: string) => {
    const numValue = parseFloat(value) || 0;
    onPackageQuantityChange?.(numValue);
  };

  return (
    <div className={`unit-converter ${className}`}>
      {/* Main Input Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        
        {/* Quantity Input */}
        <div className="form-group">
          <label htmlFor="quantity" className="block text-sm font-medium text-gray-700 mb-1">
            Quantity *
          </label>
          <input
            id="quantity"
            type="number"
            value={quantity || ''}
            onChange={(e) => handleQuantityChange(e.target.value)}
            disabled={disabled}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Enter quantity"
            min="0"
            step="0.01"
          />
        </div>

        {/* Input Unit Selection */}
        <div className="form-group">
          <label htmlFor="inputUnit" className="block text-sm font-medium text-gray-700 mb-1">
            Input Unit *
          </label>
          <select
            id="inputUnit"
            value={inputUnit || ''}
            onChange={(e) => onInputUnitChange?.(e.target.value)}
            disabled={disabled}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">Select unit</option>
            {availableUnits.map(unit => (
              <option key={unit} value={unit}>
                {unit} - {UNIT_DEFINITIONS[unit]?.name || unit}
              </option>
            ))}
          </select>
        </div>

        {/* Base Unit Display */}
        <div className="form-group">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Base Unit
          </label>
          <div className="w-full px-3 py-2 bg-gray-100 border border-gray-300 rounded-md text-gray-600">
            {baseUnit} - {UNIT_DEFINITIONS[baseUnit]?.name || baseUnit}
          </div>
        </div>
      </div>

      {/* Package Quantity Input (for package units) */}
      {showPackageInputs && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div className="form-group">
            <label htmlFor="packageQuantity" className="block text-sm font-medium text-gray-700 mb-1">
              Package Quantity
            </label>
            <input
              id="packageQuantity"
              type="number"
              value={packageQuantity || ''}
              onChange={(e) => handlePackageQuantityChange(e.target.value)}
              disabled={disabled}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Items per package"
              min="1"
              step="1"
            />
          </div>
        </div>
      )}

      {/* Volume Per Bottle Inputs (for beverages) */}
      {showVolumeInputs && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div className="form-group">
            <label htmlFor="volumePerBottle" className="block text-sm font-medium text-gray-700 mb-1">
              Volume per Bottle
            </label>
            <input
              id="volumePerBottle"
              type="number"
              value={volumePerBottle || ''}
              onChange={(e) => handleVolumePerBottleChange(e.target.value)}
              disabled={disabled}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Volume per bottle"
              min="0"
              step="0.1"
            />
          </div>

          <div className="form-group">
            <label htmlFor="volumeUnit" className="block text-sm font-medium text-gray-700 mb-1">
              Volume Unit
            </label>
            <select
              id="volumeUnit"
              value={volumeUnit}
              onChange={(e) => onVolumeUnitChange?.(e.target.value)}
              disabled={disabled}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {volumeUnits.map(unit => (
                <option key={unit} value={unit}>
                  {unit} - {UNIT_DEFINITIONS[unit]?.name || unit}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}

      {/* Cost Input Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div className="form-group">
          <label htmlFor="costPerUnit" className="block text-sm font-medium text-gray-700 mb-1">
            Cost per {inputUnit || 'Unit'} *
          </label>
          <input
            id="costPerUnit"
            type="number"
            value={costPerUnit || ''}
            onChange={(e) => handleCostPerUnitChange(e.target.value)}
            disabled={disabled}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Cost per unit"
            min="0"
            step="0.01"
          />
        </div>

        <div className="form-group">
          <label htmlFor="totalCost" className="block text-sm font-medium text-gray-700 mb-1">
            Total Cost
          </label>
          <input
            id="totalCost"
            type="number"
            value={totalCost || ''}
            onChange={(e) => handleTotalCostChange(e.target.value)}
            disabled={disabled}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Total cost"
            min="0"
            step="0.01"
          />
        </div>
      </div>

      {/* Warnings Display */}
      {warnings.length > 0 && (
        <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
          <h4 className="text-sm font-medium text-yellow-800 mb-2">⚠️ Warnings</h4>
          <ul className="text-sm text-yellow-700 space-y-1">
            {warnings.map((warning, index) => (
              <li key={index}>• {warning}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Conversion Information Display */}
      {showConversionInfo && conversionResult && (
        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-md">
          <h4 className="text-sm font-medium text-blue-800 mb-3">📊 Unit Conversion Information</h4>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
            <div className="bg-white p-3 rounded border">
              <div className="text-xs text-gray-500 uppercase tracking-wide">Input</div>
              <div className="text-sm font-medium">
                {quantity} {inputUnit}
              </div>
            </div>
            
            <div className="bg-white p-3 rounded border">
              <div className="text-xs text-gray-500 uppercase tracking-wide">Converted</div>
              <div className="text-sm font-medium">
                {conversionResult.convertedQuantity.toFixed(4)} {conversionResult.convertedUnit}
              </div>
            </div>
            
            <div className="bg-white p-3 rounded border">
              <div className="text-xs text-gray-500 uppercase tracking-wide">Conversion Factor</div>
              <div className="text-sm font-medium">
                1 {inputUnit} = {conversionResult.conversionFactor.toFixed(6)} {baseUnit}
              </div>
            </div>
          </div>

          {/* Volume Information for Beverages */}
          {showVolumeInputs && volumePerBottle && packageQuantity && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div className="bg-white p-3 rounded border">
                <div className="text-xs text-gray-500 uppercase tracking-wide">Volume per Bottle</div>
                <div className="text-sm font-medium">
                  {volumePerBottle} {volumeUnit}
                </div>
              </div>
              
              <div className="bg-white p-3 rounded border">
                <div className="text-xs text-gray-500 uppercase tracking-wide">Total Volume</div>
                <div className="text-sm font-medium">
                  {packageQuantity} × {volumePerBottle} {volumeUnit} = {(packageQuantity * volumePerBottle).toFixed(2)} {volumeUnit}
                </div>
              </div>
            </div>
          )}

          {/* Package Information */}
          {showPackageInputs && packageQuantity && (
            <div className="bg-white p-3 rounded border mb-4">
              <div className="text-xs text-gray-500 uppercase tracking-wide">Package Contents</div>
              <div className="text-sm font-medium">
                1 {inputUnit} contains {packageQuantity} {baseUnit}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Cost Breakdown Display */}
      {showCostBreakdown && conversionResult && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-md">
          <h4 className="text-sm font-medium text-green-800 mb-3">💰 Cost Breakdown</h4>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
            <div className="bg-white p-3 rounded border">
              <div className="text-xs text-gray-500 uppercase tracking-wide">Cost per {inputUnit}</div>
              <div className="text-sm font-medium">
                ${costPerUnit.toFixed(4)}
              </div>
            </div>
            
            <div className="bg-white p-3 rounded border">
              <div className="text-xs text-gray-500 uppercase tracking-wide">Cost per {baseUnit}</div>
              <div className="text-sm font-medium">
                ${conversionResult.costPerUnit.toFixed(4)}
              </div>
            </div>
            
            <div className="bg-white p-3 rounded border">
              <div className="text-xs text-gray-500 uppercase tracking-wide">Total Cost</div>
              <div className="text-sm font-medium">
                ${conversionResult.cost.toFixed(2)}
              </div>
            </div>
          </div>

          {/* Cost calculation for packages with volume */}
          {showVolumeInputs && volumePerBottle && packageQuantity && (
            <div className="bg-white p-3 rounded border">
              <div className="text-xs text-gray-500 uppercase tracking-wide">Cost per {volumeUnit}</div>
              <div className="text-sm font-medium">
                ${(costPerUnit / volumePerBottle).toFixed(6)} per {volumeUnit}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Detailed Calculation Steps */}
      {calculationSteps.length > 0 && (
        <div className="mb-6 p-4 bg-gray-50 border border-gray-200 rounded-md">
          <h4 className="text-sm font-medium text-gray-800 mb-3">🔍 Calculation Steps</h4>
          <div className="space-y-2">
            {calculationSteps.map((step, index) => (
              <div key={index} className="text-sm text-gray-600 bg-white p-2 rounded border-l-4 border-blue-400">
                <span className="font-medium text-blue-600">Step {index + 1}:</span> {step}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Quick Reference Section */}
      <div className="mt-6 p-4 bg-gray-50 border border-gray-200 rounded-md">
        <h4 className="text-sm font-medium text-gray-800 mb-3">📋 Quick Reference</h4>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <div className="text-xs text-gray-500 uppercase tracking-wide mb-2">Available Units for {unitType}</div>
            <div className="flex flex-wrap gap-1">
              {availableUnits.slice(0, 8).map(unit => (
                <span
                  key={unit}
                  className={`px-2 py-1 text-xs rounded ${
                    unit === inputUnit 
                      ? 'bg-blue-100 text-blue-800 border border-blue-300' 
                      : 'bg-gray-100 text-gray-600 border border-gray-300'
                  }`}
                >
                  {unit}
                </span>
              ))}
              {availableUnits.length > 8 && (
                <span className="px-2 py-1 text-xs bg-gray-100 text-gray-500 rounded border border-gray-300">
                  +{availableUnits.length - 8} more
                </span>
              )}
            </div>
          </div>

          {materialType === 'beverage' && (
            <div>
              <div className="text-xs text-gray-500 uppercase tracking-wide mb-2">Common Beverage Volumes</div>
              <div className="text-xs text-gray-600 space-y-1">
                <div>• Small: 250ml, 330ml</div>
                <div>• Standard: 500ml, 750ml</div>
                <div>• Large: 1L, 1.5L</div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default UnitConverter;

import React, { useState, useCallback } from "react";
import { Input } from "./input";
import { Button } from "./button";
import { Checkbox } from "./checkbox";
import { Label } from "./label";
import { Plus } from "lucide-react";

export interface VariantData {
  selectedVariants: string[];
  variantVolumes: Record<string, number>; // Volume amount for each variant
  variantVolumeUnits: Record<string, string>; // Volume unit for each variant (cl, ml)
  variantPrices: Record<string, number>; // Individual selling price for each variant
}

interface VariantsProps {
  initialVariantSizes?: string[];
  initialSelectedVariants?: string[];
  initialVariantVolumes?: Record<string, number>;
  initialVariantVolumeUnits?: Record<string, string>;
  initialVariantPrices?: Record<string, number>;
  onChange?: (data: VariantData) => void;
  title?: string;
  description?: string;
}

export const Variants: React.FC<VariantsProps> = ({
  initialVariantSizes = ["small", "medium", "large", "glass", "shot"],
  initialSelectedVariants = [],
  initialVariantVolumes = { small: 2, medium: 3, large: 5, glass: 3, shot: 3 },
  initialVariantVolumeUnits = { small: "cl", medium: "cl", large: "cl", glass: "cl", shot: "cl" },
  initialVariantPrices = { small: 2.0, medium: 3.0, large: 5.0, glass: 3.0, shot: 1.0 },
  onChange,
  title = "Item Variants",
  description = "Select variant sizes or add custom size"
}) => {
  const [variantSizes, setVariantSizes] = useState<string[]>(initialVariantSizes);
  const [selectedVariants, setSelectedVariants] = useState<string[]>(initialSelectedVariants);
  const [customVariant, setCustomVariant] = useState<string>("");
  const [variantVolumes, setVariantVolumes] = useState<Record<string, number>>(initialVariantVolumes);
  const [variantVolumeUnits, setVariantVolumeUnits] = useState<Record<string, string>>(initialVariantVolumeUnits);
  const [variantPrices, setVariantPrices] = useState<Record<string, number>>(initialVariantPrices);

  // Notify parent component of changes
  const notifyChange = useCallback(() => {
    if (onChange) {
      onChange({
        selectedVariants,
        variantVolumes,
        variantVolumeUnits,
        variantPrices
      });
    }
  }, [selectedVariants, variantVolumes, variantVolumeUnits, variantPrices, onChange]);

  // Call notifyChange whenever relevant state changes
  React.useEffect(() => {
    notifyChange();
  }, [notifyChange]);

  const handleAddCustomVariant = useCallback(() => {
    if (!customVariant || selectedVariants.includes(customVariant)) return;
    
    setVariantSizes(prev => [...prev, customVariant]);
    setSelectedVariants(prev => [...prev, customVariant]);
    setVariantVolumes(prev => ({
      ...prev,
      [customVariant]: 3 // Default 3 volume
    }));
    setVariantVolumeUnits(prev => ({
      ...prev,
      [customVariant]: "cl" // Default cl unit
    }));
    setVariantPrices(prev => ({
      ...prev,
      [customVariant]: 3.0 // Default $3.00 price
    }));
    setCustomVariant("");
  }, [customVariant, selectedVariants]);


  const handleVolumeChange = useCallback((size: string, value: string) => {
    const numValue = parseFloat(value);
    if (isNaN(numValue) || numValue <= 0) return;

    setVariantVolumes(prev => ({
      ...prev,
      [size]: numValue
    }));
  }, []);

  const handleVolumeUnitChange = useCallback((size: string, unit: string) => {
    setVariantVolumeUnits(prev => ({
      ...prev,
      [size]: unit
    }));
  }, []);

  const handleVariantPriceChange = useCallback((size: string, value: string) => {
    const numValue = parseFloat(value);
    if (isNaN(numValue) || numValue <= 0) return;

    setVariantPrices(prev => ({
      ...prev,
      [size]: numValue
    }));
  }, []);

  const handleVariantToggle = useCallback((size: string, checked: boolean) => {
    if (checked) {
      setSelectedVariants(prev => [...prev, size]);
    } else {
      setSelectedVariants(prev => prev.filter(s => s !== size));
    }
  }, []);


  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-xl font-semibold text-gray-800 mb-2">{title}</h3>
        
        {/* Size Selection Section */}
        <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
          <div className="flex items-end gap-4 mb-3 w-fit">
            <h4 className="font-medium text-gray-700">{description}</h4>
            <div className="flex items-center gap-3">
              <Input 
                placeholder="Custom variant name" 
                value={customVariant} 
                onChange={e => setCustomVariant(e.target.value)} 
                className="max-w-xs bg-white h-6" 
              />
              <Button 
                variant="outline" 
                type="button" 
                size="sm" 
                onClick={handleAddCustomVariant} 
                disabled={!customVariant.trim() || variantSizes.includes(customVariant)} 
                className="px-4 h-6"
              >
                <Plus className="h-4 w-4" /> Add
              </Button>
            </div>
          </div>
          
          <div className="flex flex-wrap gap-4">
            {variantSizes.map(size => (
              <div key={size} className="flex items-center space-x-2 bg-white px-3 py-2 rounded-md shadow-sm">
                <Checkbox
                  id={`variant-${size}`}
                  checked={selectedVariants.includes(size)}
                  onCheckedChange={checked => handleVariantToggle(size, !!checked)}
                  className="h-5 w-5"
                />
                <Label htmlFor={`variant-${size}`} className="font-medium">
                  {size}
                </Label>
              </div>
            ))}
          </div>
        </div>


        {/* Volume and Price Configuration Section */}
        {selectedVariants.length > 0 && (
          <div className="bg-gray-50 p-4 rounded-lg border border-gray-100 mt-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {selectedVariants.map(size => (
                <div key={`variant-${size}`} className="bg-white p-3 rounded-md shadow-sm">
                  <div className="font-medium capitalize text-gray-800 mb-3">{size}</div>
                  
                  {/* Volume Input Row */}
                  <div className="flex items-center gap-2 mb-3">
                    <Label htmlFor={`volume-${size}`} className="w-16 font-medium text-sm">
                      Volume:
                    </Label>
                    <Input 
                      id={`volume-${size}`} 
                      type="number" 
                      value={variantVolumes[size] || "3"} 
                      onChange={e => handleVolumeChange(size, e.target.value)} 
                      min="0.1" 
                      step="0.1" 
                      className="max-w-[70px] h-8" 
                    />
                    <select
                      value={variantVolumeUnits[size] || "cl"}
                      onChange={e => handleVolumeUnitChange(size, e.target.value)}
                      className="px-2 py-1 border border-gray-300 rounded text-sm bg-white h-8"
                    >
                      <option value="cl">cl</option>
                      <option value="ml">ml</option>
                    </select>
                  </div>

                  {/* Price Input Row */}
                  <div className="flex items-center gap-2">
                    <Label htmlFor={`variant-price-${size}`} className="w-16 font-medium text-sm">
                      Price:
                    </Label>
                    <span className="text-sm text-gray-600">$</span>
                    <Input 
                      id={`variant-price-${size}`} 
                      type="number" 
                      value={variantPrices[size] || "3.00"} 
                      onChange={e => handleVariantPriceChange(size, e.target.value)} 
                      min="0.01" 
                      step="0.01" 
                      className="max-w-[90px] h-8" 
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default Variants;

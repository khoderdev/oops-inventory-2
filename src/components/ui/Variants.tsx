import React, { useState, useCallback } from "react";
import { Input } from "./input";
import { Button } from "./button";
import { Checkbox } from "./checkbox";
import { Label } from "./label";
import { Plus } from "lucide-react";

export interface VariantData {
  selectedVariants: string[];
  priceAdjustments: Record<string, number>;
}

interface VariantsProps {
  /** Initial variant sizes available */
  initialVariantSizes?: string[];
  /** Initial selected variants */
  initialSelectedVariants?: string[];
  /** Initial price adjustments */
  initialPriceAdjustments?: Record<string, number>;
  /** Callback when variant data changes */
  onChange?: (data: VariantData) => void;
  /** Custom title for the variants section */
  title?: string;
  /** Custom description for the variants section */
  description?: string;
}

export const Variants: React.FC<VariantsProps> = ({
  initialVariantSizes = ["small", "medium", "large", "glass", "shot"],
  initialSelectedVariants = [],
  initialPriceAdjustments = { small: 0.8, medium: 1.0, large: 1.2, glass: 0.9, shot: 0.5 },
  onChange,
  title = "Item Variants",
  description = "Select variant sizes or add custom size"
}) => {
  const [variantSizes, setVariantSizes] = useState<string[]>(initialVariantSizes);
  const [selectedVariants, setSelectedVariants] = useState<string[]>(initialSelectedVariants);
  const [customVariant, setCustomVariant] = useState<string>("");
  const [variantPriceAdjustments, setVariantPriceAdjustments] = useState<Record<string, number>>(initialPriceAdjustments);

  // Notify parent component of changes
  const notifyChange = useCallback(() => {
    if (onChange) {
      onChange({
        selectedVariants,
        priceAdjustments: variantPriceAdjustments
      });
    }
  }, [selectedVariants, variantPriceAdjustments, onChange]);

  // Call notifyChange whenever relevant state changes
  React.useEffect(() => {
    notifyChange();
  }, [notifyChange]);

  const handleAddCustomVariant = useCallback(() => {
    if (!customVariant || selectedVariants.includes(customVariant)) return;
    
    setVariantSizes(prev => [...prev, customVariant]);
    setSelectedVariants(prev => [...prev, customVariant]);
    setVariantPriceAdjustments(prev => ({
      ...prev,
      [customVariant]: 1.0
    }));
    setCustomVariant("");
  }, [customVariant, selectedVariants]);

  const handlePriceAdjustmentChange = useCallback((size: string, value: string) => {
    const numValue = parseFloat(value);
    if (isNaN(numValue) || numValue <= 0) return;

    setVariantPriceAdjustments(prev => ({
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

        {/* Price Adjustments Section */}
        {selectedVariants.length > 0 && (
          <div className="bg-gray-50 p-4 rounded-lg border border-gray-100 mt-4">
            <h4 className="font-medium mb-3 text-gray-700">Price Adjustments</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {selectedVariants.map(size => (
                <div key={`price-${size}`} className="flex items-center gap-3 bg-white p-3 rounded-md shadow-sm">
                  <Label htmlFor={`price-${size}`} className="w-20 font-medium">
                    {size}:
                  </Label>
                  <Input 
                    id={`price-${size}`} 
                    type="number" 
                    value={variantPriceAdjustments[size] || "1.0"} 
                    onChange={e => handlePriceAdjustmentChange(size, e.target.value)} 
                    min="0.1" 
                    step="0.1" 
                    className="max-w-[100px]" 
                  />
                  <span className="text-sm text-gray-600">× base price</span>
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

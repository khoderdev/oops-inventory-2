import React, { useState, useEffect, useMemo } from "react";
import { Input } from "../../ui/input";
import { Button } from "../../ui/button";
import { getAvailableUnits } from "@/utils/getAvailableUnits";

interface VariantIngredientInputProps {
  variantName: string;
  materials: any[];
  stockEntries: any[];
  onAddIngredient: (variantName: string, materialId: string, quantity: number, unit: string) => void;
}

export const VariantIngredientInput: React.FC<VariantIngredientInputProps> = ({ variantName, materials, onAddIngredient }) => {
  const [selectedMaterialId, setSelectedMaterialId] = useState("");
  const [quantity, setQuantity] = useState("");
  const [unit, setUnit] = useState("");

  // Get available units for selected material
  const availableUnits = useMemo(() => {
    if (!selectedMaterialId || !materials) return [];
    return getAvailableUnits(selectedMaterialId, materials);
  }, [selectedMaterialId, materials]);

  // Reset unit when material changes
  useEffect(() => {
    if (selectedMaterialId && availableUnits.length > 0) {
      // Find the selected material to get its base unit
      const selectedMaterial = materials?.find(m => String(m.id) === selectedMaterialId);
      if (selectedMaterial?.baseUnit && availableUnits.includes(selectedMaterial.baseUnit)) {
        setUnit(selectedMaterial.baseUnit);
      } else if (availableUnits.length > 0) {
        setUnit(availableUnits[0]);
      }
    } else {
      setUnit("");
    }
  }, [selectedMaterialId, availableUnits, materials]);

  const handleAdd = () => {
    if (!selectedMaterialId || !quantity || parseFloat(quantity) <= 0 || !unit) return;
    onAddIngredient(variantName, selectedMaterialId, parseFloat(quantity), unit);
    setSelectedMaterialId("");
    setQuantity("");
    setUnit("");
  };

  return (
    <div className="grid grid-cols-4 gap-2 items-end">
      <div className="col-span-2">
        <label className="block text-xs font-medium mb-1">Material</label>
        <select value={selectedMaterialId} onChange={e => setSelectedMaterialId(e.target.value)} className="w-full px-3 py-2 border border-input bg-background rounded-md text-sm">
          <option value="">Select material</option>
          {materials?.map(material => (
            <option key={material.id} value={material.id}>
              {material.name}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="block text-xs font-medium mb-1">Quantity</label>
        <Input type="number" value={quantity} onChange={e => setQuantity(e.target.value)} placeholder="0.00" min="0" step="0.01" className="text-sm" />
      </div>
      <div>
        <label className="block text-xs font-medium mb-1">Unit</label>
        <div className="flex gap-2">
          <select value={unit} onChange={e => setUnit(e.target.value)} className="w-full px-3 py-2 border border-input bg-background rounded-md text-sm" disabled={!selectedMaterialId || availableUnits.length === 0}>
            <option value="">Select unit</option>
            {availableUnits.map(unit => (
              <option key={unit} value={unit}>
                {unit}
              </option>
            ))}
          </select>
          <Button type="button" onClick={handleAdd} size="sm" disabled={!selectedMaterialId || !quantity || parseFloat(quantity) <= 0 || !unit}>
            Add
          </Button>
        </div>
      </div>
    </div>
  );
};

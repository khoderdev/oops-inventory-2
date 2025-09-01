import { useState, useEffect, useMemo } from "react";
import { Button } from "../../ui/button";
import { Input } from "../../ui/input";
import { Label } from "../../ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "../../ui/card";
import { Selection } from "../../ui/Selection";
import { Textarea } from "../../ui/textarea";
import { RadioGroup, RadioGroupItem } from "../../ui/radio-group";
import { formatCurrency } from "@/utils/conversionLogic";
import { getAvailableUnits } from "@/utils/getAvailableUnits";
import { getConversionFactor } from "@/utils/getConversionFactor";
import { CreateVariantIngredientData, VariantIngredient } from "@/api/variantIngredients.api";

interface VariantIngredientFormProps {
  materials: any[];
  sauces: any[];
  stockEntries: any[];
  initialData?: VariantIngredient;
  onSubmit: (data: CreateVariantIngredientData) => void;
  onCancel: () => void;
  isEditing?: boolean;
}

export function VariantIngredientForm({
  materials,
  sauces,
  stockEntries,
  initialData,
  onSubmit,
  onCancel,
  isEditing = false
}: VariantIngredientFormProps) {
  const [ingredientType, setIngredientType] = useState<"material" | "sauce">(
    initialData?.materialId ? "material" : "sauce"
  );
  const [selectedMaterialId, setSelectedMaterialId] = useState(
    initialData?.materialId?.toString() || ""
  );
  const [selectedSauceId, setSelectedSauceId] = useState(
    initialData?.sauceId?.toString() || ""
  );
  const [quantity, setQuantity] = useState(initialData?.quantity?.toString() || "");
  const [unit, setUnit] = useState(initialData?.unit || "");
  const [cost, setCost] = useState(initialData?.cost?.toString() || "");
  const [notes, setNotes] = useState(initialData?.notes || "");
  const [materialSearchTerm, setMaterialSearchTerm] = useState("");
  const [sauceSearchTerm, setSauceSearchTerm] = useState("");

  const selectedMaterial = useMemo(() => 
    materials.find(m => m.id.toString() === selectedMaterialId),
    [materials, selectedMaterialId]
  );

  const selectedSauce = useMemo(() => 
    sauces.find(s => s.id.toString() === selectedSauceId),
    [sauces, selectedSauceId]
  );

  const availableUnits = useMemo(() => {
    if (ingredientType === "material" && selectedMaterial) {
      return getAvailableUnits(selectedMaterial.unitType, selectedMaterial.unit);
    }
    if (ingredientType === "sauce" && selectedSauce) {
      return [selectedSauce.yieldUnit || "ml"];
    }
    return [];
  }, [ingredientType, selectedMaterial, selectedSauce]);

  // Auto-calculate cost when quantity, unit, or selected item changes
  useEffect(() => {
    if (!quantity || isNaN(parseFloat(quantity))) {
      setCost("");
      return;
    }

    const qty = parseFloat(quantity);

    if (ingredientType === "material" && selectedMaterial) {
      const stockEntry = stockEntries.find(entry => entry.materialId === selectedMaterial.id);
      if (stockEntry && stockEntry.costPerUnit) {
        // Handle unit conversion if needed
        let conversionFactor = 1;
        if (unit && unit !== stockEntry.unit) {
          conversionFactor = getConversionFactor(unit, stockEntry.unit, selectedMaterial.unitType);
        }
        
        const calculatedCost = qty * stockEntry.costPerUnit * conversionFactor;
        setCost(calculatedCost.toFixed(6));
      }
    } else if (ingredientType === "sauce" && selectedSauce) {
      if (selectedSauce.costPerUnit) {
        const calculatedCost = qty * selectedSauce.costPerUnit;
        setCost(calculatedCost.toFixed(6));
      }
    }
  }, [quantity, unit, ingredientType, selectedMaterial, selectedSauce, stockEntries]);

  // Set default unit when material/sauce changes
  useEffect(() => {
    if (ingredientType === "material" && selectedMaterial && !unit) {
      setUnit(selectedMaterial.unit);
    } else if (ingredientType === "sauce" && selectedSauce && !unit) {
      setUnit(selectedSauce.yieldUnit || "ml");
    }
  }, [ingredientType, selectedMaterial, selectedSauce, unit]);

  const filteredMaterials = useMemo(() => {
    const excludedCategories = ["beverages", "cold", "hot", "alcohol"];
    return materials.filter(material => {
      let categoryName = "";
      if (typeof material.category === "string") {
        categoryName = material.category.toLowerCase();
      } else if (typeof material.category === "object" && material.category?.name) {
        categoryName = material.category.name.toLowerCase();
      }
      
      const isExcluded = excludedCategories.some(excluded => categoryName.includes(excluded));
      const matchesSearch = materialSearchTerm === "" || 
        material.name.toLowerCase().includes(materialSearchTerm.toLowerCase());
      
      return !isExcluded && matchesSearch;
    });
  }, [materials, materialSearchTerm]);

  const filteredSauces = useMemo(() => {
    return sauces.filter(sauce => 
      sauceSearchTerm === "" || 
      sauce.name.toLowerCase().includes(sauceSearchTerm.toLowerCase())
    );
  }, [sauces, sauceSearchTerm]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!quantity || isNaN(parseFloat(quantity)) || parseFloat(quantity) <= 0) {
      alert("Please enter a valid quantity");
      return;
    }

    if (!unit) {
      alert("Please select a unit");
      return;
    }

    if (ingredientType === "material" && !selectedMaterialId) {
      alert("Please select a material");
      return;
    }

    if (ingredientType === "sauce" && !selectedSauceId) {
      alert("Please select a sauce");
      return;
    }

    const data: CreateVariantIngredientData = {
      variantId: 0, // Will be set by parent component
      quantity: parseFloat(quantity),
      unit,
      cost: cost ? parseFloat(cost) : 0,
      notes: notes || undefined,
      ...(ingredientType === "material" 
        ? { materialId: parseInt(selectedMaterialId) }
        : { sauceId: parseInt(selectedSauceId) }
      )
    };

    onSubmit(data);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          {isEditing ? "Edit Ingredient" : "Add New Ingredient"}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Ingredient Type Selection */}
          <div className="space-y-2">
            <Label>Ingredient Type</Label>
            <RadioGroup
              value={ingredientType}
              onValueChange={(value) => {
                setIngredientType(value as "material" | "sauce");
                setSelectedMaterialId("");
                setSelectedSauceId("");
                setUnit("");
                setCost("");
              }}
              className="flex gap-4"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="material" id="material" />
                <Label htmlFor="material">Material</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="sauce" id="sauce" />
                <Label htmlFor="sauce">Sauce</Label>
              </div>
            </RadioGroup>
          </div>

          {/* Material Selection */}
          {ingredientType === "material" && (
            <div className="space-y-2">
              <Label htmlFor="material-select">Select Material</Label>
              <Selection
                items={filteredMaterials}
                selectedId={selectedMaterialId}
                onSelectionChange={setSelectedMaterialId}
                searchTerm={materialSearchTerm}
                onSearchChange={setMaterialSearchTerm}
                placeholder="Search materials..."
                displayKey="name"
                valueKey="id"
                renderItem={(material) => (
                  <div className="flex justify-between items-center">
                    <span>{material.name}</span>
                    <span className="text-sm text-muted-foreground">
                      {material.unit} • {material.category?.name || material.category}
                    </span>
                  </div>
                )}
              />
            </div>
          )}

          {/* Sauce Selection */}
          {ingredientType === "sauce" && (
            <div className="space-y-2">
              <Label htmlFor="sauce-select">Select Sauce</Label>
              <Selection
                items={filteredSauces}
                selectedId={selectedSauceId}
                onSelectionChange={setSelectedSauceId}
                searchTerm={sauceSearchTerm}
                onSearchChange={setSauceSearchTerm}
                placeholder="Search sauces..."
                displayKey="name"
                valueKey="id"
                renderItem={(sauce) => (
                  <div className="flex justify-between items-center">
                    <span>{sauce.name}</span>
                    <span className="text-sm text-muted-foreground">
                      {formatCurrency(sauce.costPerUnit)}/{sauce.yieldUnit}
                    </span>
                  </div>
                )}
              />
            </div>
          )}

          {/* Quantity Input */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="quantity">Quantity</Label>
              <Input
                id="quantity"
                type="number"
                step="0.001"
                min="0"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                placeholder="0.000"
                required
              />
            </div>

            {/* Unit Selection */}
            <div className="space-y-2">
              <Label htmlFor="unit">Unit</Label>
              <Selection
                items={availableUnits.map(u => ({ id: u, name: u }))}
                selectedId={unit}
                onSelectionChange={setUnit}
                placeholder="Select unit"
                displayKey="name"
                valueKey="id"
                disabled={availableUnits.length === 0}
              />
            </div>
          </div>

          {/* Cost Display/Input */}
          <div className="space-y-2">
            <Label htmlFor="cost">
              Calculated Cost
              {cost && (
                <span className="ml-2 text-sm font-normal text-muted-foreground">
                  ({formatCurrency(parseFloat(cost))})
                </span>
              )}
            </Label>
            <Input
              id="cost"
              type="number"
              step="0.000001"
              min="0"
              value={cost}
              onChange={(e) => setCost(e.target.value)}
              placeholder="0.000000"
              className="bg-muted"
              readOnly
            />
            <p className="text-xs text-muted-foreground">
              Cost is automatically calculated based on quantity and material/sauce pricing
            </p>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Notes (Optional)</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add any special notes about this ingredient..."
              rows={2}
            />
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 pt-4">
            <Button type="submit" className="flex-1">
              {isEditing ? "Update Ingredient" : "Add Ingredient"}
            </Button>
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

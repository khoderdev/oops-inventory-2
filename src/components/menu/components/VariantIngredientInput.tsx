import React, { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { Input } from "../../ui/input";
import { Button } from "../../ui/button";
import { getAvailableUnits } from "@/utils/getAvailableUnits";
import { getConversionFactor } from "@/utils/getConversionFactor";
import { Material, MenuItemIngredient, Sauce, StockEntry } from "@/types/inventory";
import { Selection } from "../../ui/Selection";
import { Plus } from "lucide-react";
import { calculateVariantIngredientCost } from "@/utils/calculateVariantIngredientCost";

interface VariantIngredientInputProps {
  variantName: string;
  materials: Material[];
  stockEntries: StockEntry[];
  sauces?: Sauce[];
  onAddIngredient: (variantName: string, ingredient: MenuItemIngredient) => void;
  errors?: {
    ingredients?: string;
    ingredientQuantity?: string;
  };
}

export const VariantIngredientInput: React.FC<VariantIngredientInputProps> = ({ 
  variantName, 
  materials, 
  stockEntries, 
  sauces = [], 
  onAddIngredient,
  errors = {}
}) => {
  const [selectedMaterialId, setSelectedMaterialId] = useState("");
  const [materialSearchTerm, setMaterialSearchTerm] = useState("");
  const [ingredientQuantity, setIngredientQuantity] = useState("");
  const [ingredientUnit, setIngredientUnit] = useState("");
  const [selectedItemType, setSelectedItemType] = useState<"material" | "sauce">("material");
  const materialSelectRef = useRef<HTMLInputElement>(null);

  // Combine materials and sauces for selection
  const allSelectableItems = useMemo(() => {
    const materialItems = (materials || []).map(m => ({
      ...m,
      type: "material",
      id: `material-${m.id}`
    }));
    const sauceItems = (sauces || []).map(s => ({
      ...s,
      type: "sauce",
      id: `sauce-${s.id}`
    }));
    return [...materialItems, ...sauceItems];
  }, [materials, sauces]);

  // Filter available items (exclude beverages and already used items)
  const availableItems = useMemo(() => {
    const excludedCategories = ["beverages", "cold", "hot", "alcohol"];
    const result = allSelectableItems.filter(item => {
      if (item.type === "material") {
        const material = item;
        let categoryName = "";
        if (typeof material.category === "string") {
          categoryName = material.category.toLowerCase();
        } else if (typeof material.category === "object" && material.category?.name) {
          categoryName = material.category.name.toLowerCase();
        } else if (typeof material.category === "object" && material.category?.value) {
          categoryName = material.category.value.toLowerCase();
        }
        
        // Allow beverage materials for beverage menu items (ingredients like syrups, mixers, etc.)
        const isBeverageCategory = categoryName.includes("beverage") || categoryName.includes("drink");
        const shouldExclude = excludedCategories.includes(categoryName) && !isBeverageCategory;
        
        return !shouldExclude;
      }
      return true;
    });
    return result;
  }, [allSelectableItems]);

  // Filter items based on search term
  const filteredItems = useMemo(() => {
    if (!materialSearchTerm.trim()) {
      return availableItems;
    }
    const result = availableItems.filter(item => 
      item.name.toLowerCase().includes(materialSearchTerm.toLowerCase())
    );
    return result;
  }, [availableItems, materialSearchTerm]);

  // Calculate ingredient cost
  const calculateIngredientCost = useCallback(
    (ingredient: Omit<MenuItemIngredient, "cost">) => {
      // Check if this is a sauce
      const isSauce = sauces.some(sauce => sauce.id.toString() === ingredient.materialId);

      if (isSauce) {
        const sauce = sauces.find(s => s.id.toString() === ingredient.materialId);
        if (!sauce) {
          console.warn(`Sauce not found for ID: ${ingredient.materialId}`);
          return 0;
        }
        try {
          const conversionFactor = getConversionFactor(
            ingredient.unit, 
            sauce.unit, 
            "volume", 
            { baseUnit: sauce.unit } as any
          );
          const finalCost = ingredient.quantity * parseFloat(String(sauce.costPerUnit)) * conversionFactor;
          return isNaN(finalCost) ? 0 : finalCost;
        } catch (error) {
          console.error(`Error calculating cost for sauce ${sauce.name}:`, error);
          return 0;
        }
      }

      // For materials, use the calculateVariantIngredientCost utility
      return calculateVariantIngredientCost(ingredient, materials, stockEntries);
    },
    [materials, stockEntries, sauces]
  );

  // Handle material selection
  const handleMaterialSelect = useCallback(
    (itemId: string, itemName?: string) => {
      let actualId = itemId;
      let type = "material";
      if (itemId.startsWith("material-")) {
        actualId = itemId.replace("material-", "");
        type = "material";
      } else if (itemId.startsWith("sauce-")) {
        actualId = itemId.replace("sauce-", "");
        type = "sauce";
      }
      setSelectedMaterialId(actualId);
      setSelectedItemType(type as "material" | "sauce");
      setMaterialSearchTerm(itemName || "");
      if (type === "sauce") {
        const sauce = sauces.find(s => String(s.id) === actualId);
        if (sauce) {
          setIngredientUnit(sauce.unit);
        }
      } else {
        const material = (materials || []).find(m => String(m.id) === actualId);
        if (material) {
          setIngredientUnit(material.baseUnit);
        } else {
          setIngredientUnit("");
        }
      }
    },
    [materials, sauces]
  );

  // Handle search term changes
  const handleMaterialSearchChange = useCallback((value: string) => {
    setMaterialSearchTerm(value);
    setSelectedMaterialId("");
    setSelectedItemType("material");
    setIngredientUnit("");
  }, []);

  // Handle keyboard events
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      const isAddIngredientEnabled = !!(selectedMaterialId && ingredientQuantity && ingredientUnit);
      if (isAddIngredientEnabled) {
        handleAddIngredient();
      }
    }
  };

  // Handle adding ingredient
  const handleAddIngredient = useCallback(() => {
    if (!selectedMaterialId || !ingredientQuantity || !ingredientUnit) {
      return;
    }

    const quantity = parseFloat(ingredientQuantity);
    if (isNaN(quantity) || quantity <= 0) {
      return;
    }

    const selectedItem = allSelectableItems.find(item => {
      const prefixedId = `${selectedItemType}-${selectedMaterialId}`;
      return item.id === prefixedId;
    });

    if (!selectedItem) {
      return;
    }

    const cost = calculateIngredientCost({
      materialId: selectedMaterialId,
      quantity,
      unit: ingredientUnit,
      type: selectedItem.type
    });

    const newIngredient: MenuItemIngredient = {
      materialId: selectedMaterialId,
      quantity,
      unit: ingredientUnit,
      cost,
      type: selectedItem.type
    };

    onAddIngredient(variantName, newIngredient);

    // Clear input fields
    setSelectedMaterialId("");
    setMaterialSearchTerm(""); 
    setIngredientQuantity(""); 
    setIngredientUnit(""); 
    setSelectedItemType("material"); 
  }, [selectedMaterialId, selectedItemType, ingredientQuantity, ingredientUnit, allSelectableItems, calculateIngredientCost, onAddIngredient, variantName]);

  // Get available units for the selected material/sauce
  const availableUnits = useMemo(() => {
    if (!selectedMaterialId) return [];
    
    if (selectedItemType === "sauce") {
      const sauce = sauces.find(s => String(s.id) === selectedMaterialId);
      return sauce ? [sauce.unit] : [];
    } else {
      const material = materials.find(m => String(m.id) === selectedMaterialId);
      if (!material) return [];
      
      if (material.unitType === 'mass') {
        return ['g', 'kg', 'lb', 'oz'];
      } else if (material.unitType === 'volume') {
        return ['ml', 'cl', 'dl', 'l', 'fl_oz', 'cup', 'pt', 'qt', 'gal'];
      } else if (material.unitType === 'package') {
        if (material.baseUnit === 'bottle') {
          return ['bottle', 'ml', 'cl', 'dl', 'l', 'fl_oz'];
        } else if (material.baseUnit === 'piece') {
          return ['piece', material.inputUnit || 'box', 'bag', 'pack'];
        } else {
          const units = [material.baseUnit];
          if (material.inputUnit && material.inputUnit !== material.baseUnit) {
            units.push(material.inputUnit);
          }
          return units;
        }
      } else {
        return getAvailableUnits(selectedMaterialId, materials);
      }
    }
  }, [selectedMaterialId, selectedItemType, materials, sauces]);

  return (
    <div className="border-t pt-4 mt-2">
      <h4 className="text-md font-medium mb-2">
        Variant Ingredients for {variantName}
      </h4>
      {errors.ingredients && (
        <p className="text-sm text-red-500 mb-2">
          {errors.ingredients}
        </p>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Selection
          label="Items"
          searchTerm={materialSearchTerm}
          onSearchChange={handleMaterialSearchChange}
          onKeyDown={handleKeyDown}
          items={filteredItems}
          onItemSelect={handleMaterialSelect}
          getDisplayValue={item => item.name}
          getItemId={item => item.id}
          estimateItemSizePx={56}
          placeholder={availableItems.length === 0 ? "No items available" : "Search items..."}
          noResultsText={`No items found matching "{searchTerm}"`}
          inputRef={materialSelectRef}
          itemRenderer={({ item, onSelect }) => (
            <button 
              key={item.id} 
              type="button" 
              className="w-full px-3 py-2 text-left hover:bg-muted focus:bg-muted focus:outline-none border-b border-border last:border-b-0" 
              onClick={() => onSelect(item.id, item.name)} 
              onMouseDown={e => e.preventDefault()}
            >
              <div className="font-medium">{item.name}</div>
              <div className="text-sm text-muted-foreground">{item.type === "sauce" ? "Sauce" : "Material"}</div>
            </button>
          )}
        />

        <div>
          <label htmlFor="quantity" className="block text-sm font-medium mb-1">
            Quantity
          </label>
          <Input 
            id="quantity" 
            type="number" 
            value={ingredientQuantity} 
            onChange={e => setIngredientQuantity(e.target.value)} 
            onKeyDown={handleKeyDown} 
            placeholder="0" 
            min="0" 
            step="0.01" 
            disabled={!selectedMaterialId} 
            aria-invalid={!!errors.ingredientQuantity} 
          />
          {errors.ingredientQuantity && (
            <p className="text-sm text-red-500 mt-1">
              {errors.ingredientQuantity}
            </p>
          )}
        </div>

        <div>
          <label htmlFor="unit" className="block text-sm font-medium mb-1">
            Unit
          </label>
          <select 
            id="unit" 
            value={ingredientUnit} 
            onChange={e => setIngredientUnit(e.target.value)} 
            onKeyDown={handleKeyDown} 
            className="w-full px-3 py-2 border border-input bg-background rounded-md" 
            disabled={!selectedMaterialId}
          >
            <option value="">Select unit</option>
            {availableUnits.map(unit => (
              <option key={unit} value={unit}>
                {unit}
              </option>
            ))}
          </select>
          {selectedMaterialId && selectedItemType === "material" && (
            <p className="text-xs text-muted-foreground mt-1">
              {(() => {
                const material = materials.find(m => String(m.id) === selectedMaterialId);
                if (!material) return "Invalid material";
                
                if (material.unitType === 'mass') {
                  return "Mass units: g, kg, lb, oz";
                } else if (material.unitType === 'volume') {
                  return "Volume units: ml, cl, dl, l, fl_oz, cup, pt, qt, gal";
                } else if (material.unitType === 'package') {
                  if (material.baseUnit === 'bottle') {
                    return "Beverage units: bottle, ml, cl, dl, l, fl_oz";
                  } else if (material.baseUnit === 'piece') {
                    return `Package units: piece, ${material.inputUnit || 'box'}, bag, pack`;
                  } else {
                    return `Package units: ${material.baseUnit}, ${material.inputUnit || 'package'}`;
                  }
                }
                return "Standard units available";
              })()}
            </p>
          )}
        </div>
      </div>

      <div className="flex justify-end mt-4">
        <Button 
          onClick={handleAddIngredient} 
          disabled={!selectedMaterialId || !ingredientQuantity || !ingredientUnit} 
          aria-label="Add ingredient"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Ingredient
        </Button>
      </div>
    </div>
  );
};

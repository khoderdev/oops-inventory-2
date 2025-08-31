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

export const VariantIngredientInput: React.FC<VariantIngredientInputProps> = ({ variantName, materials, stockEntries, sauces = [], onAddIngredient, errors = {} }) => {
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
    const result = availableItems.filter(item => item.name.toLowerCase().includes(materialSearchTerm.toLowerCase()));
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
          const conversionFactor = getConversionFactor(ingredient.unit, sauce.unit, "volume", { baseUnit: sauce.unit } as any);
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

  // Define unit groups for better organization
  const unitGroups = useMemo(() => {
    return {
      mass: {
        label: "Mass",
        units: ["g", "kg", "lb", "oz"]
      },
      volume: {
        label: "Volume",
        units: ["ml", "cl", "dl", "l", "fl_oz", "cup", "pt", "qt", "gal"]
      },
      package: {
        label: "Package",
        units: ["piece", "box", "bag", "pack", "bottle", "can"]
      },
      container: {
        label: "Container",
        units: ["bottle", "can", "pint", "pitcher", "mini", "standard", "magnum"]
      },
      count: {
        label: "Count",
        units: ["piece", "unit", "each", "serving"]
      },
      custom: {
        label: "Custom",
        units: []
      }
    };
  }, []);

  // Get available units for the selected material/sauce with grouping
  const availableUnitGroups = useMemo(() => {
    if (!selectedMaterialId) return [];

    // Special case for beverage ingredients - always show all volume units and container types
    if (variantName) {
      return [
        {
          label: unitGroups.volume.label,
          units: unitGroups.volume.units
        },
        {
          label: unitGroups.container.label,
          units: unitGroups.container.units
        }
      ];
    }

    if (selectedItemType === "sauce") {
      const sauce = sauces.find(s => String(s.id) === selectedMaterialId);
      if (!sauce) return [];

      // For sauces, we typically only have one unit
      return [
        {
          label: "Sauce Unit",
          units: [sauce.unit]
        }
      ];
    } else {
      const material = materials.find(m => String(m.id) === selectedMaterialId);
      if (!material) return [];

      const result = [];

      if (material.unitType === "mass") {
        result.push({
          label: unitGroups.mass.label,
          units: unitGroups.mass.units
        });
      } else if (material.unitType === "volume") {
        result.push({
          label: unitGroups.volume.label,
          units: unitGroups.volume.units
        });
      } else if (material.unitType === "package") {
        if (material.baseUnit === "bottle") {
          // For bottled items, show both container types and volume units
          result.push({
            label: unitGroups.container.label,
            units: unitGroups.container.units
          });
          result.push({
            label: unitGroups.volume.label,
            units: unitGroups.volume.units
          });
        } else if (material.baseUnit === "piece") {
          const packageUnits = ["piece"];
          if (material.inputUnit && !packageUnits.includes(material.inputUnit)) {
            packageUnits.push(material.inputUnit);
          }
          packageUnits.push(...["box", "bag", "pack"].filter(u => u !== material.inputUnit));

          result.push({
            label: unitGroups.package.label,
            units: packageUnits
          });
        } else {
          // Custom package units
          const customUnits = [material.baseUnit];
          if (material.inputUnit && material.inputUnit !== material.baseUnit) {
            customUnits.push(material.inputUnit);
          }

          result.push({
            label: "Package Units",
            units: customUnits
          });
        }
      } else {
        // Default to all available units from the utility function
        const availableUnits = getAvailableUnits(selectedMaterialId, materials);
        result.push({
          label: "Available Units",
          units: availableUnits
        });
      }

      return result;
    }
  }, [selectedMaterialId, selectedItemType, materials, sauces, unitGroups, variantName]);

  // Format units for Selection component
  const unitSelectionItems = useMemo(() => {
    const items: { id: string; name: string; group: string }[] = [];

    availableUnitGroups.forEach(group => {
      group.units.forEach(unit => {
        items.push({
          id: unit,
          name: unit,
          group: group.label
        });
      });
    });

    return items;
  }, [availableUnitGroups]);

  // Flatten all available units for validation
  const availableUnits = useMemo(() => {
    return availableUnitGroups.flatMap(group => group.units);
  }, [availableUnitGroups]);

  // State for unit search
  const [unitSearchTerm, setUnitSearchTerm] = useState("");
  const unitSelectRef = useRef<HTMLInputElement>(null);

  // Handle unit selection and update search term
  const handleUnitSelect = useCallback((unitId: string, displayName: string) => {
    setIngredientUnit(unitId);
    setUnitSearchTerm(displayName);
  }, []);

  // Update unit search term when unit changes or when material changes
  useEffect(() => {
    if (ingredientUnit) {
      const selectedUnit = unitSelectionItems.find(item => String(item.id) === ingredientUnit);
      if (selectedUnit) {
        setUnitSearchTerm(selectedUnit.name);
      }
    } else {
      setUnitSearchTerm("");
    }
  }, [ingredientUnit, unitSelectionItems, selectedMaterialId]);

  return (
    <div className="border-t pt-4 mt-2">
      <h4 className="text-md font-medium mb-2">Variant Ingredients for {variantName}</h4>
      {errors.ingredients && <p className="text-sm text-red-500 mb-2">{errors.ingredients}</p>}

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
            <button key={item.id} type="button" className="w-full px-3 py-2 text-left hover:bg-muted focus:bg-muted focus:outline-none border-b border-border last:border-b-0" onClick={() => onSelect(item.id, item.name)} onMouseDown={e => e.preventDefault()}>
              <div className="font-medium">{item.name}</div>
              <div className="text-sm text-muted-foreground">{item.type === "sauce" ? "Sauce" : "Material"}</div>
            </button>
          )}
        />

        <div>
          <label htmlFor="quantity" className="block text-sm font-medium mb-1">
            Quantity
          </label>
          <Input id="quantity" type="number" value={ingredientQuantity} onChange={e => setIngredientQuantity(e.target.value)} onKeyDown={handleKeyDown} placeholder="0" min="0" step="0.01" disabled={!selectedMaterialId} aria-invalid={!!errors.ingredientQuantity} />
          {errors.ingredientQuantity && <p className="text-sm text-red-500 mt-1">{errors.ingredientQuantity}</p>}
        </div>

        <div className="relative">
          <label htmlFor="unit" className="flex items-center gap-2 text-sm font-medium mb-1">
            <span>Unit</span>
            {selectedMaterialId && selectedItemType === "material" && (
              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                {(() => {
                  const material = materials.find(m => String(m.id) === selectedMaterialId);
                  return material?.unitType || "standard";
                })()}
              </span>
            )}
          </label>
          <Selection
            label=""
            searchTerm={unitSearchTerm}
            onSearchChange={setUnitSearchTerm}
            onKeyDown={handleKeyDown}
            items={unitSelectionItems}
            onItemSelect={handleUnitSelect}
            getDisplayValue={item => item.name}
            getItemId={item => String(item.id)}
            estimateItemSizePx={48}
            placeholder={!selectedMaterialId ? "Select material first" : "Select unit..."}
            noResultsText={`No units found matching "{searchTerm}"`}
            inputRef={unitSelectRef}
            disabled={!selectedMaterialId}
            itemRenderer={({ item, onSelect }) => (
              <button key={String(item.id)} type="button" className="w-full px-3 py-2 text-left hover:bg-muted focus:bg-muted focus:outline-none border-b border-border last:border-b-0" onClick={() => onSelect(String(item.id), item.name)} onMouseDown={e => e.preventDefault()}>
                <div className="font-medium">{item.name}</div>
                <div className="text-xs text-muted-foreground">{item.group}</div>
              </button>
            )}
            groupBy={item => item.group}
            renderGroupHeader={group => <div className="px-3 py-1.5 bg-muted/50 text-sm font-medium text-muted-foreground">{group}</div>}
          />
        </div>
      </div>

      <div className="flex justify-end mt-4">
        <Button onClick={handleAddIngredient} disabled={!selectedMaterialId || !ingredientQuantity || !ingredientUnit} aria-label="Add ingredient">
          <Plus className="h-4 w-4 mr-2" />
          Add Ingredient
        </Button>
      </div>
    </div>
  );
};

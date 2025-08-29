import { MenuItemIngredient } from "@/types/inventory";
import { formatCurrency, formatNumber } from "@/utils/conversionLogic";
import { getAvailableUnits } from "@/utils/getAvailableUnits";
import { getConversionFactor } from "@/utils/getConversionFactor";
import { Plus } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useMenuItems } from "@/contexts/MenuItemsContext";
import { Button } from "../../ui/button";
import { Input } from "../../ui/input";
import { Selection } from "../../ui/Selection";
import { IngredientsProps } from "@/types/menuItems";
import { IngredientsTable } from "./IngredientsTable";
import { Sauce } from "@/types/inventory";

export function Ingredients({ ingredients = [], stockEntries = [], materials: materialsProp, menuItem, category = "", price = "0", onIngredientsChange, errors = {}, onErrorsChange, sauces = [] }: IngredientsProps & { sauces?: Sauce[] }) {
  const { materialsWithStock: materialsFromCtx } = useMenuItems();
  const materials = materialsProp ?? materialsFromCtx;
  const [selectedMaterialId, setSelectedMaterialId] = useState("");
  const [materialSearchTerm, setMaterialSearchTerm] = useState("");
  const [ingredientQuantity, setIngredientQuantity] = useState("");
  const [ingredientUnit, setIngredientUnit] = useState("");
  const [selectedItemType, setSelectedItemType] = useState<"material" | "sauce">("material");
  const materialSelectRef = useRef<HTMLInputElement>(null);
  const ingredientsInputSectionRef = useRef<HTMLDivElement>(null);

  // Combine materials and sauces into a single array for selection
  // const allSelectableItems = useMemo(() => {
  //   const materialItems = (materials || []).map(m => ({ ...m, type: "material", id: m.id.toString() }));
  //   const sauceItems = (sauces || []).map(s => ({ ...s, type: "sauce", id: s.id.toString() }));
  //   return [...materialItems, ...sauceItems];
  // }, [materials, sauces]);

  const allSelectableItems = useMemo(() => {
    const materialItems = (materials || []).map(m => ({
      ...m,
      type: "material",
      id: `material-${m.id}` // Add prefix
    }));
    const sauceItems = (sauces || []).map(s => ({
      ...s,
      type: "sauce",
      id: `sauce-${s.id}` // Add prefix
    }));
    return [...materialItems, ...sauceItems];
  }, [materials, sauces]);

  const availableItems = useMemo(() => {
    const usedMaterialIds = new Set((ingredients || []).map(i => i.materialId));
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

        return !usedMaterialIds.has(material.id.toString()) && !excludedCategories.includes(categoryName);
      }

      return !usedMaterialIds.has(item.id.toString());
    });
    return result;
  }, [allSelectableItems, ingredients]);

  // const filteredItems = useMemo(() => {
  //   if (!materialSearchTerm.trim()) {
  //     return availableItems;
  //   }
  //   const result = availableItems.filter(item => item.name.toLowerCase().includes(materialSearchTerm.toLowerCase()));
  //   return result;
  // }, [availableItems, materialSearchTerm]);

  const filteredItems = useMemo(() => {
    if (!materialSearchTerm.trim()) {
      console.log(
        "Available items:",
        availableItems.map(item => ({
          id: item.id,
          name: item.name,
          type: item.type
        }))
      );
      return availableItems;
    }

    const result = availableItems.filter(item => item.name.toLowerCase().includes(materialSearchTerm.toLowerCase()));

    console.log(
      "Search results for '" + materialSearchTerm + "':",
      result.map(item => ({ id: item.id, name: item.name, type: item.type }))
    );

    return result;
  }, [availableItems, materialSearchTerm]);

  const calculateIngredientCost = useCallback(
    (ingredient: Omit<MenuItemIngredient, "cost">) => {
      // ✅ Helper to normalize IDs (use numeric ID directly)
      const normalizeId = (id: string) => id;

      // --- SAUCE CASE ---
      // Check if this is a sauce by looking for it in the sauces array
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

      // --- MATERIAL CASE ---
      try {
        const materialId = normalizeId(ingredient.materialId);
        const material = (materials || []).find(m => String(m.id) === materialId);
        if (!material) {
          console.warn(`Material not found for ID: ${ingredient.materialId}`);
          return 0;
        }
        const allStockEntries = (stockEntries || []).filter(entry => String(entry.materialId) === materialId);
        if (allStockEntries.length === 0) {
          console.warn(`No stock entries found for material ${material.name}`);
          return 0;
        }
        let totalWeightedCost = 0;
        let totalQuantity = 0;
        for (const entry of allStockEntries) {
          let quantity = entry.purchasedIndividualQuantity || 0;
          // Convert purchased quantity into base units if needed
          if (quantity <= 0 && entry.purchasedQuantity) {
            try {
              const conversionFactor = getConversionFactor(entry.purchasedUnit || material.baseUnit, material.baseUnit, material.unitType || "piece", material);
              quantity = parseFloat(String(entry.purchasedQuantity)) * conversionFactor;
            } catch (error) {
              console.error(`Error converting units for ${material.name}:`, error);
              continue;
            }
          }
          if (quantity <= 0) {
            console.warn(`Invalid quantity for stock entry:`, entry);
            continue;
          }
          let unitCost = 0;
          if (entry.costPerBaseUnit !== null && entry.costPerBaseUnit !== undefined && !isNaN(entry.costPerBaseUnit) && entry.costPerBaseUnit > 0) {
            unitCost = entry.costPerBaseUnit;
          } else if (entry.totalCost && entry.totalCost > 0) {
            unitCost = parseFloat(String(entry.totalCost)) / quantity;
          } else if (entry.costPerPurchasedUnit && entry.costPerPurchasedUnit > 0) {
            try {
              const conversionFactor = getConversionFactor(entry.purchasedUnit || material.baseUnit, material.baseUnit, material.unitType || "piece", material);
              unitCost = parseFloat(String(entry.costPerPurchasedUnit)) / conversionFactor;
            } catch (error) {
              console.error(`Error converting cost units for ${material.name}:`, error);
              continue;
            }
          }
          if (unitCost > 0) {
            totalWeightedCost += unitCost * quantity;
            totalQuantity += quantity;
          } else {
            console.warn(`Could not determine unit cost for stock entry:`, entry);
          }
        }

        if (totalQuantity <= 0) {
          console.warn(`No valid quantity data for material ${material.name}`);
          return 0;
        }
        const costPerUnit = totalWeightedCost / totalQuantity;
        try {
          const conversionFactor = getConversionFactor(ingredient.unit, material.baseUnit, material.unitType || "piece", material);
          const finalCost = ingredient.quantity * costPerUnit * conversionFactor;
          return isNaN(finalCost) ? 0 : finalCost;
        } catch (error) {
          console.error(`Error calculating final cost for ${material.name}:`, error);
          return 0;
        }
      } finally {
        try {
          console.groupEnd();
        } catch {}
      }
    },
    [materials, stockEntries, sauces]
  );

  const getMaterialCostPerBaseUnit = useCallback(
    (materialId: string) => {
      if (!materialId) return 0;

      // Check if this is a sauce by looking for it in the sauces array
      const isSauce = sauces.some(sauce => sauce.id.toString() === materialId);

      if (isSauce) {
        const sauce = sauces.find(s => s.id.toString() === materialId);
        return sauce ? parseFloat(String(sauce.costPerUnit || 0)) : 0;
      }

      const material = materials.find(m => String(m.id) === materialId);
      if (!material) {
        return 0;
      }
      const allStockEntries = material.stockEntries || [];
      if (allStockEntries.length === 0) {
        return 0;
      }
      let totalWeightedCost = 0;
      let totalQuantity = 0;
      for (const entry of allStockEntries) {
        let quantity = entry.purchasedIndividualQuantity || 0;
        if (quantity <= 0 && entry.purchasedQuantity) {
          try {
            const conversionFactor = getConversionFactor(entry.purchasedUnit || material.baseUnit, material.baseUnit, material.unitType || "piece", material);
            quantity = parseFloat(String(entry.purchasedQuantity)) * conversionFactor;
          } catch (error) {
            continue;
          }
        }
        if (quantity <= 0) continue;
        let unitCost = 0;
        if (entry.costPerBaseUnit !== null && entry.costPerBaseUnit !== undefined && !isNaN(entry.costPerBaseUnit) && entry.costPerBaseUnit > 0) {
          unitCost = entry.costPerBaseUnit;
        } else if (entry.totalCost && entry.totalCost > 0) {
          unitCost = parseFloat(String(entry.totalCost)) / quantity;
        } else if (entry.costPerPurchasedUnit && entry.costPerPurchasedUnit > 0) {
          try {
            const conversionFactor = getConversionFactor(entry.purchasedUnit || material.baseUnit, material.baseUnit, material.unitType || "piece", material);
            unitCost = parseFloat(String(entry.costPerPurchasedUnit)) / conversionFactor;
          } catch (error) {
            continue;
          }
        }
        if (unitCost > 0) {
          totalWeightedCost += unitCost * quantity;
          totalQuantity += quantity;
        }
      }
      return totalQuantity > 0 ? totalWeightedCost / totalQuantity : 0;
    },
    [materials, sauces]
  );

  const totalIngredientsCost = useMemo(() => {
    let total = 0;
    (ingredients || []).forEach(ingredient => {
      const storedCost = menuItem?.ingredients?.find(i => i.materialId === ingredient.materialId)?.cost;
      const cost = storedCost || calculateIngredientCost(ingredient);
      const costValue = isNaN(parseFloat(String(cost))) ? 0 : parseFloat(String(cost));
      total += costValue;
    });
    return isNaN(total) ? 0 : total;
  }, [ingredients, calculateIngredientCost, menuItem]);

  // const handleAddIngredient = useCallback(() => {
  //   if (!selectedMaterialId || !ingredientQuantity || !ingredientUnit) return;

  //   const quantity = parseFloat(ingredientQuantity);
  //   if (isNaN(quantity) || quantity <= 0) return;

  //   const selectedItem = allSelectableItems.find(item => item.id === selectedMaterialId);
  //   if (!selectedItem) return;

  //   const cost = calculateIngredientCost({
  //     materialId: selectedMaterialId,
  //     quantity,
  //     unit: ingredientUnit,
  //     type: selectedItem.type
  //   });

  //   const newIngredient: MenuItemIngredient = {
  //     materialId: selectedMaterialId, // we keep this for both, will convert to sauceId in submit
  //     quantity,
  //     unit: ingredientUnit,
  //     cost,
  //     type: selectedItem.type // "material" or "sauce"
  //   };

  //   onIngredientsChange([...ingredients, newIngredient]);
  //   setSelectedMaterialId("");
  //   setIngredientQuantity("");
  //   setIngredientUnit("");
  // }, [selectedMaterialId, ingredientQuantity, ingredientUnit, ingredients, onIngredientsChange, allSelectableItems]);

  const handleAddIngredient = useCallback(() => {
    if (!selectedMaterialId || !ingredientQuantity || !ingredientUnit) {
      console.log("Cannot add ingredient - missing required fields:", {
        selectedMaterialId,
        ingredientQuantity,
        ingredientUnit
      });
      return;
    }

    const quantity = parseFloat(ingredientQuantity);
    if (isNaN(quantity) || quantity <= 0) {
      console.log("Cannot add ingredient - invalid quantity:", ingredientQuantity);
      return;
    }

    // Look for the item using the PREFIXED ID format
    const selectedItem = allSelectableItems.find(item => {
      // Create the prefixed ID to match against
      const prefixedId = `${selectedItemType}-${selectedMaterialId}`;
      return item.id === prefixedId;
    });

    if (!selectedItem) {
      console.log("Cannot add ingredient - selected item not found with prefixed ID:", `${selectedItemType}-${selectedMaterialId}`);
      return;
    }

    console.log("Adding ingredient:", {
      selectedItem,
      quantity,
      unit: ingredientUnit,
      type: selectedItem.type
    });

    const cost = calculateIngredientCost({
      materialId: selectedMaterialId, // This should still be the raw ID (without prefix)
      quantity,
      unit: ingredientUnit,
      type: selectedItem.type
    });

    console.log("Calculated cost:", cost);

    const newIngredient: MenuItemIngredient = {
      materialId: selectedMaterialId, // Store the raw ID
      quantity,
      unit: ingredientUnit,
      cost,
      type: selectedItem.type
    };

    console.log("New ingredient object:", newIngredient);

    onIngredientsChange([...ingredients, newIngredient]);
    setSelectedMaterialId("");
    setIngredientQuantity("");
    setIngredientUnit("");
  }, [selectedMaterialId, selectedItemType, ingredientQuantity, ingredientUnit, ingredients, onIngredientsChange, allSelectableItems]);

  // Add this to see the initial available items
  useEffect(() => {
    console.log("Initial available items:", availableItems);
    console.log("All selectable items:", allSelectableItems);
  }, [availableItems, allSelectableItems]);

  // Add this to see when ingredients change
  useEffect(() => {
    console.log("Current ingredients:", ingredients);
  }, [ingredients]);

  const handleRemoveIngredient = useCallback(
    (index: number) => {
      const newIngredients = ingredients.filter((_, i) => i !== index);
      onIngredientsChange(newIngredients);
    },
    [ingredients, onIngredientsChange]
  );

  // const handleMaterialSelect = useCallback(
  //   (itemId: string, itemName?: string) => {
  //     console.log("Item selected:", { itemId, itemName });
  //     console.log("handleMaterialSelect called with:", {
  //       itemId,
  //       itemName,
  //       allSelectableItems: allSelectableItems.map(item => ({ id: item.id, name: item.name, type: item.type }))
  //     });
  //     setSelectedMaterialId(itemId);
  //     setMaterialSearchTerm(itemName || "");

  //     // Check if this is a sauce by looking for it in the sauces array
  //     const isSauce = sauces.some(sauce => sauce.id.toString() === itemId);

  //     if (isSauce) {
  //       console.log("Selected item is a sauce");
  //       setSelectedItemType("sauce");
  //       const sauce = sauces.find(s => s.id.toString() === itemId);
  //       if (sauce) {
  //         setIngredientUnit(sauce.unit);
  //         console.log("Sauce unit set to:", sauce.unit);
  //       }
  //     } else {
  //       console.log("Selected item is a material");
  //       setSelectedItemType("material");
  //       const material = (materials || []).find(m => String(m.id) === itemId);
  //       if (material) {
  //         setIngredientUnit(material.baseUnit);
  //         console.log("Material base unit set to:", material.baseUnit);
  //       } else {
  //         setIngredientUnit("");
  //         console.log("Material not found, unit cleared");
  //       }
  //     }
  //   },
  //   [materials, sauces]
  // );
  // const handleMaterialSelect = useCallback(
  //   (itemId: string, itemName?: string) => {
  //     setSelectedMaterialId(itemId);
  //     setMaterialSearchTerm(itemName || "");

  //     // Check if this is a sauce by looking for it in the sauces array
  //     const isSauce = sauces.some(sauce => sauce.id.toString() === itemId);

  //     if (isSauce) {
  //       setSelectedItemType("sauce");
  //       const sauce = sauces.find(s => s.id.toString() === itemId);
  //       if (sauce) {
  //         setIngredientUnit(sauce.unit);
  //       }
  //     } else {
  //       setSelectedItemType("material");
  //       const material = (materials || []).find(m => String(m.id) === itemId);
  //       if (material) {
  //         setIngredientUnit(material.baseUnit);
  //       } else {
  //         setIngredientUnit("");
  //       }
  //     }
  //   },
  //   [materials, sauces]
  // );

  const handleMaterialSelect = useCallback(
    (itemId: string, itemName?: string) => {
      console.log("Item selected with prefixed ID:", itemId);

      // Extract the actual ID by removing the prefix
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

  const handleMaterialSearchChange = useCallback((value: string) => {
    setMaterialSearchTerm(value);
    setSelectedMaterialId("");
    setSelectedItemType("material");
    setIngredientUnit("");
  }, []);

  useEffect(() => {
    const materialIds = (materials || []).map(m => String(m.id));
    const sauceIds = (sauces || []).map(s => String(s.id));

    const duplicateIds = materialIds.filter(id => sauceIds.includes(id));
    if (duplicateIds.length > 0) {
      console.warn("ID conflicts between materials and sauces:", duplicateIds);
    }
  }, [materials, sauces]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      const isAddIngredientEnabled = !!(selectedMaterialId && ingredientQuantity && ingredientUnit);
      if (isAddIngredientEnabled) {
        handleAddIngredient();
      }
    }
  };

  const noIngredientsCategories = ["alcohol", "cold", "hot", "shisha"];
  const requiresIngredients = !noIngredientsCategories.includes(category.toLowerCase());

  return (
    <div className="border-t pt-4">
      <h3 className="text-lg font-medium mb-4">
        Ingredients {requiresIngredients && <span className="text-red-500">*</span>}
        {!requiresIngredients && <span className="text-sm text-muted-foreground font-normal ml-2">(Optional for {category} items)</span>}
      </h3>
      {errors.ingredients && (
        <p id="ingredients-error" className="text-sm text-red-500 mb-2">
          {errors.ingredients}
        </p>
      )}

      <IngredientsTable ingredients={ingredients} materials={materials || []} sauces={sauces} menuItem={menuItem} calculateIngredientCost={calculateIngredientCost} getMaterialCostPerBaseUnit={getMaterialCostPerBaseUnit} formatNumber={formatNumber} formatCurrency={formatCurrency} handleRemoveIngredient={handleRemoveIngredient} totalIngredientsCost={totalIngredientsCost} price={price} />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4" ref={ingredientsInputSectionRef}>
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
          placeholder={availableItems.length === 0 ? "All items used" : "Search items..."}
          noResultsText={`No items found matching "{searchTerm}"`}
          inputRef={materialSelectRef}
          // itemRenderer={({ item, onSelect }) => (
          //   <button key={item.id} type="button" className="w-full px-3 py-2 text-left hover:bg-muted focus:bg-muted focus:outline-none border-b border-border last:border-b-0" onClick={() => onSelect(item.id, item.name)} onMouseDown={e => e.preventDefault()}>
          //     <div className="font-medium">{item.name}</div>
          //     <div className="text-sm text-muted-foreground">{item.type === "sauce" ? "Sauce" : "Material"}</div>
          //   </button>
          // )}
          itemRenderer={({ item, onSelect }) => (
            <button
              key={item.id}
              type="button"
              className="w-full px-3 py-2 text-left hover:bg-muted focus:bg-muted focus:outline-none border-b border-border last:border-b-0"
              onClick={() => {
                console.log("Item clicked in dropdown:", {
                  id: item.id,
                  name: item.name,
                  type: item.type
                });
                onSelect(item.id, item.name);
              }}
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
          <Input id="quantity" type="number" value={ingredientQuantity} onChange={e => setIngredientQuantity(e.target.value)} onKeyDown={handleKeyDown} placeholder="0" min="0" step="0.01" disabled={!selectedMaterialId} aria-invalid={!!errors.ingredientQuantity} aria-describedby={errors.ingredientQuantity ? "quantity-error" : undefined} />
          {errors.ingredientQuantity && (
            <p id="quantity-error" className="text-sm text-red-500 mt-1">
              {errors.ingredientQuantity}
            </p>
          )}
        </div>

        <div>
          <label htmlFor="unit" className="block text-sm font-medium mb-1">
            Unit
          </label>
          <select id="unit" value={ingredientUnit} onChange={e => setIngredientUnit(e.target.value)} onKeyDown={handleKeyDown} className="w-full px-3 py-2 border border-input bg-background rounded-md" disabled={!selectedMaterialId}>
            {selectedMaterialId ? (
              (() => {
                if (selectedItemType === "sauce") {
                  // For sauces, show available units (typically just the sauce's unit)
                  const sauceId = selectedMaterialId.replace("sauce-", "");
                  const sauce = sauces.find(s => String(s.id) === sauceId);
                  if (sauce) {
                    return [sauce.unit].map(unit => (
                      <option key={unit} value={unit}>
                        {unit}
                      </option>
                    ));
                  }
                  return <option value="">Invalid sauce</option>;
                } else {
                  // For materials, use the existing logic
                  const materialId = selectedMaterialId.replace("material-", "");
                  const availableUnits = getAvailableUnits(materialId, materials);
                  return availableUnits.map(unit => (
                    <option key={unit} value={unit}>
                      {unit}
                    </option>
                  ));
                }
              })()
            ) : (
              <option value="">Select item first</option>
            )}
          </select>
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
}

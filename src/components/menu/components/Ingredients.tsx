// import { MenuItemIngredient } from "@/types/inventory";
// import { formatCurrency, formatNumber } from "@/utils/conversionLogic";
// import { getAvailableUnits } from "@/utils/getAvailableUnits";
// import { getConversionFactor } from "@/utils/getConversionFactor";
// import { Plus } from "lucide-react";
// import { useCallback, useMemo, useRef, useState } from "react";
// import { useMenuItems } from "@/contexts/MenuItemsContext";
// import { Button } from "../../ui/button";
// import { Input } from "../../ui/input";
// import { Selection } from "../../ui/Selection";
// import { IngredientsProps } from "@/types/menuItems";
// import { IngredientsTable } from "./IngredientsTable";

// export function Ingredients({ ingredients = [], stockEntries = [], materials: materialsProp, menuItem, category = "", price = "0", onIngredientsChange, errors = {}, onErrorsChange }: IngredientsProps) {
//   const { materialsWithStock: materialsFromCtx } = useMenuItems();
//   const materials = materialsProp ?? materialsFromCtx;
//   const [selectedMaterialId, setSelectedMaterialId] = useState("");
//   const [materialSearchTerm, setMaterialSearchTerm] = useState("");
//   const [, setShowMaterialDropdown] = useState(false);
//   const [ingredientQuantity, setIngredientQuantity] = useState("");
//   const [ingredientUnit, setIngredientUnit] = useState("");
//   const materialSelectRef = useRef<HTMLInputElement>(null);
//   const ingredientsInputSectionRef = useRef<HTMLDivElement>(null);

//   const availableMaterials = useMemo(() => {
//     const usedMaterialIds = new Set((ingredients || []).map(i => i.materialId));
//     const excludedCategories = ["beverages", "cold", "hot", "alcohol"];
//     return (materials || []).filter(m => {
//       let categoryName = "";
//       if (typeof m.category === "string") {
//         categoryName = m.category.toLowerCase();
//       } else if (typeof m.category === "object" && m.category?.name) {
//         categoryName = m.category.name.toLowerCase();
//       } else if (typeof m.category === "object" && m.category?.value) {
//         categoryName = m.category.value.toLowerCase();
//       }

//       return !usedMaterialIds.has(m.id) && !excludedCategories.includes(categoryName);
//     });
//   }, [materials, ingredients]);

//   const filteredMaterials = useMemo(() => {
//     if (!materialSearchTerm.trim()) {
//       return availableMaterials;
//     }
//     return availableMaterials.filter(material => material.name.toLowerCase().includes(materialSearchTerm.toLowerCase()));
//   }, [availableMaterials, materialSearchTerm]);

//   const calculateIngredientCost = useCallback(
//     (ingredient: Omit<MenuItemIngredient, "cost">) => {
//       try {
//         const material = (materials || []).find(m => String(m.id) === String(ingredient.materialId));
//         if (!material) {
//           console.warn(`Material not found for ID: ${ingredient.materialId}`);
//           return 0;
//         }

//         const allStockEntries = (stockEntries || []).filter(entry => String(entry.materialId) === String(ingredient.materialId));
//         if (allStockEntries.length === 0) {
//           console.warn(`No stock entries found for material ${material.name}`);
//           return 0;
//         }

//         let costPerUnit = 0;
//         let totalWeightedCost = 0;
//         let totalQuantity = 0;
//         for (const [index, entry] of allStockEntries.entries()) {
//           let quantity = entry.purchasedIndividualQuantity || 0;
//           let quantitySource: string = "purchasedIndividualQuantity";
//           let quantityConversionFactor: number | undefined = undefined;
//           if (quantity <= 0 && entry.purchasedQuantity) {
//             try {
//               const conversionFactor = getConversionFactor(entry.purchasedUnit || material.baseUnit, material.baseUnit, material.unitType || "piece", material);
//               quantityConversionFactor = conversionFactor;
//               quantity = parseFloat(String(entry.purchasedQuantity)) * conversionFactor;
//               quantitySource = "purchasedQuantity*conversionFactor";
//             } catch (error) {
//               console.error(`Error converting units for ${material.name}:`, error);
//               console.log("entry-quantity-debug", { index, entry, quantityBefore: entry.purchasedIndividualQuantity, purchasedQuantity: entry.purchasedQuantity, purchasedUnit: entry.purchasedUnit });
//               continue;
//             }
//           }
//           if (quantity <= 0) {
//             console.warn(`Invalid quantity for stock entry:`, entry);
//             continue;
//           }

//           let unitCost = 0;
//           let unitCostSource: string = "";
//           let costConversionFactor: number | undefined = undefined;
//           if (entry.costPerBaseUnit !== null && entry.costPerBaseUnit !== undefined && !isNaN(entry.costPerBaseUnit) && entry.costPerBaseUnit > 0) {
//             unitCost = entry.costPerBaseUnit;
//             unitCostSource = "costPerBaseUnit";
//           } else if (entry.totalCost && entry.totalCost > 0) {
//             unitCost = parseFloat(String(entry.totalCost)) / quantity;
//             unitCostSource = "totalCost/quantity";
//           } else if (entry.costPerPurchasedUnit && entry.costPerPurchasedUnit > 0) {
//             try {
//               const conversionFactor = getConversionFactor(entry.purchasedUnit || material.baseUnit, material.baseUnit, material.unitType || "piece", material);
//               costConversionFactor = conversionFactor;
//               unitCost = parseFloat(String(entry.costPerPurchasedUnit)) / conversionFactor;
//               unitCostSource = "costPerPurchasedUnit/conv";
//             } catch (error) {
//               console.error(`Error converting cost units for ${material.name}:`, error);
//               console.log("entry-cost-debug", { index, entry, costPerPurchasedUnit: entry.costPerPurchasedUnit, purchasedUnit: entry.purchasedUnit });
//               continue;
//             }
//           }
//           if (unitCost > 0) {
//             totalWeightedCost += unitCost * quantity;
//             totalQuantity += quantity;
//           } else {
//             console.warn(`Could not determine unit cost for stock entry:`, entry);
//           }
//         }
//         if (totalQuantity > 0) {
//           costPerUnit = totalWeightedCost / totalQuantity;
//         } else {
//           console.warn(`No valid quantity data for material ${material.name}`);
//           return 0;
//         }
//         try {
//           const conversionFactor = getConversionFactor(ingredient.unit, material.baseUnit, material.unitType || "piece", material);
//           const finalCost = ingredient.quantity * costPerUnit * conversionFactor;
//           return isNaN(finalCost) ? 0 : finalCost;
//         } catch (error) {
//           console.error(`Error calculating final cost for ${material.name}:`, error);
//           return 0;
//         }
//       } finally {
//         try { console.groupEnd(); } catch {}
//       }
//     },
//     [materials, stockEntries]
//   );

//   const getMaterialCostPerBaseUnit = useCallback(
//     (materialId: string) => {
//       const material = (materials || []).find(m => String(m.id) === String(materialId));
//       if (!material) {
//         return 0;
//       }
//       const allStockEntries = (stockEntries || []).filter(entry => String(entry.materialId) === String(materialId));
//       if (allStockEntries.length === 0) {
//         return 0;
//       }
//       let totalWeightedCost = 0;
//       let totalQuantity = 0;
//       for (const entry of allStockEntries) {
//         let quantity = entry.purchasedIndividualQuantity || 0;
//         if (quantity <= 0 && entry.purchasedQuantity) {
//           const conversionFactor = getConversionFactor(entry.purchasedUnit || material.baseUnit, material.baseUnit, material.unitType || "piece", material);
//           quantity = parseFloat(String(entry.purchasedQuantity)) * conversionFactor;
//         }
//         if (quantity <= 0) continue;
//         let unitCost = 0;
//         if (entry.costPerBaseUnit !== null && entry.costPerBaseUnit !== undefined && !isNaN(entry.costPerBaseUnit) && entry.costPerBaseUnit > 0) {
//           unitCost = entry.costPerBaseUnit;
//         } else if (entry.totalCost && entry.totalCost > 0) {
//           unitCost = parseFloat(String(entry.totalCost)) / quantity;
//         } else if (entry.costPerPurchasedUnit && entry.costPerPurchasedUnit > 0) {
//           const conversionFactor = getConversionFactor(entry.purchasedUnit || material.baseUnit, material.baseUnit, material.unitType || "piece", material);
//           unitCost = parseFloat(String(entry.costPerPurchasedUnit)) / conversionFactor;
//         }
//         if (unitCost > 0) {
//           totalWeightedCost += unitCost * quantity;
//           totalQuantity += quantity;
//         }
//       }

//       return totalQuantity > 0 ? totalWeightedCost / totalQuantity : 0;
//     },
//     [stockEntries, materials]
//   );

//   const totalIngredientsCost = useMemo(() => {
//     let total = 0;
//     (ingredients || []).forEach(ingredient => {
//       const storedCost = menuItem?.ingredients?.find(i => i.materialId === ingredient.materialId)?.cost;
//       const cost = storedCost || calculateIngredientCost(ingredient);
//       const costValue = isNaN(parseFloat(String(cost))) ? 0 : parseFloat(String(cost));
//       total += costValue;
//     });
//     return isNaN(total) ? 0 : total;
//   }, [ingredients, calculateIngredientCost, menuItem]);

//   const handleAddIngredient = useCallback(() => {
//     if (!selectedMaterialId || !ingredientQuantity || !ingredientUnit) {
//       const newErrors = {
//         ...errors,
//         ingredientQuantity: !ingredientQuantity ? "Quantity is required" : undefined
//       };
//       onErrorsChange?.(newErrors);
//       return;
//     }
//     const quantity = parseFloat(ingredientQuantity);
//     if (isNaN(quantity) || quantity <= 0) {
//       const newErrors = { ...errors, ingredientQuantity: "Valid quantity is required" };
//       onErrorsChange?.(newErrors);
//       return;
//     }
//     const material = (materials || []).find(m => String(m.id) === selectedMaterialId);
//     const cost = material ? calculateIngredientCost({ materialId: selectedMaterialId, quantity, unit: ingredientUnit }) : 0;
//     const newIngredient: MenuItemIngredient = {
//       materialId: selectedMaterialId,
//       quantity,
//       unit: ingredientUnit,
//       cost
//     };
//     const newIngredients = [...ingredients, newIngredient];
//     onIngredientsChange(newIngredients);
//     setSelectedMaterialId("");
//     setMaterialSearchTerm("");
//     setShowMaterialDropdown(false);
//     setIngredientQuantity("");
//     setIngredientUnit("");
//     const newErrors = { ...errors, ingredientQuantity: undefined, ingredients: undefined };
//     onErrorsChange?.(newErrors);
//     setTimeout(() => {
//       if (ingredientsInputSectionRef.current) {
//         ingredientsInputSectionRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
//       }
//       if (materialSelectRef.current) {
//         materialSelectRef.current.focus();
//       }
//     }, 0);
//   }, [selectedMaterialId, ingredientQuantity, ingredientUnit, ingredients, onIngredientsChange, materials, calculateIngredientCost, errors, onErrorsChange]);

//   const handleRemoveIngredient = useCallback(
//     (index: number) => {
//       const newIngredients = ingredients.filter((_, i) => i !== index);
//       onIngredientsChange(newIngredients);
//     },
//     [ingredients, onIngredientsChange]
//   );

//   const handleMaterialSelect = useCallback(
//     (materialId: string, materialName?: string) => {
//       setSelectedMaterialId(materialId);
//       setMaterialSearchTerm(materialName || "");
//       const material = (materials || []).find(m => String(m.id) === materialId);
//       if (material) {
//         setIngredientUnit(material.baseUnit);
//       } else {
//         setIngredientUnit("");
//       }
//     },
//     [materials]
//   );

//   const handleMaterialSearchChange = useCallback((value: string) => {
//     setMaterialSearchTerm(value);
//     setSelectedMaterialId("");
//     setIngredientUnit("");
//   }, []);

//   const handleKeyDown = (e: React.KeyboardEvent) => {
//     if (e.key === "Enter") {
//       e.preventDefault();
//       const isAddIngredientEnabled = !!(selectedMaterialId && ingredientQuantity && ingredientUnit);
//       if (isAddIngredientEnabled) {
//         handleAddIngredient();
//       }
//     }
//   };

//   const noIngredientsCategories = ["alcohol", "cold", "hot", "shisha"];
//   const requiresIngredients = !noIngredientsCategories.includes(category.toLowerCase());

//   return (
//     <div className="border-t pt-4">
//       <h3 className="text-lg font-medium mb-4">
//         Ingredients {requiresIngredients && <span className="text-red-500">*</span>}
//         {!requiresIngredients && <span className="text-sm text-muted-foreground font-normal ml-2">(Optional for {category} items)</span>}
//       </h3>
//       {errors.ingredients && (
//         <p id="ingredients-error" className="text-sm text-red-500 mb-2">
//           {errors.ingredients}
//         </p>
//       )}

//       <IngredientsTable ingredients={ingredients} materials={materials || []} menuItem={menuItem} calculateIngredientCost={calculateIngredientCost} getMaterialCostPerBaseUnit={getMaterialCostPerBaseUnit} formatNumber={formatNumber} formatCurrency={formatCurrency} handleRemoveIngredient={handleRemoveIngredient} totalIngredientsCost={totalIngredientsCost} price={price} />

//       <div className="grid grid-cols-1 md:grid-cols-3 gap-4" ref={ingredientsInputSectionRef}>
//         <Selection
//           label="Material"
//           searchTerm={materialSearchTerm}
//           onSearchChange={handleMaterialSearchChange}
//           onKeyDown={handleKeyDown}
//           items={filteredMaterials}
//           onItemSelect={handleMaterialSelect}
//           getDisplayValue={item => item.name}
//           getItemId={item => String(item.id)}
//           estimateItemSizePx={56}
//           placeholder={availableMaterials.length === 0 ? "All materials used" : "Search materials..."}
//           noResultsText={`No materials found matching "{searchTerm}"`}
//           inputRef={materialSelectRef}
//           itemRenderer={({ item, onSelect }) => (
//             <button key={item.id} type="button" className="w-full px-3 py-2 text-left hover:bg-muted focus:bg-muted focus:outline-none border-b border-border last:border-b-0" onClick={() => onSelect(String(item.id), item.name)} onMouseDown={e => e.preventDefault()}>
//               <div className="font-medium">{item.name}</div>
//               <div className="text-sm text-muted-foreground">Base unit: {item.baseUnit}</div>
//             </button>
//           )}
//         />

//         <div>
//           <label htmlFor="quantity" className="block text-sm font-medium mb-1">
//             Quantity
//           </label>
//           <Input id="quantity" type="number" value={ingredientQuantity} onChange={e => setIngredientQuantity(e.target.value)} onKeyDown={handleKeyDown} placeholder="0" min="0" step="0.01" disabled={!selectedMaterialId} aria-invalid={!!errors.ingredientQuantity} aria-describedby={errors.ingredientQuantity ? "quantity-error" : undefined} />
//           {errors.ingredientQuantity && (
//             <p id="quantity-error" className="text-sm text-red-500 mt-1">
//               {errors.ingredientQuantity}
//             </p>
//           )}
//         </div>
//         <div>
//           <label htmlFor="unit" className="block text-sm font-medium mb-1">
//             Unit
//           </label>
//           <select id="unit" value={ingredientUnit} onChange={e => setIngredientUnit(e.target.value)} onKeyDown={handleKeyDown} className="w-full px-3 py-2 border border-input bg-background rounded-md" disabled={!selectedMaterialId}>
//             {selectedMaterialId ? (
//               (() => {
//                 const availableUnits = getAvailableUnits(selectedMaterialId, materials);
//                 return availableUnits.map(unit => (
//                   <option key={unit} value={unit}>
//                     {unit}
//                   </option>
//                 ));
//               })()
//             ) : (
//               <option value="">Select material first</option>
//             )}
//           </select>
//         </div>
//       </div>

//       <div className="flex justify-end mt-4">
//         <Button onClick={handleAddIngredient} disabled={!selectedMaterialId || !ingredientQuantity || !ingredientUnit} aria-label="Add ingredient">
//           <Plus className="h-4 w-4 mr-2" />
//           Add Ingredient
//         </Button>
//       </div>
//     </div>
//   );
// }
import { MenuItemIngredient } from "@/types/inventory";
import { formatCurrency, formatNumber } from "@/utils/conversionLogic";
import { getAvailableUnits } from "@/utils/getAvailableUnits";
import { getConversionFactor } from "@/utils/getConversionFactor";
import { Plus } from "lucide-react";
import { useCallback, useMemo, useRef, useState } from "react";
import { useMenuItems } from "@/contexts/MenuItemsContext";
import { Button } from "../../ui/button";
import { Input } from "../../ui/input";
import { Selection } from "../../ui/Selection";
import { IngredientsProps } from "@/types/menuItems";
import { IngredientsTable } from "./IngredientsTable";
import { Sauce } from "@/types/menuItems";

export function Ingredients({ ingredients = [], stockEntries = [], materials: materialsProp, menuItem, category = "", price = "0", onIngredientsChange, errors = {}, onErrorsChange, sauces = [] }: IngredientsProps & { sauces?: Sauce[] }) {
  const { materialsWithStock: materialsFromCtx } = useMenuItems();
  const materials = materialsProp ?? materialsFromCtx;
  const [selectedMaterialId, setSelectedMaterialId] = useState("");
  const [materialSearchTerm, setMaterialSearchTerm] = useState("");
  const [, setShowMaterialDropdown] = useState(false);
  const [ingredientQuantity, setIngredientQuantity] = useState("");
  const [ingredientUnit, setIngredientUnit] = useState("");
  const [selectedItemType, setSelectedItemType] = useState<"material" | "sauce">("material");
  const materialSelectRef = useRef<HTMLInputElement>(null);
  const ingredientsInputSectionRef = useRef<HTMLDivElement>(null);

  // Combine materials and sauces into a single array for selection
  const allSelectableItems = useMemo(() => {
    const materialItems = (materials || []).map(material => ({
      id: `material-${material.id}`,
      name: material.name,
      baseUnit: material.baseUnit,
      type: "material" as const,
      originalItem: material
    }));

    const sauceItems = (sauces || []).map(sauce => ({
      id: `sauce-${sauce.id}`,
      name: sauce.name,
      baseUnit: sauce.unit,
      type: "sauce" as const,
      originalItem: sauce
    }));

    return [...materialItems, ...sauceItems];
  }, [materials, sauces]);

  const availableItems = useMemo(() => {
    const usedMaterialIds = new Set((ingredients || []).map(i => i.materialId));
    const excludedCategories = ["beverages", "cold", "hot", "alcohol"];

    return allSelectableItems.filter(item => {
      // For materials, apply the category filter
      if (item.type === "material") {
        const material = item.originalItem;
        let categoryName = "";

        if (typeof material.category === "string") {
          categoryName = material.category.toLowerCase();
        } else if (typeof material.category === "object" && material.category?.name) {
          categoryName = material.category.name.toLowerCase();
        } else if (typeof material.category === "object" && material.category?.value) {
          categoryName = material.category.value.toLowerCase();
        }

        return !usedMaterialIds.has(`material-${material.id}`) && !excludedCategories.includes(categoryName);
      }

      // For sauces, just check if they're already used
      return !usedMaterialIds.has(`sauce-${item.originalItem.id}`);
    });
  }, [allSelectableItems, ingredients]);

  const filteredItems = useMemo(() => {
    if (!materialSearchTerm.trim()) {
      return availableItems;
    }
    return availableItems.filter(item => item.name.toLowerCase().includes(materialSearchTerm.toLowerCase()));
  }, [availableItems, materialSearchTerm]);

  const calculateIngredientCost = useCallback(
    (ingredient: Omit<MenuItemIngredient, "cost">) => {
      // Check if this is a sauce
      if (ingredient.materialId.startsWith("sauce-")) {
        const sauceId = ingredient.materialId.replace("sauce-", "");
        const sauce = sauces.find(s => String(s.id) === sauceId);

        if (!sauce) {
          console.warn(`Sauce not found for ID: ${sauceId}`);
          return 0;
        }

        // Calculate cost based on sauce's cost per unit
        try {
          const conversionFactor = getConversionFactor(ingredient.unit, sauce.unit, "volume", { baseUnit: sauce.unit } as any);

          const finalCost = ingredient.quantity * parseFloat(String(sauce.costPerUnit)) * conversionFactor;
          return isNaN(finalCost) ? 0 : finalCost;
        } catch (error) {
          console.error(`Error calculating cost for sauce ${sauce.name}:`, error);
          return 0;
        }
      }

      // Original logic for materials
      try {
        const material = (materials || []).find(m => String(m.id) === String(ingredient.materialId));
        if (!material) {
          console.warn(`Material not found for ID: ${ingredient.materialId}`);
          return 0;
        }

        const allStockEntries = (stockEntries || []).filter(entry => String(entry.materialId) === String(ingredient.materialId));
        if (allStockEntries.length === 0) {
          console.warn(`No stock entries found for material ${material.name}`);
          return 0;
        }

        let costPerUnit = 0;
        let totalWeightedCost = 0;
        let totalQuantity = 0;

        for (const [index, entry] of allStockEntries.entries()) {
          let quantity = entry.purchasedIndividualQuantity || 0;

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

        if (totalQuantity > 0) {
          costPerUnit = totalWeightedCost / totalQuantity;
        } else {
          console.warn(`No valid quantity data for material ${material.name}`);
          return 0;
        }

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
      // Check if this is a sauce
      if (materialId.startsWith("sauce-")) {
        const sauceId = materialId.replace("sauce-", "");
        const sauce = sauces.find(s => String(s.id) === sauceId);
        return sauce ? parseFloat(String(sauce.costPerUnit)) : 0;
      }

      // Original logic for materials
      const material = (materials || []).find(m => String(m.id) === String(materialId));
      if (!material) {
        return 0;
      }
      const allStockEntries = (stockEntries || []).filter(entry => String(entry.materialId) === String(materialId));
      if (allStockEntries.length === 0) {
        return 0;
      }
      let totalWeightedCost = 0;
      let totalQuantity = 0;
      for (const entry of allStockEntries) {
        let quantity = entry.purchasedIndividualQuantity || 0;
        if (quantity <= 0 && entry.purchasedQuantity) {
          const conversionFactor = getConversionFactor(entry.purchasedUnit || material.baseUnit, material.baseUnit, material.unitType || "piece", material);
          quantity = parseFloat(String(entry.purchasedQuantity)) * conversionFactor;
        }
        if (quantity <= 0) continue;
        let unitCost = 0;
        if (entry.costPerBaseUnit !== null && entry.costPerBaseUnit !== undefined && !isNaN(entry.costPerBaseUnit) && entry.costPerBaseUnit > 0) {
          unitCost = entry.costPerBaseUnit;
        } else if (entry.totalCost && entry.totalCost > 0) {
          unitCost = parseFloat(String(entry.totalCost)) / quantity;
        } else if (entry.costPerPurchasedUnit && entry.costPerPurchasedUnit > 0) {
          const conversionFactor = getConversionFactor(entry.purchasedUnit || material.baseUnit, material.baseUnit, material.unitType || "piece", material);
          unitCost = parseFloat(String(entry.costPerPurchasedUnit)) / conversionFactor;
        }
        if (unitCost > 0) {
          totalWeightedCost += unitCost * quantity;
          totalQuantity += quantity;
        }
      }

      return totalQuantity > 0 ? totalWeightedCost / totalQuantity : 0;
    },
    [stockEntries, materials, sauces]
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

  const handleAddIngredient = useCallback(() => {
    if (!selectedMaterialId || !ingredientQuantity || !ingredientUnit) {
      const newErrors = {
        ...errors,
        ingredientQuantity: !ingredientQuantity ? "Quantity is required" : undefined
      };
      onErrorsChange?.(newErrors);
      return;
    }
    const quantity = parseFloat(ingredientQuantity);
    if (isNaN(quantity) || quantity <= 0) {
      const newErrors = { ...errors, ingredientQuantity: "Valid quantity is required" };
      onErrorsChange?.(newErrors);
      return;
    }

    const cost = calculateIngredientCost({
      materialId: selectedMaterialId,
      quantity,
      unit: ingredientUnit
    });

    const newIngredient: MenuItemIngredient = {
      materialId: selectedMaterialId,
      quantity,
      unit: ingredientUnit,
      cost
    };

    const newIngredients = [...ingredients, newIngredient];
    onIngredientsChange(newIngredients);
    setSelectedMaterialId("");
    setSelectedItemType("material");
    setMaterialSearchTerm("");
    setShowMaterialDropdown(false);
    setIngredientQuantity("");
    setIngredientUnit("");
    const newErrors = { ...errors, ingredientQuantity: undefined, ingredients: undefined };
    onErrorsChange?.(newErrors);
    setTimeout(() => {
      if (ingredientsInputSectionRef.current) {
        ingredientsInputSectionRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
      }
      if (materialSelectRef.current) {
        materialSelectRef.current.focus();
      }
    }, 0);
  }, [selectedMaterialId, ingredientQuantity, ingredientUnit, ingredients, onIngredientsChange, calculateIngredientCost, errors, onErrorsChange]);

  const handleRemoveIngredient = useCallback(
    (index: number) => {
      const newIngredients = ingredients.filter((_, i) => i !== index);
      onIngredientsChange(newIngredients);
    },
    [ingredients, onIngredientsChange]
  );

  const handleMaterialSelect = useCallback(
    (itemId: string, itemName?: string) => {
      setSelectedMaterialId(itemId);
      setMaterialSearchTerm(itemName || "");

      // Determine if this is a material or sauce and set the type
      if (itemId.startsWith("sauce-")) {
        setSelectedItemType("sauce");
        const sauceId = itemId.replace("sauce-", "");
        const sauce = sauces.find(s => String(s.id) === sauceId);
        if (sauce) {
          setIngredientUnit(sauce.unit);
        }
      } else {
        setSelectedItemType("material");
        const materialId = itemId.replace("material-", "");
        const material = (materials || []).find(m => String(m.id) === materialId);
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
          label="Material or Sauce"
          searchTerm={materialSearchTerm}
          onSearchChange={handleMaterialSearchChange}
          onKeyDown={handleKeyDown}
          items={filteredItems}
          onItemSelect={handleMaterialSelect}
          getDisplayValue={item => item.name}
          getItemId={item => item.id}
          estimateItemSizePx={56}
          placeholder={availableItems.length === 0 ? "All items used" : "Search materials or sauces..."}
          noResultsText={`No items found matching "{searchTerm}"`}
          inputRef={materialSelectRef}
          itemRenderer={({ item, onSelect }) => (
            <button key={item.id} type="button" className="w-full px-3 py-2 text-left hover:bg-muted focus:bg-muted focus:outline-none border-b border-border last:border-b-0" onClick={() => onSelect(item.id, item.name)} onMouseDown={e => e.preventDefault()}>
              <div className="font-medium">{item.name}</div>
              <div className="text-sm text-muted-foreground">
                {item.type === "sauce" ? "Sauce" : "Material"} • Base unit: {item.baseUnit}
              </div>
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

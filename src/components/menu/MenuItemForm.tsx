// import { Material, MenuItem, MenuItemCategory, MenuItemIngredient, StockEntry } from "@/types/inventory";
// import { formatCurrency, formatNumber } from "@/utils/conversionLogic";
// import { getAvailableUnits } from "@/utils/getAvailableUnits";
// import { getConversionFactor } from "@/utils/getConversionFactor";
// import { Plus, Trash2 } from "lucide-react";
// import { useCallback, useEffect, useMemo, useState } from "react";
// import { Button } from "../ui/button";
// import { Input } from "../ui/input";
// import { Switch } from "../ui/switch";
// import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../ui/table";
// interface MenuItemFormProps {
//   menuItem?: MenuItem;
//   materials: Material[];
//   stockEntries: StockEntry[];
//   categories: { value: MenuItemCategory; label: string }[];
//   onSubmit: (data: Omit<MenuItem, "id" | "createdAt" | "updatedAt" | "ingredients"> & { ingredients: Omit<MenuItemIngredient, "cost">[] }) => void;
//   onCancel: () => void;
// }

// export function MenuItemForm({ menuItem, materials, stockEntries, categories, onSubmit, onCancel }: MenuItemFormProps) {
//   const [name, setName] = useState(menuItem?.name || "");
//   const [category, setCategory] = useState<MenuItemCategory | "">(menuItem?.category || "");
//   const [price, setPrice] = useState(menuItem?.price.toString() || "");
//   const [isPOSItem, setIsPOSItem] = useState(menuItem?.isPOSItem ?? true);
//   const [ingredients, setIngredients] = useState<Omit<MenuItemIngredient, "cost">[]>(menuItem?.ingredients.map(i => ({ materialId: i.materialId, quantity: i.quantity, unit: i.unit })) || []);
//   const [selectedMaterialId, setSelectedMaterialId] = useState("");
//   const [ingredientQuantity, setIngredientQuantity] = useState("");
//   const [ingredientUnit, setIngredientUnit] = useState("");
//   const [errors, setErrors] = useState<{
//     name?: string;
//     category?: string;
//     price?: string;
//     ingredients?: string;
//     ingredientQuantity?: string;
//   }>({});

//   const availableMaterials = useMemo(() => {
//     const usedMaterialIds = new Set(ingredients.map(i => i.materialId));
//     return materials.filter(m => !usedMaterialIds.has(m.id));
//   }, [materials, ingredients]);

//   const calculateIngredientCost = useCallback(
//     (ingredient: Omit<MenuItemIngredient, "cost">) => {
//       const material = materials.find(m => String(m.id) === String(ingredient.materialId));
//       if (!material) {
//         console.warn(`Material not found for ID: ${ingredient.materialId}`);
//         return 0;
//       }

//       // Get stock entries with valid costPerBaseUnit
//       const materialStockEntries = stockEntries.filter(
//         entry => String(entry.materialId) === String(ingredient.materialId) && entry.costPerBaseUnit !== null && entry.costPerBaseUnit !== undefined && !isNaN(entry.costPerBaseUnit) && entry.costPerBaseUnit > 0 // Exclude zero-cost entries
//       );

//       let costPerUnit = 0;

//       if (materialStockEntries.length > 0) {
//         // Calculate weighted average cost
//         const { totalCost, totalQuantity } = materialStockEntries.reduce(
//           (acc, entry) => {
//             const quantity = entry.purchasedIndividualQuantity || 0;
//             const cost = entry.costPerBaseUnit || 0;
//             return {
//               totalCost: acc.totalCost + cost * quantity,
//               totalQuantity: acc.totalQuantity + quantity
//             };
//           },
//           { totalCost: 0, totalQuantity: 0 }
//         );

//         if (totalQuantity > 0) {
//           costPerUnit = parseFloat((totalCost / totalQuantity).toFixed(8));
//         }
//       } else {
//         // Fallback: Calculate costPerBaseUnit from totalCost and purchasedIndividualQuantity
//         const allStockEntries = stockEntries.filter(entry => String(entry.materialId) === String(ingredient.materialId));
//         if (allStockEntries.length > 0) {
//           const { totalCost, totalQuantity } = allStockEntries.reduce(
//             (acc, entry) => {
//               const quantity = entry.purchasedIndividualQuantity || 0;
//               const cost = parseFloat(String(entry.totalCost || "0")) / (entry.purchasedIndividualQuantity || 1);
//               return {
//                 totalCost: acc.totalCost + cost * quantity,
//                 totalQuantity: acc.totalQuantity + quantity
//               };
//             },
//             { totalCost: 0, totalQuantity: 0 }
//           );
//           if (totalQuantity > 0) {
//             costPerUnit = parseFloat((totalCost / totalQuantity).toFixed(8));
//           }
//         }
//       }
//       const conversionFactor = getConversionFactor(ingredient.unit, material.baseUnit, material.unitType || "piece", material);
//       const finalCost = ingredient.quantity * conversionFactor * costPerUnit;

//       return finalCost;
//     },
//     [materials, stockEntries]
//   );

//   // Get costPerBaseUnit for display
//   const getMaterialCostPerBaseUnit = useCallback(
//     (materialId: string) => {
//       const materialStockEntries = stockEntries.filter(entry => String(entry.materialId) === String(materialId) && entry.costPerBaseUnit !== null && entry.costPerBaseUnit !== undefined && !isNaN(entry.costPerBaseUnit));

//       if (materialStockEntries.length === 0) {
//         return 0;
//       }

//       const { totalCost, totalQuantity } = materialStockEntries.reduce(
//         (acc, entry) => {
//           const quantity = entry.purchasedIndividualQuantity || 0;
//           const cost = entry.costPerBaseUnit || parseFloat(String(entry.totalCost || "0")) / (entry.purchasedIndividualQuantity || 1);
//           return {
//             totalCost: acc.totalCost + cost * quantity,
//             totalQuantity: acc.totalQuantity + quantity
//           };
//         },
//         { totalCost: 0, totalQuantity: 0 }
//       );

//       return totalQuantity > 0 ? parseFloat((totalCost / totalQuantity).toFixed(6)) : 0;
//     },
//     [stockEntries]
//   );

//   const totalIngredientsCost = useMemo(() => {
//     const total = ingredients.reduce((total, ingredient) => total + calculateIngredientCost(ingredient), 0);
//     return total;
//   }, [ingredients, calculateIngredientCost]);

//   const validateForm = useCallback(() => {
//     const newErrors: typeof errors = {};
//     if (!name.trim()) newErrors.name = "required";
//     if (!category) newErrors.category = "required";
//     if (!price || isNaN(parseFloat(price)) || parseFloat(price) <= 0) newErrors.price = "required";
//     if (ingredients.length === 0) newErrors.ingredients = "At least one ingredient is required";
//     setErrors(newErrors);
//     return Object.keys(newErrors).length === 0;
//   }, [name, category, price, ingredients]);

//   useEffect(() => {
//     validateForm();
//   }, [name, category, price, ingredients, validateForm]);

//   useEffect(() => {
//     if (menuItem) {
//       setName(menuItem.name || "");
//       setCategory(menuItem.category || "");
//       setPrice(menuItem.price.toString() || "");
//       setIsPOSItem(menuItem.isPOSItem || false);
//       setIngredients(
//         menuItem.ingredients.map(i => ({
//           materialId: i.materialId,
//           quantity: i.quantity,
//           unit: i.unit
//         })) || []
//       );
//     } else {
//       setName("");
//       setCategory("");
//       setPrice("");
//       setIsPOSItem(true);
//       setIngredients([]);
//     }
//     setErrors({});
//   }, [menuItem]);

//   const handleAddIngredient = useCallback(() => {
//     if (!selectedMaterialId || !ingredientQuantity || !ingredientUnit) {
//       setErrors(prev => ({
//         ...prev,
//         ingredientQuantity: !ingredientQuantity ? "Quantity is required" : undefined
//       }));
//       return;
//     }

//     const quantity = parseFloat(ingredientQuantity);
//     if (isNaN(quantity) || quantity <= 0) {
//       setErrors(prev => ({ ...prev, ingredientQuantity: "Valid quantity is required" }));
//       return;
//     }

//     const newIngredient: Omit<MenuItemIngredient, "cost"> = {
//       materialId: selectedMaterialId,
//       quantity,
//       unit: ingredientUnit
//     };

//     setIngredients(prev => [...prev, newIngredient]);
//     setSelectedMaterialId("");
//     setIngredientQuantity("");
//     setIngredientUnit("");
//     setErrors(prev => ({ ...prev, ingredientQuantity: undefined, ingredients: undefined }));
//   }, [selectedMaterialId, ingredientQuantity, ingredientUnit]);

//   const handleRemoveIngredient = useCallback((index: number) => {
//     setIngredients(prev => prev.filter((_, i) => i !== index));
//   }, []);

//   const handleSubmit = useCallback(() => {
//     if (!validateForm()) {
//       return;
//     }

//     try {
//       onSubmit({
//         name: name.trim(),
//         category: category as MenuItemCategory,
//         price: parseFloat(price),
//         ingredients,
//         isPOSItem,
//         menuItemIngredients: false
//       });
//       setName("");
//       setCategory("");
//       setPrice("");
//       setIsPOSItem(true);
//       setIngredients([]);
//       setErrors({});
//       onCancel();
//     } catch (error) {
//       console.error("Error submitting form:", error);
//       onCancel();
//     }
//   }, [name, category, price, isPOSItem, ingredients, onSubmit, onCancel, validateForm]);

//   const handleMaterialSelect = useCallback(
//     (materialId: string) => {
//       setSelectedMaterialId(materialId);
//       const material = materials.find(m => String(m.id) === materialId);
//       if (material) {
//         setIngredientUnit(material.baseUnit);
//       } else {
//         setIngredientUnit("");
//       }
//     },
//     [materials]
//   );

//   const handleCancel = useCallback(() => {
//     onCancel();
//   }, [onCancel]);

//   // Handle Enter key press - add ingredient if possible, otherwise submit form
//   const handleKeyDown = (e: React.KeyboardEvent) => {
//     if (e.key === "Enter") {
//       e.preventDefault();

//       // Check if Add Ingredient button is enabled (using current state)
//       const isAddIngredientEnabled = !!(selectedMaterialId && ingredientQuantity && ingredientUnit);

//       if (isAddIngredientEnabled) {
//         // Add ingredient if the button is enabled
//         handleAddIngredient();
//       } else {
//         // Otherwise, try to submit the form (create/update menu item)
//         const hasName = !!(name && name.trim());
//         const hasCategory = !!category;
//         const hasValidPrice = !!(price && !isNaN(parseFloat(price)) && parseFloat(price) > 0);
//         const hasIngredients = ingredients.length > 0;
//         const hasNoErrors = Object.keys(errors).length === 0;
//         const isFormValid = hasNoErrors && hasName && hasCategory && hasValidPrice && hasIngredients;

//         if (isFormValid) {
//           handleSubmit();
//         }
//       }
//     }
//   };

//   return (
//     <div className="space-y-6 p-4">
//       {/* Custom grid: Name (3 cols), Category (2 cols), Price (1 col), POS (2 cols) */}
//       <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-8 gap-4">
//         {/* Name field - takes 3 columns on large screens, 2 on medium */}
//         <div className="md:col-span-2 lg:col-span-3">
//           <label htmlFor="name" className="block text-sm font-medium mb-1">
//             Name <span className="text-red-500">*</span>
//           </label>
//           <Input id="name" value={name} onChange={e => setName(e.target.value)} onKeyDown={handleKeyDown} placeholder="e.g., Hamburger" aria-invalid={!!errors.name} aria-describedby={errors.name ? "name-error" : undefined} />
//           {errors.name ? (
//             <p id="name-error" className="text-sm text-red-500 mt-1">
//               {errors.name}
//             </p>
//           ) : (
//             <p className="text-sm text-gray-500 mt-1">Name is required</p>
//           )}
//         </div>

//         {/* Category field - takes 2 columns */}
//         <div className="md:col-span-1 lg:col-span-2">
//           <label htmlFor="category" className="block text-sm font-medium mb-1">
//             Category <span className="text-red-500">*</span>
//           </label>
//           <select id="category" value={category} onChange={e => setCategory(e.target.value as MenuItemCategory | "")} onKeyDown={handleKeyDown} className="w-full px-3 py-2 border border-input bg-background rounded-md" aria-invalid={!!errors.category} aria-describedby={errors.category ? "category-error" : undefined}>
//             <option value="">Select a category</option>
//             {categories.map(cat => (
//               <option key={cat.value} value={cat.value}>
//                 {cat.label}
//               </option>
//             ))}
//           </select>
//           {errors.category ? (
//             <p id="category-error" className="text-sm text-red-500 mt-1">
//               {errors.category}
//             </p>
//           ) : (
//             <p className="text-sm text-gray-500 mt-1">Category is required</p>
//           )}
//         </div>

//         {/* Price field - takes 1 column (half the original width) */}
//         <div className="md:col-span-1 lg:col-span-1">
//           <label htmlFor="price" className="block text-sm font-medium mb-1">
//             Price <span className="text-red-500">*</span>
//           </label>
//           <Input id="price" type="number" value={price} onChange={e => setPrice(e.target.value)} onKeyDown={handleKeyDown} placeholder="0.00" min="0" step="0.01" aria-invalid={!!errors.price} aria-describedby={errors.price ? "price-error" : undefined} />
//           {errors.price ? (
//             <p id="price-error" className="text-sm text-red-500 mt-1">
//               {errors.price}
//             </p>
//           ) : (
//             <p className="text-sm text-gray-500 mt-1">price is required</p>
//           )}
//         </div>

//         {/* POS toggle - takes 2 columns */}
//         <div className="md:col-span-1 lg:col-span-2">
//           <label className="block text-sm font-medium mb-1">Show in POS</label>
//           <div className="flex items-center space-x-2 mt-2">
//             <Switch id="isPOSItem" checked={isPOSItem} onCheckedChange={setIsPOSItem} />
//             <p className="text-sm text-gray-500 mt-1">(Make this item available for sale in the POS system)</p>
//           </div>
//         </div>
//       </div>

//       <div className="border-t pt-4">
//         <h3 className="text-lg font-medium mb-4">
//           Ingredients <span className="text-red-500">*</span>
//         </h3>
//         {errors.ingredients && (
//           <p id="ingredients-error" className="text-sm text-red-500 mb-2">
//             {errors.ingredients}
//           </p>
//         )}

//         {ingredients.length > 0 ? (
//           <div className="mb-4 border rounded-md overflow-hidden">
//             <Table>
//               <TableHeader>
//                 <TableRow>
//                   <TableHead>Material</TableHead>
//                   <TableHead>Quantity</TableHead>
//                   <TableHead>Unit</TableHead>
//                   <TableHead className="text-right">Cost</TableHead>
//                   <TableHead className="text-right"></TableHead>
//                 </TableRow>
//               </TableHeader>
//               <TableBody>
//                 {ingredients.map((ingredient, index) => {
//                   const material = materials.find(m => String(m.id) === String(ingredient.materialId));
//                   const ingredientCost = calculateIngredientCost(ingredient);
//                   const costPerBaseUnit = getMaterialCostPerBaseUnit(ingredient.materialId);
//                   return (
//                     <TableRow key={index}>
//                       <TableCell>{material?.name || "Unknown"}</TableCell>
//                       <TableCell>{formatNumber(ingredient.quantity)}</TableCell>
//                       <TableCell>{ingredient.unit}</TableCell>
//                       <TableCell className="text-right">{ingredientCost > 0 ? formatCurrency(ingredientCost) : <span className="text-red-500">No cost data</span>}</TableCell>
//                       <TableCell className="text-right">
//                         <Button size="sm" variant="ghost" onClick={() => handleRemoveIngredient(index)} aria-label={`Remove ${material?.name || "ingredient"}`}>
//                           <Trash2 className="h-4 w-4 text-red-500" />
//                         </Button>
//                       </TableCell>
//                     </TableRow>
//                   );
//                 })}
//               </TableBody>
//             </Table>
//             {ingredients.length > 0 && (
//               <div className="px-4 py-3 bg-muted/50 border-t">
//                 <div className="flex justify-between items-center font-medium">
//                   <span>Total Ingredients Cost:</span>
//                   <span className="text-lg">{formatCurrency(totalIngredientsCost)}</span>
//                 </div>
//                 {parseFloat(price) > 0 && (
//                   <div className="flex justify-between items-center text-sm text-muted-foreground mt-1">
//                     <span>Profit Margin:</span>
//                     <span className={parseFloat(price) - totalIngredientsCost >= 0 ? "text-green-600" : "text-red-600"}>
//                       {formatCurrency(parseFloat(price) - totalIngredientsCost)} ({formatNumber(parseFloat(price) > 0 ? ((parseFloat(price) - totalIngredientsCost) / parseFloat(price)) * 100 : 0)}%)
//                     </span>
//                   </div>
//                 )}
//               </div>
//             )}
//           </div>
//         ) : (
//           <div className="text-center py-4 text-muted-foreground">No ingredients added yet</div>
//         )}

//         <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
//           <div>
//             <label htmlFor="material" className="block text-sm font-medium mb-1">
//               Material
//             </label>
//             <select id="material" value={selectedMaterialId} onChange={e => handleMaterialSelect(e.target.value)} onKeyDown={handleKeyDown} className="w-full px-3 py-2 border border-input bg-background rounded-md" disabled={availableMaterials.length === 0} aria-describedby="material-description">
//               <option value="">Select material</option>
//               {availableMaterials.map(material => (
//                 <option key={material.id} value={material.id}>
//                   {material.name} ({material.baseUnit})
//                 </option>
//               ))}
//             </select>
//             <p id="material-description" className="text-sm text-muted-foreground mt-1">
//               {availableMaterials.length === 0 ? "All materials are already used" : "Select a material to add"}
//             </p>
//           </div>
//           <div>
//             <label htmlFor="quantity" className="block text-sm font-medium mb-1">
//               Quantity
//             </label>
//             <Input id="quantity" type="number" value={ingredientQuantity} onChange={e => setIngredientQuantity(e.target.value)} onKeyDown={handleKeyDown} placeholder="0" min="0" step="0.01" disabled={!selectedMaterialId} aria-invalid={!!errors.ingredientQuantity} aria-describedby={errors.ingredientQuantity ? "quantity-error" : undefined} />
//             {errors.ingredientQuantity && (
//               <p id="quantity-error" className="text-sm text-red-500 mt-1">
//                 {errors.ingredientQuantity}
//               </p>
//             )}
//           </div>
//           <div>
//             <label htmlFor="unit" className="block text-sm font-medium mb-1">
//               Unit
//             </label>
//             <select id="unit" value={ingredientUnit} onChange={e => setIngredientUnit(e.target.value)} onKeyDown={handleKeyDown} className="w-full px-3 py-2 border border-input bg-background rounded-md" disabled={!selectedMaterialId}>
//               {selectedMaterialId ? (
//                 (() => {
//                   const availableUnits = getAvailableUnits(selectedMaterialId, materials);
//                   return availableUnits.map(unit => (
//                     <option key={unit} value={unit}>
//                       {unit}
//                     </option>
//                   ));
//                 })()
//               ) : (
//                 <option value="">Select material first</option>
//               )}
//             </select>
//           </div>
//         </div>

//         <div className="flex justify-end mt-4">
//           <Button onClick={handleAddIngredient} disabled={!selectedMaterialId || !ingredientQuantity || !ingredientUnit} aria-label="Add ingredient">
//             <Plus className="h-4 w-4 mr-2" />
//             Add Ingredient
//           </Button>
//         </div>
//       </div>

//       <div className="flex justify-end gap-2 pt-4">
//         <Button variant="outline" onClick={handleCancel} aria-label="Cancel form">
//           Cancel
//         </Button>
//         <Button onClick={handleSubmit} disabled={!!Object.keys(errors).length || !name.trim() || !category || !price || parseFloat(price) <= 0 || ingredients.length === 0} aria-label={menuItem ? "Update menu item" : "Create menu item"}>
//           {menuItem ? "Update" : "Create"} Menu Item
//         </Button>
//       </div>
//     </div>
//   );
// }
import { Material, MenuItem, MenuItemCategory, MenuItemIngredient, StockEntry } from "@/types/inventory";
import { formatCurrency, formatNumber } from "@/utils/conversionLogic";
import { getAvailableUnits } from "@/utils/getAvailableUnits";
import { getConversionFactor } from "@/utils/getConversionFactor";
import { Plus, Trash2 } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Switch } from "../ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../ui/table";

interface MenuItemFormProps {
  menuItem?: MenuItem;
  materials: Material[];
  stockEntries: StockEntry[];
  categories: { value: MenuItemCategory; label: string }[];
  onSubmit: (data: Omit<MenuItem, "id" | "createdAt" | "updatedAt" | "ingredients"> & { ingredients: Omit<MenuItemIngredient, "cost">[] }) => void;
  onCancel: () => void;
}

export function MenuItemForm({ menuItem, materials, stockEntries, categories, onSubmit, onCancel }: MenuItemFormProps) {
  const [name, setName] = useState(menuItem?.name || "");
  const [category, setCategory] = useState<MenuItemCategory | "">(menuItem?.category || "");
  const [price, setPrice] = useState(menuItem?.price.toString() || "");
  const [isPOSItem, setIsPOSItem] = useState(menuItem?.isPOSItem ?? true);
  const [ingredients, setIngredients] = useState<Omit<MenuItemIngredient, "cost">[]>(menuItem?.ingredients.map(i => ({ materialId: i.materialId, quantity: i.quantity, unit: i.unit })) || []);
  const [selectedMaterialId, setSelectedMaterialId] = useState("");
  const [ingredientQuantity, setIngredientQuantity] = useState("");
  const [ingredientUnit, setIngredientUnit] = useState("");
  const [errors, setErrors] = useState<{
    name?: string;
    category?: string;
    price?: string;
    ingredients?: string;
    ingredientQuantity?: string;
  }>({});
  const materialSelectRef = useRef<HTMLSelectElement>(null);
  const ingredientsInputSectionRef = useRef<HTMLDivElement>(null);

  const availableMaterials = useMemo(() => {
    const usedMaterialIds = new Set(ingredients.map(i => i.materialId));
    return materials.filter(m => !usedMaterialIds.has(m.id));
  }, [materials, ingredients]);

  const calculateIngredientCost = useCallback(
    (ingredient: Omit<MenuItemIngredient, "cost">) => {
      const material = materials.find(m => String(m.id) === String(ingredient.materialId));
      if (!material) {
        console.warn(`Material not found for ID: ${ingredient.materialId}`);
        return 0;
      }

      const materialStockEntries = stockEntries.filter(entry => String(entry.materialId) === String(ingredient.materialId) && entry.costPerBaseUnit !== null && entry.costPerBaseUnit !== undefined && !isNaN(entry.costPerBaseUnit) && entry.costPerBaseUnit > 0);

      let costPerUnit = 0;

      if (materialStockEntries.length > 0) {
        const { totalCost, totalQuantity } = materialStockEntries.reduce(
          (acc, entry) => {
            const quantity = entry.purchasedIndividualQuantity || 0;
            const cost = entry.costPerBaseUnit || 0;
            return {
              totalCost: acc.totalCost + cost * quantity,
              totalQuantity: acc.totalQuantity + quantity
            };
          },
          { totalCost: 0, totalQuantity: 0 }
        );

        if (totalQuantity > 0) {
          costPerUnit = parseFloat((totalCost / totalQuantity).toFixed(8));
        }
      } else {
        const allStockEntries = stockEntries.filter(entry => String(entry.materialId) === String(ingredient.materialId));
        if (allStockEntries.length > 0) {
          const { totalCost, totalQuantity } = allStockEntries.reduce(
            (acc, entry) => {
              const quantity = entry.purchasedIndividualQuantity || 0;
              const cost = parseFloat(String(entry.totalCost || "0")) / (entry.purchasedIndividualQuantity || 1);
              return {
                totalCost: acc.totalCost + cost * quantity,
                totalQuantity: acc.totalQuantity + quantity
              };
            },
            { totalCost: 0, totalQuantity: 0 }
          );
          if (totalQuantity > 0) {
            costPerUnit = parseFloat((totalCost / totalQuantity).toFixed(8));
          }
        }
      }
      const conversionFactor = getConversionFactor(ingredient.unit, material.baseUnit, material.unitType || "piece", material);
      const finalCost = ingredient.quantity * conversionFactor * costPerUnit;

      return finalCost;
    },
    [materials, stockEntries]
  );

  const getMaterialCostPerBaseUnit = useCallback(
    (materialId: string) => {
      const materialStockEntries = stockEntries.filter(entry => String(entry.materialId) === String(materialId) && entry.costPerBaseUnit !== null && entry.costPerBaseUnit !== undefined && !isNaN(entry.costPerBaseUnit));

      if (materialStockEntries.length === 0) {
        return 0;
      }

      const { totalCost, totalQuantity } = materialStockEntries.reduce(
        (acc, entry) => {
          const quantity = entry.purchasedIndividualQuantity || 0;
          const cost = entry.costPerBaseUnit || parseFloat(String(entry.totalCost || "0")) / (entry.purchasedIndividualQuantity || 1);
          return {
            totalCost: acc.totalCost + cost * quantity,
            totalQuantity: acc.totalQuantity + quantity
          };
        },
        { totalCost: 0, totalQuantity: 0 }
      );

      return totalQuantity > 0 ? parseFloat((totalCost / totalQuantity).toFixed(6)) : 0;
    },
    [stockEntries]
  );

  const totalIngredientsCost = useMemo(() => {
    const total = ingredients.reduce((total, ingredient) => total + calculateIngredientCost(ingredient), 0);
    return total;
  }, [ingredients, calculateIngredientCost]);

  const validateForm = useCallback(() => {
    const newErrors: typeof errors = {};
    if (!name.trim()) newErrors.name = "required";
    if (!category) newErrors.category = "required";
    if (!price || isNaN(parseFloat(price)) || parseFloat(price) <= 0) newErrors.price = "required";
    if (ingredients.length === 0) newErrors.ingredients = "At least one ingredient is required";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [name, category, price, ingredients]);

  useEffect(() => {
    validateForm();
  }, [name, category, price, ingredients, validateForm]);

  useEffect(() => {
    if (menuItem) {
      setName(menuItem.name || "");
      setCategory(menuItem.category || "");
      setPrice(menuItem.price.toString() || "");
      setIsPOSItem(menuItem.isPOSItem || false);
      setIngredients(
        menuItem.ingredients.map(i => ({
          materialId: i.materialId,
          quantity: i.quantity,
          unit: i.unit
        })) || []
      );
    } else {
      setName("");
      setCategory("");
      setPrice("");
      setIsPOSItem(true);
      setIngredients([]);
    }
    setErrors({});
  }, [menuItem]);

  const handleAddIngredient = useCallback(() => {
    if (!selectedMaterialId || !ingredientQuantity || !ingredientUnit) {
      setErrors(prev => ({
        ...prev,
        ingredientQuantity: !ingredientQuantity ? "Quantity is required" : undefined
      }));
      return;
    }

    const quantity = parseFloat(ingredientQuantity);
    if (isNaN(quantity) || quantity <= 0) {
      setErrors(prev => ({ ...prev, ingredientQuantity: "Valid quantity is required" }));
      return;
    }

    const newIngredient: Omit<MenuItemIngredient, "cost"> = {
      materialId: selectedMaterialId,
      quantity,
      unit: ingredientUnit
    };

    setIngredients(prev => [...prev, newIngredient]);
    setSelectedMaterialId("");
    setIngredientQuantity("");
    setIngredientUnit("");
    setErrors(prev => ({ ...prev, ingredientQuantity: undefined, ingredients: undefined }));

    // Scroll to the ingredients input section and focus on Material Selection
    setTimeout(() => {
      if (ingredientsInputSectionRef.current) {
        ingredientsInputSectionRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
      }
      if (materialSelectRef.current) {
        materialSelectRef.current.focus();
      }
    }, 0);
  }, [selectedMaterialId, ingredientQuantity, ingredientUnit]);

  const handleRemoveIngredient = useCallback((index: number) => {
    setIngredients(prev => prev.filter((_, i) => i !== index));
  }, []);

  const handleSubmit = useCallback(() => {
    if (!validateForm()) {
      return;
    }

    try {
      onSubmit({
        name: name.trim(),
        category: category as MenuItemCategory,
        price: parseFloat(price),
        ingredients,
        isPOSItem,
        menuItemIngredients: false
      });
      setName("");
      setCategory("");
      setPrice("");
      setIsPOSItem(true);
      setIngredients([]);
      setErrors({});
      onCancel();
    } catch (error) {
      console.error("Error submitting form:", error);
      onCancel();
    }
  }, [name, category, price, isPOSItem, ingredients, onSubmit, onCancel, validateForm]);

  const handleMaterialSelect = useCallback(
    (materialId: string) => {
      setSelectedMaterialId(materialId);
      const material = materials.find(m => String(m.id) === materialId);
      if (material) {
        setIngredientUnit(material.baseUnit);
      } else {
        setIngredientUnit("");
      }
    },
    [materials]
  );

  const handleCancel = useCallback(() => {
    onCancel();
  }, [onCancel]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();

      const isAddIngredientEnabled = !!(selectedMaterialId && ingredientQuantity && ingredientUnit);

      if (isAddIngredientEnabled) {
        handleAddIngredient();
      } else {
        const hasName = !!(name && name.trim());
        const hasCategory = !!category;
        const hasValidPrice = !!(price && !isNaN(parseFloat(price)) && parseFloat(price) > 0);
        const hasIngredients = ingredients.length > 0;
        const hasNoErrors = Object.keys(errors).length === 0;
        const isFormValid = hasNoErrors && hasName && hasCategory && hasValidPrice && hasIngredients;

        if (isFormValid) {
          handleSubmit();
        }
      }
    }
  };

  return (
    <div className="space-y-6 p-4">
      <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-8 gap-4">
        <div className="md:col-span-2 lg:col-span-3">
          <label htmlFor="name" className="block text-sm font-medium mb-1">
            Name <span className="text-red-500">*</span>
          </label>
          <Input id="name" value={name} onChange={e => setName(e.target.value)} onKeyDown={handleKeyDown} placeholder="e.g., Hamburger" aria-invalid={!!errors.name} aria-describedby={errors.name ? "name-error" : undefined} />
          {errors.name ? (
            <p id="name-error" className="text-sm text-red-500 mt-1">
              {errors.name}
            </p>
          ) : (
            <p className="text-sm text-gray-500 mt-1">Name is required</p>
          )}
        </div>

        <div className="md:col-span-1 lg:col-span-2">
          <label htmlFor="category" className="block text-sm font-medium mb-1">
            Category <span className="text-red-500">*</span>
          </label>
          <select id="category" value={category} onChange={e => setCategory(e.target.value as MenuItemCategory | "")} onKeyDown={handleKeyDown} className="w-full px-3 py-2 border border-input bg-background rounded-md" aria-invalid={!!errors.category} aria-describedby={errors.category ? "category-error" : undefined}>
            <option value="">Select a category</option>
            {categories.map(cat => (
              <option key={cat.value} value={cat.value}>
                {cat.label}
              </option>
            ))}
          </select>
          {errors.category ? (
            <p id="category-error" className="text-sm text-red-500 mt-1">
              {errors.category}
            </p>
          ) : (
            <p className="text-sm text-gray-500 mt-1">Category is required</p>
          )}
        </div>

        <div className="md:col-span-1 lg:col-span-1">
          <label htmlFor="price" className="block text-sm font-medium mb-1">
            Price <span className="text-red-500">*</span>
          </label>
          <Input id="price" type="number" value={price} onChange={e => setPrice(e.target.value)} onKeyDown={handleKeyDown} placeholder="0.00" min="0" step="0.01" aria-invalid={!!errors.price} aria-describedby={errors.price ? "price-error" : undefined} />
          {errors.price ? (
            <p id="price-error" className="text-sm text-red-500 mt-1">
              {errors.price}
            </p>
          ) : (
            <p className="text-sm text-gray-500 mt-1">Price is required</p>
          )}
        </div>

        <div className="md:col-span-1 lg:col-span-2">
          <label className="block text-sm font-medium mb-1">Show in POS</label>
          <div className="flex items-center space-x-2 mt-2">
            <Switch id="isPOSItem" checked={isPOSItem} onCheckedChange={setIsPOSItem} />
            <p className="text-sm text-gray-500 mt-1">(Make this item available for sale in the POS system)</p>
          </div>
        </div>
      </div>

      <div className="border-t pt-4">
        <h3 className="text-lg font-medium mb-4">
          Ingredients <span className="text-red-500">*</span>
        </h3>
        {errors.ingredients && (
          <p id="ingredients-error" className="text-sm text-red-500 mb-2">
            {errors.ingredients}
          </p>
        )}

        {ingredients.length > 0 ? (
          <div className="mb-4 border rounded-md overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Material</TableHead>
                  <TableHead>Quantity</TableHead>
                  <TableHead>Unit</TableHead>
                  <TableHead className="text-right">Cost</TableHead>
                  <TableHead className="text-right"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {ingredients.map((ingredient, index) => {
                  const material = materials.find(m => String(m.id) === String(ingredient.materialId));
                  const ingredientCost = calculateIngredientCost(ingredient);
                  const costPerBaseUnit = getMaterialCostPerBaseUnit(ingredient.materialId);
                  return (
                    <TableRow key={index}>
                      <TableCell>{material?.name || "Unknown"}</TableCell>
                      <TableCell>{formatNumber(ingredient.quantity)}</TableCell>
                      <TableCell>{ingredient.unit}</TableCell>
                      <TableCell className="text-right">{ingredientCost > 0 ? formatCurrency(ingredientCost) : <span className="text-red-500">No cost data</span>}</TableCell>
                      <TableCell className="text-right">
                        <Button size="sm" variant="ghost" onClick={() => handleRemoveIngredient(index)} aria-label={`Remove ${material?.name || "ingredient"}`}>
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
            {ingredients.length > 0 && (
              <div className="px-4 py-3 bg-muted/50 border-t">
                <div className="flex justify-between items-center font-medium">
                  <span>Total Ingredients Cost:</span>
                  <span className="text-lg">{formatCurrency(totalIngredientsCost)}</span>
                </div>
                {parseFloat(price) > 0 && (
                  <div className="flex justify-between items-center text-sm text-muted-foreground mt-1">
                    <span>Profit Margin:</span>
                    <span className={parseFloat(price) - totalIngredientsCost >= 0 ? "text-green-600" : "text-red-600"}>
                      {formatCurrency(parseFloat(price) - totalIngredientsCost)} ({formatNumber(parseFloat(price) > 0 ? ((parseFloat(price) - totalIngredientsCost) / parseFloat(price)) * 100 : 0)}%)
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-4 text-muted-foreground">No ingredients added yet</div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4" ref={ingredientsInputSectionRef}>
          <div>
            <label htmlFor="material" className="block text-sm font-medium mb-1">
              Material
            </label>
            <select id="material" value={selectedMaterialId} onChange={e => handleMaterialSelect(e.target.value)} onKeyDown={handleKeyDown} className="w-full px-3 py-2 border border-input bg-background rounded-md" disabled={availableMaterials.length === 0} aria-describedby="material-description" ref={materialSelectRef}>
              <option value="">Select material</option>
              {availableMaterials.map(material => (
                <option key={material.id} value={material.id}>
                  {material.name} ({material.baseUnit})
                </option>
              ))}
            </select>
            <p id="material-description" className="text-sm text-muted-foreground mt-1">
              {availableMaterials.length === 0 ? "All materials are already used" : "Select a material to add"}
            </p>
          </div>
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
                  const availableUnits = getAvailableUnits(selectedMaterialId, materials);
                  return availableUnits.map(unit => (
                    <option key={unit} value={unit}>
                      {unit}
                    </option>
                  ));
                })()
              ) : (
                <option value="">Select material first</option>
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

      <div className="flex justify-end gap-2 pt-4">
        <Button variant="outline" onClick={handleCancel} aria-label="Cancel form">
          Cancel
        </Button>
        <Button onClick={handleSubmit} disabled={!!Object.keys(errors).length || !name.trim() || !category || !price || parseFloat(price) <= 0 || ingredients.length === 0} aria-label={menuItem ? "Update menu item" : "Create menu item"}>
          {menuItem ? "Update" : "Create"} Menu Item
        </Button>
      </div>
    </div>
  );
}

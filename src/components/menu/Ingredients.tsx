import { Material, MenuItem, MenuItemIngredient, StockEntry } from "@/types/inventory";
import { formatCurrency, formatNumber } from "@/utils/conversionLogic";
import { getAvailableUnits } from "@/utils/getAvailableUnits";
import { getConversionFactor } from "@/utils/getConversionFactor";
import { Plus, Trash2 } from "lucide-react";
import { useCallback, useMemo, useRef, useState } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import { createColumnHelper, flexRender, getCoreRowModel, getSortedRowModel, useReactTable, ColumnDef, SortingState } from "@tanstack/react-table";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../ui/table";

interface IngredientsProps {
  ingredients: MenuItemIngredient[];
  materials: Material[];
  stockEntries: StockEntry[];
  menuItem?: MenuItem;
  category: string;
  price: string;
  onIngredientsChange: (ingredients: MenuItemIngredient[]) => void;
  onValidationChange?: (hasErrors: boolean) => void;
  errors?: {
    ingredients?: string;
    ingredientQuantity?: string;
  };
  onErrorsChange?: (errors: { ingredients?: string; ingredientQuantity?: string }) => void;
}

export function Ingredients({
  ingredients,
  materials,
  stockEntries,
  menuItem,
  category,
  price,
  onIngredientsChange,
  onValidationChange,
  errors = {},
  onErrorsChange
}: IngredientsProps) {
  const [selectedMaterialId, setSelectedMaterialId] = useState("");
  const [materialSearchTerm, setMaterialSearchTerm] = useState("");
  const [showMaterialDropdown, setShowMaterialDropdown] = useState(false);
  const [ingredientQuantity, setIngredientQuantity] = useState("");
  const [ingredientUnit, setIngredientUnit] = useState("");
  const materialSelectRef = useRef<HTMLInputElement>(null);
  const ingredientsInputSectionRef = useRef<HTMLDivElement>(null);

  const availableMaterials = useMemo(() => {
    const usedMaterialIds = new Set(ingredients.map(i => i.materialId));
    const excludedCategories = ["beverages", "cold", "hot", "alcohol"];

    return materials.filter(m => !usedMaterialIds.has(m.id) && !excludedCategories.includes(m.category?.toLowerCase() || ""));
  }, [materials, ingredients]);

  const filteredMaterials = useMemo(() => {
    if (!materialSearchTerm.trim()) {
      return availableMaterials;
    }
    return availableMaterials.filter(material => material.name.toLowerCase().includes(materialSearchTerm.toLowerCase()));
  }, [availableMaterials, materialSearchTerm]);

  const calculateIngredientCost = useCallback(
    (ingredient: Omit<MenuItemIngredient, "cost">) => {
      const material = materials.find(m => String(m.id) === String(ingredient.materialId));
      if (!material) {
        console.warn(`Material not found for ID: ${ingredient.materialId}`);
        return 0;
      }

      // Get all stock entries for this material
      const allStockEntries = stockEntries.filter(entry => String(entry.materialId) === String(ingredient.materialId));

      if (allStockEntries.length === 0) {
        return 0;
      }

      let costPerUnit = 0;
      let totalWeightedCost = 0;
      let totalQuantity = 0;

      // Calculate weighted average cost per base unit from all stock entries
      for (const entry of allStockEntries) {
        // Use purchasedIndividualQuantity if available, otherwise use purchasedQuantity converted to base units
        let quantity = entry.purchasedIndividualQuantity || 0;
        if (quantity <= 0 && entry.purchasedQuantity) {
          // Convert purchased quantity to base units
          const conversionFactor = getConversionFactor(entry.purchasedUnit, material.baseUnit, material.unitType || "piece", material);
          quantity = parseFloat(String(entry.purchasedQuantity)) * conversionFactor;
        }

        if (quantity <= 0) {
          continue;
        }

        let unitCost = 0;

        // First try to use costPerBaseUnit if available
        if (entry.costPerBaseUnit !== null && entry.costPerBaseUnit !== undefined && !isNaN(entry.costPerBaseUnit) && entry.costPerBaseUnit > 0) {
          unitCost = entry.costPerBaseUnit;
        }
        // Otherwise calculate from totalCost and quantity (in base units)
        else if (entry.totalCost && entry.totalCost > 0) {
          unitCost = parseFloat(String(entry.totalCost)) / quantity;
        }
        // Fallback to costPerPurchasedUnit with conversion
        else if (entry.costPerPurchasedUnit && entry.costPerPurchasedUnit > 0) {
          // Convert from purchased unit cost to base unit cost
          const conversionFactor = getConversionFactor(entry.purchasedUnit, material.baseUnit, material.unitType || "piece", material);
          unitCost = parseFloat(String(entry.costPerPurchasedUnit)) * conversionFactor;
        }

        if (unitCost > 0) {
          totalWeightedCost += unitCost * quantity;
          totalQuantity += quantity;
        }
      }

      // Calculate average cost per base unit
      if (totalQuantity > 0) {
        costPerUnit = totalWeightedCost / totalQuantity;
      }

      // Convert ingredient quantity to base unit and calculate final cost
      const conversionFactor = getConversionFactor(ingredient.unit, material.baseUnit, material.unitType || "piece", material);
      const finalCost = ingredient.quantity * conversionFactor * costPerUnit;

      return finalCost;
    },
    [materials, stockEntries]
  );

  const getMaterialCostPerBaseUnit = useCallback(
    (materialId: string) => {
      const material = materials.find(m => String(m.id) === String(materialId));
      if (!material) {
        return 0;
      }

      const allStockEntries = stockEntries.filter(entry => String(entry.materialId) === String(materialId));

      if (allStockEntries.length === 0) {
        return 0;
      }

      let totalWeightedCost = 0;
      let totalQuantity = 0;

      // Calculate weighted average cost per base unit from all stock entries
      for (const entry of allStockEntries) {
        // Use purchasedIndividualQuantity if available, otherwise use purchasedQuantity converted to base units
        let quantity = entry.purchasedIndividualQuantity || 0;
        if (quantity <= 0 && entry.purchasedQuantity) {
          // Convert purchased quantity to base units
          const conversionFactor = getConversionFactor(entry.purchasedUnit, material.baseUnit, material.unitType || "piece", material);
          quantity = parseFloat(String(entry.purchasedQuantity)) * conversionFactor;
        }
        if (quantity <= 0) continue;

        let unitCost = 0;

        // First try to use costPerBaseUnit if available
        if (entry.costPerBaseUnit !== null && entry.costPerBaseUnit !== undefined && !isNaN(entry.costPerBaseUnit) && entry.costPerBaseUnit > 0) {
          unitCost = entry.costPerBaseUnit;
        }
        // Otherwise calculate from totalCost and quantity (in base units)
        else if (entry.totalCost && entry.totalCost > 0) {
          unitCost = parseFloat(String(entry.totalCost)) / quantity;
        }
        // Fallback to costPerPurchasedUnit with conversion
        else if (entry.costPerPurchasedUnit && entry.costPerPurchasedUnit > 0) {
          // Convert from purchased unit cost to base unit cost
          const conversionFactor = getConversionFactor(entry.purchasedUnit, material.baseUnit, material.unitType || "piece", material);
          unitCost = parseFloat(String(entry.costPerPurchasedUnit)) * conversionFactor;
        }

        if (unitCost > 0) {
          totalWeightedCost += unitCost * quantity;
          totalQuantity += quantity;
        }
      }

      return totalQuantity > 0 ? totalWeightedCost / totalQuantity : 0;
    },
    [stockEntries, materials]
  );

  const totalIngredientsCost = useMemo(() => {
    const total = ingredients.reduce((total, ingredient) => {
      // Use stored cost if available (for existing menu items), otherwise calculate
      const storedCost = menuItem?.ingredients?.find(i => i.materialId === ingredient.materialId)?.cost;
      const cost = storedCost || calculateIngredientCost(ingredient);
      return total + cost;
    }, 0);
    return total;
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

    const material = materials.find(m => String(m.id) === selectedMaterialId);
    const cost = material ? calculateIngredientCost({ materialId: selectedMaterialId, quantity, unit: ingredientUnit }) : 0;

    const newIngredient: MenuItemIngredient = {
      materialId: selectedMaterialId,
      quantity,
      unit: ingredientUnit,
      cost
    };

    const newIngredients = [...ingredients, newIngredient];
    onIngredientsChange(newIngredients);
    
    setSelectedMaterialId("");
    setMaterialSearchTerm("");
    setShowMaterialDropdown(false);
    setIngredientQuantity("");
    setIngredientUnit("");
    
    const newErrors = { ...errors, ingredientQuantity: undefined, ingredients: undefined };
    onErrorsChange?.(newErrors);

    // Scroll to the ingredients input section and focus on Material Selection
    setTimeout(() => {
      if (ingredientsInputSectionRef.current) {
        ingredientsInputSectionRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
      }
      if (materialSelectRef.current) {
        materialSelectRef.current.focus();
      }
    }, 0);
  }, [selectedMaterialId, ingredientQuantity, ingredientUnit, ingredients, onIngredientsChange, materials, calculateIngredientCost, errors, onErrorsChange]);

  const handleRemoveIngredient = useCallback((index: number) => {
    const newIngredients = ingredients.filter((_, i) => i !== index);
    onIngredientsChange(newIngredients);
  }, [ingredients, onIngredientsChange]);

  const handleMaterialSelect = useCallback(
    (materialId: string, materialName?: string) => {
      setSelectedMaterialId(materialId);
      setMaterialSearchTerm(materialName || "");
      setShowMaterialDropdown(false);
      const material = materials.find(m => String(m.id) === materialId);
      if (material) {
        setIngredientUnit(material.baseUnit);
      } else {
        setIngredientUnit("");
      }
    },
    [materials]
  );

  const handleMaterialSearchChange = useCallback((value: string) => {
    setMaterialSearchTerm(value);
    setSelectedMaterialId("");
    setIngredientUnit("");
    setShowMaterialDropdown(value.length > 0);
  }, []);

  const handleMaterialInputFocus = useCallback(() => {
    setShowMaterialDropdown(materialSearchTerm.length > 0 || filteredMaterials.length > 0);
  }, [materialSearchTerm, filteredMaterials]);

  const handleMaterialInputBlur = useCallback(() => {
    // Delay hiding dropdown to allow for clicks
    setTimeout(() => setShowMaterialDropdown(false), 150);
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

  // Check if ingredients are required for this category
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

      <TanStackVirtualizedIngredientsTable 
        ingredients={ingredients}
        materials={materials}
        menuItem={menuItem}
        calculateIngredientCost={calculateIngredientCost}
        getMaterialCostPerBaseUnit={getMaterialCostPerBaseUnit}
        formatNumber={formatNumber}
        formatCurrency={formatCurrency}
        handleRemoveIngredient={handleRemoveIngredient}
        totalIngredientsCost={totalIngredientsCost}
        price={price}
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4" ref={ingredientsInputSectionRef}>
        <div className="relative">
          <label htmlFor="material" className="block text-sm font-medium mb-1">
            Material
          </label>
          <Input 
            id="material" 
            type="text" 
            value={materialSearchTerm} 
            onChange={e => handleMaterialSearchChange(e.target.value)} 
            onFocus={handleMaterialInputFocus} 
            onBlur={handleMaterialInputBlur} 
            onKeyDown={handleKeyDown} 
            placeholder={availableMaterials.length === 0 ? "All materials used" : "Search materials..."} 
            disabled={availableMaterials.length === 0} 
            aria-describedby="material-description" 
            ref={materialSelectRef} 
            autoComplete="off" 
          />
          {showMaterialDropdown && filteredMaterials.length > 0 && (
            <div className="absolute z-50 w-full mt-1 bg-white border border-input rounded-md shadow-lg max-h-60 overflow-y-auto">
              {filteredMaterials.map(material => (
                <button 
                  key={material.id} 
                  type="button" 
                  className="w-full px-3 py-2 text-left hover:bg-muted focus:bg-muted focus:outline-none border-b border-border last:border-b-0" 
                  onClick={() => handleMaterialSelect(material.id, material.name)} 
                  onMouseDown={e => e.preventDefault()}
                >
                  <div className="font-medium">{material.name}</div>
                  <div className="text-sm text-muted-foreground">Base unit: {material.baseUnit}</div>
                </button>
              ))}
            </div>
          )}
          {showMaterialDropdown && filteredMaterials.length === 0 && materialSearchTerm && (
            <div className="absolute z-50 w-full mt-1 bg-white border border-input rounded-md shadow-lg">
              <div className="px-3 py-2 text-muted-foreground text-center">No materials found matching "{materialSearchTerm}"</div>
            </div>
          )}
          <p id="material-description" className="text-sm text-muted-foreground mt-1">
            {availableMaterials.length === 0 ? "All materials are already used" : "Type to search and select a material"}
          </p>
        </div>
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
            aria-describedby={errors.ingredientQuantity ? "quantity-error" : undefined} 
          />
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
          <select 
            id="unit" 
            value={ingredientUnit} 
            onChange={e => setIngredientUnit(e.target.value)} 
            onKeyDown={handleKeyDown} 
            className="w-full px-3 py-2 border border-input bg-background rounded-md" 
            disabled={!selectedMaterialId}
          >
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
}

// TanStack Virtualized Ingredients Table Component
interface TanStackVirtualizedIngredientsTableProps {
  ingredients: MenuItemIngredient[];
  materials: Material[];
  menuItem?: MenuItem;
  calculateIngredientCost: (ingredient: Omit<MenuItemIngredient, "cost">) => number;
  getMaterialCostPerBaseUnit: (materialId: string) => number;
  formatNumber: (value: number) => string;
  formatCurrency: (amount: number) => string;
  handleRemoveIngredient: (index: number) => void;
  totalIngredientsCost: number;
  price: string;
}

const TanStackVirtualizedIngredientsTable: React.FC<TanStackVirtualizedIngredientsTableProps> = ({ 
  ingredients, 
  materials, 
  menuItem, 
  calculateIngredientCost, 
  getMaterialCostPerBaseUnit, 
  formatNumber, 
  formatCurrency, 
  handleRemoveIngredient, 
  totalIngredientsCost, 
  price 
}) => {
  const parentRef = useRef<HTMLDivElement>(null);
  const [sorting, setSorting] = useState<SortingState>([]);

  // Column helper for TanStack Table
  const columnHelper = createColumnHelper<MenuItemIngredient & { index: number }>();

  // Column definitions
  const columns = useMemo<ColumnDef<MenuItemIngredient & { index: number }>[]>(
    () => [
      // Material name column
      columnHelper.display({
        id: "material",
        header: "Material",
        cell: ({ row }) => {
          const material = materials.find(m => String(m.id) === String(row.original.materialId));
          return <div className="font-medium truncate">{material?.name || "Unknown"}</div>;
        },
        size: 200
      }),

      // Quantity column
      columnHelper.accessor("quantity", {
        header: "Quantity",
        cell: ({ getValue }) => <div>{formatNumber(getValue())}</div>,
        size: 100
      }),

      // Unit column
      columnHelper.accessor("unit", {
        header: "Unit",
        cell: ({ getValue }) => <div className="text-muted-foreground">{getValue()}</div>,
        size: 80
      }),

      // Cost column
      columnHelper.display({
        id: "cost",
        header: "Cost",
        cell: ({ row }) => {
          // Use stored cost if available (for existing menu items), otherwise calculate
          const storedCost = menuItem?.ingredients?.find(i => i.materialId === row.original.materialId)?.cost;
          const ingredientCost = storedCost || calculateIngredientCost(row.original);

          return (
            <div className="text-right font-medium">
              {ingredientCost > 0 ? (
                <span className="text-foreground">{formatCurrency(ingredientCost)}</span>
              ) : (
                <span className="text-red-500 text-xs">No cost data</span>
              )}
            </div>
          );
        },
        size: 120
      }),

      // Actions column
      columnHelper.display({
        id: "actions",
        header: "",
        cell: ({ row }) => {
          const material = materials.find(m => String(m.id) === String(row.original.materialId));
          return (
            <div className="text-right">
              <Button 
                size="sm" 
                variant="ghost" 
                className="h-8 w-8 p-0 hover:bg-red-50 hover:text-red-600" 
                onClick={() => handleRemoveIngredient(row.original.index)} 
                aria-label={`Remove ${material?.name || "ingredient"}`}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          );
        },
        enableSorting: false,
        size: 60
      })
    ],
    [materials, menuItem, calculateIngredientCost, formatNumber, formatCurrency, handleRemoveIngredient]
  );

  // Prepare data with index for removal functionality
  const tableData = useMemo(() => ingredients.map((ingredient, index) => ({ ...ingredient, index })), [ingredients]);

  // TanStack Table instance
  const table = useReactTable({
    data: tableData,
    columns,
    state: {
      sorting
    },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel()
  });

  const rows = table.getRowModel().rows;

  const rowVirtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 52,
    overscan: 5
  });

  if (ingredients.length === 0) {
    return <div className="text-center py-4 text-muted-foreground">No ingredients added yet</div>;
  }

  return (
    <div className="mb-4 border rounded-md overflow-hidden">
      <div className="flex flex-1 flex-col min-h-0">
        {/* Table Header */}
        <div className="flex-shrink-0 border-b bg-muted/30 sticky top-0 z-10">
          <Table>
            <TableHeader>
              {table.getHeaderGroups().map(headerGroup => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map(header => (
                    <TableHead 
                      key={header.id} 
                      style={{ width: header.getSize() }} 
                      className={header.column.getCanSort() ? "cursor-pointer select-none" : ""} 
                      onClick={header.column.getToggleSortingHandler()}
                    >
                      {header.isPlaceholder ? null : (
                        <div className="flex items-center gap-2">
                          {flexRender(header.column.columnDef.header, header.getContext())}
                          {header.column.getCanSort() && (
                            <span className="text-xs">
                              {{
                                asc: "↑",
                                desc: "↓"
                              }[header.column.getIsSorted() as string] ?? "↕"}
                            </span>
                          )}
                        </div>
                      )}
                    </TableHead>
                  ))}
                </TableRow>
              ))}
            </TableHeader>
          </Table>
        </div>

        {/* Virtualized Table Body */}
        <div className="flex-1 overflow-auto max-h-96" ref={parentRef} style={{ height: Math.min(rows.length * 52, 384) }}>
          <div
            style={{
              height: `${rowVirtualizer.getTotalSize()}px`,
              width: "100%",
              position: "relative"
            }}
          >
            {rowVirtualizer.getVirtualItems().map(virtualItem => {
              const row = rows[virtualItem.index];

              return (
                <div
                  key={virtualItem.key}
                  className="border-b border-border hover:bg-muted/50 transition-colors"
                  style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    width: "100%",
                    height: `${virtualItem.size}px`,
                    transform: `translateY(${virtualItem.start}px)`
                  }}
                >
                  <Table>
                    <TableBody>
                      <TableRow>
                        {row.getVisibleCells().map(cell => (
                          <TableCell key={cell.id} style={{ width: cell.column.getSize() }}>
                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                          </TableCell>
                        ))}
                      </TableRow>
                    </TableBody>
                  </Table>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Footer with totals */}
      {ingredients.length > 0 && (
        <div className="px-4 py-3 bg-muted/50 border-t">
          <div className="flex justify-between items-center font-medium">
            <span>Total Ingredients Cost:</span>
            <span className="text-lg font-semibold">{formatCurrency(totalIngredientsCost)}</span>
          </div>
          {parseFloat(price) > 0 && (
            <div className="flex justify-between items-center text-sm text-muted-foreground mt-1">
              <span>Profit Margin:</span>
              <span className={parseFloat(price) - totalIngredientsCost >= 0 ? "text-green-600 font-medium" : "text-red-600 font-medium"}>
                {formatCurrency(parseFloat(price) - totalIngredientsCost)} ({formatNumber(parseFloat(price) > 0 ? ((parseFloat(price) - totalIngredientsCost) / parseFloat(price)) * 100 : 0)}%)
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

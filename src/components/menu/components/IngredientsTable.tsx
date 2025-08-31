import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { MenuItemIngredient } from "@/types/inventory";
import { IngredientsTableProps } from "@/types/menuItems";
import { SortingState, createColumnHelper, ColumnDef, useReactTable, getCoreRowModel, getSortedRowModel, flexRender } from "@tanstack/react-table";
import { useVirtualizer } from "@tanstack/react-virtual";
import { Trash2, Edit } from "lucide-react";
import { useRef, useState, useMemo, useCallback } from "react";
import { Button } from "@/components/ui/button";

export const IngredientsTable: React.FC<IngredientsTableProps> = ({ ingredients = [], menuItem, formatNumber, formatCurrency, handleRemoveIngredient, totalIngredientsCost = 0, price = "0", sauces = [], calculateIngredientCost, materials, stockEntries = [], showActions = false, onEdit, onDelete }) => {
  const parentRef = useRef<HTMLDivElement>(null);
  const [sorting, setSorting] = useState<SortingState>([]);
  const columnHelper = createColumnHelper<MenuItemIngredient & { index: number }>();

  const getMaterialCostPerBaseUnit = useCallback(
    (materialId: string | number) => {
      if (materialId === null || materialId === undefined) return 0;
      const idStr = String(materialId);
      if (idStr.startsWith("sauce-")) {
        const sauceId = idStr.replace("sauce-", "");
        const sauce = sauces.find(s => String(s.id) === sauceId);
        return sauce ? parseFloat(String(sauce.costPerUnit || 0)) : 0;
      }
      const materialIdNum = idStr.startsWith("material-") ? idStr.replace("material-", "") : idStr;
      const material = materials.find(m => String(m.id) === String(materialIdNum) || `material-${m.id}` === idStr);
      return material ? parseFloat(String(material.costPerBaseUnit || 0)) : 0;
    },
    [materials, sauces]
  );

  // Enhanced cost calculation for proper beverage cost handling
  const calculateIngredientCostForTable = useCallback(
    (ingredient: MenuItemIngredient) => {
      if (!ingredient) return 0;

      // Handle sauces
      if (ingredient.type === "sauce") {
        const sauce = sauces.find(s => String(s.id) === String(ingredient.materialId));
        if (!sauce) return 0;
        
        try {
          // For sauces, use direct cost per unit calculation
          const costPerUnit = parseFloat(String(sauce.costPerUnit || 0));
          return ingredient.quantity * costPerUnit;
        } catch (error) {
          console.error(`Error calculating sauce cost:`, error);
          return 0;
        }
      }

      // Handle materials
      const material = materials.find(m => String(m.id) === String(ingredient.materialId));
      if (!material) return 0;

      // Find stock entries for this material from the stockEntries prop
      const materialStockEntries = stockEntries.filter(entry => String(entry.materialId) === String(ingredient.materialId));
      if (materialStockEntries.length === 0) {
        console.warn(`No stock entries found for material ${material.name} (ID: ${ingredient.materialId})`);
        return 0;
      }

      // Use the most recent stock entry (assuming they're sorted by date)
      const latestEntry = materialStockEntries[materialStockEntries.length - 1];
      console.log(`🔍 Processing ${material.name}:`, {
        materialId: ingredient.materialId,
        stockEntriesFound: materialStockEntries.length,
        latestEntry: {
          totalCost: latestEntry.totalCost,
          purchasedQuantity: latestEntry.purchasedQuantity,
          costPerBaseUnit: latestEntry.costPerBaseUnit
        },
        material: {
          unitType: material.unitType,
          packageQuantity: material.packageQuantity,
          baseUnit: material.baseUnit
        }
      });
      
      // Calculate cost per base unit from stock entry
      let costPerBaseUnit = 0;
      
      if (latestEntry.costPerBaseUnit && latestEntry.costPerBaseUnit > 0) {
        costPerBaseUnit = parseFloat(String(latestEntry.costPerBaseUnit));
      } else if (latestEntry.totalCost && latestEntry.purchasedQuantity) {
        // Calculate from total cost and purchased quantity
        const totalCost = parseFloat(String(latestEntry.totalCost));
        const purchasedQty = parseFloat(String(latestEntry.purchasedQuantity));
        
        if (material.unitType === "package" && material.packageQuantity) {
          // For package materials, calculate cost per base unit
          // Example: $12 for 1 bottle (75cl) = $12 / 75cl = $0.16 per cl
          const actualPackageSize = material.packageQuantity > 1 ? material.packageQuantity : 75; // Default to 75cl for beverages
          costPerBaseUnit = totalCost / (purchasedQty * actualPackageSize);
        } else {
          // For non-package materials
          costPerBaseUnit = totalCost / purchasedQty;
        }
      }

      if (costPerBaseUnit <= 0) return 0;

      // Convert ingredient unit to base unit and calculate cost
      try {
        let conversionFactor = 1;
        
        // Handle unit conversion
        if (ingredient.unit !== material.baseUnit) {
          // Simple volume conversions for beverages
          if (material.baseUnit === "cl" && ingredient.unit === "ml") {
            conversionFactor = 0.1; // 1ml = 0.1cl
          } else if (material.baseUnit === "cl" && ingredient.unit === "l") {
            conversionFactor = 100; // 1l = 100cl
          } else if (material.baseUnit === "ml" && ingredient.unit === "cl") {
            conversionFactor = 10; // 1cl = 10ml
          } else if (material.baseUnit === "ml" && ingredient.unit === "l") {
            conversionFactor = 1000; // 1l = 1000ml
          } else {
            // Use the existing conversion function as fallback
            const { getConversionFactor } = require("@/utils/getConversionFactor");
            conversionFactor = getConversionFactor(ingredient.unit, material.baseUnit, material.unitType || "piece", material);
          }
        }

        const finalCost = ingredient.quantity * costPerBaseUnit * conversionFactor;
        return isNaN(finalCost) ? 0 : finalCost;
      } catch (error) {
        console.error(`Error calculating ingredient cost for ${material.name}:`, error);
        return 0;
      }
    },
    [materials, sauces]
  );

  // Helper to get item name
  const getItemName = useCallback(
    (ingredient: MenuItemIngredient) => {
      if (!ingredient) return "Unknown Item";

      if (ingredient.type === "sauce") {
        // For sauces, look up by sauceId
        const sauce = sauces.find(s => String(s.id) === String(ingredient.materialId));
        return sauce?.name || "Unknown Sauce";
      }

      // For materials
      const material = materials.find(m => String(m.id) === String(ingredient.materialId));
      return material?.name || "Unknown Material";
    },
    [materials, sauces]
  );

  // Helper to get item type
  const getItemType = (ingredient: MenuItemIngredient) => {
    if (!ingredient) return "Unknown";
    return ingredient.type === "sauce" ? "Sauce" : "Material";
  };

  const columns = useMemo<ColumnDef<MenuItemIngredient & { index: number }>[]>(
    () => [
      // Item name column
      columnHelper.display({
        id: "item",
        header: "Item",
        cell: ({ row }) => {
          const ingredient = row.original;
          const itemName = getItemName(ingredient);
          const itemType = getItemType(ingredient);
          return (
            <div>
              <div className="font-medium truncate">{itemName}</div>
              <div className="text-xs text-muted-foreground">{itemType}</div>
            </div>
          );
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
          const ingredient = row.original;

          // First try to use stored cost if available
          const storedCost = menuItem?.ingredients?.find(i => i.materialId === ingredient.materialId)?.cost;
          if (storedCost !== undefined && storedCost !== null) {
            return <div className="text-right font-medium">{formatCurrency(storedCost)}</div>;
          }

          // Use the enhanced calculation function for proper beverage cost handling
          try {
            const cost = calculateIngredientCostForTable(ingredient);
            return <div className="text-right font-medium">{formatCurrency(cost)}</div>;
          } catch (error) {
            console.error('Cost calculation error:', error);
            return <div className="text-right text-red-500 text-xs">Calculation error</div>;
          }
        },
        size: 120
      }),

      // Actions column
      columnHelper.display({
        id: "actions",
        header: "",
        cell: ({ row }) => {
          const ingredient = row.original;
          const itemName = getItemName(ingredient);
          return (
            <div className="text-right flex gap-1">
              {showActions && onEdit && (
                <Button 
                  size="sm" 
                  variant="ghost" 
                  className="h-8 w-8 p-0 hover:bg-blue-50 hover:text-blue-600" 
                  onClick={() => onEdit(ingredient)} 
                  aria-label={`Edit ${itemName}`}
                >
                  <Edit className="h-4 w-4" />
                </Button>
              )}
              <Button 
                size="sm" 
                variant="ghost" 
                className="h-8 w-8 p-0 hover:bg-red-50 hover:text-red-600" 
                onClick={() => showActions && onDelete ? onDelete(ingredient.id || row.original.index) : handleRemoveIngredient(row.original.index)} 
                aria-label={`Remove ${itemName}`}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          );
        },
        enableSorting: false,
        size: showActions && onEdit ? 100 : 60
      })
    ],
    [materials, menuItem, formatNumber, formatCurrency, handleRemoveIngredient, sauces, getMaterialCostPerBaseUnit, calculateIngredientCostForTable, getItemName]
  );
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

  return (
    <div className="mb-4 border rounded-md overflow-hidden">
      <div className="flex flex-1 flex-col min-h-0 h-[250px]">
        {/* Table Header */}
        <div className="flex-shrink-0 border-b bg-muted/30 sticky top-0 z-10">
          <Table>
            <TableHeader>
              {table.getHeaderGroups().map(headerGroup => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map(header => (
                    <TableHead key={header.id} style={{ width: header.getSize() }} className={header.column.getCanSort() ? "cursor-pointer select-none" : ""} onClick={header.column.getToggleSortingHandler()}>
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

      {/* Footer with totals - always render regardless of ingredients count */}
      <div className="px-4 py-1 bg-muted/50 border-t">
        <div className="flex justify-between items-center font-medium">
          <span>Total Ingredients Cost:</span>
          <span className="text-lg font-semibold">{formatCurrency(totalIngredientsCost || 0)}</span>
        </div>
        <div className="flex justify-between items-center text-sm text-muted-foreground mt-1">
          <span>Profit Margin:</span>
          <span
            className={(() => {
              const priceValue = parseFloat(price || "0");
              const ingredientsCost = parseFloat(String(totalIngredientsCost || 0));
              const profit = priceValue - ingredientsCost;
              return profit >= 0 ? "text-green-600 font-medium" : "text-red-600 font-medium";
            })()}
          >
            {(() => {
              // Ensure we have valid numbers
              const priceValue = parseFloat(price || "0");
              const ingredientsCost = parseFloat(String(totalIngredientsCost || 0));

              // Calculate profit
              const profit = priceValue - ingredientsCost;
              const profitDisplay = formatCurrency(profit);

              // Calculate percentage
              let percentageDisplay = "0%";
              if (priceValue > 0) {
                const percentage = (profit / priceValue) * 100;
                percentageDisplay = `${formatNumber(isNaN(percentage) ? 0 : percentage)}%`;
              }
              return `${profitDisplay} (${percentageDisplay})`;
            })()}
          </span>
        </div>
      </div>
    </div>
  );
};

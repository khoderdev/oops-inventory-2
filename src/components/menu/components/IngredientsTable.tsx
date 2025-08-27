import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { useMenuItems } from "@/contexts/MenuItemsContext";
import { MenuItemIngredient } from "@/types/inventory";
import { IngredientsTableProps } from "@/types/menuItems";
import { SortingState, createColumnHelper, ColumnDef, useReactTable, getCoreRowModel, getSortedRowModel, flexRender } from "@tanstack/react-table";
import { useVirtualizer } from "@tanstack/react-virtual";
import { Trash2 } from "lucide-react";
import { useRef, useState, useMemo, useCallback } from "react";
import { getConversionFactor } from "@/utils/getConversionFactor";
import { Button } from "@/components/ui/button";

export const IngredientsTable: React.FC<IngredientsTableProps> = ({ ingredients = [], menuItem, formatNumber, formatCurrency, handleRemoveIngredient, totalIngredientsCost = 0, price = "0", sauces = [], calculateIngredientCost, materials }) => {
  const parentRef = useRef<HTMLDivElement>(null);
  const [sorting, setSorting] = useState<SortingState>([]);
  const columnHelper = createColumnHelper<MenuItemIngredient & { index: number }>();

  // Function to get item name (material or sauce)
  const getMaterialCostPerBaseUnit = useCallback(
    (materialId: string) => {
      if (!materialId) return 0;

      // Handle sauce case
      if (materialId.startsWith("sauce-")) {
        const sauceId = materialId.replace("sauce-", "");
        const sauce = sauces.find(s => String(s.id) === sauceId);
        return sauce ? parseFloat(String(sauce.costPerUnit || 0)) : 0;
      }

      // Handle material case
      const materialIdNum = materialId.startsWith("material-") ? materialId.replace("material-", "") : materialId;

      const material = materials.find(m => String(m.id) === String(materialIdNum) || `material-${m.id}` === materialId);

      return material ? parseFloat(String(material.costPerBaseUnit || 0)) : 0;
    },
    [materials, sauces]
  );

  // Function to get item name (material or sauce)
  const getItemName = useCallback(
    (materialId: string) => {
      if (!materialId) return "Unknown Item";

      // Handle sauce case
      if (materialId.startsWith("sauce-")) {
        const sauceId = materialId.replace("sauce-", "");
        const sauce = sauces.find(s => String(s.id) === sauceId);
        return sauce?.name || "Unknown Sauce";
      }

      // Handle material case - try multiple ID formats
      const materialIdNum = materialId.startsWith("material-") ? materialId.replace("material-", "") : materialId;

      // Try to find material with different ID formats
      const material = materials.find(
        m => String(m.id) === String(materialIdNum) || `material-${m.id}` === materialId || m.id === materialId // Add this line for direct ID matching
      );

      return material?.name || "Unknown Material";
    },
    [materials, sauces]
  );

  const DebugInfo = () => (
    <div className="p-2 bg-yellow-100 border border-yellow-300 text-xs">
      <h4>Debug Info:</h4>
      <p>Ingredients count: {ingredients.length}</p>
      <p>Materials count: {materials.length}</p>
      <p>Sauces count: {sauces.length}</p>
      <div>
        {ingredients.map((ing, idx) => (
          <div key={idx} className="mt-1">
            Ingredient {idx}: {ing.materialId}, Qty: {ing.quantity}, Unit: {ing.unit}
            <br />
            Material Found: {materials.some(m => String(m.id) === ing.materialId || `material-${m.id}` === ing.materialId).toString()}
          </div>
        ))}
      </div>
    </div>
  );

  // Function to get item type for display
  const getItemType = (materialId: string) => {
    return materialId.startsWith("sauce-") ? "Sauce" : "Material";
  };

  const columns = useMemo<ColumnDef<MenuItemIngredient & { index: number }>[]>(
    () => [
      // Item name column
      columnHelper.display({
        id: "item",
        header: "Item",
        cell: ({ row }) => {
          const itemName = getItemName(row.original.materialId);
          const itemType = getItemType(row.original.materialId);
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
      // Cost column - FIXED to use the same approach as working code
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

          // Use the same calculateIngredientCost function that's used for the total
          try {
            const cost = calculateIngredientCost(ingredient);
            return <div className="text-right font-medium">{formatCurrency(cost)}</div>;
          } catch (error) {
            return <div className="text-right text-red-500 text-xs">Calculation error</div>;
          }
        },
        size: 120
      }),
      // columnHelper.display({
      //   id: "cost",
      //   header: "Cost",
      //   cell: ({ row }) => {
      //     const ingredient = row.original;

      //     // First try to use stored cost if available
      //     const storedCost = menuItem?.ingredients?.find(i => i.materialId === ingredient.materialId)?.cost;
      //     if (storedCost !== undefined && storedCost !== null) {
      //       return <div className="text-right font-medium">{formatCurrency(storedCost)}</div>;
      //     }

      //     // Handle sauce cost calculation
      //     if (ingredient.materialId.startsWith("sauce-")) {
      //       const sauceId = ingredient.materialId.replace("sauce-", "");
      //       const sauce = sauces.find(s => String(s.id) === sauceId);

      //       if (!sauce) {
      //         return <div className="text-right text-red-500 text-xs">Sauce not found</div>;
      //       }

      //       if (!sauce.costPerUnit) {
      //         return <div className="text-right text-red-500 text-xs">No cost data</div>;
      //       }

      //       try {
      //         // For sauces, assume the unit matches and calculate directly
      //         const cost = ingredient.quantity * parseFloat(String(sauce.costPerUnit));
      //         return <div className="text-right font-medium">{formatCurrency(cost)}</div>;
      //       } catch (error) {
      //         return <div className="text-right text-red-500 text-xs">Calculation error</div>;
      //       }
      //     }

      //     // Handle material cost calculation - FIXED VERSION
      //     const materialId = ingredient.materialId.startsWith("material-") ? ingredient.materialId.replace("material-", "") : ingredient.materialId;

      //     const material = materials.find(m => String(m.id) === materialId);

      //     if (!material) {
      //       return <div className="text-right text-red-500 text-xs">Material not found</div>;
      //     }

      //     // Try multiple cost sources - FIXED
      //     let costPerBaseUnit = 0;

      //     // First try costPerBaseUnit directly
      //     if (material.costPerBaseUnit) {
      //       costPerBaseUnit = parseFloat(String(material.costPerBaseUnit));
      //     }
      //     // If not available, try to calculate from stock entries
      //     else if (material.stockEntries && material.stockEntries.length > 0) {
      //       // Calculate weighted average cost from stock entries
      //       let totalCost = 0;
      //       let totalQuantity = 0;

      //       for (const entry of material.stockEntries) {
      //         if (entry.costPerBaseUnit) {
      //           const quantity = entry.purchasedQuantity || 0;
      //           totalCost += parseFloat(String(entry.costPerBaseUnit)) * quantity;
      //           totalQuantity += quantity;
      //         }
      //       }

      //       if (totalQuantity > 0) {
      //         costPerBaseUnit = totalCost / totalQuantity;
      //       }
      //     }

      //     if (!costPerBaseUnit || costPerBaseUnit <= 0) {
      //       return <div className="text-right text-red-500 text-xs">No cost data</div>;
      //     }

      //     try {
      //       // Calculate cost with unit conversion
      //       let conversionFactor = 1;
      //       if (material.baseUnit !== ingredient.unit) {
      //         conversionFactor = getConversionFactor(
      //           ingredient.unit, // FIXED: source unit first
      //           material.baseUnit, // then target unit
      //           material.unitType || "piece",
      //           material
      //         );
      //       }

      //       const ingredientCost = costPerBaseUnit * ingredient.quantity * conversionFactor;
      //       return (
      //         <div className="text-right font-medium">
      //           <span className="text-foreground">{formatCurrency(ingredientCost)}</span>
      //         </div>
      //       );
      //     } catch (error) {
      //       console.error("Unit conversion error:", error);
      //       return <div className="text-right text-red-500 text-xs">Unit conversion error</div>;
      //     }
      //   },
      //   size: 120
      // }),

      // Actions column
      columnHelper.display({
        id: "actions",
        header: "",
        cell: ({ row }) => {
          const itemName = getItemName(row.original.materialId);
          return (
            <div className="text-right">
              <Button size="sm" variant="ghost" className="h-8 w-8 p-0 hover:bg-red-50 hover:text-red-600" onClick={() => handleRemoveIngredient(row.original.index)} aria-label={`Remove ${itemName}`}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          );
        },
        enableSorting: false,
        size: 60
      })
    ],
    [materials, menuItem, formatNumber, formatCurrency, handleRemoveIngredient, sauces, getMaterialCostPerBaseUnit]
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
      <DebugInfo />
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

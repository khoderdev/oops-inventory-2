import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { useMenuItems } from "@/contexts/MenuItemsContext";
import { MenuItemIngredient } from "@/types/inventory";
import { IngredientsTableProps } from "@/types/menuItems";
import { SortingState, createColumnHelper, ColumnDef, useReactTable, getCoreRowModel, getSortedRowModel, flexRender } from "@tanstack/react-table";
import { useVirtualizer } from "@tanstack/react-virtual";
import { Trash2 } from "lucide-react";
import { useRef, useState, useMemo } from "react";
import { Button } from "@/components/ui/button";

export const IngredientsTable: React.FC<IngredientsTableProps> = ({ ingredients = [], menuItem, calculateIngredientCost, formatNumber, formatCurrency, handleRemoveIngredient, totalIngredientsCost = 0, price = "0" }) => {
    const { materialsWithStock: materials } = useMenuItems();
    const parentRef = useRef<HTMLDivElement>(null);
    const [sorting, setSorting] = useState<SortingState>([]);
    const columnHelper = createColumnHelper<MenuItemIngredient & { index: number }>();

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
            const storedCost = menuItem?.ingredients?.find(i => i.materialId === row.original.materialId)?.cost;
            const ingredientCost = storedCost || calculateIngredientCost(row.original);
            return <div className="text-right font-medium">{ingredientCost > 0 ? <span className="text-foreground">{formatCurrency(ingredientCost)}</span> : <span className="text-red-500 text-xs">No cost data</span>}</div>;
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
                <Button size="sm" variant="ghost" className="h-8 w-8 p-0 hover:bg-red-50 hover:text-red-600" onClick={() => handleRemoveIngredient(row.original.index)} aria-label={`Remove ${material?.name || "ingredient"}`}>
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
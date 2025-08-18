import React, { useState, useMemo, useCallback } from "react";
import { MenuItem, Material, StockEntry, MenuItemCategory, Section } from "@/types/inventory";
import { Category } from "@/types/categories";
import { createColumnHelper, flexRender, getCoreRowModel, getSortedRowModel, useReactTable } from "@tanstack/react-table";
import { Card, CardHeader, CardTitle, CardContent } from "../ui/card";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../ui/table";
import { TooltipProvider, Tooltip, TooltipTrigger, TooltipContent } from "../ui/tooltip";
import { MenuItemForm } from "./MenuItemForm";
import { Plus, Search, Check, X, Square, CheckSquare } from "lucide-react";
import { toast } from "../ui/use-toast";
import { menuAPI, CreateBeverageVariantsRequest } from "@/api/menu.api.ts.tsx";

interface BeveragesMenuBuilderProps {
  stockEntries: StockEntry[];
  materials: Material[];
  menuItems: MenuItem[];
  categories: Category[];
  sections: Section[];
  onCreateMenuItem: (data: MenuItem) => void | Promise<void>;
  onUpdateMenuItem: (id: string, data: MenuItem) => void | Promise<void>;
  onDeleteMenuItem: (id: string) => void | Promise<void>;
}

const BeveragesMenuBuilder: React.FC<BeveragesMenuBuilderProps> = ({ stockEntries, materials, menuItems, categories, onCreateMenuItem, onUpdateMenuItem, onDeleteMenuItem }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<MenuItemCategory | "all">("all");
  const [showMenuItemForm, setShowMenuItemForm] = useState(false);
  const [editingMenuItem, setEditingMenuItem] = useState<MenuItem | null>(null);
  const [bulkSelectionMode, setBulkSelectionMode] = useState(false);
  const [selectedMenuItems, setSelectedMenuItems] = useState<Set<string>>(new Set());
  const [showVariantDialog, setShowVariantDialog] = useState(false);
  const [currentVariantItem, setCurrentVariantItem] = useState<MenuItem | null>(null);
  const [variantSizes, setVariantSizes] = useState<string[]>(["small", "medium", "large", "glass", "shot"]);
  const [selectedVariants, setSelectedVariants] = useState<string[]>(["small", "large"]);
  const [customVariant, setCustomVariant] = useState<string>("");
  const [variantPriceAdjustments, setVariantPriceAdjustments] = useState<Record<string, number>>({ small: 0.8, medium: 1.0, large: 1.2, glass: 0.9, shot: 0.5 });
  const [nameFormat, setNameFormat] = useState<"prefix" | "suffix">("suffix");

  const beverageCategories = useMemo(() => {
    return categories.filter(cat => ["beverages", "cold", "hot", "alcohol"].includes(cat.value.toLowerCase()));
  }, [categories]);

  const beverageMenuItems = useMemo(() => {
    return menuItems.filter(item => {
      const isBeverageCategory = (() => {
        if (typeof item.category === "string") {
          return ["cold", "hot", "alcohol", "beverages"].includes(item.category.toLowerCase());
        } else if (typeof item.category === "object" && item.category?.name) {
          return ["cold", "hot", "alcohol", "beverages"].includes(item.category.name.toLowerCase());
        } else if (typeof item.category === "number") {
          const categoryObj = categories.find(c => c.id === item.category);
          return categoryObj && ["cold", "hot", "alcohol", "beverages"].includes(categoryObj.value.toLowerCase());
        }
        return false;
      })();

      return isBeverageCategory;
    });
  }, [menuItems, categories]);

  const filteredMenuItems = useMemo(() => {
    return beverageMenuItems.filter(item => {
      const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) || (item.description && item.description.toLowerCase().includes(searchTerm.toLowerCase()));
      const matchesCategory =
        selectedCategory === "all" ||
        (() => {
          if (typeof item.category === "string") {
            return item.category === selectedCategory;
          } else if (typeof item.category === "object" && item.category?.name) {
            return item.category.name === selectedCategory;
          } else if (typeof item.category === "number") {
            const categoryObj = categories.find(c => c.id === item.category);
            return categoryObj?.value === selectedCategory;
          }
          return false;
        })();

      return matchesSearch && matchesCategory;
    });
  }, [beverageMenuItems, searchTerm, selectedCategory, categories]);

  const columnHelper = createColumnHelper<MenuItem>();

  const columns = useMemo(
    () => [
      columnHelper.display({
        id: "select",
        header: ({ table }) => <div className="flex items-center justify-center">{bulkSelectionMode && <input type="checkbox" checked={table.getIsAllRowsSelected()} onChange={table.getToggleAllRowsSelectedHandler()} className="h-4 w-4" />}</div>,
        cell: ({ row }) => <div className="flex items-center justify-center">{bulkSelectionMode && <input type="checkbox" checked={row.getIsSelected()} onChange={row.getToggleSelectedHandler()} className="h-4 w-4" />}</div>,
        size: 40
      }),
      columnHelper.accessor("name", {
        header: "Name",
        cell: info => <div className="font-medium">{info.getValue()}</div>,
        size: 200
      }),

      // Category column
      columnHelper.accessor(
        row => {
          if (typeof row.category === "string") {
            return row.category;
          } else if (typeof row.category === "object" && row.category?.name) {
            return row.category.name;
          } else if (typeof row.category === "number") {
            const categoryObj = categories.find(c => c.id === row.category);
            return categoryObj?.value || "Unknown";
          }
          return "Unknown";
        },
        {
          id: "category",
          header: "Category",
          cell: info => <div>{info.getValue()}</div>,
          size: 150
        }
      ),

      // Price column
      columnHelper.accessor("price", {
        header: "Price",
        cell: info => <div>${info.getValue().toFixed(2)}</div>,
        size: 100
      }),

      // Variants column
      columnHelper.display({
        id: "variants",
        header: "Variants",
        cell: ({ row }) => {
          const variants = beverageMenuItems.filter(item => item.name.includes(row.original.name) && item.id !== row.original.id);
          return (
            <div className="flex flex-wrap gap-1">
              {variants.length > 0 ? (
                variants.map(variant => (
                  <span key={variant.id} className="px-2 py-0.5 bg-blue-100 text-blue-800 rounded-full text-xs">
                    {variant.name.replace(row.original.name, "").trim()}
                  </span>
                ))
              ) : (
                <span className="text-gray-400 text-xs">No variants</span>
              )}
            </div>
          );
        },
        size: 150
      }),

      // Actions column
      columnHelper.display({
        id: "actions",
        header: "Actions",
        cell: ({ row }) => (
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={() => handleEditMenuItem(row.original)} className="h-8 w-8 p-0">
              <span className="sr-only">Edit</span>
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
              </svg>
            </Button>
            <Button variant="ghost" size="sm" onClick={() => handleCreateVariants(row.original)} className="h-8 w-8 p-0">
              <span className="sr-only">Create Variants</span>
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
                <path d="M8 3H5a2 2 0 0 0-2 2v3"></path>
                <path d="M21 8V5a2 2 0 0 0-2-2h-3"></path>
                <path d="M3 16v3a2 2 0 0 0 2 2h3"></path>
                <path d="M16 21h3a2 2 0 0 0 2-2v-3"></path>
              </svg>
            </Button>
            <Button variant="ghost" size="sm" onClick={() => handleDeleteMenuItem(row.original.id)} className="h-8 w-8 p-0 text-red-500">
              <span className="sr-only">Delete</span>
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
                <path d="M3 6h18"></path>
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"></path>
                <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
              </svg>
            </Button>
          </div>
        ),
        size: 120
      })
    ],
    [categories, beverageMenuItems, bulkSelectionMode]
  );

  // Set up table
  const table = useReactTable({
    data: filteredMenuItems,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    enableRowSelection: true,
    state: {
      rowSelection: Object.fromEntries(Array.from(selectedMenuItems).map(id => [filteredMenuItems.findIndex(item => item.id === id), true]))
    },
    onRowSelectionChange: updater => {
      const newSelection = typeof updater === "function" ? updater(Object.fromEntries(Array.from(selectedMenuItems).map(id => [filteredMenuItems.findIndex(item => item.id === id), true]))) : updater;

      const newSelectedMenuItems = new Set<string>();
      Object.entries(newSelection).forEach(([index, isSelected]) => {
        if (isSelected && filteredMenuItems[Number(index)]) {
          newSelectedMenuItems.add(filteredMenuItems[Number(index)].id);
        }
      });

      setSelectedMenuItems(newSelectedMenuItems);
    }
  });

  // Handlers
  const handleEditMenuItem = useCallback((menuItem: MenuItem) => {
    setEditingMenuItem(menuItem);
    setShowMenuItemForm(true);
  }, []);

  const handleAddMenuItem = useCallback(() => {
    setEditingMenuItem(null);
    setShowMenuItemForm(true);
  }, []);

  const handleCloseModal = useCallback(() => {
    setShowMenuItemForm(false);
    setEditingMenuItem(null);
  }, []);

  const handleDeleteMenuItem = useCallback(
    (id: string) => {
      if (confirm("Are you sure you want to delete this beverage menu item?")) {
        onDeleteMenuItem(id);
      }
    },
    [onDeleteMenuItem]
  );

  const handleCreateVariants = useCallback((menuItem: MenuItem) => {
    setCurrentVariantItem(menuItem);
    setShowVariantDialog(true);
  }, []);

  const handleAddCustomVariant = useCallback(() => {
    if (!customVariant || selectedVariants.includes(customVariant)) return;
    setVariantSizes(prev => [...prev, customVariant]);
    setSelectedVariants(prev => [...prev, customVariant]);
    setVariantPriceAdjustments(prev => ({
      ...prev,
      [customVariant]: 1.0
    }));
    setCustomVariant("");
  }, [customVariant, selectedVariants]);

  const handlePriceAdjustmentChange = useCallback((size: string, value: string) => {
    const numValue = parseFloat(value);
    if (isNaN(numValue) || numValue <= 0) return;

    setVariantPriceAdjustments(prev => ({
      ...prev,
      [size]: numValue
    }));
  }, []);

  const handleCreateMenuItemVariants = useCallback(
    async (sizes: string[]) => {
      if (!currentVariantItem) return;
      try {
        const variantRequest: CreateBeverageVariantsRequest = {
          baseMenuItem: currentVariantItem,
          selectedVariants: sizes,
          priceAdjustments: variantPriceAdjustments,
          nameFormat: nameFormat
        };
        const response = await menuAPI.createBeverageVariants(variantRequest);
        if (response.data && response.data.variants && response.data.variants.length > 0) {
          await onCreateMenuItem(response.data.variants[0]);
        }
        toast({
          title: "Success",
          description: `Created ${sizes.length} variants for ${currentVariantItem.name}`,
          variant: "default",
          duration: 1000
        });
      } catch (error) {
        console.error("Error creating variants:", error);
        toast({
          title: "Error",
          description: "Failed to create beverage variants",
          variant: "destructive",
          duration: 1000
        });
      }
    },
    [currentVariantItem, nameFormat, variantPriceAdjustments, onCreateMenuItem]
  );

  const handleToggleBulkSelection = useCallback(() => {
    setBulkSelectionMode(prev => !prev);
    if (bulkSelectionMode) {
      setSelectedMenuItems(new Set());
    }
  }, [bulkSelectionMode]);

  const handleSelectAllMenuItems = useCallback(() => {
    if (selectedMenuItems.size === filteredMenuItems.length) {
      setSelectedMenuItems(new Set());
    } else {
      setSelectedMenuItems(new Set(filteredMenuItems.map(item => item.id)));
    }
  }, [filteredMenuItems, selectedMenuItems]);

  return (
    <TooltipProvider delayDuration={100} skipDelayDuration={10}>
      <div className="flex flex-col h-[calc(100vh-8rem)] overflow-hidden">
        <Card className="!border-0 !shadow-none !bg-background flex flex-col h-full">
          <CardHeader className="flex-shrink-0 px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              <CardTitle className="text-2xl sm:text-3xl font-bold text-gray-900 flex-shrink-0">Beverages Menu</CardTitle>

              <div className="flex flex-col sm:flex-row gap-3 lg:gap-4 flex-1 lg:max-w-2xl">
                <div className="relative flex-1 min-w-0">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input type="search" placeholder="Search beverages..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="pl-10 h-10" />
                </div>
                <Select value={selectedCategory} onValueChange={value => setSelectedCategory(value as MenuItemCategory | "all")}>
                  <SelectTrigger className="w-full sm:w-[180px] lg:w-[200px] h-10">
                    <SelectValue placeholder="All Categories" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    {beverageCategories.map(category => (
                      <SelectItem key={category.value} value={category.value}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {(searchTerm || selectedCategory !== "all") && (
              <div className="mt-3 text-xs sm:text-sm text-muted-foreground px-1">
                Showing <span className="font-medium">{filteredMenuItems.length}</span> of <span className="font-medium">{beverageMenuItems.length}</span> beverage items
                {searchTerm && (
                  <span className="block sm:inline">
                    {" "}
                    matching <span className="font-medium">"{searchTerm}"</span>
                  </span>
                )}
                {selectedCategory !== "all" && (
                  <span className="block sm:inline">
                    {" "}
                    in <span className="font-medium">{beverageCategories.find(c => c.value === selectedCategory)?.name}</span>
                  </span>
                )}
              </div>
            )}
          </CardHeader>
          <CardContent className="flex-1 flex flex-col overflow-hidden p-3 sm:p-4 lg:p-6">
            <Dialog open={showMenuItemForm} onOpenChange={handleCloseModal} modal={true}>
              <DialogContent className="max-w-[95vw] sm:max-w-6xl max-h-[90vh] overflow-y-auto" onPointerDownOutside={e => e.preventDefault()} onInteractOutside={e => e.preventDefault()}>
                <DialogHeader>
                  <DialogTitle className="text-lg sm:text-xl">{editingMenuItem ? "Edit Beverage Item" : "Create New Beverage Item"}</DialogTitle>
                </DialogHeader>
                <MenuItemForm
                  menuItem={editingMenuItem}
                  materials={materials}
                  categories={beverageCategories}
                  onSubmit={
                    editingMenuItem
                      ? data => {
                          // Preserve required MenuItem properties from the original item
                          const updatedItem: MenuItem = {
                            ...data,
                            id: editingMenuItem.id,
                            createdAt: editingMenuItem.createdAt,
                            updatedAt: editingMenuItem.updatedAt
                          };
                          onUpdateMenuItem(editingMenuItem.id, updatedItem);
                          handleCloseModal();
                        }
                      : data => {
                          onCreateMenuItem(data as MenuItem);
                          handleCloseModal();
                        }
                  }
                  onCancel={handleCloseModal}
                  stockEntries={stockEntries}
                />
              </DialogContent>
            </Dialog>

            {/* Variant Creation Dialog */}
            <Dialog open={showVariantDialog} onOpenChange={setShowVariantDialog}>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Create Variants for {currentVariantItem?.name}</DialogTitle>
                </DialogHeader>
                <div className="space-y-6 py-4">
                  {/* Variant name format */}
                  <div className="space-y-2">
                    <p className="text-sm font-medium">Naming Format</p>
                    <div className="flex gap-4">
                      <label className="flex items-center space-x-2">
                        <input type="radio" checked={nameFormat === "prefix"} onChange={() => setNameFormat("prefix")} className="h-4 w-4" />
                        <span>Size First (e.g., Small Coffee)</span>
                      </label>
                      <label className="flex items-center space-x-2">
                        <input type="radio" checked={nameFormat === "suffix"} onChange={() => setNameFormat("suffix")} className="h-4 w-4" />
                        <span>Size Last (e.g., Coffee (Small))</span>
                      </label>
                    </div>
                  </div>

                  {/* Variant selection */}
                  <div className="space-y-2">
                    <p className="text-sm font-medium">Select Variants</p>
                    <div className="grid grid-cols-2 gap-2">
                      {variantSizes.map(size => (
                        <label key={size} className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            checked={selectedVariants.includes(size)}
                            onChange={() => {
                              // Toggle selection
                              setSelectedVariants(prev => (prev.includes(size) ? prev.filter(s => s !== size) : [...prev, size]));
                            }}
                            className="h-4 w-4"
                          />
                          <span className="capitalize">{size}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Add custom variant */}
                  <div className="space-y-2">
                    <p className="text-sm font-medium">Add Custom Variant</p>
                    <div className="flex gap-2">
                      <Input value={customVariant} onChange={e => setCustomVariant(e.target.value)} placeholder="Enter custom size (e.g., XL)" className="flex-1" />
                      <Button onClick={handleAddCustomVariant} type="button" size="sm">
                        Add
                      </Button>
                    </div>
                  </div>

                  {/* Price adjustments */}
                  <div className="space-y-2">
                    <p className="text-sm font-medium">Price Adjustments</p>
                    <p className="text-xs text-muted-foreground">Set price multipliers for each variant (e.g., 0.8 = 80% of base price)</p>
                    <div className="grid grid-cols-2 gap-3">
                      {selectedVariants.map(size => (
                        <div key={size} className="flex items-center gap-2">
                          <span className="capitalize w-16">{size}:</span>
                          <Input type="number" value={variantPriceAdjustments[size] || 1.0} onChange={e => handlePriceAdjustmentChange(size, e.target.value)} min="0.1" step="0.1" className="w-24" />
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Preview */}
                  {currentVariantItem && selectedVariants.length > 0 && (
                    <div className="space-y-2 border-t pt-4">
                      <p className="text-sm font-medium">Preview</p>
                      <div className="text-sm space-y-1">
                        {selectedVariants.map(size => {
                          const priceAdjustment = variantPriceAdjustments[size] || 1.0;
                          const variantName = nameFormat === "prefix" ? `${size} ${currentVariantItem.name}` : `${currentVariantItem.name} (${size})`;
                          const variantPrice = currentVariantItem.price * priceAdjustment;

                          return (
                            <div key={size} className="flex justify-between">
                              <span>{variantName}</span>
                              <span>${variantPrice.toFixed(2)}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  <div className="flex justify-end gap-2 pt-2">
                    <Button variant="outline" onClick={() => setShowVariantDialog(false)}>
                      Cancel
                    </Button>
                    <Button onClick={() => handleCreateMenuItemVariants(selectedVariants)} disabled={selectedVariants.length === 0}>
                      Create {selectedVariants.length} Variants
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>

            {/* Table */}
            <div className="flex-1 overflow-auto border rounded-md">
              <Table>
                <TableHeader>
                  {table.getHeaderGroups().map(headerGroup => (
                    <TableRow key={headerGroup.id}>
                      {headerGroup.headers.map(header => (
                        <TableHead key={header.id} style={{ width: header.getSize() }}>
                          {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                        </TableHead>
                      ))}
                    </TableRow>
                  ))}
                </TableHeader>
                <TableBody>
                  {table.getRowModel().rows.length > 0 ? (
                    table.getRowModel().rows.map(row => (
                      <TableRow key={row.id} data-state={row.getIsSelected() ? "selected" : undefined} className={row.getIsSelected() ? "bg-blue-50" : undefined}>
                        {row.getVisibleCells().map(cell => (
                          <TableCell key={cell.id} style={{ width: cell.column.getSize() }}>
                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                          </TableCell>
                        ))}
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={columns.length} className="h-24 text-center">
                        No beverage items found.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="fixed bottom-6 right-6 z-50">
        <div className="flex flex-col items-end gap-3">
          {bulkSelectionMode && (
            <div className="flex flex-col items-end gap-2 mb-2">
              <div className="flex flex-col gap-2">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button className="h-9 px-3 rounded-full bg-white/95 backdrop-blur-sm hover:bg-white text-gray-700 shadow-md hover:shadow-lg transition-all duration-200 hover:scale-105 text-xs font-medium border border-blue-500" onClick={handleSelectAllMenuItems} disabled={filteredMenuItems.length === 0}>
                      {selectedMenuItems.size === filteredMenuItems.length ? <CheckSquare className="h-3.5 w-3.5 mr-1.5" /> : <Square className="h-3.5 w-3.5 mr-1.5" />}
                      {selectedMenuItems.size === filteredMenuItems.length ? "Deselect All" : "Select All"}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{selectedMenuItems.size === filteredMenuItems.length ? "Deselect all beverage items" : "Select all visible beverage items"}</p>
                  </TooltipContent>
                </Tooltip>
              </div>
            </div>
          )}

          <div className="flex items-center gap-3">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button className={`h-14 w-14 rounded-full shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-110 ${bulkSelectionMode ? "bg-red-500 hover:bg-red-600 text-white" : "bg-white hover:bg-gray-50 text-gray-700 border-2 border-gray-200"}`} onClick={handleToggleBulkSelection} aria-label={bulkSelectionMode ? "Exit bulk selection" : "Enter bulk selection mode"}>
                  {bulkSelectionMode ? <X className="h-5 w-5" /> : <Check className="h-5 w-5" />}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>{bulkSelectionMode ? "Exit bulk selection" : "Enter bulk selection mode"}</p>
              </TooltipContent>
            </Tooltip>
          </div>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button className="h-14 w-14 rounded-full bg-primary hover:bg-teal-600 text-white shadow-xl hover:shadow-2xl transition-all duration-200 hover:scale-110 relative" onClick={handleAddMenuItem} aria-label="Add new beverage item">
                <Plus className="h-6 w-6" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Add new beverage item</p>
            </TooltipContent>
          </Tooltip>
        </div>
      </div>
    </TooltipProvider>
  );
};

export default BeveragesMenuBuilder;

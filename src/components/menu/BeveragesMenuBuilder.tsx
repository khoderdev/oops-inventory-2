import React, { useState, useMemo, useCallback } from "react";
import { MenuItem, MenuItemCategory } from "@/types/inventory";
import { createColumnHelper, flexRender, getCoreRowModel, getSortedRowModel, useReactTable } from "@tanstack/react-table";
import { Card, CardHeader, CardTitle, CardContent } from "../ui/card";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../ui/table";
import { TooltipProvider, Tooltip, TooltipTrigger, TooltipContent } from "../ui/tooltip";
import { BeverageItemForm } from "./BeverageItemForm";
import { Plus, Search, Check, X, Square, CheckSquare, Eye, Edit, Trash2 } from "lucide-react";
import { menuAPI } from "@/api/inventory.api";
import { toast } from "../ui/use-toast";
import { useInventoryStore } from "@/hooks/useInventoryStore";
import { formatCurrency } from "@/utils/conversionLogic";
import { BeveragesMenuBuilderProps } from "@/types/menuItems";

const BeveragesMenuBuilder: React.FC<BeveragesMenuBuilderProps> = ({ menuItems, categories, categoriesLoading, categoriesError, stockEntries, materials, onCreateBeverageItem, onUpdateBeverageItem, onDeleteBeverageItem }) => {
  const { fetchTabData } = useInventoryStore();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<MenuItemCategory | "all">("all");
  const [showBeverageItemForm, setShowBeverageItemForm] = useState(false);
  const [editingBeverageItem, setEditingBeverageItem] = useState<MenuItem | null>(null);
  const [bulkSelectionMode, setBulkSelectionMode] = useState(false);
  const [selectedBeverageItems, setSelectedBeverageItems] = useState<Set<string>>(new Set());
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedBeverageDetails, setSelectedBeverageDetails] = useState<MenuItem | null>(null);

  const beverageCategories = useMemo(() => {
    const converted = categories.map(cat => ({
      ...cat,
      id: String(cat.id)
    }));
    return converted;
  }, [categories]);

  // Filter menu items for beverages
  const beverageBeverageItems = useMemo(() => {
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

  const filteredBeverageItems = useMemo(() => {
    return beverageBeverageItems.filter(item => {
      const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) || (item.description && item.description.toLowerCase().includes(searchTerm.toLowerCase()));
      if (selectedCategory === "all") {
        return matchesSearch;
      }
      let categoryValue: string | undefined;
      if (typeof item.category === "string") {
        categoryValue = item.category;
      } else if (typeof item.category === "object" && item.category?.value !== undefined) {
        categoryValue = String(item.category.value);
      } else if (typeof item.category === "object" && item.category?.name) {
        const categoryName = item.category.name;
        const matchingCategory = categories.find(c => c.name.toLowerCase() === categoryName.toLowerCase());
        categoryValue = matchingCategory?.value;
      } else if (typeof item.category === "number") {
        const categoryObj = categories.find(c => c.id === item.category);
        categoryValue = categoryObj?.value;
      }
      return matchesSearch && categoryValue === selectedCategory;
    });
  }, [beverageBeverageItems, searchTerm, selectedCategory, categories]);

  const handleTogglePOSVisibility = useCallback(
    async (item: MenuItem) => {
      try {
        const newPOSStatus = !item.isPOSItem;
        const response = await menuAPI.updateMenuItem(item.id, {
          isPOSItem: newPOSStatus
        });
        if (!response) {
          throw new Error("Failed to update beverage item POS visibility");
        }
        toast({
          title: "Success",
          description: `${item.name} is now ${newPOSStatus ? "available in" : "hidden from"} POS`,
          variant: "default",
          duration: 1000
        });
        await fetchTabData("menu");
        if (onUpdateBeverageItem) {
          onUpdateBeverageItem(item.id, { ...item, isPOSItem: newPOSStatus });
        }
      } catch (error) {
        console.error("Error updating beverage item POS visibility:", error);
        toast({
          title: "Error",
          description: "Failed to update POS visibility",
          variant: "destructive",
          duration: 1000
        });
      }
    },
    [onUpdateBeverageItem, fetchTabData]
  );

  // Handlers
  const handleEditBeverageItem = useCallback((menuItem: MenuItem) => {
    setEditingBeverageItem(menuItem);
    setShowBeverageItemForm(true);
  }, []);

  const handleAddBeverageItem = useCallback(() => {
    setEditingBeverageItem(null);
    setShowBeverageItemForm(true);
  }, []);

  const handleCloseModal = useCallback(() => {
    setShowBeverageItemForm(false);
    setEditingBeverageItem(null);
  }, []);

  const handleDeleteBeverageItem = useCallback(
    (id: string) => {
      if (confirm("Are you sure you want to delete this beverage menu item?")) {
        onDeleteBeverageItem(id);
      }
    },
    [onDeleteBeverageItem]
  );

  const columnHelper = createColumnHelper<MenuItem>();

  const columns = useMemo(
    () => [
      columnHelper.display({
        id: "select",
        header: ({ table }) => <div className="flex items-center justify-center">{bulkSelectionMode && <input type="checkbox" checked={table.getIsAllRowsSelected()} onChange={table.getToggleAllRowsSelectedHandler()} className="h-4 w-4" />}</div>,
        cell: ({ row }) => <div className="flex items-center justify-center">{bulkSelectionMode && <input type="checkbox" checked={row.getIsSelected()} onChange={row.getToggleSelectedHandler()} className="h-4 w-4" />}</div>,
        size: 40
      }),
      columnHelper.accessor("image", {
        header: "Image",
        cell: info => (
          <div className="flex items-center">
            {info.getValue() ? (
              <img src={info.getValue()} alt="Beverage" className="w-16 h-20 object-contain rounded-md border border-gray-200" />
            ) : (
              <div className="w-14 h-14 bg-gray-100 rounded-md border border-gray-200 flex items-center justify-center">
                <span className="text-gray-400 text-xs">No Image</span>
              </div>
            )}
          </div>
        ),
        size: 80
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
        cell: info => <div>{formatCurrency(info.getValue())}</div>,
        size: 100
      }),

      // Actions column
      columnHelper.display({
        id: "actions",
        header: "Actions",
        cell: ({ row }) => (
          <div className="flex items-center gap-2">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  size="sm"
                  variant={row.original.isPOSItem ? "default" : "outline"}
                  className={row.original.isPOSItem ? "bg-teal-600 hover:bg-teal-700 text-white" : ""}
                  onClick={e => {
                    e.stopPropagation();
                    handleTogglePOSVisibility(row.original);
                  }}
                  aria-label={`${row.original.isPOSItem ? "Hide from" : "Show in"} POS`}
                >
                  <Eye className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>{row.original.isPOSItem ? "Hide from POS" : "Show in POS"}</p>
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={e => {
                    e.stopPropagation();
                    handleEditBeverageItem(row.original);
                  }}
                  className="h-8 w-8 p-0"
                >
                  <Edit className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Edit {row.original.name}</p>
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={e => {
                    e.stopPropagation();
                    handleDeleteBeverageItem(row.original.id);
                  }}
                  className="h-8 w-8 p-0 hover:bg-red-50 hover:text-red-600"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Delete {row.original.name}</p>
              </TooltipContent>
            </Tooltip>
          </div>
        ),
        size: 120
      })
    ],
    [categories, handleTogglePOSVisibility, handleEditBeverageItem, handleDeleteBeverageItem]
  );

  // Set up table
  const table = useReactTable({
    data: filteredBeverageItems,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    enableRowSelection: true,
    state: {
      rowSelection: Object.fromEntries(Array.from(selectedBeverageItems).map(id => [filteredBeverageItems.findIndex(item => item.id === id), true]))
    },
    onRowSelectionChange: updater => {
      const newSelection = typeof updater === "function" ? updater(Object.fromEntries(Array.from(selectedBeverageItems).map(id => [filteredBeverageItems.findIndex(item => item.id === id), true]))) : updater;

      const newSelectedBeverageItems = new Set<string>();
      Object.entries(newSelection).forEach(([index, isSelected]) => {
        if (isSelected && filteredBeverageItems[Number(index)]) {
          newSelectedBeverageItems.add(filteredBeverageItems[Number(index)].id);
        }
      });

      setSelectedBeverageItems(newSelectedBeverageItems);
    }
  });

  const handleShowDetails = useCallback((menuItem: MenuItem) => {
    setSelectedBeverageDetails(menuItem);
    setShowDetailsModal(true);
  }, []);

  const handleCloseDetailsModal = useCallback(() => {
    setShowDetailsModal(false);
    setSelectedBeverageDetails(null);
  }, []);

  const handleSelectAllBeverageItems = useCallback(() => {
    if (selectedBeverageItems.size === filteredBeverageItems.length) {
      setSelectedBeverageItems(new Set());
    } else {
      setSelectedBeverageItems(new Set(filteredBeverageItems.map(item => item.id)));
    }
  }, [filteredBeverageItems, selectedBeverageItems]);

  const handleToggleBulkSelection = useCallback(() => {
    setBulkSelectionMode(prev => !prev);
    if (bulkSelectionMode) {
      setSelectedBeverageItems(new Set());
    }
  }, [bulkSelectionMode]);

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
                      <SelectItem key={`${category.id}-${category.value}`} value={category.value}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {(searchTerm || selectedCategory !== "all") && (
              <div className="mt-3 text-xs sm:text-sm text-muted-foreground px-1">
                Showing <span className="font-medium">{filteredBeverageItems.length}</span> of <span className="font-medium">{beverageBeverageItems.length}</span> beverage items
                {searchTerm && (
                  <span className="block sm:inline">
                    {" "}
                    matching <span className="font-medium">"{searchTerm}"</span>
                  </span>
                )}
                {selectedCategory !== "all" && (
                  <span className="block sm:inline">
                    {" "}
                    in <span className="font-medium">{categories.find(c => c.value === selectedCategory)?.name}</span>
                  </span>
                )}
              </div>
            )}
          </CardHeader>
          <CardContent className="flex-1 flex flex-col overflow-hidden p-3 sm:p-4 lg:p-6">
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
                    <TableRow key={row.id} data-state={row.getIsSelected() ? "selected" : undefined} className={`${row.getIsSelected() ? "bg-blue-50" : ""} cursor-pointer hover:bg-gray-50`} onClick={() => handleShowDetails(row.original)}>
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

            {/* Beverage Item Form Dialog */}
            <Dialog open={showBeverageItemForm} onOpenChange={handleCloseModal} modal={true}>
              <DialogContent className="max-w-[95vw] sm:max-w-6xl max-h-[95vh] overflow-y-auto" onPointerDownOutside={e => e.preventDefault()} onInteractOutside={e => e.preventDefault()}>
                <DialogHeader>
                  <DialogTitle className="text-lg sm:text-xl">{editingBeverageItem ? "Edit Beverage Item" : "Create New Beverage Item"}</DialogTitle>
                </DialogHeader>
                <BeverageItemForm
                  menuItem={editingBeverageItem}
                  categories={beverageCategories}
                  materials={materials}
                  stockEntries={stockEntries}
                  onSubmit={
                    editingBeverageItem
                      ? data => {
                          onUpdateBeverageItem(editingBeverageItem.id, data);
                          handleCloseModal();
                        }
                      : data => {
                          onCreateBeverageItem(data);
                          handleCloseModal();
                        }
                  }
                  onCancel={handleCloseModal}
                  enableVariants={true}
                />
              </DialogContent>
            </Dialog>

            {/* Beverage Details Modal */}
            <Dialog open={showDetailsModal} onOpenChange={setShowDetailsModal}>
              <DialogContent className="max-w-[95vw] sm:max-w-3xl max-h-[95vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle className="text-lg sm:text-xl">{selectedBeverageDetails?.name || "Beverage Details"}</DialogTitle>
                </DialogHeader>
                {selectedBeverageDetails && (
                  <div className="grid gap-6 py-4">
                    <div className="flex items-start gap-6">
                      {selectedBeverageDetails.image ? (
                        <img src={selectedBeverageDetails.image} alt={selectedBeverageDetails.name} className="w-32 h-32 object-cover rounded-md border" />
                      ) : (
                        <div className="w-32 h-32 bg-gray-100 rounded-md border flex items-center justify-center">
                          <span className="text-gray-400">No Image</span>
                        </div>
                      )}
                      <div className="flex-1">
                        <h3 className="text-xl font-semibold">{selectedBeverageDetails.name}</h3>
                        <div className="mt-2 grid grid-cols-2 gap-x-6 gap-y-2">
                          <div>
                            <span className="text-sm text-gray-500">Category</span>
                            <p className="font-medium">{typeof selectedBeverageDetails.category === "object" && selectedBeverageDetails.category?.name ? selectedBeverageDetails.category.name : typeof selectedBeverageDetails.category === "string" ? selectedBeverageDetails.category : "Uncategorized"}</p>
                          </div>
                          <div>
                            <span className="text-sm text-gray-500">Price</span>
                            <p className="font-medium">{formatCurrency(selectedBeverageDetails.price)}</p>
                          </div>
                          <div>
                            <span className="text-sm text-gray-500">POS Status</span>
                            <p className="font-medium flex items-center gap-1">
                              {selectedBeverageDetails.isPOSItem ? (
                                <>
                                  <span className="inline-block w-2 h-2 rounded-full bg-green-500"></span>
                                  Visible in POS
                                </>
                              ) : (
                                <>
                                  <span className="inline-block w-2 h-2 rounded-full bg-gray-300"></span>
                                  Hidden from POS
                                </>
                              )}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {selectedBeverageDetails.description && (
                      <div>
                        <h4 className="font-medium mb-1">Description</h4>
                        <p className="text-gray-700">{selectedBeverageDetails.description}</p>
                      </div>
                    )}

                    {selectedBeverageDetails.variants && Array.isArray(selectedBeverageDetails.variants) && selectedBeverageDetails.variants.length > 0 && (
                      <div>
                        <h4 className="font-medium mb-2">Variants</h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {selectedBeverageDetails.variants.map(variant => (
                            <div key={variant.id} className="border rounded-md p-3">
                              <div className="flex justify-between items-center">
                                <span className="font-medium">{variant.name}</span>
                                <span className="text-sm font-semibold">{formatCurrency(Number(variant.price))}</span>
                              </div>
                              <div className="text-sm text-gray-500 mt-1">
                                {variant.volume} {variant.unit}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {selectedBeverageDetails.beverageStockId && (
                      <div>
                        <h4 className="font-medium mb-1">Inventory Information</h4>
                        <div className="grid grid-cols-2 gap-x-6 gap-y-2">
                          <div>
                            <span className="text-sm text-gray-500">Stock ID</span>
                            <p className="font-medium">{selectedBeverageDetails.beverageStockId}</p>
                          </div>
                          {selectedBeverageDetails.availableQuantity !== undefined && (
                            <div>
                              <span className="text-sm text-gray-500">Available Quantity</span>
                              <p className="font-medium">
                                {selectedBeverageDetails.availableQuantity} {selectedBeverageDetails.unit || "units"}
                              </p>
                            </div>
                          )}
                          {selectedBeverageDetails.costPerUnit !== undefined && (
                            <div>
                              <span className="text-sm text-gray-500">Cost Per Unit</span>
                              <p className="font-medium">{formatCurrency(selectedBeverageDetails.costPerUnit)}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    <div className="flex justify-end gap-3 mt-4">
                      <Button variant="outline" onClick={handleCloseDetailsModal}>
                        Close
                      </Button>
                      <Button
                        onClick={() => {
                          handleCloseDetailsModal();
                          handleEditBeverageItem(selectedBeverageDetails);
                        }}
                      >
                        Edit
                      </Button>
                    </div>
                  </div>
                )}
              </DialogContent>
            </Dialog>
          </CardContent>
        </Card>

        <div className="fixed bottom-6 right-6 z-50">
          <div className="flex flex-col items-end gap-3">
            {bulkSelectionMode && (
              <div className="flex flex-col items-end gap-2 mb-2">
                <div className="flex flex-col gap-2">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button className="h-9 px-3 rounded-full bg-white/95 backdrop-blur-sm hover:bg-white text-gray-700 shadow-md hover:shadow-lg transition-all duration-200 hover:scale-105 text-xs font-medium border border-blue-500" onClick={handleSelectAllBeverageItems} disabled={filteredBeverageItems.length === 0}>
                        {selectedBeverageItems.size === filteredBeverageItems.length ? <CheckSquare className="h-3.5 w-3.5 mr-1.5" /> : <Square className="h-3.5 w-3.5 mr-1.5" />}
                        {selectedBeverageItems.size === filteredBeverageItems.length ? "Deselect All" : "Select All"}
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>{selectedBeverageItems.size === filteredBeverageItems.length ? "Deselect all beverage items" : "Select all visible beverage items"}</p>
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
                <Button className="h-14 w-14 rounded-full bg-primary hover:bg-teal-600 text-white shadow-xl hover:shadow-2xl transition-all duration-200 hover:scale-110 relative" onClick={handleAddBeverageItem} aria-label="Add new beverage item">
                  <Plus className="h-6 w-6" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Add new beverage item</p>
              </TooltipContent>
            </Tooltip>
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
};

export default BeveragesMenuBuilder;

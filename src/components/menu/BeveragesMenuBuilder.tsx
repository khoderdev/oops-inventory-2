import React, { useState, useMemo, useCallback, useEffect } from "react";
import { MenuItem, MenuItemCategory, StockEntry } from "@/types/inventory";
import { flexRender, getCoreRowModel, getSortedRowModel, useReactTable } from "@tanstack/react-table";
import { Card, CardHeader, CardTitle, CardContent } from "../ui/card";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../ui/table";
import { TooltipProvider, Tooltip, TooltipTrigger, TooltipContent } from "../ui/tooltip";
import { Plus, Search, Check, X, Square, CheckSquare } from "lucide-react";
import { menuAPI, materialsAPI, stockAPI } from "@/api/inventory.api";
import { Material } from "@/types/inventory";
import { toast } from "../ui/use-toast";
import { useInventoryStore } from "@/hooks/useInventoryStore";
import { BeveragesMenuBuilderProps } from "@/types/menuItems";
import { BeverageItemFormDialog, BeverageDetailsDialog } from "./components/BeveragesMenuDialogs";
import { useBeveragesMenuColumns } from "./components/BeveragesMenuColumns";

const BeveragesMenuBuilder: React.FC<BeveragesMenuBuilderProps> = ({ menuItems, categories, onCreateBeverageItem, onUpdateBeverageItem, onDeleteBeverageItem }) => {
  const { fetchTabData } = useInventoryStore();
  const [stockEntries, setStockEntries] = useState<StockEntry[]>([]);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<MenuItemCategory | "all">("all");
  const [showBeverageItemForm, setShowBeverageItemForm] = useState(false);
  const [editingBeverageItem, setEditingBeverageItem] = useState<MenuItem | null>(null);
  const [bulkSelectionMode, setBulkSelectionMode] = useState(false);
  const [selectedBeverageItems, setSelectedBeverageItems] = useState<Set<string>>(new Set());
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedBeverageDetails, setSelectedBeverageDetails] = useState<MenuItem | null>(null);

  // Fetch materials and stock entries on component mount
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        // Fetch materials
        const materialsData = await materialsAPI.getMaterials();
        setMaterials(materialsData);

        // Fetch stock entries
        const stockData = await stockAPI.getStockEntries({
          limit: 1000,
          includeMaterial: "true"
        });
        setStockEntries(stockData);
      } catch (error) {
        console.error('Error fetching data:', error);
        toast({
          title: "Error",
          description: "Failed to load required data",
          variant: "destructive",
          duration: 1000
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  const beverageCategories = useMemo(() => {
    const converted = categories.map(cat => ({
      ...cat,
      id: String(cat.id)
    }));
    return converted;
  }, [categories]);

  // Use the menuItems directly as they are already filtered by the backend API
  const beverageBeverageItems = useMemo(() => {
    return menuItems;
  }, [menuItems]);

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
    // Create a deep copy of the menu item to avoid reference issues
    const menuItemCopy = JSON.parse(JSON.stringify(menuItem));
    // Ensure the category is properly set
    if (menuItemCopy.category) {
      // If category is a string, try to find the full category object
      if (typeof menuItemCopy.category === 'string') {
        const categoryObj = categories.find(cat => cat.id === menuItemCopy.category || cat.name === menuItemCopy.category);
        if (categoryObj) {
          menuItemCopy.category = categoryObj;
        }
      }
    }
    
    setEditingBeverageItem(menuItemCopy);
    setShowBeverageItemForm(true);
  }, [categories]);

  const handleAddBeverageItem = useCallback(() => {
    setEditingBeverageItem(null);
    setShowBeverageItemForm(true);
  }, []);

  const handleCloseModal = useCallback(() => {
    setShowBeverageItemForm(false);
    setEditingBeverageItem(null);
  }, []);

  const handleUpdateBeverageItem = useCallback(
    async (id: string, data: any) => {
      try {
        // Ensure categoryId is included in the update data
        let categoryId = data.categoryId;
        
        if (!categoryId && editingBeverageItem?.category) {
          const category = editingBeverageItem.category;
          if (typeof category === 'object' && category !== null) {
            categoryId = (category as any)?.id || (category as any)?._id;
          } else {
            categoryId = category;
          }
        }
        
        const updateData = {
          ...data,
          categoryId: categoryId
        };
        await onUpdateBeverageItem(id, updateData);
        toast({
          title: "Success",
          description: "Beverage item updated successfully",
          variant: "default",
          duration: 1000
        });
        handleCloseModal();
      } catch (error) {
        console.error("Error updating beverage item:", error);
        toast({
          title: "Error",
          description: error instanceof Error ? error.message : "Failed to update beverage item",
          variant: "destructive",
          duration: 1000
        });
      }
    },
    [onUpdateBeverageItem, editingBeverageItem, handleCloseModal]
  );

  const handleDeleteBeverageItem = useCallback(
    (id: string) => {
      if (confirm("Are you sure you want to delete this beverage menu item?")) {
        onDeleteBeverageItem(id);
      }
    },
    [onDeleteBeverageItem]
  );

  // Use the extracted columns component
  const { columns } = useBeveragesMenuColumns({
    categories,
    bulkSelectionMode,
    handleTogglePOSVisibility,
    handleEditBeverageItem,
    handleDeleteBeverageItem
  });

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
            <BeverageItemFormDialog
              key={editingBeverageItem?.id || 'new'}
              open={showBeverageItemForm}
              onOpenChange={(isOpen) => {
                if (!isOpen) handleCloseModal();
              }}
              editingBeverageItem={editingBeverageItem}
              categories={beverageCategories}
              stockEntries={stockEntries}
              materials={materials}
              onSubmit={
                editingBeverageItem
                  ? (data) => handleUpdateBeverageItem(editingBeverageItem.id, data)
                  : (data) => {
                      onCreateBeverageItem(data);
                      handleCloseModal();
                    }
              }
              onCancel={handleCloseModal}
            />

            {/* Beverage Details Modal */}
            <BeverageDetailsDialog
              open={showDetailsModal}
              onOpenChange={setShowDetailsModal}
              selectedBeverageDetails={selectedBeverageDetails}
              onClose={handleCloseDetailsModal}
              onEdit={menuItem => {
                handleCloseDetailsModal();
                handleEditBeverageItem(menuItem);
              }}
            />
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

import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/components/ui/use-toast";
import { MenuItem, MenuItemBuilderProps, MenuItemCategory, MenuItemIngredient } from "@/types/inventory";
import { dataValidator, ValidationResult } from "@/utils/dataValidation";
import { Check, Plus, Printer, Tag, AlertTriangle, CheckCircle, X, CheckSquare, Square } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useState, useMemo, useCallback, useEffect } from "react";
import { useMediaQuery } from "@/hooks/use-media-query";
import { getCoreRowModel, getFilteredRowModel, getSortedRowModel, useReactTable, SortingState, ColumnFiltersState, VisibilityState } from "@tanstack/react-table";
import useMenuItemColumns from "./components/MenuItemColumns";
import MenuBuilderLayout from "./components/MenuBuilderLayout";
import { useAtom } from "jotai";
import { dataValidationEnabledAtom } from "@/store/settingsStore";
import { PrinterAssignmentDialog } from "@/components/inventory/PrinterAssignmentDialog";
import { BulkPrinterAssignmentDialog } from "@/components/inventory/BulkPrinterAssignmentDialog";
import { menuAPI } from "@/api/menu.api.ts";
import { useMenuItems } from "@/contexts/MenuItemsContext";

export const MenuItemBuilder: React.FC<MenuItemBuilderProps> = ({ categories: propCategories, onCreateMenuItem: propCreateMenuItem, onUpdateMenuItem: propUpdateMenuItem, onDeleteMenuItem: propDeleteMenuItem }) => {
  const { foodMenuItems, menuItemCategories, handleCreateMenuItem, handleUpdateMenuItem, handleDeleteMenuItem } = useMenuItems();
  const currentMenuItems = foodMenuItems;
  const [dataValidationEnabled] = useAtom(dataValidationEnabledAtom);
  const categories = menuItemCategories.length > 0 ? menuItemCategories : propCategories || [];
  const [validationResults, setValidationResults] = useState<ValidationResult | null>(null);
  const [showValidationPanel, setShowValidationPanel] = useState(false);
  const [lastValidationTime, setLastValidationTime] = useState<number>(0);
  const [searchTerm, setSearchTerm] = useState("");
  const [showMenuItemForm, setShowMenuItemForm] = useState(false);
  const [editingMenuItem, setEditingMenuItem] = useState<MenuItem | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<MenuItemCategory | "all">("all");
  const [showPrinterDialog, setShowPrinterDialog] = useState(false);
  const [selectedMenuItemForPrinter, setSelectedMenuItemForPrinter] = useState<MenuItem | null>(null);
  const [bulkSelectionMode, setBulkSelectionMode] = useState(false);
  const [selectedMenuItems, setSelectedMenuItems] = useState<Set<string>>(new Set());
  const [showBulkPrinterDialog, setShowBulkPrinterDialog] = useState(false);
  const [showBulkCategoryDialog, setShowBulkCategoryDialog] = useState(false);
  const [bulkCategoryValue, setBulkCategoryValue] = useState<MenuItemCategory | "">("");
  const handleBulkCategoryChange = (value: string) => setBulkCategoryValue(value as MenuItemCategory | "");
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});

  useEffect(() => {
    const validateData = async () => {
      if (!dataValidationEnabled) {
        setValidationResults(null);
        return;
      }
      const now = Date.now();
      if (now - lastValidationTime < 30000) return;
      try {
        const result = dataValidator.validateData(currentMenuItems);
        setValidationResults(result);
        setLastValidationTime(now);
        if (!result.isValid || result.summary.warnings > 0) {
          dataValidator.showValidationResults(result, "Menu Builder Data Validation");
        }
      } catch (error) {
        console.error("Validation error:", error);
      }
    };
    validateData();
  }, [lastValidationTime, dataValidationEnabled]);

  const runValidation = useCallback(() => {
    if (!dataValidationEnabled) {
      toast({
        title: "Validation Disabled",
        description: "Data validation is disabled. Enable it in System Settings to run validation.",
        variant: "destructive",
        duration: 1000
      });
      return;
    }
    const result = dataValidator.validateData(currentMenuItems);
    setValidationResults(result);
    setLastValidationTime(Date.now());
    dataValidator.showValidationResults(result, "Manual Data Validation");
    setShowValidationPanel(true);
  }, [dataValidationEnabled]);

  const calculateMenuItemCost = useCallback((ingredients: MenuItemIngredient[]) => {
    if (!ingredients || !Array.isArray(ingredients)) {
      return 0;
    }
    return 0;
  }, []);

  const handleDeleteMenuItemLocal = useCallback(
    async (id: string) => {
      const idStr = String(id).trim();
      const isNumeric = /^\d+$/.test(idStr);
      console.log("🗑️ [MenuBuilder] Delete requested", { id, idStr, isNumeric });
      if (!isNumeric) {
        const message = idStr.startsWith("menu-")
          ? "Cannot delete unsaved menu item. Please save it first."
          : `Invalid menu item ID: ${idStr}`;
        toast({
          title: "Invalid ID",
          description: message,
          variant: "destructive",
          duration: 2000
        });
        return;
      }
      try {
        if (handleDeleteMenuItem) {
          await handleDeleteMenuItem(idStr);
        } else if (propDeleteMenuItem) {
          // Assume external handler performs deletion and refresh
          await propDeleteMenuItem(idStr);
        } else {
          await menuAPI.deleteMenuItem(idStr);
        }
        toast({
          title: "Success",
          description: "Menu item deleted successfully",
          variant: "default",
          duration: 1000
        });
      } catch (error: any) {
        console.error("❌ [MenuBuilder] Error deleting menu item:", error);
        const backendMsg =
          error?.message ||
          error?.data?.message ||
          error?.response?.data?.message ||
          "Failed to delete menu item";
        toast({
          title: "Error",
          description: backendMsg,
          variant: "destructive",
          duration: 1500
        });
      }
    },
    [handleDeleteMenuItem, propDeleteMenuItem]
  );

  const handleTogglePOSVisibility = useCallback(
    async (item: MenuItem) => {
      try {
        const newPOSStatus = !item.isPOSItem;
        const updatedItem = { ...item, isPOSItem: newPOSStatus };
        if (handleUpdateMenuItem) {
          await handleUpdateMenuItem(item.id, updatedItem);
        } else if (propUpdateMenuItem) {
          await menuAPI.updateMenuItem(item.id, updatedItem);
          await propUpdateMenuItem(item.id, updatedItem);
        } else {
          await menuAPI.updateMenuItem(item.id, updatedItem);
        }
        toast({
          title: `Menu item ${newPOSStatus ? "added to" : "removed from"} POS`,
          description: `${item.name} is now ${newPOSStatus ? "visible" : "hidden"} in POS`,
          variant: "default",
          duration: 1000
        });
      } catch (error) {
        console.error("Error toggling POS visibility:", error);
        toast({
          title: "Error",
          description: "Failed to update POS visibility",
          variant: "destructive",
          duration: 1000
        });
      }
    },
    [handleUpdateMenuItem, propUpdateMenuItem]
  );

  const handleOpenPrinterDialog = useCallback((menuItem: MenuItem) => {
    setSelectedMenuItemForPrinter(menuItem);
    setShowPrinterDialog(true);
  }, []);

  const handleAddMenuItem = useCallback(
    async (data: Omit<MenuItem, "id" | "createdAt" | "updatedAt" | "ingredients"> & { ingredients: MenuItemIngredient[] }) => {
      try {
        const ingredientsWithCosts = data.ingredients;
        const menuItemToCreate: MenuItem = {
          id: `menu-${Date.now()}`,
          ...data,
          ingredients: ingredientsWithCosts,
          createdAt: new Date(),
          updatedAt: new Date()
        };
        if (handleCreateMenuItem) {
          await handleCreateMenuItem(menuItemToCreate);
        } else if (propCreateMenuItem) {
          const createdMenuItem = await menuAPI.createMenuItem(menuItemToCreate);
          await propCreateMenuItem(createdMenuItem.data);
        } else {
          await menuAPI.createMenuItem(menuItemToCreate);
        }
        setShowMenuItemForm(false);
        setEditingMenuItem(null);
        toast({
          title: "Success",
          description: "Menu item created successfully",
          variant: "default",
          duration: 1000
        });
      } catch (error) {
        console.error("Error creating menu item:", error);
        toast({
          title: "Error",
          description: "Failed to create menu item",
          variant: "destructive",
          duration: 1000
        });
      }
    },
    [handleCreateMenuItem, propCreateMenuItem]
  );

  const handleUpdateMenuItemLocal = useCallback(
    async (data: Omit<MenuItem, "id" | "createdAt" | "updatedAt" | "ingredients"> & { ingredients: MenuItemIngredient[] }) => {
      if (!editingMenuItem) {
        console.error("editingMenuItem not provided");
        return;
      }
      try {
        const ingredientsWithCosts = data.ingredients;
        const updatedMenuItem: MenuItem = {
          ...editingMenuItem,
          ...data,
          ingredients: ingredientsWithCosts,
          updatedAt: new Date()
        };
        if (handleUpdateMenuItem) {
          await handleUpdateMenuItem(editingMenuItem.id, updatedMenuItem);
        } else if (propUpdateMenuItem) {
          await menuAPI.updateMenuItem(editingMenuItem.id, updatedMenuItem);
          await propUpdateMenuItem(editingMenuItem.id, updatedMenuItem);
        } else {
          await menuAPI.updateMenuItem(editingMenuItem.id, updatedMenuItem);
        }
        setShowMenuItemForm(false);
        setEditingMenuItem(null);
        toast({
          title: "Success",
          description: "Menu item updated successfully",
          variant: "default",
          duration: 1000
        });
      } catch (error) {
        console.error("Error updating menu item:", error);
        setShowMenuItemForm(false);
        setEditingMenuItem(null);
        toast({
          title: "Error",
          description: "Failed to update menu item",
          variant: "destructive",
          duration: 1000
        });
      }
    },
    [editingMenuItem, handleUpdateMenuItem, propUpdateMenuItem]
  );

  const columns = useMenuItemColumns({
    searchTerm,
    categories,
    calculateMenuItemCost,
    handleTogglePOSVisibility,
    handleOpenPrinterDialog,
    handleDeleteMenuItem: handleDeleteMenuItemLocal,
    setEditingMenuItem,
    setShowMenuItemForm
  });

  const filteredMenuItems = useMemo(() => {
    return currentMenuItems.filter(item => {
      if (item.isBeverage) return false;
      const searchLower = searchTerm.toLowerCase();
      const matchesNameOrDescription = item.name.toLowerCase().includes(searchLower) || (item.description?.toLowerCase() || "").includes(searchLower);
      const matchesIngredients = (() => {
        if (item.ingredients && Array.isArray(item.ingredients)) {
          return item.ingredients.some(ingredient => {
            const materialName = String(ingredient.materialId);
            return materialName.toLowerCase().includes(searchLower);
          });
        }
        if (item.menuItemIngredients && Array.isArray(item.menuItemIngredients)) {
          return item.menuItemIngredients.some(ingredient => {
            const materialName = String(ingredient.materialId);
            return materialName.toLowerCase().includes(searchLower);
          });
        }
        return false;
      })();

      const matchesSearch = matchesNameOrDescription || matchesIngredients;
      const matchesCategory =
        selectedCategory === "all" ||
        (() => {
          if (typeof item.category === "string") {
            if (item.category === selectedCategory) return true;
            const categoryObj = categories.find(c => c.value === item.category) || categories.find(c => c.name?.toLowerCase() === (typeof item.category === "string" ? item.category.toLowerCase() : String(item.category).toLowerCase()));
            return categoryObj?.value === selectedCategory;
          } else if (typeof item.category === "object" && item.category !== null && "name" in item.category) {
            const categoryObj = categories.find(c => c.name === (item.category as { name: string }).name);
            const result = categoryObj?.value === selectedCategory;
            return result;
          } else if (typeof item.category === "number") {
            const categoryObj = categories.find(c => c.id === item.category);
            const result = categoryObj?.value === selectedCategory;
            return result;
          }
          return false;
        })();
      return matchesSearch && matchesCategory;
    });
  }, [currentMenuItems, searchTerm, selectedCategory, categories]);

  const tableOptions = useMemo(() => {
    return {
      data: filteredMenuItems,
      columns: bulkSelectionMode ? columns : columns.filter(col => col.id !== "select"),
      state: {
        sorting,
        columnFilters,
        columnVisibility,
        rowSelection: Object.fromEntries(Array.from(selectedMenuItems).map(id => [filteredMenuItems.findIndex(item => item.id === id), true]))
      },
      enableRowSelection: bulkSelectionMode,
      onSortingChange: setSorting,
      onColumnFiltersChange: setColumnFilters,
      onColumnVisibilityChange: setColumnVisibility,
      onRowSelectionChange: updater => {
        const newSelection = typeof updater === "function" ? updater(Object.fromEntries(Array.from(selectedMenuItems).map(id => [filteredMenuItems.findIndex(item => item.id === id), true]))) : updater;
        const newSelectedIds = new Set(
          Object.entries(newSelection)
            .filter(([_, selected]) => selected)
            .map(([index]) => filteredMenuItems[parseInt(index)]?.id)
            .filter(Boolean)
        );
        setSelectedMenuItems(newSelectedIds);
      },
      getCoreRowModel: getCoreRowModel(),
      getFilteredRowModel: getFilteredRowModel(),
      getSortedRowModel: getSortedRowModel()
    };
  }, [filteredMenuItems, bulkSelectionMode, columns, sorting, columnFilters, columnVisibility, selectedMenuItems]);

  const table = useReactTable(tableOptions);

  const handleCloseModal = useCallback((open: boolean) => {
    if (!open) {
      setShowMenuItemForm(false);
      setEditingMenuItem(null);
    }
  }, []);

  const handleCancel = useCallback(() => {
    setShowMenuItemForm(false);
    setEditingMenuItem(null);
  }, []);

  const handleClosePrinterDialog = useCallback(() => {
    setShowPrinterDialog(false);
    setSelectedMenuItemForPrinter(null);
  }, []);

  const handlePrinterAssignment = useCallback(
    (menuItemId: string, printerId: string) => {
      const menuItem = filteredMenuItems.find(item => item.id === menuItemId);
      if (menuItem) {
        setSelectedMenuItemForPrinter(menuItem);
        setShowPrinterDialog(true);
      }
    },
    [filteredMenuItems]
  );

  const handlePrinterAssignmentComplete = useCallback(async () => {
    handleClosePrinterDialog();
  }, [handleClosePrinterDialog]);

  const handleToggleBulkSelection = useCallback(() => {
    setBulkSelectionMode(prev => !prev);
    setSelectedMenuItems(new Set());
  }, []);

  const handleSelectAllMenuItems = useCallback(() => {
    if (selectedMenuItems.size === filteredMenuItems.length) {
      setSelectedMenuItems(new Set());
    } else {
      setSelectedMenuItems(new Set(filteredMenuItems.map(item => item.id)));
    }
  }, [selectedMenuItems.size, filteredMenuItems]);

  const handleOpenBulkPrinterDialog = useCallback(() => {
    if (selectedMenuItems.size > 0) {
      setShowBulkPrinterDialog(true);
    }
  }, [selectedMenuItems.size]);

  const handleCloseBulkPrinterDialog = useCallback(() => {
    setShowBulkPrinterDialog(false);
  }, []);

  const handleBulkPrinterAssignmentComplete = useCallback(async () => {
    setSelectedMenuItems(new Set());
    setBulkSelectionMode(false);
    handleCloseBulkPrinterDialog();
  }, [handleCloseBulkPrinterDialog]);

  const handleOpenBulkCategoryDialog = useCallback(() => {
    if (selectedMenuItems.size > 0) {
      setBulkCategoryValue("");
      setShowBulkCategoryDialog(true);
    }
  }, [selectedMenuItems.size]);

  const handleCloseBulkCategoryDialog = useCallback(() => {
    setShowBulkCategoryDialog(false);
    setBulkCategoryValue("");
  }, []);

  const handleBulkCategoryUpdate = useCallback(async () => {
    if (!bulkCategoryValue || selectedMenuItems.size === 0) {
      toast({
        title: "Error",
        description: "Please select a category",
        variant: "destructive",
        duration: 1000
      });
      return;
    }

    try {
      const selectedItemsArray = Array.from(selectedMenuItems);
      const response = await menuAPI.bulkUpdateCategory(selectedItemsArray, bulkCategoryValue);
      if (!response || !response.data) {
        throw new Error("Failed to update menu items");
      }
      if (response.data.menuItems) {
        if (handleUpdateMenuItem) {
          for (const updatedItem of response.data.menuItems) {
            await handleUpdateMenuItem(updatedItem.id, updatedItem);
          }
        } else if (propUpdateMenuItem) {
          for (const updatedItem of response.data.menuItems) {
            await propUpdateMenuItem(updatedItem.id, updatedItem);
          }
        }
      }
      const categoryLabel = categories.find(c => c.value === bulkCategoryValue)?.name || bulkCategoryValue;
      toast({
        title: "Success",
        description: `Updated ${response.data.updatedCount} menu items to ${categoryLabel} category`,
        variant: "default",
        duration: 1000
      });
      setSelectedMenuItems(new Set());
      setBulkSelectionMode(false);
      handleCloseBulkCategoryDialog();
    } catch (error) {
      console.error("Error updating menu item categories:", error);
      toast({
        title: "Error",
        description: "Failed to update menu item categories",
        variant: "destructive",
        duration: 1000
      });
    }
  }, [bulkCategoryValue, selectedMenuItems, handleUpdateMenuItem, propUpdateMenuItem, categories, handleCloseBulkCategoryDialog]);

  const isMobile = useMediaQuery("(max-width: 640px)");

  const highlightSearchTerm = useCallback(
    (text: string) => {
      if (!searchTerm || !text) return text;
      const regex = new RegExp(`(${searchTerm.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`, "gi");
      const parts = text.split(regex);
      return parts.map((part, i) =>
        regex.test(part) ? (
          <span key={i} className="bg-yellow-200 font-medium">
            {part}
          </span>
        ) : (
          part
        )
      );
    },
    [searchTerm]
  );

  const handleMenuItemSelection = useCallback(
    (id: string, selected: boolean) => {
      const newSelectedItems = new Set(selectedMenuItems);
      if (selected) {
        newSelectedItems.add(id);
      } else {
        newSelectedItems.delete(id);
      }
      setSelectedMenuItems(newSelectedItems);
    },
    [selectedMenuItems]
  );
  const handleSelectMenuItem = handleMenuItemSelection;
  const categoriesFiltered = useMemo(() => {
    return categories || [];
  }, [categories]);

  return (
    <TooltipProvider delayDuration={100} skipDelayDuration={10}>
      {/* Menu Builder Layout */}
      <MenuBuilderLayout
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        selectedCategory={selectedCategory}
        setSelectedCategory={setSelectedCategory}
        dataValidationEnabled={dataValidationEnabled}
        validationResults={validationResults}
        showValidationPanel={showValidationPanel}
        setShowValidationPanel={setShowValidationPanel}
        filteredMenuItems={filteredMenuItems}
        currentMenuItems={currentMenuItems}
        categories={categories}
        showMenuItemForm={showMenuItemForm}
        handleCloseModal={handleCloseModal}
        editingMenuItem={editingMenuItem}
        menuItemCategories={menuItemCategories}
        handleUpdateMenuItem={handleUpdateMenuItemLocal}
        handleAddMenuItem={handleAddMenuItem}
        handleCancel={handleCancel}
        isMobile={isMobile}
        handleDeleteMenuItem={handleDeleteMenuItemLocal}
        handleTogglePOSVisibility={handleTogglePOSVisibility}
        handlePrinterAssignment={handlePrinterAssignment}
        handleSelectMenuItem={handleSelectMenuItem}
        selectedMenuItems={selectedMenuItems}
        bulkSelectionMode={bulkSelectionMode}
        highlightSearchTerm={highlightSearchTerm}
        categoriesFiltered={categoriesFiltered}
        calculateMenuItemCost={calculateMenuItemCost}
        table={table}
      />

      {/* Floating & Bulk Actions */}
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
                    <p>{selectedMenuItems.size === filteredMenuItems.length ? "Deselect all menu items" : "Select all visible menu items"}</p>
                  </TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button className="h-9 px-3 rounded-full bg-white/95 backdrop-blur-sm hover:bg-white text-gray-700 shadow-md hover:shadow-lg transition-all duration-200 hover:scale-105 text-xs font-medium border border-yellow-500" onClick={handleOpenBulkPrinterDialog} disabled={selectedMenuItems.size === 0}>
                      <Printer className="h-3.5 w-3.5 mr-1.5" />
                      Printer ({selectedMenuItems.size})
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Assign printers to {selectedMenuItems.size} selected menu items</p>
                  </TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button className="h-9 px-3 rounded-full bg-white/95 backdrop-blur-sm hover:bg-white text-gray-700 shadow-md hover:shadow-lg transition-all duration-200 hover:scale-105 text-xs font-medium border border-green-500" onClick={handleOpenBulkCategoryDialog} disabled={selectedMenuItems.size === 0}>
                      <Tag className="h-3.5 w-3.5 mr-1.5" />
                      Category ({selectedMenuItems.size})
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Change category for {selectedMenuItems.size} selected menu items</p>
                  </TooltipContent>
                </Tooltip>
              </div>
            </div>
          )}

          <div className="flex items-center gap-3">
            {dataValidationEnabled && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button className={`h-14 w-14 rounded-full shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-110 ${validationResults && !validationResults.isValid ? "bg-red-500 hover:bg-red-600 text-white" : validationResults && validationResults.summary.warnings > 0 ? "bg-amber-500 hover:bg-amber-600 text-white" : "bg-emerald-500 hover:bg-emerald-600 text-white"}`} onClick={runValidation} aria-label="Validate inventory data">
                    {validationResults && !validationResults.isValid ? <AlertTriangle className="h-5 w-5" /> : validationResults && validationResults.summary.warnings > 0 ? <AlertTriangle className="h-5 w-5" /> : <CheckCircle className="h-5 w-5" />}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Run data validation</p>
                </TooltipContent>
              </Tooltip>
            )}

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
              <Button
                className="h-14 w-14 rounded-full bg-primary hover:bg-teal-600 text-white shadow-xl hover:shadow-2xl transition-all duration-200 hover:scale-110 relative"
                onClick={() => {
                  setEditingMenuItem(null);
                  setShowMenuItemForm(true);
                }}
                aria-label="Add new menu item"
              >
                <Plus className="h-6 w-6" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Add new menu item</p>
            </TooltipContent>
          </Tooltip>
        </div>
      </div>
      {/* Printer Assignment */}
      <PrinterAssignmentDialog open={showPrinterDialog} onOpenChange={handleClosePrinterDialog} item={selectedMenuItemForPrinter} itemType="menu" onAssignmentChange={handlePrinterAssignmentComplete} />

      {/* Bulk Printer Assignment */}
      <BulkPrinterAssignmentDialog open={showBulkPrinterDialog} onOpenChange={handleCloseBulkPrinterDialog} selectedItems={selectedMenuItems} itemType="menu" onAssignmentChange={handleBulkPrinterAssignmentComplete} />

      {/* Bulk Category Assignment */}
      <AlertDialog open={showBulkCategoryDialog} onOpenChange={handleCloseBulkCategoryDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Update Category for {selectedMenuItems.size} Items</AlertDialogTitle>
            <AlertDialogDescription>Select a category to apply to all selected menu items.</AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-4">
            <Select value={bulkCategoryValue} onValueChange={handleBulkCategoryChange}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select a category" />
              </SelectTrigger>
              <SelectContent>
                {menuItemCategories.map(category => (
                  <SelectItem key={category.id || category.value} value={category.value || category.id?.toString() || ""}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleBulkCategoryUpdate} disabled={!bulkCategoryValue || selectedMenuItems.size === 0}>
              Update {selectedMenuItems.size} Items
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </TooltipProvider>
  );
};

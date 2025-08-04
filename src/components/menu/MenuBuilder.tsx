import { menuAPI } from "@/api/menu.api.ts";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "@/components/ui/use-toast";
import { useInventoryStore } from "@/hooks/useInventoryStore";
import { Material, MenuItem, MenuItemBuilderProps, MenuItemCategory, MenuItemIngredient, StockEntry } from "@/types/inventory";
import { formatCurrency, formatNumber } from "@/utils/conversionLogic";
import { getConversionFactor } from "@/utils/getConversionFactor";
import { highlightText } from "@/utils/highlightText";
import { Check, Edit, Eye, Package, Plus, Printer, Search, Trash2, Tag } from "lucide-react";
import { useCallback, useMemo, useState } from "react";
import { MenuItemForm } from "./MenuItemForm";
import { PrinterAssignmentDialog } from "@/components/inventory/PrinterAssignmentDialog";
import { BulkPrinterAssignmentDialog } from "@/components/inventory/BulkPrinterAssignmentDialog";

export const MenuItemBuilder: React.FC<MenuItemBuilderProps> = ({ stockEntries, materials, menuItems, onCreateMenuItem, onUpdateMenuItem, onDeleteMenuItem }) => {
  const { fetchTabData } = useInventoryStore();

  // Helper function to calculate cost per unit for a material
  const calculateMaterialCostPerUnit = useCallback(
    (material: Material, materialStockEntries: StockEntry[] = []) => {
      // Filter valid stock entries with non-null, non-undefined, and non-zero costPerBaseUnit
      const validStockEntries = materialStockEntries.filter(entry => entry.costPerBaseUnit !== null && entry.costPerBaseUnit !== undefined && !isNaN(entry.costPerBaseUnit));

      if (validStockEntries.length > 0) {
        // Calculate weighted average cost from stock entries
        const totalCost = validStockEntries.reduce((sum, entry) => {
          const quantity = entry.purchasedIndividualQuantity || 0;
          return sum + (entry.costPerBaseUnit || 0) * quantity;
        }, 0);

        const totalQuantity = validStockEntries.reduce((sum, entry) => sum + (entry.purchasedIndividualQuantity || 0), 0);

        if (totalQuantity > 0) {
          const weightedAverage = totalCost / totalQuantity;
          return parseFloat(weightedAverage.toFixed(8)); // Ensure precision for small values
        }
      }
      return 0; // Fallback to 0 if no valid stock entries
    },
    [] // No dependencies needed since function receives materialStockEntries as parameter
  );

  const availableMaterials = useMemo(() => {
    if (materials && materials.length > 0) {
      return materials;
    }
    const materialMap = new Map<string, Material>();
    stockEntries.forEach(entry => {
      if (entry.material && entry.purchasedIndividualQuantity && entry.purchasedIndividualQuantity > 0) {
        materialMap.set(entry.material.id.toString(), entry.material);
      }
    });
    return Array.from(materialMap.values());
  }, [materials, stockEntries]);

  const [searchTerm, setSearchTerm] = useState("");
  const [showMenuItemForm, setShowMenuItemForm] = useState(false);
  const [editingMenuItem, setEditingMenuItem] = useState<MenuItem | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<MenuItemCategory | "all">("all");
  const [selectedRowId, setSelectedRowId] = useState<string | null>(null);
  const [showPrinterDialog, setShowPrinterDialog] = useState(false);
  const [selectedMenuItemForPrinter, setSelectedMenuItemForPrinter] = useState<MenuItem | null>(null);
  const [bulkSelectionMode, setBulkSelectionMode] = useState(false);
  const [selectedMenuItems, setSelectedMenuItems] = useState<Set<string>>(new Set());
  const [showBulkPrinterDialog, setShowBulkPrinterDialog] = useState(false);
  const [showBulkCategoryDialog, setShowBulkCategoryDialog] = useState(false);
  const [bulkCategoryValue, setBulkCategoryValue] = useState<MenuItemCategory | "">("")

  const MENU_CATEGORIES = useMemo<{ value: MenuItemCategory; label: string }[]>(
    () => [
      { value: "appetizers", label: "Appetizers" },
      { value: "burgers", label: "Burgers" },
      { value: "sandwiches", label: "Sandwiches" },
      { value: "plates", label: "Plates" },
      { value: "salads", label: "Salads" },
      { value: "pasta", label: "Pasta" },
      { value: "sushi", label: "Sushi" },
      { value: "pizza", label: "Pizza" },
      { value: "desserts", label: "Desserts" },
      { value: "cold", label: "Cold" },
      { value: "hot", label: "Hot" },
      { value: "breakfast", label: "Breakfast" },
      { value: "shisha", label: "Shisha" }
    ],
    []
  );

  const getMaterialName = useCallback(
    (id: string | number) => {
      const material = availableMaterials.find(m => m.id === String(id) || String(m.id) === String(id));
      return material?.name || "Unknown";
    },
    [availableMaterials]
  );

  const filteredMenuItems = useMemo(() => {
    return menuItems
      .filter(item => {
        const searchLower = searchTerm.toLowerCase();
        const matchesNameOrDescription = item.name.toLowerCase().includes(searchLower) || (item.description?.toLowerCase() || "").includes(searchLower);
        const matchesIngredients = item.ingredients.some(ingredient => {
          const materialName = getMaterialName(ingredient.materialId);
          return materialName.toLowerCase().includes(searchLower);
        });
        const matchesSearch = matchesNameOrDescription || matchesIngredients;
        const matchesCategory = selectedCategory === "all" || item.category === selectedCategory;
        return matchesSearch && matchesCategory;
      })
      .sort((a, b) => {
        // Sort by createdAt date in descending order (latest first)
        const dateA = new Date(a.createdAt || 0).getTime();
        const dateB = new Date(b.createdAt || 0).getTime();
        return dateB - dateA;
      });
  }, [menuItems, searchTerm, selectedCategory, getMaterialName]);

  const calculateMenuItemCost = useCallback(
    (ingredients: MenuItemIngredient[]) => {
      return ingredients.reduce((sum, ingredient) => {
        // If ingredient has stored cost, use it
        if (ingredient.cost && ingredient.cost > 0) {
          return sum + ingredient.cost;
        }

        // Calculate cost using helper function
        const material = availableMaterials.find(m => m.id === String(ingredient.materialId) || String(m.id) === String(ingredient.materialId));
        if (!material) {
          console.warn(`Material not found for ID: ${ingredient.materialId}`);
          return sum;
        }
        const materialStockEntries = stockEntries.filter(entry => entry.materialId === String(ingredient.materialId));
        const costPerUnit = calculateMaterialCostPerUnit(material, materialStockEntries);
        const conversionFactor = getConversionFactor(ingredient.unit, material.baseUnit, material.unitType || "piece", material);
        const ingredientCost = ingredient.quantity * conversionFactor * costPerUnit;
        console.log(`Ingredient cost: ${ingredient.quantity} * ${conversionFactor} * ${costPerUnit} = ${ingredientCost}`);
        return sum + ingredientCost;
      }, 0);
    },
    [availableMaterials, stockEntries, calculateMaterialCostPerUnit]
  );

  const handleAddMenuItem = useCallback(
    (data: Omit<MenuItem, "id" | "createdAt" | "updatedAt" | "ingredients"> & { ingredients: MenuItemIngredient[] }) => {
      console.log("🍽️ handleAddMenuItem - Creating new menu item with data:", data);

      // Use the costs already calculated by MenuItemForm
      const ingredientsWithCosts = data.ingredients;

      const menuItemToCreate: MenuItem = {
        id: `menu-${Date.now()}`, // Temporary ID, server should assign real ID
        ...data,
        ingredients: ingredientsWithCosts,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      console.log("🍽️ handleAddMenuItem - Final menu item to create:", menuItemToCreate);
      onCreateMenuItem(menuItemToCreate);

      // Close the form
      setShowMenuItemForm(false);
      setEditingMenuItem(null);
    },
    [onCreateMenuItem]
  );

  const handleUpdateMenuItem = useCallback(
    (data: Omit<MenuItem, "id" | "createdAt" | "updatedAt" | "ingredients"> & { ingredients: MenuItemIngredient[] }) => {
      if (!editingMenuItem || !onUpdateMenuItem) {
        console.error("editingMenuItem or onUpdateMenuItem handler not provided");
        return;
      }

      try {
        // Use the costs already calculated by MenuItemForm
        const ingredientsWithCosts = data.ingredients;

        const updatedMenuItem: MenuItem = {
          ...editingMenuItem,
          ...data,
          ingredients: ingredientsWithCosts,
          updatedAt: new Date()
        };

        onUpdateMenuItem(editingMenuItem.id, updatedMenuItem);
        setShowMenuItemForm(false);
        setEditingMenuItem(null);
      } catch (error) {
        console.error("Error updating menu item:", error);
        setShowMenuItemForm(false);
        setEditingMenuItem(null);
      }
    },
    [editingMenuItem, onUpdateMenuItem]
  );

  const handleDeleteMenuItem = useCallback(
    (id: string) => {
      if (!onDeleteMenuItem) {
        console.error("onDeleteMenuItem handler not provided");
        return;
      }
      onDeleteMenuItem(id);
    },
    [onDeleteMenuItem]
  );

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

  const handleRowClick = useCallback((id: string) => {
    setSelectedRowId(prevSelected => (prevSelected === id ? null : id));
  }, []);

  const handleTogglePOSVisibility = useCallback(
    async (item: MenuItem) => {
      try {
        const newPOSStatus = !item.isPOSItem;

        // Update the menu item's POS visibility
        const response = await menuAPI.updateMenuItem(item.id, {
          isPOSItem: newPOSStatus
        });

        if (!response) {
          throw new Error("Failed to update menu item POS visibility");
        }

        toast({
          title: "Success",
          description: `${item.name} is now ${newPOSStatus ? "available in" : "hidden from"} POS`,
          variant: "default"
        });

        // Refresh the data to show updated state
        await fetchTabData("menu");

        // Update local state by calling the update handler
        if (onUpdateMenuItem) {
          onUpdateMenuItem(item.id, { ...item, isPOSItem: newPOSStatus });
        }
      } catch (error) {
        console.error("Error updating menu item POS visibility:", error);
        toast({
          title: "Error",
          description: "Failed to update POS visibility",
          variant: "destructive"
        });
      }
    },
    [onUpdateMenuItem, fetchTabData]
  );

  const handleOpenPrinterDialog = useCallback((menuItem: MenuItem) => {
    setSelectedMenuItemForPrinter(menuItem);
    setShowPrinterDialog(true);
  }, []);

  const handleClosePrinterDialog = useCallback(() => {
    setShowPrinterDialog(false);
    setSelectedMenuItemForPrinter(null);
  }, []);

  const handlePrinterAssignmentComplete = useCallback(async () => {
    // Refresh the menu items data to show updated printer assignments
    await fetchTabData("menu");
    handleClosePrinterDialog();
  }, [fetchTabData, handleClosePrinterDialog]);

  const handleToggleBulkSelection = useCallback(() => {
    setBulkSelectionMode(prev => !prev);
    setSelectedMenuItems(new Set());
  }, []);

  const handleSelectMenuItem = useCallback((menuItemId: string) => {
    setSelectedMenuItems(prev => {
      const newSet = new Set(prev);
      if (newSet.has(menuItemId)) {
        newSet.delete(menuItemId);
      } else {
        newSet.add(menuItemId);
      }
      return newSet;
    });
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
    // Refresh the menu items data to show updated printer assignments
    await fetchTabData("menu");
    setSelectedMenuItems(new Set());
    setBulkSelectionMode(false);
    handleCloseBulkPrinterDialog();
  }, [fetchTabData, handleCloseBulkPrinterDialog]);

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
        variant: "destructive"
      });
      return;
    }

    try {
      const selectedItemsArray = Array.from(selectedMenuItems);
      
      // Use the bulk API method for better performance
      const response = await menuAPI.bulkUpdateCategory(selectedItemsArray, bulkCategoryValue);
      
      if (!response || !response.data) {
        throw new Error("Failed to update menu items");
      }

      // Update local state for all updated items
      if (onUpdateMenuItem && response.data.menuItems) {
        response.data.menuItems.forEach(updatedItem => {
          onUpdateMenuItem(updatedItem.id, updatedItem);
        });
      }

      const categoryLabel = MENU_CATEGORIES.find(c => c.value === bulkCategoryValue)?.label || bulkCategoryValue;
      
      toast({
        title: "Success",
        description: `Updated ${response.data.updatedCount} menu items to ${categoryLabel} category`,
        variant: "default"
      });

      // Refresh the data to show updated state
      await fetchTabData("menu");
      
      // Reset selection and close dialog
      setSelectedMenuItems(new Set());
      setBulkSelectionMode(false);
      handleCloseBulkCategoryDialog();
      
    } catch (error) {
      console.error("Error updating menu item categories:", error);
      toast({
        title: "Error",
        description: "Failed to update menu item categories",
        variant: "destructive"
      });
    }
  }, [bulkCategoryValue, selectedMenuItems, onUpdateMenuItem, MENU_CATEGORIES, fetchTabData, handleCloseBulkCategoryDialog]);

  return (
    <>
      <Card className="!border-0 !shadow-none !bg-background">
        <CardHeader>
          <div className="flex justify-between items-center mb-2">
            <CardTitle className="text-3xl font-bold">Menu Items</CardTitle>
            <div className="flex gap-2">
              {bulkSelectionMode && (
                <>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleSelectAllMenuItems}
                    disabled={filteredMenuItems.length === 0}
                  >
                    <Check className="h-4 w-4 mr-2" />
                    {selectedMenuItems.size === filteredMenuItems.length ? "Deselect All" : "Select All"}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleOpenBulkPrinterDialog}
                    disabled={selectedMenuItems.size === 0}
                  >
                    <Printer className="h-4 w-4 mr-2" />
                    Assign Printer ({selectedMenuItems.size})
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleOpenBulkCategoryDialog}
                    disabled={selectedMenuItems.size === 0}
                  >
                    <Tag className="h-4 w-4 mr-2" />
                    Update Category ({selectedMenuItems.size})
                  </Button>
                </>
              )}
              <Button
                size="sm"
                variant={bulkSelectionMode ? "default" : "outline"}
                onClick={handleToggleBulkSelection}
              >
                <Check className="h-4 w-4 mr-2" />
                {bulkSelectionMode ? "Exit Selection" : "Bulk Select"}
              </Button>
              <Button
                size="sm"
                onClick={() => {
                  setEditingMenuItem(null);
                  setShowMenuItemForm(true);
                }}
                aria-label="Add new menu item"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Menu Item
              </Button>
            </div>
          </div>

          {/* Search and Filter Controls */}
          <div className="mt-4 flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input type="search" placeholder="Search by name, description, or ingredients..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="pl-10" />
            </div>
            <Select value={selectedCategory} onValueChange={value => setSelectedCategory(value as MenuItemCategory | "all")}>
              <SelectTrigger className="w-full sm:w-[200px]">
                <SelectValue placeholder="Filter by category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {MENU_CATEGORIES.map(category => (
                  <SelectItem key={category.value} value={category.value}>
                    {category.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Results Counter */}
          {(searchTerm || selectedCategory !== "all") && (
            <div className="mt-2 text-sm text-muted-foreground">
              Showing {filteredMenuItems.length} of {menuItems.length} menu items
              {searchTerm && ` matching "${searchTerm}"`}
              {selectedCategory !== "all" && ` in ${MENU_CATEGORIES.find(c => c.value === selectedCategory)?.label}`}
            </div>
          )}
        </CardHeader>
        <CardContent>
          <Dialog open={showMenuItemForm} onOpenChange={handleCloseModal}>
            <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto" aria-describedby="menu-item-form-description">
              <DialogHeader>
                <DialogTitle>{editingMenuItem ? "Edit Menu Item" : "Create New Menu Item"}</DialogTitle>
              </DialogHeader>
              <MenuItemForm menuItem={editingMenuItem} materials={availableMaterials} categories={MENU_CATEGORIES} onSubmit={editingMenuItem ? handleUpdateMenuItem : handleAddMenuItem} onCancel={handleCancel} stockEntries={stockEntries} />
            </DialogContent>
          </Dialog>

          <div className="w-full h-[calc(100vh-175px)] overflow-auto border rounded-md">
            <Table className="min-w-full">
              <TableHeader className="sticky top-0 bg-background z-10 border-b">
                <TableRow>
                  {bulkSelectionMode && (
                    <TableHead className="w-12">
                      <input
                        type="checkbox"
                        checked={selectedMenuItems.size === filteredMenuItems.length && filteredMenuItems.length > 0}
                        onChange={handleSelectAllMenuItems}
                        className="h-4 w-4"
                        aria-label="Select all menu items"
                      />
                    </TableHead>
                  )}
                  <TableHead className="min-w-[80px]">Image</TableHead>
                  <TableHead className="min-w-[200px]">Name</TableHead>
                  <TableHead className="min-w-[150px]">Category</TableHead>
                  <TableHead className="min-w-[200px]">Ingredients</TableHead>
                  <TableHead className="min-w-[120px]">Cost</TableHead>
                  <TableHead className="min-w-[120px]">Price</TableHead>
                  <TableHead className="min-w-[120px]">Profit</TableHead>
                  <TableHead className="text-right min-w-[200px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredMenuItems.length > 0 ? (
                  filteredMenuItems.map(item => {
                    const totalCost = calculateMenuItemCost(item.ingredients);
                    const profit = item.price - totalCost;
                    const profitMargin = item.price ? (profit / item.price) * 100 : 0;

                    const isSelected = selectedRowId === item.id;

                    return (
                      <TableRow key={item.id} onClick={bulkSelectionMode ? () => handleSelectMenuItem(item.id) : () => handleRowClick(item.id)} className={`cursor-pointer transition-colors ${isSelected ? "bg-blue-50 border-l-4 border-l-blue-500 hover:bg-blue-100" : selectedMenuItems.has(item.id) ? "bg-green-50 border-l-4 border-l-green-500 hover:bg-green-100" : "hover:bg-muted/50"}`}>
                        {bulkSelectionMode && (
                          <TableCell className="w-12">
                            <input
                              type="checkbox"
                              checked={selectedMenuItems.has(item.id)}
                              onChange={() => handleSelectMenuItem(item.id)}
                              className="h-4 w-4"
                              aria-label={`Select ${item.name}`}
                              onClick={(e) => e.stopPropagation()}
                            />
                          </TableCell>
                        )}
                        <TableCell className="min-w-[80px]">
                          {item.image ? (
                            <img
                              src={item.image}
                              alt={item.name}
                              className="w-12 h-12 object-cover rounded-md border"
                            />
                          ) : (
                            <div className="w-12 h-12 bg-gray-100 rounded-md border flex items-center justify-center">
                              <Package className="h-6 w-6 text-gray-400" />
                            </div>
                          )}
                        </TableCell>
                        <TableCell className="font-medium min-w-[200px]">
                          <div>{highlightText(item.name, searchTerm)}</div>
                          {item.description && <div className="text-sm text-muted-foreground">{highlightText(item.description, searchTerm)}</div>}
                        </TableCell>
                        <TableCell className="min-w-[150px]">{MENU_CATEGORIES.find(c => c.value === item.category)?.label || item.category}</TableCell>
                        <TableCell className="min-w-[200px]">
                          <div className="space-y-1">
                            {item.ingredients.map((ingredient, idx) => {
                              const materialName = getMaterialName(ingredient.materialId);
                              return (
                                <div key={idx} className="text-sm">
                                  {formatNumber(ingredient.quantity)} {ingredient.unit} {highlightText(materialName, searchTerm)}
                                </div>
                              );
                            })}
                          </div>
                        </TableCell>
                        <TableCell className="min-w-[120px]">{formatCurrency(totalCost)}</TableCell>
                        <TableCell className="min-w-[120px]">{formatCurrency(item.price)}</TableCell>
                        <TableCell className={`min-w-[120px] ${profit >= 0 ? "text-teal-600" : "text-red-600"}`}>
                          {formatCurrency(profit)} ({formatNumber(profitMargin)}%)
                        </TableCell>
                        <TableCell className="text-right min-w-[200px]">
                          <div className="flex gap-2 justify-end">
                            <Button
                              size="sm"
                              variant={item.isPOSItem ? "default" : "outline"}
                              className={item.isPOSItem ? "bg-teal-600 hover:bg-teal-700 text-white" : ""}
                              onClick={e => {
                                e.stopPropagation();
                                handleTogglePOSVisibility(item);
                              }}
                              title={item.isPOSItem ? "Hide from POS" : "Show in POS"}
                              aria-label={`${item.isPOSItem ? "Hide from" : "Show in"} POS`}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={e => {
                                e.stopPropagation();
                                handleOpenPrinterDialog(item);
                              }}
                              title={`Assign printer to ${item.name}`}
                              aria-label={`Assign printer to ${item.name}`}
                            >
                              <Printer className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setEditingMenuItem(item);
                                setShowMenuItemForm(true);
                              }}
                              aria-label={`Edit ${item.name}`}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button size="sm" variant="outline" aria-label={`Delete ${item.name}`}>
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Delete Menu Item</AlertDialogTitle>
                                  <AlertDialogDescription>This will permanently delete "{item.name}" and cannot be undone.</AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction onClick={() => handleDeleteMenuItem(item.id)}>Delete</AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                ) : (
                  <TableRow>
                    <TableCell colSpan={bulkSelectionMode ? 9 : 8} className="text-center py-8">
                      <div className="flex flex-col items-center justify-center space-y-2">
                        <Package className="h-12 w-12 text-muted-foreground" />
                        <p className="text-lg font-medium">No menu items found</p>
                        <p className="text-sm text-muted-foreground">{searchTerm ? "Try a different search term" : "Create your first menu item"}</p>
                        <Button className="mt-4" onClick={() => setShowMenuItemForm(true)}>
                          <Plus className="h-4 w-4 mr-2" />
                          Add Menu Item
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
      
      {/* Printer Assignment Dialog */}
      <PrinterAssignmentDialog
        open={showPrinterDialog}
        onOpenChange={setShowPrinterDialog}
        item={selectedMenuItemForPrinter}
        itemType="menu"
        onAssignmentChange={handlePrinterAssignmentComplete}
      />
      
      {/* Bulk Printer Assignment Dialog */}
      <BulkPrinterAssignmentDialog
        open={showBulkPrinterDialog}
        onOpenChange={setShowBulkPrinterDialog}
        selectedItems={selectedMenuItems}
        itemType="menu"
        onAssignmentChange={handleBulkPrinterAssignmentComplete}
      />
      
      {/* Bulk Category Update Dialog */}
      <Dialog open={showBulkCategoryDialog} onOpenChange={setShowBulkCategoryDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Update Category for {selectedMenuItems.size} Items</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Select New Category</label>
              <Select value={bulkCategoryValue} onValueChange={(value) => setBulkCategoryValue(value as MenuItemCategory)}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a category" />
                </SelectTrigger>
                <SelectContent>
                  {MENU_CATEGORIES.map(category => (
                    <SelectItem key={category.value} value={category.value}>
                      {category.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="text-sm text-muted-foreground">
              This will update the category for all {selectedMenuItems.size} selected menu items.
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={handleCloseBulkCategoryDialog}>
                Cancel
              </Button>
              <Button onClick={handleBulkCategoryUpdate} disabled={!bulkCategoryValue}>
                <Tag className="h-4 w-4 mr-2" />
                Update Category
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/components/ui/use-toast";
import { useInventoryStore } from "@/hooks/useInventoryStore";
import { Material, MenuItem, MenuItemBuilderProps, MenuItemCategory, MenuItemIngredient, StockEntry, UnitType } from "@/types/inventory";
import { getConversionFactor } from "@/utils/getConversionFactor";
import { dataValidator, ValidationResult, ValidationIssue } from "@/utils/dataValidation";
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

export const MenuItemBuilder: React.FC<MenuItemBuilderProps> = ({ menuItems, categories, onCreateMenuItem, onUpdateMenuItem, onDeleteMenuItem }) => {
  const { fetchTabData, menuItems: storeMenuItems } = useInventoryStore();
  const currentMenuItems = storeMenuItems && storeMenuItems.length > 0 ? storeMenuItems : menuItems || [];
  const [dataValidationEnabled] = useAtom(dataValidationEnabledAtom);
  const menuItemCategories = categories || [];
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

  // useEffect(() => {
  //   const data = fetchTabData("menu");
  //   console.log("Fetching menu items...", data);
  // }, [fetchTabData]);

  const validateIngredientData = useCallback((ingredient: MenuItemIngredient, material: Material) => {
    if (!ingredient.unit || !material.baseUnit || !ingredient.quantity) return;
    const issues: ValidationIssue[] = [];
    const ingredientUnitType = dataValidator.getUnitTypeFromUnit(ingredient.unit);
    const materialUnitType = dataValidator.getUnitTypeFromUnit(material.baseUnit);
    if (ingredientUnitType !== "unknown" && materialUnitType !== "unknown" && ingredientUnitType !== materialUnitType) {
      issues.push({
        type: "warning",
        category: "unit_mismatch",
        materialId: material.id,
        materialName: material.name,
        ingredientUnit: ingredient.unit,
        message: `Unit type mismatch: ingredient uses ${ingredient.unit} (${ingredientUnitType}) but material base unit is ${material.baseUnit} (${materialUnitType})`,
        suggestion: `Consider using ${materialUnitType} units for this ingredient`,
        impact: "medium",
        autoFixable: false
      });
    }
    if (issues.length > 0) {
      console.group(`🔍 Ingredient Validation Issues for ${material.name}`);
      issues.forEach(issue => {});
      console.groupEnd();
    }
  }, []);

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

  const calculateMaterialCostPerUnit = useCallback((material: Material | undefined, materialStockEntries: StockEntry[]): number => {
    if (!material || !materialStockEntries.length) {
      return 0;
    }
    const materialIssues = dataValidator.validateMaterial(material);
    if (materialIssues.length > 0) {
      console.group(`🔍 Material Issues for ${material.name}`);
      materialIssues.forEach(issue => {});
      console.groupEnd();
    }
    let totalCost = 0;
    let totalQuantity = 0;
    let validEntries = 0;
    for (const entry of materialStockEntries) {
      if (materialStockEntries.indexOf(entry) === 0) {
        const entryIssues = dataValidator.validateStockEntries(material, materialStockEntries);
        if (entryIssues.length > 0) {
          console.group(`🔍 Stock Entry Issues for ${material.name}`);
          entryIssues.forEach(issue => {});
          console.groupEnd();
        }
      }
      let entryCost = 0;
      let entryQuantity = 0;
      try {
        if (entry.costPerBaseUnit && entry.costPerBaseUnit > 0) {
          entryCost = entry.costPerBaseUnit;
          entryQuantity = 1;
        } else if (entry.totalCost && entry.purchasedIndividualQuantity && entry.purchasedIndividualQuantity > 0) {
          entryCost = entry.totalCost / entry.purchasedIndividualQuantity;
          entryQuantity = entry.purchasedIndividualQuantity;
        } else if (entry.totalCost && entry.purchasedQuantity && entry.purchasedQuantity > 0) {
          try {
            const conversionFactor = getConversionFactor(entry.purchasedUnit || material.baseUnit, material.baseUnit, material.unitType || "piece", material);
            const convertedQuantity = entry.purchasedQuantity * conversionFactor;
            if (convertedQuantity > 0) {
              entryCost = entry.totalCost / convertedQuantity;
              entryQuantity = convertedQuantity;
            }
          } catch (conversionError) {
            console.warn(`⚠️ Unit conversion failed for ${material.name}:`, conversionError);
          }
        } else if (entry.costPerPurchasedUnit && entry.costPerPurchasedUnit > 0) {
          try {
            const conversionFactor = getConversionFactor(entry.purchasedUnit || material.baseUnit, material.baseUnit, material.unitType || "piece", material);
            entryCost = entry.costPerPurchasedUnit / conversionFactor;
            entryQuantity = 1;
          } catch (conversionError) {
            console.warn(`⚠️ Unit conversion failed for costPerPurchasedUnit ${material.name}:`, conversionError);
          }
        }
        if (entryCost > 0 && entryQuantity > 0) {
          totalCost += entryCost * entryQuantity;
          totalQuantity += entryQuantity;
          validEntries++;
        }
      } catch (error) {
        console.error(`❌ Error processing stock entry for ${material.name}:`, error);
      }
    }
    if (validEntries === 0) {
      console.warn(`⚠️ No valid cost data found for material: ${material.name}`);
      return 0;
    }
    const weightedAverageCost = totalCost / totalQuantity;
    return parseFloat(weightedAverageCost.toFixed(8));
  }, []);

  const calculateMenuItemCost = useCallback(
    (ingredients: MenuItemIngredient[]) => {
      if (!ingredients || !Array.isArray(ingredients)) {
        return 0;
      }
      return ingredients.reduce((sum, ingredient) => {
        // If the ingredient already has a cost value, use it directly
        if (ingredient.cost && parseFloat(String(ingredient.cost)) > 0) {
          return sum + parseFloat(String(ingredient.cost));
        }
        
        // Try to find the material in currentMenuItems
        const material = currentMenuItems.find(m => m.id === String(ingredient.materialId) || String(m.id) === String(ingredient.materialId));
        
        // If not found in currentMenuItems, try to find it in the inventory store
        if (!material) {
          // Find material in the inventory store materials
          const storeMaterial = materials?.find(m => String(m.id) === String(ingredient.materialId));
          
          if (!storeMaterial) {
            console.warn(`Material not found for ID: ${ingredient.materialId}`);
            return sum;
          }
          
          // Create a proper Material object for calculation
          const materialForCalculation: Material = {
            id: storeMaterial.id,
            name: storeMaterial.name,
            category: storeMaterial.category,
            baseUnit: storeMaterial.baseUnit,
            unitType: storeMaterial.unitType,
            costPerUnit: storeMaterial.costPerUnit || 0
          };
          
          validateIngredientData(ingredient, materialForCalculation);
          
          // Get stock entries for this material if available
          const materialStockEntries = inventoryStore.stockEntries?.filter(se => String(se.materialId) === String(ingredient.materialId)) || [];
          
          // Calculate cost per unit
          const costPerUnit = calculateMaterialCostPerUnit(materialForCalculation, materialStockEntries);
          
          let conversionFactor = 1;
          try {
            conversionFactor = getConversionFactor(
              ingredient.unit,
              materialForCalculation.baseUnit,
              materialForCalculation.unitType,
              materialForCalculation
            );
          } catch (error) {
            console.warn(`Unit conversion error for ingredient in material "${materialForCalculation.name}": ${ingredient.unit} to ${materialForCalculation.baseUnit}`, error);
            conversionFactor = 1;
          }
          
          const ingredientCost = ingredient.quantity * conversionFactor * costPerUnit;
          return sum + ingredientCost;
        }
        
        // If material was found in currentMenuItems
        // Create a temporary Material object for validation
        const materialForValidation: Material = {
          id: material.id,
          name: material.name,
          category: "other",
          baseUnit: "piece",
          unitType: "piece",
          costPerUnit: material.costPerUnit || 0
        };
        
        validateIngredientData(ingredient, materialForValidation);
        
        // Since we don't have actual StockEntry objects, we'll use an empty array
        const materialStockEntries: StockEntry[] = [];

        // Create a proper Material object from MenuItem properties
        const materialForCalculation: Material = {
          id: material.id,
          name: material.name,
          category: "other", // Use a valid MaterialCategory value
          baseUnit: "piece", // Default baseUnit for MenuItems
          unitType: "piece", // Default unitType for MenuItems
          costPerUnit: material.costPerUnit || 0
        };

        // Calculate cost per unit with proper arguments
        const costPerUnit = calculateMaterialCostPerUnit(materialForCalculation, materialStockEntries);

        let conversionFactor = 1;
        try {
          // Ensure all required parameters are provided to getConversionFactor
          conversionFactor = getConversionFactor(
            ingredient.unit,
            "piece", // Default baseUnit for MenuItems
            "piece" as UnitType, // Default unitType for MenuItems
            materialForCalculation
          );
        } catch (error) {
          console.warn(`Unit conversion error for ingredient in material "${material.name}": ${ingredient.unit} to piece`, error);
          conversionFactor = 1;
        }
        const ingredientCost = ingredient.quantity * conversionFactor * costPerUnit;
        return sum + ingredientCost;
      }, 0);
    },
    [calculateMaterialCostPerUnit, validateIngredientData]
  );

  // Get materials from the inventory store
  const inventoryStore = useInventoryStore();
  const materials = inventoryStore.materialsWithStock;
  
  const getMaterialName = useCallback(
    (id: string | number) => {
      // First try to find the material in the current menu items
      const material = currentMenuItems.find(m => m.id === String(id) || String(m.id) === String(id));
      if (material?.name) {
        return material.name;
      }
      
      // If not found, check in the materials from inventory store
      if (materials && materials.length > 0) {
        const material = materials.find(m => String(m.id) === String(id));
        if (material?.name) {
          return material.name;
        }
      }
      
      return "Unknown";
    },
    [currentMenuItems, materials]
  );

  const handleDeleteMenuItem = useCallback(
    async (id: string) => {
      try {
        // Delete via API
        await menuAPI.deleteMenuItem(id);
        
        // Call the callback first
        if (onDeleteMenuItem) {
          await onDeleteMenuItem(id);
        }
        
        toast({
          title: "Success",
          description: "Menu item deleted successfully",
          variant: "default",
          duration: 1000
        });
        
        // Fetch data after the toast is shown to prevent UI flicker
        await fetchTabData("menu");
      } catch (error) {
        console.error("❌ [MenuBuilder] Error deleting menu item:", error);
        toast({
          title: "Error",
          description: "Failed to delete menu item",
          variant: "destructive",
          duration: 1000
        });
      }
    },
    [onDeleteMenuItem, fetchTabData]
  );

  const handleTogglePOSVisibility = useCallback(
    async (item: MenuItem) => {
      try {
        const newPOSStatus = !item.isPOSItem;
        const updatedItem = { ...item, isPOSItem: newPOSStatus };
        await menuAPI.updateMenuItem(item.id, updatedItem);
        
        toast({
          title: `Menu item ${newPOSStatus ? "added to" : "removed from"} POS`,
          description: `${item.name} is now ${newPOSStatus ? "visible" : "hidden"} in POS`,
          variant: "default",
          duration: 1000
        });
        
        // Only fetch data after the toast is shown to avoid UI flicker
        if (onUpdateMenuItem) {
          onUpdateMenuItem(item.id, updatedItem);
        }
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
    [onUpdateMenuItem]
  );

  const handleOpenPrinterDialog = useCallback((menuItem: MenuItem) => {
    setSelectedMenuItemForPrinter(menuItem);
    setShowPrinterDialog(true);
  }, []);

  const columns = useMenuItemColumns({
    searchTerm,
    categories,
    calculateMenuItemCost,
    getMaterialName,
    handleTogglePOSVisibility,
    handleOpenPrinterDialog,
    handleDeleteMenuItem,
    setEditingMenuItem,
    setShowMenuItemForm
  });

  // Filter menu items by search term, selected category, and exclude items with beverageStockId
  const filteredMenuItems = useMemo(() => {
    // Debug log all items before filtering
    console.log("🔍 MenuBuilder: All menu items before filtering:", currentMenuItems.length);

    // Find any suspicious items that might be beverages but don't have beverageStockId
    const suspiciousBeverageItems = currentMenuItems.filter(item => {
      // Check for beverage-related names or categories
      const nameLower = item.name.toLowerCase();
      const isBeverageName = nameLower.includes("beer") || nameLower.includes("wine") || nameLower.includes("drink") || nameLower.includes("beverage");

      // Check for beverage categories
      let isBeverageCategory = false;
      if (typeof item.category === "string") {
        isBeverageCategory = item.category.toLowerCase() === "alcohol" || item.category.toLowerCase() === "cold" || item.category.toLowerCase() === "hot" || item.category.toLowerCase() === "beverages";
      } else if (typeof item.category === "object" && item.category !== null && "name" in item.category) {
        const categoryName = (item.category as { name: string }).name.toLowerCase();
        isBeverageCategory = categoryName === "alcohol" || categoryName === "cold" || categoryName === "hot" || categoryName === "beverages";
      }

      // Check if it's a suspicious beverage item but doesn't have beverageStockId
      return (isBeverageName || isBeverageCategory) && !item.isBeverage;
    });

    if (suspiciousBeverageItems.length > 0) {
      console.warn(
        "⚠️ MenuBuilder: Found suspicious beverage items without beverageStockId:",
        suspiciousBeverageItems.map(item => ({
          id: item.id,
          name: item.name,
          category: item.category,
          isBeverage: item.isBeverage
        }))
      );
    }

    return currentMenuItems.filter(item => {
      // Debug log for Mexican Beer or any alcohol category items
      if (item.name.toLowerCase().includes("mexican beer") || (typeof item.category === "string" && item.category.toLowerCase() === "alcohol") || (typeof item.category === "object" && item.category !== null && "name" in item.category && (item.category as { name: string }).name.toLowerCase() === "alcohol")) {
        console.log("🍺 Found item with name/category of interest:", {
          id: item.id,
          name: item.name,
          category: item.category,
          isBeverage: item.isBeverage,
          excluded: !!item.isBeverage
        });
      }

      // Exclude items with beverageStockId (these are beverage items)
      if (item.isBeverage) return false;

      const searchLower = searchTerm.toLowerCase();
      const matchesNameOrDescription = item.name.toLowerCase().includes(searchLower) || (item.description?.toLowerCase() || "").includes(searchLower);
      
      // Check both ingredients and menuItemIngredients arrays for search matches
      const matchesIngredients = (() => {
        // First check the ingredients array
        if (item.ingredients && Array.isArray(item.ingredients)) {
          return item.ingredients.some(ingredient => {
            const materialName = getMaterialName(ingredient.materialId);
            return materialName.toLowerCase().includes(searchLower);
          });
        }
        // Then check the menuItemIngredients array if ingredients is not available
        if (item.menuItemIngredients && Array.isArray(item.menuItemIngredients)) {
          return item.menuItemIngredients.some(ingredient => {
            const materialName = getMaterialName(ingredient.materialId);
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
  }, [currentMenuItems, searchTerm, selectedCategory, getMaterialName, categories]);

  // Prepare table configuration options - memoized to prevent unnecessary re-renders
  const tableOptions = useMemo(() => ({
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
  }), [filteredMenuItems, bulkSelectionMode, columns, sorting, columnFilters, columnVisibility, selectedMenuItems]);
  
  // Initialize table with the memoized options
  const table = useReactTable(tableOptions);

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
        
        // Create via API
        const createdMenuItem = await menuAPI.createMenuItem(menuItemToCreate);
        
        // Call the callback first
        if (onCreateMenuItem) {
          onCreateMenuItem(createdMenuItem);
        }
        
        // Close the form before fetching data to prevent UI flicker
        setShowMenuItemForm(false);
        setEditingMenuItem(null);
        
        toast({
          title: "Success",
          description: "Menu item created successfully",
          variant: "default",
          duration: 1000
        });
        
        // Fetch data after the toast is shown and form is closed
        await fetchTabData("menu");
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
    [onCreateMenuItem, fetchTabData]
  );

  const handleUpdateMenuItem = useCallback(
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
        
        // Update via API
        await menuAPI.updateMenuItem(editingMenuItem.id, updatedMenuItem);
        
        // Call the callback first
        if (onUpdateMenuItem) {
          onUpdateMenuItem(editingMenuItem.id, updatedMenuItem);
        }
        
        // Close the form before fetching data to prevent UI flicker
        setShowMenuItemForm(false);
        setEditingMenuItem(null);
        
        toast({
          title: "Success",
          description: "Menu item updated successfully",
          variant: "default",
          duration: 1000
        });
        
        // Fetch data after the toast is shown and form is closed
        await fetchTabData("menu");
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
    [editingMenuItem, onUpdateMenuItem, fetchTabData]
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
    await fetchTabData("menu");
    handleClosePrinterDialog();
  }, [fetchTabData, handleClosePrinterDialog]);

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
      if (onUpdateMenuItem && response.data.menuItems) {
        response.data.menuItems.forEach(updatedItem => {
          onUpdateMenuItem(updatedItem.id, updatedItem);
        });
      }

      const categoryLabel = categories.find(c => c.value === bulkCategoryValue)?.name || bulkCategoryValue;

      toast({
        title: "Success",
        description: `Updated ${response.data.updatedCount} menu items to ${categoryLabel} category`,
        variant: "default",
        duration: 1000
      });
      console.log("🔄 MenuBuilder: Fetching fresh menu data after bulk category update");
      await fetchTabData("menu");
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
  }, [bulkCategoryValue, selectedMenuItems, onUpdateMenuItem, categories, fetchTabData, handleCloseBulkCategoryDialog]);

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
        handleUpdateMenuItem={handleUpdateMenuItem}
        handleAddMenuItem={handleAddMenuItem}
        handleCancel={handleCancel}
        isMobile={isMobile}
        handleDeleteMenuItem={handleDeleteMenuItem}
        handleTogglePOSVisibility={handleTogglePOSVisibility}
        handlePrinterAssignment={handlePrinterAssignment}
        handleSelectMenuItem={handleSelectMenuItem}
        selectedMenuItems={selectedMenuItems}
        bulkSelectionMode={bulkSelectionMode}
        highlightSearchTerm={highlightSearchTerm}
        getMaterialName={getMaterialName}
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
                  <SelectItem key={category.value} value={category.value}>
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

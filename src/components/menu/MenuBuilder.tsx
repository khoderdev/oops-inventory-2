import { menuAPI } from "@/api/inventory.api";
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
import { dataValidator, ValidationResult, ValidationIssue } from "@/utils/dataValidation";
import { Check, Edit, Eye, Package, Plus, Printer, Search, Trash2, Tag, AlertTriangle, CheckCircle, X, CheckSquare, Square } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useCallback, useMemo, useState, useEffect, useRef } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import { createColumnHelper, flexRender, getCoreRowModel, getFilteredRowModel, getSortedRowModel, useReactTable, ColumnDef, SortingState, ColumnFiltersState, VisibilityState } from "@tanstack/react-table";
import { useAtom } from "jotai";
import { dataValidationEnabledAtom } from "@/store/settingsStore";
import { MenuItemForm } from "./MenuItemForm";
import { PrinterAssignmentDialog } from "@/components/inventory/PrinterAssignmentDialog";
import { BulkPrinterAssignmentDialog } from "@/components/inventory/BulkPrinterAssignmentDialog";

export const MenuItemBuilder: React.FC<MenuItemBuilderProps> = ({ stockEntries, materials, menuItems, categories, categoriesLoading, categoriesError, onCreateMenuItem, onUpdateMenuItem, onDeleteMenuItem }) => {
  const { fetchTabData, menuItems: storeMenuItems } = useInventoryStore();
  const currentMenuItems = storeMenuItems && storeMenuItems.length > 0 ? storeMenuItems : menuItems || [];
  const [dataValidationEnabled] = useAtom(dataValidationEnabledAtom);
  const menuItemCategories = categories || [];
  const [validationResults, setValidationResults] = useState<ValidationResult | null>(null);
  const [showValidationPanel, setShowValidationPanel] = useState(false);
  const [lastValidationTime, setLastValidationTime] = useState<number>(0);

  useEffect(() => {
    const validateData = async () => {
      if (!dataValidationEnabled) {
        setValidationResults(null);
        return;
      }
      if (!materials || !stockEntries || materials.length === 0) return;
      const now = Date.now();
      if (now - lastValidationTime < 30000) return;
      try {
        const result = dataValidator.validateData(materials, stockEntries);
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
  }, [materials, stockEntries, lastValidationTime, dataValidationEnabled]);

  useEffect(() => {
    fetchTabData("menu");
  }, [fetchTabData]);


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
      issues.forEach(issue => {
      });
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

    if (!materials || !stockEntries) return;

    const result = dataValidator.validateData(materials, stockEntries);
    setValidationResults(result);
    setLastValidationTime(Date.now());
    dataValidator.showValidationResults(result, "Manual Data Validation");
    setShowValidationPanel(true);
  }, [materials, stockEntries, dataValidationEnabled]);

  const calculateMaterialCostPerUnit = useCallback((material: Material | undefined, materialStockEntries: StockEntry[]): number => {
    if (!material || !materialStockEntries.length) {
      return 0;
    }

    const materialIssues = dataValidator.validateMaterial(material);
    if (materialIssues.length > 0) {
      console.group(`🔍 Material Issues for ${material.name}`);
      materialIssues.forEach(issue => {
      });
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
          entryIssues.forEach(issue => {
          });
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
  const [showPrinterDialog, setShowPrinterDialog] = useState(false);
  const [selectedMenuItemForPrinter, setSelectedMenuItemForPrinter] = useState<MenuItem | null>(null);
  const [bulkSelectionMode, setBulkSelectionMode] = useState(false);
  const [selectedMenuItems, setSelectedMenuItems] = useState<Set<string>>(new Set());
  const [showBulkPrinterDialog, setShowBulkPrinterDialog] = useState(false);
  const [showBulkCategoryDialog, setShowBulkCategoryDialog] = useState(false);
  const [bulkCategoryValue, setBulkCategoryValue] = useState<MenuItemCategory | "">("");
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  // Categories are now passed down from TabMenu component

  const calculateMenuItemCost = useCallback(
    (ingredients: MenuItemIngredient[]) => {
      if (!ingredients || !Array.isArray(ingredients)) {
        return 0;
      }
      return ingredients.reduce((sum, ingredient) => {
        if (ingredient.cost && parseFloat(String(ingredient.cost)) > 0) {
          return sum + parseFloat(String(ingredient.cost));
        }
        const material = availableMaterials.find(m => m.id === String(ingredient.materialId) || String(m.id) === String(ingredient.materialId));
        if (!material) {
          console.warn(`Material not found for ID: ${ingredient.materialId}`);
          return sum;
        }
        validateIngredientData(ingredient, material);
        const materialStockEntries = stockEntries.filter(entry => entry.materialId === String(ingredient.materialId));
        const costPerUnit = calculateMaterialCostPerUnit(material, materialStockEntries);
        let conversionFactor = 1;
        try {
          conversionFactor = getConversionFactor(ingredient.unit, material.baseUnit, material.unitType || "piece", material);
        } catch (error) {
          console.warn(`Unit conversion error for ingredient in material "${material.name}": ${ingredient.unit} to ${material.baseUnit}`, error);
          conversionFactor = 1;
        }
        const ingredientCost = ingredient.quantity * conversionFactor * costPerUnit;
        return sum + ingredientCost;
      }, 0);
    },
    [availableMaterials, stockEntries, calculateMaterialCostPerUnit, validateIngredientData]
  );

  const getMaterialName = useCallback(
    (id: string | number) => {
      const material = availableMaterials.find(m => m.id === String(id) || String(m.id) === String(id));
      return material?.name || "Unknown";
    },
    [availableMaterials]
  );

  // Define handler functions before they are used in columns
  const handleDeleteMenuItem = useCallback(
    async (id: string) => {
      try {
        // Call the parent handler if provided
        if (onDeleteMenuItem) {
          await onDeleteMenuItem(id);
        }

        // Refresh store data for instant rendering with force=true to bypass cache
        console.log("🔄 MenuBuilder: Fetching fresh menu data after delete");
        await fetchTabData("menu");

        toast({
          title: "Success",
          description: "Menu item deleted successfully",
          variant: "default",
          duration: 1000
        });
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
        const response = await menuAPI.updateMenuItem(item.id, {
          isPOSItem: newPOSStatus
        });
        if (!response) {
          throw new Error("Failed to update menu item POS visibility");
        }
        toast({
          title: "Success",
          description: `${item.name} is now ${newPOSStatus ? "available in" : "hidden from"} POS`,
          variant: "default",
          duration: 1000
        });
        await fetchTabData("menu");
        if (onUpdateMenuItem) {
          onUpdateMenuItem(item.id, { ...item, isPOSItem: newPOSStatus });
        }
      } catch (error) {
        console.error("Error updating menu item POS visibility:", error);
        toast({
          title: "Error",
          description: "Failed to update POS visibility",
          variant: "destructive",
          duration: 1000
        });
      }
    },
    [onUpdateMenuItem, fetchTabData]
  );

  const handleOpenPrinterDialog = useCallback((menuItem: MenuItem) => {
    setSelectedMenuItemForPrinter(menuItem);
    setShowPrinterDialog(true);
  }, []);

  const columnHelper = createColumnHelper<MenuItem>();

  const columns = useMemo<ColumnDef<MenuItem>[]>(
    () => [
      columnHelper.display({
        id: "select",
        header: ({ table }) => <input type="checkbox" checked={table.getIsAllPageRowsSelected()} onChange={table.getToggleAllPageRowsSelectedHandler()} className="h-4 w-4" aria-label="Select all menu items" />,
        cell: ({ row }) => <input type="checkbox" checked={row.getIsSelected()} onChange={row.getToggleSelectedHandler()} className="h-4 w-4" aria-label={`Select ${row.original.name}`} />,
        enableSorting: false,
        enableHiding: false,
        size: 48
      }),

      columnHelper.display({
        id: "image",
        header: "Image",
        cell: ({ row }) => (
          <div className="flex justify-center">
            {row.original.image ? (
              <img src={row.original.image} alt={row.original.name} className="w-12 h-12 object-cover rounded-md border" />
            ) : (
              <div className="w-12 h-12 bg-gray-100 rounded-md border flex items-center justify-center">
                <Package className="h-6 w-6 text-gray-400" />
              </div>
            )}
          </div>
        ),
        enableSorting: false,
        size: 80
      }),

      // Name column
      columnHelper.accessor("name", {
        header: "Name",
        cell: ({ getValue }) => <div className="font-medium">{highlightText(getValue(), searchTerm)}</div>,
        size: 200
      }),

      columnHelper.accessor("category", {
        header: "Category",
        cell: ({ getValue, row }) => {
          const category = getValue();
          let categoryLabel;

          if (typeof category === "object" && category !== null) {
            // Category is an object with name property
            categoryLabel = category.name || "Uncategorized";
          } else if (typeof category === "string") {
            // Category is a string - try to find matching category by value first, then by name
            const matchingCategory = categories.find(c => c.value === category) || categories.find(c => c.name?.toLowerCase() === category.toLowerCase());
            categoryLabel = matchingCategory?.name || category || "Uncategorized";
          } else if (typeof category === "number") {
            // Category is an ID - find by ID
            const matchingCategory = categories.find(c => c.id === category);
            categoryLabel = matchingCategory?.name || "Uncategorized";
          } else {
            categoryLabel = "Uncategorized";
          }

          return <span>{String(categoryLabel)}</span>;
        },
        size: 128
      }),

      // Ingredients column
      columnHelper.display({
        id: "ingredients",
        header: "Ingredients",
        cell: ({ row }) => <div className="text-center font-medium">{row.original.ingredients?.length || 0}</div>,
        enableSorting: false,
        size: 100
      }),

      // Cost column
      columnHelper.display({
        id: "cost",
        header: "Cost",
        cell: ({ row }) => {
          const ingredients = row.original.ingredients || [];
          const totalCost = calculateMenuItemCost(ingredients);
          return <div className="text-right font-medium">{formatCurrency(totalCost)}</div>;
        },
        size: 96
      }),

      // Price column
      columnHelper.accessor("price", {
        header: "Price",
        cell: ({ getValue }) => <div className="text-right font-medium">{formatCurrency(getValue())}</div>,
        size: 96
      }),

      // Profit column
      columnHelper.display({
        id: "profit",
        header: "Profit",
        cell: ({ row }) => {
          const totalCost = calculateMenuItemCost(row.original.ingredients || []);
          const profit = row.original.price - totalCost;
          // Ensure we have valid numbers for the profit margin calculation
          const profitMargin = row.original.price && row.original.price > 0 ? (profit / row.original.price) * 100 : 0;
          return (
            <div className={`text-right font-medium ${profit >= 0 ? "text-teal-600" : "text-red-600"}`}>
              <div>{formatCurrency(profit)}</div>
              <div className="text-xs">({formatNumber(isNaN(profitMargin) ? 0 : profitMargin)}%)</div>
            </div>
          );
        },
        size: 112
      }),

      // Actions column
      columnHelper.display({
        id: "actions",
        header: "Actions",
        cell: ({ row }) => (
          <div className="flex gap-2 justify-end">
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
                  size="sm"
                  variant="outline"
                  onClick={e => {
                    e.stopPropagation();
                    handleOpenPrinterDialog(row.original);
                  }}
                  aria-label={`Assign printer to ${row.original.name}`}
                >
                  <Printer className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Assign printer to {row.original.name}</p>
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={e => {
                    e.stopPropagation();
                    setEditingMenuItem(row.original);
                    setShowMenuItemForm(true);
                  }}
                  aria-label={`Edit ${row.original.name}`}
                >
                  <Edit className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Edit {row.original.name}</p>
              </TooltipContent>
            </Tooltip>

            <AlertDialog>
              <Tooltip>
                <TooltipTrigger asChild>
                  <AlertDialogTrigger asChild>
                    <Button size="sm" variant="outline" className="hover:bg-red-50 hover:text-red-600" aria-label={`Delete ${row.original.name}`}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </AlertDialogTrigger>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Delete {row.original.name}</p>
                </TooltipContent>
              </Tooltip>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete Menu Item</AlertDialogTitle>
                  <AlertDialogDescription>This will permanently delete "{row.original.name}" and cannot be undone.</AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction className="bg-red-600 hover:bg-red-700 text-white" onClick={() => handleDeleteMenuItem(row.original.id)}>
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        ),
        enableSorting: false,
        size: 160
      })
    ],
    [searchTerm, categories, getMaterialName, calculateMenuItemCost, handleTogglePOSVisibility, handleOpenPrinterDialog, handleDeleteMenuItem]
  );

  // Filter menu items by search term, selected category, and exclude items with beverageStockId
  const filteredMenuItems = useMemo(() => {
    return currentMenuItems.filter(item => {
      // Exclude items with beverageStockId (these are beverage items)
      if (item.beverageStockId) return false;
      const searchLower = searchTerm.toLowerCase();
      const matchesNameOrDescription = item.name.toLowerCase().includes(searchLower) || (item.description?.toLowerCase() || "").includes(searchLower);
      const matchesIngredients =
        item.ingredients && Array.isArray(item.ingredients)
          ? item.ingredients.some(ingredient => {
              const materialName = getMaterialName(ingredient.materialId);
              return materialName.toLowerCase().includes(searchLower);
            })
          : false;
      const matchesSearch = matchesNameOrDescription || matchesIngredients;
      
      // Handle different category formats: string, object, or number
      const matchesCategory =
        selectedCategory === "all" ||
        (() => {
          if (typeof item.category === "string") {
            // Support both stored category value and name (case-insensitive)
            if (item.category === selectedCategory) return true;
            const categoryObj = categories.find(c => c.value === item.category) || categories.find(c => c.name?.toLowerCase() === (typeof item.category === "string" ? item.category.toLowerCase() : String(item.category).toLowerCase()));
            return categoryObj?.value === selectedCategory;
          } else if (typeof item.category === "object" && item.category !== null && "name" in item.category) {
            // For category objects, we need to find the matching category by name and compare values
            const categoryObj = categories.find(c => c.name === (item.category as { name: string }).name);
            const result = categoryObj?.value === selectedCategory;
            return result;
          } else if (typeof item.category === "number") {
            // Find category by ID and compare values
            const categoryObj = categories.find(c => c.id === item.category);
            const result = categoryObj?.value === selectedCategory;
            return result;
          }
          return false;
        })();

      return matchesSearch && matchesCategory;
    });
  }, [currentMenuItems, searchTerm, selectedCategory, getMaterialName, categories]);

  // TanStack Table instance
  const table = useReactTable({
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
  });

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

        // Call the parent handler
        if (onCreateMenuItem) {
          onCreateMenuItem(menuItemToCreate);
        }

        // Refresh store data for instant rendering with force=true to bypass cache
        console.log("🔄 MenuBuilder: Fetching fresh menu data after create");
        await fetchTabData("menu");

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

        // Call the parent handler if provided
        if (onUpdateMenuItem) {
          onUpdateMenuItem(editingMenuItem.id, updatedMenuItem);
        }

        // Refresh store data for instant rendering with force=true to bypass cache
        console.log("🔄 MenuBuilder: Fetching fresh menu data after update");
        await fetchTabData("menu");

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

  const handlePrinterAssignmentComplete = useCallback(async () => {
    console.log("🔄 MenuBuilder: Fetching fresh menu data after printer assignment");
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
    console.log("🔄 MenuBuilder: Fetching fresh menu data after bulk printer assignment");
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

  return (
    <TooltipProvider delayDuration={100} skipDelayDuration={10}>
      <div className="flex flex-col h-[calc(100vh-6.5rem)] overflow-hidden">
        <Card className="!border-0 !shadow-none !bg-background flex flex-col h-full">
          <CardHeader className="flex-shrink-0 px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              <CardTitle className="text-2xl sm:text-3xl font-bold text-gray-900 flex-shrink-0">Menu Items</CardTitle>

              <div className="flex flex-col sm:flex-row gap-3 lg:gap-4 flex-1 lg:max-w-2xl">
                <div className="relative flex-1 min-w-0">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input type="search" placeholder="Search menu items..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="pl-10 h-10" />
                </div>
                <Select value={selectedCategory} onValueChange={value => setSelectedCategory(value as MenuItemCategory | "all")}>
                  <SelectTrigger className="w-full sm:w-[180px] lg:w-[200px] h-10">
                    <SelectValue placeholder="All Categories" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    {menuItemCategories.map(category => (
                      <SelectItem key={category.value} value={category.value}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {dataValidationEnabled && validationResults && (validationResults.summary.errors > 0 || validationResults.summary.warnings > 0) && (
              <div className={`mt-4 p-3 sm:p-4 rounded-lg border ${validationResults.summary.errors > 0 ? "bg-red-50 border-red-200" : "bg-yellow-50 border-yellow-200"}`}>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    {validationResults.summary.errors > 0 ? <AlertTriangle className="h-4 w-4 sm:h-5 sm:w-5 text-red-600" /> : <AlertTriangle className="h-4 w-4 sm:h-5 sm:w-5 text-yellow-600" />}
                    <h3 className={`font-medium text-sm sm:text-base ${validationResults.summary.errors > 0 ? "text-red-800" : "text-yellow-800"}`}>Data Validation Issues Found</h3>
                  </div>
                  <Button size="sm" variant="ghost" onClick={() => setShowValidationPanel(!showValidationPanel)} className="text-xs self-start sm:self-auto">
                    {showValidationPanel ? "Hide Details" : "Show Details"}
                  </Button>
                </div>

                <div className="text-xs sm:text-sm mb-2">
                  <span className={validationResults.summary.errors > 0 ? "text-red-700" : "text-yellow-700"}>
                    {validationResults.summary.errors} errors, {validationResults.summary.warnings} warnings
                  </span>
                </div>

                {showValidationPanel && (
                  <div className="space-y-2 max-h-60 sm:max-h-80 overflow-y-auto border rounded-md bg-white/50 p-2">
                    {validationResults.issues.map((issue, index) => (
                      <div key={index} className={`p-2 sm:p-3 rounded-md text-xs sm:text-sm border-l-4 ${issue.type === "error" ? "bg-red-50 border-l-red-500 text-red-900" : issue.type === "warning" ? "bg-yellow-50 border-l-yellow-500 text-yellow-900" : "bg-blue-50 border-l-blue-500 text-blue-900"}`}>
                        <div className="flex items-start gap-2">
                          <div className="flex-shrink-0 mt-0.5">{issue.type === "error" ? <span className="text-red-600 font-bold text-xs">❌</span> : issue.type === "warning" ? <span className="text-yellow-600 font-bold text-xs">⚠️</span> : <span className="text-blue-600 font-bold text-xs">ℹ️</span>}</div>
                          <div className="flex-1 min-w-0">
                            <div className="font-semibold mb-1 text-xs sm:text-sm">{issue.materialName || "System"}</div>
                            <div className="mb-2 text-xs sm:text-sm">{issue.message}</div>
                            {issue.suggestion && (
                              <div className="mt-2 p-2 bg-white/70 rounded text-xs border-l-2 border-l-gray-300">
                                <span className="font-medium text-gray-600">💡 Suggestion:</span> {issue.suggestion}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                    <div className="text-xs text-center py-2 text-gray-500 border-t">Showing all {validationResults.issues.length} validation issues</div>
                  </div>
                )}
              </div>
            )}

            {(searchTerm || selectedCategory !== "all") && (
              <div className="mt-3 text-xs sm:text-sm text-muted-foreground px-1">
                Showing <span className="font-medium">{filteredMenuItems.length}</span> of <span className="font-medium">{currentMenuItems.length}</span> menu items
                {searchTerm && (
                  <span className="block sm:inline">
                    {" "}
                    matching <span className="font-medium">"${searchTerm}"</span>
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
            <Dialog open={showMenuItemForm} onOpenChange={handleCloseModal} modal={true}>
              <DialogContent className="max-w-[95vw] sm:max-w-6xl max-h-[90vh] overflow-y-auto" aria-describedby="menu-item-form-description" onPointerDownOutside={e => e.preventDefault()} onInteractOutside={e => e.preventDefault()}>
                <DialogHeader>
                  <DialogTitle className="text-lg sm:text-xl">{editingMenuItem ? "Edit Menu Item" : "Create New Menu Item"}</DialogTitle>
                </DialogHeader>
                <MenuItemForm menuItem={editingMenuItem} materials={availableMaterials} categories={menuItemCategories} onSubmit={editingMenuItem ? handleUpdateMenuItem : handleAddMenuItem} onCancel={handleCancel} stockEntries={stockEntries} />
              </DialogContent>
            </Dialog>

            <TanStackVirtualizedTable table={table} />
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

      <PrinterAssignmentDialog open={showPrinterDialog} onOpenChange={setShowPrinterDialog} item={selectedMenuItemForPrinter} itemType="menu" onAssignmentChange={handlePrinterAssignmentComplete} />

      <BulkPrinterAssignmentDialog open={showBulkPrinterDialog} onOpenChange={setShowBulkPrinterDialog} selectedItems={selectedMenuItems} itemType="menu" onAssignmentChange={handleBulkPrinterAssignmentComplete} />

      <Dialog open={showBulkCategoryDialog} onOpenChange={setShowBulkCategoryDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Update Category for {selectedMenuItems.size} Items</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Select New Category</label>
              <Select value={bulkCategoryValue} onValueChange={value => setBulkCategoryValue(value as MenuItemCategory)}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a category" />
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
            <div className="text-sm text-muted-foreground">This will update the category for all {selectedMenuItems.size} selected menu items.</div>
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
    </TooltipProvider>
  );
};

interface TanStackVirtualizedTableProps {
  table: any;
}

// Optimized for instant rendering without loading states
const TanStackVirtualizedTable: React.FC<TanStackVirtualizedTableProps> = ({ table }) => {
  const parentRef = useRef<HTMLDivElement>(null);
  const rows = table.getRowModel().rows;

  // Enhanced virtualizer configuration for instant rendering
  const rowVirtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 60,
    overscan: 20, // Increased overscan for smoother scrolling
    measureElement: typeof window !== "undefined" ? element => element?.getBoundingClientRect().height || 60 : undefined
  });

  return (
    <div className="flex flex-1 flex-col min-h-0 border rounded-md">
      <div className="flex-shrink-0 border-b bg-muted/30 sticky top-0 z-10">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup: any) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header: any) => (
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

      <div className="flex-1 overflow-auto" ref={parentRef}>
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
                    <TableRow className={`cursor-pointer transition-colors hover:bg-muted/50 ${row.getIsSelected() ? "bg-blue-50 border-l-4 border-l-blue-500" : ""}`} onClick={() => row.toggleSelected()}>
                      {row.getVisibleCells().map((cell: any) => (
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
  );
};

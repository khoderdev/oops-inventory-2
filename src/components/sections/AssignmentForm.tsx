import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { AssignmentFormData, AssignmentFormProps, CreateSectionAssignmentData, UpdateSectionAssignmentData } from "@/types/inventory";
import { convertMass, convertVolume, formatCurrency, formatNumber, isMassUnit, isVolumeUnit } from "@/utils/conversionLogic";
import { getSuggestedUnits } from "@/utils/inventoryCalculations";
import { zodResolver } from "@hookform/resolvers/zod";
import { AlertCircle, DollarSign, Info, Package, Zap } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { assignmentSchema } from "./assignmentSchema";

export function AssignmentForm({ sections, stockEntries, materials, menuItems, assignment, existingAssignments = [], onSubmit, onCancel, isLoading = false, selectedSectionId, onAssignAll }: AssignmentFormProps) {
  const [formError, setFormError] = useState<string | null>(null);
  const [isAssigningAll, setIsAssigningAll] = useState(false);
  const prevSelectedSectionIdRef = useRef<string | undefined>();
  const prevAssignmentRef = useRef<string | undefined>();
  const renderCountRef = useRef(0);
  renderCountRef.current += 1;
  const shouldLog = prevSelectedSectionIdRef.current !== selectedSectionId || prevAssignmentRef.current !== assignment?.id || renderCountRef.current === 1;
  if (shouldLog) {
    prevSelectedSectionIdRef.current = selectedSectionId;
    prevAssignmentRef.current = assignment?.id;
  }
  const isAddingToSelectedSection = Boolean(!assignment && selectedSectionId);
  const availableSections = useMemo(() => {
    if (isAddingToSelectedSection) {
      const filteredSections = sections.filter(section => section.id === selectedSectionId);
      return filteredSections;
    }
    return sections;
  }, [sections, isAddingToSelectedSection, selectedSectionId]);

  const selectedSection = sections.find(s => s.id === selectedSectionId);

  const form = useForm<AssignmentFormData>({
    resolver: zodResolver(assignmentSchema),
    defaultValues: {
      sectionId: assignment?.sectionId || selectedSectionId || "",
      itemType: assignment?.itemType || "stockEntry",
      stockEntryId: assignment?.stockEntryId || "",
      menuItemId: assignment?.menuItemId || "",
      assignedQuantity: assignment?.assignedQuantity || undefined,
      assignedUnit: assignment?.assignedUnit || ""
    }
  });

  const watchedItemType = form.watch("itemType");
  const watchedSectionId = form.watch("sectionId");
  const watchedStockEntryId = form.watch("stockEntryId");
  const watchedMenuItemId = form.watch("menuItemId");
  const watchedQuantity = form.watch("assignedQuantity");
  const watchedUnit = form.watch("assignedUnit");

  const selectedStockEntry = stockEntries.find(entry => entry.id === watchedStockEntryId);
  const selectedMenuItem = menuItems.find(item => item.id === watchedMenuItemId);
  const material = selectedStockEntry ? materials.find(m => m.id === selectedStockEntry.materialId) : null;
  const availableUnits = material ? getSuggestedUnits(material.unitType) : [];

  useEffect(() => {
    if (formError) {
      setFormError(null);
    }
  }, [formError, watchedItemType, watchedStockEntryId, watchedMenuItemId]);

  useEffect(() => {
    form.reset({
      sectionId: assignment?.sectionId || selectedSectionId || "",
      itemType: assignment?.itemType || "stockEntry",
      stockEntryId: assignment?.stockEntryId || "",
      menuItemId: assignment?.menuItemId || "",
      assignedQuantity: assignment?.assignedQuantity || undefined,
      assignedUnit: assignment?.assignedUnit || ""
    });
  }, [assignment, selectedSectionId, form]);

  useEffect(() => {
    if (isAddingToSelectedSection && selectedSectionId) {
      const currentSectionId = form.getValues("sectionId");
      if (currentSectionId !== selectedSectionId) {
        form.setValue("sectionId", selectedSectionId);
      }
    }
  }, [isAddingToSelectedSection, selectedSectionId, form]);

  const getConvertedQuantityForComparison = useCallback(
    (assignedQty: number, assignedUnit: string, availableUnit: string): number => {
      if (!assignedQty || !assignedUnit || !availableUnit || !material) return assignedQty;
      if (assignedUnit === availableUnit) return assignedQty;
      if (isMassUnit(assignedUnit) && isMassUnit(availableUnit)) {
        return convertMass(assignedQty, assignedUnit, availableUnit);
      }
      if (isVolumeUnit(assignedUnit) && isVolumeUnit(availableUnit)) {
        return convertVolume(assignedQty, assignedUnit, availableUnit);
      }
      if (material?.unitType === "package" && material.packageQuantity) {
        if (assignedUnit === material.baseUnit && availableUnit === material.inputUnit) {
          return assignedQty / material.packageQuantity;
        }
        if (assignedUnit === material.inputUnit && availableUnit === material.baseUnit) {
          return assignedQty * material.packageQuantity;
        }
      }
      return assignedQty;
    },
    [material]
  );

  const estimatedCost = useMemo(() => {
    if (watchedItemType === "stockEntry") {
      if (!selectedStockEntry || !watchedQuantity || !watchedUnit) return 0;
      const costPerUnit = selectedStockEntry.costPerPurchasedUnit || 0;
      const purchasedUnit = selectedStockEntry.purchasedUnit;
      if (watchedUnit === purchasedUnit) {
        return watchedQuantity * costPerUnit;
      }
      const convertedQuantity = getConvertedQuantityForComparison(watchedQuantity, watchedUnit, purchasedUnit);
      return convertedQuantity * costPerUnit;
    } else if (watchedItemType === "menuItem") {
      if (!selectedMenuItem) return 0;
      return selectedMenuItem.price;
    }
    return 0;
  }, [watchedItemType, selectedStockEntry, selectedMenuItem, watchedQuantity, watchedUnit, getConvertedQuantityForComparison]);
  const isPackageUnit = material?.unitType === "package";
  const availableQuantity = selectedStockEntry?.purchasedQuantity || 0;
  const availableIndividualQuantity = selectedStockEntry?.purchasedIndividualQuantity;
  const convertedAssignedQuantity = watchedItemType === "stockEntry" && watchedQuantity && watchedUnit && selectedStockEntry ? getConvertedQuantityForComparison(watchedQuantity, watchedUnit, selectedStockEntry.purchasedUnit) : watchedQuantity || 0;
  const exceedsAvailableStock = watchedItemType === "stockEntry" && convertedAssignedQuantity > 0 && availableQuantity > 0 && convertedAssignedQuantity > availableQuantity;
  // Get already assigned items for the selected section to prevent duplications
  const assignedStockEntryIds = useMemo(() => {
    if (!watchedSectionId) return new Set();
    // Filter assignments that have stockEntryId (indicating they are stock entry assignments)
    const stockEntryAssignments = existingAssignments.filter(
      assignmentItem =>
        assignmentItem.sectionId === watchedSectionId &&
        assignmentItem.stockEntryId && // Has stockEntryId means it's a stock entry assignment
        (!assignment || assignmentItem.id !== assignment.id) // Allow editing current assignment
    );
    const stockEntryIds = stockEntryAssignments.map(assignment => assignment.stockEntryId);
    return new Set(stockEntryIds);
  }, [existingAssignments, watchedSectionId, assignment?.id]);

  const assignedMenuItemIds = useMemo(() => {
    if (!watchedSectionId) return new Set();
    // Filter assignments that have menuItemId (indicating they are menu item assignments)
    const menuItemAssignments = existingAssignments.filter(
      assignmentItem =>
        assignmentItem.sectionId === watchedSectionId &&
        assignmentItem.menuItemId && // Has menuItemId means it's a menu item assignment
        (!assignment || assignmentItem.id !== assignment.id) // Allow editing current assignment
    );
    const menuItemIds = menuItemAssignments.map(assignment => assignment.menuItemId);
    return new Set(menuItemIds);
  }, [existingAssignments, watchedSectionId, assignment?.id]);

  // Filtered lists for dropdowns (prevent duplications in individual selection)
  const availableStockEntries = useMemo(() => {
    return stockEntries.filter(entry => entry.purchasedQuantity > 0 && !assignedStockEntryIds.has(entry.id));
  }, [stockEntries, assignedStockEntryIds]);

  const availableMenuItems = useMemo(() => {
    return menuItems.filter(item => !assignedMenuItemIds.has(item.id));
  }, [menuItems, assignedMenuItemIds]);

  const availableItemsForAssignAll = useMemo(() => {
    if (watchedItemType === "stockEntry") {
      return availableStockEntries;
    } else if (watchedItemType === "menuItem") {
      return availableMenuItems;
    }
    return [];
  }, [watchedItemType, availableStockEntries, availableMenuItems]);
  const showAssignAllButton = !assignment && watchedSectionId && onAssignAll && availableItemsForAssignAll.length > 0;
  const handleAssignAll = async () => {
    if (!watchedSectionId || !onAssignAll || isAssigningAll) return;

    setIsAssigningAll(true);
    try {
      await onAssignAll(watchedSectionId, watchedItemType, availableItemsForAssignAll);
    } catch (error) {
      console.error("Error assigning all items:", error);
    } finally {
      setIsAssigningAll(false);
    }
  };

  const handleSubmit = async (data: AssignmentFormData) => {
    if (isLoading) return;
    setFormError(null);
    const isTemporaryId = (id: string | undefined) => {
      return id && (id.startsWith("temp-") || id.includes("temp"));
    };

    if (data.itemType === "stockEntry") {
      if (isTemporaryId(data.stockEntryId)) {
        const errorMsg = "Cannot create assignment: Stock entry is not yet saved. Please wait for the stock entry to be created first.";
        setFormError(errorMsg);
        console.error("Cannot submit assignment with temporary stock entry ID:", data.stockEntryId);
        return;
      }
    } else if (data.itemType === "menuItem") {
      if (isTemporaryId(data.menuItemId)) {
        const errorMsg = "Cannot create assignment: Menu item is not yet saved. Please wait for the menu item to be created first.";
        setFormError(errorMsg);
        console.error("Cannot submit assignment with temporary menu item ID:", data.menuItemId);
        return;
      }
    }
    let submissionData: CreateSectionAssignmentData | UpdateSectionAssignmentData;
    if (assignment) {
      submissionData = {} as UpdateSectionAssignmentData;
      if (data.sectionId !== assignment.sectionId) {
        submissionData.sectionId = data.sectionId;
      }
      if (data.itemType !== assignment.itemType) {
        submissionData.itemType = data.itemType;
      }

      if (data.itemType === "stockEntry") {
        const newMaterialId = selectedStockEntry?.materialId || "";
        if (newMaterialId !== assignment.materialId) {
          submissionData.materialId = newMaterialId;
        }
        if (data.stockEntryId !== assignment.stockEntryId) {
          submissionData.stockEntryId = data.stockEntryId;
        }
        if (data.assignedQuantity !== assignment.assignedQuantity) {
          submissionData.assignedQuantity = data.assignedQuantity;
        }
        if (data.assignedUnit !== assignment.assignedUnit) {
          submissionData.assignedUnit = data.assignedUnit;
        }
      } else if (data.itemType === "menuItem") {
        if (data.menuItemId !== assignment.menuItemId) {
          submissionData.menuItemId = data.menuItemId;
        }
      }
    } else {
      submissionData = {
        sectionId: data.sectionId,
        itemType: data.itemType
      } as CreateSectionAssignmentData;

      if (data.itemType === "stockEntry") {
        submissionData.materialId = selectedStockEntry?.materialId || "";
        submissionData.stockEntryId = data.stockEntryId;
        submissionData.assignedQuantity = data.assignedQuantity;
        submissionData.assignedUnit = data.assignedUnit;
      } else if (data.itemType === "menuItem") {
        submissionData.menuItemId = data.menuItemId;
      }
    }

    await onSubmit(submissionData);
  };

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader className="pb-4">
        <div className="flex items-center gap-2">
          <Package className="h-5 w-5" />
          <CardTitle className="text-lg sm:text-xl">{assignment ? "Edit Assignment" : isAddingToSelectedSection && selectedSection ? `Add Item to ${selectedSection.name}` : "Assign Item to Section"}</CardTitle>
        </div>
        <p className="text-sm text-muted-foreground mt-1">{assignment ? "Update the assignment details below" : isAddingToSelectedSection && selectedSection ? `Select an item type and specify details to add to the "${selectedSection.name}" section` : "Select an item type and specify details to assign to a section"}</p>
        {isAddingToSelectedSection && selectedSection && (
          <div className="mt-3">
            <Badge variant="secondary" className="text-sm">
              <Package className="h-3 w-3 mr-1" />
              Adding to: {selectedSection.name}
            </Badge>
          </div>
        )}
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            {/* Form Error Alert */}
            {formError && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{formError}</AlertDescription>
              </Alert>
            )}

            {/* Section and Item Type Selection */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="sectionId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium">Target Section *</FormLabel>
                    {isAddingToSelectedSection && selectedSection ? (
                      <div>
                        <div className="h-10 px-3 py-2 border border-input rounded-md bg-muted flex items-center justify-between">
                          <div className="flex flex-col">
                            <span className="font-medium text-foreground">{selectedSection.name}</span>
                          </div>
                          <Badge variant="outline" className="text-xs">
                            Pre-selected
                          </Badge>
                        </div>
                        <input type="hidden" {...field} value={selectedSectionId} />
                      </div>
                    ) : (
                      <Select onValueChange={field.onChange} value={field.value} disabled={isLoading}>
                        <FormControl>
                          <SelectTrigger className="h-10">
                            <SelectValue placeholder="Choose a section" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {availableSections.length === 0 ? (
                            <div className="p-2 text-sm text-muted-foreground text-center">No sections available</div>
                          ) : (
                            availableSections.map(section => {
                              return (
                                <SelectItem key={section.id} value={section.id}>
                                  <div className="flex flex-col">
                                    <span className="font-medium">{section.name}</span>
                                  </div>
                                </SelectItem>
                              );
                            })
                          )}
                        </SelectContent>
                      </Select>
                    )}
                    {isAddingToSelectedSection && selectedSection && <p className="text-xs text-muted-foreground mt-1">Section is pre-selected. To assign to a different section, use the main sections table.</p>}
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="itemType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium">Item Type *</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isLoading}>
                      <FormControl>
                        <SelectTrigger className="h-10">
                          <SelectValue placeholder="Choose item type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="stockEntry">
                          <div className="flex items-center gap-2">
                            <Package className="h-4 w-4" />
                            <span>Stock Entry</span>
                          </div>
                        </SelectItem>
                        <SelectItem value="menuItem">
                          <div className="flex items-center gap-2">
                            <DollarSign className="h-4 w-4" />
                            <span>Menu Item</span>
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Assign All Button */}
              {showAssignAllButton && (
                <div className="lg:col-span-2 mb-4">
                  <div className="rounded-lg border bg-blue-50 dark:bg-blue-950/20 p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Zap className="h-4 w-4 text-blue-600" />
                        <div>
                          <h3 className="font-medium text-sm text-blue-800 dark:text-blue-200">Bulk Assignment</h3>
                          <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                            Assign all {availableItemsForAssignAll.length} {watchedItemType === "stockEntry" ? "stock entries" : "menu items"} to the selected section at once
                          </p>
                        </div>
                      </div>
                      <Button type="button" variant="outline" size="sm" onClick={handleAssignAll} disabled={isAssigningAll || isLoading} className="border-blue-200 text-blue-700 hover:bg-blue-100 dark:border-blue-800 dark:text-blue-300 dark:hover:bg-blue-900/50">
                        {isAssigningAll ? (
                          <div className="flex items-center gap-2">
                            <div className="h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent" />
                            Assigning...
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <Zap className="h-3 w-3" />
                            Assign All ({availableItemsForAssignAll.length})
                          </div>
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Stock Entry Selection */}
            {watchedItemType === "stockEntry" && (
              <FormField
                control={form.control}
                name="stockEntryId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium">Stock Entry *</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isLoading}>
                      <FormControl>
                        <SelectTrigger className="h-10">
                          <SelectValue placeholder="Choose stock entry" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {availableStockEntries.length === 0 ? (
                          <div className="p-2 text-sm text-muted-foreground text-center">{stockEntries.length === 0 ? "No stock entries available" : "No unassigned stock entries available for this section"}</div>
                        ) : (
                          availableStockEntries.map(entry => {
                            const entryMaterial = materials.find(m => m.id === entry.materialId);
                            const isPackage = entryMaterial?.unitType === "package";
                            return (
                              <SelectItem key={entry.id} value={entry.id}>
                                <div className="flex items-center justify-between w-full">
                                  <div className="flex flex-col min-w-0 flex-1">
                                    <div className="flex items-center gap-2">
                                      <span className="font-medium truncate">{entryMaterial?.name}</span>
                                      {isPackage && (
                                        <Badge variant="secondary" className="text-xs">
                                          <Package className="h-3 w-3 mr-1" />
                                          Package
                                        </Badge>
                                      )}
                                    </div>
                                    <div className="text-xs text-muted-foreground">
                                      {formatNumber(entry.purchasedQuantity)} {entry.purchasedUnit} • {formatCurrency(entry.totalCost)}
                                      {entry.supplier && ` • ${entry.supplier}`}
                                    </div>
                                  </div>
                                </div>
                              </SelectItem>
                            );
                          })
                        )}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {/* Menu Item Selection */}
            {watchedItemType === "menuItem" && (
              <FormField
                control={form.control}
                name="menuItemId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium">Menu Item *</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isLoading}>
                      <FormControl>
                        <SelectTrigger className="h-10">
                          <SelectValue placeholder="Choose menu item" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {availableMenuItems.length === 0 ? (
                          <div className="p-2 text-sm text-muted-foreground text-center">{menuItems.length === 0 ? "No menu items available" : "No unassigned menu items available for this section"}</div>
                        ) : (
                          availableMenuItems.map(item => (
                            <SelectItem key={item.id} value={item.id}>
                              <div className="flex items-center justify-between w-full">
                                <div className="flex flex-col min-w-0 flex-1">
                                  <div className="flex items-center gap-2">
                                    <span className="font-medium truncate">{item.name}</span>
                                    <Badge variant="outline" className="text-xs">
                                      {item.category}
                                    </Badge>
                                  </div>
                                  <div className="text-xs text-muted-foreground">
                                    {formatCurrency(item.price)}
                                    {item.description && ` • ${item.description}`}
                                  </div>
                                </div>
                              </div>
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {/* Item Details */}
            {watchedItemType === "stockEntry" && selectedStockEntry && material && (
              <div className="rounded-lg border bg-muted/50 p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Info className="h-4 w-4 text-blue-500" />
                  <h3 className="font-medium text-sm">Stock Entry Details</h3>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Material:</span>
                    <div className="font-medium">{material.name}</div>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Available:</span>
                    <div className="font-medium">
                      {formatNumber(availableQuantity)} {selectedStockEntry.purchasedUnit}
                      {isPackageUnit && availableIndividualQuantity && (
                        <span className="text-xs text-muted-foreground ml-1">
                          ({formatNumber(availableIndividualQuantity)} {material.baseUnit})
                        </span>
                      )}
                    </div>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Cost per unit:</span>
                    <div className="font-medium">
                      {formatCurrency(selectedStockEntry.costPerPurchasedUnit || 0)}/{selectedStockEntry.purchasedUnit}
                    </div>
                  </div>
                  {selectedStockEntry.supplier && (
                    <div>
                      <span className="text-muted-foreground">Supplier:</span>
                      <div className="font-medium">{selectedStockEntry.supplier}</div>
                    </div>
                  )}
                  {selectedStockEntry.purchaseDate && (
                    <div>
                      <span className="text-muted-foreground">Purchase Date:</span>
                      <div className="font-medium">{new Date(selectedStockEntry.purchaseDate).toLocaleDateString()}</div>
                    </div>
                  )}
                  {selectedStockEntry.expiryDate && (
                    <div>
                      <span className="text-muted-foreground">Expiry Date:</span>
                      <div className="font-medium">{new Date(selectedStockEntry.expiryDate).toLocaleDateString()}</div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Menu Item Details */}
            {watchedItemType === "menuItem" && selectedMenuItem && (
              <div className="rounded-lg border bg-muted/50 p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Info className="h-4 w-4 text-blue-500" />
                  <h3 className="font-medium text-sm">Menu Item Details</h3>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Name:</span>
                    <div className="font-medium">{selectedMenuItem.name}</div>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Category:</span>
                    <div className="font-medium">{selectedMenuItem.category}</div>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Price:</span>
                    <div className="font-medium">{formatCurrency(selectedMenuItem.price)}</div>
                  </div>
                  {selectedMenuItem.description && (
                    <div className="sm:col-span-2 lg:col-span-3">
                      <span className="text-muted-foreground">Description:</span>
                      <div className="font-medium">{selectedMenuItem.description}</div>
                    </div>
                  )}
                  {((Array.isArray(selectedMenuItem.menuItemIngredients) && selectedMenuItem.menuItemIngredients.length > 0) || (Array.isArray(selectedMenuItem.ingredients) && selectedMenuItem.ingredients.length > 0)) && (
                    <div className="sm:col-span-2 lg:col-span-3">
                      <span className="text-muted-foreground">Ingredients:</span>
                      <div className="font-medium">
                        {Array.isArray(selectedMenuItem.menuItemIngredients) && selectedMenuItem.menuItemIngredients.length > 0
                          ? selectedMenuItem.menuItemIngredients.map((ingredient, index, array) => (
                              <span key={index}>
                                {ingredient.material?.name || "Unknown"} ({formatNumber(ingredient.quantity)} {ingredient.unit}){index < array.length - 1 ? ", " : ""}
                              </span>
                            ))
                          : Array.isArray(selectedMenuItem.ingredients)
                            ? /* Fallback to ingredients array with material lookup */
                              selectedMenuItem.ingredients.map((ingredient, index, array) => {
                                const ingredientMaterial = materials.find(m => String(m.id) === String(ingredient.materialId));
                                return (
                                  <span key={index}>
                                    {ingredientMaterial?.name || "Unknown"} ({formatNumber(ingredient.quantity)} {ingredient.unit}){index < array.length - 1 ? ", " : ""}
                                  </span>
                                );
                              })
                            : null}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Unit and Quantity Assignment - Only for Stock Entries */}
            {watchedItemType === "stockEntry" && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="assignedUnit"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium">Unit *</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isLoading || !material}>
                        <FormControl>
                          <SelectTrigger className="h-10">
                            <SelectValue placeholder="Select unit first" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {availableUnits.length === 0 ? (
                            <div className="p-2 text-sm text-muted-foreground text-center">{material ? "No units available" : "Select a stock entry first"}</div>
                          ) : (
                            availableUnits.map(unit => (
                              <SelectItem key={unit} value={unit}>
                                {unit}
                                {material && unit === material.baseUnit && (
                                  <Badge variant="outline" className="ml-2 text-xs">
                                    Base
                                  </Badge>
                                )}
                              </SelectItem>
                            ))
                          )}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="assignedQuantity"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium">Quantity to Assign *{watchedUnit && <span className="text-muted-foreground font-normal ml-1">({watchedUnit})</span>}</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input
                            type="number"
                            step="0.0001"
                            placeholder={watchedUnit ? `Enter amount in ${watchedUnit}` : "Select unit first"}
                            className="h-10 pr-12"
                            disabled={isLoading || !watchedUnit}
                            {...field}
                            value={field.value || ""}
                            onChange={e => {
                              const value = e.target.value;
                              field.onChange(value === "" ? undefined : parseFloat(value) || undefined);
                            }}
                          />
                          {exceedsAvailableStock && <AlertCircle className="absolute right-3 top-3 h-4 w-4 text-destructive" />}
                        </div>
                      </FormControl>
                      {exceedsAvailableStock && (
                        <Alert variant="destructive" className="mt-2">
                          <AlertCircle className="h-4 w-4" />
                          <AlertDescription>
                            Assigned quantity ({formatNumber(watchedQuantity)} {watchedUnit}) exceeds available stock ({formatNumber(availableQuantity)} {selectedStockEntry?.purchasedUnit})
                            {convertedAssignedQuantity !== watchedQuantity && (
                              <div className="text-xs mt-1 opacity-75">
                                Converted: {formatNumber(convertedAssignedQuantity)} {selectedStockEntry?.purchasedUnit} requested vs {formatNumber(availableQuantity)} {selectedStockEntry?.purchasedUnit} available
                              </div>
                            )}
                          </AlertDescription>
                        </Alert>
                      )}
                      {!watchedUnit && <p className="text-xs text-muted-foreground mt-1">Please select a unit first to enable quantity input</p>}
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            )}

            {/* Cost Estimation */}
            {estimatedCost > 0 && (
              <div className="rounded-lg border bg-green-50 dark:bg-green-950/20 p-4">
                <div className="flex items-center gap-2 mb-2">
                  <DollarSign className="h-4 w-4 text-green-600" />
                  <h3 className="font-medium text-sm text-green-800 dark:text-green-200">{watchedItemType === "stockEntry" ? "Estimated Assignment Cost" : "Menu Item Price"}</h3>
                </div>
                <div className="text-lg font-semibold text-green-700 dark:text-green-300">{formatCurrency(estimatedCost)}</div>
                <p className="text-xs text-green-600 dark:text-green-400 mt-1">{watchedItemType === "stockEntry" ? `Based on ${formatNumber(watchedQuantity)} ${watchedUnit} at ${formatCurrency(selectedStockEntry?.costPerPurchasedUnit || 0)} per unit` : `Menu item price: ${formatCurrency(selectedMenuItem?.price || 0)}`}</p>
              </div>
            )}

            <Separator />

            {/* Action Buttons */}
            <div className="flex flex-col-reverse sm:flex-row gap-3 justify-end pt-4">
              <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading} className="w-full sm:w-auto">
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading || !form.formState.isValid} className="w-full sm:w-auto">
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                    Processing...
                  </div>
                ) : assignment ? (
                  "Update Assignment"
                ) : (
                  "Create Assignment"
                )}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}

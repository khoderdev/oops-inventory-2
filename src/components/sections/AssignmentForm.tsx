import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { CreateSectionAssignmentData, Material, MenuItem, Section, SectionAssignment, StockEntry, UpdateSectionAssignmentData } from "@/types/inventory";
import { convertMass, convertVolume, formatCurrency, formatNumber, isMassUnit, isVolumeUnit } from "@/utils/conversionLogic";
import { getSuggestedUnits } from "@/utils/inventoryCalculations";
import { zodResolver } from "@hookform/resolvers/zod";
import { AlertCircle, DollarSign, Info, Package } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

const assignmentSchema = z
  .object({
    sectionId: z.string().min(1, "Section is required"),
    itemType: z.enum(["stockEntry", "menuItem"], { required_error: "Item type is required" }),
    stockEntryId: z.string().optional(),
    menuItemId: z.string().optional(),
    assignedQuantity: z.number().optional(),
    assignedUnit: z.string().optional()
  })
  .refine(
    data => {
      if (data.itemType === "stockEntry") {
        return data.stockEntryId && data.assignedQuantity && data.assignedQuantity > 0.0001 && data.assignedQuantity <= 999999 && data.assignedUnit;
      }
      if (data.itemType === "menuItem") {
        return data.menuItemId;
      }
      return false;
    },
    {
      message: "Please fill in all required fields for the selected item type",
      path: ["root"]
    }
  );

type AssignmentFormData = z.infer<typeof assignmentSchema>;

interface AssignmentFormProps {
  sections: Section[];
  stockEntries: StockEntry[];
  materials: Material[];
  menuItems: MenuItem[];
  assignment?: SectionAssignment;
  onSubmit: (data: CreateSectionAssignmentData | UpdateSectionAssignmentData) => void | Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
  selectedSectionId?: string;
}

export function AssignmentForm({ sections, stockEntries, materials, menuItems, assignment, onSubmit, onCancel, isLoading = false, selectedSectionId }: AssignmentFormProps) {
  const [formError, setFormError] = useState<string | null>(null);

  // Use refs to track previous values and reduce excessive logging
  const prevSelectedSectionIdRef = useRef<string | undefined>();
  const prevAssignmentRef = useRef<string | undefined>();
  const renderCountRef = useRef(0);

  renderCountRef.current += 1;

  // Only log when key values change
  const shouldLog = prevSelectedSectionIdRef.current !== selectedSectionId || prevAssignmentRef.current !== assignment?.id || renderCountRef.current === 1; // Always log first render

  if (shouldLog) {
    prevSelectedSectionIdRef.current = selectedSectionId;
    prevAssignmentRef.current = assignment?.id;
  }

  // Determine if we're adding a new assignment to a specific section
  const isAddingToSelectedSection = Boolean(!assignment && selectedSectionId);

  // Filter sections based on whether we're adding to a specific section
  const availableSections = useMemo(() => {
    if (isAddingToSelectedSection) {
      // When adding to a selected section, only show that section
      const filteredSections = sections.filter(section => section.id === selectedSectionId);
      return filteredSections;
    }
    // When editing or no specific section, show all sections
    return sections;
  }, [sections, isAddingToSelectedSection, selectedSectionId]);

  // Get the selected section name for display
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
  const watchedStockEntryId = form.watch("stockEntryId");
  const watchedMenuItemId = form.watch("menuItemId");
  const watchedQuantity = form.watch("assignedQuantity");
  const watchedUnit = form.watch("assignedUnit");

  const selectedStockEntry = stockEntries.find(entry => entry.id === watchedStockEntryId);
  const selectedMenuItem = menuItems.find(item => item.id === watchedMenuItemId);
  const material = selectedStockEntry ? materials.find(m => m.id === selectedStockEntry.materialId) : null;
  const availableUnits = material ? getSuggestedUnits(material.unitType) : [];

  // Clear form error when user changes selections
  useEffect(() => {
    if (formError) {
      setFormError(null);
    }
  }, [formError, watchedItemType, watchedStockEntryId, watchedMenuItemId]);

  // Reset form when assignment or selectedSectionId changes
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

  // Ensure sectionId field is properly set when adding to a specific section
  useEffect(() => {
    if (isAddingToSelectedSection && selectedSectionId) {
      const currentSectionId = form.getValues("sectionId");
      if (currentSectionId !== selectedSectionId) {
        form.setValue("sectionId", selectedSectionId);
      }
    }
  }, [isAddingToSelectedSection, selectedSectionId, form]);

  // Convert assigned quantity to same unit as available stock for comparison
  const getConvertedQuantityForComparison = useCallback(
    (assignedQty: number, assignedUnit: string, availableUnit: string): number => {
      if (!assignedQty || !assignedUnit || !availableUnit || !material) return assignedQty;

      // If units are the same, no conversion needed
      if (assignedUnit === availableUnit) return assignedQty;

      // Handle mass unit conversions
      if (isMassUnit(assignedUnit) && isMassUnit(availableUnit)) {
        return convertMass(assignedQty, assignedUnit, availableUnit);
      }

      // Handle volume unit conversions
      if (isVolumeUnit(assignedUnit) && isVolumeUnit(availableUnit)) {
        return convertVolume(assignedQty, assignedUnit, availableUnit);
      }

      // Handle package unit conversions
      if (material?.unitType === "package" && material.packageQuantity) {
        // If assigning in base unit but stock is in package unit
        if (assignedUnit === material.baseUnit && availableUnit === material.inputUnit) {
          return assignedQty / material.packageQuantity;
        }
        // If assigning in package unit but stock is in base unit
        if (assignedUnit === material.inputUnit && availableUnit === material.baseUnit) {
          return assignedQty * material.packageQuantity;
        }
      }

      // If no conversion possible, return original value
      return assignedQty;
    },
    [material]
  );

  // Calculate estimated cost with proper unit conversion
  const estimatedCost = useMemo(() => {
    if (watchedItemType === "stockEntry") {
      if (!selectedStockEntry || !watchedQuantity || !watchedUnit) return 0;

      const costPerUnit = selectedStockEntry.costPerPurchasedUnit || 0;
      const purchasedUnit = selectedStockEntry.purchasedUnit;

      // If assigned unit is the same as purchased unit, simple multiplication
      if (watchedUnit === purchasedUnit) {
        return watchedQuantity * costPerUnit;
      }

      // Convert assigned quantity to purchased unit for cost calculation
      const convertedQuantity = getConvertedQuantityForComparison(watchedQuantity, watchedUnit, purchasedUnit);
      return convertedQuantity * costPerUnit;
    } else if (watchedItemType === "menuItem") {
      if (!selectedMenuItem) return 0;
      return selectedMenuItem.price;
    }
    return 0;
  }, [watchedItemType, selectedStockEntry, selectedMenuItem, watchedQuantity, watchedUnit, getConvertedQuantityForComparison]);

  // Check if selected material is a package unit
  const isPackageUnit = material?.unitType === "package";

  // Get available stock quantity
  const availableQuantity = selectedStockEntry?.purchasedQuantity || 0;
  const availableIndividualQuantity = selectedStockEntry?.purchasedIndividualQuantity;

  // Get converted quantity for validation (only for stock entries)
  const convertedAssignedQuantity = watchedItemType === "stockEntry" && watchedQuantity && watchedUnit && selectedStockEntry ? getConvertedQuantityForComparison(watchedQuantity, watchedUnit, selectedStockEntry.purchasedUnit) : watchedQuantity || 0;

  // Check if assigned quantity exceeds available stock (after conversion) - only for stock entries
  const exceedsAvailableStock = watchedItemType === "stockEntry" && convertedAssignedQuantity > 0 && availableQuantity > 0 && convertedAssignedQuantity > availableQuantity;

  const handleSubmit = async (data: AssignmentFormData) => {
    if (isLoading) return;

    // Clear any previous form errors
    setFormError(null);

    // Validate that IDs are not temporary (optimistic update IDs)
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

    // Create submission data based on whether we're editing or creating
    let submissionData: CreateSectionAssignmentData | UpdateSectionAssignmentData;

    if (assignment) {
      // Editing existing assignment - use UpdateSectionAssignmentData (all fields optional)
      submissionData = {} as UpdateSectionAssignmentData;

      // Only include fields that have changed or are set
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
      // Creating new assignment - use CreateSectionAssignmentData (required fields)
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
              {selectedSection.description && <span className="text-xs text-muted-foreground ml-1">• {selectedSection.description}</span>}
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
                            {selectedSection.description && <span className="text-xs text-muted-foreground">{selectedSection.description}</span>}
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
                                    {section.description && <span className="text-xs text-muted-foreground truncate">{section.description}</span>}
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
                        {stockEntries.length === 0 ? (
                          <div className="p-2 text-sm text-muted-foreground text-center">No stock entries available</div>
                        ) : (
                          stockEntries.map(entry => {
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
                        {menuItems.length === 0 ? (
                          <div className="p-2 text-sm text-muted-foreground text-center">No menu items available</div>
                        ) : (
                          menuItems.map(item => (
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
                        {/* Use menuItemIngredients if available (has nested material data) */}
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

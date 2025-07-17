import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { CreateSectionAssignmentData, Material, Section, SectionAssignment, StockEntry } from "@/types/inventory";
import { formatCurrency, formatNumber } from "@/utils/conversionLogic";
import { getSuggestedUnits } from "@/utils/inventoryCalculations";
import { zodResolver } from "@hookform/resolvers/zod";
import { AlertCircle, DollarSign, Info, Package } from "lucide-react";
import { useMemo } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Textarea } from "../ui/textarea";

const assignmentSchema = z.object({
  sectionId: z.string().min(1, "Section is required"),
  stockEntryId: z.string().min(1, "Stock entry is required"),
  assignedQuantity: z.number().min(0.0001, "Quantity must be positive").max(999999, "Quantity is too large"),
  assignedUnit: z.string().min(1, "Unit is required"),
  notes: z
    .string()
    .optional()
    .refine(val => !val || val.length <= 500, "Notes must be 500 characters or less")
});

type AssignmentFormData = z.infer<typeof assignmentSchema>;

interface AssignmentFormProps {
  sections: Section[];
  stockEntries: StockEntry[];
  materials: Material[];
  assignment?: SectionAssignment;
  onSubmit: (data: CreateSectionAssignmentData) => void;
  onCancel: () => void;
  isLoading?: boolean;
  selectedSectionId?: string;
}

export function AssignmentForm({ sections, stockEntries, materials, assignment, onSubmit, onCancel, isLoading = false, selectedSectionId }: AssignmentFormProps) {
  const form = useForm<AssignmentFormData>({
    resolver: zodResolver(assignmentSchema),
    defaultValues: {
      sectionId: assignment?.sectionId || selectedSectionId || "",
      stockEntryId: assignment?.stockEntryId || "",
      assignedQuantity: assignment?.assignedQuantity || 0,
      assignedUnit: assignment?.assignedUnit || "",
      notes: assignment?.notes || ""
    }
  });

  const watchedStockEntryId = form.watch("stockEntryId");
  const watchedQuantity = form.watch("assignedQuantity");
  const watchedUnit = form.watch("assignedUnit");

  const selectedStockEntry = stockEntries.find(entry => entry.id === watchedStockEntryId);
  const material = selectedStockEntry ? materials.find(m => m.id === selectedStockEntry.materialId) : null;
  const availableUnits = material ? getSuggestedUnits(material.unitType) : [];

  // Calculate estimated cost
  const estimatedCost = useMemo(() => {
    if (!selectedStockEntry || !watchedQuantity || !watchedUnit) return 0;

    // Simple cost calculation - this could be enhanced with proper unit conversion
    const costPerUnit = selectedStockEntry.costPerPurchasedUnit || 0;
    return watchedQuantity * costPerUnit;
  }, [selectedStockEntry, watchedQuantity, watchedUnit]);

  // Check if selected material is a package unit
  const isPackageUnit = material?.unitType === "package";

  // Get available stock quantity
  const availableQuantity = selectedStockEntry?.purchasedQuantity || 0;
  const availableIndividualQuantity = selectedStockEntry?.purchasedIndividualQuantity;

  const handleSubmit = (data: AssignmentFormData) => {
    if (isLoading) return;

    // Add required fields that backend expects
    const submissionData: CreateSectionAssignmentData = {
      sectionId: data.sectionId,
      itemType: "stockEntry",
      materialId: selectedStockEntry?.materialId || "",
      stockEntryId: data.stockEntryId,
      assignedQuantity: data.assignedQuantity,
      assignedUnit: data.assignedUnit,
      notes: data.notes
    };
    onSubmit(submissionData);
  };

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader className="pb-4">
        <div className="flex items-center gap-2">
          <Package className="h-5 w-5" />
          <CardTitle className="text-lg sm:text-xl">{assignment ? "Edit Assignment" : "Assign Stock to Section"}</CardTitle>
        </div>
        <p className="text-sm text-muted-foreground mt-1">{assignment ? "Update the assignment details below" : "Select stock entry and specify quantity to assign to a section"}</p>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            {/* Section and Stock Entry Selection */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="sectionId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium">Target Section *</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isLoading}>
                      <FormControl>
                        <SelectTrigger className="h-10">
                          <SelectValue placeholder="Choose a section" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {sections.length === 0 ? (
                          <div className="p-2 text-sm text-muted-foreground text-center">No sections available</div>
                        ) : (
                          sections.map(section => (
                            <SelectItem key={section.id} value={section.id}>
                              <div className="flex flex-col">
                                <span className="font-medium">{section.name}</span>
                                {section.description && <span className="text-xs text-muted-foreground truncate">{section.description}</span>}
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
            </div>

            {/* Stock Entry Details */}
            {selectedStockEntry && material && (
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

            {/* Quantity and Unit Assignment */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="assignedQuantity"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium">Quantity to Assign *</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input type="number" step="0.0001" placeholder="0.00" className="h-10 pr-12" disabled={isLoading} {...field} onChange={e => field.onChange(parseFloat(e.target.value) || 0)} />
                        {watchedQuantity > 0 && availableQuantity > 0 && watchedQuantity > availableQuantity && <AlertCircle className="absolute right-3 top-3 h-4 w-4 text-destructive" />}
                      </div>
                    </FormControl>
                    {watchedQuantity > 0 && availableQuantity > 0 && watchedQuantity > availableQuantity && (
                      <Alert variant="destructive" className="mt-2">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>
                          Assigned quantity ({formatNumber(watchedQuantity)}) exceeds available stock ({formatNumber(availableQuantity)})
                        </AlertDescription>
                      </Alert>
                    )}
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="assignedUnit"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium">Unit *</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isLoading || !material}>
                      <FormControl>
                        <SelectTrigger className="h-10">
                          <SelectValue placeholder="Select unit" />
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
            </div>

            {/* Cost Estimation */}
            {estimatedCost > 0 && (
              <div className="rounded-lg border bg-green-50 dark:bg-green-950/20 p-4">
                <div className="flex items-center gap-2 mb-2">
                  <DollarSign className="h-4 w-4 text-green-600" />
                  <h3 className="font-medium text-sm text-green-800 dark:text-green-200">Estimated Assignment Cost</h3>
                </div>
                <div className="text-lg font-semibold text-green-700 dark:text-green-300">{formatCurrency(estimatedCost)}</div>
                <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                  Based on {formatNumber(watchedQuantity)} {watchedUnit} at {formatCurrency(selectedStockEntry?.costPerPurchasedUnit || 0)} per unit
                </p>
              </div>
            )}

            <Separator />

            {/* Notes */}
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium">Notes (Optional)</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Add any additional notes about this assignment..." className="resize-none min-h-[80px]" disabled={isLoading} maxLength={500} {...field} />
                  </FormControl>
                  <div className="flex justify-between items-center mt-1">
                    <FormMessage />
                    <span className="text-xs text-muted-foreground">{field.value?.length || 0}/500</span>
                  </div>
                </FormItem>
              )}
            />

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

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { Material, StockEntry, StockFormData, StockFormInputs } from "@/types/inventory";
import { format } from "date-fns";
import { CalendarIcon, Minus, Package, Plus, TrendingUp } from "lucide-react";
import { useEffect } from "react";
import { UseFormReturn } from "react-hook-form";
import { CostBreakdown } from "../CostBreakdown";

interface AddToEntryTabProps {
  form: UseFormReturn<StockFormInputs>;
  materials: Material[];
  availableUnits: string[];
  selectedMaterial: Material | undefined;
  watchedQuantity: string;
  watchedCostPerUnit: string;
  stockEntry: StockEntry;
  onAddToSpecificEntry: (data: StockFormData & { stockEntryId: string }) => void;
  onCancel: () => void;
}

export function AddToEntryTab({ form, materials, availableUnits, selectedMaterial, watchedQuantity, watchedCostPerUnit, stockEntry, onAddToSpecificEntry, onCancel }: AddToEntryTabProps) {
  const watchedUnit = form.watch("purchasedUnit");

  // Set default costPerPurchasedUnit based on unit and material
  useEffect(() => {
    if (selectedMaterial && stockEntry) {
      const packageCost = typeof selectedMaterial.costPerUnit === "string" ? parseFloat(selectedMaterial.costPerUnit) || 0 : selectedMaterial.costPerUnit || 0;
      const stockEntryCost = typeof stockEntry.costPerPurchasedUnit === "string" ? parseFloat(stockEntry.costPerPurchasedUnit) || 0 : stockEntry.costPerPurchasedUnit || 0;

      let defaultCost: number;
      if (selectedMaterial.unitType === "package" && (watchedUnit === "piece" || watchedUnit === "bottle") && selectedMaterial.packageQuantity) {
        // For bottle/piece units, use the stock entry's cost per box divided by package quantity
        defaultCost = stockEntryCost > 0 ? stockEntryCost / selectedMaterial.packageQuantity : packageCost / selectedMaterial.packageQuantity;
        form.clearErrors("costPerPurchasedUnit"); // Clear errors when switching to piece or bottle
      } else if (selectedMaterial.unitType === "package" && watchedUnit === selectedMaterial.inputUnit) {
        defaultCost = stockEntryCost || packageCost;
      } else {
        defaultCost = stockEntryCost || packageCost || 0;
      }

      if (defaultCost > 0) {
        form.setValue("costPerPurchasedUnit", defaultCost.toFixed(4));
      } else {
        form.setValue("costPerPurchasedUnit", "0.0000");
      }
    }
  }, [watchedUnit, selectedMaterial, stockEntry, form]);

  // Calculate totalCost
  useEffect(() => {
    const currentCost = parseFloat(watchedCostPerUnit) || 0;
    const quantity = parseFloat(watchedQuantity) || 0;
    if (selectedMaterial && !isNaN(currentCost) && !isNaN(quantity)) {
      // Calculate total cost
      const totalCost = (currentCost * quantity).toFixed(4);
      form.setValue("totalCost", totalCost);

      // Validate cost for non-piece/non-bottle units
      if (selectedMaterial.unitType === "package" && watchedUnit !== "piece" && watchedUnit !== "bottle" && selectedMaterial.inputUnit === watchedUnit) {
        const packageCost = typeof selectedMaterial.costPerUnit === "string" ? parseFloat(selectedMaterial.costPerUnit) || 0 : selectedMaterial.costPerUnit || 0;
        if (packageCost > 0 && Math.abs(currentCost - packageCost) / packageCost > 0.5) {
          form.setError("costPerPurchasedUnit", {
            type: "manual",
            message: `Cost per ${watchedUnit} ($${currentCost.toFixed(4)}) deviates significantly from expected ($${packageCost.toFixed(4)})`
          });
        } else {
          form.clearErrors("costPerPurchasedUnit");
        }
      } else {
        form.clearErrors("costPerPurchasedUnit");
      }
    } else {
      form.setValue("totalCost", "0.0000");
      form.clearErrors("costPerPurchasedUnit");
    }
  }, [watchedCostPerUnit, watchedQuantity, watchedUnit, selectedMaterial, form]);

  const handleSubmit = (data: StockFormInputs) => {
    const formData = data as unknown as StockFormData;
    const specificEntryData = {
      ...formData,
      stockEntryId: stockEntry.id,
      additionalQuantity: parseFloat(data.purchasedQuantity) || 0,
      unit: data.purchasedUnit,
      costPerPurchasedUnit: parseFloat(data.costPerPurchasedUnit) || 0,
      totalCost: parseFloat(data.totalCost) || 0
    };
    console.log("Submitting:", specificEntryData);
    onAddToSpecificEntry(specificEntryData);
  };

  return (
    <div className="space-y-6">
      <div className="bg-green-50 border border-green-200 rounded-xl p-4">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-green-100 rounded-lg">
            <TrendingUp className="h-5 w-5 text-green-600" />
          </div>
          <h3 className="text-lg font-semibold text-green-800">Add Quantity to This Entry</h3>
        </div>
        <p className="text-sm text-green-700 mb-4">
          Current stock: <strong>{stockEntry?.purchasedIndividualQuantity !== undefined && stockEntry?.purchasedIndividualUnit ? `${stockEntry.purchasedIndividualQuantity} ${stockEntry.purchasedIndividualUnit}` : `${stockEntry?.purchasedQuantity} ${stockEntry.purchasedUnit}`}</strong>. Add additional quantity to this specific entry.
          {selectedMaterial?.unitType === "package" && selectedMaterial?.packageQuantity && (
            <span className="block text-xs text-green-600 mt-1">
              ({selectedMaterial.packageQuantity} {selectedMaterial.baseUnit} per {selectedMaterial.inputUnit})
            </span>
          )}
          {stockEntry?.purchasedIndividualQuantity !== undefined && stockEntry?.purchasedIndividualUnit && (
            <span className="block text-xs text-green-600 mt-1">
              (equivalent to {stockEntry.purchasedQuantity} {stockEntry.purchasedUnit})
            </span>
          )}
        </p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
            <FormField
              control={form.control}
              name="materialId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2 text-sm font-medium text-gray-700">
                    <Package className="h-4 w-4 text-green-600" />
                    Material
                  </FormLabel>
                  <Select onValueChange={field.onChange} value={field.value} disabled>
                    <FormControl>
                      <SelectTrigger className="h-11 border-gray-300 bg-gray-50">
                        <SelectValue placeholder="Select material" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {materials.map(material => {
                        const displayUnit = material.unitType === "package" && material.inputUnit ? material.inputUnit : material.baseUnit;
                        return (
                          <SelectItem key={material.id} value={material.id}>
                            {material.name} ({displayUnit})
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-gray-500">Material is locked for this entry</p>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="purchasedQuantity"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2 text-sm font-medium text-gray-700">
                    <TrendingUp className="h-4 w-4 text-green-600" />
                    Additional Quantity
                  </FormLabel>
                  <FormControl>
                    <div className="flex items-center gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        className="h-11 w-11 border-gray-300 hover:border-red-500 hover:bg-red-50"
                        onClick={() => {
                          const currentValue = parseFloat(field.value) || 0;
                          const decrement = selectedMaterial?.unitType === "package" && (watchedUnit === "piece" || watchedUnit === "bottle") ? 1 : 1;
                          const newValue = Math.max(0, currentValue - decrement);
                          field.onChange((watchedUnit === "piece" || watchedUnit === "bottle") ? Math.round(newValue) : newValue);
                        }}
                        disabled={parseFloat(field.value) <= 0}
                      >
                        <Minus className="h-4 w-4" />
                      </Button>
                      <Input
                        type="number"
                        step={selectedMaterial?.unitType === "package" && (watchedUnit === "piece" || watchedUnit === "bottle") ? 1 : 1}
                        min="0"
                        placeholder="0"
                        {...field}
                        onChange={e => field.onChange((watchedUnit === "piece" || watchedUnit === "bottle") ? Math.round(parseFloat(e.target.value) || 0) : e.target.value)}
                        className="h-11 border-gray-300 focus:border-green-500 focus:ring-green-500 text-center font-medium overflow-hidden flex-1 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        className="h-11 w-11 border-gray-300 hover:border-green-500 hover:bg-green-50"
                        onClick={() => {
                          const currentValue = parseFloat(field.value) || 0;
                          const increment = selectedMaterial?.unitType === "package" && (watchedUnit === "piece" || watchedUnit === "bottle") ? 1 : 1;
                          const newValue = currentValue + increment;
                          field.onChange((watchedUnit === "piece" || watchedUnit === "bottle") ? Math.round(newValue) : newValue);
                        }}
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                  </FormControl>
                  <p className="text-xs text-green-600 mt-1">
                    This will be added to the existing {stockEntry?.purchasedQuantity} {stockEntry?.purchasedUnit}
                    {selectedMaterial?.unitType === "package" && (watchedUnit === "piece" || watchedUnit === "bottle") && <span className="block text-xs text-green-600 mt-1">Individual {watchedUnit} quantities are allowed</span>}
                  </p>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="purchasedUnit"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2 text-sm font-medium text-gray-700">
                    <Package className="h-4 w-4 text-green-600" />
                    Unit
                  </FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger className="h-11 border-gray-300 focus:border-green-500 focus:ring-green-500">
                        <SelectValue placeholder="Select unit" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {availableUnits.map(unit => (
                        <SelectItem key={unit} value={unit}>
                          {unit}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {(watchedUnit !== "piece" && watchedUnit !== "bottle") || selectedMaterial?.unitType !== "package" ? (
              <FormField
                control={form.control}
                name="costPerPurchasedUnit"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2 text-sm font-medium text-gray-700">
                      <Package className="h-4 w-4 text-green-600" />
                      Cost per Unit
                    </FormLabel>
                    <FormControl>
                      <Input type="number" step="0.0001" min="0" placeholder="0" {...field} className="h-11 border-gray-300 focus:border-green-500 focus:ring-green-500 text-center font-medium overflow-hidden flex-1 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" />
                    </FormControl>
                    <p className="text-xs text-green-600 mt-1">Cost per {watchedUnit || "unit"}</p>
                    <FormMessage />
                  </FormItem>
                )}
              />
            ) : (
              <FormItem>
                <FormLabel className="flex items-center gap-2 text-sm font-medium text-gray-700">
                  <Package className="h-4 w-4 text-green-600" />
                  Cost per {watchedUnit === "bottle" ? "Bottle" : "Piece"}
                </FormLabel>
                <p className="text-sm font-medium text-gray-900">${(() => {
                  const stockEntryCost = typeof stockEntry?.costPerPurchasedUnit === "string" ? parseFloat(stockEntry.costPerPurchasedUnit) || 0 : stockEntry?.costPerPurchasedUnit || 0;
                  const materialCost = typeof selectedMaterial?.costPerUnit === "string" ? parseFloat(selectedMaterial.costPerUnit) || 0 : selectedMaterial?.costPerUnit || 0;
                  const boxCost = stockEntryCost > 0 ? stockEntryCost : materialCost;
                  return (boxCost / (selectedMaterial?.packageQuantity || 1)).toFixed(4);
                })()} (fixed)</p>
                <p className="text-xs text-green-600 mt-1">Fixed cost: ${(() => {
                  const stockEntryCost = typeof stockEntry?.costPerPurchasedUnit === "string" ? parseFloat(stockEntry.costPerPurchasedUnit) || 0 : stockEntry?.costPerPurchasedUnit || 0;
                  const materialCost = typeof selectedMaterial?.costPerUnit === "string" ? parseFloat(selectedMaterial.costPerUnit) || 0 : selectedMaterial?.costPerUnit || 0;
                  const boxCost = stockEntryCost > 0 ? stockEntryCost : materialCost;
                  return (boxCost / (selectedMaterial?.packageQuantity || 1)).toFixed(4);
                })()} per {watchedUnit}</p>
              </FormItem>
            )}

            <FormField
              control={form.control}
              name="purchaseDate"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel className="flex items-center gap-2 text-sm font-medium text-gray-700">
                    <CalendarIcon className="h-4 w-4 text-green-600" />
                    Addition Date
                  </FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button variant="outline" className={cn("h-11 w-full pl-3 text-left font-normal border-gray-300 focus:border-green-500 focus:ring-green-500", !field.value && "text-muted-foreground")}>
                          {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar mode="single" selected={field.value} onSelect={field.onChange} disabled={date => date > new Date()} initialFocus className="p-3 pointer-events-auto" />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <CostBreakdown selectedMaterial={selectedMaterial} quantity={watchedQuantity} purchasedUnit={watchedUnit} costPerPurchasedUnit={watchedCostPerUnit} totalCost={form.watch("totalCost")} />

          <div className="flex gap-3 justify-end">
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
            <Button type="submit" className="bg-green-600 hover:bg-green-700 text-white" disabled={!!form.formState.errors.purchasedQuantity || !!form.formState.errors.costPerPurchasedUnit}>
              <TrendingUp className="h-4 w-4 mr-2" />
              Add to Entry
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}

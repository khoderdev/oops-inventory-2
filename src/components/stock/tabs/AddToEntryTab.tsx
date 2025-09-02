import { Button } from "@/components/ui/button";
import { formatNumberUI } from "@/utils/conversionLogic";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { AddToEntryTabProps } from "@/types/inventory";
import { format } from "date-fns";
import { CalendarIcon, Minus, Package, Plus, TrendingUp } from "lucide-react";
import { useEffect, useState } from "react";
import { CostBreakdown } from "../CostBreakdown";
import { Calendar } from "@/components/ui/calendar";
import { useWatch } from "react-hook-form";

export function AddToEntryTab({ form, materials, availableUnits, selectedMaterial, watchedQuantity, watchedCostPerUnit, watchedTotalCost, stockEntry, onAddToSpecificEntry, onCancel }: AddToEntryTabProps) {
  const getCurrentStockDisplay = (): string => {
    if (stockEntry?.totalVolume && stockEntry?.volumePerUnit && stockEntry?.purchasedUnit === "bottle") {
      const totalVolume = typeof stockEntry.totalVolume === "string" ? parseFloat(stockEntry.totalVolume) : stockEntry.totalVolume;

      const purchasedQuantity = typeof stockEntry?.purchasedIndividualQuantity === "string" || typeof stockEntry?.purchasedIndividualQuantity === "number" ? Number(stockEntry.purchasedIndividualQuantity) : 1;

      const formattedVolume = Number.isInteger(totalVolume) ? totalVolume.toString() : totalVolume.toFixed(0);
      const volumeUnit = stockEntry.volumeUnit || "ml";

      return `${formattedVolume} ${volumeUnit} from ${purchasedQuantity} ${purchasedQuantity === 1 ? "bottle" : "bottles"} main stock`;
    }

    const quantity = typeof stockEntry?.purchasedQuantity === "string" ? stockEntry.purchasedQuantity : String(stockEntry?.purchasedQuantity || "0");
    return `${quantity} ${stockEntry?.purchasedUnit || "units"}`;
  };
  const [isSubmitting, setIsSubmitting] = useState(false);
  const watchedUnit = form.watch("purchasedUnit");
  const watchedPurchasedQuantity = useWatch({ control: form.control, name: "purchasedQuantity" });
  const [lastChangedField, setLastChangedField] = useState<string | null>(null);

  useEffect(() => {
    const currentMaterialId = form.getValues("materialId");
    if (currentMaterialId !== undefined && typeof currentMaterialId === "number") {
      form.setValue("materialId", String(currentMaterialId));
    }
  }, [form]);

  useEffect(() => {
    if (selectedMaterial && stockEntry && watchedUnit) {
      const originalTotalCost = Number(stockEntry.totalCost) || 0;
      let originalQuantity = Number(stockEntry.purchasedQuantity) || 0;
      let costPerOriginalUnit = 0;
      if (originalQuantity === 0 && stockEntry.purchasedIndividualQuantity) {
        originalQuantity = Number(stockEntry.purchasedIndividualQuantity) || 0;
      }
      if (originalTotalCost === 0 || originalQuantity === 0) {
        form.setValue("costPerPurchasedUnit", "0", { shouldValidate: true });
        return;
      }
      costPerOriginalUnit = originalTotalCost / originalQuantity;
      let defaultCost: number;

      if (selectedMaterial.unitType === "package" && selectedMaterial.packageQuantity) {
        if (watchedUnit === selectedMaterial.baseUnit) {
          defaultCost = costPerOriginalUnit / selectedMaterial.packageQuantity;
        } else if (watchedUnit === "piece" || watchedUnit === "bottle") {
          defaultCost = costPerOriginalUnit / (selectedMaterial.packageQuantity || 1);
        } else if (watchedUnit === selectedMaterial.inputUnit) {
          defaultCost = costPerOriginalUnit;
        } else {
          defaultCost = costPerOriginalUnit;
        }
      } else if (watchedUnit === "g" && selectedMaterial.inputUnit === "kg") {
        defaultCost = costPerOriginalUnit / 1000;
      } else if (watchedUnit === "kg" && selectedMaterial.inputUnit === "g") {
        defaultCost = costPerOriginalUnit * 1000;
      } else if (watchedUnit === "ml" && selectedMaterial.inputUnit === "L") {
        defaultCost = costPerOriginalUnit / 1000;
      } else if (watchedUnit === "L" && selectedMaterial.inputUnit === "ml") {
        defaultCost = costPerOriginalUnit * 1000;
      } else {
        defaultCost = costPerOriginalUnit;
      }
      form.setValue("costPerPurchasedUnit", defaultCost.toString(), {
        shouldValidate: true,
        shouldDirty: true,
        shouldTouch: true
      });
      form.clearErrors("costPerPurchasedUnit");
    }
  }, [watchedUnit, selectedMaterial, stockEntry, form]);

  useEffect(() => {
    let currentCost = parseFloat(watchedCostPerUnit) || 0;
    const quantity = parseFloat(watchedPurchasedQuantity) || 0;
    if (selectedMaterial?.unitType === "package" && (watchedUnit === "piece" || watchedUnit === "bottle")) {
      const stockEntryCost = typeof stockEntry?.costPerPurchasedUnit === "string" ? parseFloat(stockEntry.costPerPurchasedUnit) || 0 : stockEntry?.costPerPurchasedUnit || 0;
      const materialCost = typeof selectedMaterial?.costPerUnit === "string" ? parseFloat(selectedMaterial.costPerUnit) || 0 : selectedMaterial?.costPerUnit || 0;
      const boxCost = stockEntryCost > 0 ? stockEntryCost : materialCost;
      const packageQuantity = selectedMaterial?.packageQuantity || 1;
      if (packageQuantity > 0) {
        currentCost = boxCost / packageQuantity;
      }
    }

    const calculatedTotal = !isNaN(currentCost) && !isNaN(quantity) ? currentCost * quantity : 0;
    form.setValue("totalCost", calculatedTotal.toString(), { shouldValidate: true });

    if (selectedMaterial && !isNaN(currentCost)) {
      if (selectedMaterial.unitType === "package" && watchedUnit !== "piece" && watchedUnit !== "bottle" && selectedMaterial.inputUnit === watchedUnit) {
        const packageCost = typeof selectedMaterial.costPerUnit === "string" ? parseFloat(selectedMaterial.costPerUnit) || 0 : selectedMaterial.costPerUnit || 0;
        if (packageCost > 0 && Math.abs(currentCost - packageCost) / packageCost > 0.5) {
          form.setError("costPerPurchasedUnit", {
            type: "manual",
            message: `Cost per ${watchedUnit} ($${formatNumberUI(currentCost)}) deviates significantly from expected ($${formatNumberUI(packageCost)})`
          });
        } else {
          form.clearErrors("costPerPurchasedUnit");
        }
      } else {
        form.clearErrors("costPerPurchasedUnit");
      }
    } else {
      form.clearErrors("costPerPurchasedUnit");
    }
  }, [watchedCostPerUnit, watchedPurchasedQuantity, watchedTotalCost, watchedUnit, selectedMaterial, form, lastChangedField]);

  const onSubmit = async (data: any) => {
    if (isSubmitting) {
      return;
    }
    setIsSubmitting(true);
    try {
      if (typeof data.materialId === "number") {
        form.setValue("materialId", String(data.materialId));
      }
      const additionalQuantity = parseFloat(data.purchasedQuantity);
      const costPerPurchasedUnit = parseFloat(data.costPerPurchasedUnit);
      const totalCost = parseFloat(data.totalCost);
      if (isNaN(additionalQuantity) || additionalQuantity <= 0) {
        console.error("❌ Invalid additional quantity:", { purchasedQuantity: data.purchasedQuantity, additionalQuantity });
        form.setError("purchasedQuantity", {
          type: "manual",
          message: "Additional quantity must be a positive number"
        });
        return;
      }
      if (!data.purchasedUnit) {
        console.error("❌ Missing unit:", { purchasedUnit: data.purchasedUnit });
        form.setError("purchasedUnit", {
          type: "manual",
          message: "Unit is required"
        });
        return;
      }
      if (!stockEntry?.id) {
        console.error("❌ No stock entry ID available");
        form.setError("materialId", {
          type: "manual",
          message: "Stock entry is required"
        });
        return;
      }
      const specificEntryData = {
        materialId: String(data.materialId),
        supplier: data.supplier,
        purchasedQuantity: additionalQuantity,
        purchasedUnit: data.purchasedUnit,
        costPerPurchasedUnit: isNaN(costPerPurchasedUnit) ? 0 : costPerPurchasedUnit,
        totalCost: isNaN(totalCost) ? 0 : Number(totalCost),
        purchaseDate: data.purchaseDate,
        expiryDate: data.expiryDate,
        batchNumber: data.batchNumber,
        notes: data.notes,
        stockEntryId: stockEntry.id
      };
      await onAddToSpecificEntry(specificEntryData);
    } catch (error) {
      console.error("❌ Error adding to specific entry:", error);
    } finally {
      setIsSubmitting(false);
    }
  };
  if (!stockEntry) {
    return (
      <div className="space-y-6">
        <div className="bg-red-50 border border-red-200 rounded-xl p-4">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-red-100 rounded-lg">
              <TrendingUp className="h-5 w-5 text-red-600" />
            </div>
            <h3 className="text-lg font-semibold text-red-800">No Stock Entry Selected</h3>
          </div>
          <p className="text-sm text-red-700 mb-4">Please select a stock entry from the table to add additional quantity to it.</p>
          <div className="flex gap-3 justify-end">
            <Button type="button" variant="outline" onClick={onCancel}>
              Go Back
            </Button>
          </div>
        </div>
      </div>
    );
  }

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
          Current total stock: <strong>{getCurrentStockDisplay()}</strong>. Add additional quantity to this specific entry.
        </p>
      </div>
      <Form {...form}>
        <div className="space-y-6">
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
                          <SelectItem key={material.id} value={String(material.id)}>
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
                          field.onChange(watchedUnit === "piece" || watchedUnit === "bottle" ? Math.round(newValue) : newValue);
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
                        onChange={e => {
                          const value = watchedUnit === "piece" || (watchedUnit === "bottle" && e.target.value !== "") ? Math.round(parseFloat(e.target.value) || 0) : e.target.value === "" ? "" : e.target.value;
                          field.onChange(value);
                          setLastChangedField("purchasedQuantity");
                        }}
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
                          field.onChange(watchedUnit === "piece" || watchedUnit === "bottle" ? Math.round(newValue) : newValue);
                        }}
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                  </FormControl>
                  <p className="text-xs text-green-600 mt-1">
                    This will be added to the existing {stockEntry?.purchasedQuantity || 0} {stockEntry?.purchasedUnit || "units"}
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
                      {(() => {
                        let materialUnits: string[] = [];
                        if (selectedMaterial) {
                          if (selectedMaterial.unitType === "package" && selectedMaterial.inputUnit) {
                            materialUnits = [selectedMaterial.inputUnit];
                            if (selectedMaterial.baseUnit && selectedMaterial.baseUnit !== selectedMaterial.inputUnit) {
                              materialUnits.push(selectedMaterial.baseUnit);
                            }
                            if (selectedMaterial.baseUnit === "ml" || selectedMaterial.baseUnit === "cl") {
                              if (!materialUnits.includes("bottle")) {
                                materialUnits.push("bottle");
                              }
                            } else {
                              if (!materialUnits.includes("piece")) {
                                materialUnits.push("piece");
                              }
                            }
                          } else if (selectedMaterial.unitType === "mass") {
                            materialUnits = ["g", "kg"];
                          } else if (selectedMaterial.unitType === "volume") {
                            materialUnits = ["ml", "L"];
                          } else {
                            materialUnits = [stockEntry?.purchasedUnit || ""];
                          }
                        }
                        materialUnits = [...new Set(materialUnits)].filter(unit => unit);
                        if (materialUnits.length === 0) {
                          materialUnits = [...new Set(availableUnits)].filter(unit => unit);
                        }
                        return materialUnits.map(unit => (
                          <SelectItem key={unit} value={unit}>
                            {unit}
                          </SelectItem>
                        ));
                      })()}
                    </SelectContent>
                  </Select>
                  {watchedUnit === "bottle" && (
                    <p className="text-xs text-blue-600 mt-1">
                      Each bottle contains{" "}
                      {(() => {
                        if (stockEntry?.volumePerUnit) {
                          return `${stockEntry.volumePerUnit} ${stockEntry.volumeUnit || "ml"}`;
                        } else if (selectedMaterial?.volumePerUnit) {
                          return `${selectedMaterial.volumePerUnit} ${selectedMaterial.volumeUnit || "ml"}`;
                        } else if (selectedMaterial?.volumePerBottle) {
                          return `${selectedMaterial.volumePerBottle} ${selectedMaterial.volumeUnit || "ml"}`;
                        } else {
                          return "standard volume";
                        }
                      })()}
                    </p>
                  )}
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
                      <Input type="number" step="0.0001" min="0" placeholder="0" {...field} value={field.value} readOnly className="h-11 border-gray-300 focus:border-green-500 focus:ring-green-500 text-center font-medium overflow-hidden flex-1 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none bg-gray-50" />
                    </FormControl>
                    <p className="text-xs text-green-600 mt-1">Cost per {watchedUnit || "unit"} (auto-calculated)</p>
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
                <p className="text-sm font-medium text-gray-900">
                  $
                  {(() => {
                    const stockEntryCost = typeof stockEntry?.costPerPurchasedUnit === "string" ? parseFloat(stockEntry.costPerPurchasedUnit) || 0 : stockEntry?.costPerPurchasedUnit || 0;
                    const materialCost = typeof selectedMaterial?.costPerUnit === "string" ? parseFloat(selectedMaterial.costPerUnit) || 0 : selectedMaterial?.costPerUnit || 0;
                    const boxCost = stockEntryCost > 0 ? stockEntryCost : materialCost;
                    const packageQuantity = selectedMaterial?.packageQuantity || 1;
                    const costPerPiece = packageQuantity > 0 ? boxCost / packageQuantity : 0;
                    return formatNumberUI(costPerPiece);
                  })()}{" "}
                  (calculated)
                </p>
                <p className="text-xs text-green-600 mt-1">
                  Calculated from: $
                  {(() => {
                    const stockEntryCost = typeof stockEntry?.costPerPurchasedUnit === "string" ? parseFloat(stockEntry.costPerPurchasedUnit) || 0 : stockEntry?.costPerPurchasedUnit || 0;
                    const materialCost = typeof selectedMaterial?.costPerUnit === "string" ? parseFloat(selectedMaterial.costPerUnit) || 0 : selectedMaterial?.costPerUnit || 0;
                    const boxCost = stockEntryCost > 0 ? stockEntryCost : materialCost;
                    return formatNumberUI(boxCost);
                  })()}{" "}
                  per {stockEntry?.purchasedUnit} ÷ {selectedMaterial?.packageQuantity || 1} {selectedMaterial?.baseUnit}
                </p>
              </FormItem>
            )}

            <FormField
              control={form.control}
              name="totalCost"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2 text-sm font-medium text-gray-700">
                    <Package className="h-4 w-4 text-green-600" />
                    Total Cost
                  </FormLabel>
                  <FormControl>
                    <Input type="number" step="0.01" min="0" placeholder="" value={field.value} readOnly className="h-11 border-gray-300 focus:border-green-500 focus:ring-green-500 text-center font-medium overflow-hidden flex-1 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none bg-gray-50" />
                  </FormControl>
                  <p className="text-xs text-green-600 mt-1">Total cost for all units (auto-calculated)</p>
                  <FormMessage />
                </FormItem>
              )}
            />

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

          <CostBreakdown
            selectedMaterial={selectedMaterial}
            quantity={watchedPurchasedQuantity}
            purchasedUnit={watchedUnit}
            costPerPurchasedUnit={
              selectedMaterial?.unitType === "package" && (watchedUnit === "piece" || watchedUnit === "bottle")
                ? (() => {
                    const stockEntryCost = typeof stockEntry?.costPerPurchasedUnit === "string" ? parseFloat(stockEntry.costPerPurchasedUnit) || 0 : stockEntry?.costPerPurchasedUnit || 0;
                    const materialCost = typeof selectedMaterial?.costPerUnit === "string" ? parseFloat(selectedMaterial.costPerUnit) || 0 : selectedMaterial?.costPerUnit || 0;
                    const boxCost = stockEntryCost > 0 ? stockEntryCost : materialCost;
                    const packageQuantity = selectedMaterial?.packageQuantity || 1;
                    return packageQuantity > 0 ? (boxCost / packageQuantity).toString() : "0";
                  })()
                : watchedCostPerUnit
            }
            totalCost={watchedTotalCost}
          />

          <div className="flex gap-3 justify-end">
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
            <Button type="button" className="bg-green-600 hover:bg-green-700 text-white" onClick={form.handleSubmit(onSubmit)} disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                  Adding...
                </>
              ) : (
                <>
                  <TrendingUp className="h-4 w-4 mr-2" />
                  Add to Entry
                </>
              )}
            </Button>
          </div>
        </div>
      </Form>
    </div>
  );
}

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { WasteFromEntryTabProps, StockFormData } from "@/types/inventory";
import { formatNumberUI, formatCurrencyUI } from "@/utils/conversionLogic";
import { calculateCostPerUnit, formatCostPerUnitDisplay } from "@/utils/costCalculations";
import { format } from "date-fns";
import { CalendarIcon, FileText, Minus, Package, Plus, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { useWatch } from "react-hook-form";
import { CostBreakdown } from "../CostBreakdown";

export function WasteFromEntryTab({ form, materials, availableUnits, selectedMaterial, watchedQuantity, watchedCostPerUnit, watchedTotalCost, stockEntry, onRecordWaste, onCancel }: WasteFromEntryTabProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const watchedUnit = form.watch("purchasedUnit");
  const watchedWasteQuantity = useWatch({ control: form.control, name: "wasteQuantity" });
  const [lastChangedField, setLastChangedField] = useState<string | null>(null);

  // Format quantity to a reasonable number of decimal places
  const formatQuantity = (value: string | number): string => {
    if (!value && value !== 0) return "";

    const numValue = typeof value === "string" ? parseFloat(value) : value;

    if (isNaN(numValue)) return "";

    // For whole numbers, return as is
    if (Number.isInteger(numValue)) return numValue.toString();

    // For values with many decimal places, format appropriately
    // Use 2 decimal places for most values, but handle special cases
    const decimalPlaces = Math.abs(numValue) < 0.01 ? 4 : 2;

    // Format the number with the appropriate decimal places
    const formatted = numValue.toFixed(decimalPlaces);

    // Remove trailing zeros after the decimal point
    return formatted.replace(/(\.\d*?)0+$/, "$1").replace(/\.$/, "");
  };

  const getCurrentStockDisplay = (): string => {
    if (stockEntry?.totalVolume && stockEntry?.volumePerUnit && stockEntry?.purchasedUnit === "bottle") {
      const totalVolume = typeof stockEntry.totalVolume === "string" ? parseFloat(stockEntry.totalVolume) : stockEntry.totalVolume;
      const volumePerUnit = typeof stockEntry.volumePerUnit === "string" ? parseFloat(stockEntry.volumePerUnit) : stockEntry.volumePerUnit;

      // Calculate actual bottle count from total volume
      const actualBottleCount = Math.round(totalVolume / volumePerUnit * 100) / 100;

      const formattedVolume = Number.isInteger(totalVolume) ? totalVolume.toString() : totalVolume.toFixed(0);
      const volumeUnit = stockEntry.volumeUnit || "ml";

      return `${formattedVolume} ${volumeUnit} from ${actualBottleCount} ${actualBottleCount === 1 ? "bottle" : "bottles"} main stock`;
    }

    // For non-bottle items or when totalVolume is not available
    let quantity = stockEntry?.purchasedQuantity;
    if (!quantity || Number(quantity) === 0) {
      // Fallback to purchasedIndividualQuantity if purchasedQuantity is 0
      quantity = stockEntry?.purchasedIndividualQuantity;
    }
    const displayQuantity = typeof quantity === "string" ? quantity : String(quantity || "0");
    return `${displayQuantity} ${stockEntry?.purchasedUnit || "units"}`;
  };

  useEffect(() => {
    const currentMaterialId = form.getValues("materialId");
    if (currentMaterialId !== undefined && typeof currentMaterialId === "number") {
      form.setValue("materialId", String(currentMaterialId));
    }

    // Set default unit if not already set
    const currentUnit = form.getValues("purchasedUnit");
    if (!currentUnit && selectedMaterial) {
      // Determine available units
      let materialUnits: string[] = [];
      if (selectedMaterial.unitType === "package" && selectedMaterial.inputUnit) {
        materialUnits = [selectedMaterial.inputUnit];
        if (selectedMaterial.baseUnit && selectedMaterial.baseUnit !== selectedMaterial.inputUnit) {
          materialUnits.push(selectedMaterial.baseUnit);
        }
        if (selectedMaterial.baseUnit === "ml" || selectedMaterial.baseUnit === "cl") {
          if (!materialUnits.includes("bottle")) {
            materialUnits.push("bottle");
          }
          if (!materialUnits.includes("ml")) {
            materialUnits.push("ml");
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

      materialUnits = [...new Set(materialUnits)].filter(unit => unit);
      if (materialUnits.length === 0) {
        materialUnits = [...new Set(availableUnits)].filter(unit => unit);
      }

      // Set the first available unit as default
      if (materialUnits.length > 0) {
        form.setValue("purchasedUnit", materialUnits[0], {
          shouldValidate: true,
          shouldDirty: true,
          shouldTouch: true
        });
      }
    }
  }, [form, selectedMaterial, stockEntry, availableUnits]);

  useEffect(() => {
    if (selectedMaterial && stockEntry && watchedUnit) {
      const originalTotalCost = Number(stockEntry.totalCost) || 0;
      let originalQuantity = Number(stockEntry.purchasedQuantity) || 0;
      let costPerOriginalUnit = 0;
      
      // Handle bottle-based materials with volume data
      if (stockEntry.purchasedUnit === "bottle" && stockEntry.totalVolume && stockEntry.volumePerUnit) {
        const totalVolume = typeof stockEntry.totalVolume === "string" ? parseFloat(stockEntry.totalVolume) : stockEntry.totalVolume;
        const volumePerUnit = typeof stockEntry.volumePerUnit === "string" ? parseFloat(stockEntry.volumePerUnit) : stockEntry.volumePerUnit;
        originalQuantity = totalVolume / volumePerUnit; // Calculate actual bottle count
      } else if (originalQuantity === 0 && stockEntry.purchasedIndividualQuantity) {
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
    const quantity = parseFloat(watchedWasteQuantity) || 0;
    const costPerUnit = parseFloat(watchedCostPerUnit) || 0;
    const totalCost = parseFloat(watchedTotalCost) || 0;
    if (lastChangedField === "totalCost" && quantity > 0) {
      // Calculate cost per unit from total cost
      const calculatedCostPerUnit = totalCost / quantity;
      form.setValue("costPerPurchasedUnit", isNaN(calculatedCostPerUnit) ? "0" : calculatedCostPerUnit.toString());
    } else if (lastChangedField === "wasteQuantity" || lastChangedField === "costPerPurchasedUnit" || !lastChangedField) {
      // Calculate total cost from quantity and cost per unit
      const calculatedTotalCost = quantity * costPerUnit;
      form.setValue("totalCost", isNaN(calculatedTotalCost) ? "0" : calculatedTotalCost.toString());
    }
  }, [watchedWasteQuantity, watchedCostPerUnit, watchedTotalCost, watchedUnit, form, stockEntry, selectedMaterial, lastChangedField]);

  const onSubmit = async (data: any) => {
    if (isSubmitting) {
      return;
    }
    setIsSubmitting(true);
    try {
      if (typeof data.materialId === "number") {
        form.setValue("materialId", String(data.materialId));
      }
      const wasteQuantity = parseFloat(data.wasteQuantity);
      const costPerPurchasedUnit = parseFloat(data.costPerPurchasedUnit);
      const totalCost = parseFloat(data.totalCost);
      if (isNaN(wasteQuantity) || wasteQuantity <= 0) {
        form.setError("wasteQuantity", {
          type: "manual",
          message: "Waste quantity must be a positive number"
        });
        return;
      }

      if (!data.purchasedUnit) {
        form.setError("purchasedUnit", {
          type: "manual",
          message: "Unit is required"
        });
        return;
      }
      if (!stockEntry?.id) {
        form.setError("materialId", {
          type: "manual",
          message: "Stock entry is required"
        });
        return;
      }
      const wasteData = {
        materialId: String(data.materialId),
        supplier: data.supplier || stockEntry.supplier,
        wasteQuantity: wasteQuantity,
        purchasedQuantity: stockEntry.purchasedQuantity,
        purchasedUnit: data.purchasedUnit,
        costPerPurchasedUnit: isNaN(costPerPurchasedUnit) ? 0 : costPerPurchasedUnit,
        totalCost: isNaN(totalCost) ? 0 : Number(totalCost),
        purchaseDate: data.purchaseDate,
        wasteDate: data.wasteDate,
        expiryDate: data.expiryDate,
        batchNumber: data.batchNumber,
        notes: data.notes,
        wasteReason: data.wasteReason,
        stockEntryId: stockEntry.id
      };
      await onRecordWaste(wasteData);
    } catch (error) {
      console.error("❌ Error recording waste:", error);
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
              <Trash2 className="h-5 w-5 text-red-600" />
            </div>
            <h3 className="text-lg font-semibold text-red-800">No Stock Entry Selected</h3>
          </div>
          <p className="text-sm text-red-700 mb-4">Please select a stock entry from the table to record waste from it.</p>
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
      <div className="bg-red-50 border border-red-200 rounded-xl p-4">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-red-100 rounded-lg">
            <Trash2 className="h-5 w-5 text-red-600" />
          </div>
          <h3 className="text-lg font-semibold text-red-800">Record Waste from This Entry</h3>
        </div>
        <p className="text-sm text-red-700 mb-4">
          Current stock: <strong>{getCurrentStockDisplay()}</strong>. Record waste/spoilage from this specific entry.
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
                    <Package className="h-4 w-4 text-red-600" />
                    Material
                  </FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger className="h-11 border-gray-300">
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
                  <p className="text-xs text-gray-500">Select the material you want to record waste for</p>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Stock Entry Selection */}
            <FormField
              control={form.control}
              name="stockEntryId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2 text-sm font-medium text-gray-700">
                    <Package className="h-4 w-4 text-red-600" />
                    Stock Entry
                  </FormLabel>
                  <Select
                    onValueChange={value => {
                      field.onChange(value);
                      // Set the unit to match the stock entry's unit
                      if (stockEntry) {
                        form.setValue("purchasedUnit", stockEntry.purchasedUnit || "");
                      }
                    }}
                    value={stockEntry?.id || field.value}
                    disabled={true} // Always disabled since we auto-select
                  >
                    <FormControl>
                      <SelectTrigger className="h-11 border-gray-300">
                        <SelectValue placeholder={stockEntry ? "Auto-selected entry" : "No entry available"} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {stockEntry && (
                        <SelectItem key={stockEntry.id} value={stockEntry.id}>
                          {getCurrentStockDisplay()} (purchased: {new Date(stockEntry.purchaseDate).toLocaleDateString()})
                        </SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-gray-500">{stockEntry ? "This stock entry is auto-selected for waste recording" : "No stock entry available"}</p>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="wasteQuantity"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2 text-sm font-medium text-gray-700">
                    <Trash2 className="h-4 w-4 text-red-600" />
                    Waste Quantity
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
                          const newValue = Math.max(0, currentValue - 1);
                          field.onChange(newValue.toString());
                        }}
                        disabled={parseInt(field.value) <= 0}
                      >
                        <Minus className="h-4 w-4" />
                      </Button>
                      <Input
                        type="number"
                        step="1"
                        min="0"
                        placeholder="0"
                        {...field}
                        value={field.value || ""}
                        onChange={e => {
                          field.onChange(e.target.value);
                          setLastChangedField("wasteQuantity");
                        }}
                        className="h-11 border-gray-300 focus:border-red-500 focus:ring-red-500 text-center font-medium overflow-hidden flex-1 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        className="h-11 w-11 border-gray-300 hover:border-red-500 hover:bg-red-50"
                        onClick={() => {
                          const currentValue = parseFloat(field.value) || 0;
                          const newValue = currentValue + 1;
                          field.onChange(newValue.toString());
                        }}
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                  </FormControl>
                  <p className="text-xs text-red-600 mt-1">
                    This will be removed from the existing {(() => {
                      if (stockEntry?.totalVolume && stockEntry?.volumePerUnit && stockEntry?.purchasedUnit === "bottle") {
                        const totalVolume = typeof stockEntry.totalVolume === "string" ? parseFloat(stockEntry.totalVolume) : stockEntry.totalVolume;
                        const volumePerUnit = typeof stockEntry.volumePerUnit === "string" ? parseFloat(stockEntry.volumePerUnit) : stockEntry.volumePerUnit;
                        const actualBottleCount = Math.round(totalVolume / volumePerUnit * 100) / 100;
                        return `${totalVolume} ml from ${actualBottleCount} bottles`;
                      }
                      return `${stockEntry?.purchasedQuantity || 0} ${stockEntry?.purchasedUnit || "units"}`;
                    })()}
                    {selectedMaterial?.unitType === "package" && (watchedUnit === "piece" || watchedUnit === "bottle") && <span className="block text-xs text-red-600 mt-1">Individual {watchedUnit} quantities are allowed</span>}
                    {selectedMaterial?.unitType === "package" && watchedUnit === "ml" && <span className="block text-xs text-red-600 mt-1">Removing in ml will be converted from bottle quantities ({stockEntry?.volumePerUnit || selectedMaterial?.volumePerUnit || 700}ml = 1 bottle)</span>}
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
                    <Package className="h-4 w-4 text-red-600" />
                    Unit
                  </FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger className="h-11 border-gray-300 focus:border-red-500 focus:ring-red-500">
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
                              // Add ml as an option for bottle-based materials
                              if (!materialUnits.includes("ml")) {
                                materialUnits.push("ml");
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
                  {watchedUnit === "ml" && selectedMaterial?.unitType === "package" && (
                    <p className="text-xs text-blue-600 mt-1">
                      {(() => {
                        const volumePerUnit = stockEntry?.volumePerUnit || selectedMaterial?.volumePerUnit || selectedMaterial?.volumePerBottle || 700;
                        return `${volumePerUnit}ml = 1 bottle`;
                      })()}
                    </p>
                  )}
                  {watchedUnit === "piece" && selectedMaterial?.unitType === "package" && (
                    <p className="text-xs text-blue-600 mt-1">
                      Individual pieces from package materials
                    </p>
                  )}
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="wasteReason"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2 text-sm font-medium text-gray-700">
                    <FileText className="h-4 w-4 text-red-600" />
                    Waste Reason
                  </FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger className="h-11 border-gray-300 focus:border-red-500 focus:ring-red-500">
                        <SelectValue placeholder="Select reason" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="staff">🧑‍💼 Staff Use</SelectItem>
                      <SelectItem value="expired">🗓️ Expired</SelectItem>
                      <SelectItem value="damaged">💔 Damaged</SelectItem>
                      <SelectItem value="other">❓ Other</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="totalCost"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2 text-sm font-medium text-gray-700">
                    <Package className="h-4 w-4 text-red-600" />
                    Total Cost
                  </FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="0"
                      {...field}
                      onChange={e => {
                        field.onChange(e.target.value);
                        setLastChangedField("totalCost");
                      }}
                      className="h-11 border-gray-300 focus:border-red-500 focus:ring-red-500 text-center font-medium overflow-hidden flex-1 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    />
                  </FormControl>
                  <p className="text-xs text-red-600 mt-1">Total cost for all wasted units</p>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="wasteDate"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel className="flex items-center gap-2 text-sm font-medium text-gray-700">
                    <CalendarIcon className="h-4 w-4 text-red-600" />
                    Waste Date
                  </FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button variant="outline" className={cn("h-11 w-full pl-3 text-left font-normal border-gray-300 focus:border-red-500 focus:ring-red-500", !field.value && "text-muted-foreground")}>
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

          {/* Original Entry Cost Context */}
          {stockEntry && (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-4">
              <h4 className="text-sm font-medium text-gray-700 mb-2">Original Entry Cost Information</h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-500">Original Total Cost:</span>
                  <span className="ml-2 font-medium">{formatCurrencyUI(stockEntry.totalCost || 0)}</span>
                </div>
                <div>
                  <span className="text-gray-500">Original Quantity:</span>
                  <span className="ml-2 font-medium">
                    {(() => {
                      if (stockEntry.totalVolume && stockEntry.volumePerUnit && stockEntry.purchasedUnit === "bottle") {
                        const totalVolume = typeof stockEntry.totalVolume === "string" ? parseFloat(stockEntry.totalVolume) : stockEntry.totalVolume;
                        const volumePerUnit = typeof stockEntry.volumePerUnit === "string" ? parseFloat(stockEntry.volumePerUnit) : stockEntry.volumePerUnit;
                        const actualBottleCount = Math.round(totalVolume / volumePerUnit * 100) / 100;
                        return `${actualBottleCount} ${actualBottleCount === 1 ? "bottle" : "bottles"}`;
                      }
                      return `${stockEntry.purchasedQuantity || "0"} ${stockEntry.purchasedUnit || "units"}`;
                    })()}
                  </span>
                </div>
                <div>
                  <span className="text-gray-500">Cost per {(() => {
                    if (stockEntry.totalVolume && stockEntry.volumePerUnit && stockEntry.purchasedUnit === "bottle") {
                      return "bottle";
                    }
                    return stockEntry.purchasedUnit || "unit";
                  })()}:</span>
                  <span className="ml-2 font-medium">${(() => {
                    const totalCost = Number(stockEntry.totalCost || 0);
                    if (stockEntry.totalVolume && stockEntry.volumePerUnit && stockEntry.purchasedUnit === "bottle") {
                      const totalVolume = typeof stockEntry.totalVolume === "string" ? parseFloat(stockEntry.totalVolume) : stockEntry.totalVolume;
                      const volumePerUnit = typeof stockEntry.volumePerUnit === "string" ? parseFloat(stockEntry.volumePerUnit) : stockEntry.volumePerUnit;
                      const actualBottleCount = totalVolume / volumePerUnit;
                      return formatNumberUI(totalCost / actualBottleCount);
                    }
                    return formatNumberUI(totalCost / Number(stockEntry.purchasedQuantity || 1));
                  })()}</span>
                </div>
                <div>
                  <span className="text-gray-500">Remaining Stock:</span>
                  <span className="ml-2 font-medium">{getCurrentStockDisplay()}</span>
                </div>
              </div>
            </div>
          )}

          <CostBreakdown selectedMaterial={selectedMaterial} quantity={watchedWasteQuantity} purchasedUnit={watchedUnit} costPerPurchasedUnit={watchedCostPerUnit} totalCost={watchedTotalCost} />

          <div className="flex gap-3 justify-end">
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
            <Button type="button" className="bg-red-600 hover:bg-red-700 text-white" onClick={form.handleSubmit(onSubmit)}>
              <Trash2 className="h-4 w-4 mr-2" />
              Record Waste
            </Button>
          </div>
        </div>
      </Form>
    </div>
  );
}

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { WasteFromEntryTabProps } from "@/types/inventory";
import { formatNumberUI, formatCurrencyUI } from "@/utils/conversionLogic";
import { format } from "date-fns";
import { CalendarIcon, FileText, Minus, Package, Plus, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { useWatch } from "react-hook-form";
import { calculateCostPerUnit, formatQuantity } from "@/utils/costCalculations";
import { VirtualSelect } from "@/components/ui/VirtualSelect";

export function WasteFromEntryTab({ form, materials, availableUnits, selectedMaterial, watchedQuantity, watchedCostPerUnit, watchedTotalCost, stockEntry, onRecordWaste, onCancel }: WasteFromEntryTabProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const watchedUnit = form.watch("purchasedUnit");
  const watchedWasteQuantity = useWatch({ control: form.control, name: "wasteQuantity" });
  const [lastChangedField, setLastChangedField] = useState<string | null>(null);

  const getCurrentStockDisplay = (): string => {
    if (stockEntry?.totalVolume && stockEntry?.volumePerUnit && stockEntry?.purchasedUnit === "bottle") {
      const totalVolume = typeof stockEntry.totalVolume === "string" ? parseFloat(stockEntry.totalVolume) : stockEntry.totalVolume;
      const volumePerUnit = typeof stockEntry.volumePerUnit === "string" ? parseFloat(stockEntry.volumePerUnit) : stockEntry.volumePerUnit;
      const actualBottleCount = Math.round((totalVolume / volumePerUnit) * 100) / 100;
      const formattedVolume = Number.isInteger(totalVolume) ? totalVolume.toString() : totalVolume.toFixed(0);
      const volumeUnit = stockEntry.volumeUnit || "ml";
      return `${formattedVolume} ${volumeUnit} from ${actualBottleCount} ${actualBottleCount === 1 ? "bottle" : "bottles"} main stock`;
    }

    // For package materials with pieces information (like bags of buns)
    if (stockEntry?.totalPieces && stockEntry?.piecesPerPackage && (stockEntry?.purchasedUnit === "bag" || stockEntry?.purchasedUnit === "pack" || stockEntry?.purchasedUnit === "package")) {
      const totalPieces = typeof stockEntry.totalPieces === "string" ? parseInt(stockEntry.totalPieces) : stockEntry.totalPieces;
      const purchasedQuantity = typeof stockEntry.purchasedQuantity === "string" ? parseFloat(stockEntry.purchasedQuantity) : stockEntry.purchasedQuantity;
      const packageUnit = stockEntry.purchasedUnit === "bag" ? "bags" : stockEntry.purchasedUnit === "pack" ? "packs" : "packages";

      return `${purchasedQuantity} ${packageUnit} (${totalPieces} pieces)`;
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
    if (lastChangedField === "totalCost") return;

    let currentCost = parseFloat(watchedCostPerUnit || "0");
    let quantity = parseFloat(watchedWasteQuantity || "0");

    if (selectedMaterial?.unitType === "package") {
      const stockEntryCost = typeof stockEntry?.costPerPurchasedUnit === "string" ? parseFloat(stockEntry.costPerPurchasedUnit) || 0 : stockEntry?.costPerPurchasedUnit || 0;
      const materialCost = typeof selectedMaterial?.costPerUnit === "string" ? parseFloat(selectedMaterial.costPerUnit) || 0 : selectedMaterial?.costPerUnit || 0;
      const boxCost = stockEntryCost > 0 ? stockEntryCost : materialCost;

      if (watchedUnit === "ml") {
        // Calculate cost per ml for bottle-based materials
        const volumePerUnit = stockEntry?.volumePerUnit || selectedMaterial?.volumePerUnit || 700;
        if (volumePerUnit > 0) {
          // Format to 4 decimal places for readability
          currentCost = parseFloat((boxCost / volumePerUnit).toFixed(4));
        }
      } else if (watchedUnit === "piece" || watchedUnit === "bottle") {
        // Calculate cost per piece/bottle
        const packageQuantity = selectedMaterial?.packageQuantity || 1;
        if (packageQuantity > 0) {
          currentCost = boxCost / packageQuantity;
        }
      }
    }

    // Use dynamic cost calculation for consistent formatting with CostBreakdown
    let calculatedTotal = 0;

    if (selectedMaterial && !isNaN(quantity)) {
      // Calculate costs directly like in CostBreakdown component
      if (selectedMaterial.unitType === "package" && (selectedMaterial.baseUnit === "ml" || selectedMaterial.baseUnit === "cl" || selectedMaterial.baseUnit === "l")) {
        const volumePerUnit = selectedMaterial.volumePerUnit || selectedMaterial.volumePerBottle || 700;

        if (watchedUnit === "ml" && volumePerUnit > 0) {
          // For ml purchases, currentCost is already cost per ml
          calculatedTotal = quantity * currentCost;
        } else if (watchedUnit === "bottle" && volumePerUnit > 0) {
          // For bottle purchases, use bottle cost directly
          calculatedTotal = quantity * currentCost;
        } else {
          // Fallback to basic calculation
          calculatedTotal = quantity * currentCost;
        }
      } else {
        // For non-package materials, use basic calculation
        calculatedTotal = quantity * currentCost;
      }
    } else {
      // Fallback calculation
      calculatedTotal = !isNaN(currentCost) && !isNaN(quantity) ? currentCost * quantity : 0;
    }

    // Format the total cost with appropriate precision (show more decimals for small values)
    let formattedTotalCost;
    if (calculatedTotal < 0.01 && calculatedTotal > 0) {
      // For very small values, show up to 4 decimal places
      formattedTotalCost = calculatedTotal.toFixed(4);
    } else if (calculatedTotal < 0.1 && calculatedTotal > 0) {
      // For small values, show up to 3 decimal places
      formattedTotalCost = calculatedTotal.toFixed(4);
    } else {
      // For larger values, show 2 decimal places
      formattedTotalCost = calculatedTotal.toFixed(2);
    }
    formattedTotalCost = parseFloat(formattedTotalCost).toString();
    form.setValue("totalCost", formattedTotalCost, { shouldValidate: true });

    if (selectedMaterial && !isNaN(currentCost)) {
      // Validate cost reasonableness
      if (selectedMaterial && selectedMaterial.unitType === "package" && selectedMaterial.inputUnit === watchedUnit) {
        const expectedCost = calculateCostPerUnit(selectedMaterial, null, watchedUnit);
        if (expectedCost > 0 && Math.abs(currentCost - expectedCost) / expectedCost > 0.5) {
          form.setError("costPerPurchasedUnit", {
            type: "manual",
            message: `Cost per ${watchedUnit} ($${formatNumberUI(currentCost)}) deviates significantly from expected ($${formatNumberUI(expectedCost)})`
          });
        }
      } else {
        form.clearErrors("costPerPurchasedUnit");
      }
    } else {
      form.clearErrors("costPerPurchasedUnit");
    }
  }, [watchedCostPerUnit, watchedWasteQuantity, watchedTotalCost, watchedUnit, selectedMaterial, form, lastChangedField]);

  const onSubmit = async (data: any) => {
    if (isSubmitting) {
      return;
    }
    setIsSubmitting(true);
    try {
      if (typeof data.materialId === "number") {
        form.setValue("materialId", String(data.materialId));
      }

      // Get current form values if data is incomplete
      const currentValues = form.getValues();
      const wasteQuantity = parseFloat(data.wasteQuantity || currentValues.wasteQuantity || "0");
      const costPerPurchasedUnit = parseFloat(data.costPerPurchasedUnit || currentValues.costPerPurchasedUnit || "0");
      const totalCost = parseFloat(data.totalCost || currentValues.totalCost || "0");
      const purchasedUnit = data.purchasedUnit || currentValues.purchasedUnit;
      if (isNaN(wasteQuantity) || wasteQuantity <= 0) {
        form.setError("wasteQuantity", {
          type: "manual",
          message: "Waste quantity must be a positive number"
        });
        setIsSubmitting(false);
        return;
      }

      if (!purchasedUnit) {
        form.setError("purchasedUnit", {
          type: "manual",
          message: "Unit is required"
        });
        setIsSubmitting(false);
        return;
      }
      if (!stockEntry?.id) {
        form.setError("materialId", {
          type: "manual",
          message: "Stock entry is required"
        });
        setIsSubmitting(false);
        return;
      }
      const wasteData = {
        materialId: String(data.materialId || currentValues.materialId || selectedMaterial?.id),
        supplier: data.supplier || currentValues.supplier || stockEntry.supplier,
        wasteQuantity: wasteQuantity,
        purchasedQuantity: stockEntry.purchasedQuantity,
        purchasedUnit: purchasedUnit,
        costPerPurchasedUnit: isNaN(costPerPurchasedUnit) ? 0 : costPerPurchasedUnit,
        totalCost: isNaN(totalCost) ? 0 : Number(totalCost),
        purchaseDate: data.purchaseDate || currentValues.purchaseDate || new Date(),
        wasteDate: data.wasteDate || currentValues.wasteDate || new Date(),
        expiryDate: data.expiryDate || currentValues.expiryDate,
        batchNumber: data.batchNumber || currentValues.batchNumber,
        notes: data.notes || currentValues.notes,
        wasteReason: data.wasteReason || currentValues.wasteReason,
        stockEntryId: stockEntry.id
      };
      await onRecordWaste(wasteData);
    } catch (error) {
      console.error("❌ Error recording waste:", error);

      // Extract specific error message from API response
      let errorMessage = "Failed to record waste. Please try again.";
      if (error?.response?.data?.error) {
        errorMessage = error.response.data.error;
      } else if (error?.response?.status === 400) {
        errorMessage = "Invalid waste data. Please check your inputs and try again.";
      } else if (error?.response?.status === 404) {
        errorMessage = "Stock entry not found. Please refresh and try again.";
      } else if (error?.response?.status >= 500) {
        errorMessage = "Server error. Please try again later.";
      }
      setErrorMessage(errorMessage);
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
                <FormItem className="flex flex-col">
                  <FormLabel className="flex items-center gap-2 text-sm font-medium text-gray-700">
                    Material <span className="text-red-500">*</span>
                  </FormLabel>
                  <FormControl>
                    <div className="w-full">
                      <VirtualSelect
                        inputHeight="45px"
                        disabled
                        items={materials.map(material => {
                          const displayUnit = material.unitType === "package" && material.inputUnit ? material.inputUnit : material.baseUnit;
                          return {
                            id: material.id.toString(),
                            label: `${material.name} (${displayUnit})`
                          };
                        })}
                        value={
                          field.value
                            ? {
                                id: field.value,
                                label: materials.find(m => m.id.toString() === field.value)?.name + ` (${materials.find(m => m.id.toString() === field.value)?.unitType === "package" && materials.find(m => m.id.toString() === field.value)?.inputUnit ? materials.find(m => m.id.toString() === field.value)?.inputUnit : materials.find(m => m.id.toString() === field.value)?.baseUnit})`
                              }
                            : null
                        }
                        onChange={item => field.onChange(item?.id || "")}
                        placeholder="Select material"
                      />
                    </div>
                  </FormControl>
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
                          let decrement = 1;

                          // For ml units on bottle materials, decrement by 50ml
                          if (selectedMaterial?.unitType === "package" && watchedUnit === "ml") {
                            decrement = 50; // Use 50ml as a reasonable decrement for bottles
                          } else if (selectedMaterial?.unitType === "package" && (watchedUnit === "piece" || watchedUnit === "bottle")) {
                            decrement = 1;
                          }

                          const newValue = Math.max(0, currentValue - decrement);
                          field.onChange(watchedUnit === "piece" || watchedUnit === "bottle" ? Math.round(newValue) : newValue);
                        }}
                        disabled={parseFloat(field.value) <= 0}
                      >
                        <Minus className="h-4 w-4" />
                      </Button>
                      <Input
                        type="number"
                        step={selectedMaterial?.unitType === "package" && (watchedUnit === "piece" || watchedUnit === "bottle") ? 1 : selectedMaterial?.unitType === "package" && watchedUnit === "ml" ? 50 : 1}
                        min="0"
                        placeholder="0"
                        {...field}
                        onChange={e => {
                          // Handle integer units (piece, bottle) vs decimal units (ml, g, etc.)
                          let value;
                          if (watchedUnit === "piece" || watchedUnit === "bottle") {
                            // For piece/bottle, always round to whole numbers
                            value = e.target.value === "" ? "" : Math.round(parseFloat(e.target.value) || 0);
                          } else if (e.target.value === "") {
                            value = "";
                          } else {
                            // For other units, keep the raw value during typing
                            value = e.target.value;
                          }
                          field.onChange(value);
                          setLastChangedField("wasteQuantity");
                        }}
                        onBlur={e => {
                          // Format the value when the field loses focus
                          if (e.target.value === "") return;

                          if (watchedUnit === "piece" || watchedUnit === "bottle") {
                            // For piece/bottle, ensure it's a whole number
                            const value = Math.round(parseFloat(e.target.value) || 0);
                            field.onChange(value.toString());
                          } else {
                            // For decimal units like ml, format to reasonable precision
                            const parsedValue = parseFloat(e.target.value);
                            if (!isNaN(parsedValue)) {
                              const formattedValue = formatQuantity(parsedValue);
                              field.onChange(formattedValue);
                            }
                          }
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
                          let increment = 1;

                          // For ml units on bottle materials, increment by 50ml
                          if (selectedMaterial?.unitType === "package" && watchedUnit === "ml") {
                            increment = 50; // Use 50ml as a reasonable increment for bottles
                          } else if (selectedMaterial?.unitType === "package" && (watchedUnit === "piece" || watchedUnit === "bottle")) {
                            increment = 1;
                          }

                          const newValue = currentValue + increment;
                          field.onChange(watchedUnit === "piece" || watchedUnit === "bottle" ? Math.round(newValue) : newValue);
                        }}
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                  </FormControl>
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
                  {watchedUnit === "piece" && selectedMaterial?.unitType === "package" && <p className="text-xs text-blue-600 mt-1">Individual pieces from package materials</p>}
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
                    <Input type="number" step="0.01" min="0" placeholder="" value={field.value} readOnly className="h-11 border-gray-300 focus:border-red-500 focus:ring-red-500 text-center font-medium overflow-hidden flex-1 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none bg-gray-50" />
                  </FormControl>
                  <p className="text-xs text-red-600 mt-1">Total cost for all wasted units (auto-calculated)</p>
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

          {/* Error Messages */}
          {errorMessage && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-center gap-2">
                <Trash2 className="h-4 w-4 text-red-600" />
                <p className="text-sm text-red-800 font-medium">{errorMessage}</p>
              </div>
            </div>
          )}

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
                        const actualBottleCount = Math.round((totalVolume / volumePerUnit) * 100) / 100;
                        return `${actualBottleCount} ${actualBottleCount === 1 ? "bottle" : "bottles"}`;
                      }
                      return `${stockEntry.purchasedQuantity || "0"} ${stockEntry.purchasedUnit || "units"}`;
                    })()}
                  </span>
                </div>
                <div>
                  <span className="text-gray-500">
                    Cost per{" "}
                    {(() => {
                      if (stockEntry.totalVolume && stockEntry.volumePerUnit && stockEntry.purchasedUnit === "bottle") {
                        return "bottle";
                      }
                      return stockEntry.purchasedUnit || "unit";
                    })()}
                    :
                  </span>
                  <span className="ml-2 font-medium">
                    $
                    {(() => {
                      const totalCost = Number(stockEntry.totalCost || 0);
                      if (stockEntry.totalVolume && stockEntry.volumePerUnit && stockEntry.purchasedUnit === "bottle") {
                        const totalVolume = typeof stockEntry.totalVolume === "string" ? parseFloat(stockEntry.totalVolume) : stockEntry.totalVolume;
                        const volumePerUnit = typeof stockEntry.volumePerUnit === "string" ? parseFloat(stockEntry.volumePerUnit) : stockEntry.volumePerUnit;
                        const actualBottleCount = totalVolume / volumePerUnit;
                        return formatNumberUI(totalCost / actualBottleCount);
                      }
                      return formatNumberUI(totalCost / Number(stockEntry.purchasedQuantity || 1));
                    })()}
                  </span>
                </div>
                <div>
                  <span className="text-gray-500">Remaining Stock:</span>
                  <span className="ml-2 font-medium">{getCurrentStockDisplay()}</span>
                </div>
              </div>
            </div>
          )}

          <div className="flex gap-3 justify-end">
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
            <Button
              type="button"
              className="bg-red-600 hover:bg-red-700 text-white"
              onClick={e => {
                try {
                  const result = form.handleSubmit(
                    data => {
                      return onSubmit(data);
                    },
                    errors => {
                      console.error("❌ FORM VALIDATION FAILED - errors:", errors);
                    }
                  );
                  result(e);
                } catch (error) {
                  console.error("🚨 ERROR in form.handleSubmit:", error);
                }
              }}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Record Waste
            </Button>
          </div>
        </div>
      </Form>
    </div>
  );
}

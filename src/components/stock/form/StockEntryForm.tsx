import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { StockFormData, StockFormInputs, UNIT_OPTIONS } from "@/types/inventory";
import { format } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import { CalendarIcon, LucideIcon, Minus, Plus } from "lucide-react";
import { CostBreakdown } from "../CostBreakdown";
import { useEffect } from "react";
import type { Path, PathValue, UseFormReturn } from "react-hook-form";
import { convertMass, convertVolume, formatCurrencyUI, formatNumberUI, isMassUnit, isVolumeUnit, parseCurrency } from "@/utils/conversionLogic";
import { calculateCostBreakdown } from "@/utils/costCalculations";
import { VirtualSelect } from "@/components/ui/VirtualSelect";
import { Material } from "@/types/inventory";
import { fmtCPU, fmtTotalCost, getFormattedTotalCostLabel } from "@/utils/getCurrentStockDisplay";

// Define the cost per unit label function
const getFormattedCostPerUnitLabel = (unitFieldName: string): string => {
  const unit = unitFieldName || "Unit";

  // For mass units, show the appropriate unit in the label
  if (isMassUnit(unit)) {
    // For kg, show both kg and g equivalents
    if (unit === "kg") {
      return `Cost Per kg (per 1000g)`;
    }
    // For g, show per g
    else if (unit === "g") {
      return `Cost Per g`;
    }
    // For lb, show both lb and oz equivalents
    else if (unit === "lb") {
      return `Cost Per lb (per 16oz)`;
    }
    // For oz, show per oz
    else if (unit === "oz") {
      return `Cost Per oz`;
    }
  }

  return `Cost Per ${unit}`;
};

export interface StockEntryFormProps {
  form: UseFormReturn<StockFormInputs>;
  materials: Material[];
  availableUnits: string[];
  selectedMaterial: Material | undefined;
  watchedQuantity: string;
  watchedCostPerUnit: string;
  watchedTotalCost: string;
  stockEntry?: any;
  onSubmit: (data: StockFormData) => void;
  onCancel: () => void;

  // Dynamic props for customization
  headerIcon: LucideIcon;
  headerColor: "green" | "blue" | "red";
  headerTitle: string;
  headerDescription: string;
  getCurrentStockDisplay: () => string;

  // Field names and customization
  quantityFieldName: Path<StockFormInputs>;
  unitFieldName: Path<StockFormInputs>;
  dateFieldName: Path<StockFormInputs>;
  dateFieldLabel: string;

  // Optional fields
  showReasonField?: boolean;
  reasonFieldName?: Path<StockFormInputs>;

  // Field visibility and interaction control
  hiddenFields?: Array<"material" | "supplier" | "quantity" | "unit" | "costPerUnit" | "totalCost" | "date" | "reason" | "costBreakdown">;
  disabledFields?: Array<"material" | "supplier" | "quantity" | "unit" | "costPerUnit" | "totalCost" | "date" | "reason">;
  readOnlyFields?: Array<"material" | "supplier" | "quantity" | "unit" | "costPerUnit" | "totalCost" | "date" | "reason">;

  // Button customization
  submitButtonText: string;

  // Children elements
  children?: React.ReactNode;
}

export function StockEntryForm({ form, materials, availableUnits, selectedMaterial, watchedQuantity, watchedCostPerUnit, watchedTotalCost, stockEntry, onSubmit, onCancel, headerIcon: HeaderIcon, headerColor, headerTitle, headerDescription, getCurrentStockDisplay, quantityFieldName, unitFieldName, dateFieldName, dateFieldLabel, showReasonField = false, reasonFieldName, hiddenFields = [], disabledFields = [], readOnlyFields = [], submitButtonText, children }: StockEntryFormProps) {
  // Utility functions for number handling and formatting
  const toNumber = (v: string | undefined | null): number => {
    if (!v || v === "") return NaN;
    const n = parseFloat(v);
    return isNaN(n) || !isFinite(n) ? NaN : n;
  };

  const fmtMoney = (n: number): string => {
    if (isNaN(n) || !isFinite(n)) return "";
    // Use the fmtTotalCost function from getCurrentStockDisplay.tsx for better precision with mass units
    return fmtTotalCost(Math.max(0, n), form.getValues(unitFieldName) as string);
  };

  const setValue = <K extends Path<StockFormInputs>>(name: K, value: PathValue<StockFormInputs, K>) => {
    form.setValue(name, value, { shouldValidate: true });
  };

  // Ensure materialId is always a string
  useEffect(() => {
    const currentMaterialId = form.getValues("materialId");
    if (currentMaterialId !== undefined && typeof currentMaterialId === "number") {
      form.setValue("materialId", String(currentMaterialId));
    }
  }, [form]);

  // Update labels when unit changes
  useEffect(() => {
    // This will force a re-render when the unit changes
    const currentUnit = form.getValues(unitFieldName);
    // We don't need to do anything here, just watching the unit field
  }, [form.watch(unitFieldName), unitFieldName]);

  // Recompute functions for handling field changes without infinite loops
  const recomputeFromQuantity = (qtyStr: string) => {
    console.log("🔍 recomputeFromQuantity CALLED with:", qtyStr);
    form.setValue(quantityFieldName as any, qtyStr, { shouldValidate: true });
    const qty = toNumber(qtyStr);
    const currentUnit = form.getValues(unitFieldName as any) as string;

    console.log("🔍 INPUTS:", { qty, currentUnit, selectedMaterial: selectedMaterial?.name });

    if (isNaN(qty) || qty <= 0) {
      console.log("🔍 Invalid quantity, clearing fields");
      form.setValue("totalCost", "", { shouldValidate: true });
      form.setValue("costPerPurchasedUnit", "", { shouldValidate: true });
      return;
    }

    if (selectedMaterial && currentUnit) {
      // Use enhanced cost calculation system
      const costResult = calculateCostBreakdown(selectedMaterial, stockEntry, qty, currentUnit);
      
      console.log("🔍 Enhanced cost calculation result:", costResult);

      // Update cost per unit
      const formattedCPU = fmtCPU(costResult.costPerUnit, currentUnit);
      form.setValue("costPerPurchasedUnit", formattedCPU, { shouldValidate: true });

      // Update total cost with smart formatting
      let formattedTotalCost;
      if (costResult.totalCost < 0.01 && costResult.totalCost > 0) {
        formattedTotalCost = costResult.totalCost.toFixed(4);
      } else if (costResult.totalCost < 0.1 && costResult.totalCost > 0) {
        formattedTotalCost = costResult.totalCost.toFixed(3);
      } else {
        formattedTotalCost = fmtMoney(costResult.totalCost);
      }
      
      console.log("🔍 Setting totalCost to:", formattedTotalCost);
      form.setValue("totalCost", formattedTotalCost, { shouldValidate: true });
    } else {
      // Fallback to basic calculation if no material selected
      const cpu = toNumber(form.getValues("costPerPurchasedUnit") as string);
      const total = toNumber(form.getValues("totalCost") as string);
      
      if (!isNaN(cpu) && cpu > 0) {
        const calculatedTotal = qty * cpu;
        const formattedValue = fmtMoney(calculatedTotal);
        form.setValue("totalCost", formattedValue, { shouldValidate: true });
      } else if (!isNaN(total)) {
        const formattedCPU = fmtCPU(total / qty, currentUnit);
        form.setValue("costPerPurchasedUnit", formattedCPU, { shouldValidate: true });
      }
    }

    console.log("🔍 AFTER recomputeFromQuantity, form values:", {
      totalCost: form.getValues("totalCost"),
      costPerPurchasedUnit: form.getValues("costPerPurchasedUnit"),
      quantity: form.getValues(quantityFieldName as any)
    });
  };

  const recomputeFromTotal = (totalCostValue: string) => {
    console.log("🔄 recomputeFromTotal called with:", totalCostValue);

    // Get current values
    const quantity = form.getValues(quantityFieldName as any) || 0;
    const unit = form.getValues(unitFieldName as any) || "";
    const currentUnit = form.getValues(unitFieldName as any) as string;

    // Parse the total cost value using the parseCurrency utility
    const total = parseCurrency(totalCostValue);
    console.log("🔄 Parsed totalCost:", total);

    if (isNaN(total) || total <= 0 || quantity <= 0) {
      console.log("🔄 Invalid values detected, not updating");
      form.setValue("costPerPurchasedUnit", "", { shouldValidate: true });
      return;
    }

    // Store the numeric value directly in the form state
    // This ensures the input field gets a clean numeric value without currency symbols
    let numericValue;
    if (isMassUnit(unit) && (unit === "g" || unit === "oz")) {
      if (total < 0.01) {
        numericValue = parseFloat(total.toFixed(4));
        console.log("🔥 Very small value < 0.01, using 4 decimal places:", numericValue);
      } else if (total < 0.1) {
        numericValue = parseFloat(total.toFixed(3));
        console.log("🔥 Small value < 0.1, using 3 decimal places:", numericValue);
      } else {
        numericValue = parseFloat(total.toFixed(2));
        console.log("🔥 Normal value for small mass unit, using 2 decimal places:", numericValue);
      }
    } else {
      numericValue = parseFloat(total.toFixed(2));
      console.log("🔥 Not a small mass unit, using default formatting:", numericValue);
    }

    // Set the raw numeric value to the form
    form.setValue("totalCost", numericValue.toString(), { shouldValidate: true });
    console.log("🔥 AFTER setting totalCost, form value is:", form.getValues("totalCost"));

    const qtyValue = form.getValues(quantityFieldName as any);
    const qty = typeof qtyValue === "string" ? parseFloat(qtyValue) : qtyValue;
    const cpuValue = form.getValues("costPerPurchasedUnit");
    const cpu = typeof cpuValue === "string" ? parseFloat(cpuValue) : cpuValue;

    if (!isNaN(qty) && qty > 0) {
      form.setValue("costPerPurchasedUnit", fmtCPU(total / qty, currentUnit), { shouldValidate: true });
    } else if (!isNaN(cpu) && cpu > 0) {
      const calcQty = total / cpu;
      if (isFinite(calcQty) && !isNaN(calcQty) && calcQty > 0) {
        form.setValue(quantityFieldName as any, formatNumberUI(calcQty, currentUnit), { shouldValidate: true });
      }
    }
  };

  const recomputeFromCPU = (cpuStr: string) => {
    form.setValue("costPerPurchasedUnit", cpuStr, { shouldValidate: true });
    const cpu = toNumber(cpuStr);
    const qty = toNumber(form.getValues(quantityFieldName as any) as string);
    const currentUnit = form.getValues(unitFieldName as any) as string;

    if (isNaN(cpu) || cpu <= 0) {
      form.setValue("totalCost", "", { shouldValidate: true });
      return;
    }

    if (!isNaN(qty) && qty > 0) {
      // Calculate the total cost with enhanced precision
      const calculatedTotal = qty * cpu;

      // Format with smart precision based on value size and unit type
      let formattedTotalCost;
      if (calculatedTotal < 0.01 && calculatedTotal > 0) {
        formattedTotalCost = calculatedTotal.toFixed(4);
      } else if (calculatedTotal < 0.1 && calculatedTotal > 0) {
        formattedTotalCost = calculatedTotal.toFixed(3);
      } else {
        formattedTotalCost = fmtMoney(calculatedTotal);
      }
      
      form.setValue("totalCost", formattedTotalCost, { shouldValidate: true });
    } else {
      // Calculate quantity from total cost if available
      const total = toNumber(form.getValues("totalCost") as string);
      if (!isNaN(total) && total > 0) {
        const calcQty = total / cpu;
        if (isFinite(calcQty) && !isNaN(calcQty) && calcQty > 0) {
          form.setValue(quantityFieldName as any, formatNumberUI(calcQty, currentUnit), { shouldValidate: true });
        }
      }
    }
  };

  const handleUnitChange = (newUnit: string) => {
    const currentUnit = form.getValues(unitFieldName as any) as string;
    if (!newUnit) return;
    form.setValue(unitFieldName as any, newUnit, { shouldValidate: true });
    if (!currentUnit || newUnit === currentUnit) return;

    const qty = toNumber(form.getValues(quantityFieldName as any) as string);
    if (isNaN(qty) || qty <= 0) return;

    let newQty = qty;
    let conversionApplied = false;

    // Handle mass unit conversions
    if (isMassUnit(currentUnit) && isMassUnit(newUnit)) {
      newQty = convertMass(qty, currentUnit, newUnit);
      conversionApplied = true;
    }
    // Handle volume unit conversions
    else if (isVolumeUnit(currentUnit) && isVolumeUnit(newUnit)) {
      newQty = convertVolume(qty, currentUnit, newUnit);
      conversionApplied = true;
    }
    // Handle package to piece conversions if we have a selected material
    else if (selectedMaterial?.unitType === "package" && stockEntry?.purchasedIndividualUnit && stockEntry?.purchasedIndividualQuantity) {
      // Converting from package to individual units
      if (UNIT_OPTIONS.package.includes(currentUnit) && (newUnit === stockEntry.purchasedIndividualUnit || UNIT_OPTIONS.piece.includes(newUnit))) {
        newQty = qty * (stockEntry.purchasedIndividualQuantity || 1);
        conversionApplied = true;
      }
      // Converting from individual units to package
      else if ((currentUnit === stockEntry.purchasedIndividualUnit || UNIT_OPTIONS.piece.includes(currentUnit)) && UNIT_OPTIONS.package.includes(newUnit)) {
        const individualQty = stockEntry.purchasedIndividualQuantity || 1;
        if (individualQty > 0) {
          newQty = qty / individualQty;
          conversionApplied = true;
        }
      }
    }

    // If no conversion was applied, keep the same quantity
    if (!conversionApplied) {
      // Just update the unit without changing quantity
      setValue(unitFieldName as any, newUnit);
      return;
    }

    const total = toNumber(form.getValues("totalCost") as string);
    const cpu = toNumber(form.getValues("costPerPurchasedUnit") as string);
    setValue(quantityFieldName as any, formatNumberUI(newQty, newUnit));

    // Update cost per unit based on total cost
    if (!isNaN(total) && newQty > 0) {
      setValue("costPerPurchasedUnit", fmtCPU(total / newQty, unitFieldName));
    }
    // Or update total cost based on cost per unit
    else if (!isNaN(cpu)) {
      let cpuNew = cpu;

      // Adjust cost per unit for mass conversions
      if (isMassUnit(currentUnit) && isMassUnit(newUnit)) {
        const oneNewInOld = convertMass(1, newUnit, currentUnit);
        cpuNew = cpu * oneNewInOld;
      }
      // Adjust cost per unit for volume conversions
      else if (isVolumeUnit(currentUnit) && isVolumeUnit(newUnit)) {
        const oneNewInOld = convertVolume(1, newUnit, currentUnit);
        cpuNew = cpu * oneNewInOld;
      }
      // Adjust cost per unit for package/piece conversions
      else if (selectedMaterial?.unitType === "package" && stockEntry?.purchasedIndividualQuantity) {
        // Converting from package to individual units
        if (UNIT_OPTIONS.package.includes(currentUnit) && (newUnit === stockEntry.purchasedIndividualUnit || UNIT_OPTIONS.piece.includes(newUnit))) {
          cpuNew = cpu / (stockEntry.purchasedIndividualQuantity || 1);
        }
        // Converting from individual units to package
        else if ((currentUnit === stockEntry.purchasedIndividualUnit || UNIT_OPTIONS.piece.includes(currentUnit)) && UNIT_OPTIONS.package.includes(newUnit)) {
          cpuNew = cpu * (stockEntry.purchasedIndividualQuantity || 1);
        }
      }

      setValue("costPerPurchasedUnit", fmtCPU(cpuNew, unitFieldName));
      setValue("totalCost", fmtMoney(cpuNew * newQty));
    }
  };

  const handleSubmit = async (data: StockFormInputs) => {
    await form.trigger();
    const qty = toNumber(data[quantityFieldName as keyof StockFormInputs] as string);
    const total = toNumber(data.totalCost as string);
    const cpu = !data.costPerPurchasedUnit || data.costPerPurchasedUnit === "" ? (!isNaN(qty) && qty > 0 && !isNaN(total) ? total / qty : NaN) : toNumber(data.costPerPurchasedUnit as string);

    if (isNaN(qty) || qty <= 0) {
      form.setError(quantityFieldName as any, { type: "manual", message: "Quantity must be greater than 0" });
    }
    if (isNaN(cpu) || cpu < 0) {
      form.setError("costPerPurchasedUnit", { type: "manual", message: "Cost per unit must be ≥ 0" });
    }

    const hasErrors = Object.keys(form.formState.errors).length > 0;
    if (hasErrors) {
      const firstError = Object.keys(form.formState.errors)[0] as keyof StockFormInputs | undefined;
      if (firstError) form.setFocus(firstError as any);
      return;
    }

    const formData: StockFormData = {
      ...(data as any),
      costPerPurchasedUnit: fmtMoney(cpu)
    } as unknown as StockFormData;
    onSubmit(formData);
  };

  return (
    <div className="space-y-6">
      <div className={`bg-${headerColor}-50 border border-${headerColor}-200 rounded-xl p-4`}>
        <div className="flex items-center gap-3 mb-4">
          <div className={`p-2 bg-${headerColor}-100 rounded-lg`}>
            <HeaderIcon className={`h-5 w-5 text-${headerColor}-600`} />
          </div>
          <h3 className={`text-lg font-semibold text-${headerColor}-800`}>{headerTitle}</h3>
        </div>
        <p className={`text-sm text-${headerColor}-700 mb-4`}>
          {headerDescription} <strong>{getCurrentStockDisplay()}</strong>
        </p>
      </div>

      <Form {...form}>
        <div className="space-y-6">
          {/* Render children at the top of the form */}
          {children}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
            {/* Material Field */}
            {!hiddenFields.includes("material") && (
              <FormField
                control={form.control}
                name="materialId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2 text-md font-medium text-gray-700">
                      Item <span className="text-red-500">*</span>
                    </FormLabel>
                    <FormControl>
                      <div className="w-full">
                        <VirtualSelect
                          disabled={disabledFields.includes("material")}
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
            )}

            {/* Supplier Field */}
            {!hiddenFields.includes("supplier") && (
              <FormField
                control={form.control}
                name="supplier"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Supplier</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., ABC Food Distributors" {...field} disabled={disabledFields.includes("supplier")} readOnly={readOnlyFields.includes("supplier")} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {/* Quantity Field */}
            {!hiddenFields.includes("quantity") && (
              <FormField
                control={form.control}
                name={quantityFieldName as any}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Quantity</FormLabel>
                    <FormControl>
                      <div className="flex items-center gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          className={`h-11 w-11 border-${headerColor}-300 hover:border-${headerColor}-500 hover:bg-${headerColor}-50`}
                          onClick={() => {
                            const current = Number(field.value) || 0;
                            const next = Math.max(0, current - 1).toString();
                            recomputeFromQuantity(next);
                          }}
                          disabled={parseFloat(field.value?.toString() || "0") <= 0 || disabledFields.includes("quantity")}
                        >
                          <Minus className="h-4 w-4" />
                        </Button>
                        <Input
                          type="number"
                          step="1"
                          min="0"
                          placeholder="0"
                          {...field}
                          disabled={disabledFields.includes("quantity")}
                          readOnly={readOnlyFields.includes("quantity")}
                          onChange={e => {
                            const cleaned = e.target.value.replace(/[^0-9.]/g, "");
                            const parts = cleaned.split(".");
                            const normalized = parts.length > 2 ? parts[0] + "." + parts.slice(1).join("") : cleaned;
                            recomputeFromQuantity(normalized);
                          }}
                          className={`h-11 border-${headerColor}-300 focus:border-${headerColor}-500 focus:ring-${headerColor}-500 text-center font-medium overflow-hidden flex-1 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none`}
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          className={`h-11 w-11 border-${headerColor}-300 hover:border-${headerColor}-500 hover:bg-${headerColor}-50`}
                          onClick={() => {
                            const current = Number(field.value) || 0;
                            const next = (current + 1).toString();
                            recomputeFromQuantity(next);
                          }}
                          disabled={disabledFields.includes("quantity")}
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {/* Unit Field */}
            {!hiddenFields.includes("unit") && (
              <FormField
                control={form.control}
                name={unitFieldName as any}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Unit</FormLabel>
                    <FormControl>
                      <Select
                        onValueChange={value => {
                          field.onChange(value);
                          handleUnitChange(value);
                        }}
                        value={field.value || ""}
                        disabled={disabledFields.includes("unit")}
                      >
                        <SelectTrigger className={readOnlyFields.includes("unit") ? "pointer-events-none" : ""}>
                          <SelectValue placeholder="Select unit" />
                        </SelectTrigger>
                        <SelectContent>
                          {(() => {
                            // Simplified logic to show only directly relevant units
                            if (selectedMaterial && stockEntry) {
                              const relevantUnits = new Set<string>();

                              // Case 1: Volume materials with bottle/container units
                              // Example: "1300 ml from 1.86 bottles"
                              if (selectedMaterial.unitType === "volume" && stockEntry.purchasedUnit && ["bottle", "can", "glass"].includes(stockEntry.purchasedUnit)) {
                                // Add the container unit (bottle, can, glass)
                                relevantUnits.add(stockEntry.purchasedUnit);

                                // Add the volume unit (ml, l)
                                if (stockEntry.volumeUnit) {
                                  relevantUnits.add(stockEntry.volumeUnit);
                                } else if (selectedMaterial.volumeUnit) {
                                  relevantUnits.add(selectedMaterial.volumeUnit);
                                } else {
                                  // Default to ml if no specific volume unit
                                  relevantUnits.add("ml");
                                }
                              }

                              // Case 2: Package materials with individual units
                              // Example: "3 bags (17 pieces)"
                              else if (selectedMaterial.unitType === "package" && stockEntry.purchasedUnit && stockEntry.purchasedIndividualUnit) {
                                // Add the package unit (bag, box, etc)
                                relevantUnits.add(stockEntry.purchasedUnit);

                                // Add the individual unit (piece, unit, etc)
                                relevantUnits.add(stockEntry.purchasedIndividualUnit);
                              }

                              // Case 3: Mass materials with mass units
                              // Example: "500 g" or "2 kg"
                              else if (selectedMaterial.unitType === "mass" && stockEntry.purchasedUnit) {
                                // Add the purchased unit (kg, g, etc)
                                relevantUnits.add(stockEntry.purchasedUnit);

                                // If purchased unit is kg, also add g for more granular measurements
                                if (stockEntry.purchasedUnit === "kg") {
                                  relevantUnits.add("g");
                                }
                                // If purchased unit is g, also add kg for larger measurements
                                else if (stockEntry.purchasedUnit === "g") {
                                  relevantUnits.add("kg");
                                }
                                // For other mass units like lb, add oz and vice versa
                                else if (stockEntry.purchasedUnit === "lb") {
                                  relevantUnits.add("oz");
                                } else if (stockEntry.purchasedUnit === "oz") {
                                  relevantUnits.add("lb");
                                }
                              }

                              // If we have relevant units, return them
                              if (relevantUnits.size > 0) {
                                const unitsArray = Array.from(relevantUnits);

                                // Auto-select the first unit if no unit is currently selected
                                if (!field.value && unitsArray.length > 0) {
                                  // Use setTimeout to avoid React state update during render
                                  setTimeout(() => {
                                    handleUnitChange(unitsArray[0]);
                                  }, 0);
                                }

                                return unitsArray.map(unit => (
                                  <SelectItem key={unit} value={unit}>
                                    {unit}
                                  </SelectItem>
                                ));
                              }
                            }

                            // Fallback: If no stock entry or no relevant units found,
                            // show only the material's base unit or all available units
                            if (selectedMaterial?.baseUnit) {
                              // Auto-select the base unit if no unit is currently selected
                              if (!field.value) {
                                // Use setTimeout to avoid React state update during render
                                setTimeout(() => {
                                  handleUnitChange(selectedMaterial.baseUnit);
                                }, 0);
                              }

                              return (
                                <SelectItem key={selectedMaterial.baseUnit} value={selectedMaterial.baseUnit}>
                                  {selectedMaterial.baseUnit}
                                </SelectItem>
                              );
                            }

                            // Last resort: show all available units
                            const units = availableUnits;

                            // Auto-select the first unit if no unit is currently selected and units exist
                            if (!field.value && units.length > 0) {
                              // Use setTimeout to avoid React state update during render
                              setTimeout(() => {
                                handleUnitChange(units[0]);
                              }, 0);
                            }

                            return units.map(unit => (
                              <SelectItem key={unit} value={unit}>
                                {unit}
                              </SelectItem>
                            ));
                          })()}
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {/* Reason Field */}
            {showReasonField && reasonFieldName && !hiddenFields.includes("reason") && (
              <FormField
                control={form.control}
                name={reasonFieldName as any}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Reason</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value?.toString() || ""} disabled={disabledFields.includes("reason")}>
                      <FormControl>
                        <SelectTrigger className={readOnlyFields.includes("reason") ? "pointer-events-none" : ""}>
                          <SelectValue placeholder="Select reason" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="expired">Expired</SelectItem>
                        <SelectItem value="damaged">Damaged</SelectItem>
                        <SelectItem value="spoiled">Spoiled</SelectItem>
                        <SelectItem value="quality_control">Quality Control</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {/* Cost Per Unit Field */}
            {!hiddenFields.includes("costPerUnit") && (
              <FormField
                control={form.control}
                name="costPerPurchasedUnit"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      {(() => {
                        // Get the current unit value directly from the form
                        const currentUnit = form.watch(unitFieldName) as string;
                        return `${getFormattedCostPerUnitLabel(currentUnit)} ($)`;
                      })()}
                    </FormLabel>
                    <FormControl>
                      <div className="flex items-center gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          className="h-11 w-11 border-gray-300 hover:border-blue-500 hover:bg-blue-50"
                          onClick={() => {
                            const current = parseFloat(field.value as string) || 0;
                            const next = Math.max(0, current - 0.01).toFixed(2);
                            recomputeFromCPU(next);
                          }}
                          disabled={parseFloat(field.value as string) <= 0 || disabledFields.includes("costPerUnit") || readOnlyFields.includes("costPerUnit")}
                        >
                          <Minus className="h-4 w-4" />
                        </Button>
                        <Input
                          type="number"
                          step="0.000001"
                          min="0"
                          placeholder="0.000000"
                          value={field.value}
                          disabled={disabledFields.includes("costPerUnit")}
                          readOnly={readOnlyFields.includes("costPerUnit")}
                          onChange={e => {
                            const cleaned = e.target.value.replace(/[^0-9.]/g, "");
                            recomputeFromCPU(cleaned);
                          }}
                          className={`h-11 border-gray-300 focus:border-blue-500 focus:ring-blue-500 text-center font-medium overflow-hidden flex-1 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none ${readOnlyFields.includes("costPerUnit") ? "bg-gray-100" : ""}`}
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          className="h-11 w-11 border-gray-300 hover:border-blue-500 hover:bg-blue-50"
                          onClick={() => {
                            const current = parseFloat(field.value as string) || 0;
                            const next = (current + 0.01).toFixed(2);
                            recomputeFromCPU(next);
                          }}
                          disabled={disabledFields.includes("costPerUnit") || readOnlyFields.includes("costPerUnit")}
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {/* Total Cost Field */}
            {!hiddenFields.includes("totalCost") && (
              <FormField
                control={form.control}
                name="totalCost"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      {(() => {
                        // Get the current unit value directly from the form
                        const currentUnit = form.watch(unitFieldName) as string;
                        return `${getFormattedTotalCostLabel(currentUnit)} ($)`;
                      })()}
                    </FormLabel>
                    <FormControl>
                      <div className="flex items-center gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          className="h-11 w-11 border-gray-300 hover:border-blue-500 hover:bg-blue-50"
                          onClick={() => {
                            const currentValue = field.value === "" ? 0 : parseFloat(field.value as string);
                            const currentUnit = form.watch(unitFieldName) as string;

                            // Determine step size based on unit
                            let stepSize = 0.01; // Default step
                            if (isMassUnit(currentUnit) && (currentUnit === "g" || currentUnit === "oz")) {
                              if (currentValue < 0.1) {
                                stepSize = 0.001; // Smaller step for small values in small mass units
                              }
                            }

                            const newValue = Math.max(0, currentValue - stepSize);

                            // Format with appropriate precision
                            let next;
                            if (newValue === 0) {
                              next = "";
                            } else if (isMassUnit(currentUnit) && (currentUnit === "g" || currentUnit === "oz")) {
                              if (newValue < 0.01) {
                                next = newValue.toFixed(4);
                              } else if (newValue < 0.1) {
                                next = newValue.toFixed(3);
                              } else {
                                next = newValue.toFixed(2);
                              }
                            } else {
                              next = newValue.toFixed(2);
                            }

                            recomputeFromTotal(next);
                          }}
                          disabled={parseFloat(field.value as string) <= 0 || disabledFields.includes("totalCost") || readOnlyFields.includes("totalCost")}
                        >
                          <Minus className="h-4 w-4" />
                        </Button>
                        <Input
                          type="number"
                          step="0.0001"
                          min="0"
                          placeholder="0.0000"
                          value={(() => {
                            // Get the current unit and value
                            const currentUnit = form.watch(unitFieldName) as string;
                            
                            // Parse the value, ensuring we strip any currency symbols first
                            const rawValue = field.value as string;
                            const numericValue = rawValue ? parseCurrency(rawValue) : 0;

                            console.log("🔍 TOTAL COST INPUT RENDERING:", {
                              currentUnit,
                              numericValue,
                              rawFieldValue: rawValue,
                              isMassUnit: isMassUnit(currentUnit),
                              isSmallMassUnit: currentUnit === "g" || currentUnit === "oz"
                            });

                            // For mass units, especially small quantities, use appropriate precision
                            if (isMassUnit(currentUnit)) {
                              // For small units like g, ensure we have enough precision for small values
                              if (currentUnit === "g" || currentUnit === "oz") {
                                // For very small values, use 4 decimal places
                                if (numericValue < 0.01 && numericValue > 0) {
                                  const formatted = numericValue.toFixed(4);
                                  console.log("🔍 Very small value < 0.01, using 4 decimal places:", formatted);
                                  return formatted;
                                }
                                // For small values, use 3 decimal places
                                else if (numericValue < 0.1 && numericValue > 0) {
                                  const formatted = numericValue.toFixed(3);
                                  console.log("🔍 Small value < 0.1, using 3 decimal places:", formatted);
                                  return formatted;
                                }
                                console.log("🔍 Normal value for small mass unit, using 2 decimal places");
                                return numericValue.toFixed(2);
                              }
                            }

                            // Default to numeric value with 2 decimal places
                            console.log("🔍 Using default formatting for value:", numericValue);
                            return numericValue === 0 && rawValue === "" ? "" : numericValue.toFixed(2);
                          })()}
                          disabled={disabledFields.includes("totalCost")}
                          readOnly={readOnlyFields.includes("totalCost")}
                          onChange={e => {
                            // Strip any non-numeric characters except decimal point
                            const cleaned = e.target.value.replace(/[^0-9.]/g, "");
                            recomputeFromTotal(cleaned);
                          }}
                          className={`h-11 border-gray-300 focus:border-blue-500 focus:ring-blue-500 text-center font-medium overflow-hidden flex-1 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none ${readOnlyFields.includes("totalCost") ? "bg-gray-100" : ""}`}
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          className="h-11 w-11 border-gray-300 hover:border-blue-500 hover:bg-blue-50"
                          onClick={() => {
                            const currentValue = field.value === "" ? 0 : parseFloat(field.value as string);
                            const currentUnit = form.watch(unitFieldName) as string;

                            // Determine step size based on unit
                            let stepSize = 0.01; // Default step
                            if (isMassUnit(currentUnit) && (currentUnit === "g" || currentUnit === "oz")) {
                              if (currentValue < 0.1) {
                                stepSize = 0.001; // Smaller step for small values in small mass units
                              }
                            }

                            const newValue = currentValue + stepSize;

                            // Format with appropriate precision
                            let next;
                            if (isMassUnit(currentUnit) && (currentUnit === "g" || currentUnit === "oz")) {
                              if (newValue < 0.01) {
                                next = newValue.toFixed(4);
                              } else if (newValue < 0.1) {
                                next = newValue.toFixed(3);
                              } else {
                                next = newValue.toFixed(2);
                              }
                            } else {
                              next = newValue.toFixed(2);
                            }

                            recomputeFromTotal(next);
                          }}
                          disabled={disabledFields.includes("totalCost") || readOnlyFields.includes("totalCost")}
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {/* Date Field */}
            {!hiddenFields.includes("date") && (
              <FormField
                control={form.control}
                name={dateFieldName as any}
                render={({ field }) => (
                  <FormItem className="flex flex-col mt-3">
                    <FormLabel>{dateFieldLabel}</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild disabled={disabledFields.includes("date")}>
                        <FormControl>
                          <Button variant="outline" className={cn("w-full pl-3 text-left font-normal", !field.value && "text-muted-foreground", (disabledFields.includes("date") || readOnlyFields.includes("date")) && "opacity-70 pointer-events-none")}>
                            {field.value ? format(field.value as Date, "PPP") : <span>Pick a date</span>}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar mode="single" selected={field.value as Date} onSelect={field.onChange} disabled={(date: Date) => date > new Date() || disabledFields.includes("date") || readOnlyFields.includes("date")} initialFocus className="p-3 pointer-events-auto" />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
          </div>

          {/* Cost Breakdown */}
          {!hiddenFields.includes("costBreakdown") && <CostBreakdown selectedMaterial={selectedMaterial} quantity={watchedQuantity} purchasedUnit={form.watch(unitFieldName) as string} costPerPurchasedUnit={watchedCostPerUnit} totalCost={watchedTotalCost} />}

          <div className="flex gap-3 justify-end">
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
            <Button type="button" onClick={form.handleSubmit(handleSubmit)}>
              {submitButtonText}
            </Button>
          </div>
        </div>
      </Form>
    </div>
  );
}

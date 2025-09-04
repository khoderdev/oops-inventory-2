import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { StockEntryFormProps, StockFormData, StockFormInputs, UNIT_OPTIONS } from "@/types/inventory";
import { format } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import { CalendarIcon, Minus, Plus } from "lucide-react";
import { SupplierSelector } from "@/components/suppliers/SupplierSelector";
import { useSuppliersContext } from "@/context/SuppliersContext";
import { CostBreakdown } from "../CostBreakdown";
import { useEffect, useRef } from "react";
import type { Path, PathValue } from "react-hook-form";
import { convertMass, convertVolume, formatNumberUI, isMassUnit, isVolumeUnit, parseCurrency } from "@/utils/conversionLogic";
import { calculateCostBreakdown } from "@/utils/costCalculations";
import { VirtualSelect } from "@/components/ui/VirtualSelect";
import { fmtCPU, fmtTotalCost, getFormattedTotalCostLabel, getFormattedCostPerUnitLabel } from "@/utils/getCurrentStockDisplay";

export function StockEntryForm({ form, materials, availableUnits, selectedMaterial, watchedQuantity, watchedCostPerUnit, watchedTotalCost, stockEntry, onSubmit, onCancel, headerIcon: HeaderIcon, headerColor, headerTitle, headerDescription, getCurrentStockDisplay, quantityFieldName, unitFieldName, dateFieldName, dateFieldLabel, showReasonField = false, reasonFieldName, hiddenFields = [], disabledFields = [], readOnlyFields = [], submitButtonText, children }: StockEntryFormProps) {
  const { fetchSuppliers } = useSuppliersContext();
  
  useEffect(() => {
    fetchSuppliers();
  }, [fetchSuppliers]);
  const toNumber = (v: string | undefined | null): number => {
    if (!v || v === "") return NaN;
    const n = parseFloat(v);
    return isNaN(n) || !isFinite(n) ? NaN : n;
  };

  const fmtMoney = (n: number): string => {
    if (isNaN(n) || !isFinite(n)) return "";
    return fmtTotalCost(Math.max(0, n), form.getValues(unitFieldName) as string);
  };

  const setValue = <K extends Path<StockFormInputs>>(name: K, value: PathValue<StockFormInputs, K>) => {
    form.setValue(name, value, { shouldValidate: true });
  };

  useEffect(() => {
    const currentMaterialId = form.getValues("materialId");
    if (currentMaterialId !== undefined && typeof currentMaterialId === "number") {
      form.setValue("materialId", String(currentMaterialId));
    }
  }, [form]);

  useEffect(() => {
    const currentUnit = form.getValues(unitFieldName) as string;
    if (currentUnit && !previousUnitRef.current) {
      previousUnitRef.current = currentUnit;
    }
  }, [form.watch(unitFieldName), unitFieldName]);

  const recomputeFromQuantity = (qtyStr: string) => {
    form.setValue(quantityFieldName as any, qtyStr, { shouldValidate: true });
    const qty = toNumber(qtyStr);
    const currentUnit = form.getValues(unitFieldName as any) as string;
    if (isNaN(qty) || qty <= 0) {
      form.setValue("totalCost", "", { shouldValidate: true });
      form.setValue("costPerPurchasedUnit", "", { shouldValidate: true });
      return;
    }
    if (selectedMaterial && currentUnit) {
      const costResult = calculateCostBreakdown(selectedMaterial, stockEntry, qty, currentUnit);
      const formattedCPU = fmtCPU(costResult.costPerUnit, currentUnit);
      form.setValue("costPerPurchasedUnit", formattedCPU, { shouldValidate: false });
      let formattedTotalCost;
      if (costResult.totalCost < 0.01 && costResult.totalCost > 0) {
        formattedTotalCost = costResult.totalCost.toFixed(4);
      } else if (costResult.totalCost < 0.1 && costResult.totalCost > 0) {
        formattedTotalCost = costResult.totalCost.toFixed(3);
      } else {
        formattedTotalCost = fmtMoney(costResult.totalCost);
      }
      form.setValue("totalCost", formattedTotalCost, { shouldValidate: false });
    } else {
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
  };

  const recomputeFromTotal = (totalCostValue: string) => {
    const quantity = form.getValues(quantityFieldName as any) || 0;
    const unit = form.getValues(unitFieldName as any) || "";
    const currentUnit = form.getValues(unitFieldName as any) as string;
    const total = parseCurrency(totalCostValue);
    if (isNaN(total) || total <= 0 || quantity <= 0) {
      form.setValue("costPerPurchasedUnit", "", { shouldValidate: true });
      return;
    }
    let numericValue;
    if (isMassUnit(unit) && (unit === "g" || unit === "oz")) {
      if (total < 0.01) {
        numericValue = parseFloat(total.toFixed(4));
      } else if (total < 0.1) {
        numericValue = parseFloat(total.toFixed(3));
      } else {
        numericValue = parseFloat(total.toFixed(2));
      }
    } else {
      numericValue = parseFloat(total.toFixed(2));
    }
    form.setValue("totalCost", numericValue.toString(), { shouldValidate: true });
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
      const calculatedTotal = qty * cpu;
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
      const total = toNumber(form.getValues("totalCost") as string);
      if (!isNaN(total) && total > 0) {
        const calcQty = total / cpu;
        if (isFinite(calcQty) && !isNaN(calcQty) && calcQty > 0) {
          form.setValue(quantityFieldName as any, formatNumberUI(calcQty, currentUnit), { shouldValidate: true });
        }
      }
    }
  };

  const previousUnitRef = useRef<string>("");

  const handleUnitChange = (newUnit: string) => {
    const currentUnit = previousUnitRef.current || (form.getValues(unitFieldName as any) as string);
    if (!newUnit) return;
    if (!currentUnit || newUnit === currentUnit) {
      form.setValue(unitFieldName as any, newUnit, { shouldValidate: false });
      previousUnitRef.current = newUnit;
      return;
    }
    form.setValue(unitFieldName as any, newUnit, { shouldValidate: false });
    previousUnitRef.current = newUnit;
    const qty = toNumber(form.getValues(quantityFieldName as any) as string);
    if (isNaN(qty) || qty <= 0) {
      if (selectedMaterial) {
        const costResult = calculateCostBreakdown(selectedMaterial, stockEntry, 1, newUnit);
        const formattedCPU = fmtCPU(costResult.costPerUnit, newUnit);
        form.setValue("costPerPurchasedUnit", formattedCPU, { shouldValidate: false });
      }
      return;
    }
    const newQty = qty;
    if (selectedMaterial) {
      const costResult = calculateCostBreakdown(selectedMaterial, stockEntry, newQty, newUnit);
      const formattedCPU = fmtCPU(costResult.costPerUnit, newUnit);
      form.setValue("costPerPurchasedUnit", formattedCPU, { shouldValidate: false });
      let formattedTotalCost;
      if (costResult.totalCost < 0.01 && costResult.totalCost > 0) {
        formattedTotalCost = costResult.totalCost.toFixed(4);
      } else if (costResult.totalCost < 0.1 && costResult.totalCost > 0) {
        formattedTotalCost = costResult.totalCost.toFixed(3);
      } else {
        formattedTotalCost = fmtMoney(costResult.totalCost);
      }
      form.setValue("totalCost", formattedTotalCost, { shouldValidate: false });
    } else {
      const total = toNumber(form.getValues("totalCost") as string);
      const cpu = toNumber(form.getValues("costPerPurchasedUnit") as string);
      if (!isNaN(total) && newQty > 0) {
        setValue("costPerPurchasedUnit", fmtCPU(total / newQty, newUnit));
      } else if (!isNaN(cpu)) {
        let cpuNew = cpu;
        if (isMassUnit(currentUnit) && isMassUnit(newUnit)) {
          const oneNewInOld = convertMass(1, newUnit, currentUnit);
          cpuNew = cpu * oneNewInOld;
        } else if (isVolumeUnit(currentUnit) && isVolumeUnit(newUnit)) {
          const oneNewInOld = convertVolume(1, newUnit, currentUnit);
          cpuNew = cpu * oneNewInOld;
        } else if (selectedMaterial?.unitType === "package" && stockEntry?.purchasedIndividualQuantity) {
          if (UNIT_OPTIONS.package.includes(currentUnit) && (newUnit === stockEntry.purchasedIndividualUnit || UNIT_OPTIONS.piece.includes(newUnit))) {
            cpuNew = cpu / (stockEntry.purchasedIndividualQuantity || 1);
          } else if ((currentUnit === stockEntry.purchasedIndividualUnit || UNIT_OPTIONS.piece.includes(currentUnit)) && UNIT_OPTIONS.package.includes(newUnit)) {
            cpuNew = cpu * (stockEntry.purchasedIndividualQuantity || 1);
          }
        }
        setValue("costPerPurchasedUnit", fmtCPU(cpuNew, newUnit));
        setValue("totalCost", fmtMoney(cpuNew * newQty));
      }
    }
  };

  const handleSubmit = async (data: StockFormInputs) => {
    let totalCostValue = data.totalCost as string;
    if (typeof totalCostValue === "string" && totalCostValue.startsWith("$")) {
      totalCostValue = totalCostValue.substring(1);
    }
    let costPerUnitValue = data.costPerPurchasedUnit as string;
    if (typeof costPerUnitValue === "string" && costPerUnitValue.startsWith("$")) {
      costPerUnitValue = costPerUnitValue.substring(1);
    }
    const qtyValue = data[quantityFieldName as keyof StockFormInputs] as string;
    const qty = toNumber(qtyValue);
    const total = parseCurrency(totalCostValue);
    const currentUnit = data[unitFieldName as keyof StockFormInputs] as string;
    let cpu: number = 0;
    if (!costPerUnitValue || costPerUnitValue === "") {
      if (!isNaN(qty) && qty > 0 && !isNaN(total) && total >= 0) {
        cpu = total / qty;
      }
    } else {
      cpu = parseCurrency(costPerUnitValue);
      if (isNaN(cpu)) {
        cpu = 0;
      }
    }
    if (!qtyValue || (typeof qtyValue === "string" && qtyValue.trim() === "") || isNaN(qty) || qty <= 0) {
      form.setError(quantityFieldName as any, { type: "manual", message: "Quantity must be greater than 0" });
      return;
    }
    if (cpu < 0) {
      form.setError("costPerPurchasedUnit", { type: "manual", message: "Cost per unit must be ≥ 0" });
    }
    await form.trigger();
    const hasErrors = Object.keys(form.formState.errors).length > 0;
    if (hasErrors) {
      if (form.formState.errors.totalCost) {
        form.clearErrors("totalCost");
      }
      const remainingErrors = Object.keys(form.formState.errors);
      if (remainingErrors.length > 0) {
        const firstError = remainingErrors[0] as keyof StockFormInputs | undefined;
        if (firstError) form.setFocus(firstError as any);
        return;
      }
    }
    const formData: StockFormData = {
      ...(data as any),
      [quantityFieldName]: qty.toString(),
      costPerPurchasedUnit: cpu.toString(),
      totalCost: total.toString(),
      purchasedUnit: currentUnit
    } as unknown as StockFormData;
    try {
      onSubmit(formData);
    } catch (error) {
      console.error("❌ FORM: Error in onSubmit:", error);
    }
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
                      {disabledFields.includes("supplier") || readOnlyFields.includes("supplier") ? (
                        <Input placeholder="e.g., ABC Food Distributors" {...field} disabled readOnly />
                      ) : (
                        <SupplierSelector 
                          value={field.value || ""} 
                          onChange={field.onChange}
                        />
                      )}
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
                            const current = toNumber(field.value?.toString()) || 0;
                            const next = current - 1;
                            if (next <= 0) {
                              recomputeFromQuantity("");
                            } else {
                              recomputeFromQuantity(next.toString());
                            }
                          }}
                          disabled={disabledFields.includes("quantity")}
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

                            // Prevent negative values
                            const numValue = parseFloat(normalized);
                            if (numValue < 0 || normalized.startsWith("-")) {
                              return; // Don't update if negative
                            }

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
                            const current = toNumber(field.value?.toString()) || 0;
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
                              if (relevantUnits.size > 0) {
                                const unitsArray = Array.from(relevantUnits);
                                if (!field.value && unitsArray.length > 0) {
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
                            if (selectedMaterial?.baseUnit) {
                              if (!field.value) {
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
                            const units = availableUnits;
                            if (!field.value && units.length > 0) {
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
                            const current = toNumber(field.value as string) || 0;
                            const next = Math.max(0, current - 0.01).toFixed(2);
                            recomputeFromCPU(next);
                          }}
                          disabled={toNumber(field.value as string) <= 0 || disabledFields.includes("costPerUnit") || readOnlyFields.includes("costPerUnit")}
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
                            const current = toNumber(field.value as string) || 0;
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
                            const currentValue = field.value === "" ? 0 : toNumber(field.value as string);
                            const currentUnit = form.watch(unitFieldName) as string;
                            let stepSize = 0.01;
                            if (isMassUnit(currentUnit) && (currentUnit === "g" || currentUnit === "oz")) {
                              if (currentValue < 0.1) {
                                stepSize = 0.001;
                              }
                            }
                            const newValue = Math.max(0, currentValue - stepSize);
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
                          disabled={toNumber(field.value as string) <= 0 || disabledFields.includes("totalCost") || readOnlyFields.includes("totalCost")}
                        >
                          <Minus className="h-4 w-4" />
                        </Button>
                        <Input
                          type="number"
                          step="0.0001"
                          min="0"
                          placeholder="0.0000"
                          value={(() => {
                            const currentUnit = form.watch(unitFieldName) as string;
                            const rawValue = field.value as string;
                            const numericValue = rawValue ? parseCurrency(rawValue) : 0;
                            if (isMassUnit(currentUnit)) {
                              if (currentUnit === "g" || currentUnit === "oz") {
                                if (numericValue < 0.01 && numericValue > 0) {
                                  const formatted = numericValue.toFixed(4);
                                  return formatted;
                                } else if (numericValue < 0.1 && numericValue > 0) {
                                  const formatted = numericValue.toFixed(3);
                                  return formatted;
                                }
                                return numericValue.toFixed(2);
                              }
                            }
                            return numericValue === 0 && rawValue === "" ? "" : numericValue.toFixed(2);
                          })()}
                          disabled={disabledFields.includes("totalCost")}
                          readOnly={readOnlyFields.includes("totalCost")}
                          onChange={e => {
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
                            const currentValue = field.value === "" ? 0 : toNumber(field.value as string);
                            const currentUnit = form.watch(unitFieldName) as string;
                            let stepSize = 0.01;
                            if (isMassUnit(currentUnit) && (currentUnit === "g" || currentUnit === "oz")) {
                              if (currentValue < 0.1) {
                                stepSize = 0.001;
                              }
                            }
                            const newValue = currentValue + stepSize;
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
            <Button
              type="button"
              onClick={() => {
                const currentValues = form.getValues();
                if (typeof currentValues.costPerPurchasedUnit === "string") {
                  if (currentValues.costPerPurchasedUnit.startsWith("$")) {
                    currentValues.costPerPurchasedUnit = currentValues.costPerPurchasedUnit.substring(1);
                  }
                  const numericValue = parseFloat(currentValues.costPerPurchasedUnit);
                  if (!isNaN(numericValue)) {
                    currentValues.costPerPurchasedUnit = numericValue.toString();
                  } else {
                    console.warn("Warning: costPerPurchasedUnit could not be parsed to a number:", currentValues.costPerPurchasedUnit);
                  }
                }
                if (typeof currentValues.totalCost === "string") {
                  if (currentValues.totalCost.startsWith("$")) {
                    currentValues.totalCost = currentValues.totalCost.substring(1);
                  }
                  const numericValue = parseFloat(currentValues.totalCost);
                  if (!isNaN(numericValue)) {
                    currentValues.totalCost = numericValue.toString();
                  } else {
                    console.warn("Warning: totalCost could not be parsed to a number:", currentValues.totalCost);
                  }
                }
                if (readOnlyFields && readOnlyFields.includes("costPerUnit" as any) && (!currentValues.costPerPurchasedUnit || currentValues.costPerPurchasedUnit === "")) {
                  currentValues.costPerPurchasedUnit = watchedCostPerUnit;
                }
                if (readOnlyFields && readOnlyFields.includes("totalCost" as any) && (!currentValues.totalCost || currentValues.totalCost === "")) {
                  currentValues.totalCost = watchedTotalCost;
                }
                form.trigger().then(isValid => {
                  handleSubmit(currentValues as StockFormInputs);
                });
              }}
              disabled={(() => {
                const qtyValue = form.watch(quantityFieldName as any);
                const qty = toNumber(qtyValue);
                return !qtyValue || (typeof qtyValue === "string" && qtyValue.trim() === "") || isNaN(qty) || qty <= 0;
              })()}
            >
              {submitButtonText}
            </Button>
          </div>
        </div>
      </Form>
    </div>
  );
}

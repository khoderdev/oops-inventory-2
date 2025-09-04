import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { NewStockTabProps, StockFormData, StockFormInputs } from "@/types/inventory";
import { format } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import { CalendarIcon, Minus, Plus } from "lucide-react";
import { CostBreakdown } from "../CostBreakdown";
import type { Path, PathValue } from "react-hook-form";
import { convertMass, convertVolume, isMassUnit, isVolumeUnit, formatNumber, formatCurrencyUI } from "@/utils/conversionLogic";
import { VirtualSelect } from "@/components/ui/VirtualSelect";
import { SupplierSelector } from "@/components/suppliers/SupplierSelector";

export function NewStockTab({ form, materials, availableUnits, selectedMaterial, watchedQuantity, watchedCostPerUnit, watchedTotalCost, stockEntry, onSubmit, onCancel }: NewStockTabProps) {
  const toNumber = (v: string | undefined | null): number => {
    if (!v || v === "") return NaN;
    const n = parseFloat(v);
    return isNaN(n) || !isFinite(n) ? NaN : n;
  };

  const fmtMoney = (n: number): string => {
    if (isNaN(n) || !isFinite(n)) return "";
    return Math.max(0, n).toFixed(2);
  };

  const setValue = <K extends Path<StockFormInputs>>(name: K, value: PathValue<StockFormInputs, K>) => {
    form.setValue(name, value, { shouldValidate: true });
  };
  const fmtCPU = (n: number): string => {
    if (!isFinite(n) || isNaN(n) || n < 0) return "";
    const s = formatCurrencyUI(n);
    return s.startsWith("$") ? s.slice(1) : s;
  };
  const handleUnitChange = (newUnit: string) => {
    const currentUnit = form.getValues("purchasedUnit");
    if (!newUnit) return;
    setValue("purchasedUnit", newUnit);
    if (!currentUnit || newUnit === currentUnit) return;
    const qty = toNumber(form.getValues("purchasedQuantity"));
    if (isNaN(qty) || qty <= 0) return;
    let newQty = qty;
    if (isMassUnit(currentUnit) && isMassUnit(newUnit)) {
      newQty = convertMass(qty, currentUnit, newUnit);
    } else if (isVolumeUnit(currentUnit) && isVolumeUnit(newUnit)) {
      newQty = convertVolume(qty, currentUnit, newUnit);
    } else {
      return;
    }
    const total = toNumber(form.getValues("totalCost"));
    const cpu = toNumber(form.getValues("costPerPurchasedUnit"));
    setValue("purchasedQuantity", formatNumber(newQty, newUnit));
    if (!isNaN(total) && newQty > 0) {
      setValue("costPerPurchasedUnit", fmtCPU(total / newQty));
    } else if (!isNaN(cpu)) {
      let cpuNew = cpu;
      if (isMassUnit(currentUnit) && isMassUnit(newUnit)) {
        const oneNewInOld = convertMass(1, newUnit, currentUnit);
        cpuNew = cpu * oneNewInOld;
      } else if (isVolumeUnit(currentUnit) && isVolumeUnit(newUnit)) {
        const oneNewInOld = convertVolume(1, newUnit, currentUnit);
        cpuNew = cpu * oneNewInOld;
      }
      setValue("costPerPurchasedUnit", fmtCPU(cpuNew));
      setValue("totalCost", fmtMoney(cpuNew * newQty));
    }
  };

  const recomputeFromQuantity = (qtyStr: string) => {
    setValue("purchasedQuantity", qtyStr);
    const qty = toNumber(qtyStr);
    const total = toNumber(form.getValues("totalCost"));
    const cpu = toNumber(form.getValues("costPerPurchasedUnit"));
    if (isNaN(qty) || qty <= 0) {
      setValue("totalCost", "");
      return;
    }
    if (!isNaN(cpu) && cpu > 0) {
      setValue("totalCost", fmtMoney(qty * cpu));
    } else if (!isNaN(total)) {
      setValue("costPerPurchasedUnit", fmtCPU(total / qty));
    } else {
      setValue("totalCost", "");
      setValue("costPerPurchasedUnit", "");
    }
  };

  const recomputeFromTotal = (totalStr: string) => {
    setValue("totalCost", totalStr);
    const total = toNumber(totalStr);
    const qty = toNumber(form.getValues("purchasedQuantity"));
    const cpu = toNumber(form.getValues("costPerPurchasedUnit"));
    if (isNaN(total)) {
      setValue("costPerPurchasedUnit", "");
      return;
    }
    if (!isNaN(qty) && qty > 0) {
      setValue("costPerPurchasedUnit", fmtCPU(total / qty));
    } else if (!isNaN(cpu) && cpu > 0) {
      const calcQty = total / cpu;
      if (isFinite(calcQty) && !isNaN(calcQty) && calcQty > 0) {
        const unit = form.getValues("purchasedUnit");
        setValue("purchasedQuantity", formatNumber(calcQty, unit));
      }
    }
  };

  const recomputeFromCPU = (cpuStr: string) => {
    setValue("costPerPurchasedUnit", cpuStr);
    const cpu = toNumber(cpuStr);
    const qty = toNumber(form.getValues("purchasedQuantity"));
    const total = toNumber(form.getValues("totalCost"));
    if (isNaN(cpu)) {
      setValue("totalCost", "");
      return;
    }
    if (!isNaN(qty) && qty > 0) {
      setValue("totalCost", fmtMoney(qty * cpu));
    } else if (!isNaN(total) && cpu > 0) {
      const calcQty = total / cpu;
      if (isFinite(calcQty) && !isNaN(calcQty)) {
        const unit = form.getValues("purchasedUnit");
        setValue("purchasedQuantity", formatNumber(Math.max(0, calcQty), unit));
      }
    }
  };

  const handleSubmit = async (data: StockFormInputs) => {
    await form.trigger();

    const qty = toNumber(data.purchasedQuantity);
    const total = toNumber(data.totalCost);
    const cpu = data.costPerPurchasedUnit === "" || data.costPerPurchasedUnit == null ? (!isNaN(qty) && qty > 0 && !isNaN(total) ? total / qty : NaN) : toNumber(data.costPerPurchasedUnit);

    if (isNaN(qty) || qty <= 0) {
      form.setError("purchasedQuantity", { type: "manual", message: "Quantity must be greater than 0" });
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
      materialId: data.materialId,
      purchasedQuantity: qty,
      purchasedUnit: data.purchasedUnit,
      purchasedIndividualQuantity: data.purchasedIndividualQuantity ? toNumber(data.purchasedIndividualQuantity) : undefined,
      purchasedIndividualUnit: data.purchasedIndividualUnit,
      costPerPurchasedUnit: Number(cpu.toFixed(2)),
      totalCost: Number(total.toFixed(2)),
      purchaseDate: data.purchaseDate!,
      expiryDate: data.expiryDate,
      batchNumber: data.batchNumber ?? "",
      notes: data.notes,
      wasteQuantity: data.wasteQuantity ? toNumber(data.wasteQuantity) : undefined,
      wasteReason: data.wasteReason,
      wasteDate: data.wasteDate,
      supplier: data.supplier
    };

    console.log("Submitting stock entry with supplier data:", formData.supplier);
    onSubmit(formData);
  };

  return (
    <div className="space-y-6">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 py-4">
            {/* Material */}
            <FormField
              control={form.control}
              name="materialId"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel className="flex items-center gap-1">
                    Material <span className="text-red-500">*</span>
                  </FormLabel>
                  <FormControl>
                    <div className="w-full">
                      <VirtualSelect
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

            {/* Supplier */}
            <FormField
              control={form.control}
              name="supplier"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel className="flex items-center gap-1">Supplier</FormLabel>
                  <FormControl>
                    <SupplierSelector
                      value={field.value}
                      onChange={supplierObject => {
                        console.log("Supplier selected in NewStockTab:", supplierObject);
                        field.onChange(supplierObject);
                      }}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Purchased Unit */}
            <FormField
              control={form.control}
              name="purchasedUnit"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel className="flex items-center gap-1">
                    Unit <span className="text-red-500">*</span>
                  </FormLabel>
                  <Select onValueChange={handleUnitChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger className="h-10 w-full border-gray-200">
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

            {/* Purchased Quantity */}
            <FormField
              control={form.control}
              name="purchasedQuantity"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>
                    Purchased Quantity <span className="text-red-500">*</span>
                  </FormLabel>
                  <FormControl>
                    <div className="flex w-full rounded-md shadow-sm border border-gray-200 overflow-hidden">
                      {/* Minus */}
                      <button
                        type="button"
                        className="h-10 w-10 flex items-center justify-center border-r border-gray-200 bg-gray-50 hover:bg-gray-100"
                        onClick={() => {
                          const current = Number(field.value) || 0;
                          const next = Math.max(0, current - 1).toString();
                          recomputeFromQuantity(next);
                        }}
                        disabled={!field.value}
                      >
                        <Minus className="h-4 w-4 text-gray-600" />
                      </button>

                      {/* Input */}
                      <input
                        type="text"
                        value={field.value || ""}
                        placeholder="0"
                        onChange={e => {
                          const cleaned = e.target.value.replace(/[^0-9.]/g, "");
                          const parts = cleaned.split(".");
                          const normalized = parts.length > 2 ? parts[0] + "." + parts.slice(1).join("") : cleaned;
                          recomputeFromQuantity(normalized);
                        }}
                        className="h-10 flex-1 w-20 text-center font-medium border-0 focus:ring-0 focus:outline-none"
                      />

                      {/* Plus */}
                      <button
                        type="button"
                        className="h-10 w-10 flex items-center justify-center border-l border-gray-200 bg-gray-50 hover:bg-gray-100"
                        onClick={() => {
                          const current = Number(field.value) || 0;
                          const next = (current + 1).toString();
                          recomputeFromQuantity(next);
                        }}
                      >
                        <Plus className="h-4 w-4 text-gray-600" />
                      </button>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Total Cost */}
            <FormField
              control={form.control}
              name="totalCost"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Total Cost ($)</FormLabel>
                  <FormControl>
                    <div className="flex w-full rounded-md shadow-sm border border-gray-200 overflow-hidden">
                      <button
                        type="button"
                        className="h-10 w-10 flex items-center justify-center border-r border-gray-200 bg-gray-50 hover:bg-gray-100"
                        onClick={() => {
                          const currentValue = field.value === "" ? 0 : parseFloat(field.value);
                          const newValue = Math.max(0, currentValue - 0.01);
                          const next = newValue === 0 ? "" : newValue.toFixed(2);
                          recomputeFromTotal(next);
                        }}
                        disabled={!field.value || field.value === ""}
                      >
                        <Minus className="h-4 w-4 text-gray-600" />
                      </button>
                      <input
                        type="text"
                        value={field.value || ""}
                        placeholder="0.00"
                        className="h-10 flex-1 w-20 text-center font-medium border-0 focus:ring-0 focus:outline-none"
                        onChange={e => {
                          const cleaned = e.target.value.replace(/[^0-9.]/g, "");
                          recomputeFromTotal(cleaned);
                        }}
                      />
                      <button
                        type="button"
                        className="h-10 w-10 flex items-center justify-center border-l border-gray-200 bg-gray-50 hover:bg-gray-100"
                        onClick={() => {
                          const currentValue = field.value === "" ? 0 : parseFloat(field.value);
                          const newValue = currentValue + 0.01;
                          const next = newValue.toFixed(2);
                          recomputeFromTotal(next);
                        }}
                      >
                        <Plus className="h-4 w-4" />
                      </button>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Cost per Unit */}
            <FormField
              control={form.control}
              name="costPerPurchasedUnit"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>
                    Cost per Unit ($) <span className="text-red-500">*</span>
                  </FormLabel>
                  <FormControl>
                    <div className="flex w-full rounded-md shadow-sm border border-gray-200 overflow-hidden">
                      <button
                        type="button"
                        className="h-10 w-10 flex items-center justify-center border-r border-gray-200 bg-gray-50 hover:bg-gray-100"
                        onClick={() => {
                          const current = parseFloat(field.value) || 0;
                          const next = Math.max(0, current - 0.01).toFixed(2);
                          recomputeFromCPU(next);
                        }}
                        disabled={true}
                      >
                        <Minus className="h-4 w-4" />
                      </button>
                      <input
                        type="text"
                        value={field.value || ""}
                        placeholder="0.00"
                        className="h-10 flex-1 w-20 text-center font-medium border-0 focus:ring-0 focus:outline-none"
                        disabled={true}
                        onChange={e => {
                          const cleaned = e.target.value.replace(/[^0-9.]/g, "");
                          recomputeFromCPU(cleaned);
                        }}
                      />
                      <button
                        disabled={true}
                        type="button"
                        className="h-10 w-10 flex items-center justify-center border-l border-gray-200 bg-gray-50 hover:bg-gray-100"
                        onClick={() => {
                          const current = parseFloat(field.value) || 0;
                          const next = (current + 0.01).toFixed(2);
                          recomputeFromCPU(next);
                        }}
                      >
                        <Plus className="h-4 w-4" />
                      </button>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Purchase Date */}
            <FormField
              control={form.control}
              name="purchaseDate"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Purchase Date</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button variant="outline" className={cn("w-full h-10 justify-between border-gray-200", !field.value && "text-muted-foreground")}>
                          {field.value ? format(field.value, "PPP") : "Pick a date"}
                          <CalendarIcon className="h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar mode="single" selected={field.value} onSelect={field.onChange} disabled={date => date > new Date()} />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <CostBreakdown selectedMaterial={selectedMaterial} quantity={watchedQuantity} purchasedUnit={form.watch("purchasedUnit")} costPerPurchasedUnit={watchedCostPerUnit} totalCost={watchedTotalCost} />

          <div className="flex gap-3 justify-end">
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
            <Button type="submit">{stockEntry ? "Update Stock Entry" : "Add Stock Entry"}</Button>
          </div>
        </form>
      </Form>
    </div>
  );
}

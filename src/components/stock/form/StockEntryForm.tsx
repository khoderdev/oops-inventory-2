import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { StockFormData, StockFormInputs } from "@/types/inventory";
import { format } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import { CalendarIcon, LucideIcon, Minus, Plus } from "lucide-react";
import { CostBreakdown } from "../CostBreakdown";
import { useEffect } from "react";
import type { Path, PathValue, UseFormReturn } from "react-hook-form";
import { convertMass, convertVolume, isMassUnit, isVolumeUnit, formatNumber, formatCurrencyUI } from "@/utils/conversionLogic";
import { VirtualSelect } from "@/components/ui/VirtualSelect";
import { Material } from "@/types/inventory";

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
  
  // Button customization
  submitButtonText: string;
  
  // Children elements
  children?: React.ReactNode;
}

export function StockEntryForm({
  form,
  materials,
  availableUnits,
  selectedMaterial,
  watchedQuantity,
  watchedCostPerUnit,
  watchedTotalCost,
  stockEntry,
  onSubmit,
  onCancel,
  headerIcon: HeaderIcon,
  headerColor,
  headerTitle,
  headerDescription,
  getCurrentStockDisplay,
  quantityFieldName,
  unitFieldName,
  dateFieldName,
  dateFieldLabel,
  showReasonField = false,
  reasonFieldName,
  submitButtonText,
  children
}: StockEntryFormProps) {
  // Utility functions for number handling and formatting
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

  // Ensure materialId is always a string
  useEffect(() => {
    const currentMaterialId = form.getValues("materialId");
    if (currentMaterialId !== undefined && typeof currentMaterialId === "number") {
      form.setValue("materialId", String(currentMaterialId));
    }
  }, [form]);

  // Recompute functions for handling field changes without infinite loops
  const recomputeFromQuantity = (qtyStr: string) => {
    setValue(quantityFieldName as any, qtyStr);
    const qty = toNumber(qtyStr);
    const total = toNumber(form.getValues("totalCost") as string);
    const cpu = toNumber(form.getValues("costPerPurchasedUnit") as string);

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
    const qtyValue = form.getValues(quantityFieldName);
    const qty = typeof qtyValue === 'string' ? toNumber(qtyValue) : 0;
    const cpuValue = form.getValues("costPerPurchasedUnit");
    const cpu = typeof cpuValue === 'string' ? toNumber(cpuValue) : 0;

    if (isNaN(total)) {
      setValue("costPerPurchasedUnit", "");
      return;
    }

    if (!isNaN(qty) && qty > 0) {
      setValue("costPerPurchasedUnit", fmtCPU(total / qty));
    } else if (!isNaN(cpu) && cpu > 0) {
      const calcQty = total / cpu;
      if (isFinite(calcQty) && !isNaN(calcQty) && calcQty > 0) {
        const unit = form.getValues(unitFieldName) as string;
        setValue(quantityFieldName, formatNumber(calcQty, unit));
      }
    }
  };

  const recomputeFromCPU = (cpuStr: string) => {
    setValue("costPerPurchasedUnit", cpuStr);
    const cpu = toNumber(cpuStr);
    const qty = toNumber(form.getValues(quantityFieldName) as string);
    const total = toNumber(form.getValues("totalCost") as string);

    if (isNaN(cpu)) {
      setValue("totalCost", "");
      return;
    }

    if (!isNaN(qty) && qty > 0) {
      setValue("totalCost", fmtMoney(qty * cpu));
    } else if (!isNaN(total) && cpu > 0) {
      const calcQty = total / cpu;
      if (isFinite(calcQty) && !isNaN(calcQty)) {
        const unit = form.getValues(unitFieldName) as string;
        setValue(quantityFieldName, formatNumber(Math.max(0, calcQty), unit));
      }
    }
  };

  const handleUnitChange = (newUnit: string) => {
    const currentUnit = form.getValues(unitFieldName) as string;
    if (!newUnit) return;
    setValue(unitFieldName as any, newUnit);
    if (!currentUnit || newUnit === currentUnit) return;

    const qty = toNumber(form.getValues(quantityFieldName) as string);
    if (isNaN(qty) || qty <= 0) return;

    let newQty = qty;
    if (isMassUnit(currentUnit) && isMassUnit(newUnit)) {
      newQty = convertMass(qty, currentUnit, newUnit);
    } else if (isVolumeUnit(currentUnit) && isVolumeUnit(newUnit)) {
      newQty = convertVolume(qty, currentUnit, newUnit);
    } else {
      return;
    }

    const total = toNumber(form.getValues("totalCost") as string);
    const cpu = toNumber(form.getValues("costPerPurchasedUnit") as string);
    setValue(quantityFieldName as any, formatNumber(newQty, newUnit));

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
              name="supplier"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Supplier</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., ABC Food Distributors" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

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
                        disabled={parseFloat(field.value?.toString() || "0") <= 0}
                      >
                        <Minus className="h-4 w-4" />
                      </Button>
                      <Input
                        type="number"
                        step="1"
                        min="0"
                        placeholder="0"
                        {...field}
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
              name={unitFieldName as any}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Unit</FormLabel>
                  <Select onValueChange={handleUnitChange} value={field.value?.toString() || ""}>
                    <FormControl>
                      <SelectTrigger>
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

            {showReasonField && reasonFieldName && (
              <FormField
                control={form.control}
                name={reasonFieldName as any}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Reason</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value?.toString() || ""}>
                      <FormControl>
                        <SelectTrigger>
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

            <FormField
              control={form.control}
              name="costPerPurchasedUnit"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Cost Per Unit ($)</FormLabel>
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
                        disabled={parseFloat(field.value as string) <= 0}
                      >
                        <Minus className="h-4 w-4" />
                      </Button>
                      <Input
                        type="number"
                        step="0.000001"
                        min="0"
                        placeholder="0.000000"
                        value={field.value}
                        onChange={e => {
                          const cleaned = e.target.value.replace(/[^0-9.]/g, "");
                          recomputeFromCPU(cleaned);
                        }}
                        className="h-11 border-gray-300 focus:border-blue-500 focus:ring-blue-500 text-center font-medium overflow-hidden flex-1 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
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
              name="totalCost"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Total Cost ($)</FormLabel>
                  <FormControl>
                    <div className="flex items-center gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        className="h-11 w-11 border-gray-300 hover:border-blue-500 hover:bg-blue-50"
                        onClick={() => {
                          const currentValue = field.value === "" ? 0 : parseFloat(field.value as string);
                          const newValue = Math.max(0, currentValue - 0.01);
                          const next = newValue === 0 ? "" : newValue.toFixed(2);
                          recomputeFromTotal(next);
                        }}
                        disabled={parseFloat(field.value as string) <= 0}
                      >
                        <Minus className="h-4 w-4" />
                      </Button>
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder="0.00"
                        value={field.value}
                        onChange={e => {
                          const cleaned = e.target.value.replace(/[^0-9.]/g, "");
                          recomputeFromTotal(cleaned);
                        }}
                        className="h-11 border-gray-300 focus:border-blue-500 focus:ring-blue-500 text-center font-medium overflow-hidden flex-1 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        className="h-11 w-11 border-gray-300 hover:border-blue-500 hover:bg-blue-50"
                        onClick={() => {
                          const currentValue = field.value === "" ? 0 : parseFloat(field.value as string);
                          const newValue = currentValue + 0.01;
                          const next = newValue.toFixed(2);
                          recomputeFromTotal(next);
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
              name={dateFieldName as any}
              render={({ field }) => (
                <FormItem className="flex flex-col mt-3">
                  <FormLabel>{dateFieldLabel}</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button variant="outline" className={cn("w-full pl-3 text-left font-normal", !field.value && "text-muted-foreground")}>
                          {field.value ? format(field.value as Date, "PPP") : <span>Pick a date</span>}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value as Date}
                        onSelect={field.onChange}
                        disabled={(date: Date) => date > new Date()}
                        initialFocus
                        className="p-3 pointer-events-auto"
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <CostBreakdown selectedMaterial={selectedMaterial} quantity={watchedQuantity} purchasedUnit={form.watch(unitFieldName) as string} costPerPurchasedUnit={watchedCostPerUnit} totalCost={watchedTotalCost} />

          <div className="flex gap-3 justify-end">
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
            <Button
              type="button"
              onClick={form.handleSubmit(handleSubmit)}
            >
              {submitButtonText}
            </Button>
          </div>
        </div>
      </Form>
    </div>
  );
}

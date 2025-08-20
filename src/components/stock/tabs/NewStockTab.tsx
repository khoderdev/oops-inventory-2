import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { NewStockTabProps, StockFormData, StockFormInputs } from "@/types/inventory";
import { format } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import { CalendarIcon, Minus, Plus } from "lucide-react";
import { CostBreakdown } from "../CostBreakdown";
import { useEffect, useState } from "react";

export function NewStockTab({ form, materials, availableUnits, selectedMaterial, watchedQuantity, watchedCostPerUnit, watchedTotalCost, stockEntry, onSubmit, onCancel }: NewStockTabProps) {
  const [lastChangedField, setLastChangedField] = useState<string | null>(null);

  useEffect(() => {
    const isQuantityEmpty = watchedQuantity === "";
    const isCostPerUnitEmpty = watchedCostPerUnit === "";
    const isTotalCostEmpty = watchedTotalCost === "";
    const quantity = isQuantityEmpty ? 0 : parseFloat(watchedQuantity);
    const costPerUnit = isCostPerUnitEmpty ? 0 : parseFloat(watchedCostPerUnit);
    const totalCost = isTotalCostEmpty ? 0 : parseFloat(watchedTotalCost);
    
    if (lastChangedField === "totalCost") {
      // When total cost is changed
      if (!isTotalCostEmpty) {
        if (quantity > 0) {
          // If quantity exists, calculate cost per unit
          const calculatedCostPerUnit = totalCost / quantity;
          if (!isNaN(calculatedCostPerUnit) && calculatedCostPerUnit > 0) {
            form.setValue("costPerPurchasedUnit", calculatedCostPerUnit.toFixed(2), { shouldValidate: true });
          }
        } else if (!isCostPerUnitEmpty) {
          // If quantity is empty but cost per unit exists, update quantity based on total and cost per unit
          const calculatedQuantity = totalCost / costPerUnit;
          if (!isNaN(calculatedQuantity) && calculatedQuantity > 0) {
            form.setValue("purchasedQuantity", Math.round(calculatedQuantity).toString(), { shouldValidate: true });
          }
        }
        // If both quantity and cost per unit are empty, do nothing and wait for user input
      }
    } else if (lastChangedField === "purchasedQuantity") {
      // When quantity is changed
      if (isQuantityEmpty) {
        if (!isCostPerUnitEmpty) {
          form.setValue("totalCost", "", { shouldValidate: true });
        }
      } else if (quantity > 0) {
        if (costPerUnit > 0) {
          // If cost per unit exists, calculate total
          const calculatedTotal = quantity * costPerUnit;
          form.setValue("totalCost", calculatedTotal.toFixed(2), { shouldValidate: true });
        } else if (!isTotalCostEmpty) {
          // If total cost exists but not cost per unit, calculate cost per unit
          const calculatedCostPerUnit = totalCost / quantity;
          if (!isNaN(calculatedCostPerUnit) && calculatedCostPerUnit > 0) {
            form.setValue("costPerPurchasedUnit", calculatedCostPerUnit.toFixed(2), { shouldValidate: true });
          }
        }
      }
    } else if (lastChangedField === "costPerPurchasedUnit") {
      // When cost per unit is changed
      if (isCostPerUnitEmpty) {
        if (!isQuantityEmpty) {
          form.setValue("totalCost", "", { shouldValidate: true });
        }
      } else if (costPerUnit > 0) {
        if (quantity > 0) {
          // If quantity exists, calculate total
          const calculatedTotal = quantity * costPerUnit;
          form.setValue("totalCost", calculatedTotal.toFixed(2), { shouldValidate: true });
        } else if (!isTotalCostEmpty) {
          // If total cost exists but not quantity, calculate quantity
          const calculatedQuantity = totalCost / costPerUnit;
          if (!isNaN(calculatedQuantity) && calculatedQuantity > 0) {
            form.setValue("purchasedQuantity", Math.round(calculatedQuantity).toString(), { shouldValidate: true });
          }
        }
      }
    }
  }, [watchedQuantity, watchedCostPerUnit, watchedTotalCost, form, lastChangedField]);
  const handleSubmit = async (data: StockFormInputs) => {
    const requiredFields = [
      { name: "materialId", element: document.querySelector('[name="materialId"]') },
      { name: "supplier", element: document.querySelector('[name="supplier"]') },
      { name: "purchasedQuantity", element: document.querySelector('[name="purchasedQuantity"]') },
      { name: "purchasedUnit", element: document.querySelector('[name="purchasedUnit"]') },
      { name: "costPerPurchasedUnit", element: document.querySelector('[name="costPerPurchasedUnit"]') }
    ];
    for (const field of requiredFields) {
      const value = form.getValues(field.name as keyof StockFormInputs);
      const isEmpty = !value || (typeof value === "string" && value.trim() === "") || (field.name === "purchasedQuantity" && parseFloat(value as string) <= 0) || (field.name === "costPerPurchasedUnit" && parseFloat(value as string) < 0);
      if (isEmpty && field.element) {
        field.element.scrollIntoView({ behavior: "smooth", block: "center" });
        (field.element as HTMLElement).focus();
        form.trigger(field.name as keyof StockFormInputs);
        return;
      }
    }
    const formData = data as unknown as StockFormData;
    onSubmit(formData);
  };

  return (
    <div className="space-y-6">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
            <FormField
              control={form.control}
              name="materialId"
              render={({ field, fieldState }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-1">
                    Material
                    <span className="text-red-500 text-sm">*</span>
                  </FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger className={cn("transition-colors", !field.value && "border-red-200 focus:border-red-500", field.value && !fieldState.error && "border-green-200 focus:border-green-500")}>
                        <SelectValue placeholder="Select material" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {materials.map(material => {
                        const displayUnit = material.unitType === "package" && material.inputUnit ? material.inputUnit : material.baseUnit;
                        return (
                          <SelectItem key={material.id} value={material.id.toString()}>
                            {material.name} ({displayUnit})
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="supplier"
              render={({ field, fieldState }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-1">
                    Supplier
                    <span className="text-red-500 text-sm">*</span>
                  </FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., ABC Food Distributors" {...field} className={cn("transition-colors", !field.value && "border-red-200 focus:border-red-500", field.value && !fieldState.error && "border-green-200 focus:border-green-500")} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="purchasedQuantity"
              render={({ field, fieldState }) => {
                const hasValue = field.value && field.value !== "";
                return (
                  <FormItem>
                    <FormLabel className="flex items-center gap-1">
                      Purchased Quantity
                      <span className="text-red-500 text-sm">*</span>
                    </FormLabel>
                    <FormControl>
                      <div className="flex items-center gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          className="h-11 w-11 border-green-300 hover:border-green-500 hover:bg-green-50"
                          onClick={() => {
                            const currentValue = field.value === "" ? 0 : parseInt(field.value, 10);
                            const newValue = Math.max(0, currentValue - 1);
                            field.onChange(newValue === 0 ? "" : newValue.toString());
                            setLastChangedField("purchasedQuantity");
                          }}
                          disabled={!field.value || field.value === ""}
                        >
                          <Minus className="h-4 w-4" />
                        </Button>
                        <input
                          type="text"
                          placeholder=""
                          value={field.value || ""}
                          onKeyDown={e => {
                            if (!/[0-9]/.test(e.key) && e.key !== "Backspace" && e.key !== "Delete" && e.key !== "ArrowLeft" && e.key !== "ArrowRight" && e.key !== "Tab") {
                              e.preventDefault();
                            }
                          }}
                          onChange={e => {
                            const value = e.target.value.replace(/[^0-9]/g, "");
                            field.onChange(value);
                            setLastChangedField("purchasedQuantity");
                          }}
                          className={cn("h-11 text-center font-medium overflow-hidden flex-1 border rounded-md px-3 py-2", !hasValue && "border-red-200 focus:border-red-500 focus:ring-red-500", hasValue && !fieldState.error && "border-green-300 focus:border-green-500 focus:ring-green-500")}
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          className="h-11 w-11 border-green-300 hover:border-green-500 hover:bg-green-50"
                          onClick={() => {
                            const currentValue = field.value === "" ? 0 : parseInt(field.value, 10);
                            const newValue = currentValue + 1;
                            field.onChange(newValue.toString());
                            setLastChangedField("purchasedQuantity");
                          }}
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                );
              }}
            />

            <FormField
              control={form.control}
              name="purchasedUnit"
              render={({ field, fieldState }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-1">
                    Unit
                    <span className="text-red-500 text-sm">*</span>
                  </FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger className={cn("transition-colors", !field.value && "border-red-200 focus:border-red-500", field.value && !fieldState.error && "border-green-200 focus:border-green-500")}>
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

            <FormField
              control={form.control}
              name="costPerPurchasedUnit"
              render={({ field, fieldState }) => {
                const hasValue = field.value && field.value !== "";
                return (
                  <FormItem>
                    <FormLabel className="flex items-center gap-1">
                      Cost per Unit ($)
                      <span className="text-red-500 text-sm">*</span>
                    </FormLabel>
                    <FormControl>
                      <div className="flex items-center gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          className="h-11 w-11 border-gray-300 hover:border-blue-500 hover:bg-blue-50"
                          onClick={() => {
                            const currentValue = field.value === "" ? 0 : parseFloat(field.value);
                            const newValue = Math.max(0, currentValue - 0.01);
                            field.onChange(newValue === 0 ? "" : newValue.toFixed(2));
                            setLastChangedField("costPerPurchasedUnit");
                          }}
                          disabled={!field.value || field.value === ""}
                        >
                          <Minus className="h-4 w-4" />
                        </Button>
                        <input
                          type="text"
                          placeholder=""
                          value={field.value || ""}
                          onKeyDown={e => {
                            if (!/[0-9.]/.test(e.key) && e.key !== "Backspace" && e.key !== "Delete" && e.key !== "ArrowLeft" && e.key !== "ArrowRight" && e.key !== "Tab") {
                              e.preventDefault();
                            }
                          }}
                          onChange={e => {
                            const value = e.target.value.replace(/[^0-9.]/g, "");
                            // Ensure only one decimal point
                            const parts = value.split(".");
                            const formattedValue = parts.length > 2 ? parts[0] + "." + parts.slice(1).join("") : value;
                            field.onChange(formattedValue);
                            setLastChangedField("costPerPurchasedUnit");
                          }}
                          className={cn("h-11 text-center font-medium overflow-hidden flex-1 border rounded-md px-3 py-2", !hasValue && "border-red-200 focus:border-red-500 focus:ring-red-500", hasValue && !fieldState.error && "border-green-300 focus:border-green-500 focus:ring-green-500")}
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          className="h-11 w-11 border-gray-300 hover:border-blue-500 hover:bg-blue-50"
                          onClick={() => {
                            const currentValue = field.value === "" ? 0 : parseFloat(field.value);
                            const newValue = currentValue + 0.01;
                            field.onChange(newValue.toFixed(2));
                            setLastChangedField("costPerPurchasedUnit");
                          }}
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                );
              }}
            />

            <FormField
              control={form.control}
              name="totalCost"
              render={({ field, fieldState }) => {
                const hasValue = field.value && field.value !== "";
                return (
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
                            const currentValue = field.value === "" ? 0 : parseFloat(field.value);
                            const newValue = Math.max(0, currentValue - 0.01);
                            field.onChange(newValue === 0 ? "" : newValue.toFixed(2));
                            setLastChangedField("totalCost");
                          }}
                          disabled={!field.value || field.value === ""}
                        >
                          <Minus className="h-4 w-4" />
                        </Button>
                        <input
                          type="text"
                          placeholder=""
                          value={field.value || ""}
                          onKeyDown={e => {
                            if (!/[0-9.]/.test(e.key) && e.key !== "Backspace" && e.key !== "Delete" && e.key !== "ArrowLeft" && e.key !== "ArrowRight" && e.key !== "Tab") {
                              e.preventDefault();
                            }
                          }}
                          onChange={e => {
                            const value = e.target.value.replace(/[^0-9.]/g, "");
                            // Ensure only one decimal point
                            const parts = value.split(".");
                            const formattedValue = parts.length > 2 ? parts[0] + "." + parts.slice(1).join("") : value;
                            field.onChange(formattedValue);
                            setLastChangedField("totalCost");
                          }}
                          className={cn("h-11 text-center font-medium overflow-hidden flex-1 border rounded-md px-3 py-2", !hasValue && "border-red-200 focus:border-red-500 focus:ring-red-500", hasValue && !fieldState.error && "border-green-300 focus:border-green-500 focus:ring-green-500")}
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          className="h-11 w-11 border-gray-300 hover:border-blue-500 hover:bg-blue-50"
                          onClick={() => {
                            const currentValue = field.value === "" ? 0 : parseFloat(field.value);
                            const newValue = currentValue + 0.01;
                            field.onChange(newValue.toFixed(2));
                            setLastChangedField("totalCost");
                          }}
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                );
              }}
            />

            <FormField
              control={form.control}
              name="purchaseDate"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Purchase Date</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button variant="outline" className={cn("w-full pl-3 text-left font-normal", !field.value && "text-muted-foreground")}>
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

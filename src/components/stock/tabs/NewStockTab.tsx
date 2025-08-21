import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { NewStockTabProps, StockFormData, StockFormInputs } from "@/types/inventory";
import { format } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import { CalendarIcon, Minus, Plus, Trash2 } from "lucide-react";
import { CostBreakdown } from "../CostBreakdown";
import { useEffect, useState } from "react";

export function NewStockTab({ form, materials, availableUnits, selectedMaterial, watchedQuantity, watchedCostPerUnit, watchedTotalCost, stockEntry, onSubmit, onCancel }: NewStockTabProps) {
  const [lastChangedField, setLastChangedField] = useState<string | null>(null);

  useEffect(() => {
    // Skip calculations if no field has been changed yet
    if (!lastChangedField) return;

    // Parse values with consistent handling
    const isQuantityEmpty = !watchedQuantity || watchedQuantity === "";
    const isCostPerUnitEmpty = !watchedCostPerUnit || watchedCostPerUnit === "";
    const isTotalCostEmpty = !watchedTotalCost || watchedTotalCost === "";

    // Convert to numbers with fallbacks
    const quantity = isQuantityEmpty ? 0 : parseFloat(watchedQuantity);
    const costPerUnit = isCostPerUnitEmpty ? 0 : parseFloat(watchedCostPerUnit);
    const totalCost = isTotalCostEmpty ? 0 : parseFloat(watchedTotalCost);

    console.log(`Calculating with lastChangedField=${lastChangedField}, quantity=${quantity}, costPerUnit=${costPerUnit}, totalCost=${totalCost}`);

    if (lastChangedField === "totalCost") {
      if (isTotalCostEmpty) {
        // Clear cost per unit when total cost is cleared
        form.setValue("costPerPurchasedUnit", "", { shouldValidate: true });
      } else {
        if (quantity > 0) {
          // Calculate cost per unit from total cost and quantity
          const calculatedCostPerUnit = totalCost / quantity;
          if (!isNaN(calculatedCostPerUnit) && isFinite(calculatedCostPerUnit)) {
            // Format to 2 decimal places and ensure it's positive
            const formattedCostPerUnit = Math.max(0, calculatedCostPerUnit).toFixed(2);
            console.log(`Setting costPerUnit to ${formattedCostPerUnit} from totalCost=${totalCost} / quantity=${quantity}`);
            form.setValue("costPerPurchasedUnit", formattedCostPerUnit, { shouldValidate: true });
          }
        } else if (!isCostPerUnitEmpty) {
          // Calculate quantity from total cost and cost per unit
          const calculatedQuantity = totalCost / costPerUnit;
          if (!isNaN(calculatedQuantity) && isFinite(calculatedQuantity) && calculatedQuantity > 0) {
            console.log(`Setting quantity to ${Math.round(calculatedQuantity)} from totalCost=${totalCost} / costPerUnit=${costPerUnit}`);
            form.setValue("purchasedQuantity", Math.round(calculatedQuantity).toString(), { shouldValidate: true });
          }
        }
      }
    } else if (lastChangedField === "purchasedQuantity") {
      if (isQuantityEmpty) {
        // Clear total cost if quantity is empty
        form.setValue("totalCost", "", { shouldValidate: true });
      } else if (quantity > 0) {
        if (costPerUnit > 0) {
          // Calculate total from quantity and cost per unit
          const calculatedTotal = quantity * costPerUnit;
          console.log(`Setting totalCost to ${calculatedTotal.toFixed(2)} from quantity=${quantity} * costPerUnit=${costPerUnit}`);
          form.setValue("totalCost", calculatedTotal.toFixed(2), { shouldValidate: true });
        } else if (!isTotalCostEmpty) {
          // Calculate cost per unit from total and quantity
          const calculatedCostPerUnit = totalCost / quantity;
          if (!isNaN(calculatedCostPerUnit) && isFinite(calculatedCostPerUnit)) {
            // Format to 2 decimal places and ensure it's positive
            const formattedCostPerUnit = Math.max(0, calculatedCostPerUnit).toFixed(2);
            console.log(`Setting costPerUnit to ${formattedCostPerUnit} from totalCost=${totalCost} / quantity=${quantity}`);
            form.setValue("costPerPurchasedUnit", formattedCostPerUnit, { shouldValidate: true });
          }
        }
      }
    } else if (lastChangedField === "costPerPurchasedUnit") {
      if (isCostPerUnitEmpty) {
        // Clear total cost if cost per unit is empty
        form.setValue("totalCost", "", { shouldValidate: true });
      } else if (costPerUnit > 0) {
        if (quantity > 0) {
          // Calculate total from quantity and cost per unit
          const calculatedTotal = quantity * costPerUnit;
          console.log(`Setting totalCost to ${calculatedTotal.toFixed(2)} from quantity=${quantity} * costPerUnit=${costPerUnit}`);
          form.setValue("totalCost", calculatedTotal.toFixed(2), { shouldValidate: true });
        } else if (!isTotalCostEmpty) {
          // Calculate quantity from total cost and cost per unit
          const calculatedQuantity = totalCost / costPerUnit;
          if (!isNaN(calculatedQuantity) && isFinite(calculatedQuantity)) {
            // Round to nearest whole number and ensure it's positive
            const roundedQuantity = Math.max(0, Math.round(calculatedQuantity));
            console.log(`Setting quantity to ${roundedQuantity} from totalCost=${totalCost} / costPerUnit=${costPerUnit}`);
            form.setValue("purchasedQuantity", roundedQuantity.toString(), { shouldValidate: true });
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
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger className="h-10 w-full border-gray-200">
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

            {/* Supplier */}
            <FormField
              control={form.control}
              name="supplier"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel className="flex items-center gap-1">
                    Supplier <span className="text-red-500">*</span>
                  </FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="e.g., ABC Food Distributors" className="h-10 w-full border-gray-200" />
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
                  <Select onValueChange={field.onChange} value={field.value}>
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
                          field.onChange(Math.max(0, current - 1).toString());
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
                          field.onChange(e.target.value.replace(/[^0-9]/g, ""));
                          setLastChangedField("purchasedQuantity");
                        }}
                        className="h-10 flex-1 w-20 text-center font-medium border-0 focus:ring-0 focus:outline-none"
                      />

                      {/* Plus */}
                      <button
                        type="button"
                        className="h-10 w-10 flex items-center justify-center border-l border-gray-200 bg-gray-50 hover:bg-gray-100"
                        onClick={() => {
                          const current = Number(field.value) || 0;
                          field.onChange((current + 1).toString());
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
                          field.onChange(newValue === 0 ? "" : newValue.toFixed(2));
                          setLastChangedField("totalCost");
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
                          field.onChange(e.target.value.replace(/[^0-9.]/g, ""));
                          setLastChangedField("totalCost");
                        }}
                      />
                      <button
                        type="button"
                        className="h-10 w-10 flex items-center justify-center border-l border-gray-200 bg-gray-50 hover:bg-gray-100"
                        onClick={() => {
                          const currentValue = field.value === "" ? 0 : parseFloat(field.value);
                          const newValue = currentValue + 0.01;
                          field.onChange(newValue.toFixed(2));
                          setLastChangedField("totalCost");
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
                          field.onChange(Math.max(0, current - 0.01).toFixed(2));
                          setLastChangedField("costPerPurchasedUnit");
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
                          field.onChange(e.target.value.replace(/[^0-9.]/g, ""));
                          setLastChangedField("costPerPurchasedUnit");
                        }}
                      />
                      <button
                        disabled={true}
                        type="button"
                        className="h-10 w-10 flex items-center justify-center border-l border-gray-200 bg-gray-50 hover:bg-gray-100"
                        onClick={() => {
                          const current = parseFloat(field.value) || 0;
                          field.onChange((current + 0.01).toFixed(2));
                          setLastChangedField("costPerPurchasedUnit");
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

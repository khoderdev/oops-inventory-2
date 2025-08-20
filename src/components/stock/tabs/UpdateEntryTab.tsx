import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { StockFormData, StockFormInputs, UpdateEntryTabProps } from "@/types/inventory";
import { format } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import { CalendarIcon, Minus, Package, Plus } from "lucide-react";
import { CostBreakdown } from "../CostBreakdown";
import { useEffect, useState } from "react";
import { useWatch } from "react-hook-form";

export function UpdateEntryTab({ form, materials, availableUnits, selectedMaterial, watchedQuantity, watchedCostPerUnit, watchedTotalCost, stockEntry, onSubmit, onCancel }: UpdateEntryTabProps) {
  const [lastChangedField, setLastChangedField] = useState<string | null>(null);
  
  // Ensure materialId is always a string
  useEffect(() => {
    const currentMaterialId = form.getValues("materialId");
    if (currentMaterialId !== undefined && typeof currentMaterialId === "number") {
      form.setValue("materialId", String(currentMaterialId));
    }
  }, [form]);
  
  useEffect(() => {
    const quantity = parseFloat(watchedQuantity) || 0;
    const costPerUnit = parseFloat(watchedCostPerUnit) || 0;
    const totalCost = parseFloat(watchedTotalCost) || 0;
    
    if (lastChangedField === "totalCost" && quantity > 0) {
      // Calculate cost per unit from total cost
      const calculatedCostPerUnit = totalCost / quantity;
      form.setValue("costPerPurchasedUnit", isNaN(calculatedCostPerUnit) ? "0" : calculatedCostPerUnit.toString());
    } else if ((lastChangedField === "purchasedQuantity" || lastChangedField === "costPerPurchasedUnit") || !lastChangedField) {
      // Calculate total cost from quantity and cost per unit
      const calculatedTotal = quantity * costPerUnit;
      form.setValue("totalCost", isNaN(calculatedTotal) ? "0" : calculatedTotal.toString());
    }
  }, [watchedQuantity, watchedCostPerUnit, watchedTotalCost, form, lastChangedField]);
  const handleSubmit = (data: StockFormInputs) => {
    const formData = data as unknown as StockFormData;
    onSubmit(formData);
  };

  return (
    <div className="space-y-6">
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-blue-100 rounded-lg">
            <Package className="h-5 w-5 text-blue-600" />
          </div>
          <h3 className="text-lg font-semibold text-blue-800">Update Stock Entry Details</h3>
        </div>
        <p className="text-sm text-blue-700 mb-4">
          Modify the details of this stock entry. Current: <strong>{stockEntry?.purchasedIndividualQuantity !== undefined && stockEntry?.purchasedIndividualUnit ? `${stockEntry.purchasedIndividualQuantity} ${stockEntry.purchasedIndividualUnit}` : `${stockEntry?.purchasedQuantity} ${stockEntry?.purchasedUnit}`}</strong>
          {stockEntry?.purchasedIndividualQuantity !== undefined && stockEntry?.purchasedIndividualUnit && (
            <span className="text-xs text-blue-600 ml-1">
              (remaining from {stockEntry.purchasedQuantity} {stockEntry.purchasedUnit})
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
                  <FormLabel>Material</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
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
              name="purchasedQuantity"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Quantity</FormLabel>
                  <FormControl>
                    <div className="flex items-center gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        className="h-11 w-11 border-green-300 hover:border-green-500 hover:bg-green-50"
                        onClick={() => {
                          const currentValue = parseInt(field.value) || 0;
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
                        onChange={e => {
                          field.onChange(e.target.value);
                          setLastChangedField("purchasedQuantity");
                        }} 
                        className="h-11 border-green-300 focus:border-green-500 focus:ring-green-500 text-center font-medium overflow-hidden flex-1 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" 
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        className="h-11 w-11 border-green-300 hover:border-green-500 hover:bg-green-50"
                        onClick={() => {
                          const currentValue = parseInt(field.value) || 0;
                          const newValue = currentValue + 1;
                          field.onChange(newValue.toString());
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
                  <FormLabel>Unit</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
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

            <FormField
              control={form.control}
              name="costPerPurchasedUnit"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Cost per Unit ($)</FormLabel>
                  <FormControl>
                    <div className="flex items-center gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        className="h-11 w-11 border-blue-300 hover:border-blue-500 hover:bg-blue-50"
                        onClick={() => {
                          const currentValue = parseFloat(field.value) || 0;
                          const newValue = Math.max(0, currentValue - 0.0001);
                          // Store exact value for backend
                          field.onChange(newValue.toString());
                        }}
                        disabled={parseFloat(field.value) <= 0}
                      >
                        <Minus className="h-4 w-4" />
                      </Button>
                      <Input 
                        onWheel={e => e.preventDefault()} 
                        type="number" 
                        step="0.0001" 
                        min="0" 
                        placeholder="0.00" 
                        {...field} 
                        onChange={e => {
                          field.onChange(e.target.value);
                          setLastChangedField("costPerPurchasedUnit");
                        }} 
                        className="h-11 border-blue-300 focus:border-blue-500 focus:ring-blue-500 text-center font-medium overflow-hidden flex-1 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" 
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        className="h-11 w-11 border-blue-300 hover:border-blue-500 hover:bg-blue-50"
                        onClick={() => {
                          const currentValue = parseFloat(field.value) || 0;
                          const newValue = currentValue + 0.0001;
                          // Store exact value for backend
                          field.onChange(newValue.toString());
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
                        className="h-11 w-11 border-blue-300 hover:border-blue-500 hover:bg-blue-50"
                        onClick={() => {
                          const currentValue = parseFloat(field.value) || 0;
                          const newValue = Math.max(0, currentValue - 0.0001);
                          // Store exact value for backend
                          field.onChange(newValue.toString());
                        }}
                        disabled={parseFloat(field.value) <= 0}
                      >
                        <Minus className="h-4 w-4" />
                      </Button>
                      <Input 
                        type="number" 
                        step="0.0001" 
                        min="0" 
                        placeholder="0.00" 
                        {...field} 
                        onChange={e => {
                          field.onChange(e.target.value);
                          setLastChangedField("totalCost");
                        }} 
                        className="h-11 border-blue-300 focus:border-blue-500 focus:ring-blue-500 text-center font-medium overflow-hidden flex-1 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" 
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        className="h-11 w-11 border-blue-300 hover:border-blue-500 hover:bg-blue-50"
                        onClick={() => {
                          const currentValue = parseFloat(field.value) || 0;
                          const newValue = currentValue + 0.0001;
                          // Store exact value for backend
                          field.onChange(newValue.toString());
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
            <Button
              type="submit"
              onClick={() => {
                // Log specific error details
                Object.entries(form.formState.errors).forEach(([field, error]) => {
                  console.log(`❌ Field '${field}' error:`, error);
                });
              }}
            >
              Update Entry
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}

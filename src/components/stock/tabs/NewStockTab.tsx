import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { Material, StockEntry, StockFormData, StockFormInputs } from "@/types/inventory";
import { format } from "date-fns";
import { CalendarIcon, Minus, Plus } from "lucide-react";
import { UseFormReturn } from "react-hook-form";
import { CostBreakdown } from "../CostBreakdown";
import { ValidationHelper } from "../ValidationHelper";

interface NewStockTabProps {
  form: UseFormReturn<StockFormInputs>;
  materials: Material[];
  availableUnits: string[];
  selectedMaterial: Material | undefined;
  watchedQuantity: string;
  watchedCostPerUnit: string;
  stockEntry?: StockEntry;
  onSubmit: (data: StockFormData) => void;
  onCancel: () => void;
}

export function NewStockTab({ form, materials, availableUnits, selectedMaterial, watchedQuantity, watchedCostPerUnit, stockEntry, onSubmit, onCancel }: NewStockTabProps) {
  const handleSubmit = async (data: StockFormInputs) => {
    console.log("📋 NewStockTab handleSubmit - Raw form data:", data);
    
    // Check for required fields and focus/scroll to first missing one
    const requiredFields = [
      { name: 'materialId', element: document.querySelector('[name="materialId"]') },
      { name: 'supplier', element: document.querySelector('[name="supplier"]') },
      { name: 'purchasedQuantity', element: document.querySelector('[name="purchasedQuantity"]') },
      { name: 'purchasedUnit', element: document.querySelector('[name="purchasedUnit"]') },
      { name: 'costPerPurchasedUnit', element: document.querySelector('[name="costPerPurchasedUnit"]') }
    ];

    for (const field of requiredFields) {
      const value = form.getValues(field.name as keyof StockFormInputs);
      const isEmpty = !value || (typeof value === 'string' && value.trim() === '') || 
                     (field.name === 'purchasedQuantity' && parseFloat(value as string) <= 0) ||
                     (field.name === 'costPerPurchasedUnit' && parseFloat(value as string) < 0);
      
      if (isEmpty && field.element) {
        // Scroll to the field
        field.element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        // Focus the field
        (field.element as HTMLElement).focus();
        // Trigger validation to show error
        form.trigger(field.name as keyof StockFormInputs);
        return; // Stop at first missing field
      }
    }
    
    const formData = data as unknown as StockFormData;
    console.log("📋 NewStockTab handleSubmit - Converted form data:", formData);
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
                      <SelectTrigger className={cn(
                        "transition-colors",
                        !field.value && "border-red-200 focus:border-red-500",
                        field.value && !fieldState.error && "border-green-200 focus:border-green-500"
                      )}>
                        <SelectValue placeholder="Select material" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {materials.map(material => {
                        const displayUnit = material.unitType === "package" && material.inputUnit ? material.inputUnit : material.baseUnit;
                        return (
                          <SelectItem key={material.id} value={material.id}>
                            {material.name} ({displayUnit})
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                  <ValidationHelper
                    isRequired={true}
                    hasValue={!!field.value}
                    hasError={!!fieldState.error}
                  />
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
                    <Input 
                      placeholder="e.g., ABC Food Distributors" 
                      {...field} 
                      className={cn(
                        "transition-colors",
                        !field.value && "border-red-200 focus:border-red-500",
                        field.value && !fieldState.error && "border-green-200 focus:border-green-500"
                      )}
                    />
                  </FormControl>
                  <FormMessage />
                  <ValidationHelper
                    isRequired={true}
                    hasValue={!!field.value}
                    hasError={!!fieldState.error}
                  />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="purchasedQuantity"
              render={({ field, fieldState }) => {
                const hasValue = field.value && parseInt(field.value) > 0;
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
                          onChange={e => field.onChange(e.target.value)} 
                          className={cn(
                            "h-11 text-center font-medium overflow-hidden flex-1 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none transition-colors",
                            !hasValue && "border-red-200 focus:border-red-500 focus:ring-red-500",
                            hasValue && !fieldState.error && "border-green-300 focus:border-green-500 focus:ring-green-500"
                          )}
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
                    <ValidationHelper
                      isRequired={true}
                      hasValue={hasValue}
                      hasError={!!fieldState.error}
                    />
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
                      <SelectTrigger className={cn(
                        "transition-colors",
                        !field.value && "border-red-200 focus:border-red-500",
                        field.value && !fieldState.error && "border-green-200 focus:border-green-500"
                      )}>
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
                  <ValidationHelper
                    isRequired={true}
                    hasValue={!!field.value}
                    hasError={!!fieldState.error}
                  />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="costPerPurchasedUnit"
              render={({ field, fieldState }) => {
                const hasValue = field.value && parseFloat(field.value) >= 0;
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
                            const currentValue = parseFloat(field.value) || 0;
                            const newValue = Math.max(0, currentValue - 0.0001);
                            field.onChange(newValue.toFixed(4));
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
                          onChange={e => field.onChange(e.target.value)} 
                          className={cn(
                            "h-11 text-center font-medium overflow-hidden flex-1 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none transition-colors",
                            !hasValue && "border-red-200 focus:border-red-500 focus:ring-red-500",
                            hasValue && !fieldState.error && "border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                          )}
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          className="h-11 w-11 border-gray-300 hover:border-blue-500 hover:bg-blue-50"
                          onClick={() => {
                            const currentValue = parseFloat(field.value) || 0;
                            const newValue = currentValue + 0.0001;
                            field.onChange(newValue.toFixed(4));
                          }}
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                    </FormControl>
                    <FormMessage />
                    <ValidationHelper
                      isRequired={true}
                      hasValue={hasValue}
                      hasError={!!fieldState.error}
                    />
                  </FormItem>
                );
              }}
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
                          const currentValue = parseFloat(field.value) || 0;
                          const newValue = Math.max(0, currentValue - 0.0001);
                          field.onChange(newValue.toFixed(4));
                        }}
                        disabled={parseFloat(field.value) <= 0}
                      >
                        <Minus className="h-4 w-4" />
                      </Button>
                      <Input type="number" step="0.0001" min="0" placeholder="0.00" {...field} onChange={e => field.onChange(e.target.value)} className="h-11 border-gray-300 focus:border-blue-500 focus:ring-blue-500 text-center font-medium overflow-hidden flex-1 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" />
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        className="h-11 w-11 border-gray-300 hover:border-blue-500 hover:bg-blue-50"
                        onClick={() => {
                          const currentValue = parseFloat(field.value) || 0;
                          const newValue = currentValue + 0.0001;
                          field.onChange(newValue.toFixed(4));
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

          <CostBreakdown selectedMaterial={selectedMaterial} quantity={watchedQuantity} purchasedUnit={form.watch("purchasedUnit")} costPerPurchasedUnit={watchedCostPerUnit} totalCost={form.watch("totalCost")} />

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

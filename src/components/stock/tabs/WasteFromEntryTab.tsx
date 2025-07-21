import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { CalendarIcon, FileText, Minus, Package, Plus, Trash2 } from "lucide-react";
import { UseFormReturn } from "react-hook-form";
import { StockFormData, StockFormInputs } from "@/types/inventory";
import { Material } from "@/types/inventory";
import { CostBreakdown } from "../CostBreakdown";

interface WasteFromEntryTabProps {
  form: UseFormReturn<StockFormInputs>;
  materials: Material[];
  availableUnits: string[];
  selectedMaterial: Material | undefined;
  watchedQuantity: string;
  watchedCostPerUnit: string;
  stockEntry: any;
  onWasteFromSpecificEntry: (data: StockFormData & { stockEntryId: string }) => void;
  onCancel: () => void;
}

export function WasteFromEntryTab({
  form,
  materials,
  availableUnits,
  selectedMaterial,
  watchedQuantity,
  watchedCostPerUnit,
  stockEntry,
  onWasteFromSpecificEntry,
  onCancel
}: WasteFromEntryTabProps) {
  const handleSubmit = (data: StockFormInputs) => {
    const formData = data as unknown as StockFormData;
    const specificEntryData = {
      ...formData,
      stockEntryId: stockEntry.id
    };
    onWasteFromSpecificEntry(specificEntryData);
  };

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
          Current stock: <strong>{stockEntry?.purchasedIndividualQuantity !== undefined && stockEntry?.purchasedIndividualUnit ? `${stockEntry.purchasedIndividualQuantity} ${stockEntry.purchasedIndividualUnit}` : `${stockEntry?.purchasedQuantity} ${stockEntry?.purchasedUnit}`}</strong>. Record waste/spoilage from this specific entry.
          {stockEntry?.purchasedIndividualQuantity !== undefined && stockEntry?.purchasedIndividualUnit && (
            <span className="block text-xs text-red-600 mt-1">
              (remaining from original {stockEntry.purchasedQuantity} {stockEntry.purchasedUnit})
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
                  <FormLabel className="flex items-center gap-2 text-sm font-medium text-gray-700">
                    <Package className="h-4 w-4 text-red-600" />
                    Material
                  </FormLabel>
                  <Select onValueChange={field.onChange} value={field.value} disabled>
                    <FormControl>
                      <SelectTrigger className="h-11 border-gray-300 bg-gray-50">
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
                  <p className="text-xs text-gray-500">Material is locked for this entry</p>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="purchasedQuantity"
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
                          const currentValue = parseInt(field.value) || 0;
                          const newValue = Math.max(0, currentValue - 1);
                          field.onChange(newValue);
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
                        onChange={e => field.onChange(parseInt(e.target.value) || 0)}
                        className="h-11 border-gray-300 focus:border-red-500 focus:ring-red-500 text-center font-medium overflow-hidden flex-1 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        className="h-11 w-11 border-gray-300 hover:border-red-500 hover:bg-red-50"
                        onClick={() => {
                          const currentValue = parseInt(field.value) || 0;
                          const newValue = currentValue + 1;
                          field.onChange(newValue);
                        }}
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                  </FormControl>
                  <p className="text-xs text-red-600 mt-1">
                    This will be removed from the existing {stockEntry?.purchasedQuantity} {stockEntry?.purchasedUnit}
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
              name="supplier"
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
                      <SelectItem value="expired">🗓️ Expired</SelectItem>
                      <SelectItem value="damaged">💔 Damaged</SelectItem>
                      <SelectItem value="spoiled">🦠 Spoiled</SelectItem>
                      <SelectItem value="contaminated">⚠️ Contaminated</SelectItem>
                      <SelectItem value="other">❓ Other</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="purchaseDate"
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

            <div className="md:col-span-2">
              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2 text-sm font-medium text-gray-700">
                      <FileText className="h-4 w-4 text-red-600" />
                      Notes (Optional)
                    </FormLabel>
                    <FormControl>
                      <Textarea placeholder="Additional details about the waste (e.g., batch number, expiry date, disposal method)..." {...field} className="border-gray-300 focus:border-red-500 focus:ring-red-500 min-h-[80px]" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>

          <CostBreakdown 
            selectedMaterial={selectedMaterial} 
            purchasedQuantity={watchedQuantity} 
            purchasedUnit={form.watch("purchasedUnit")} 
            costPerPurchasedUnit={watchedCostPerUnit} 
            totalCost={form.watch("totalCost")} 
          />

          <div className="flex gap-3 justify-end">
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
            <Button type="submit" className="bg-red-600 hover:bg-red-700 text-white">
              <Trash2 className="h-4 w-4 mr-2" />
              Record Waste
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}

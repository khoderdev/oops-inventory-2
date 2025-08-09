import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { Material, RecordWasteData, StockFormInputs } from "@/types/inventory";
import { format } from "date-fns";
import { CalendarIcon, Minus, Plus } from "lucide-react";
import { UseFormReturn } from "react-hook-form";

interface RecordWasteTabProps {
  form: UseFormReturn<StockFormInputs>;
  materials: Material[];
  availableUnits: string[];
  selectedMaterial: Material | undefined;
  onRecordWaste: (data: RecordWasteData) => void;
  onCancel: () => void;
}

const WASTE_REASONS = ["expired", "damaged", "spoiled", "contaminated", "staff", "customer_complaint", "preparation_error", "other"];

export function RecordWasteTab({ form, materials, availableUnits, selectedMaterial, onRecordWaste, onCancel }: RecordWasteTabProps) {
  const handleSubmit = async (data: StockFormInputs) => {
    console.log("🗑️ RecordWasteTab handleSubmit - Raw form data:", data);

    // Check for required fields and focus/scroll to first missing one
    const requiredFields = [
      { name: "materialId", element: document.querySelector('[name="materialId"]') },
      { name: "wasteQuantity", element: document.querySelector('[name="wasteQuantity"]') },
      { name: "purchasedUnit", element: document.querySelector('[name="purchasedUnit"]') },
      { name: "wasteReason", element: document.querySelector('[name="wasteReason"]') }
    ];

    for (const field of requiredFields) {
      const value = form.getValues(field.name as keyof StockFormInputs);
      const isEmpty = !value || (typeof value === "string" && value.trim() === "") || (field.name === "wasteQuantity" && parseFloat(value as string) <= 0);

      if (isEmpty && field.element) {
        // Scroll to the field
        field.element.scrollIntoView({ behavior: "smooth", block: "center" });
        // Focus the field
        (field.element as HTMLElement).focus();
        // Trigger validation to show error
        form.trigger(field.name as keyof StockFormInputs);
        return; // Stop at first missing field
      }
    }

    const wasteData: RecordWasteData = {
      materialId: data.materialId,
      wasteQuantity: parseFloat(data.wasteQuantity),
      unit: data.purchasedUnit,
      wasteReason: data.wasteReason,
      wasteDate: data.wasteDate || new Date(),
      notes: data.notes
    };

    console.log("🗑️ RecordWasteTab handleSubmit - Converted waste data:", wasteData);
    onRecordWaste(wasteData);
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
                          <SelectItem key={material.id} value={material.id}>
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
              name="wasteQuantity"
              render={({ field, fieldState }) => {
                const hasValue = field.value && parseFloat(field.value) > 0;
                return (
                  <FormItem>
                    <FormLabel className="flex items-center gap-1">
                      Waste Quantity
                      <span className="text-red-500 text-sm">*</span>
                    </FormLabel>
                    <FormControl>
                      <div className="flex items-center gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          className="h-11 w-11 border-red-300 hover:border-red-500 hover:bg-red-50"
                          onClick={() => {
                            const currentValue = parseFloat(field.value) || 0;
                            const newValue = Math.max(0, currentValue - 1);
                            field.onChange(newValue.toString());
                          }}
                          disabled={parseFloat(field.value) <= 0}
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
                          className={cn("h-11 text-center font-medium overflow-hidden flex-1 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none transition-colors", !hasValue && "border-red-200 focus:border-red-500 focus:ring-red-500", hasValue && !fieldState.error && "border-red-300 focus:border-red-500 focus:ring-red-500")}
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          className="h-11 w-11 border-red-300 hover:border-red-500 hover:bg-red-50"
                          onClick={() => {
                            const currentValue = parseFloat(field.value) || 0;
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
              name="wasteReason"
              render={({ field, fieldState }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-1">
                    Waste Reason
                    <span className="text-red-500 text-sm">*</span>
                  </FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger className={cn("transition-colors", !field.value && "border-red-200 focus:border-red-500", field.value && !fieldState.error && "border-green-200 focus:border-green-500")}>
                        <SelectValue placeholder="Select reason" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {WASTE_REASONS.map(reason => (
                        <SelectItem key={reason} value={reason}>
                          {reason.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase())}
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
              name="wasteDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Waste Date</FormLabel>
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
                      <Calendar mode="single" selected={field.value} onSelect={field.onChange} disabled={date => date > new Date() || date < new Date("1900-01-01")} initialFocus />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes</FormLabel>
                  <FormControl>
                    <Input placeholder="Additional notes..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
            <Button type="submit" className="bg-red-600 hover:bg-red-700">
              Record Waste
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}

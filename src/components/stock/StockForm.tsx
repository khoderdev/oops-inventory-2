import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { MaterialWithStock, StockEntry } from "@/types/inventory";
import { getSuggestedUnits } from "@/utils/inventoryCalculations";
import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import React from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

const stockSchema = z.object({
  materialId: z.string().min(1, "Material is required"),
  supplier: z.string().min(1, "Supplier is required"),
  purchasedQuantity: z
    .union([
      z.number(),
      z.string().transform(val => {
        const num = parseFloat(val);
        if (isNaN(num)) throw new Error("Invalid number");
        return num;
      })
    ])
    .refine(val => val > 0.0001, "Quantity must be positive"),
  purchasedUnit: z.string().min(1, "Unit is required"),
  costPerPurchasedUnit: z
    .union([
      z.number(),
      z.string().transform(val => {
        const num = parseFloat(val);
        if (isNaN(num)) throw new Error("Invalid number");
        return num;
      })
    ])
    .refine(val => val >= 0, "Cost must be positive"),
  totalCost: z
    .union([
      z.number(),
      z.string().transform(val => {
        const num = parseFloat(val);
        if (isNaN(num)) throw new Error("Invalid number");
        return num;
      })
    ])
    .refine(val => val >= 0, "Total cost must be positive"),
  purchaseDate: z.date(),
  expiryDate: z.date().optional(),
  batchNumber: z.string().optional(),
  notes: z.string().optional()
});

type StockFormData = z.infer<typeof stockSchema>;

// Form interface with string types for inputs
interface StockFormInputs {
  materialId: string;
  supplier: string;
  purchasedQuantity: string;
  purchasedUnit: string;
  costPerPurchasedUnit: string;
  totalCost: string;
  purchaseDate: Date;
  expiryDate?: Date;
  batchNumber?: string;
  notes?: string;
}

interface StockFormProps {
  materials: MaterialWithStock[];
  stockEntry?: StockEntry;
  selectedMaterialId?: string;
  onSubmit: (data: StockFormData) => void;
  onCancel: () => void;
}

export function StockForm({ materials, stockEntry, selectedMaterialId, onSubmit, onCancel }: StockFormProps) {
  const form = useForm<StockFormInputs>({
    resolver: zodResolver(stockSchema),
    defaultValues: {
      materialId: stockEntry?.materialId || selectedMaterialId || "",
      supplier: stockEntry?.supplier || "",
      purchasedQuantity: stockEntry?.purchasedQuantity?.toString() || "0",
      purchasedUnit: stockEntry?.purchasedUnit || "",
      costPerPurchasedUnit: stockEntry?.costPerPurchasedUnit?.toString() || "0",
      totalCost: stockEntry?.totalCost?.toString() || "0",
      purchaseDate: stockEntry?.purchaseDate || new Date(),
      expiryDate: stockEntry?.expiryDate,
      batchNumber: stockEntry?.batchNumber || "",
      notes: stockEntry?.notes || ""
    }
  });

  const watchedMaterialId = form.watch("materialId");
  const watchedQuantity = form.watch("purchasedQuantity");
  const watchedCostPerUnit = form.watch("costPerPurchasedUnit");
  const selectedMaterial = materials.find(m => m.id === watchedMaterialId);

  // Debug logs removed - feature working correctly

  // For package materials, prioritize inputUnit (e.g., "box") over baseUnit (e.g., "bottle")
  const availableUnits = selectedMaterial
    ? (() => {
        const suggestedUnits = getSuggestedUnits(selectedMaterial.unitType);

        if (selectedMaterial.unitType === "package" && selectedMaterial.inputUnit) {
          // Move inputUnit to the front of the list
          const filteredUnits = suggestedUnits.filter(unit => unit !== selectedMaterial.inputUnit);
          return [selectedMaterial.inputUnit, ...filteredUnits];
        }

        return suggestedUnits;
      })()
    : [];

  // Reset form values when stockEntry changes (for editing)
  React.useEffect(() => {
    if (stockEntry) {
      form.reset({
        materialId: stockEntry.materialId || "",
        supplier: stockEntry.supplier || "",
        purchasedQuantity: stockEntry.purchasedQuantity?.toString() || "0",
        purchasedUnit: stockEntry.purchasedUnit || "",
        costPerPurchasedUnit: stockEntry.costPerPurchasedUnit?.toString() || "0",
        totalCost: stockEntry.totalCost?.toString() || "0",
        purchaseDate: stockEntry.purchaseDate || new Date(),
        expiryDate: stockEntry.expiryDate,
        batchNumber: stockEntry.batchNumber || "",
        notes: stockEntry.notes || ""
      });
    }
  }, [stockEntry, form]);

  // Auto-select inputUnit for package materials and auto-populate cost
  React.useEffect(() => {
    if (selectedMaterial && selectedMaterial.unitType === "package" && selectedMaterial.inputUnit) {
      // Auto-select the inputUnit (e.g., "box") for package materials
      if (!form.getValues("purchasedUnit")) {
        form.setValue("purchasedUnit", selectedMaterial.inputUnit);
      }
    }
  }, [selectedMaterial, form]);

  // Auto-populate cost per unit when material is selected (only for new stock entries)
  React.useEffect(() => {
    if (selectedMaterial && !stockEntry) {
      // Only auto-populate if this is a new stock entry (not editing)
      const currentCostPerUnit = form.getValues("costPerPurchasedUnit");

      // Only set if the field is empty or zero
      const numericCurrentCost = typeof currentCostPerUnit === "string" ? parseFloat(currentCostPerUnit) : currentCostPerUnit;
      if (numericCurrentCost === 0 || isNaN(numericCurrentCost)) {
        let suggestedCost = 0;

        if (selectedMaterial.unitType === "package" && selectedMaterial.inputUnit && selectedMaterial.packageQuantity) {
          // For package materials, use the material's original cost per input unit
          // This is the cost per package unit (e.g., cost per box)
          const packageCost = selectedMaterial.costPerUnit;
          const numericPackageCost = typeof packageCost === "string" ? parseFloat(packageCost) : packageCost;
          suggestedCost = typeof numericPackageCost === "number" && !isNaN(numericPackageCost) && numericPackageCost > 0 ? numericPackageCost : 0;
        } else {
          // For non-package materials, we need to consider the purchasing unit
          const purchasedUnit = form.getValues("purchasedUnit") || selectedMaterial.inputUnit;

          if (purchasedUnit === selectedMaterial.inputUnit && selectedMaterial.unitType === "mass") {
            // If purchasing in input unit (kg), use the original cost per input unit
            // We need to convert from cost per base unit back to cost per input unit
            const baseCost = selectedMaterial.costPerBaseUnit || selectedMaterial.costPerUnit;
            const numericBaseCost = typeof baseCost === "string" ? parseFloat(baseCost) : baseCost;

            // Convert from cost per gram to cost per kg (multiply by 1000)
            if (selectedMaterial.inputUnit === "kg" && selectedMaterial.baseUnit === "g") {
              suggestedCost = numericBaseCost * 1000;
            } else if (selectedMaterial.inputUnit === "l" && selectedMaterial.baseUnit === "ml") {
              suggestedCost = numericBaseCost * 1000;
            } else {
              suggestedCost = numericBaseCost;
            }
          } else {
            // For other cases, use the cost per base unit
            const baseCost = selectedMaterial.costPerBaseUnit || selectedMaterial.costPerUnit;
            const numericBaseCost = typeof baseCost === "string" ? parseFloat(baseCost) : baseCost;
            suggestedCost = typeof numericBaseCost === "number" && !isNaN(numericBaseCost) && numericBaseCost > 0 ? numericBaseCost : 0;
          }
        }

        // Set the suggested cost (even if it's 0 for debugging)

        if (suggestedCost >= 0 && !isNaN(suggestedCost)) {
          // Round to 4 decimal places for precision
          const finalCost = parseFloat(suggestedCost.toFixed(4));

          form.setValue("costPerPurchasedUnit", finalCost.toString());
        }
      }
    }
  }, [selectedMaterial, form, stockEntry]);

  // Auto-calculate total cost
  React.useEffect(() => {
    if (watchedQuantity && watchedCostPerUnit) {
      const numQuantity = typeof watchedQuantity === "string" ? parseFloat(watchedQuantity) : watchedQuantity;
      const numCostPerUnit = typeof watchedCostPerUnit === "string" ? parseFloat(watchedCostPerUnit) : watchedCostPerUnit;

      if (!isNaN(numQuantity) && !isNaN(numCostPerUnit)) {
        const totalCost = numQuantity * numCostPerUnit;
        form.setValue("totalCost", parseFloat(totalCost.toFixed(4)).toString());
      }
    }
  }, [watchedQuantity, watchedCostPerUnit, form]);

  // Prevent wheel scrolling on number inputs
  React.useEffect(() => {
    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      e.stopPropagation();
      (e.target as HTMLInputElement).blur();
    };

    const numberInputs = document.querySelectorAll('input[type="number"]');
    numberInputs.forEach(input => {
      input.addEventListener("wheel", handleWheel, { passive: false });
    });

    return () => {
      numberInputs.forEach(input => {
        input.removeEventListener("wheel", handleWheel);
      });
    };
  }, []);

  const handleSubmit = (data: StockFormInputs) => {
    // The zodResolver will transform the string inputs to numbers
    // and the result will match StockFormData type
    onSubmit(data as unknown as StockFormData);
  };

  return (
    <Card className="w-full mx-auto">
      <CardContent>
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
                          // For package materials, show inputUnit (e.g., "box") instead of baseUnit (e.g., "bottle")
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
                    <FormLabel>Purchased Quantity</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.0001" placeholder="0" {...field} onChange={e => field.onChange(e.target.value)} className="overflow-hidden" />
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
                      <Input onWheel={e => e.preventDefault()} type="number" step="0.0001" placeholder="0.00" {...field} onChange={e => field.onChange(e.target.value)} className="overflow-hidden" />
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
                      <Input type="number" step="0.01" placeholder="0.00" {...field} onChange={e => field.onChange(e.target.value)} />
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

            <div className="flex gap-3 justify-end">
              <Button type="button" variant="outline" onClick={onCancel}>
                Cancel
              </Button>
              <Button type="submit">{stockEntry ? "Update Stock Entry" : "Add Stock Entry"}</Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}

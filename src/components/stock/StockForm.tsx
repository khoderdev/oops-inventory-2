import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { Material, StockEntry } from "@/types/inventory";
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
  purchasedQuantity: z.number().min(0.0001, "Quantity must be positive"),
  purchasedUnit: z.string().min(1, "Unit is required"),
  costPerPurchasedUnit: z.number().min(0, "Cost must be positive"),
  totalCost: z.number().min(0, "Total cost must be positive"),
  purchaseDate: z.date(),
  expiryDate: z.date().optional(),
  batchNumber: z.string().optional(),
  notes: z.string().optional()
});

type StockFormData = z.infer<typeof stockSchema>;

interface StockFormProps {
  materials: Material[];
  stockEntry?: StockEntry;
  selectedMaterialId?: string;
  onSubmit: (data: StockFormData) => void;
  onCancel: () => void;
}

export function StockForm({ materials, stockEntry, selectedMaterialId, onSubmit, onCancel }: StockFormProps) {
  const form = useForm<StockFormData>({
    resolver: zodResolver(stockSchema),
    defaultValues: {
      materialId: stockEntry?.materialId || selectedMaterialId || "",
      supplier: stockEntry?.supplier || "",
      purchasedQuantity: stockEntry?.purchasedQuantity || 0,
      purchasedUnit: stockEntry?.purchasedUnit || "",
      costPerPurchasedUnit: stockEntry?.costPerPurchasedUnit || 0,
      totalCost: stockEntry?.totalCost || 0,
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
  const availableUnits = selectedMaterial ? getSuggestedUnits(selectedMaterial.unitType) : [];

  // Auto-calculate total cost
  React.useEffect(() => {
    if (watchedQuantity && watchedCostPerUnit) {
      const totalCost = watchedQuantity * watchedCostPerUnit;
      form.setValue("totalCost", parseFloat(totalCost.toFixed(4)));
    }
  }, [watchedQuantity, watchedCostPerUnit, form]);

  const handleSubmit = (data: StockFormData) => {
    onSubmit(data);
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
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select material" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {materials.map(material => (
                          <SelectItem key={material.id} value={material.id}>
                            {material.name} ({material.baseUnit})
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
                      <Input type="number" step="0.0001" placeholder="0" {...field} onChange={e => field.onChange(parseFloat(e.target.value) || 0)} />
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
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
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
                      <Input type="number" step="0.0001" placeholder="0.00" {...field} onChange={e => field.onChange(parseFloat(e.target.value) || 0)} />
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
                      <Input type="number" step="0.01" placeholder="0.00" {...field} onChange={e => field.onChange(parseFloat(e.target.value) || 0)} />
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

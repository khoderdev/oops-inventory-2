import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { PackageUnit } from "@/types/conversion";
import { Material, StockEntry, StockFormData, StockFormInputs } from "@/types/inventory";
import { getConversionFactor } from "@/utils/getConversionFactor";
import { format } from "date-fns";
import { CalendarIcon, FileText, Minus, Package, Plus, Trash2 } from "lucide-react";
import { useEffect } from "react";
import { UseFormReturn, useWatch } from "react-hook-form";
import { CostBreakdown } from "../CostBreakdown";

interface WasteFromEntryTabProps {
  form: UseFormReturn<StockFormInputs>;
  materials: Material[];
  availableUnits: string[];
  selectedMaterial: Material | undefined;
  stockEntry: StockEntry;
  onRecordWaste: (data: StockFormData & { stockEntryId: string }) => void;
  onCancel: () => void;
}

export function WasteFromEntryTab2({ form, materials, availableUnits, selectedMaterial, stockEntry, onRecordWaste, onCancel }: WasteFromEntryTabProps) {
  const watchedQuantity = useWatch({ control: form.control, name: "purchasedQuantity" });
  const watchedCostPerUnit = useWatch({ control: form.control, name: "costPerPurchasedUnit" });
  const watchedPurchasedUnit = useWatch({ control: form.control, name: "purchasedUnit" });

  // Set costPerPurchasedUnit based on purchasedUnit and calculate proportional cost from original entry
  useEffect(() => {
    const purchasedUnit = watchedPurchasedUnit;

    if (!selectedMaterial || !stockEntry) {
      form.setValue("costPerPurchasedUnit", "0.0000");
      return;
    }

    // Calculate cost per unit based on the original stock entry's total cost and quantity
    const originalTotalCost = Number(stockEntry.totalCost) || 0;
    const originalQuantity = Number(stockEntry.purchasedQuantity) || 0;
    const originalUnit = stockEntry.purchasedUnit;

    if (originalTotalCost === 0 || originalQuantity === 0) {
      form.setValue("costPerPurchasedUnit", "0.0000");
      return;
    }

    // Calculate cost per original unit (e.g., cost per kg if original was in kg)
    const costPerOriginalUnit = originalTotalCost / originalQuantity;

    if (selectedMaterial.unitType === "package" && selectedMaterial.packageQuantity) {
      const validPackageUnits: PackageUnit[] = ["box", "pack", "case", "piece", "bottle"];
      
      if (purchasedUnit === selectedMaterial.baseUnit) {
        // If wasting in base unit (e.g., pieces), calculate cost per piece
        const costPerPiece = costPerOriginalUnit / selectedMaterial.packageQuantity;
        form.setValue("costPerPurchasedUnit", isNaN(costPerPiece) ? "0.0000" : costPerPiece.toFixed(4));
      } else if (validPackageUnits.includes(purchasedUnit as PackageUnit) && purchasedUnit === selectedMaterial.inputUnit) {
        // If wasting in input unit (e.g., boxes), use original cost per unit
        form.setValue("costPerPurchasedUnit", costPerOriginalUnit.toFixed(4));
      } else {
        form.setValue("costPerPurchasedUnit", "0.0000");
      }
    } else {
      // For mass, volume, etc. - calculate proportional cost
      if (purchasedUnit === originalUnit) {
        // Same unit as original entry - use direct cost per unit
        form.setValue("costPerPurchasedUnit", costPerOriginalUnit.toFixed(4));
      } else {
        // Different unit - convert using conversion factor
        const conversionFactor = getConversionFactor(originalUnit, purchasedUnit, selectedMaterial.unitType, selectedMaterial);
        if (conversionFactor > 0) {
          // Convert original unit cost to waste unit cost
          const costPerWasteUnit = costPerOriginalUnit / conversionFactor;
          form.setValue("costPerPurchasedUnit", isNaN(costPerWasteUnit) ? "0.0000" : costPerWasteUnit.toFixed(4));
        } else {
          form.setValue("costPerPurchasedUnit", "0.0000");
        }
      }
    }
  }, [form, selectedMaterial, stockEntry, watchedPurchasedUnit]);

  useEffect(() => {
    const quantity = parseFloat(watchedQuantity) || 0;
    const costPerUnit = parseFloat(watchedCostPerUnit) || 0;
    const totalCost = quantity * costPerUnit;
    form.setValue("totalCost", isNaN(totalCost) ? "0.00" : totalCost.toFixed(2));
    
    // Debug logging for cost calculations
    if (stockEntry && selectedMaterial) {
      console.log("💰 Waste Cost Calculation Debug:", {
        originalEntry: {
          totalCost: stockEntry.totalCost,
          quantity: stockEntry.purchasedQuantity,
          unit: stockEntry.purchasedUnit,
          costPerUnit: Number(stockEntry.totalCost) / Number(stockEntry.purchasedQuantity)
        },
        wasteCalculation: {
          wasteQuantity: quantity,
          wasteUnit: watchedPurchasedUnit,
          costPerWasteUnit: costPerUnit,
          totalWasteCost: totalCost
        }
      });
    }
  }, [watchedQuantity, watchedCostPerUnit, watchedPurchasedUnit, form, stockEntry, selectedMaterial]);

  const handleSubmit = (data: StockFormInputs) => {
    console.log("🚀 WasteFromEntryTab2 handleSubmit called with data:", data);
    console.log("🔍 Debug purchasedQuantity:", data.purchasedQuantity, typeof data.purchasedQuantity);
    console.log("🔍 Debug wasteReason:", data.wasteReason, typeof data.wasteReason);

    const wasteQty = parseFloat(data.purchasedQuantity) || 0;
    console.log("🔍 Parsed purchasedQuantity:", wasteQty);

    // Convert StockFormInputs to StockFormData format with stockEntryId
    const formData: StockFormData & { stockEntryId: string } = {
      materialId: data.materialId,
      supplier: stockEntry.supplier,
      purchasedQuantity: wasteQty,
      purchasedUnit: data.purchasedUnit,
      costPerPurchasedUnit: parseFloat(data.costPerPurchasedUnit) || 0,
      totalCost: parseFloat(data.totalCost) || 0,
      purchaseDate: data.purchaseDate,
      wasteDate: data.wasteDate,
      expiryDate: data.expiryDate,
      batchNumber: data.batchNumber,
      notes: data.notes,
      wasteReason: data.wasteReason,
      stockEntryId: stockEntry.id
    };

    console.log("📦 Converted formData:", formData);
    console.log("📞 Calling onRecordWaste...");

    onRecordWaste(formData);
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
        <form
          onSubmit={form.handleSubmit(handleSubmit, errors => {
            console.error("❌ Form validation failed:", errors);
            console.log("📝 Current form values:", form.getValues());
          })}
          className="space-y-6"
        >
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
                      <Input type="number" step="1" min="0" placeholder="0" {...field} onChange={e => field.onChange(parseInt(e.target.value) || 0)} className="h-11 border-gray-300 focus:border-red-500 focus:ring-red-500 text-center font-medium overflow-hidden flex-1 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" />
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
              name="wasteReason"
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
                      <SelectItem value="staff">🧑‍💼 Staff Use</SelectItem>
                      <SelectItem value="expired">🗓️ Expired</SelectItem>
                      <SelectItem value="damaged">💔 Damaged</SelectItem>
                      <SelectItem value="other">❓ Other</SelectItem>
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
          </div>

          {/* Original Entry Cost Context */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-4">
            <h4 className="text-sm font-medium text-gray-700 mb-2">Original Entry Cost Information</h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-500">Original Total Cost:</span>
                <span className="ml-2 font-medium">${Number(stockEntry?.totalCost || 0).toFixed(2)}</span>
              </div>
              <div>
                <span className="text-gray-500">Original Quantity:</span>
                <span className="ml-2 font-medium">{stockEntry?.purchasedQuantity} {stockEntry?.purchasedUnit}</span>
              </div>
              <div>
                <span className="text-gray-500">Cost per {stockEntry?.purchasedUnit}:</span>
                <span className="ml-2 font-medium">${(Number(stockEntry?.totalCost || 0) / Number(stockEntry?.purchasedQuantity || 1)).toFixed(4)}</span>
              </div>
              <div>
                <span className="text-gray-500">Remaining Stock:</span>
                <span className="ml-2 font-medium">
                  {stockEntry?.purchasedIndividualQuantity !== undefined && stockEntry?.purchasedIndividualUnit 
                    ? `${stockEntry.purchasedIndividualQuantity} ${stockEntry.purchasedIndividualUnit}`
                    : `${stockEntry?.purchasedQuantity} ${stockEntry?.purchasedUnit}`
                  }
                </span>
              </div>
            </div>
          </div>

          <CostBreakdown selectedMaterial={selectedMaterial} quantity={watchedQuantity} purchasedUnit={watchedPurchasedUnit} costPerPurchasedUnit={watchedCostPerUnit} totalCost={form.watch("totalCost")} />

          <div className="flex gap-3 justify-end">
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
            <Button
              type="submit"
              className="bg-red-600 hover:bg-red-700 text-white"
              onClick={() => {
                console.log("🔴 Record Waste button clicked!");
                console.log("📝 Form state:", form.getValues());
                console.log("⚠️ Form errors:", form.formState.errors);
                console.log("✅ Form is valid:", form.formState.isValid);
              }}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Record Waste
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}

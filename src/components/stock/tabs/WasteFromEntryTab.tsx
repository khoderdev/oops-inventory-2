import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { PackageUnit } from "@/types/conversion";
import { StockEntry, StockFormData, WasteFromEntryTabProps } from "@/types/inventory";
import { getConversionFactor } from "@/utils/getConversionFactor";
import { formatNumberUI, formatCurrencyUI } from "@/utils/conversionLogic";
import { format } from "date-fns";
import { CalendarIcon, FileText, Minus, Package, Plus, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { useWatch } from "react-hook-form";
import { CostBreakdown } from "../CostBreakdown";
import { stockAPI } from "@/api/stock.api.ts";

export function WasteFromEntryTab2({ form, materials, availableUnits, selectedMaterial, watchedQuantity, watchedCostPerUnit, watchedTotalCost, stockEntry: initialStockEntry, onRecordWaste, onCancel }: WasteFromEntryTabProps) {
  const [stockEntries, setStockEntries] = useState<StockEntry[]>([]);
  const [selectedStockEntry, setSelectedStockEntry] = useState<StockEntry | null>(initialStockEntry || null);
  const [isLoading, setIsLoading] = useState(false);
  const watchedMaterialId = useWatch({ control: form.control, name: "materialId" });
  const watchedWasteQuantity = useWatch({ control: form.control, name: "wasteQuantity" });
  const watchedPurchasedUnit = useWatch({ control: form.control, name: "purchasedUnit" });
  const [lastChangedField, setLastChangedField] = useState<string | null>(null);

  useEffect(() => {
    if (watchedMaterialId) {
      setIsLoading(true);
      stockAPI.getStockEntries({ materialId: watchedMaterialId, _t: Date.now() })
        .then(entries => {
          const availableEntries = entries.filter(entry => 
            (entry.purchasedIndividualQuantity !== undefined && entry.purchasedIndividualQuantity > 0) || 
            (entry.purchasedQuantity !== undefined && entry.purchasedQuantity > 0)
          );
          setStockEntries(availableEntries);
          if (availableEntries.length > 0) {
            const firstEntry = availableEntries[0];
            setSelectedStockEntry(firstEntry);
            form.setValue("stockEntryId", firstEntry.id);
            form.setValue("purchasedUnit", firstEntry.purchasedUnit || "");
          } else {
            setSelectedStockEntry(null);
          }
          setIsLoading(false);
        })
        .catch(err => {
          console.error("Failed to fetch stock entries:", err);
          setStockEntries([]);
          setSelectedStockEntry(null);
          setIsLoading(false);
        });
    } else {
      setStockEntries([]);
      setSelectedStockEntry(null);
    }
  }, [watchedMaterialId]);

  useEffect(() => {
    const purchasedUnit = watchedPurchasedUnit;
    if (!selectedMaterial || !selectedStockEntry || !purchasedUnit) {
      form.setValue("costPerPurchasedUnit", "0.0000");
      return;
    }
    const originalTotalCost = Number(selectedStockEntry.totalCost) || 0;
    const originalQuantity = Number(selectedStockEntry.purchasedQuantity) || 0;
    const originalUnit = selectedStockEntry.purchasedUnit;
    if (originalTotalCost === 0 || originalQuantity === 0) {
      form.setValue("costPerPurchasedUnit", "0.0000");
      return;
    }
    const costPerOriginalUnit = originalTotalCost / originalQuantity;
    let calculatedCostPerUnit = 0;
    
    if (selectedMaterial.unitType === "package" && selectedMaterial.packageQuantity) {
      const validPackageUnits: PackageUnit[] = ["box", "pack", "case", "piece", "bottle", "bag"];
      if (purchasedUnit === selectedMaterial.baseUnit || purchasedUnit === "piece") {
        // Calculate cost per piece for package materials
        calculatedCostPerUnit = costPerOriginalUnit / selectedMaterial.packageQuantity;
        form.setValue("costPerPurchasedUnit", isNaN(calculatedCostPerUnit) ? "0" : calculatedCostPerUnit.toString());
      } else if (validPackageUnits.includes(purchasedUnit as PackageUnit) && purchasedUnit === selectedMaterial.inputUnit) {
        calculatedCostPerUnit = costPerOriginalUnit;
        form.setValue("costPerPurchasedUnit", calculatedCostPerUnit.toString());
      } else if (purchasedUnit === originalUnit) {
        calculatedCostPerUnit = costPerOriginalUnit;
        form.setValue("costPerPurchasedUnit", calculatedCostPerUnit.toString());
      } else {
        form.setValue("costPerPurchasedUnit", "0");
      }
    } else {
      if (purchasedUnit === originalUnit) {
        calculatedCostPerUnit = costPerOriginalUnit;
        form.setValue("costPerPurchasedUnit", calculatedCostPerUnit.toString());
      } else {
        const conversionFactor = getConversionFactor(originalUnit, purchasedUnit, selectedMaterial.unitType, selectedMaterial);
        if (conversionFactor > 0) {
          calculatedCostPerUnit = costPerOriginalUnit / conversionFactor;
          form.setValue("costPerPurchasedUnit", isNaN(calculatedCostPerUnit) ? "0" : calculatedCostPerUnit.toString());
        } else {
          form.setValue("costPerPurchasedUnit", "0");
        }
      }
    }

    // Auto-calculate total cost when unit changes and we have a waste quantity
    const currentWasteQuantity = parseFloat(watchedWasteQuantity) || 0;
    if (currentWasteQuantity > 0 && calculatedCostPerUnit > 0) {
      const calculatedTotalCost = currentWasteQuantity * calculatedCostPerUnit;
      form.setValue("totalCost", isNaN(calculatedTotalCost) ? "0" : calculatedTotalCost.toString());
    }
  }, [form, selectedMaterial, selectedStockEntry, watchedPurchasedUnit, watchedWasteQuantity]);

  useEffect(() => {
    const quantity = parseFloat(watchedWasteQuantity) || 0;
    const costPerUnit = parseFloat(watchedCostPerUnit) || 0;
    const totalCost = parseFloat(watchedTotalCost) || 0;
    if (lastChangedField === "totalCost" && quantity > 0) {
      // Calculate cost per unit from total cost
      const calculatedCostPerUnit = totalCost / quantity;
      form.setValue("costPerPurchasedUnit", isNaN(calculatedCostPerUnit) ? "0" : calculatedCostPerUnit.toString());
    } else if ((lastChangedField === "wasteQuantity" || lastChangedField === "costPerPurchasedUnit") || !lastChangedField) {
      // Calculate total cost from quantity and cost per unit
      const calculatedTotalCost = quantity * costPerUnit;
      form.setValue("totalCost", isNaN(calculatedTotalCost) ? "0" : calculatedTotalCost.toString());
    }
  }, [watchedWasteQuantity, watchedCostPerUnit, watchedTotalCost, watchedPurchasedUnit, form, selectedStockEntry, selectedMaterial, lastChangedField]);

  const handleSubmit = async () => {
    if (!selectedStockEntry) {
      alert("Please select a stock entry");
      return;
    }
    
    const data = form.getValues();
    const wasteQty = parseFloat(data.wasteQuantity) || 0;
    const formData: StockFormData & { stockEntryId: string } = {
      materialId: data.materialId,
      supplier: selectedStockEntry.supplier,
      wasteQuantity: wasteQty,
      purchasedQuantity: selectedStockEntry.purchasedQuantity,
      purchasedUnit: data.purchasedUnit,
      costPerPurchasedUnit: parseFloat(data.costPerPurchasedUnit) || 0,
      totalCost: parseFloat(data.totalCost) || 0,
      purchaseDate: data.purchaseDate,
      wasteDate: data.wasteDate,
      expiryDate: data.expiryDate,
      batchNumber: data.batchNumber,
      notes: data.notes,
      wasteReason: data.wasteReason,
      stockEntryId: selectedStockEntry.id
    };
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
          {selectedStockEntry ? (
            <>
              Current stock: <strong>
                {((selectedStockEntry.purchasedIndividualQuantity !== undefined && selectedStockEntry.purchasedIndividualUnit) 
                  ? `${selectedStockEntry.purchasedIndividualQuantity} ${selectedStockEntry.purchasedIndividualUnit}` 
                  : (selectedStockEntry.purchasedQuantity !== undefined && selectedStockEntry.purchasedUnit) 
                    ? `${selectedStockEntry.purchasedQuantity} ${selectedStockEntry.purchasedUnit}` 
                    : "No stock data available")
                }
              </strong>. Record waste/spoilage from this specific entry.
              {selectedStockEntry.purchasedIndividualQuantity !== undefined && selectedStockEntry.purchasedIndividualUnit && selectedStockEntry.purchasedQuantity && selectedStockEntry.purchasedUnit && (
                <span className="block text-xs text-red-600 mt-1">
                  (remaining from original {selectedStockEntry.purchasedQuantity} {selectedStockEntry.purchasedUnit})
                </span>
              )}
            </>
          ) : (
            <>Select a material and stock entry to record waste from.</>  
          )}
        </p>
      </div>

      <Form {...form}>
        <div className="space-y-6">
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
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger className="h-11 border-gray-300">
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
                  <p className="text-xs text-gray-500">Select the material you want to record waste for</p>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            {/* Stock Entry Selection */}
            <FormField
              control={form.control}
              name="stockEntryId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2 text-sm font-medium text-gray-700">
                    <Package className="h-4 w-4 text-red-600" />
                    Stock Entry
                  </FormLabel>
                  <Select 
                    onValueChange={(value) => {
                      field.onChange(value);
                      const entry = stockEntries.find(e => e.id === value);
                      if (entry) {
                        setSelectedStockEntry(entry);
                        // Set the unit to match the stock entry's unit
                        form.setValue("purchasedUnit", entry.purchasedUnit || "");
                      }
                    }} 
                    value={field.value}
                    disabled={true} // Always disabled since we auto-select
                  >
                    <FormControl>
                      <SelectTrigger className="h-11 border-gray-300">
                        <SelectValue placeholder={isLoading ? "Loading..." : stockEntries.length === 0 ? "No entries available" : "Auto-selected entry"} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {stockEntries.map(entry => {
                        const remainingQty = entry.purchasedIndividualQuantity !== undefined ? entry.purchasedIndividualQuantity : entry.purchasedQuantity;
                        const unit = entry.purchasedIndividualUnit || entry.purchasedUnit;
                        const date = new Date(entry.purchaseDate).toLocaleDateString();
                        return (
                          <SelectItem key={entry.id} value={entry.id}>
                            {remainingQty} {unit} (purchased: {date})
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-gray-500">{isLoading ? "Loading stock entries..." : stockEntries.length === 0 ? "Select a material first" : "Select the specific stock entry to record waste from"}</p>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="wasteQuantity"
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
                          const currentValue = parseFloat(field.value) || 0;
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
                        value={field.value || ""} 
                        onChange={e => {
                          field.onChange(e.target.value);
                          setLastChangedField("wasteQuantity");
                        }} 
                        className="h-11 border-gray-300 focus:border-red-500 focus:ring-red-500 text-center font-medium overflow-hidden flex-1 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" 
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        className="h-11 w-11 border-gray-300 hover:border-red-500 hover:bg-red-50"
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
                  <p className="text-xs text-red-600 mt-1">
                    This will be removed from the existing {selectedStockEntry && selectedStockEntry.purchasedQuantity ? selectedStockEntry.purchasedQuantity : "0"} {selectedStockEntry && selectedStockEntry.purchasedUnit ? selectedStockEntry.purchasedUnit : "units"}
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
              name="totalCost"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2 text-sm font-medium text-gray-700">
                    <Package className="h-4 w-4 text-red-600" />
                    Total Cost
                  </FormLabel>
                  <FormControl>
                    <Input 
                      type="number" 
                      step="0.01" 
                      min="0" 
                      placeholder="0" 
                      {...field} 
                      onChange={e => {
                        field.onChange(e.target.value);
                        setLastChangedField("totalCost");
                      }}
                      className="h-11 border-gray-300 focus:border-red-500 focus:ring-red-500 text-center font-medium overflow-hidden flex-1 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" 
                    />
                  </FormControl>
                  <p className="text-xs text-red-600 mt-1">Total cost for all wasted units</p>
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
          {selectedStockEntry && (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-4">
              <h4 className="text-sm font-medium text-gray-700 mb-2">Original Entry Cost Information</h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-500">Original Total Cost:</span>
                  <span className="ml-2 font-medium">{formatCurrencyUI(selectedStockEntry.totalCost || 0)}</span>
                </div>
                <div>
                  <span className="text-gray-500">Original Quantity:</span>
                  <span className="ml-2 font-medium">
                    {selectedStockEntry.purchasedQuantity || "0"} {selectedStockEntry.purchasedUnit || "units"}
                  </span>
                </div>
                <div>
                  <span className="text-gray-500">Cost per {selectedStockEntry.purchasedUnit}:</span>
                  <span className="ml-2 font-medium">${formatNumberUI(Number(selectedStockEntry.totalCost || 0) / Number(selectedStockEntry.purchasedQuantity || 1))}</span>
                </div>
                <div>
                  <span className="text-gray-500">Remaining Stock:</span>
                  <span className="ml-2 font-medium">
                    {(selectedStockEntry.purchasedIndividualQuantity !== undefined && selectedStockEntry.purchasedIndividualUnit) 
                      ? `${selectedStockEntry.purchasedIndividualQuantity} ${selectedStockEntry.purchasedIndividualUnit}` 
                      : (selectedStockEntry.purchasedQuantity !== undefined && selectedStockEntry.purchasedUnit) 
                        ? `${selectedStockEntry.purchasedQuantity} ${selectedStockEntry.purchasedUnit}` 
                        : "No stock data available"}
                  </span>
                </div>
              </div>
            </div>
          )}

          <CostBreakdown selectedMaterial={selectedMaterial} quantity={watchedWasteQuantity} purchasedUnit={watchedPurchasedUnit} costPerPurchasedUnit={watchedCostPerUnit} totalCost={watchedTotalCost} />

          <div className="flex gap-3 justify-end">
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
            <Button type="button" className="bg-red-600 hover:bg-red-700 text-white" onClick={handleSubmit}>
              <Trash2 className="h-4 w-4 mr-2" />
              Record Waste
            </Button>
          </div>
        </div>
      </Form>
    </div>
  );
}

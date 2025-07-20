import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { StockFormData, StockFormInputs, StockFormProps } from "@/types/inventory";
import { getSuggestedUnits } from "@/utils/inventoryCalculations";
import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import { CalendarIcon, Package, TrendingUp, Trash2, FileText, Plus } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { stockSchema } from "./stockSchema";
import { CostBreakdown } from "./CostBreakdown";

export function StockForm({ materials, stockEntry, selectedMaterialId, onSubmit, onCancel, onAddStock, onRecordWaste, onAddToSpecificEntry, onWasteFromSpecificEntry }: StockFormProps) {
  const [activeTab, setActiveTab] = useState<string>(stockEntry ? "update-entry" : "new-stock");
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

  const availableUnits = selectedMaterial
    ? (() => {
        const suggestedUnits = getSuggestedUnits(selectedMaterial.unitType);

        if (selectedMaterial.unitType === "package" && selectedMaterial.inputUnit) {
          const filteredUnits = suggestedUnits.filter(unit => unit !== selectedMaterial.inputUnit);
          return [selectedMaterial.inputUnit, ...filteredUnits];
        }

        return suggestedUnits;
      })()
    : [];

  React.useEffect(() => {
    const isAddToEntry = activeTab === "add-to-entry";
    const isWasteFromEntry = activeTab === "waste-from-entry";
    const shouldClearQuantityFields = isAddToEntry || isWasteFromEntry;

    form.reset({
      materialId: stockEntry?.materialId || selectedMaterialId || "",
      supplier: stockEntry?.supplier || "",
      purchasedQuantity: shouldClearQuantityFields ? "" : stockEntry?.purchasedQuantity?.toString() || "0",
      purchasedUnit: shouldClearQuantityFields ? "" : stockEntry?.purchasedUnit || "",
      costPerPurchasedUnit: stockEntry?.costPerPurchasedUnit?.toString() || "0",
      totalCost: stockEntry?.totalCost?.toString() || "0",
      purchaseDate: stockEntry?.purchaseDate || new Date(),
      expiryDate: stockEntry?.expiryDate,
      batchNumber: stockEntry?.batchNumber || "",
      notes: stockEntry?.notes || ""
    });
  }, [stockEntry, selectedMaterialId, form, activeTab]);

  React.useEffect(() => {
    const isAddToEntry = activeTab === "add-to-entry";
    const isWasteFromEntry = activeTab === "waste-from-entry";
    const shouldClearQuantityFields = isAddToEntry || isWasteFromEntry;

    if (selectedMaterial && selectedMaterial.unitType === "package" && selectedMaterial.inputUnit && !shouldClearQuantityFields) {
      if (!form.getValues("purchasedUnit")) {
        form.setValue("purchasedUnit", selectedMaterial.inputUnit);
      }
    }
  }, [selectedMaterial, form, activeTab]);

  React.useEffect(() => {
    if (selectedMaterial && !stockEntry) {
      const currentCostPerUnit = form.getValues("costPerPurchasedUnit");

      const numericCurrentCost = typeof currentCostPerUnit === "string" ? parseFloat(currentCostPerUnit) : currentCostPerUnit;
      if (numericCurrentCost === 0 || isNaN(numericCurrentCost)) {
        let suggestedCost = 0;

        if (selectedMaterial.unitType === "package" && selectedMaterial.inputUnit && selectedMaterial.packageQuantity) {
          const packageCost = selectedMaterial.costPerUnit;
          const numericPackageCost = typeof packageCost === "string" ? parseFloat(packageCost) : packageCost;
          suggestedCost = typeof numericPackageCost === "number" && !isNaN(numericPackageCost) && numericPackageCost > 0 ? numericPackageCost : 0;
        } else {
          const purchasedUnit = form.getValues("purchasedUnit") || selectedMaterial.inputUnit;

          if (purchasedUnit === selectedMaterial.inputUnit && selectedMaterial.unitType === "mass") {
            const baseCost = selectedMaterial.costPerBaseUnit || selectedMaterial.costPerUnit;
            const numericBaseCost = typeof baseCost === "string" ? parseFloat(baseCost) : baseCost;

            if (selectedMaterial.inputUnit === "kg" && selectedMaterial.baseUnit === "g") {
              suggestedCost = numericBaseCost * 1000;
            } else if (selectedMaterial.inputUnit === "l" && selectedMaterial.baseUnit === "ml") {
              suggestedCost = numericBaseCost * 1000;
            } else {
              suggestedCost = numericBaseCost;
            }
          } else {
            const baseCost = selectedMaterial.costPerBaseUnit || selectedMaterial.costPerUnit;
            const numericBaseCost = typeof baseCost === "string" ? parseFloat(baseCost) : baseCost;
            suggestedCost = typeof numericBaseCost === "number" && !isNaN(numericBaseCost) && numericBaseCost > 0 ? numericBaseCost : 0;
          }
        }
        if (suggestedCost >= 0 && !isNaN(suggestedCost)) {
          const finalCost = parseFloat(suggestedCost.toFixed(4));
          form.setValue("costPerPurchasedUnit", finalCost.toString());
        }
      }
    }
  }, [selectedMaterial, form, stockEntry]);

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
    const formData = data as unknown as StockFormData;
    if (activeTab === "add-stock" && onAddStock) {
      onAddStock(formData);
    } else if (activeTab === "add-to-entry" && onAddToSpecificEntry && stockEntry) {
      const specificEntryData = {
        ...formData,
        stockEntryId: stockEntry.id
      };
      onAddToSpecificEntry(specificEntryData);
    } else if (activeTab === "record-waste" && onRecordWaste) {
      onRecordWaste(formData);
    } else if (activeTab === "waste-from-entry" && onWasteFromSpecificEntry && stockEntry) {
      const specificEntryData = {
        ...formData,
        stockEntryId: stockEntry.id
      };
      onWasteFromSpecificEntry(specificEntryData);
    } else {
      onSubmit(formData);
    }
  };

  const renderCostBreakdownIfNeeded = () => {
    const costRelevantTabs = ["new-stock", "add-stock", "update-entry", "add-to-entry"];
    if (!costRelevantTabs.includes(activeTab)) return null;

    return <CostBreakdown selectedMaterial={selectedMaterial} purchasedQuantity={watchedQuantity} purchasedUnit={form.watch("purchasedUnit")} costPerPurchasedUnit={watchedCostPerUnit} totalCost={form.watch("totalCost")} />;
  };

  return (
    <Card className="w-full max-w-4xl mx-auto shadow-lg border-0 bg-gradient-to-br from-white to-gray-50/50">
      <CardContent className="p-6">
        <div className="text-center pb-4 border-b border-gray-200 mb-6">
          <h2 className="text-2xl font-semibold text-gray-800 mb-2">Stock Management</h2>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3 bg-gray-100 p-1 rounded-lg mb-6">
            {stockEntry ? (
              <>
                <TabsTrigger value="update-entry" className="flex items-center gap-2 data-[state=active]:bg-blue-500 data-[state=active]:text-white data-[state=active]:shadow-md transition-all duration-200">
                  <Package className="h-4 w-4" />
                  Update Entry
                </TabsTrigger>
                <TabsTrigger value="add-to-entry" className="flex items-center gap-2 data-[state=active]:bg-green-500 data-[state=active]:text-white data-[state=active]:shadow-md transition-all duration-200">
                  <TrendingUp className="h-4 w-4" />
                  Add to This Entry
                </TabsTrigger>
                <TabsTrigger value="waste-from-entry" className="flex items-center gap-2 data-[state=active]:bg-red-500 data-[state=active]:text-white data-[state=active]:shadow-md transition-all duration-200">
                  <Trash2 className="h-4 w-4" />
                  Record Waste
                </TabsTrigger>
              </>
            ) : (
              <>
                <TabsTrigger value="new-stock" className="flex items-center gap-2 data-[state=active]:bg-blue-500 data-[state=active]:text-white data-[state=active]:shadow-md transition-all duration-200">
                  <Plus className="h-4 w-4" />
                  New Stock Entry
                </TabsTrigger>
                <TabsTrigger value="add-stock" className="flex items-center gap-2 data-[state=active]:bg-green-500 data-[state=active]:text-white data-[state=active]:shadow-md transition-all duration-200">
                  <TrendingUp className="h-4 w-4" />
                  Add Stock
                </TabsTrigger>
                <TabsTrigger value="record-waste" className="flex items-center gap-2 data-[state=active]:bg-red-500 data-[state=active]:text-white data-[state=active]:shadow-md transition-all duration-200">
                  <Trash2 className="h-4 w-4" />
                  Record Waste
                </TabsTrigger>
              </>
            )}
          </TabsList>

          <TabsContent value="new-stock" className="space-y-6">
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

                {renderCostBreakdownIfNeeded()}

                <div className="flex gap-3 justify-end">
                  <Button type="button" variant="outline" onClick={onCancel}>
                    Cancel
                  </Button>
                  <Button type="submit">{stockEntry ? "Update Stock Entry" : "Add Stock Entry"}</Button>
                </div>
              </form>
            </Form>
          </TabsContent>

          <TabsContent value="add-stock" className="space-y-6">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
                  <FormField
                    control={form.control}
                    name="materialId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2 text-sm font-medium text-gray-700">
                          <Package className="h-4 w-4 text-green-600" />
                          Material
                        </FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger className="h-11 border-gray-300 focus:border-green-500 focus:ring-green-500">
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
                    name="purchasedQuantity"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2 text-sm font-medium text-gray-700">
                          <TrendingUp className="h-4 w-4 text-green-600" />
                          Additional Quantity
                        </FormLabel>
                        <FormControl>
                          <Input type="number" step="0.0001" placeholder="Enter quantity to add (e.g., 200)" {...field} onChange={e => field.onChange(e.target.value)} className="h-11 border-gray-300 focus:border-green-500 focus:ring-green-500 overflow-hidden" />
                        </FormControl>
                        <p className="text-xs text-green-600 mt-1">This amount will be added to your existing stock</p>
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
                          <Package className="h-4 w-4 text-green-600" />
                          Unit
                        </FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger className="h-11 border-gray-300 focus:border-green-500 focus:ring-green-500">
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
                    name="purchaseDate"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel className="flex items-center gap-2 text-sm font-medium text-gray-700">
                          <CalendarIcon className="h-4 w-4 text-green-600" />
                          Addition Date
                        </FormLabel>
                        <Popover>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button variant="outline" className={cn("h-11 w-full pl-3 text-left font-normal border-gray-300 focus:border-green-500 focus:ring-green-500", !field.value && "text-muted-foreground")}>
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

                {renderCostBreakdownIfNeeded()}

                <div className="flex gap-3 justify-end">
                  <Button type="button" variant="outline" onClick={onCancel}>
                    Cancel
                  </Button>
                  <Button type="submit" className="bg-green-600 hover:bg-green-700 text-white">
                    <TrendingUp className="h-4 w-4 mr-2" />
                    Add to Stock
                  </Button>
                </div>
              </form>
            </Form>
          </TabsContent>

          <TabsContent value="record-waste" className="space-y-6">
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
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger className="h-11 border-gray-300 focus:border-red-500 focus:ring-red-500">
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
                    name="purchasedQuantity"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2 text-sm font-medium text-gray-700">
                          <Trash2 className="h-4 w-4 text-red-600" />
                          Waste Quantity
                        </FormLabel>
                        <FormControl>
                          <Input type="number" step="0.0001" placeholder="Enter quantity to remove (e.g., 50)" {...field} onChange={e => field.onChange(e.target.value)} className="h-11 border-gray-300 focus:border-red-500 focus:ring-red-500 overflow-hidden" />
                        </FormControl>
                        <p className="text-xs text-red-600 mt-1">This amount will be subtracted from your existing stock</p>
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
          </TabsContent>

          <TabsContent value="update-entry" className="space-y-6">
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
                        <FormLabel>Quantity</FormLabel>
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

                {renderCostBreakdownIfNeeded()}

                <div className="flex gap-3 justify-end">
                  <Button type="button" variant="outline" onClick={onCancel}>
                    Cancel
                  </Button>
                  <Button type="submit">Update Entry</Button>
                </div>
              </form>
            </Form>
          </TabsContent>

          <TabsContent value="add-to-entry" className="space-y-6">
            <div className="bg-green-50 border border-green-200 rounded-xl p-4">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-green-100 rounded-lg">
                  <TrendingUp className="h-5 w-5 text-green-600" />
                </div>
                <h3 className="text-lg font-semibold text-green-800">Add Quantity to This Entry</h3>
              </div>
              <p className="text-sm text-green-700 mb-4">
                Current stock: <strong>{stockEntry?.purchasedIndividualQuantity !== undefined && stockEntry?.purchasedIndividualUnit ? `${stockEntry.purchasedIndividualQuantity} ${stockEntry.purchasedIndividualUnit}` : `${stockEntry?.purchasedQuantity} ${stockEntry?.purchasedUnit}`}</strong>. Add additional quantity to this specific entry.
                {stockEntry?.purchasedIndividualQuantity !== undefined && stockEntry?.purchasedIndividualUnit && (
                  <span className="block text-xs text-green-600 mt-1">
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
                          <Package className="h-4 w-4 text-green-600" />
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
                          <TrendingUp className="h-4 w-4 text-green-600" />
                          Additional Quantity
                        </FormLabel>
                        <FormControl>
                          <Input type="number" step="0.0001" placeholder="Enter quantity to add (e.g., 1)" {...field} onChange={e => field.onChange(e.target.value)} className="h-11 border-gray-300 focus:border-green-500 focus:ring-green-500 overflow-hidden" />
                        </FormControl>
                        <p className="text-xs text-green-600 mt-1">
                          This will be added to the existing {stockEntry?.purchasedQuantity} {stockEntry?.purchasedUnit}
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
                          <Package className="h-4 w-4 text-green-600" />
                          Unit
                        </FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger className="h-11 border-gray-300 focus:border-green-500 focus:ring-green-500">
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
                    name="purchaseDate"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel className="flex items-center gap-2 text-sm font-medium text-gray-700">
                          <CalendarIcon className="h-4 w-4 text-green-600" />
                          Addition Date
                        </FormLabel>
                        <Popover>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button variant="outline" className={cn("h-11 w-full pl-3 text-left font-normal border-gray-300 focus:border-green-500 focus:ring-green-500", !field.value && "text-muted-foreground")}>
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

                {renderCostBreakdownIfNeeded()}

                <div className="flex gap-3 justify-end">
                  <Button type="button" variant="outline" onClick={onCancel}>
                    Cancel
                  </Button>
                  <Button type="submit" className="bg-green-600 hover:bg-green-700 text-white">
                    <TrendingUp className="h-4 w-4 mr-2" />
                    Add to Entry
                  </Button>
                </div>
              </form>
            </Form>
          </TabsContent>

          <TabsContent value="waste-from-entry" className="space-y-6">
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
                          <Input type="number" step="0.0001" placeholder="Enter quantity to remove (e.g., 0.5)" {...field} onChange={e => field.onChange(e.target.value)} className="h-11 border-gray-300 focus:border-red-500 focus:ring-red-500 overflow-hidden" />
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

                {renderCostBreakdownIfNeeded()}

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
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}

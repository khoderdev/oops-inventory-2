import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { StockFormInputs, StockFormProps } from "@/types/inventory";
import { getSuggestedUnits } from "@/utils/inventoryCalculations";
import { zodResolver } from "@hookform/resolvers/zod";
import { Package, Plus, Trash2, TrendingUp } from "lucide-react";
import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { stockSchema } from "./stockSchema";
import { AddStockTab } from "./tabs/AddStockTab";
import { AddToEntryTab } from "./tabs/AddToEntryTab";
import { NewStockTab } from "./tabs/NewStockTab";
import { RecordWasteTab } from "./tabs/RecordWasteTab";
import { UpdateEntryTab } from "./tabs/UpdateEntryTab";

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
            const baseCost = selectedMaterial.costPerUnit;
            const numericBaseCost = typeof baseCost === "string" ? parseFloat(baseCost) : baseCost;

            if (selectedMaterial.inputUnit === "kg" && selectedMaterial.baseUnit === "g") {
              suggestedCost = numericBaseCost * 1000;
            } else if (selectedMaterial.inputUnit === "l" && selectedMaterial.baseUnit === "ml") {
              suggestedCost = numericBaseCost * 1000;
            } else {
              suggestedCost = numericBaseCost;
            }
          } else {
            const baseCost = selectedMaterial.costPerUnit;
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

          <TabsContent value="new-stock">
            <NewStockTab form={form} materials={materials} availableUnits={availableUnits} selectedMaterial={selectedMaterial} watchedQuantity={watchedQuantity} watchedCostPerUnit={watchedCostPerUnit} stockEntry={stockEntry} onSubmit={onSubmit} onCancel={onCancel} />
          </TabsContent>

          <TabsContent value="add-stock">
            <AddStockTab form={form} materials={materials} availableUnits={availableUnits} selectedMaterial={selectedMaterial} watchedQuantity={watchedQuantity} watchedCostPerUnit={watchedCostPerUnit} onAddStock={onAddStock} onCancel={onCancel} />
          </TabsContent>

          <TabsContent value="record-waste">
            <RecordWasteTab form={form} materials={materials} availableUnits={availableUnits} onRecordWaste={onRecordWaste} onCancel={onCancel} />
          </TabsContent>

          <TabsContent value="update-entry">
            <UpdateEntryTab form={form} materials={materials} availableUnits={availableUnits} selectedMaterial={selectedMaterial} watchedQuantity={watchedQuantity} watchedCostPerUnit={watchedCostPerUnit} stockEntry={stockEntry} onSubmit={onSubmit} onCancel={onCancel} />
          </TabsContent>

          <TabsContent value="add-to-entry">
            <AddToEntryTab form={form} materials={materials} availableUnits={availableUnits} selectedMaterial={selectedMaterial} watchedQuantity={watchedQuantity} watchedCostPerUnit={watchedCostPerUnit} stockEntry={stockEntry} onAddToSpecificEntry={onAddToSpecificEntry} onCancel={onCancel} />
          </TabsContent>

          <TabsContent value="waste-from-entry">
            <RecordWasteTab form={form} materials={materials} availableUnits={availableUnits} onRecordWaste={onWasteFromSpecificEntry} onCancel={onCancel} />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { StockFormData, StockFormInputs, StockFormProps } from "@/types/inventory";
import { getSuggestedUnits } from "@/utils/inventoryCalculations";
import { zodResolver } from "@hookform/resolvers/zod";
import { Package, Plus, Trash2, TrendingUp } from "lucide-react";
import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { stockSchema } from "./stockSchema";
import { AddToEntryTab } from "./tabs/AddToEntryTab";
import { NewStockTab } from "./tabs/NewStockTab";
import { UpdateEntryTab } from "./tabs/UpdateEntryTab";
import { WasteFromEntryTab2 } from "./tabs/WasteFromEntryTab";

export function StockForm({ materials, stockEntry, selectedMaterialId, onSubmit, onCancel, onAddToSpecificEntry, onWasteFromSpecificEntry }: StockFormProps) {
  const [activeTab, setActiveTab] = useState<string>(stockEntry ? "update-entry" : "new-stock");

  const form = useForm<StockFormInputs>({
    resolver: zodResolver(stockSchema),
    defaultValues: {
      materialId: stockEntry?.materialId || selectedMaterialId || "",
      supplier: stockEntry?.supplier || "",
      purchasedQuantity: stockEntry?.purchasedQuantity?.toString() || "",
      purchasedUnit: stockEntry?.purchasedUnit || "",
      costPerPurchasedUnit: stockEntry?.costPerPurchasedUnit?.toString() || "",
      totalCost: stockEntry?.totalCost?.toString() || "",
      purchaseDate: stockEntry?.purchaseDate ? new Date(stockEntry.purchaseDate) : new Date(),
      expiryDate: stockEntry?.expiryDate ? new Date(stockEntry.expiryDate) : undefined,
      batchNumber: stockEntry?.batchNumber || "",
      wasteQuantity: undefined,
      wasteReason: undefined,
      wasteDate: undefined
    }
  });

  const watchedMaterialId = form.watch("materialId");
  const watchedQuantity = form.watch("purchasedQuantity");
  const watchedCostPerUnit = form.watch("costPerPurchasedUnit");
  const watchedTotalCost = form.watch("totalCost");

  useEffect(() => {
    if (selectedMaterialId && selectedMaterialId !== watchedMaterialId) {
      form.setValue("materialId", selectedMaterialId);
      materials.find(m => m.id.toString() === selectedMaterialId);
    }
  }, [selectedMaterialId, watchedMaterialId, form, materials]);

  const handleWasteFromEntry = (data: StockFormData & { stockEntryId: string }) => {
    if (onWasteFromSpecificEntry) {
      onWasteFromSpecificEntry(data);
    } else {
      console.error("❌ onWasteFromSpecificEntry is not defined!");
    }
  };
  const selectedMaterial = materials.find(m => m.id.toString() === watchedMaterialId?.toString());

  const availableUnits = selectedMaterial
    ? (() => {
        const suggestedUnits = getSuggestedUnits(selectedMaterial.unitType);
        if ((activeTab === "add-to-entry" || activeTab === "waste-from-entry") && stockEntry) {
          const stockEntryUnit = stockEntry.purchasedUnit;
          if (selectedMaterial.unitType === "mass") {
            const massUnits = ["kg", "g", "lb", "oz"];
            return massUnits.filter(unit => unit === stockEntryUnit || massUnits.includes(stockEntryUnit));
          } else if (selectedMaterial.unitType === "volume") {
            const volumeUnits = ["l", "ml"];
            return volumeUnits.filter(unit => unit === stockEntryUnit || volumeUnits.includes(stockEntryUnit));
          } else if (selectedMaterial.unitType === "package") {
            // For bag/pack materials, always allow piece-level operations
            if (stockEntryUnit === "bag" || stockEntryUnit === "pack" || stockEntryUnit === "box") {
              return [stockEntryUnit, "piece"];
            } else if (stockEntryUnit === selectedMaterial.inputUnit) {
              return [stockEntryUnit, "piece", "bottle"];
            } else {
              return [stockEntryUnit];
            }
          } else {
            return [stockEntryUnit];
          }
        }
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
      purchasedQuantity: shouldClearQuantityFields ? "" : stockEntry?.purchasedQuantity?.toString() || "",
      purchasedUnit: isWasteFromEntry ? stockEntry?.purchasedUnit || "" : shouldClearQuantityFields ? "" : stockEntry?.purchasedUnit || "",
      costPerPurchasedUnit: stockEntry?.costPerPurchasedUnit?.toString() || "",
      totalCost: stockEntry?.totalCost?.toString() || "",
      purchaseDate: stockEntry?.purchaseDate ? new Date(stockEntry.purchaseDate) : new Date(),
      expiryDate: stockEntry?.expiryDate ? new Date(stockEntry.expiryDate) : undefined,
      batchNumber: stockEntry?.batchNumber || "",
      wasteQuantity: undefined,
      wasteReason: undefined,
      wasteDate: undefined
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
      // Only suggest a cost if the field is empty (not "0" or any other value)
      if (currentCostPerUnit === "") {
        let suggestedCost = null;
        if (selectedMaterial.unitType === "package" && selectedMaterial.inputUnit && selectedMaterial.packageQuantity) {
          const packageCost = selectedMaterial.costPerUnit;
          const numericPackageCost = typeof packageCost === "string" ? parseFloat(packageCost) : packageCost;
          if (typeof numericPackageCost === "number" && !isNaN(numericPackageCost) && numericPackageCost > 0) {
            suggestedCost = numericPackageCost;
          }
        } else {
          const purchasedUnit = form.getValues("purchasedUnit") || selectedMaterial.inputUnit;

          if (purchasedUnit === selectedMaterial.inputUnit && selectedMaterial.unitType === "mass") {
            const baseCost = selectedMaterial.costPerUnit;
            const numericBaseCost = typeof baseCost === "string" ? parseFloat(baseCost) : baseCost;

            if (!isNaN(numericBaseCost) && numericBaseCost > 0) {
              if (selectedMaterial.inputUnit === "kg" && selectedMaterial.baseUnit === "g") {
                suggestedCost = numericBaseCost * 1000;
              } else if (selectedMaterial.inputUnit === "l" && selectedMaterial.baseUnit === "ml") {
                suggestedCost = numericBaseCost * 1000;
              } else {
                suggestedCost = numericBaseCost;
              }
            }
          } else {
            const baseCost = selectedMaterial.costPerUnit;
            const numericBaseCost = typeof baseCost === "string" ? parseFloat(baseCost) : baseCost;
            if (typeof numericBaseCost === "number" && !isNaN(numericBaseCost) && numericBaseCost > 0) {
              suggestedCost = numericBaseCost;
            }
          }
        }
        // Only set a value if we have a valid suggested cost
        if (suggestedCost !== null && !isNaN(suggestedCost) && suggestedCost > 0) {
          form.setValue("costPerPurchasedUnit", suggestedCost.toString());
        }
      }
    }
  }, [selectedMaterial, form, stockEntry]);

  // Track which field was last changed to determine calculation direction
  const [lastChangedField, setLastChangedField] = useState<'quantity' | 'costPerUnit' | 'totalCost' | null>(null);

  // Set up field change listeners
  useEffect(() => {
    const quantityField = document.querySelector('input[name="purchasedQuantity"]');
    const costPerUnitField = document.querySelector('input[name="costPerPurchasedUnit"]');
    const totalCostField = document.querySelector('input[name="totalCost"]');

    const handleQuantityChange = () => setLastChangedField('quantity');
    const handleCostPerUnitChange = () => setLastChangedField('costPerUnit');
    const handleTotalCostChange = () => setLastChangedField('totalCost');

    quantityField?.addEventListener('input', handleQuantityChange);
    costPerUnitField?.addEventListener('input', handleCostPerUnitChange);
    totalCostField?.addEventListener('input', handleTotalCostChange);

    return () => {
      quantityField?.removeEventListener('input', handleQuantityChange);
      costPerUnitField?.removeEventListener('input', handleCostPerUnitChange);
      totalCostField?.removeEventListener('input', handleTotalCostChange);
    };
  }, []);

  // Bidirectional calculation between Cost per Unit and Total Cost
  React.useEffect(() => {
    const numQuantity = typeof watchedQuantity === "string" ? parseFloat(watchedQuantity) : watchedQuantity;
    const numCostPerUnit = typeof watchedCostPerUnit === "string" ? parseFloat(watchedCostPerUnit) : watchedCostPerUnit;
    const numTotalCost = typeof watchedTotalCost === "string" ? parseFloat(watchedTotalCost) : watchedTotalCost;

    // Skip calculation if quantity is zero or not a number
    if (isNaN(numQuantity) || numQuantity === 0) {
      return;
    }

    // Calculate based on which field was last changed
    if (lastChangedField === 'totalCost' && !isNaN(numTotalCost)) {
      // Calculate Cost per Unit from Total Cost and Quantity
      const calculatedCostPerUnit = numTotalCost / numQuantity;
      if (!isNaN(calculatedCostPerUnit) && isFinite(calculatedCostPerUnit)) {
        form.setValue("costPerPurchasedUnit", calculatedCostPerUnit.toString());
      }
    } else if ((lastChangedField === 'costPerUnit' || lastChangedField === 'quantity') && !isNaN(numCostPerUnit)) {
      // Calculate Total Cost from Cost per Unit and Quantity
      const calculatedTotalCost = numQuantity * numCostPerUnit;
      if (!isNaN(calculatedTotalCost)) {
        form.setValue("totalCost", calculatedTotalCost.toString());
      }
    }
  }, [watchedQuantity, watchedCostPerUnit, watchedTotalCost, form, lastChangedField]);

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
    <div className="w-full h-full flex flex-col bg-background">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="sticky top-0 z-10 grid w-full grid-cols-3 h-auto bg-background border shadow-sm">
          {stockEntry ? (
            <>
              <TabsTrigger value="update-entry" className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 py-2 sm:py-3 px-2 text-xs sm:text-sm font-medium data-[state=active]:bg-blue-500 data-[state=active]:text-white data-[state=active]:shadow-md transition-all duration-200 hover:bg-muted">
                <Package className="h-4 w-4 flex-shrink-0" />
                <span className="hidden sm:inline">Update Entry</span>
                <span className="sm:hidden">Update</span>
              </TabsTrigger>
              <TabsTrigger value="add-to-entry" className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 py-2 sm:py-3 px-2 text-xs sm:text-sm font-medium data-[state=active]:bg-green-500 data-[state=active]:text-white data-[state=active]:shadow-md transition-all duration-200 hover:bg-muted">
                <TrendingUp className="h-4 w-4 flex-shrink-0" />
                <span className="hidden sm:inline">Add to Entry</span>
                <span className="sm:hidden">Add</span>
              </TabsTrigger>
              <TabsTrigger value="waste-from-entry" className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 py-2 sm:py-3 px-2 text-xs sm:text-sm font-medium data-[state=active]:bg-red-500 data-[state=active]:text-white data-[state=active]:shadow-md transition-all duration-200 hover:bg-muted">
                <Trash2 className="h-4 w-4 flex-shrink-0" />
                <span className="hidden sm:inline">Record Waste</span>
                <span className="sm:hidden">Waste</span>
              </TabsTrigger>
            </>
          ) : (
            <>
              <TabsTrigger value="new-stock" className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 py-2 sm:py-3 px-2 text-xs sm:text-sm font-medium data-[state=active]:bg-blue-500 data-[state=active]:text-white data-[state=active]:shadow-md transition-all duration-200 hover:bg-muted">
                <Plus className="h-4 w-4 flex-shrink-0" />
                <span className="hidden sm:inline">New Stock</span>
                <span className="sm:hidden">New</span>
              </TabsTrigger>
              <TabsTrigger value="add-stock" className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 py-2 sm:py-3 px-2 text-xs sm:text-sm font-medium data-[state=active]:bg-green-500 data-[state=active]:text-white data-[state=active]:shadow-md transition-all duration-200 hover:bg-muted">
                <TrendingUp className="h-4 w-4 flex-shrink-0" />
                <span className="hidden sm:inline">Add Stock</span>
                <span className="sm:hidden">Add</span>
              </TabsTrigger>
              <TabsTrigger value="record-waste" className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 py-2 sm:py-3 px-2 text-xs sm:text-sm font-medium data-[state=active]:bg-red-500 data-[state=active]:text-white data-[state=active]:shadow-md transition-all duration-200 hover:bg-muted">
                <Trash2 className="h-4 w-4 flex-shrink-0" />
                <span className="hidden sm:inline">Record Waste</span>
                <span className="sm:hidden">Waste</span>
              </TabsTrigger>
            </>
          )}
        </TabsList>

        {/* Tab Content Area */}
        <div className="flex-1 overflow-hidden mt-4">
          <div className="h-full overflow-y-auto">
            <TabsContent value="new-stock" className="mt-0 h-full">
              <div className="px-4 sm:px-6 py-4">
                <NewStockTab form={form} materials={materials} availableUnits={availableUnits} selectedMaterial={selectedMaterial} watchedQuantity={watchedQuantity} watchedCostPerUnit={watchedCostPerUnit} watchedTotalCost={watchedTotalCost} stockEntry={stockEntry} onSubmit={onSubmit} onCancel={onCancel} />
              </div>
            </TabsContent>

            <TabsContent value="add-stock" className="mt-0 h-full">
              <div className="px-4 sm:px-6 py-4">
                <AddToEntryTab form={form} materials={materials} availableUnits={availableUnits} selectedMaterial={selectedMaterial} watchedQuantity={watchedQuantity} watchedCostPerUnit={watchedCostPerUnit} watchedTotalCost={watchedTotalCost} stockEntry={stockEntry} onAddToSpecificEntry={onAddToSpecificEntry} onCancel={onCancel} />
              </div>
            </TabsContent>

            <TabsContent value="update-entry" className="mt-0 h-full">
              <div className="px-4 sm:px-6 py-4">
                <UpdateEntryTab form={form} materials={materials} availableUnits={availableUnits} selectedMaterial={selectedMaterial} watchedQuantity={watchedQuantity} watchedCostPerUnit={watchedCostPerUnit} watchedTotalCost={watchedTotalCost} stockEntry={stockEntry} onSubmit={onSubmit} onCancel={onCancel} />
              </div>
            </TabsContent>

            <TabsContent value="add-to-entry" className="mt-0 h-full">
              <div className="px-4 sm:px-6 py-4">
                <AddToEntryTab form={form} materials={materials} availableUnits={availableUnits} selectedMaterial={selectedMaterial} watchedQuantity={watchedQuantity} watchedCostPerUnit={watchedCostPerUnit} watchedTotalCost={watchedTotalCost} stockEntry={stockEntry} onAddToSpecificEntry={onAddToSpecificEntry} onCancel={onCancel} />
              </div>
            </TabsContent>

            <TabsContent value="waste-from-entry" className="mt-0 h-full">
              <div className="px-4 sm:px-6 py-4">
                <WasteFromEntryTab2 form={form} materials={materials} availableUnits={availableUnits} selectedMaterial={selectedMaterial} watchedQuantity={watchedQuantity} watchedCostPerUnit={watchedCostPerUnit} watchedTotalCost={watchedTotalCost} stockEntry={stockEntry} onRecordWaste={handleWasteFromEntry} onCancel={onCancel} />
              </div>
            </TabsContent>

            <TabsContent value="record-waste" className="mt-0 h-full">
              <div className="px-4 sm:px-6 py-4">
                <WasteFromEntryTab2 form={form} materials={materials} availableUnits={availableUnits} selectedMaterial={selectedMaterial} watchedQuantity={watchedQuantity} watchedCostPerUnit={watchedCostPerUnit} watchedTotalCost={watchedTotalCost} stockEntry={stockEntry} onRecordWaste={handleWasteFromEntry} onCancel={onCancel} />
              </div>
            </TabsContent>
          </div>
        </div>
      </Tabs>
    </div>
  );
}

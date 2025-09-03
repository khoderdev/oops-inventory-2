import { AddToEntryTabProps, StockFormData } from "@/types/inventory";
import { TrendingUp } from "lucide-react";
import { StockEntryForm } from "../form/StockEntryForm";
import { getCurrentStockDisplay } from "@/utils/getCurrentStockDisplay";

export function AddToEntryTab({ form, materials, availableUnits, selectedMaterial, watchedQuantity, watchedCostPerUnit, watchedTotalCost, stockEntry, onAddToSpecificEntry, onCancel }: AddToEntryTabProps) {
  const handleSubmit = (data: StockFormData) => {
    if (stockEntry?.id) {
      const submissionData = {
        ...data,
        materialId: selectedMaterial?.id,
        purchasedQuantity: data.purchasedQuantity,
        purchasedUnit: data.purchasedUnit || stockEntry.unit,
        purchaseDate: data.purchaseDate || new Date(),
        stockEntryId: stockEntry.id,
        costPerPurchasedUnit: Number(data.costPerPurchasedUnit || watchedCostPerUnit),
        totalCost: Number(data.totalCost || watchedTotalCost)
      };
      try {
        onAddToSpecificEntry(submissionData);
      } catch (error) {
        console.error("❌ AddToEntryTab: Error calling onAddToSpecificEntry:", error);
      }
    }
  };

  return (
    <StockEntryForm
      form={form}
      materials={materials}
      availableUnits={availableUnits}
      selectedMaterial={selectedMaterial}
      watchedQuantity={watchedQuantity}
      watchedCostPerUnit={watchedCostPerUnit}
      watchedTotalCost={watchedTotalCost}
      stockEntry={stockEntry}
      onSubmit={handleSubmit}
      onCancel={onCancel}
      headerIcon={TrendingUp}
      headerColor="green"
      headerTitle="Add Quantity to This Entry"
      headerDescription="Current total stock: "
      getCurrentStockDisplay={() => getCurrentStockDisplay(stockEntry)}
      quantityFieldName="purchasedQuantity"
      unitFieldName="purchasedUnit"
      dateFieldName="purchaseDate"
      dateFieldLabel="Purchase Date"
      submitButtonText="Add to Entry"
      disabledFields={["material"]}
      readOnlyFields={["costPerUnit", "totalCost"]}
    />
  );
}

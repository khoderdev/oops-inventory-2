import { StockFormData, AddToEntryTabProps } from "@/types/inventory";
import { TrendingUp } from "lucide-react";
import { StockEntryForm } from "../form/StockEntryForm";
import { getCurrentStockDisplay } from "@/utils/getCurrentStockDisplay";

export function AddToEntryTab({ form, materials, availableUnits, selectedMaterial, watchedQuantity, watchedCostPerUnit, watchedTotalCost, stockEntry, onAddToSpecificEntry, onCancel }: AddToEntryTabProps) {
  const onSubmit = (data: StockFormData) => {
    console.log("🔍 AddToEntryTab onSubmit called with data:", data);
    console.log("🔍 Data types:", {
      purchasedQuantity: typeof data.purchasedQuantity,
      purchasedUnit: typeof data.purchasedUnit,
      costPerPurchasedUnit: typeof data.costPerPurchasedUnit,
      totalCost: typeof data.totalCost
    });
    
    if (!stockEntry?.id) {
      console.error("❌ Stock entry ID is missing");
      return;
    }
    
    console.log("📦 Stock entry ID:", stockEntry.id);
    console.log("📦 Stock entry details:", stockEntry);
    
    const submissionData = {
      ...data,
      stockEntryId: stockEntry.id
    };
    
    console.log("📤 Submitting to onAddToSpecificEntry:", submissionData);
    onAddToSpecificEntry(submissionData);
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
      onSubmit={onSubmit}
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

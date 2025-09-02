import { StockFormData, AddToEntryTabProps } from "@/types/inventory";
import { TrendingUp } from "lucide-react";
import { StockEntryForm } from "../form/StockEntryForm";

export function AddToEntryTab({ form, materials, availableUnits, selectedMaterial, watchedQuantity, watchedCostPerUnit, watchedTotalCost, stockEntry, onAddToSpecificEntry, onCancel }: AddToEntryTabProps) {
  const getCurrentStockDisplay = () => {
    if (!stockEntry) return "";
    const quantity = stockEntry.purchasedIndividualQuantity !== undefined ? stockEntry.purchasedIndividualQuantity : stockEntry.purchasedQuantity;
    const unit = stockEntry.purchasedIndividualUnit || stockEntry.purchasedUnit;
    return `${quantity} ${unit}`;
  };

  const onSubmit = (data: StockFormData) => {
    if (!stockEntry?.id) {
      console.error("Stock entry ID is missing");
      return;
    }

    onAddToSpecificEntry({
      ...data,
      stockEntryId: stockEntry.id
    });
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
      getCurrentStockDisplay={getCurrentStockDisplay}
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

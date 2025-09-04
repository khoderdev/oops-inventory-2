import { Package } from "lucide-react";
import { UpdateEntryTabProps } from "@/types/inventory";
import { useEffect } from "react";
import { StockEntryForm } from "../form/StockEntryForm";
import { getCurrentStockDisplay } from "@/utils/getCurrentStockDisplay";

export function UpdateEntryTab({ form, materials, availableUnits, selectedMaterial, watchedQuantity, watchedCostPerUnit, watchedTotalCost, stockEntry, onSubmit, onCancel }: UpdateEntryTabProps) {
  useEffect(() => {
    if (stockEntry && stockEntry.materialId) {
      form.setValue("materialId", "", { shouldValidate: false });
      setTimeout(() => {
        form.setValue("materialId", String(stockEntry.materialId), { shouldValidate: true });
      }, 0);
    }
  }, [stockEntry, materials, form]);

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
      headerIcon={Package}
      headerColor="blue"
      headerTitle="Update Stock Entry Details"
      headerDescription="Modify the details of this stock entry. Current:"
      getCurrentStockDisplay={() => getCurrentStockDisplay(stockEntry)}
      quantityFieldName="purchasedQuantity"
      unitFieldName="purchasedUnit"
      dateFieldName="purchaseDate"
      dateFieldLabel="Purchase Date"
      submitButtonText="Update Entry"
      disabledFields={["material"]}
    />
  );
}

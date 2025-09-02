import { Package } from "lucide-react";
import { UpdateEntryTabProps } from "@/types/inventory";
import { useEffect } from "react";
import { StockEntryForm } from "../form/StockEntryForm";

export function UpdateEntryTab({ form, materials, availableUnits, selectedMaterial, watchedQuantity, watchedCostPerUnit, watchedTotalCost, stockEntry, onSubmit, onCancel }: UpdateEntryTabProps) {
  // Effect to ensure material is properly loaded when editing
  useEffect(() => {
    if (stockEntry && stockEntry.materialId) {
      console.log("🔍 Setting material ID for editing:", stockEntry.materialId);

      // Force reset the form value to ensure UI updates
      form.setValue("materialId", "", { shouldValidate: false });

      // Small timeout to ensure the reset takes effect before setting the new value
      setTimeout(() => {
        form.setValue("materialId", String(stockEntry.materialId), { shouldValidate: true });
        console.log("💾 Material ID set in form:", String(stockEntry.materialId));

        // Find the material in the materials list
        const material = materials.find(m => String(m.id) === String(stockEntry.materialId));
        if (material) {
          console.log("✅ Found material for editing:", material.name);
        } else {
          console.warn("⚠️ Could not find material with ID:", stockEntry.materialId);
        }
      }, 0);
    }
  }, [stockEntry, materials, form]);

  // Get current stock display for the header
  const getCurrentStockDisplay = () => {
    if (!stockEntry) return "";

    if (stockEntry?.purchasedIndividualQuantity !== undefined && stockEntry?.purchasedIndividualUnit) {
      return `${stockEntry.purchasedIndividualQuantity} ${stockEntry.purchasedIndividualUnit}${stockEntry?.purchasedIndividualQuantity !== undefined && stockEntry?.purchasedIndividualUnit ? ` (remaining from ${stockEntry.purchasedQuantity} ${stockEntry.purchasedUnit})` : ""}`;
    } else {
      return `${stockEntry?.purchasedQuantity} ${stockEntry?.purchasedUnit}`;
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
      onSubmit={onSubmit}
      onCancel={onCancel}
      headerIcon={Package}
      headerColor="blue"
      headerTitle="Update Stock Entry Details"
      headerDescription="Modify the details of this stock entry. Current:"
      getCurrentStockDisplay={getCurrentStockDisplay}
      quantityFieldName="purchasedQuantity"
      unitFieldName="purchasedUnit"
      dateFieldName="purchaseDate"
      dateFieldLabel="Purchase Date"
      submitButtonText="Update Entry"
    />
  );
}

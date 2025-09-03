import { StockFormData, StockFormInputs } from "@/types/inventory";
import { UseFormReturn } from "react-hook-form";
import { TrendingUp } from "lucide-react";
import { StockEntryForm } from "../form/StockEntryForm";
import { getCurrentStockDisplay } from "@/utils/getCurrentStockDisplay";

interface AddToEntryTabProps {
  form: UseFormReturn<StockFormInputs>;
  materials: any[];
  availableUnits: string[];
  selectedMaterial: any;
  watchedQuantity: string;
  watchedCostPerUnit: string;
  watchedTotalCost: string;
  stockEntry: any;
  onAddToSpecificEntry: (data: StockFormData & { stockEntryId: string }) => void;
  onCancel: () => void;
}

export function AddToEntryTab({ form, materials, availableUnits, selectedMaterial, watchedQuantity, watchedCostPerUnit, watchedTotalCost, stockEntry, onAddToSpecificEntry, onCancel }: AddToEntryTabProps) {
  const handleSubmit = (data: StockFormData) => {
    console.log("📌 AddToEntryTab: Form submitted with data:", data);
    console.log("📌 AddToEntryTab: Stock entry ID:", stockEntry?.id);
    
    if (stockEntry?.id) {
      // Ensure all required fields are present and properly formatted
      const submissionData = {
        ...data,
        materialId: selectedMaterial?.id,
        purchasedQuantity: data.purchasedQuantity,
        purchasedUnit: data.purchasedUnit || stockEntry.unit,
        purchaseDate: data.purchaseDate || new Date(),
        stockEntryId: stockEntry.id,
        // Ensure cost fields are included and properly converted to numbers
        costPerPurchasedUnit: Number(data.costPerPurchasedUnit || watchedCostPerUnit),
        totalCost: Number(data.totalCost || watchedTotalCost)
      };
      
      console.log("📌 AddToEntryTab: Submitting data to handler:", submissionData);
      try {
        onAddToSpecificEntry(submissionData);
        console.log("✅ AddToEntryTab: Successfully called onAddToSpecificEntry");
      } catch (error) {
        console.error("❌ AddToEntryTab: Error calling onAddToSpecificEntry:", error);
      }
    } else {
      console.error("❌ AddToEntryTab: Missing stock entry ID");
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

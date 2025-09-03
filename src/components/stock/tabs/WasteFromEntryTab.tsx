import { StockFormData, WasteFromEntryTabProps } from "@/types/inventory";
import { Trash2 } from "lucide-react";
import { useState, useEffect } from "react";
import { StockEntryForm } from "../form/StockEntryForm";
import { calculateCostBreakdown } from "@/utils/costCalculations";
import { OriginalEntryCostInfo } from "./OriginalEntryCostInfo";
import { getCurrentStockDisplay } from "@/utils/getCurrentStockDisplay";

export function WasteFromEntryTab({ form, materials, availableUnits, selectedMaterial, watchedQuantity, watchedCostPerUnit, watchedTotalCost, stockEntry, onRecordWaste, onCancel, watchedWasteQuantity, watchedUnit, lastChangedField }: WasteFromEntryTabProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (lastChangedField === "totalCost") return;
    const quantity = parseFloat(watchedWasteQuantity || "0");
    if (selectedMaterial && !isNaN(quantity) && quantity > 0 && watchedUnit) {
      const costResult = calculateCostBreakdown(selectedMaterial, stockEntry, quantity, watchedUnit);
      const formattedCostPerUnit = costResult.costPerUnit.toFixed(6);
      form.setValue("costPerPurchasedUnit", formattedCostPerUnit, { shouldValidate: true });
      let formattedTotalCost;
      if (costResult.totalCost < 0.01 && costResult.totalCost > 0) {
        formattedTotalCost = costResult.totalCost.toFixed(4);
      } else if (costResult.totalCost < 0.1 && costResult.totalCost > 0) {
        formattedTotalCost = costResult.totalCost.toFixed(3);
      } else {
        formattedTotalCost = costResult.totalCost.toFixed(2);
      }
      formattedTotalCost = parseFloat(formattedTotalCost).toString();
      form.setValue("totalCost", formattedTotalCost, { shouldValidate: true });
      form.clearErrors("costPerPurchasedUnit");
      form.clearErrors("totalCost");
    } else {
      form.setValue("costPerPurchasedUnit", "0", { shouldValidate: true });
      form.setValue("totalCost", "0", { shouldValidate: true });
    }
  }, [watchedWasteQuantity, watchedUnit, selectedMaterial, stockEntry, form, lastChangedField]);

  const onSubmit = async (data: StockFormData) => {
    if (isSubmitting) {
      return;
    }
    setIsSubmitting(true);
    try {
      if (typeof data.materialId === "number") {
        form.setValue("materialId", String(data.materialId));
      }
      const currentValues = form.getValues();
      const wasteQuantity = parseFloat(String(data.wasteQuantity || currentValues.wasteQuantity || "0"));
      const costPerPurchasedUnit = parseFloat(String(data.costPerPurchasedUnit || currentValues.costPerPurchasedUnit || "0"));
      const totalCost = parseFloat(String(data.totalCost || currentValues.totalCost || "0"));
      const purchasedUnit = data.purchasedUnit || currentValues.purchasedUnit;

      if (isNaN(wasteQuantity) || wasteQuantity <= 0) {
        form.setError("wasteQuantity", {
          type: "manual",
          message: "Waste quantity must be a positive number"
        });
        setIsSubmitting(false);
        return;
      }

      if (!purchasedUnit) {
        form.setError("purchasedUnit", {
          type: "manual",
          message: "Unit is required"
        });
        setIsSubmitting(false);
        return;
      }

      if (!stockEntry?.id) {
        form.setError("materialId", {
          type: "manual",
          message: "Stock entry is required"
        });
        setIsSubmitting(false);
        return;
      }

      const wasteData = {
        materialId: String(data.materialId || currentValues.materialId || selectedMaterial?.id),
        supplier: data.supplier || currentValues.supplier || stockEntry.supplier,
        wasteQuantity: wasteQuantity,
        purchasedQuantity: stockEntry.purchasedQuantity,
        purchasedUnit: purchasedUnit,
        costPerPurchasedUnit: isNaN(costPerPurchasedUnit) ? 0 : costPerPurchasedUnit,
        totalCost: isNaN(totalCost) ? 0 : Number(totalCost),
        purchaseDate: data.purchaseDate || currentValues.purchaseDate || new Date(),
        wasteDate: data.wasteDate || currentValues.wasteDate || new Date(),
        expiryDate: data.expiryDate || currentValues.expiryDate,
        batchNumber: data.batchNumber || currentValues.batchNumber,
        notes: data.notes || currentValues.notes,
        wasteReason: data.wasteReason || currentValues.wasteReason,
        stockEntryId: stockEntry.id
      };

      await onRecordWaste(wasteData);
    } catch (error) {
      console.error(" Error recording waste:", error);

      let errorMessage = "Failed to record waste. Please try again.";
      if (error?.response?.data?.error) {
        errorMessage = error.response.data.error;
      } else if (error?.response?.status === 400) {
        errorMessage = "Invalid waste data. Please check your inputs and try again.";
      } else if (error?.response?.status === 404) {
        errorMessage = "Stock entry not found. Please refresh and try again.";
      } else if (error?.response?.status >= 500) {
        errorMessage = "Server error. Please try again later.";
      }
      setErrorMessage(errorMessage);
    } finally {
      setIsSubmitting(false);
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
      headerIcon={Trash2}
      headerColor="red"
      headerTitle="Record Waste from This Entry"
      headerDescription={`Current stock: `}
      getCurrentStockDisplay={() => getCurrentStockDisplay(stockEntry)}
      quantityFieldName="wasteQuantity"
      unitFieldName="purchasedUnit"
      dateFieldName="wasteDate"
      dateFieldLabel="Waste Date"
      showReasonField={true}
      reasonFieldName="wasteReason"
      submitButtonText="Record Waste"
      hiddenFields={["supplier"]}
      disabledFields={["material"]}
      readOnlyFields={["totalCost", "costPerUnit"]}
    >
      {/* Error Messages */}
      {errorMessage && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center gap-2">
            <Trash2 className="h-4 w-4 text-red-600" />
            <p className="text-sm text-red-800 font-medium">{errorMessage}</p>
          </div>
        </div>
      )}

      {/* Original Entry Cost Context */}
      <OriginalEntryCostInfo form={form} stockEntry={stockEntry} />
    </StockEntryForm>
  );
}

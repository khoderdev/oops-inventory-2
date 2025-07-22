import { posAPI } from "@/api/pos.api.ts";
import { MenuItemSale, SoldItem } from "@/types/inventory";
import { formatCurrency } from "@/utils/conversionLogic";
import { atom } from "jotai";
import { errorMessageAtom, optimisticAssignmentsAtom, optimisticMaterialsAtom, successMessageAtom } from "./inventoryAtoms";

export const createSaleAction = atom(
  null,
  async (
    get,
    set,
    saleData: {
      saleDate: Date;
      totalAmount: number;
      sectionId?: string;
      items: SoldItem[];
      menuItems: MenuItemSale[];
      createdAt: Date;
      updatedAt: Date;
    }
  ) => {
    // Get current state for revert on error
    const currentAssignments = get(optimisticAssignmentsAtom);
    const currentMaterials = get(optimisticMaterialsAtom);

    try {
      // Optimistic update for assignments
      set(optimisticAssignmentsAtom, prevAssignments => {
        return prevAssignments.map(assignment => {
          const soldItem = saleData.items.find(item => item.assignmentId === assignment.id.toString());
          if (!soldItem) return assignment;

          const material = currentMaterials.find(m => m.id === String(assignment.materialId));
          if (!material) return assignment;

          let newAssignedQuantity = assignment.assignedQuantity || 0;
          let newAssignedIndividualQuantity = assignment.assignedIndividualQuantity;

          if (material.unitType === "package" && material.packageQuantity) {
            const currentIndividualQty = newAssignedIndividualQuantity || newAssignedQuantity * material.packageQuantity;
            const newIndividualQty = Math.max(0, currentIndividualQty - soldItem.quantity);
            newAssignedIndividualQuantity = newIndividualQty;
            newAssignedQuantity = newIndividualQty / material.packageQuantity;
          } else {
            newAssignedQuantity = Math.max(0, newAssignedQuantity - soldItem.quantity);
          }

          return {
            ...assignment,
            assignedQuantity: newAssignedQuantity,
            assignedIndividualQuantity: newAssignedIndividualQuantity,
            updatedAt: new Date()
          };
        });
      });

      // Optimistic update for materials (reduce available quantity)
      set(optimisticMaterialsAtom, prevMaterials => {
        return prevMaterials.map(material => {
          const materialAssignments = saleData.items.filter(item => item.materialId === material.id);
          if (!materialAssignments.length) return material;

          const totalSoldQuantity = materialAssignments.reduce((sum, item) => sum + item.quantity, 0);
          return {
            ...material,
            availableQuantity: Math.max(0, material.availableQuantity - totalSoldQuantity),
            updatedAt: new Date()
          };
        });
      });

      // Make API call
      const response = await posAPI.createSale(saleData);

      // Update success message
      set(successMessageAtom, `Sale completed successfully! Total: ${formatCurrency(saleData.totalAmount)}`);

      // Return response for handling warnings
      return response.data;
    } catch (error) {
      // Revert optimistic updates
      set(optimisticAssignmentsAtom, currentAssignments);
      set(optimisticMaterialsAtom, currentMaterials);

      const errorMessage = error instanceof Error ? error.message : "Failed to complete sale";
      set(errorMessageAtom, errorMessage);
      throw error;
    }
  }
);

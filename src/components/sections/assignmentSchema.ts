import { z } from "zod";

export const assignmentSchema = z
  .object({
    sectionId: z.string().min(1, "Section is required"),
    itemType: z.enum(["stockEntry", "menuItem"], { required_error: "Item type is required" }),
    stockEntryId: z.string().optional(),
    menuItemId: z.string().optional(),
    assignedQuantity: z.number().optional(),
    assignedUnit: z.string().optional()
  })
  .refine(
    data => {
      if (data.itemType === "stockEntry") {
        return data.stockEntryId && data.assignedQuantity && data.assignedQuantity > 0.0001 && data.assignedQuantity <= 999999 && data.assignedUnit;
      }
      if (data.itemType === "menuItem") {
        return data.menuItemId;
      }
      return false;
    },
    {
      message: "Please fill in all required fields for the selected item type",
      path: ["root"]
    }
  );

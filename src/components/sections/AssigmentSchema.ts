import { z } from "zod";

export const AssignmentSchema = z
  .object({
    sectionId: z.string().min(1, "Section is required"),
    itemType: z.enum(["stockEntry", "menuItem"]),
    stockEntryId: z.string().optional(),
    menuItemId: z.string().optional(),
    materialId: z.string().optional(),
    assignedQuantity: z
      .union([
        z.number(),
        z.string().transform(val => {
          const num = parseFloat(val);
          return isNaN(num) ? 0 : num;
        })
      ])
      .optional(),
    assignedUnit: z.string().optional(),
    notes: z.string().optional()
  })
  .superRefine((data, ctx) => {
    if (data.itemType === "stockEntry") {
      if (!data.stockEntryId) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Stock entry is required",
          path: ["stockEntryId"]
        });
      }
      if (typeof data.assignedQuantity !== "number" || data.assignedQuantity <= 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Valid quantity is required for stock entries",
          path: ["assignedQuantity"]
        });
      }
      if (!data.assignedUnit || data.assignedUnit.length === 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Unit is required for stock entries",
          path: ["assignedUnit"]
        });
      }
    }

    if (data.itemType === "menuItem") {
      if (!data.menuItemId) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Menu item is required",
          path: ["menuItemId"]
        });
      }
    }
  });

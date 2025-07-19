import { z } from "zod";

export const stockSchema = z.object({
  materialId: z.string().min(1, "Material is required"),
  supplier: z.string().min(1, "Supplier is required"),
  purchasedQuantity: z
    .union([
      z.number(),
      z.string().transform(val => {
        const num = parseFloat(val);
        if (isNaN(num)) throw new Error("Invalid number");
        return num;
      })
    ])
    .refine(val => val > 0.0001, "Quantity must be positive"),
  purchasedUnit: z.string().min(1, "Unit is required"),
  costPerPurchasedUnit: z
    .union([
      z.number(),
      z.string().transform(val => {
        const num = parseFloat(val);
        if (isNaN(num)) throw new Error("Invalid number");
        return num;
      })
    ])
    .refine(val => val >= 0, "Cost must be positive"),
  totalCost: z
    .union([
      z.number(),
      z.string().transform(val => {
        const num = parseFloat(val);
        if (isNaN(num)) throw new Error("Invalid number");
        return num;
      })
    ])
    .refine(val => val >= 0, "Total cost must be positive"),
  purchaseDate: z.date(),
  expiryDate: z.date().optional(),
  batchNumber: z.string().optional(),
  notes: z.string().optional()
});

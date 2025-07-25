import { z } from "zod";

export const stockSchema = z.object({
  materialId: z.string().min(1, "Material is required"),
  supplier: z.string().optional(),

  purchasedQuantity: z.union([z.number(), z.string()]).pipe(z.coerce.number()).optional(),

  costPerPurchasedUnit: z.union([z.number(), z.string()]).pipe(z.coerce.number().refine(val => val >= 0, "Cost must be positive")),

  totalCost: z.union([z.number(), z.string()]).pipe(z.coerce.number().refine(val => val >= 0, "Total cost must be positive")),

  purchasedUnit: z.string().min(1, "Unit is required"),

  wasteQuantity: z
    .union([z.number(), z.string()])
    .pipe(z.coerce.number().refine(val => val > 0, "Waste quantity must be positive"))
    .optional(),

  purchaseDate: z.date().optional(),
  wasteDate: z.date().optional(),
  expiryDate: z.date().optional(),
  batchNumber: z.string().optional(),
  notes: z.string().optional(),
  wasteReason: z.string().min(1, "Waste reason is required").optional()
});

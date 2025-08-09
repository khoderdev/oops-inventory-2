import { z } from "zod";

// Base schema with all possible fields
const baseStockSchema = {
  materialId: z.string().min(1, "Please select a material"),
  supplier: z.string().min(1, "Please enter a supplier"),
  purchasedQuantity: z.union([z.number(), z.string()])
    .pipe(z.coerce.number().refine(val => val > 0, "Quantity must be greater than 0"))
    .optional(),
  costPerPurchasedUnit: z.union([z.number(), z.string()])
    .pipe(z.coerce.number().refine(val => val >= 0, "Cost must be positive")),
  totalCost: z.union([z.number(), z.string()])
    .pipe(z.coerce.number().refine(val => val >= 0, "Total cost must be positive")),
  purchasedUnit: z.string().min(1, "Please select a unit"),
  wasteQuantity: z
    .union([z.number(), z.string()])
    .pipe(z.coerce.number().refine(val => val > 0, "Waste quantity must be greater than 0"))
    .optional(),
  purchaseDate: z.date().optional(),
  wasteDate: z.date().optional(),
  expiryDate: z.date().optional(),
  batchNumber: z.string().optional(),
  notes: z.string().optional(),
  wasteReason: z.string().min(1, "Please select a waste reason").optional()
};

// Default schema for general use
export const stockSchema = z.object(baseStockSchema);

// Schema for new stock entry - requires material, quantity, unit, cost
export const newStockSchema = z.object({
  ...baseStockSchema,
  purchasedQuantity: z.union([z.number(), z.string()])
    .pipe(z.coerce.number().refine(val => val > 0, "Please enter a quantity greater than 0")),
});

// Schema for adding stock - requires material, quantity, unit
export const addStockSchema = z.object({
  ...baseStockSchema,
  purchasedQuantity: z.union([z.number(), z.string()])
    .pipe(z.coerce.number().refine(val => val > 0, "Please enter a quantity to add")),
});

// Schema for adding to specific entry - requires quantity, excludes waste validation
export const addToEntrySchema = z.object({
  materialId: z.string().min(1, "Please select a material"),
  supplier: z.string().min(1, "Please enter a supplier"),
  purchasedQuantity: z.union([z.number(), z.string()])
    .pipe(z.coerce.number().refine(val => val > 0, "Please enter a quantity to add")),
  costPerPurchasedUnit: z.union([z.number(), z.string()])
    .pipe(z.coerce.number().refine(val => val >= 0, "Cost must be positive")),
  totalCost: z.union([z.number(), z.string()])
    .pipe(z.coerce.number().refine(val => val >= 0, "Total cost must be positive")),
  purchasedUnit: z.string().min(1, "Please select a unit"),
  purchaseDate: z.date().optional(),
  expiryDate: z.date().optional(),
  batchNumber: z.string().optional(),
  notes: z.string().optional(),
  // Explicitly exclude waste fields from validation
});

// Schema for waste operations - requires waste quantity and reason
export const wasteSchema = z.object({
  ...baseStockSchema,
  wasteQuantity: z
    .union([z.number(), z.string()])
    .pipe(z.coerce.number().refine(val => val > 0, "Please enter waste quantity")),
  wasteReason: z.string().min(1, "Please select a waste reason"),
});

// Schema for updating entry - all fields optional except material
export const updateEntrySchema = z.object({
  ...baseStockSchema,
  purchasedQuantity: z.union([z.number(), z.string()])
    .pipe(z.coerce.number().refine(val => val > 0, "Quantity must be greater than 0"))
    .optional(),
});

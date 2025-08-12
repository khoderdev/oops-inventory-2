import { z } from "zod";

// Define the valid unit types
const unitTypeEnum = z.enum(["mass", "volume", "piece", "package"]);

export const materialSchema = z.object({
  name: z.string().min(1, "Material name is required"),
  category: z.string().min(1, "Category is required"),
  unitType: unitTypeEnum,
  inputUnit: z.string().min(1, "Input unit is required"),
  packageQuantity: z.number().optional(),
  baseUnit: z.string().min(1, "Base unit is required")
});
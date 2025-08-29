import { z } from "zod";

export const sauceIngredientSchema = z.object({
  materialId: z.string().min(1, "Material is required"),
  quantity: z.number().min(0.001, "Quantity must be greater than 0"),
  unit: z.string().min(1, "Unit is required"),
  cost: z.number().min(0, "Cost must be non-negative")
});

export const sauceFormSchema = z.object({
  name: z.string().min(1, "Name is required").max(100, "Name too long"),
  description: z.string().optional(),
  category: z.string().min(1, "Category is required"),
  baseIngredients: z.array(sauceIngredientSchema).min(1, "At least one ingredient is required"),
  yieldQuantity: z.string().min(1, "Yield quantity is required"),
  unit: z.string().min(1, "Unit is required"),
  preparationTime: z.string().optional(),
  isPOSItem: z.boolean().default(false)
});

export type SauceFormInputs = z.infer<typeof sauceFormSchema>;

export const SAUCE_CATEGORIES = ["Hot Sauces", "Cold Sauces", "Dressings", "Marinades", "Dips", "Gravies", "Reductions", "Emulsions", "Compound Butters", "Salsas", "Chutneys", "Aiolis", "Vinaigrettes", "Other"];


export const SAUCE_UNITS = ["ml", "l", "g", "kg", "cup", "pint", "quart", "gallon", "portion", "serving"];





// import { z } from "zod";

// // Helper schema for string-to-number conversion
// const numericString = z.string().transform((val, ctx) => {
//   const parsed = parseFloat(val);
//   if (isNaN(parsed)) {
//     ctx.addIssue({
//       code: z.ZodIssueCode.custom,
//       message: "Must be a valid number",
//     });
//     return z.NEVER;
//   }
//   return parsed;
// });

// export const sauceIngredientSchema = z.object({
//   materialId: z.string().min(1, "Material is required"),
//   quantity: numericString.pipe(
//     z.number().min(0.001, "Quantity must be greater than 0")
//   ),
//   unit: z.string().min(1, "Unit is required"),
//   cost: numericString.pipe(
//     z.number().min(0, "Cost must be non-negative")
//   )
// });

// export const sauceFormSchema = z.object({
//   name: z.string().min(1, "Name is required").max(100, "Name too long"),
//   description: z.string().optional(),
//   category: z.string().min(1, "Category is required"),
//   baseIngredients: z.array(sauceIngredientSchema).min(1, "At least one ingredient is required"),
//   yieldQuantity: z.string().min(1, "Yield quantity is required"),
//   unit: z.string().min(1, "Unit is required"),
//   preparationTime: z.string().optional(),
//   isPOSItem: z.boolean().default(false)
// });

// export type SauceFormInputs = z.infer<typeof sauceFormSchema>;

// export const SAUCE_CATEGORIES = ["Hot Sauces", "Cold Sauces", "Dressings", "Marinades", "Dips", "Gravies", "Reductions", "Emulsions", "Compound Butters", "Salsas", "Chutneys", "Aiolis", "Vinaigrettes", "Other"];

// export const SAUCE_UNITS = ["ml", "l", "g", "kg", "cup", "pint", "quart", "gallon", "portion", "serving"];
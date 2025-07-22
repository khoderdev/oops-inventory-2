// import { z } from "zod";

// export const innerSectionSchema = z.object({
//   sectionId: z.string().min(1, "Section is required"),
//   name: z
//     .string()
//     .min(1, "Inner section name is required")
//     .max(100, "Inner section name must be 100 characters or less")
//     .regex(/^[a-zA-Z0-9\s\-_]+$/, "Inner section name can only contain letters, numbers, spaces, hyphens, and underscores"),
//   type: z.enum(["indoor", "outdoor"], { message: "Type must be either 'indoor' or 'outdoor'" })
// });

// export const tablesSchema = z.object({
//   innerSectionId: z.union([z.string().min(1), z.number().positive()]).transform(String),
//   tableNumber: z.string().min(1, "Table number is required"),
//   capacity: z.preprocess(val => Number(val), z.number().min(1).max(100))
// });

// export const assignmentSchema = z.object({
//   sectionId: z.string().min(1, "Section is required"),
//   innerSectionId: z.string().optional(),
//   itemType: z.enum(["stockEntry", "menuItem"], {
//     errorMap: () => ({ message: "Item type must be either 'stockEntry' or 'menuItem'" })
//   }),
//   stockEntryId: z
//     .string()
//     .optional()
//     .refine(
//       (val, ctx) => {
//         if (ctx.data.itemType === "stockEntry" && !val) return false;
//         return true;
//       },
//       { message: "Stock entry is required when item type is 'stockEntry'" }
//     ),
//   menuItemId: z
//     .string()
//     .optional()
//     .refine(
//       (val, ctx) => {
//         if (ctx.data.itemType === "menuItem" && !val) return false;
//         return true;
//       },
//       { message: "Menu item is required when item type is 'menuItem'" }
//     ),
//   assignedQuantity: z
//     .number()
//     .positive("Quantity must be greater than 0")
//     .optional()
//     .refine(
//       (val, ctx) => {
//         if (ctx.data.itemType === "stockEntry" && (val === undefined || val <= 0)) return false;
//         return true;
//       },
//       { message: "Quantity is required for stock entries and must be greater than 0" }
//     ),
//   assignedUnit: z
//     .string()
//     .optional()
//     .refine(
//       (val, ctx) => {
//         if (ctx.data.itemType === "stockEntry" && !val) return false;
//         return true;
//       },
//       { message: "Unit is required for stock entries" }
//     )
// });

// // export const assignmentSchema = z
// //   .object({
// //     sectionId: z.string().min(1, "Section is required"),
// //     itemType: z.enum(["stockEntry", "menuItem"], { required_error: "Item type is required" }),
// //     stockEntryId: z.string().optional(),
// //     menuItemId: z.string().optional(),
// //     assignedQuantity: z.number().optional(),
// //     assignedUnit: z.string().optional()
// //   })
// //   .refine(
// //     data => {
// //       if (data.itemType === "stockEntry") {
// //         return data.stockEntryId && data.assignedQuantity && data.assignedQuantity > 0.0001 && data.assignedQuantity <= 999999 && data.assignedUnit;
// //       }
// //       if (data.itemType === "menuItem") {
// //         return data.menuItemId;
// //       }
// //       return false;
// //     },
// //     {
// //       message: "Please fill in all required fields for the selected item type",
// //       path: ["root"]
// //     }
// //   );

import { z } from "zod";

export const innerSectionSchema = z.object({
  sectionId: z.string().min(1, "Section is required"),
  name: z
    .string()
    .min(1, "Inner section name is required")
    .max(100, "Inner section name must be 100 characters or less")
    .regex(/^[a-zA-Z0-9\s\-_]+$/, "Inner section name can only contain letters, numbers, spaces, hyphens, and underscores"),
  type: z.enum(["indoor", "outdoor"], { message: "Type must be either 'indoor' or 'outdoor'" })
});

export const tablesSchema = z.object({
  innerSectionId: z.union([z.string().min(1), z.number().positive()]).transform(String),
  tableNumber: z.string().min(1, "Table number is required"),
  capacity: z.preprocess(val => Number(val), z.number().min(1).max(100))
});

export const assignmentSchema = z
  .object({
    sectionId: z.string().min(1, "Section is required"),
    innerSectionId: z.string().optional(),
    itemType: z.enum(["stockEntry", "menuItem"], {
      errorMap: () => ({ message: "Item type must be either 'stockEntry' or 'menuItem'" })
    }),
    stockEntryId: z.string().optional(),
    menuItemId: z.string().optional(),
    assignedQuantity: z.number().positive("Quantity must be greater than 0").optional(),
    assignedUnit: z.string().optional()
  })
  .refine(
    data => {
      if (data.itemType === "stockEntry") {
        return !!data.stockEntryId && !!data.assignedQuantity && data.assignedQuantity > 0 && !!data.assignedUnit;
      }
      if (data.itemType === "menuItem") {
        return !!data.menuItemId;
      }
      return true;
    },
    {
      message: "Validation failed",
      path: [], // Attach error to the root of the object
      // Custom error mapping to provide specific messages
      params: {
        customError: (data: any) => {
          if (data.itemType === "stockEntry") {
            if (!data.stockEntryId) return { path: ["stockEntryId"], message: "Stock entry is required when item type is 'stockEntry'" };
            if (!data.assignedQuantity || data.assignedQuantity <= 0) return { path: ["assignedQuantity"], message: "Quantity is required for stock entries and must be greater than 0" };
            if (!data.assignedUnit) return { path: ["assignedUnit"], message: "Unit is required for stock entries" };
          }
          if (data.itemType === "menuItem" && !data.menuItemId) {
            return { path: ["menuItemId"], message: "Menu item is required when item type is 'menuItem'" };
          }
          return { path: [], message: "Invalid form data" };
        }
      }
    }
  );

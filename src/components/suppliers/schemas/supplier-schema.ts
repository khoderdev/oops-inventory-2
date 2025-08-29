import { z } from "zod";

export const supplierFormSchema = z.object({
  name: z.string().min(1, "Supplier name is required"),
  contactPerson: z.string().optional(),
  email: z.string().email("Invalid email address").or(z.literal("")),
  phone: z.string().optional(),
  address: z.string().optional(),
  taxId: z.string().optional(),
  paymentTerms: z.coerce.number().int().min(0, "Payment terms must be a positive number"),
  creditLimit: z.coerce.number().min(0, "Credit limit cannot be negative"),
  notes: z.string().optional(),
});

export type SupplierFormValues = z.infer<typeof supplierFormSchema>;

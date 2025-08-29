import { z } from "zod";

export const settlementFormSchema = z.object({
  amount: z.coerce.number().min(0.01, "Amount must be greater than 0"),
  paymentMethod: z.enum(["cash", "bank_transfer", "check", "credit_card", "other"], {
    required_error: "Please select a payment method",
  }),
  paymentDate: z.string().min(1, "Payment date is required"),
  referenceNumber: z.string().optional(),
  notes: z.string().optional(),
  invoiceIds: z.array(z.string()).optional(),
});

export type SettlementFormValues = z.infer<typeof settlementFormSchema>;

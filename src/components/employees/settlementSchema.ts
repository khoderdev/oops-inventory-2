import z from "zod";

export const settlementFormSchema = z.object({
  employeeId: z.number().min(1, "Please select an employee"),
  settlementMonth: z.number().min(1).max(12, "Please select a valid month"),
  settlementYear: z.number().min(2020).max(2030, "Please select a valid year"),
  bonusAmount: z.number().min(0, "Bonus amount must be positive").optional(),
  penaltyAmount: z.number().min(0, "Penalty amount must be positive").optional(),
  notes: z.string().optional()
});
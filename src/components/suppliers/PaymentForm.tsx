import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { PaymentFormProps, paymentFormSchema, PaymentFormValues } from "@/types/suppliers";
import { useSuppliersContext } from "@/context/SuppliersContext";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { CalendarIcon, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";


export const PaymentForm: React.FC<PaymentFormProps> = ({ supplierId, payment, onSuccess, onCancel }) => {
  const { createSupplierPayment, updateSupplierPayment, loading } = useSuppliersContext();
  const isEditing = !!payment;

  // Initialize form with default values or existing payment data
  const form = useForm<PaymentFormValues>({
    resolver: zodResolver(paymentFormSchema),
    defaultValues: {
      amount: payment?.amount || 0,
      paymentDate: payment?.paymentDate ? new Date(payment.paymentDate) : new Date(),
      status: (payment?.status as "paid" | "pending" | "partial" | "overdue") || "paid",
      referenceNumber: payment?.referenceNumber || "",
      notes: payment?.description || ""
    }
  });

  // Handle form submission
  const onSubmit = async (values: PaymentFormValues) => {
    try {
      // Convert Date object to ISO string for API compatibility
      const formattedValues = {
        ...values,
        amount: values.amount, // Ensure amount is always defined
        paymentDate: values.paymentDate ? values.paymentDate.toISOString().split('T')[0] : undefined
      };
      
      let result;

      if (isEditing && payment) {
        // Update existing payment
        result = await updateSupplierPayment(payment.id, {
          ...formattedValues,
          supplierId: Number(supplierId)
        });
      } else {
        // Create new payment
        result = await createSupplierPayment({
          ...formattedValues,
          supplierId: Number(supplierId)
        });
      }

      if (result && onSuccess) {
        onSuccess(result.data);
      }
    } catch (error) {
      console.error("Error saving payment:", error);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="amount"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Amount*</FormLabel>
              <FormControl>
                <Input type="number" step="0.01" placeholder="0.00" {...field} />
              </FormControl>
              <FormDescription>Enter the payment amount</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="paymentDate"
          render={({ field }) => (
            <FormItem className="flex flex-col">
              <FormLabel>Payment Date*</FormLabel>
              <Popover>
                <PopoverTrigger asChild>
                  <FormControl>
                    <Button variant="outline" className={cn("w-full pl-3 text-left font-normal", !field.value && "text-muted-foreground")}>
                      {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}
                      <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                    </Button>
                  </FormControl>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar mode="single" selected={field.value} onSelect={field.onChange} disabled={date => date > new Date() || date < new Date("1900-01-01")} initialFocus />
                </PopoverContent>
              </Popover>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="status"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Status*</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select payment status" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="paid">Paid</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="partial">Partial</SelectItem>
                  <SelectItem value="overdue">Overdue</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="referenceNumber"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Reference Number</FormLabel>
              <FormControl>
                <Input placeholder="Invoice or transaction reference" {...field} />
              </FormControl>
              <FormDescription>Optional reference number for this payment</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Notes</FormLabel>
              <FormControl>
                <Textarea placeholder="Additional notes about this payment" className="resize-none" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end gap-2">
          {onCancel && (
            <Button type="button" variant="outline" onClick={onCancel} disabled={loading}>
              Cancel
            </Button>
          )}
          <Button type="submit" disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isEditing ? "Update Payment" : "Create Payment"}
          </Button>
        </div>
      </form>
    </Form>
  );
};

export default PaymentForm;

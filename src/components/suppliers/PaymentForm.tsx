import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { PaymentFormProps, paymentFormSchema, PaymentFormValues } from "@/types/suppliers";
import { useSuppliersContext } from "@/context/SuppliersContext";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { CalendarIcon, Loader2, Plus, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";

export const PaymentForm: React.FC<PaymentFormProps> = ({ supplierId, payment, stockEntries, onSuccess, onCancel }) => {
  const { createSupplierPayment, updateSupplierPayment, loading } = useSuppliersContext();
  const { toast } = useToast();
  const isEditing = !!payment;

  // State for selected stock entries
  const [selectedStockEntries, setSelectedStockEntries] = useState<number[]>(payment?.stockEntryIds || []);

  // Initialize form with default values or existing payment data
  const form = useForm<PaymentFormValues>({
    resolver: zodResolver(paymentFormSchema),
    defaultValues: {
      amount: payment?.amount || 0,
      paymentDate: payment?.paymentDate ? new Date(payment.paymentDate) : new Date(),
      paymentMethod: (payment?.paymentMethod as "Cash" | "Bank Transfer" | "Check" | "Credit Card" | "Other") || "Cash",
      status: (payment?.status as "Completed" | "Pending" | "Failed" | "Refunded") || "Completed",
      referenceNumber: payment?.referenceNumber || "",
      description: payment?.description || "",
      attachmentUrl: payment?.attachmentUrl || ""
    }
  });

  // Toggle stock entry selection
  const toggleStockEntry = (stockEntryId: number) => {
    setSelectedStockEntries(prev => (prev.includes(stockEntryId) ? prev.filter(id => id !== stockEntryId) : [...prev, stockEntryId]));
  };

  // Handle form submission
  const onSubmit = async (values: PaymentFormValues) => {
    try {
      // Convert Date object to ISO string for API compatibility
      const formattedValues = {
        ...values,
        amount: Number(values.amount), // Ensure amount is a number
        paymentDate: values.paymentDate ? values.paymentDate.toISOString().split("T")[0] : new Date().toISOString().split("T")[0],
        stockEntryIds: selectedStockEntries
      };

      let result;

      if (isEditing && payment) {
        result = await updateSupplierPayment(payment.id, {
          ...formattedValues,
          supplierId: Number(supplierId)
        });
      } else {
        result = await createSupplierPayment({
          ...formattedValues,
          supplierId: Number(supplierId)
        });
      }

      if (result && onSuccess) {
        onSuccess(result);
      }
    } catch (error) {
      console.error("Error saving payment:", error);
      toast({
        title: "Error",
        description: "Failed to save payment. Please try again.",
        variant: "destructive"
      });
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
                <Input type="number" step="0.01" placeholder="0.00" {...field} onChange={e => field.onChange(parseFloat(e.target.value) || 0)} />
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
          name="paymentMethod"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Payment Method*</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select payment method" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="Cash">Cash</SelectItem>
                  <SelectItem value="Bank Transfer">Bank Transfer</SelectItem>
                  <SelectItem value="Check">Check</SelectItem>
                  <SelectItem value="Credit Card">Credit Card</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
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
                  {/* Use backend-compatible status values */}
                  <SelectItem value="Completed">Completed</SelectItem>
                  <SelectItem value="Pending">Pending</SelectItem>
                  <SelectItem value="Failed">Failed</SelectItem>
                  <SelectItem value="Refunded">Refunded</SelectItem>
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

        {/* Stock Entries Selection */}
        {stockEntries && stockEntries.length > 0 && (
          <div className="space-y-3">
            <FormLabel>Associated Stock Entries (Optional)</FormLabel>
            <div className="grid grid-cols-1 gap-2 max-h-40 overflow-y-auto p-2 border rounded-md">
              {stockEntries.map(entry => (
                <div key={entry.id} className={cn("flex items-center justify-between p-2 rounded-md border cursor-pointer", selectedStockEntries.includes(Number(entry.id)) ? "bg-primary/10 border-primary" : "hover:bg-muted/50")} onClick={() => toggleStockEntry(Number(entry.id))}>
                  <div className="flex-1">
                    <p className="text-sm font-medium">
                      #{entry.id} - {entry.productName}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Quantity: {entry.quantity} | Total: ${entry.totalAmount}
                    </p>
                  </div>
                  {selectedStockEntries.includes(Number(entry.id)) ? <X className="h-4 w-4 text-primary" /> : <Plus className="h-4 w-4 text-muted-foreground" />}
                </div>
              ))}
            </div>
            {selectedStockEntries.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {selectedStockEntries.map(id => {
                  const entry = stockEntries.find(e => e.id === String(id));
                  return entry ? (
                    <Badge key={id} variant="secondary" className="px-2 py-1">
                      #{entry.id} - {entry.productName}
                    </Badge>
                  ) : null;
                })}
              </div>
            )}
            <FormDescription>Select stock entries that this payment applies to (optional)</FormDescription>
          </div>
        )}

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

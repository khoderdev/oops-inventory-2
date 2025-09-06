import React, { useState, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { PaymentFormProps, paymentFormSchema, PaymentFormValues, Item } from "@/types/suppliers";
import { useSuppliersContext } from "@/context/SuppliersContext";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { CalendarIcon, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { VirtualSelect } from "../ui/VirtualSelect";

export const PaymentForm: React.FC<PaymentFormProps> = ({ supplierId, payment, stockEntries, stockEntriesLoading, onSuccess, onCancel }) => {
  const { createSupplierPayment, updateSupplierPayment, loading } = useSuppliersContext();
  const { toast } = useToast();
  const isEditing = !!payment;
  const [selectedStockEntries, setSelectedStockEntries] = useState<number[]>(payment?.stockEntryIds || []);

  const virtualSelectItems = useMemo(() => {
    if (!stockEntries) return [];

    return stockEntries.map(entry => {
      const materialName = entry.material?.name || "Unknown Material";
      let supplierName = "No Supplier";

      if (entry.supplier) {
        if (typeof entry.supplier === "object" && "supplierName" in entry.supplier) {
          supplierName = entry.supplier.supplierName;
        } else if (typeof entry.supplier === "string") {
          supplierName = entry.supplier;
        }
      }

      return {
        id: entry.id.toString(),
        label: `${materialName} (${entry.purchasedQuantity} ${entry.purchasedUnit}) - ${supplierName}`
      };
    });
  }, [stockEntries]);

  const selectedItem = useMemo(() => {
    if (selectedStockEntries.length === 0) return null;
    const selectedId = selectedStockEntries[0].toString();
    return virtualSelectItems.find(item => item.id === selectedId) || null;
  }, [selectedStockEntries, virtualSelectItems]);

  const form = useForm<PaymentFormValues>({
    resolver: zodResolver(paymentFormSchema),
    defaultValues: {
      amount: payment?.amount ? Number(payment.amount) : 0,
      paymentDate: payment?.paymentDate ? new Date(payment.paymentDate) : new Date(),
      paymentMethod: (payment?.paymentMethod as "Cash" | "Bank Transfer" | "Check" | "Credit Card" | "Other") || "Cash",
      status: (payment?.status as "Completed" | "Pending" | "Failed" | "Refunded") || "Completed",
      referenceNumber: payment?.referenceNumber || "",
      description: payment?.description || "",
      attachmentUrl: payment?.attachmentUrl || ""
    }
  });

  const handleVirtualSelectChange = (item: Item | null) => {
    if (item) {
      const entryId = Number(item.id);
      setSelectedStockEntries([entryId]);
    } else {
      setSelectedStockEntries([]);
    }
  };

  const onSubmit = async (values: PaymentFormValues) => {
    try {
      const formattedValues = {
        ...values,
        amount: Number(values.amount),
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
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="">
          <FormField
            control={form.control}
            name="amount"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Amount*</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    {...field}
                    onChange={e => {
                      const value = parseFloat(e.target.value);
                      field.onChange(isNaN(value) ? 0 : value);
                    }}
                  />
                </FormControl>
              </FormItem>
            )}
          />
        </div>

        <div className="">
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
              </FormItem>
            )}
          />
        </div>

        <div className="">
          <FormField
            control={form.control}
            name="paymentMethod"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Payment Method *</FormLabel>
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
              </FormItem>
            )}
          />
        </div>

        <div className="">
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
                    <SelectItem value="Completed">Completed</SelectItem>
                    <SelectItem value="Pending">Pending</SelectItem>
                    <SelectItem value="Failed">Failed</SelectItem>
                    <SelectItem value="Refunded">Refunded</SelectItem>
                  </SelectContent>
                </Select>
              </FormItem>
            )}
          />
        </div>

        <div>
          <FormField
            control={form.control}
            name="referenceNumber"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Reference Number</FormLabel>
                <FormControl>
                  <Input placeholder="Invoice or transaction reference" {...field} />
                </FormControl>
              </FormItem>
            )}
          />
        </div>

        <div>
          <FormLabel>Associated Stock Entry (Optional)</FormLabel>
          <VirtualSelect items={virtualSelectItems} value={selectedItem} onChange={handleVirtualSelectChange} placeholder={stockEntriesLoading ? "Loading stock entries..." : "Select stock entry..."} disabled={stockEntriesLoading} />
        </div>

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

import { useState, useEffect } from "react";
import { useForm, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Calendar, CalendarIcon } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useToast } from "@/components/ui/use-toast";
import { useSuppliers, useOutstandingInvoices, useCreateSettlement } from "@/hooks/useSuppliers";
import { formatCurrency } from "@/utils/conversionLogic";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

// Schema for form validation
const settlementFormSchema = z.object({
  supplierId: z.number().min(1, "Supplier is required"),
  amount: z
    .string()
    .min(1, "Amount is required")
    .regex(/^\d+(\.\d{1,2})?$/, "Invalid amount format"),
  paymentDate: z.date({ required_error: "Payment date is required" }),
  paymentMethod: z.enum(["cash", "bank_transfer", "check", "credit_card", "other"]),
  referenceNumber: z.string().optional(),
  invoiceIds: z.array(z.string()).optional()
});

type SettlementFormValues = z.infer<typeof settlementFormSchema>;

interface SettlementFormProps {
  supplierId?: string | number;
  onSubmit: (data: SettlementFormValues) => Promise<void>;
  onCancel: () => void;
  outstandingInvoices: any[];
  isLoadingInvoices: boolean;
  invoicesError: any;
}

export function SettlementForm({ supplierId, onSubmit, onCancel, outstandingInvoices, isLoadingInvoices, invoicesError }: SettlementFormProps) {
  const { toast } = useToast();
  const { data: suppliersResponse, isLoading: isLoadingSuppliers } = useSuppliers({ page: 1, limit: 100 });
  const suppliers = suppliersResponse?.data?.data || [];

  // Log props and handle errors
  useEffect(() => {
    console.log('SettlementForm props:', {
      supplierId,
      outstandingInvoices,
      isLoadingInvoices,
      invoicesError,
      invoicesCount: outstandingInvoices?.length || 0
    });

    if (invoicesError) {
      toast({
        title: "Error",
        description: invoicesError instanceof Error ? invoicesError.message : "Failed to load invoices",
        variant: "destructive"
      });
    }
  }, [supplierId, outstandingInvoices, isLoadingInvoices, invoicesError, toast]);

  // Use prop outstandingInvoices if provided, otherwise use empty array
  const propOutstandingInvoices = outstandingInvoices || [];

  const form = useForm<SettlementFormValues>({
    resolver: zodResolver(settlementFormSchema),
    defaultValues: {
      supplierId: supplierId ? Number(supplierId) : undefined,
      amount: "0.00",
      paymentDate: new Date(),
      paymentMethod: "cash",
      referenceNumber: "",
      invoiceIds: []
    }
  });

  const {
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
    trigger
  } = form;
  const selectedInvoices = watch("invoiceIds");
  const paymentDate = watch("paymentDate");

  const calculateTotalOutstanding = () => outstandingInvoices.filter((inv: any) => selectedInvoices.includes(inv.id.toString())).reduce((sum: number, inv: any) => sum + (parseFloat(inv.totalAmount) - parseFloat(inv.paidAmount || "0")), 0);

  const handleSelectAllInvoices = (checked: boolean) => {
    if (checked) {
      const invoiceIds = outstandingInvoices.map((inv: any) => inv.id.toString());
      setValue("invoiceIds", invoiceIds);
      setValue("amount", calculateTotalOutstanding().toFixed(2));
    } else {
      setValue("invoiceIds", []);
      setValue("amount", "0.00");
    }
  };

  const onFormSubmit = async (data: SettlementFormValues) => {
    console.log("Form submission triggered with data:", data);
    try {
      await trigger();
      if (Object.keys(errors).length > 0) {
        console.error("Validation errors:", errors);
        toast({ title: "Validation Error", description: "Please fix the form errors", variant: "destructive" });
        return;
      }
      const submissionData = {
        supplierId: data.supplierId,
        data: {
          amount: parseFloat(data.amount),
          paymentMethod: data.paymentMethod,
          paymentDate: data.paymentDate,
          referenceNumber: data.referenceNumber,
          invoiceIds: data.invoiceIds?.map(Number) || []
        }
      };
      console.log("Submitting to server:", submissionData);
      await onSubmit(data);
      toast({ title: "Success", description: "Payment submitted successfully" });
    } catch (error) {
      console.error("Submission error:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to submit payment",
        variant: "destructive"
      });
    }
  };

  if (isLoadingSuppliers) {
    return <div className="flex justify-center py-8">Loading suppliers...</div>;
  }

  return (
    <FormProvider {...form}>
      <form id="settlement-form" onSubmit={handleSubmit(onFormSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="space-y-6 md:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Supplier Information</CardTitle>
              </CardHeader>
              <CardContent>
                <Label htmlFor="supplier">Select Supplier *</Label>
                <Select
                  value={watch("supplierId")?.toString() || ""}
                  onValueChange={value => {
                    setValue("supplierId", Number(value));
                    setValue("invoiceIds", []);
                    setValue("amount", "0.00");
                  }}
                  disabled={!!supplierId}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a supplier" />
                  </SelectTrigger>
                  <SelectContent>
                    {suppliers.map((supplier: any) => (
                      <SelectItem key={supplier.id} value={supplier.id.toString()}>
                        {supplier.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.supplierId && <p className="text-red-500 text-sm">{errors.supplierId.message}</p>}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Outstanding Invoices</CardTitle>
                <CardDescription>{supplierId ? "Select invoices to pay" : "Please select a supplier to view invoices"}</CardDescription>
              </CardHeader>
              <CardContent>
                {!supplierId ? (
                  <div className="text-center py-8">Please select a supplier to view invoices.</div>
                ) : isLoadingInvoices ? (
                  <div className="text-center py-8">Loading invoices...</div>
                ) : invoicesError ? (
                  <div className="text-center py-8 text-red-500">Error loading invoices: {invoicesError instanceof Error ? invoicesError.message : "Unknown error"}</div>
                ) : outstandingInvoices.length > 0 ? (
                  <>
                    <div className="flex items-center space-x-2 mb-4">
                      <Checkbox id="selectAll" checked={selectedInvoices.length === outstandingInvoices.length} onCheckedChange={handleSelectAllInvoices} />
                      <Label htmlFor="selectAll">Select All Invoices</Label>
                    </div>
                    <ScrollArea className="h-64 rounded-md border p-4">
                      {outstandingInvoices.map((invoice: any) => (
                        <div key={invoice.id} className="flex items-center space-x-4 mb-2">
                          <Checkbox
                            id={`invoice-${invoice.id}`}
                            checked={selectedInvoices.includes(invoice.id.toString())}
                            onCheckedChange={checked => {
                              const newIds = checked ? [...selectedInvoices, invoice.id.toString()] : selectedInvoices.filter((id: string) => id !== invoice.id.toString());
                              setValue("invoiceIds", newIds);
                              setValue("amount", calculateTotalOutstanding().toFixed(2));
                            }}
                          />
                          <Label htmlFor={`invoice-${invoice.id}`}>
                            Invoice #{invoice.invoiceNumber} - {formatCurrency(parseFloat(invoice.totalAmount))}
                            <p className="text-sm text-muted-foreground">Due: {format(new Date(invoice.dueDate), "MMM d, yyyy")}</p>
                          </Label>
                        </div>
                      ))}
                    </ScrollArea>
                  </>
                ) : (
                  <div className="text-center py-8">No outstanding invoices found for this supplier.</div>
                )}
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Payment Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="amount">Amount *</Label>
                <Input id="amount" type="number" step="0.01" {...form.register("amount")} className={errors.amount ? "border-red-500" : ""} />
                {errors.amount && <p className="text-red-500 text-sm">{errors.amount.message}</p>}
              </div>

              <div>
                <Label htmlFor="paymentMethod">Payment Method *</Label>
                <Select {...form.register("paymentMethod")} onValueChange={value => setValue("paymentMethod", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select payment method" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cash">Cash</SelectItem>
                    <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                    <SelectItem value="check">Check</SelectItem>
                    <SelectItem value="credit_card">Credit Card</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
                {errors.paymentMethod && <p className="text-red-500 text-sm">{errors.paymentMethod.message}</p>}
              </div>

              <div>
                <Label>Payment Date *</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start">
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {paymentDate ? format(paymentDate, "PPP") : "Pick a date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent>
                    <Calendar mode="single" selected={paymentDate} onSelect={date => setValue("paymentDate", date || new Date())} initialFocus />
                  </PopoverContent>
                </Popover>
                {errors.paymentDate && <p className="text-red-500 text-sm">{errors.paymentDate.message}</p>}
              </div>

              <div>
                <Label htmlFor="referenceNumber">Reference Number</Label>
                <Input {...form.register("referenceNumber")} placeholder="e.g. Check #, Transaction ID" />
              </div>

              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? "Processing..." : "Record Payment"}
                </Button>
              </div>

              <div className="pt-4 border-t">
                <div className="flex justify-between">
                  <span>Total Outstanding:</span>
                  <span>{formatCurrency(calculateTotalOutstanding())}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </form>
    </FormProvider>
  );
}

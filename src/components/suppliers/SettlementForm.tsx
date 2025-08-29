import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import { useOutstandingInvoices, useCreateSettlement, useSuppliers } from "@/hooks/useSuppliers";
import { format } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatCurrency } from "@/utils/conversionLogic";
import { settlementFormSchema } from "./schemas/settlement-schema";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { useState, useEffect } from "react";
import { useForm, FormProvider } from "react-hook-form";
import { z } from "zod";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type SettlementFormValues = z.infer<typeof settlementFormSchema>;

interface SettlementFormProps {
  supplierId?: string | number;
  onSuccess?: () => void;
  onSubmit?: (data: SettlementFormValues) => void;
  onCancel?: () => void;
  isSubmitting?: boolean;
  debugForm?: () => void;
  selectedSupplierId?: string | number;
  setSelectedSupplierId?: (id: string | number) => void;
  formState?: any;
  getValues?: () => any;
  outstandingInvoices?: any[];
}

export function SettlementForm({ 
  supplierId: initialSupplierId, 
  onSuccess, 
  onSubmit, 
  onCancel, 
  isSubmitting = false,
  debugForm,
  selectedSupplierId: propSelectedSupplierId,
  setSelectedSupplierId: propSetSelectedSupplierId,
  formState: propFormState,
  getValues: propGetValues,
  outstandingInvoices: propOutstandingInvoices
}: SettlementFormProps) {
  const { toast } = useToast();
  const [internalSelectedSupplierId, setInternalSelectedSupplierId] = useState<string | number | undefined>(initialSupplierId);
  
  // Use props if provided, otherwise use internal state
  const selectedSupplierId = propSelectedSupplierId !== undefined ? propSelectedSupplierId : internalSelectedSupplierId;
  const setSelectedSupplierId = propSetSelectedSupplierId || setInternalSelectedSupplierId;

  // Fetch all suppliers
  const { data: suppliersResponse, isLoading: isLoadingSuppliers } = useSuppliers({
    page: 1,
    limit: 100
  });

  // Extract suppliers array from paginated response
  const suppliers = suppliersResponse?.data?.data || [];

  // Debug log to check suppliers data
  console.log("Suppliers response:", suppliersResponse);
  console.log("Suppliers list:", suppliers);
  console.log("Is loading suppliers:", isLoadingSuppliers);

  // Fetch outstanding invoices for the selected supplier
  const { data: outstandingInvoicesData, isLoading: isLoadingInvoices, error: invoicesError, refetch: refetchInvoices } = useOutstandingInvoices(selectedSupplierId?.toString() || "");

  const createSettlement = useCreateSettlement();

  // Refetch invoices when supplier changes
  useEffect(() => {
    if (selectedSupplierId) {
      refetchInvoices();
    }
  }, [selectedSupplierId, refetchInvoices]);

  const form = useForm<SettlementFormValues>({
    resolver: zodResolver(settlementFormSchema),
    defaultValues: {
      supplierId: initialSupplierId ? Number(initialSupplierId) : undefined,
      amount: "",
      paymentDate: new Date(),
      paymentMethod: "cash",
      referenceNumber: "",
      notes: "",
      invoiceIds: []
    }
  });

  const { 
    handleSubmit, 
    formState: internalFormState, 
    setValue, 
    watch, 
    getValues: internalGetValues, 
    reset,
    register 
  } = form;
  
  // Use prop formState if provided, otherwise use internal form state
  const formState = propFormState || internalFormState;
  const getValues = propGetValues || internalGetValues;
  
  // Use prop outstandingInvoices if provided, otherwise fetch them
  const outstandingInvoices = propOutstandingInvoices || outstandingInvoicesData || [];
  
  const handleFormSubmit = async (data: SettlementFormValues) => {
    if (onSubmit) {
      return onSubmit(data);
    }
    
    try {
      // Convert string values to numbers where needed
      const submissionData = {
        ...data,
        amount: parseFloat(data.amount),
        supplierId: Number(selectedSupplierId),
        invoiceIds: data.invoiceIds?.map((id: string) => Number(id)) || []
      };

      await createSettlement.mutateAsync(submissionData);
      
      toast({
        title: "Success",
        description: "Settlement created successfully",
        variant: "default"
      });
      
      reset();
      onSuccess?.();
    } catch (error) {
      console.error("Error creating settlement:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create settlement",
        variant: "destructive"
      });
      throw error;
    }
  };

  // Ensure paymentDate is always a Date object
  useEffect(() => {
    const subscription = watch((value, { name }) => {
      if (name === 'paymentDate' && value.paymentDate && typeof value.paymentDate === 'string') {
        setValue('paymentDate', new Date(value.paymentDate), { shouldValidate: true });
      }
    });
    return () => subscription.unsubscribe();
  }, [watch, setValue]);

  const selectedInvoices = watch("invoiceIds");
  const paymentAmount = watch("amount");
  const paymentDate = watch("paymentDate") || new Date();

  const calculateTotalOutstanding = () => {
    if (!outstandingInvoices) return 0;
    return outstandingInvoices.filter((inv: any) => selectedInvoices.includes(inv.id.toString())).reduce((sum: number, inv: any) => sum + parseFloat(inv.amountDue), 0);
  };

  const handleSelectAllInvoices = (checked: boolean) => {
    if (!outstandingInvoices) return;

    if (checked) {
      setValue(
        "invoiceIds",
        outstandingInvoices.map((inv: any) => inv.id.toString())
      );
      setValue("amount", calculateTotalOutstanding());
    } else {
      setValue("invoiceIds", []);
      setValue("amount", 0);
    }
  };

  const handleInvoiceSelect = (invoiceId: string, checked: boolean) => {
    const currentIds = [...selectedInvoices];

    if (checked) {
      currentIds.push(invoiceId);
    } else {
      const index = currentIds.indexOf(invoiceId);
      if (index > -1) {
        currentIds.splice(index, 1);
      }
    }

    setValue("invoiceIds", currentIds);

    const selectedTotal = outstandingInvoices?.filter((inv: any) => currentIds.includes(inv.id.toString())).reduce((sum: number, inv: any) => sum + parseFloat(inv.amountDue), 0) || 0;

    setValue("amount", selectedTotal);
  };

  const handleSupplierChange = (value: string) => {
    setSelectedSupplierId(value);
    // Reset form when supplier changes
    setValue("invoiceIds", []);
    setValue("amount", 0);
  };

  if (isLoadingSuppliers) {
    return (
      <div className="flex flex-col items-center justify-center py-8 space-y-2">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
        <p className="text-sm text-muted-foreground">Loading suppliers...</p>
      </div>
    );
  }

  return (
    <FormProvider {...form}>
      <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="space-y-6 md:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Supplier Information</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="supplier">Select Supplier *</Label>
                    <Select value={selectedSupplierId?.toString() || ""} onValueChange={handleSupplierChange} disabled={!!initialSupplierId}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select a supplier" />
                      </SelectTrigger>
                      <SelectContent>
                        {Array.isArray(suppliers) ? (
                          suppliers.map(supplier => (
                            <SelectItem key={supplier.id} value={supplier.id.toString()}>
                              {supplier.name}
                            </SelectItem>
                          ))
                        ) : (
                          <div className="p-2 text-sm text-muted-foreground">No suppliers found</div>
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Outstanding Invoices</CardTitle>
                <CardDescription>{selectedSupplierId ? "Select invoices to pay with this settlement" : "Please select a supplier to view outstanding invoices"}</CardDescription>
              </CardHeader>
              <CardContent>
                {!selectedSupplierId ? (
                  <div className="text-center py-8 text-muted-foreground">No supplier selected. Please select a supplier to view outstanding invoices.</div>
                ) : outstandingInvoices && outstandingInvoices.length > 0 ? (
                  <>
                    <div className="flex items-center space-x-2 mb-4">
                      <Checkbox id="selectAll" checked={selectedInvoices.length === outstandingInvoices.length} onCheckedChange={checked => handleSelectAllInvoices(checked as boolean)} />
                      <Label htmlFor="selectAll" className="text-sm font-medium">
                        Select All Invoices
                      </Label>
                    </div>

                    <ScrollArea className="h-64 rounded-md border p-4">
                      <div className="space-y-4">
                        {outstandingInvoices.map((invoice: any) => (
                          <div key={invoice.id} className="flex items-center space-x-4">
                            <Checkbox id={`invoice-${invoice.id}`} checked={selectedInvoices.includes(invoice.id.toString())} onCheckedChange={checked => handleInvoiceSelect(invoice.id.toString(), checked as boolean)} />
                            <div className="flex-1">
                              <div className="flex justify-between">
                                <Label htmlFor={`invoice-${invoice.id}`} className="font-normal">
                                  Invoice #{invoice.invoiceNumber}
                                </Label>
                                <span className="font-medium">{formatCurrency(parseFloat(invoice.amountDue))}</span>
                              </div>
                              <p className="text-sm text-muted-foreground">Due: {format(new Date(invoice.dueDate), "MMM d, yyyy")}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  </>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">No outstanding invoices found for this supplier.</div>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Payment Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="amount">Amount *</Label>
                  <Input 
                    id="amount" 
                    type="number" 
                    step="0.01" 
                    min="0.01"
                    {...register("amount", { 
                      valueAsNumber: true,
                      required: "Amount is required",
                      min: { value: 0.01, message: "Amount must be greater than 0" }
                    })} 
                    className={formState.errors.amount ? "border-red-500" : ""} 
                  />
                  {formState.errors.amount && (
                    <p className="text-sm text-red-500">{formState.errors.amount.message as string}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="paymentMethod">Payment Method *</Label>
                  <select 
                    id="paymentMethod" 
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50" 
                    {...register("paymentMethod", { required: "Payment method is required" })}
                  >
                    <option value="cash">Cash</option>
                    <option value="bank_transfer">Bank Transfer</option>
                    <option value="check">Check</option>
                    <option value="credit_card">Credit Card</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <Label>Payment Date *</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !paymentDate && "text-muted-foreground")}>
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {paymentDate ? format(new Date(paymentDate), "PPP") : <span>Pick a date</span>}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar mode="single" selected={new Date(paymentDate)} onSelect={date => setValue("paymentDate", date || new Date())} initialFocus />
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="referenceNumber">Reference Number</Label>
                  <Input id="referenceNumber" placeholder="e.g. Check #, Transaction ID" {...register("referenceNumber")} />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="notes">Notes</Label>
                  <Textarea id="notes" placeholder="Any additional notes about this payment" {...register("notes")} />
                </div>

                <div className="pt-4 border-t">
                  <div className="flex justify-between font-medium">
                    <span>Total Outstanding:</span>
                    <span>{formatCurrency(calculateTotalOutstanding())}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="flex justify-end space-x-4">
              <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
                Cancel
              </Button>
              <div className="flex gap-2">
                <Button
                  type="submit"
                  disabled={isSubmitting || !selectedSupplierId || !formState.isValid}
                >
                  {isSubmitting ? "Processing..." : "Record Payment"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={debugForm}
                >
                  Debug Form
                </Button>
              </div>
            </div>
          </div>
        </div>
      </form>
    </FormProvider>
  );
}

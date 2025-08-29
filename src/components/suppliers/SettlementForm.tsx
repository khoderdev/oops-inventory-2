import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import { useOutstandingInvoices, useCreateSettlement } from "@/hooks/useSuppliers";
import { format } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatCurrency } from "@/utils/conversionLogic";
import { settlementFormSchema } from "./schemas/settlement-schema";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";

interface SettlementFormProps {
  supplierId: string | number;
  onSuccess?: () => void;
}

export function SettlementForm({ supplierId, onSuccess }: SettlementFormProps) {
  const { toast } = useToast();
  
  const { 
    data: outstandingInvoices, 
    isLoading: isLoadingInvoices,
    error: invoicesError 
  } = useOutstandingInvoices(supplierId || "");
  
  const createSettlement = useCreateSettlement();
  
  if (!supplierId) {
    return <div className="text-red-500">Error: No supplier ID provided</div>;
  }

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(settlementFormSchema),
    defaultValues: {
      amount: 0,
      paymentMethod: "cash",
      paymentDate: new Date(),
      referenceNumber: "",
      notes: "",
      invoiceIds: [] as string[],
    },
  });

  const selectedInvoices = watch("invoiceIds");
  const paymentAmount = watch("amount");
  const paymentDate = watch("paymentDate") || new Date();

  const calculateTotalOutstanding = () => {
    if (!outstandingInvoices) return 0;
    return outstandingInvoices
      .filter((inv: any) => selectedInvoices.includes(inv.id.toString()))
      .reduce((sum: number, inv: any) => sum + parseFloat(inv.amountDue), 0);
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
    
    const selectedTotal = outstandingInvoices
      ?.filter((inv: any) => currentIds.includes(inv.id.toString()))
      .reduce((sum: number, inv: any) => sum + parseFloat(inv.amountDue), 0) || 0;
      
    setValue("amount", selectedTotal);
  };

  const onSubmit = async (data: any) => {
    if (!supplierId) return;

    try {
      await createSettlement.mutateAsync({
        supplierId,
        data: {
          ...data,
          amount: parseFloat(data.amount),
          invoiceIds: data.invoiceIds.map((id: string) => parseInt(id)),
        },
      });

      toast({
        title: "Success",
        description: "Payment settlement recorded successfully",
      });

      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to record payment settlement",
        variant: "destructive",
      });
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="space-y-6 md:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Outstanding Invoices</CardTitle>
              <CardDescription>Select invoices to pay with this settlement</CardDescription>
            </CardHeader>
            <CardContent>
              {outstandingInvoices && outstandingInvoices.length > 0 ? (
                <>
                  <div className="flex items-center space-x-2 mb-4">
                    <Checkbox
                      id="selectAll"
                      checked={selectedInvoices.length === outstandingInvoices.length}
                      onCheckedChange={(checked) => handleSelectAllInvoices(checked as boolean)}
                    />
                    <Label htmlFor="selectAll" className="text-sm font-medium">
                      Select All Invoices
                    </Label>
                  </div>
                  
                  <ScrollArea className="h-64 rounded-md border p-4">
                    <div className="space-y-4">
                      {outstandingInvoices.map((invoice: any) => (
                        <div key={invoice.id} className="flex items-center space-x-4">
                          <Checkbox
                            id={`invoice-${invoice.id}`}
                            checked={selectedInvoices.includes(invoice.id.toString())}
                            onCheckedChange={(checked) => 
                              handleInvoiceSelect(invoice.id.toString(), checked as boolean)
                            }
                          />
                          <div className="flex-1">
                            <div className="flex justify-between">
                              <Label htmlFor={`invoice-${invoice.id}`} className="font-normal">
                                Invoice #{invoice.invoiceNumber}
                              </Label>
                              <span className="font-medium">
                                {formatCurrency(parseFloat(invoice.amountDue))}
                              </span>
                            </div>
                            <p className="text-sm text-muted-foreground">
                              Due: {format(new Date(invoice.dueDate), "MMM d, yyyy")}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  No outstanding invoices found for this supplier.
                </div>
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
                  {...register("amount", { valueAsNumber: true })}
                  className={errors.amount ? "border-red-500" : ""}
                />
                {errors.amount && (
                  <p className="text-sm text-red-500">{errors.amount.message as string}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="paymentMethod">Payment Method *</Label>
                <select
                  id="paymentMethod"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  {...register("paymentMethod")}
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
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !paymentDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {paymentDate ? (
                        format(new Date(paymentDate), "PPP")
                      ) : (
                        <span>Pick a date</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={new Date(paymentDate)}
                      onSelect={(date) =>
                        setValue("paymentDate", date || new Date())
                      }
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-2">
                <Label htmlFor="referenceNumber">Reference Number</Label>
                <Input
                  id="referenceNumber"
                  placeholder="e.g. Check #, Transaction ID"
                  {...register("referenceNumber")}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  placeholder="Any additional notes about this payment"
                  {...register("notes")}
                />
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
            <Button
              type="button"
              variant="outline"
              onClick={onSuccess}
              disabled={createSettlement.isPending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={createSettlement.isPending}>
              {createSettlement.isPending ? "Processing..." : "Record Payment"}
            </Button>
          </div>
        </div>
      </div>
    </form>
  );
}
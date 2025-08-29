import React from "react";
import { useCreateSettlement, useSettlementForm } from "@/hooks/useSuppliers";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { DialogClose } from "@/components/ui/dialog";
import { SupplierInvoice } from "@/types/supplier";

interface CreateSettlementFormProps {
  supplierId: number | string;
  outstandingInvoices: SupplierInvoice[];
}

const CreateSettlementForm: React.FC<CreateSettlementFormProps> = ({ supplierId, outstandingInvoices }) => {
  const createSettlement = useCreateSettlement();
  const { formData, updateField, resetForm, getPayloadForSubmit } = useSettlementForm();

  const handleInvoiceSelect = (id: number | string, checked: boolean) => {
    const currentIds = formData.invoiceIds || [];
    const newIds = checked 
      ? [...currentIds, Number(id)] 
      : currentIds.filter(i => i !== Number(id));
    updateField("invoiceIds", newIds);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload = getPayloadForSubmit();
    console.log('Submitting settlement with payload:', {
      supplierId,
      data: payload,
      payloadType: typeof payload.amount,
      payloadDateType: typeof payload.paymentDate
    });
    
    createSettlement.mutate(
      { supplierId, data: payload },
      {
        onSuccess: () => {
          resetForm();
        },
        onError: (error: unknown) => {
          if (error && typeof error === 'object') {
            const errorObj = error as {
              message?: string;
              response?: {
                data?: unknown;
                status?: number;
                statusText?: string;
              };
              config?: {
                url?: string;
                method?: string;
                data?: unknown;
              };
            };
            
            console.error('Error creating settlement:', {
              message: errorObj.message || 'Unknown error',
              response: errorObj.response?.data,
              status: errorObj.response?.status,
              statusText: errorObj.response?.statusText,
              config: errorObj.config ? {
                url: errorObj.config.url,
                method: errorObj.config.method,
                data: errorObj.config.data
              } : undefined
            });
          } else {
            console.error('Unknown error creating settlement:', error);
          }
        }
      }
    );
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="grid gap-4">
        <div>
          <Label htmlFor="amount">Amount</Label>
          <Input 
            id="amount" 
            type="number" 
            value={formData.amount} 
            onChange={e => updateField("amount", parseFloat(e.target.value) || 0)} 
            required 
            min="0"
            step="0.01"
          />
        </div>
        <div>
          <Label htmlFor="paymentMethod">Payment Method</Label>
          <Select 
            value={formData.paymentMethod} 
            onValueChange={value => updateField("paymentMethod", value as PaymentMethod)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="cash">Cash</SelectItem>
              <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
              <SelectItem value="credit_card">Credit Card</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="referenceNumber">Reference Number</Label>
          <Input 
            id="referenceNumber" 
            value={formData.referenceNumber || ''} 
            onChange={e => updateField("referenceNumber", e.target.value)} 
          />
        </div>
        <div>
          <Label htmlFor="paymentDate">Payment Date</Label>
          <Input 
            id="paymentDate" 
            type="date" 
            value={formData.paymentDate} 
            onChange={e => updateField("paymentDate", e.target.value)} 
            required 
          />
        </div>
        <div>
          <Label>Select Invoices to Settle</Label>
          {outstandingInvoices.map(invoice => (
            <div key={invoice.id} className="flex items-center">
              <Checkbox id={`invoice-${invoice.id}`} checked={formData.invoiceIds.includes(invoice.id)} onCheckedChange={checked => handleInvoiceSelect(invoice.id, checked as boolean)} />
              <Label htmlFor={`invoice-${invoice.id}`} className="ml-2">
                Invoice {invoice.id} - ${invoice.amount} (Due: {invoice.dueDate})
              </Label>
            </div>
          ))}
        </div>
        <DialogClose asChild>
          <Button type="submit" disabled={createSettlement.isPending}>
            Create Settlement
          </Button>
        </DialogClose>
      </div>
    </form>
  );
};

export default CreateSettlementForm;

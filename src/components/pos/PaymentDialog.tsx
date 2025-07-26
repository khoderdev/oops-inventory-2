import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { PaymentDialogProps } from "@/types/inventory";
import { formatCurrency } from "@/utils/conversionLogic";
import { Check, CreditCard, Loader2 } from "lucide-react";
import React from "react";

export const PaymentDialog: React.FC<PaymentDialogProps> = ({ isOpen, onClose, total, paymentAmount, onPaymentAmountChange, onPayment, isLoading }) => {
  const quickAmounts = [10, 20, 50, 100, total, Math.ceil(total / 10) * 10];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <CreditCard className="w-5 h-5" />
            <span>Process Payment</span>
          </DialogTitle>
          <DialogDescription>Complete the transaction</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-lg">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{formatCurrency(total)}</div>
              <div className="text-sm text-slate-500">Total Amount</div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Payment Amount</label>
            <Input type="number" step="0.01" placeholder="Enter amount" value={paymentAmount} onChange={e => onPaymentAmountChange(e.target.value)} className="h-12 text-lg text-center" />
          </div>

          <div className="grid grid-cols-3 gap-2">
            {quickAmounts.map(amount => (
              <Button key={amount} variant="outline" onClick={() => onPaymentAmountChange(amount.toString())}>
                {formatCurrency(amount)}
              </Button>
            ))}
          </div>

          {parseFloat(paymentAmount) > total && (
            <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded-lg">
              <div className="text-sm text-green-700 dark:text-green-300">Change: {formatCurrency(parseFloat(paymentAmount) - total)}</div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={onPayment} disabled={isLoading || !paymentAmount || parseFloat(paymentAmount) < total}>
            {isLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Check className="w-4 h-4 mr-2" />}
            Complete Sale
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

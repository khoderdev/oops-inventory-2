import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { PaymentDialogProps } from "@/types/inventory";
import { formatCurrency } from "@/utils/conversionLogic";
import { Check, CreditCard, Loader2 } from "lucide-react";
import React from "react";

export const PaymentDialog: React.FC<PaymentDialogProps> = ({ isOpen, onClose, total, paymentAmount, onPaymentAmountChange, onPayment, isLoading }) => {
  // Create quick amounts with $5 added and sorted
  const baseAmounts = [5, 10, 20, 50, 100];
  const totalAmount = total;
  const roundedUpAmount = Math.ceil(total / 10) * 10;

  // Combine and sort amounts, remove duplicates
  const quickAmounts = [...new Set([...baseAmounts, totalAmount, roundedUpAmount])].sort((a, b) => a - b).filter(amount => amount > 0);

  const isExactAmount = parseFloat(paymentAmount) === total;
  const hasChange = parseFloat(paymentAmount) > total;
  const changeAmount = hasChange ? parseFloat(paymentAmount) - total : 0;

  // Debug logging
  const isButtonDisabled = isLoading || !paymentAmount || parseFloat(paymentAmount) < total;

  return (
    <Dialog open={isOpen} onOpenChange={onClose} modal={true}>
      <DialogContent className="w-screen h-screen max-w-none max-h-none m-0 p-0 bg-white overflow-hidden" onOpenAutoFocus={e => e.preventDefault()}>
        <div className="w-full h-full flex flex-col overflow-hidden">
          {/* Header */}
          <DialogHeader className="flex-shrink-0 px-8 pt-8 pb-4 border-b">
            <DialogTitle className="flex items-center justify-center space-x-3 text-2xl">
              <CreditCard className="w-8 h-8 text-blue-600" />
              <span className="text-gray-800">Payment</span>
            </DialogTitle>
          </DialogHeader>

          <div className="flex-1 p-6 overflow-y-auto">
            {/* Total Amount Display */}
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200 p-6 rounded-2xl">
              <div className="text-center">
                <div className="text-sm font-medium text-green-700 mb-2">TOTAL AMOUNT</div>
                <div className="text-5xl font-bold text-green-600 mb-2">{formatCurrency(total)}</div>
                <div className="text-green-600 font-medium">Amount Due</div>
              </div>
            </div>

            {/* Payment Input */}
            <div className="space-y-3">
              <label className="block text-lg font-semibold text-gray-700 text-center">Enter Payment Amount</label>
              <Input type="number" step="0.01" placeholder="0.00" value={paymentAmount} onChange={e => onPaymentAmountChange(e.target.value)} className="h-16 text-2xl text-center font-bold border-2 border-gray-300 focus:border-blue-500 rounded-xl" />
            </div>

            {/* Quick Amount Buttons */}
            <div className="p-4">
              <div className="grid grid-cols-3 gap-3">
                {quickAmounts.map(amount => {
                  const isTotal = amount === total;
                  const isSelected = parseFloat(paymentAmount) === amount;

                  return (
                    <Button key={amount} variant={isSelected ? "default" : "outline"} size="lg" onClick={() => onPaymentAmountChange(amount.toString())} className={`h-14 text-lg font-bold transition-all duration-200 ${isSelected ? "bg-blue-600 hover:bg-blue-700 text-white" : "hover:bg-gray-50 hover:border-gray-400"}`}>
                      {formatCurrency(amount)}
                      {isTotal && <div className="ml-2 px-2 py-1 bg-green-600 text-white text-xs rounded-full font-bold">EXACT</div>}
                    </Button>
                  );
                })}
              </div>
            </div>

            {/* Change Display */}
            {hasChange && (
              <div className="flex justify-center items-center text-center ">
                <div className="w-fit text-center pt-2">
                  <div className="text-sm font-medium text-blue-700 mb-1">CHANGE DUE</div>
                  <div className="text-3xl font-bold text-blue-600">{formatCurrency(changeAmount)}</div>
                </div>
              </div>
            )}

            {/* Exact Amount Confirmation */}
            {isExactAmount && (
              <div className="flex justify-center items-center text-center ">
                <div className="w-fit text-center pt-2">
                  <div className="text-2xl font-bold text-green-600">Exact Amount - No Change Required</div>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <DialogFooter className="flex-shrink-0 px-8 py-6 bg-gray-50 border-t">
            <div className="flex w-full space-x-4">
              <Button variant="outline" size="lg" onClick={onClose} className="flex-1 h-14 text-lg font-semibold">
                Cancel
              </Button>
              <Button
                onClick={() => {
                  console.log("💆 Payment button clicked!", { paymentAmount, total, isLoading });
                  onPayment();
                }}
                disabled={isLoading || !paymentAmount || parseFloat(paymentAmount) < total}
                size="lg"
                className="flex-1 h-14 text-lg font-semibold bg-green-600 hover:bg-green-700 text-white"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Check className="w-5 h-5 mr-2" />
                    Complete Sale
                  </>
                )}
              </Button>
            </div>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
};

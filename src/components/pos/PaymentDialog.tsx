import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { PaymentDialogProps } from "@/types/inventory";
import { formatCurrency } from "@/utils/conversionLogic";
import { ArrowRight, Calculator, Check, CreditCard, DollarSign, Loader2 } from "lucide-react";
import React from "react";

export const PaymentDialog: React.FC<PaymentDialogProps> = ({ isOpen, onClose, total, paymentAmount, onPaymentAmountChange, onPayment, isLoading }) => {
  const baseAmounts = [5, 10, 20, 50, 100];
  const totalAmount = total;
  const roundedUpAmount = Math.ceil(total / 5) * 5;
  const roundedUpTen = Math.ceil(total / 10) * 10;
  const quickAmounts = [...new Set([...baseAmounts.filter(amount => amount >= total), totalAmount, roundedUpAmount, roundedUpTen])]
    .sort((a, b) => a - b)
    .filter(amount => amount > 0 && amount <= total + 100)
    .slice(0, 6);
  const paymentValue = parseFloat(paymentAmount) || 0;
  const isExactAmount = paymentValue === total;
  const hasChange = paymentValue > total;
  const changeAmount = hasChange ? paymentValue - total : 0;
  const isInsufficientPayment = paymentValue > 0 && paymentValue < total;
  const shortfallAmount = isInsufficientPayment ? total - paymentValue : 0;
  const isButtonDisabled = isLoading || !paymentAmount || paymentValue < total;

  return (
    <Dialog open={isOpen} onOpenChange={onClose} modal={true}>
      <DialogContent className="!w-full !sm:w-[95vw] !h-[95vh] max-w- !z-50 max-h- m-0 p-0 bg-gray-100 overflow-hidden">
        <div className="w-full h-full flex flex-col overflow-hidden">
          <DialogTitle className="flex items-center justify-center space-x-2 text-lg sm:text-xl font-bold bg-primary border-t border-red-200">
            <div className="p-1.5 bg-white/20 rounded-full backdrop-blur-sm">
              <CreditCard className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <span>Complete Payment</span>
          </DialogTitle>

          <div className="flex-1 overflow-y-auto min-h-0">
            <div className="p-3 sm:p-4 space-y-3 sm:space-y-4">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 p-4">
                <div className="relative bg-gradient-to-br from-emerald-50 via-green-50 to-teal-50 border-2 border-emerald-200 p-6 rounded-2xl shadow-lg">
                  <div className="text-center">
                    <div className="text-sm font-bold text-emerald-700 mb-3 tracking-wider uppercase">Total Amount Due</div>
                    <div className="text-4xl lg:text-5xl font-black text-emerald-600 mb-3 tracking-tight">{formatCurrency(total)}</div>
                    <div className="inline-flex justify-center items-center px-4 py-2 bg-emerald-100 text-emerald-700 font-semibold rounded-full text-xs">
                      <Calculator className="w-4 h-4 mr-2" />
                      Payment Required
                    </div>
                  </div>
                </div>

                <div className="flex flex-col justify-center space-y-4">
                  <label className="block text-xl font-bold text-primary text-center">Enter Payment Amount</label>
                  <div className="flex justify-center">
                    <div className="relative w-full max-w-72">
                      <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-primary">
                        <DollarSign className="w-6 h-6 text-primary font-mono" />
                      </div>
                      <Input type="number" step="0.01" placeholder="0.00" value={paymentAmount} onChange={e => onPaymentAmountChange(e.target.value)} className="h-16 pl-12 pr-6 text-emerald-400 text-2xl sm:!text-4xl text-center font-bold border-2 border-gray-300 focus:border-primary focus:ring-2 focus:ring-primary/20 rounded-xl bg-white shadow-lg transition-all duration-200 font-mono w-full" />
                    </div>
                  </div>

                  {isInsufficientPayment && (
                    <div className="flex items-center justify-center space-x-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                      <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                      <span className="text-red-700 font-semibold text-base">Need {formatCurrency(shortfallAmount)} more</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-3">
                <h3 className="text-base font-bold font-mono text-emerald-600 text-center">Quick Payment Options</h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-5">
                  {quickAmounts.map(amount => {
                    const isTotal = amount === total;
                    const isSelected = paymentValue === amount;
                    const changeForAmount = amount > total ? amount - total : 0;

                    return (
                      <Button key={amount} variant={isSelected ? "default" : "outline"} size="sm" onClick={() => onPaymentAmountChange(amount.toString())} className={`h-12 sm:h-14 p-2 sm:p-3 text-sm sm:text-base font-bold transition-all duration-300 transform hover:scale-105 hover:shadow-lg ${isSelected ? "bg-gradient-to-r from-primary to-primary hover:from-primary hover:to-primary text-white shadow-lg scale-105" : "border-2 border-primary hover:border-primary"}`}>
                        <div className="flex flex-col items-center space-y-0.5">
                          <span className="text-base sm:text-lg font-black">{formatCurrency(amount)}</span>
                          {isTotal && <div className="px-1.5 py-0.5 bg-emerald-500 text-white text-xs rounded-full font-bold uppercase tracking-wide">Exact</div>}
                          {!isTotal && changeForAmount > 0 && <div className="px-1.5 py-0.5 bg-blue-100 text-primary text-xs rounded-full font-semibold">+{formatCurrency(changeForAmount)}</div>}
                        </div>
                      </Button>
                    );
                  })}
                </div>
              </div>

              {hasChange && (
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 p-3 sm:p-4 rounded-xl">
                  <div className="text-center">
                    <div className="flex items-center justify-center space-x-2 mb-2">
                      <ArrowRight className="w-4 h-4 text-primary font-mono" />
                      <span className="text-xs sm:text-sm font-bold text-primary tracking-wider uppercase">Change Due</span>
                    </div>
                    <div className="text-2xl sm:text-3xl font-black text-primary mb-2">{formatCurrency(changeAmount)}</div>
                    <div className="inline-flex items-center px-3 py-1 bg-primary text-white font-semibold rounded-full text-xs sm:text-sm">
                      <DollarSign className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                      Return to Customer
                    </div>
                  </div>
                </div>
              )}

              {isExactAmount && (
                <div className="w-full flex items-center justify-center !mt-10">
                  <div className="w-fit text-center bg-gradient-to-r from-emerald-50 to-green-50 border-2 border-emerald-200 p-3 sm:p-4 rounded-xl shadow-lg animate-bounce-zoom">
                    <div className="flex items-center justify-center space-x-2 mb-1">
                      <Check className="w-5 h-5 text-emerald-600" />
                      <span className="text-lg sm:text-xl font-bold text-emerald-600">NO CHANGE TO RETURN</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Compact Footer */}
          <DialogFooter className="flex-shrink-0 bg-gradient-to-r from-gray-50 to-slate-50 ">
            <div className="w-full space-y-3 ">
              <div className="flex w-full space-x-3 sm:space-x-4 px-2">
                <Button variant="outline" size="lg" onClick={onClose} className="flex-1 h-12 sm:h-14 text-base sm:text-lg font-bold border-2 border-gray-300 hover:border-gray-400 hover:bg-gray-50 transition-all duration-200">
                  Cancel
                </Button>
                <Button
                  onClick={() => {
                    console.log("💆 Payment button clicked!", { paymentAmount, total, isLoading });
                    onPayment();
                  }}
                  disabled={isButtonDisabled}
                  size="lg"
                  className={`flex-1 h-12 sm:h-14 text-base sm:text-lg font-bold transition-all duration-300 transform ${isButtonDisabled ? "bg-gray-300 text-gray-500 cursor-not-allowed" : "bg-gradient-to-r from-emerald-600 to-emerald-600 hover:from-emerald-700 hover:to-emerald-700 text-white shadow-lg hover:shadow-xl hover:scale-105 active:scale-95"}`}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 mr-2 animate-spin" />
                      <span className="hidden sm:inline">Processing...</span>
                      <span className="sm:hidden">Processing</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                      <span>Complete Sale</span>
                    </>
                  )}
                </Button>
              </div>

              {paymentValue > 0 && (
                <div className="text-center text-xs sm:text-sm pb-2">
                  <div className="flex items-center justify-center space-x-2 sm:space-x-3 flex-wrap font-mono  text-teal-400">
                    <span>
                      Payment: <strong>{formatCurrency(paymentValue)}</strong>
                    </span>
                    <span className="hidden sm:inline">•</span>
                    <span>
                      Total: <strong>{formatCurrency(total)}</strong>
                    </span>
                    {hasChange && (
                      <>
                        <span className="hidden sm:inline">•</span>
                        <span className="text-blue-600 font-semibold w-full sm:w-auto text-center font-mono">
                          Change: <strong>{formatCurrency(changeAmount)}</strong>
                        </span>
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
};

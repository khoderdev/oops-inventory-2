import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { PaymentDialogProps } from "@/types/inventory";
import { formatCurrency } from "@/utils/conversionLogic";
import { Check, CreditCard, Loader2, DollarSign, ArrowRight, Calculator } from "lucide-react";
import React from "react";

export const PaymentDialog: React.FC<PaymentDialogProps> = ({ isOpen, onClose, total, paymentAmount, onPaymentAmountChange, onPayment, isLoading }) => {
  // Create smart quick amounts with better logic
  const baseAmounts = [5, 10, 20, 50, 100];
  const totalAmount = total;
  const roundedUpAmount = Math.ceil(total / 5) * 5; // Round to nearest $5
  const roundedUpTen = Math.ceil(total / 10) * 10; // Round to nearest $10

  // Combine and sort amounts, remove duplicates and filter intelligently
  const quickAmounts = [...new Set([
    ...baseAmounts.filter(amount => amount >= total), // Only show base amounts >= total
    totalAmount, 
    roundedUpAmount,
    roundedUpTen
  ])]
    .sort((a, b) => a - b)
    .filter(amount => amount > 0 && amount <= total + 100) // Cap at total + $100
    .slice(0, 6); // Limit to 6 amounts for better layout

  const paymentValue = parseFloat(paymentAmount) || 0;
  const isExactAmount = paymentValue === total;
  const hasChange = paymentValue > total;
  const changeAmount = hasChange ? paymentValue - total : 0;
  const isInsufficientPayment = paymentValue > 0 && paymentValue < total;
  const shortfallAmount = isInsufficientPayment ? total - paymentValue : 0;

  const isButtonDisabled = isLoading || !paymentAmount || paymentValue < total;

  return (
    <Dialog open={isOpen} onOpenChange={onClose} modal={true}>
      <DialogContent className="w-screen h-screen max-w-none max-h-none m-0 p-0 bg-gradient-to-br from-slate-50 via-white to-blue-50 overflow-hidden" onOpenAutoFocus={e => e.preventDefault()} aria-hidden={false}>
        <div className="w-full h-full flex flex-col">
          {/* Compact Header */}
          <DialogHeader className="flex-shrink-0 px-4 sm:px-6 pt-4 pb-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
            <DialogTitle className="flex items-center justify-center space-x-3 text-xl sm:text-2xl font-bold">
              <div className="p-2 bg-white/20 rounded-full backdrop-blur-sm">
                <CreditCard className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
              <span>Complete Payment</span>
            </DialogTitle>
            <p className="text-center text-blue-100 mt-1 text-sm sm:text-base font-medium">
              Process your transaction securely
            </p>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto">
            <div className="p-4 sm:p-6 space-y-4 sm:space-y-6 min-h-full flex flex-col">
              {/* Compact Total Amount Display */}
              <div className="relative bg-gradient-to-br from-emerald-50 via-green-50 to-teal-50 border-2 border-emerald-200 p-4 sm:p-6 rounded-2xl shadow-lg">
                <div className="absolute top-3 right-3">
                  <div className="p-1.5 bg-emerald-100 rounded-full">
                    <DollarSign className="w-3 h-3 sm:w-4 sm:h-4 text-emerald-600" />
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-xs sm:text-sm font-bold text-emerald-700 mb-2 tracking-wider uppercase">Total Amount Due</div>
                  <div className="text-3xl sm:text-4xl lg:text-5xl font-black text-emerald-600 mb-2 tracking-tight">{formatCurrency(total)}</div>
                  <div className="inline-flex items-center px-3 py-1 bg-emerald-100 text-emerald-700 font-semibold rounded-full text-xs sm:text-sm">
                    <Calculator className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                    Payment Required
                  </div>
                </div>
              </div>

              {/* Responsive Payment Input */}
              <div className="space-y-3">
                <label className="block text-lg sm:text-xl font-bold text-gray-800 text-center">
                  Enter Payment Amount
                </label>
                <div className="flex justify-center">
                  <div className="relative w-full max-w-sm">
                    <div className="absolute left-3 sm:left-4 top-1/2 transform -translate-y-1/2 text-gray-400">
                      <DollarSign className="w-4 h-4 sm:w-5 sm:h-5" />
                    </div>
                    <Input 
                      type="number" 
                      step="0.01" 
                      placeholder="0.00" 
                      value={paymentAmount} 
                      onChange={e => onPaymentAmountChange(e.target.value)} 
                      className="h-14 sm:h-16 pl-10 sm:pl-12 pr-4 sm:pr-6 text-xl sm:text-2xl text-center font-bold border-2 border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 rounded-xl bg-white shadow-lg transition-all duration-200 w-full" 
                    />
                  </div>
                </div>
                
                {/* Payment Status Indicators */}
                {isInsufficientPayment && (
                  <div className="flex items-center justify-center space-x-2 p-3 bg-red-50 border border-red-200 rounded-lg mx-4">
                    <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                    <span className="text-red-700 font-semibold text-sm sm:text-base">
                      Need {formatCurrency(shortfallAmount)} more
                    </span>
                  </div>
                )}
              </div>

              {/* Responsive Quick Amount Buttons */}
              <div className="space-y-3">
                <h3 className="text-base sm:text-lg font-bold text-gray-800 text-center">Quick Payment Options</h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3">
                  {quickAmounts.map(amount => {
                    const isTotal = amount === total;
                    const isSelected = paymentValue === amount;
                    const changeForAmount = amount > total ? amount - total : 0;

                    return (
                      <Button 
                        key={amount} 
                        variant={isSelected ? "default" : "outline"} 
                        size="sm" 
                        onClick={() => onPaymentAmountChange(amount.toString())} 
                        className={`h-12 sm:h-14 p-2 sm:p-3 text-sm sm:text-base font-bold transition-all duration-300 transform hover:scale-105 hover:shadow-lg ${
                          isSelected 
                            ? "bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg scale-105" 
                            : "hover:bg-gradient-to-r hover:from-gray-50 hover:to-blue-50 hover:border-blue-300 border-2"
                        }`}
                      >
                        <div className="flex flex-col items-center space-y-0.5">
                          <span className="text-base sm:text-lg font-black">{formatCurrency(amount)}</span>
                          {isTotal && (
                            <div className="px-1.5 py-0.5 bg-emerald-500 text-white text-xs rounded-full font-bold uppercase tracking-wide">
                              Exact
                            </div>
                          )}
                          {!isTotal && changeForAmount > 0 && (
                            <div className="px-1.5 py-0.5 bg-blue-100 text-blue-700 text-xs rounded-full font-semibold">
                              +{formatCurrency(changeForAmount)}
                            </div>
                          )}
                        </div>
                      </Button>
                    );
                  })}
                </div>
              </div>

              {/* Compact Change Display */}
              {hasChange && (
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 p-3 sm:p-4 rounded-xl">
                  <div className="text-center">
                    <div className="flex items-center justify-center space-x-2 mb-2">
                      <ArrowRight className="w-4 h-4 text-blue-600" />
                      <span className="text-xs sm:text-sm font-bold text-blue-700 tracking-wider uppercase">Change Due</span>
                    </div>
                    <div className="text-2xl sm:text-3xl font-black text-blue-600 mb-2">{formatCurrency(changeAmount)}</div>
                    <div className="inline-flex items-center px-3 py-1 bg-blue-100 text-blue-700 font-semibold rounded-full text-xs sm:text-sm">
                      <DollarSign className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                      Return to Customer
                    </div>
                  </div>
                </div>
              )}

              {/* Compact Exact Amount Confirmation */}
              {isExactAmount && (
                <div className="bg-gradient-to-r from-emerald-50 to-green-50 border-2 border-emerald-200 p-3 sm:p-4 rounded-xl">
                  <div className="text-center">
                    <div className="flex items-center justify-center space-x-2 mb-1">
                      <Check className="w-5 h-5 text-emerald-600" />
                      <span className="text-lg sm:text-xl font-bold text-emerald-600">Perfect Match!</span>
                    </div>
                    <p className="text-emerald-700 font-semibold text-sm sm:text-base">Exact amount - no change required</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Compact Footer */}
          <DialogFooter className="flex-shrink-0 px-4 sm:px-6 py-4 bg-gradient-to-r from-gray-50 to-slate-50 border-t-2 border-gray-200">
            <div className="w-full space-y-3">
              <div className="flex w-full space-x-3 sm:space-x-4">
                <Button 
                  variant="outline" 
                  size="lg" 
                  onClick={onClose} 
                  className="flex-1 h-12 sm:h-14 text-base sm:text-lg font-bold border-2 border-gray-300 hover:border-gray-400 hover:bg-gray-50 transition-all duration-200"
                >
                  Cancel
                </Button>
                <Button
                  onClick={() => {
                    console.log("💆 Payment button clicked!", { paymentAmount, total, isLoading });
                    onPayment();
                  }}
                  disabled={isButtonDisabled}
                  size="lg"
                  className={`flex-1 h-12 sm:h-14 text-base sm:text-lg font-bold transition-all duration-300 transform ${
                    isButtonDisabled 
                      ? "bg-gray-300 text-gray-500 cursor-not-allowed" 
                      : "bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-white shadow-lg hover:shadow-xl hover:scale-105 active:scale-95"
                  }`}
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
              
              {/* Compact Payment Summary */}
              {paymentValue > 0 && (
                <div className="text-center text-xs sm:text-sm text-gray-600">
                  <div className="flex items-center justify-center space-x-2 sm:space-x-3 flex-wrap">
                    <span>Payment: <strong>{formatCurrency(paymentValue)}</strong></span>
                    <span className="hidden sm:inline">•</span>
                    <span>Total: <strong>{formatCurrency(total)}</strong></span>
                    {hasChange && (
                      <>
                        <span className="hidden sm:inline">•</span>
                        <span className="text-blue-600 font-semibold w-full sm:w-auto text-center">
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

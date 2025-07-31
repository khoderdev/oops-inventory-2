import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Separator } from "@/components/ui/separator";
import { DiscountDialogProps } from "@/types/orders";
import { Banknote, Calculator, DollarSign, Percent } from "lucide-react";
import React, { useCallback, useEffect, useState } from "react";

export interface DiscountData {
  type: 'percentage' | 'fixed';
  value: number;
  reason?: string;
}

export interface ExtendedDiscountDialogProps extends DiscountDialogProps {
  orderSubtotal: number;
  onApplyDiscount: (discount: DiscountData) => void;
}

export const DiscountDialog: React.FC<ExtendedDiscountDialogProps> = ({ 
  isOpen, 
  onClose, 
  discountAmount, 
  onDiscountAmountChange, 
  onDiscount,
  orderSubtotal,
  onApplyDiscount
}) => {
  const [discountType, setDiscountType] = useState<'percentage' | 'fixed'>('percentage');
  const [discountValue, setDiscountValue] = useState<string>('');
  const [discountReason, setDiscountReason] = useState<string>('');
  const [calculatedDiscount, setCalculatedDiscount] = useState<number>(0);
  const [finalTotal, setFinalTotal] = useState<number>(orderSubtotal);

  // Predefined discount options
  const quickDiscounts = [
    { type: 'percentage' as const, value: 5, label: '5%' },
    { type: 'percentage' as const, value: 10, label: '10%' },
    { type: 'percentage' as const, value: 15, label: '15%' },
    { type: 'percentage' as const, value: 20, label: '20%' },
    { type: 'fixed' as const, value: 5, label: '$5' },
    { type: 'fixed' as const, value: 10, label: '$10' },
    { type: 'fixed' as const, value: 20, label: '$20' },
    { type: 'fixed' as const, value: 50, label: '$50' }
  ];

  // Calculate discount amount and final total
  const calculateDiscount = useCallback((type: 'percentage' | 'fixed', value: number) => {
    if (!value || value <= 0) {
      setCalculatedDiscount(0);
      setFinalTotal(orderSubtotal);
      return;
    }

    let discount = 0;
    if (type === 'percentage') {
      // Ensure percentage doesn't exceed 100%
      const safePercentage = Math.min(value, 100);
      discount = (orderSubtotal * safePercentage) / 100;
    } else {
      // Ensure fixed discount doesn't exceed order total
      discount = Math.min(value, orderSubtotal);
    }

    setCalculatedDiscount(discount);
    setFinalTotal(Math.max(0, orderSubtotal - discount));
  }, [orderSubtotal]);

  // Update calculations when inputs change
  useEffect(() => {
    const numValue = parseFloat(discountValue) || 0;
    calculateDiscount(discountType, numValue);
  }, [discountType, discountValue, calculateDiscount]);

  // Reset form when dialog opens
  useEffect(() => {
    if (isOpen) {
      setDiscountType('percentage');
      setDiscountValue('');
      setDiscountReason('');
      setCalculatedDiscount(0);
      setFinalTotal(orderSubtotal);
    }
  }, [isOpen, orderSubtotal]);

  const handleQuickDiscount = (discount: typeof quickDiscounts[0]) => {
    setDiscountType(discount.type);
    setDiscountValue(discount.value.toString());
    calculateDiscount(discount.type, discount.value);
  };

  const handleApply = () => {
    if (calculatedDiscount > 0) {
      const discountData: DiscountData = {
        type: discountType,
        value: parseFloat(discountValue) || 0,
        reason: discountReason.trim() || undefined
      };
      
      // Call both callbacks for backward compatibility
      onDiscountAmountChange(calculatedDiscount);
      onApplyDiscount(discountData);
      onDiscount();
    }
    onClose();
  };

  const handleInputChange = (value: string) => {
    // Allow only numbers and decimal point
    const sanitized = value.replace(/[^0-9.]/g, '');
    // Prevent multiple decimal points
    const parts = sanitized.split('.');
    const cleanValue = parts.length > 2 ? parts[0] + '.' + parts.slice(1).join('') : sanitized;
    
    setDiscountValue(cleanValue);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose} modal={true}>
      <DialogContent className="w-full h-full sm:w-[95vw] sm:h-[95vh] md:w-[90vw] md:h-[90vh] lg:w-[70vw] lg:h-[80vh] xl:w-[60vw] xl:h-[75vh] max-w-4xl max-h-screen z-50 m-0 p-0 bg-white overflow-hidden border-0 rounded-none sm:rounded-lg">
        <div className="w-full h-full flex flex-col overflow-hidden">
          <DialogTitle className="flex items-center justify-center space-x-2 text-lg sm:text-xl lg:text-2xl font-bold bg-gradient-to-r from-primary to-primary/90 text-white py-3 sm:py-4 shadow-lg">
            <Banknote className="w-5 h-5 sm:w-6 sm:h-6 lg:w-7 lg:h-7" />
            <span className="tracking-wide">Apply Discount</span>
          </DialogTitle>

          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* Order Summary */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                <Calculator className="w-5 h-5" />
                Order Summary
              </h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span className="font-medium">${orderSubtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-red-600">
                  <span>Discount:</span>
                  <span className="font-medium">-${calculatedDiscount.toFixed(2)}</span>
                </div>
                <Separator />
                <div className="flex justify-between text-lg font-bold">
                  <span>Final Total:</span>
                  <span className="text-green-600">${finalTotal.toFixed(2)}</span>
                </div>
              </div>
            </div>

            {/* Quick Discount Buttons */}
            <div>
              <h3 className="text-lg font-semibold mb-3">Quick Discounts</h3>
              <div className="grid grid-cols-4 gap-2">
                {quickDiscounts.map((discount, index) => (
                  <Button
                    key={index}
                    variant="outline"
                    size="sm"
                    onClick={() => handleQuickDiscount(discount)}
                    className="h-12 text-sm font-medium hover:bg-primary hover:text-white transition-colors"
                  >
                    {discount.label}
                  </Button>
                ))}
              </div>
            </div>

            {/* Discount Type Selection */}
            <div>
              <Label className="text-lg font-semibold mb-3 block">Discount Type</Label>
              <RadioGroup
                value={discountType}
                onValueChange={(value: 'percentage' | 'fixed') => setDiscountType(value)}
                className="flex space-x-6"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="percentage" id="percentage" />
                  <Label htmlFor="percentage" className="flex items-center gap-2 cursor-pointer">
                    <Percent className="w-4 h-4" />
                    Percentage
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="fixed" id="fixed" />
                  <Label htmlFor="fixed" className="flex items-center gap-2 cursor-pointer">
                    <DollarSign className="w-4 h-4" />
                    Fixed Amount
                  </Label>
                </div>
              </RadioGroup>
            </div>

            {/* Discount Value Input */}
            <div>
              <Label htmlFor="discountValue" className="text-lg font-semibold mb-2 block">
                Discount {discountType === 'percentage' ? 'Percentage' : 'Amount'}
              </Label>
              <div className="relative">
                <Input
                  id="discountValue"
                  type="text"
                  value={discountValue}
                  onChange={(e) => handleInputChange(e.target.value)}
                  placeholder={discountType === 'percentage' ? 'Enter percentage (0-100)' : 'Enter amount'}
                  className="text-lg h-12 pr-10"
                  max={discountType === 'percentage' ? 100 : orderSubtotal}
                />
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                  {discountType === 'percentage' ? '%' : '$'}
                </div>
              </div>
              {discountType === 'percentage' && parseFloat(discountValue) > 100 && (
                <p className="text-red-500 text-sm mt-1">Percentage cannot exceed 100%</p>
              )}
              {discountType === 'fixed' && parseFloat(discountValue) > orderSubtotal && (
                <p className="text-red-500 text-sm mt-1">Discount cannot exceed order total</p>
              )}
            </div>

            {/* Discount Reason */}
            <div>
              <Label htmlFor="discountReason" className="text-lg font-semibold mb-2 block">
                Reason (Optional)
              </Label>
              <Input
                id="discountReason"
                type="text"
                value={discountReason}
                onChange={(e) => setDiscountReason(e.target.value)}
                placeholder="Enter reason for discount..."
                className="text-base h-10"
                maxLength={100}
              />
            </div>

            {/* Discount Preview */}
            {calculatedDiscount > 0 && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <h4 className="font-semibold text-green-800 mb-2">Discount Preview</h4>
                <div className="text-sm text-green-700 space-y-1">
                  <p>Discount Type: {discountType === 'percentage' ? 'Percentage' : 'Fixed Amount'}</p>
                  <p>Discount Value: {discountType === 'percentage' ? `${discountValue}%` : `$${discountValue}`}</p>
                  <p>Discount Amount: ${calculatedDiscount.toFixed(2)}</p>
                  <p>Savings: {((calculatedDiscount / orderSubtotal) * 100).toFixed(1)}%</p>
                  {discountReason && <p>Reason: {discountReason}</p>}
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <DialogFooter className="flex-shrink-0 bg-gradient-to-r from-gray-50 to-slate-50 py-4 px-6">
            <div className="w-full flex space-x-3">
              <Button 
                variant="outline" 
                size="lg" 
                onClick={onClose} 
                className="flex-1 h-12 text-base font-bold border-2 border-gray-300 hover:border-gray-400 hover:bg-gray-50 transition-all duration-200"
              >
                Cancel
              </Button>
              <Button 
                size="lg" 
                onClick={handleApply}
                disabled={calculatedDiscount <= 0}
                className="flex-1 h-12 text-base font-bold bg-primary hover:bg-primary/90 text-white transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Apply Discount (${calculatedDiscount.toFixed(2)})
              </Button>
            </div>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
};

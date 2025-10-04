import { OrderSummaryProps } from "@/types/inventory";
import { formatCurrency } from "@/utils/conversionLogic";
import { HandCoins, Save, X } from "lucide-react";
import React from "react";
import { ActionButton } from "./ActionBar";

const OrderSummary: React.FC<OrderSummaryProps> = ({ 
  cart, 
  subtotal, 
  total, 
  onPaymentClick, 
  onSaveClick, 
  orderStatus,
  isOrderCompleted,
  appliedDiscount,
  onRemoveDiscount
}) => {
  if (!cart || cart.length === 0) {
    return null;
  }

  // Consider cancelled as voided; disable actions for paid/served/cancelled
  const isVoided = orderStatus === 'cancelled';
  const isCompleted = isVoided || isOrderCompleted || orderStatus === 'paid' || orderStatus === 'served';
  
  // Disable payment and save actions for completed orders
  const handlePaymentClick = () => {
    if (isCompleted) {
      console.log('Cannot open payment dialog - order is already completed:', {
        orderStatus,
        isOrderCompleted
      });
      return;
    }
    onPaymentClick();
  };

  const handleSaveClick = () => {
    if (isCompleted) {
      console.log('Cannot save - order is already completed:', {
        orderStatus,
        isOrderCompleted
      });
      return;
    }
    onSaveClick();
  };

  return (
    <div className="border-t border-gray-200 pb-0 bg-gray-50">
      <div className="space-y-2 p-2 text-sm">
        <div className="flex justify-between">
          <span>Sub Total</span>
          <span>{formatCurrency(subtotal)}</span>
        </div>
        
        {/* Discount Information */}
        {appliedDiscount && (
          <div className="flex justify-between items-center text-red-600 bg-red-50 px-2 py-1 rounded">
            <div className="flex flex-col">
              <span className="text-xs font-medium">
                {appliedDiscount.type === 'percentage' 
                  ? `${appliedDiscount.value}% Discount` 
                  : `$${appliedDiscount.value} Discount`}
              </span>
              {appliedDiscount.reason && (
                <span className="text-xs opacity-75">{appliedDiscount.reason}</span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <span className="font-medium">-{formatCurrency(appliedDiscount.amount)}</span>
              {onRemoveDiscount && !isCompleted && (
                <button
                  onClick={onRemoveDiscount}
                  className="text-red-500 hover:text-red-700 p-1 rounded-full hover:bg-red-100 transition-colors"
                  title="Remove discount"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
          </div>
        )}
        
        <div className="border-t border-gray-300">
          <div className="flex justify-between font-bold text-lg">
            <span>TOTAL</span>
            <span className={appliedDiscount ? "text-green-600" : ""}>
              {formatCurrency(total)}
            </span>
          </div>
          {appliedDiscount && (
            <div className="text-xs text-green-600 text-right">
              You saved {formatCurrency(appliedDiscount.amount)}!
            </div>
          )}
        </div>
      </div>

      <div className="flex">
        <ActionButton 
          className="flex-1" 
          id="pay" 
          icon={HandCoins} 
          label={isVoided ? "Order Cancelled" : (isCompleted ? "Order Completed" : "Pay & Close")} 
          active={!isCompleted} 
          onClick={handlePaymentClick} 
          compact={false}
          disabled={isCompleted}
        />
        <ActionButton 
          className="flex-1" 
          id="save" 
          icon={Save} 
          label={isVoided ? "Cancelled" : (isCompleted ? "Completed" : "Save")} 
          onClick={handleSaveClick} 
          compact={false}
          disabled={isCompleted}
        />
      </div>
    </div>
  );
};

// Named export for backward compatibility
export { OrderSummary };

// Default export for React.lazy()
export default OrderSummary;

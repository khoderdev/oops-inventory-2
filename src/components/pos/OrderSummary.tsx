import { OrderSummaryProps } from "@/types/inventory";
import { formatCurrency } from "@/utils/conversionLogic";
import { HandCoins, Save } from "lucide-react";
import React from "react";
import { ActionButton } from "./ActionBar";

export const OrderSummary: React.FC<OrderSummaryProps> = ({ 
  cart, 
  subtotal, 
  total, 
  onPaymentClick, 
  onSaveClick, 
  orderStatus,
  isOrderCompleted 
}) => {
  if (!cart || cart.length === 0) {
    return null;
  }

  // Check if order is completed (paid status or explicitly marked as completed)
  const isCompleted = isOrderCompleted || orderStatus === 'paid' || orderStatus === 'served';
  
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
        <div className="border-t border-gray-300">
          <div className="flex justify-between font-bold text-lg">
            <span>TOTAL</span>
            <span>{formatCurrency(total)}</span>
          </div>
        </div>
      </div>

      <div className="flex">
        <ActionButton 
          className="flex-1" 
          id="pay" 
          icon={HandCoins} 
          label={isCompleted ? "Order Completed" : "Pay & Close"} 
          active={!isCompleted} 
          onClick={handlePaymentClick} 
          compact={false}
          disabled={isCompleted}
        />
        <ActionButton 
          className="flex-1" 
          id="save" 
          icon={Save} 
          label={isCompleted ? "Completed" : "Save"} 
          onClick={handleSaveClick} 
          compact={false}
          disabled={isCompleted}
        />
      </div>
    </div>
  );
};

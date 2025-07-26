import { Button } from "@/components/ui/button";
import { OrderSummaryProps } from "@/types/inventory";
import { formatCurrency } from "@/utils/conversionLogic";
import React from "react";

export const OrderSummary: React.FC<OrderSummaryProps> = ({ cart, subtotal, total, onPaymentClick, onSaveClick }) => {
  if (cart.length === 0) {
    return null;
  }

  return (
    <div className="border-t border-gray-200 p-4 bg-gray-50">
      <div className="space-y-2 text-sm">
        <div className="flex justify-between">
          <span>Sub Total</span>
          <span>{formatCurrency(subtotal)}</span>
        </div>
        <div className="border-t border-gray-300 pt-2 mt-2">
          <div className="flex justify-between font-bold text-lg">
            <span>TOTAL</span>
            <span>{formatCurrency(total)}</span>
          </div>
        </div>
      </div>

      <div className="flex space-x-2 mt-4">
        <Button variant="outline" className="flex-1" onClick={onSaveClick}>
          SAVE
        </Button>
        <Button className="flex-1 bg-teal-500 hover:bg-teal-600 text-white" onClick={onPaymentClick}>
          PAY {formatCurrency(total)}
        </Button>
      </div>
    </div>
  );
};

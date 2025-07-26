import { OrderSummaryProps } from "@/types/inventory";
import { formatCurrency } from "@/utils/conversionLogic";
import { HandCoins, Save } from "lucide-react";
import React from "react";
import { ActionButton } from "./ActionBar";

export const OrderSummary: React.FC<OrderSummaryProps> = ({ cart, subtotal, total, onPaymentClick, onSaveClick }) => {
  if (cart.length === 0) {
    return null;
  }

  return (
    <div className="border-t border-gray-200 pb-0 bg-gray-50">
      <div className="space-y-2 p-4 text-sm">
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

      <div className="flex">
        <ActionButton className="flex-1" id="save" icon={Save} label="Save" onClick={onSaveClick} compact={false} />
        <ActionButton className="flex-1" id="pay" icon={HandCoins} label={`Pay & Close`} active={true} onClick={onPaymentClick} compact={false} />
      </div>
    </div>
  );
};

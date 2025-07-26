import { Button } from "@/components/ui/button";
import { OrderItemsListProps } from "@/types/inventory";
import { formatCurrency } from "@/utils/conversionLogic";
import { Minus, Plus } from "lucide-react";
import React from "react";

export const OrderItemsList: React.FC<OrderItemsListProps> = ({ cart, updateCartQuantity }) => {
  return (
    <div className="flex-1 overflow-y-auto">
      {cart.length === 0 ? (
        <div className="p-4 text-center text-gray-500">
          <div className="text-sm font-medium mb-2">DELIVERY</div>
          <div className="text-xs text-gray-400">No items in cart</div>
        </div>
      ) : (
        <div className="p-4 space-y-3">
          <div className="text-sm font-medium text-gray-600 mb-3">DELIVERY</div>
          {cart.map(item => (
            <div key={item.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-b-0">
              <div className="flex-1">
                <div className="font-medium text-gray-800">{item.name}</div>
                {item.type === "material" && <div className="text-xs text-gray-500">Extra Powdered Seasoning</div>}
              </div>
              <div className="flex items-center space-x-3">
                <div className="flex items-center space-x-2">
                  <Button variant="outline" size="sm" onClick={() => updateCartQuantity(item.id, item.quantity - 1)} className="w-6 h-6 p-0">
                    <Minus className="w-3 h-3" />
                  </Button>
                  <span className="w-6 text-center text-sm font-medium">{item.quantity}</span>
                  <Button variant="outline" size="sm" onClick={() => updateCartQuantity(item.id, item.quantity + 1)} className="w-6 h-6 p-0">
                    <Plus className="w-3 h-3" />
                  </Button>
                </div>
                <div className="w-16 text-right font-medium text-gray-800">{formatCurrency(item.price * item.quantity)}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

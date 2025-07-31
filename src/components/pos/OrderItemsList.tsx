import { Button } from "@/components/ui/button";
import { getOrderTypeIcon, getOrderTypeLabel } from "@/constants/constants";
import { OrderItemsListProps } from "@/types/inventory";
import { OrderType } from "@/types/orders";
import { formatCurrency } from "@/utils/conversionLogic";
import { Minus, Plus } from "lucide-react";
import React from "react";

export const OrderItemsList: React.FC<OrderItemsListProps> = ({ cart, updateCartQuantity, orderType, selectedTable, onOrderTypeChange, onTableSelect, incompleteTableOrdersCount, orderStatus, isOrderCompleted }) => {
  const isCompleted = isOrderCompleted || orderStatus === "paid" || orderStatus === "served";

  const handleQuantityUpdate = (cartId: string, newQuantity: number) => {
    if (isCompleted) {
      console.log("Cannot update quantity - order is already completed:", {
        orderStatus,
        isOrderCompleted
      });
      return;
    }
    updateCartQuantity(cartId, newQuantity);
  };

  return (
    <div className="flex-1 flex flex-col h-full">
      <div className="flex-shrink-0 border-b border-gray-100 bg-white">
        <div className="grid grid-cols-3">
          {(["delivery", "takeaway", "table"] as OrderType[]).map(type => {
            // Only show badge for table orders
            let badgeCount = 0;
            if (type === "table" && incompleteTableOrdersCount) badgeCount = incompleteTableOrdersCount;

            return (
              <Button key={type} variant={orderType === type ? "default" : "outline"} size="sm" onClick={() => (type === "table" ? onTableSelect() : onOrderTypeChange(type))} className={`relative flex items-center justify-center h-8 rounded-none ${orderType === type ? "bg-teal-500 hover:bg-teal-600 text-white" : "hover:bg-gray-50"}`}>
                {getOrderTypeIcon(type)}
                <span className="text-xs font-medium mr-2">{getOrderTypeLabel(type, selectedTable)}</span>
                {badgeCount > 0 && <span className="bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-bold">{badgeCount > 99 ? "99+" : badgeCount}</span>}
              </Button>
            );
          })}
        </div>

        {/* Current Order Type Display */}
        <div className="my-2 flex items-center justify-center space-x-2 text-sm font-medium text-blue-600">
          {getOrderTypeIcon(orderType)}
          <span>{getOrderTypeLabel(orderType, selectedTable)}</span>
          {orderType === "table" && selectedTable && <span className="text-xs text-gray-500">({selectedTable.seats} seats)</span>}
        </div>
      </div>

      {/* Cart Items - Scrollable */}
      <div className="flex-1 overflow-y-auto">
        {!cart || cart.length === 0 ? (
          <div className="p-4 text-center text-gray-500">
            <div className="text-sm font-medium mb-2">{getOrderTypeLabel(orderType, selectedTable)}</div>
            <div className="text-xs text-gray-400">No items in cart</div>
          </div>
        ) : (
          <div className="p-4 space-y-3">
            {(cart || []).map(item => (
              <div key={item.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-b-0">
                <div className="flex-1">
                  <div className="font-medium text-gray-800">{item.name}</div>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="flex items-center space-x-2">
                    <Button variant="outline" size="sm" onClick={() => handleQuantityUpdate(item.id, item.quantity - 1)} className="w-6 h-6 p-0" disabled={isCompleted}>
                      <Minus className="w-3 h-3" />
                    </Button>
                    <span className="w-6 text-center text-sm font-medium">{item.quantity}</span>
                    <Button variant="outline" size="sm" onClick={() => handleQuantityUpdate(item.id, item.quantity + 1)} className="w-6 h-6 p-0" disabled={isCompleted}>
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
    </div>
  );
};

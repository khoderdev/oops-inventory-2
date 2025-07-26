import { Button } from "@/components/ui/button";
import { OrderItemsListProps, OrderType } from "@/types/inventory";
import { formatCurrency } from "@/utils/conversionLogic";
import { Car, Minus, Plus, ShoppingBag, Users } from "lucide-react";
import React from "react";

export const OrderItemsList: React.FC<OrderItemsListProps> = ({ cart, updateCartQuantity, orderType, selectedTable, onOrderTypeChange, onTableSelect }) => {
  const getOrderTypeIcon = (type: OrderType) => {
    switch (type) {
      case "delivery":
        return <Car className="w-4 h-4" />;
      case "takeaway":
        return <ShoppingBag className="w-4 h-4" />;
      case "table":
        return <Users className="w-4 h-4" />;
      default:
        return <ShoppingBag className="w-4 h-4" />;
    }
  };

  const getOrderTypeLabel = (type: OrderType) => {
    switch (type) {
      case "delivery":
        return "DELIVERY";
      case "takeaway":
        return "TAKE AWAY";
      case "table":
        return selectedTable ? `TABLE ${selectedTable.number}` : "SELECT TABLE";
      default:
        return "TAKE AWAY";
    }
  };
  return (
    <div className="flex-1 flex flex-col h-full">
      {/* Order Type Selector - Fixed */}
      <div className="flex-shrink-0 border-b border-gray-100 bg-white">
        <div className="grid grid-cols-3">
          {(["delivery", "takeaway", "table"] as OrderType[]).map(type => (
            <Button key={type} variant={orderType === type ? "default" : "outline"} size="sm" onClick={() => (type === "table" ? onTableSelect() : onOrderTypeChange(type))} className={`flex items-center justify-center h-8 rounded-none ${orderType === type ? "bg-blue-500 hover:bg-blue-600 text-white" : "hover:bg-gray-50"}`}>
              {getOrderTypeIcon(type)}
              <span className="text-xs font-medium">{type === "delivery" ? "DELIVERY" : type === "takeaway" ? "TAKE AWAY" : "TABLE"}</span>
            </Button>
          ))}
        </div>

        {/* Current Order Type Display */}
        <div className="my-2 flex items-center justify-center space-x-2 text-sm font-medium text-blue-600">
          {getOrderTypeIcon(orderType)}
          <span>{getOrderTypeLabel(orderType)}</span>
          {orderType === "table" && selectedTable && <span className="text-xs text-gray-500">({selectedTable.seats} seats)</span>}
        </div>
      </div>

      {/* Cart Items - Scrollable */}
      <div className="flex-1 overflow-y-auto">
        {cart.length === 0 ? (
          <div className="p-4 text-center text-gray-500">
            <div className="text-sm font-medium mb-2">{getOrderTypeLabel(orderType)}</div>
            <div className="text-xs text-gray-400">No items in cart</div>
          </div>
        ) : (
          <div className="p-4 space-y-3">
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
    </div>
  );
};

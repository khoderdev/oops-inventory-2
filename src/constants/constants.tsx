import { Table } from "@/types/inventory";
import { OrderStatus, OrderType } from "@/types/orders";
import { Car, Package, ShoppingBag, Truck, Users } from "lucide-react";

export const ORDER_STATUS_COLORS: Record<OrderStatus, string> = {
  draft: "bg-gray-100 text-gray-800",
  confirmed: "bg-blue-100 text-blue-800",
  preparing: "bg-yellow-100 text-yellow-800",
  ready: "bg-green-100 text-green-800",
  served: "bg-purple-100 text-purple-800",
  paid: "bg-emerald-100 text-emerald-800",
  cancelled: "bg-red-100 text-red-800"
};

export const ORDER_TYPE_ICONS: Record<OrderType, React.ReactNode> = {
  delivery: <Truck className="w-4 h-4" />,
  takeaway: <Package className="w-4 h-4" />,
  table: <ShoppingBag className="w-4 h-4" />
};

export const getOrderTypeIcon = (type: OrderType) => {
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

export const getOrderTypeLabel = (type: OrderType, selectedTable: Table | null) => {
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

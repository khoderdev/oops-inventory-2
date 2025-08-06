import { Employee } from "@/types/employee";
import { Table } from "@/types/inventory";
import { OrderStatus, OrderType } from "@/types/orders";
import { Bike, Package, Car,  UserCheck, Utensils, Wine } from "lucide-react";

export const ORDER_STATUS_COLORS: Record<OrderStatus, string> = {
  draft: "bg-gray-100 text-gray-800",
  confirmed: "bg-blue-100 text-blue-800",
  preparing: "bg-yellow-100 text-yellow-800",
  ready: "bg-green-100 text-green-800",
  served: "bg-purple-100 text-purple-800",
  paid: "bg-emerald-100 text-emerald-800",
  cancelled: "bg-red-100 text-red-800",
  complete: "bg-emerald-100 text-emerald-800"
};

export const ORDER_TYPE_ICONS: Record<OrderType, React.ReactNode> = {
  delivery: <Bike className="w-4 h-4" />,
  takeaway: <Package className="w-4 h-4" />,
  table: <Utensils className="w-4 h-4" />,
  employees: <UserCheck className="w-4 h-4" />,
  bar: <Wine className="w-4 h-4" />
};

export const getOrderTypeIcon = (type: OrderType) => {
  switch (type) {
    case "delivery":
      return <Bike className="w-4 h-4" />;
    case "takeaway":
      return <Car className="w-4 h-4" />;
    case "table":
      return <Utensils className="w-4 h-4" />;
    case "employees":
      return <UserCheck className="w-4 h-4" />;
    case "bar":
      return <Wine className="w-4 h-4" />;
    default:
      return <Car className="w-4 h-4" />;
  }
};

export const getOrderTypeLabel = (type: OrderType, selectedTable: Table | null | undefined, selectedEmployee?: Employee | null, discountReason?: string) => {
  switch (type) {
    case "delivery":
      return "DELIVERY";
    case "takeaway":
      return "TAKE AWAY";
    case "table":
      if (selectedTable) {
        // Check for name property first, then number, then id as fallback
        const tableWithName = selectedTable as Table & { name?: string };
        const tableName = tableWithName.name || (selectedTable.number !== undefined && selectedTable.number !== null ? selectedTable.number : null) || selectedTable.id;
        return `TABLE ${tableName}`;
      }
      return "TABLES";
    case "employees":
      if (selectedEmployee) {
        const fullName = `${selectedEmployee.user?.firstName || ""} ${selectedEmployee.user?.lastName || ""}`.trim();
        return fullName || selectedEmployee.employeeNumber;
      }

      // For existing orders without employeeId, try to extract employee name from discount reason
      if (discountReason && discountReason.includes("Employee discount -")) {
        // Extract employee name from "Employee discount - Mia Malkova (service)"
        const match = discountReason.match(/Employee discount - ([^(]+)/);
        if (match && match[1]) {
          return `STAFF ${match[1].trim()}`;
        }
      }

      return "STAFF";
    case "bar":
      return "BAR";
    default:
      return "TAKE AWAY";
  }
};

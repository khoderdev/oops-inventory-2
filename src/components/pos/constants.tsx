import { PERMISSIONS } from "@/types/auth";
import { Table } from "@/types/inventory";
import { LucideIcon, X, Printer, DollarSign, Package, ShoppingCart, Calculator, Grid3X3, Save } from "lucide-react";

export const getTableStatusColor = (status: Table["status"]) => {
  switch (status) {
    case "available":
      return "bg-green-100 border-green-300 hover:bg-green-200";
    case "opened":
      return "bg-red-100 border-red-300 hover:bg-red-200";
    case "reserved":
      return "bg-yellow-100 border-yellow-300 hover:bg-yellow-200";
    case "cleaning":
      return "bg-gray-100 border-gray-300 hover:bg-gray-200";
    default:
      return "bg-white border-gray-200";
  }
};

export const getTableShape = (shape: Table["shape"], seats: number) => {
  const baseClasses = "flex items-center justify-center cursor-pointer transition-all duration-200 border-2";
  switch (shape) {
    case "round":
      return `${baseClasses} rounded-full w-20 h-20`;
    case "square":
      return `${baseClasses} rounded-lg w-20 h-20`;
    case "rectangle":
      return `${baseClasses} rounded-lg w-24 h-16`;
    default:
      return `${baseClasses} rounded-lg w-20 h-20`;
  }
};

export const formatTime = (date: Date | string) => {
  try {
    const dateObj = typeof date === "string" ? new Date(date) : date;
    if (isNaN(dateObj.getTime())) {
      return "Invalid time";
    }
    return new Intl.DateTimeFormat("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true
    }).format(dateObj);
  } catch (error) {
    console.error("Error formatting time:", error);
    return "Invalid time";
  }
};

// Action button configuration interface
export interface ActionButtonConfig {
  id: string;
  icon: LucideIcon;
  label: string;
  active?: boolean;
  disabled?: boolean;
  onClick?: () => void;
  className?: string;
  compact?: boolean;
  requiredPermission?: string;
  requiredRole?: string | string[];
  badgeCount?: number;
  showIndicator?: boolean;
  indicatorColor?: string;
  title?: string;
}

// Default button configurations
export const defaultActionButtons: ActionButtonConfig[] = [
  { id: "void", icon: X, label: "Void", active: false, requiredPermission: PERMISSIONS.SALES_VOID },
  { id: "print", icon: Printer, label: "Print Receipt", active: false, requiredPermission: PERMISSIONS.POS_RECEIPTS },
  { id: "refund", icon: DollarSign, label: "Refund", active: false, requiredPermission: PERMISSIONS.SALES_REFUND },
  { id: "table-orders", icon: Package, label: "Table Orders", active: false, requiredPermission: PERMISSIONS.POS_TABLES },
  { id: "orders", icon: ShoppingCart, label: "Orders", active: false, requiredPermission: PERMISSIONS.ORDERS_READ },
  { id: "depts", icon: Calculator, label: "Depts", active: false },
  { id: "speed-key", icon: Grid3X3, label: "Speed Key", active: false },
  { id: "save", icon: Save, label: "Save Order", active: false, requiredPermission: PERMISSIONS.ORDERS_CREATE }
];

// Legacy props interface for backward compatibility
export interface LegacyActionBarProps {
  onSaveOrder?: () => void;
  onPrintReceipt?: () => void;
  onVoidOrder?: () => void;
  onShowOrders?: () => void;
  onShowReports?: () => void;
  hasUnsavedChanges?: boolean;
  isOrderLoading?: boolean;
  canPrintReceipt?: boolean;
  canVoidOrder?: boolean;
  onCancelOrder?: () => void;
  incompleteOrdersCount?: number;
  incompleteDeliveryTakeawayCount?: number;
  onDiscount?: () => void;
  onShowPrinterSettings?: () => void;
  hasSavedPrinter?: boolean;
  savedPrinterName?: string;
  isDayOpen?: boolean;
}

export interface FlexibleActionBarProps {
  buttons: ActionButtonConfig[];
  columns?: number;
  className?: string;
  isMobile?: boolean;
}

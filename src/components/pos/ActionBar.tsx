import { Button } from "@/components/ui/button";
import { usePermissions } from "@/hooks/usePermissions";
import { Calculator, DollarSign, FileText, Grid3X3, LucideIcon, Package, Printer, Save, Settings, ShoppingCart, Trash, X } from "lucide-react";
import React from "react";
import { PermissionWrapper } from "@/components/auth/PermissionWrapper";
import { PERMISSIONS } from "@/types/auth";

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
}

// Default button configurations
export const defaultActionButtons: ActionButtonConfig[] = [
  { id: "void", icon: X, label: "Void", active: false },
  { id: "print", icon: Printer, label: "Print Receipt", active: false },
  { id: "refund", icon: DollarSign, label: "Refund", active: false },
  { id: "table-orders", icon: Package, label: "Table Orders", active: false },
  { id: "orders", icon: ShoppingCart, label: "Orders", active: false },
  { id: "depts", icon: Calculator, label: "Depts", active: false },
  { id: "speed-key", icon: Grid3X3, label: "Speed Key", active: false },
  { id: "save", icon: Save, label: "Save Order", active: false }
];

// Legacy props interface for backward compatibility
interface LegacyActionBarProps {
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
}

// New flexible props interface
interface FlexibleActionBarProps {
  buttons: ActionButtonConfig[];
  columns?: number;
  className?: string;
}

// Combined props type
type ActionBarProps = LegacyActionBarProps | FlexibleActionBarProps;

// Type guard to check if props are legacy
function isLegacyProps(props: ActionBarProps): props is LegacyActionBarProps {
  return "onSaveOrder" in props || "onPrintReceipt" in props || !("buttons" in props);
}

// Individual Action Button Component
export const ActionButton: React.FC<ActionButtonConfig & { className?: string; compact?: boolean }> = ({ icon: IconComponent, label, active = false, disabled = false, onClick, className = "", compact = false, badgeCount }) => {
  const baseClasses = "flex flex-col items-center justify-center rounded-none select-none";
  const heightClass = compact ? "h-12 p-2" : "h-16 p-3";
  const activeClasses = active ? "bg-teal-500 text-white hover:text-white hover:bg-teal-600" : "";
  const iconSize = compact ? "w-4 h-4" : "!w-6 !h-6";
  const textSize = compact ? "text-xs" : "text-sm";
  const iconMargin = compact ? "" : "";

  return (
    <Button variant="outline" className={`${baseClasses} ${heightClass} ${activeClasses} ${className} relative`} onClick={onClick} disabled={disabled}>
      <IconComponent className={`${iconSize} ${iconMargin}`} />
      <span className={textSize}>{label}</span>
      {badgeCount && badgeCount > 0 && (
        <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1">
          {badgeCount > 99 ? '99+' : badgeCount}
        </span>
      )}
    </Button>
  );
};

// Main ActionBar Component
export const ActionBar: React.FC<ActionBarProps> = props => {
  const { user, hasPermission, hasRole } = usePermissions();
  let buttons: ActionButtonConfig[];
  let columns: number;
  let className: string;

  // Check if user has access to Back Office (Admin or Manager only)
  const canAccessBackOffice = hasRole(["admin", "manager"]);

  if (isLegacyProps(props)) {
    // Legacy mode - convert old props to new format
    const { onSaveOrder, onPrintReceipt, onVoidOrder, onShowOrders, onShowReports, hasUnsavedChanges = false, isOrderLoading = false, canPrintReceipt = false, canVoidOrder = false, onCancelOrder = () => {}, incompleteOrdersCount = 0, incompleteDeliveryTakeawayCount = 0 } = props;

    buttons = [
      {
        id: "print",
        icon: Printer,
        label: "Print Receipt",
        active: canPrintReceipt,
        onClick: onPrintReceipt,
        disabled: !canPrintReceipt || !onPrintReceipt
      },
      { id: "cancel", icon: X, label: "Cancel", active: false, onClick: onCancelOrder, disabled: !onCancelOrder },
      {
        id: "void",
        icon: Trash,
        label: "Void",
        active: canVoidOrder,
        onClick: onVoidOrder,
        disabled: !canVoidOrder || !onVoidOrder
      },
      { id: "refund", icon: DollarSign, label: "Refund", active: false },

      { id: "orders", icon: ShoppingCart, label: "Orders", active: false, onClick: onShowOrders, disabled: !onShowOrders, badgeCount: incompleteDeliveryTakeawayCount },
      { id: "reports", icon: FileText, label: "Reports", active: false, onClick: onShowReports },
      {
        id: "back-office",
        icon: Settings,
        label: "Back Office",
        active: false,
        disabled: !canAccessBackOffice,
        requiredRole: ["admin", "manager"],
        onClick: canAccessBackOffice ? () => window.location.href = "/" : undefined
      }
    ];
    columns = 7;
    className = "";
  } else {
    // New flexible mode
    buttons = props.buttons;
    columns = props.columns || Math.min(buttons.length, 8);
    className = props.className || "";
  }

  // Create grid style based on columns count
  const gridStyle = {
    display: "grid",
    gridTemplateColumns: `repeat(${columns}, 1fr)`
  };

  // Filter buttons based on permissions
  const visibleButtons = buttons.filter(button => {
    // Check permission requirement
    if (button.requiredPermission && !hasPermission(button.requiredPermission)) {
      return false;
    }
    
    // Check role requirement
    if (button.requiredRole && !hasRole(button.requiredRole)) {
      return false;
    }
    
    return true;
  });

  // Update columns based on visible buttons
  const actualColumns = isLegacyProps(props) ? Math.min(visibleButtons.length, 7) : (props.columns || Math.min(visibleButtons.length, 8));
  
  const actualGridStyle = {
    display: "grid",
    gridTemplateColumns: `repeat(${actualColumns}, 1fr)`
  };

  return (
    <div className={`border-t border-gray-200 bg-gray-50 ${className}`}>
      <div style={actualGridStyle}>
        {visibleButtons.map((button, index) => (
          <ActionButton key={button.id || index} {...button} />
        ))}
      </div>
    </div>
  );
};

// Utility function to create custom button configurations
export const createActionButton = (id: string, icon: LucideIcon, label: string, options: Partial<Omit<ActionButtonConfig, "id" | "icon" | "label">> = {}): ActionButtonConfig => ({
  id,
  icon,
  label,
  ...options
});

// Utility function to get default button by ID
export const getDefaultButton = (id: string): ActionButtonConfig | undefined => {
  return defaultActionButtons.find(button => button.id === id);
};

import { Button } from "@/components/ui/button";
import { Calculator, DollarSign, Grid3X3, LucideIcon, Package, Printer, Save, ShoppingCart, X } from "lucide-react";
import React from "react";

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
  hasUnsavedChanges?: boolean;
  isOrderLoading?: boolean;
  canPrintReceipt?: boolean;
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
export const ActionButton: React.FC<ActionButtonConfig & { className?: string; compact?: boolean }> = ({ icon: IconComponent, label, active = false, disabled = false, onClick, className = "", compact = false }) => {
  const baseClasses = "flex flex-col items-center justify-center rounded-none";
  const heightClass = compact ? "h-12 p-2" : "h-16 p-3";
  const activeClasses = active ? "bg-teal-500 text-white hover:text-white hover:bg-teal-600" : "";
  const iconSize = compact ? "w-4 h-4" : "!w-6 !h-6";
  const textSize = compact ? "text-xs" : "text-sm";
  const iconMargin = compact ? "" : "";

  return (
    <Button variant="outline" className={`${baseClasses} ${heightClass} ${activeClasses} ${className}`} onClick={onClick} disabled={disabled}>
      <IconComponent className={`${iconSize} ${iconMargin}`} />
      <span className={textSize}>{label}</span>
    </Button>
  );
};

// Main ActionBar Component
export const ActionBar: React.FC<ActionBarProps> = props => {
  let buttons: ActionButtonConfig[];
  let columns: number;
  let className: string;

  if (isLegacyProps(props)) {
    // Legacy mode - convert old props to new format
    const { onSaveOrder, onPrintReceipt, hasUnsavedChanges = false, isOrderLoading = false, canPrintReceipt = false } = props;

    buttons = [
      { id: "void", icon: X, label: "Void", active: false },
      {
        id: "print",
        icon: Printer,
        label: "Print Receipt",
        active: canPrintReceipt,
        onClick: onPrintReceipt,
        disabled: !canPrintReceipt || !onPrintReceipt
      },
      { id: "refund", icon: DollarSign, label: "Refund", active: false },
      { id: "table-orders", icon: Package, label: "Table Orders", active: false },
      { id: "orders", icon: ShoppingCart, label: "Orders", active: false },
      { id: "depts", icon: Calculator, label: "Depts", active: false },
      { id: "speed-key", icon: Grid3X3, label: "Speed Key", active: false },
      {
        id: "save",
        icon: Save,
        label: "Save Order",
        active: hasUnsavedChanges,
        onClick: onSaveOrder,
        disabled: isOrderLoading || !onSaveOrder
      }
    ];
    columns = 8;
    className = "";
  } else {
    // New flexible mode
    buttons = props.buttons;
    columns = props.columns || Math.min(buttons.length, 8);
    className = props.className || "";
  }

  return (
    <div className={`border-t border-gray-200 bg-gray-50 ${className}`}>
      <div className={`grid grid-cols-${columns}`}>
        {buttons.map((button, index) => (
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

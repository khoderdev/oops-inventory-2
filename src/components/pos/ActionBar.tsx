import { Button } from "@/components/ui/button";
import { AlertCircle, Calculator, DollarSign, Grid3X3, Package, Save, ShoppingCart, X } from "lucide-react";
import React from "react";

interface ActionBarProps {
  onSaveOrder?: () => void;
  hasUnsavedChanges?: boolean;
  isOrderLoading?: boolean;
}

export const ActionBar: React.FC<ActionBarProps> = ({ onSaveOrder, hasUnsavedChanges = false, isOrderLoading = false }) => {
  const actionButtons = [
    { icon: X, label: "Void", active: false },
    { icon: DollarSign, label: "Refund", active: false },
    { icon: Package, label: "Table Orders", active: false },
    { icon: ShoppingCart, label: "Orders", active: false },
    { icon: Calculator, label: "Depts", active: false },
    { icon: Grid3X3, label: "Speed Key", active: false },
    { icon: AlertCircle, label: "Hold", active: false },
    { icon: Save, label: "Save Order", active: hasUnsavedChanges, onClick: onSaveOrder, disabled: isOrderLoading || !onSaveOrder }
  ];

  return (
    <div className="border-t border-gray-200 bg-gray-50">
      <div className="grid grid-cols-8">
        {actionButtons.map((button, index) => {
          const IconComponent = button.icon;
          return (
            <Button key={index} variant="outline" className={`flex flex-col items-center p-3 h-16 rounded-none ${button.active ? "bg-teal-500 text-white hover:bg-teal-600" : ""}`} onClick={button.onClick} disabled={button.disabled}>
              <IconComponent className="w-5 h-5 mb-1" />
              <span className="text-xs">{button.label}</span>
            </Button>
          );
        })}
      </div>
    </div>
  );
};

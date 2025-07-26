import React from "react";
import { Button } from "@/components/ui/button";
import { 
  Grid3X3, 
  Calculator, 
  ShoppingCart, 
  Package, 
  AlertCircle, 
  X, 
  AlertTriangle, 
  DollarSign, 
  Receipt 
} from "lucide-react";

export const ActionBar: React.FC = () => {
  const actionButtons = [
    { icon: Grid3X3, label: "Speed Key", active: true },
    { icon: Calculator, label: "Depts", active: false },
    { icon: ShoppingCart, label: "Orders", active: false },
    { icon: Package, label: "Table Orders", active: false },
    { icon: AlertCircle, label: "Hold", active: false },
    { icon: X, label: "Void", active: false },
    { icon: AlertTriangle, label: "No Sales", active: false },
    { icon: DollarSign, label: "Refund", active: false },
    { icon: Receipt, label: "Price Check", active: false },
  ];

  return (
    <div className="border-t border-gray-200 bg-gray-50">
      <div className="grid grid-cols-9">
        {actionButtons.map((button, index) => {
          const IconComponent = button.icon;
          return (
            <Button 
              key={index}
              variant="outline" 
              className={`flex flex-col items-center p-3 h-16 rounded-none ${
                button.active 
                  ? "bg-teal-500 text-white hover:bg-teal-600" 
                  : ""
              }`}
            >
              <IconComponent className="w-5 h-5 mb-1" />
              <span className="text-xs">{button.label}</span>
            </Button>
          );
        })}
      </div>
    </div>
  );
};

import React from "react";
import { Package, UtensilsCrossed, GlassWater, HelpCircle } from "lucide-react";
import { Badge } from "../ui/badge";
import { CategoryType } from "@/types/categories";

// Type configuration for dynamic category types
export const TYPE_CONFIG: Record<CategoryType, {
  icon: React.ReactNode;
  label: string;
  badgeClass: string;
}> = {
  materials: {
    icon: <Package className="w-4 h-4" />,
    label: "Materials",
    badgeClass: "bg-blue-100 text-blue-800"
  },
  menu_items: {
    icon: <UtensilsCrossed className="w-4 h-4" />,
    label: "Menu Items", 
    badgeClass: "bg-green-100 text-green-800"
  },
  beverages: {
    icon: <GlassWater className="w-4 h-4" />,
    label: "Beverages",
    badgeClass: "bg-yellow-100 text-yellow-800"
  }
};

export const getTypeIcon = (type: string) => {
  const config = TYPE_CONFIG[type as CategoryType];
  return config?.icon || <HelpCircle className="w-4 h-4" />;
};

export const getTypeBadge = (type: string | string[]) => {
  // Handle null/undefined
  if (!type) {
    return (
      <Badge variant="secondary" className="bg-gray-100 text-gray-800">
        <HelpCircle className="w-3 h-3 mr-1" />
        Unknown
      </Badge>
    );
  }

  // Handle array of types
  if (Array.isArray(type)) {
    return (
      <div className="flex flex-wrap gap-1">
        {type.map((t, index) => (
          <span key={index}>{getTypeBadge(t)}</span>
        ))}
      </div>
    );
  }

  // Handle single type
  const config = TYPE_CONFIG[type as CategoryType];
  
  if (config) {
    return (
      <Badge variant="secondary" className={config.badgeClass}>
        {React.cloneElement(config.icon as React.ReactElement, { className: "w-3 h-3 mr-1" })}
        {config.label}
      </Badge>
    );
  }

  // Fallback for unknown types - add null check
  return (
    <Badge variant="secondary" className="bg-gray-100 text-gray-800">
      <HelpCircle className="w-3 h-3 mr-1" />
      {type && typeof type === 'string' ? type.charAt(0).toUpperCase() + type.slice(1).replace(/_/g, ' ') : 'Unknown'}
    </Badge>
  );
};

export const getTypeLabel = (type: string): string => {
  if (!type || typeof type !== 'string') {
    return 'Unknown';
  }
  const config = TYPE_CONFIG[type as CategoryType];
  return config?.label || type.charAt(0).toUpperCase() + type.slice(1).replace(/_/g, ' ');
};

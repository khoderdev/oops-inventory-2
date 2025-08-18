import { Package, UtensilsCrossed, GlassWater } from "lucide-react";
import { Badge } from "../ui/badge";

export const getTypeIcon = (type: string) => {
  switch (type) {
    case "materials":
      return <Package className="w-4 h-4" />;
    case "menu_items":
      return <UtensilsCrossed className="w-4 h-4" />;
    case "beverages":
      return <GlassWater className="w-4 h-4" />;
    default:
      return null;
  }
};

export const getTypeBadge = (type: string) => {
  switch (type) {
    case "materials":
      return (
        <Badge variant="secondary" className="bg-blue-100 text-blue-800">
          <Package className="w-3 h-3 mr-1" />
          Materials
        </Badge>
      );
    case "menu_items":
      return (
        <Badge variant="secondary" className="bg-green-100 text-green-800">
          <UtensilsCrossed className="w-3 h-3 mr-1" />
          Menu Items
        </Badge>
      );
    case "beverages":
      return (
        <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
          <GlassWater className="w-3 h-3 mr-1" />
          Beverages
        </Badge>
      );
    default:
      return (
        <Badge variant="secondary" className="bg-gray-100 text-gray-800">
          <UtensilsCrossed className="w-3 h-3 mr-1" />
          Unknown
        </Badge>
      );
  }
};

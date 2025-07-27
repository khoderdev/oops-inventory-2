import { Card, CardContent } from "@/components/ui/card";
import { ProductGridProps } from "@/types/inventory";
import { formatCurrency } from "@/utils/conversionLogic";
import { Package, ShoppingCart } from "lucide-react";
import React from "react";

export const ProductGrid: React.FC<ProductGridProps> = ({ posItems, onAddToCart }) => {
  return (
    <div className="flex-1 p-4 overflow-y-auto">
      <div className="grid gap-5 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 3xl:grid-cols-7">
        {/* Unified POS Items */}
        {posItems.map(item => (
          <Card key={item.id} className="cursor-pointer select-none transition-all hover:shadow-lg hover:scale-105 border-2 border-teal-200 hover:border-teal-300" onClick={() => onAddToCart(item)}>
            <CardContent className="p-4 text-center">
              <div className="w-10 h-10 mx-auto mb-3 bg-gray-100 rounded-lg flex items-center justify-center">
                {item.type === "menu_item" ? (
                  <ShoppingCart className="w-6 h-6 text-gray-400" />
                ) : (
                  <Package className="w-6 h-6 text-gray-400" />
                )}
              </div>
              <h4 className="font-medium text-gray-800 mb-1">{item.name}</h4>
              <p className="text-xs text-gray-500 mb-2">
                {item.availableQuantity} {item.unit} available
              </p>
              <p className="text-lg font-bold text-gray-800">
                {formatCurrency(item.price)}
              </p>
              {item.description && (
                <p className="text-xs text-gray-500 mt-1 truncate">{item.description}</p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

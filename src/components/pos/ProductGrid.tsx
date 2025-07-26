import { Card, CardContent } from "@/components/ui/card";
import { ProductGridProps } from "@/types/inventory";
import { formatCurrency } from "@/utils/conversionLogic";
import { Package, ShoppingCart } from "lucide-react";
import React from "react";

export const ProductGrid: React.FC<ProductGridProps> = ({ filteredItems, filteredMenuItems, onAddToCart }) => {
  return (
    <div className="flex-1 p-4 overflow-y-auto">
      <div className="grid gap-5 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 3xl:grid-cols-7">
        {/* Material Items */}
        {filteredItems.map(assignment => (
          <Card key={assignment.id} className="cursor-pointer transition-all hover:shadow-lg hover:scale-105 border-2 border-teal-200 hover:border-teal-300" onClick={() => onAddToCart(assignment, "material")}>
            <CardContent className="p-4 text-center">
              <div className="w-10 h-10 mx-auto mb-3 bg-gray-100 rounded-lg flex items-center justify-center">
                <Package className="w-6 h-6 text-gray-400" />
              </div>
              <h4 className="font-medium text-gray-800 mb-1">{assignment.material?.name}</h4>
              <p className="text-lg font-bold text-gray-800">
                {formatCurrency(
                  (() => {
                    const stockEntry = assignment.stockEntry as any;
                    if (!stockEntry) return 0;
                    if (stockEntry.costPerBaseUnit && stockEntry.costPerBaseUnit !== "0") {
                      return parseFloat(stockEntry.costPerBaseUnit);
                    }
                    if (stockEntry.totalCost && stockEntry.purchasedIndividualQuantity) {
                      return parseFloat(stockEntry.totalCost) / stockEntry.purchasedIndividualQuantity;
                    }
                    return 0;
                  })()
                )}
              </p>
            </CardContent>
          </Card>
        ))}

        {/* Menu Items */}
        {filteredMenuItems.map(menuItem => (
          <Card key={menuItem.id} className="cursor-pointer transition-all hover:shadow-lg hover:scale-105 border-2 border-teal-200 hover:border-teal-300" onClick={() => onAddToCart(menuItem, "menu")}>
            <CardContent className="p-4 text-center">
              <div className="w-10 h-10 mx-auto mb-3 bg-gray-100 rounded-lg flex items-center justify-center">
                <ShoppingCart className="w-6 h-6 text-gray-400" />
              </div>
              <h4 className="font-medium text-gray-800 mb-1">{menuItem.name}</h4>
              <p className="text-lg font-bold text-gray-800">{formatCurrency(menuItem.price || 0)}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

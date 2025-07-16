import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Material } from "@/types/inventory";
import { formatCurrency, formatNumber } from "@/utils/conversionLogic";
import { MATERIAL_CATEGORIES } from "../../types/inventory";

interface AnalyticsPanelProps {
  lowStockMaterials: Material[];
  materialsWithStock: Material[];
}

export function AnalyticsPanel({ lowStockMaterials, materialsWithStock }: AnalyticsPanelProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <Card>
        <CardHeader>
          <CardTitle>Low Stock Alert</CardTitle>
        </CardHeader>
        <CardContent>
          {lowStockMaterials.length === 0 ? (
            <p className="text-muted-foreground">All materials are well-stocked.</p>
          ) : (
            <div className="space-y-2">
              {lowStockMaterials.map(material => (
                <div key={material.id} className="flex justify-between items-center">
                  <span>{material.name}</span>
                  <Badge variant="destructive">
                    {formatNumber(material.totalQuantityInBaseUnit)} {material.baseUnit}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Inventory by Category</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {MATERIAL_CATEGORIES.map(category => {
              const categoryMaterials = materialsWithStock.filter(m => m.category === category.value);
              const categoryValue = categoryMaterials.reduce((sum, m) => sum + m.totalValue, 0);

              if (categoryValue === 0) return null;

              return (
                <div key={category.value} className="flex justify-between items-center">
                  <span>{category.label}</span>
                  <div className="text-right">
                    <div className="font-medium">{formatCurrency(categoryValue)}</div>
                    <div className="text-sm text-muted-foreground">{categoryMaterials.length} items</div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

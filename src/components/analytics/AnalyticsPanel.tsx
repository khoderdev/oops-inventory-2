import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MaterialWithStock } from "@/types/inventory";
import { formatCurrency, formatNumber } from "@/utils/conversionLogic";
import { getCategoriesByType } from "@/api/categories.api";
import { Category } from "@/types/categories";
import { useState, useEffect } from "react";

interface AnalyticsPanelProps {
  lowStockMaterials: MaterialWithStock[];
  materialsWithStock: MaterialWithStock[];
}

export function AnalyticsPanel({ lowStockMaterials, materialsWithStock }: AnalyticsPanelProps) {
  const [materialCategories, setMaterialCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await getCategoriesByType("materials", true);
        setMaterialCategories(response.totalItems);
      } catch (error) {
        console.error("Failed to fetch material categories:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchCategories();
  }, []);

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
          {loading ? (
            <div className="flex items-center justify-center py-4">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
            </div>
          ) : (
            <div className="space-y-2">
              {materialCategories.map(category => {
                const categoryMaterials = materialsWithStock.filter(m => {
                  // Handle different category formats based on backend data structure
                  const materialCategory = m.category as any;
                  
                  if (typeof materialCategory === 'string') {
                    return materialCategory === category.value;
                  } else if (typeof materialCategory === 'object' && materialCategory?.name) {
                    return materialCategory.name === category.name;
                  } else if (typeof materialCategory === 'number') {
                    return materialCategory === category.id;
                  }
                  return false;
                });
                const categoryValue = categoryMaterials.reduce((sum, m) => sum + m.totalValue, 0);

                if (categoryValue === 0) return null;

                return (
                  <div key={category.id} className="flex justify-between items-center">
                    <span>{category.name}</span>
                    <div className="text-right">
                      <div className="font-medium">{formatCurrency(categoryValue)}</div>
                      <div className="text-sm text-muted-foreground">{categoryMaterials.length} items</div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

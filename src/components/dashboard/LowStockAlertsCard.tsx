import React from "react";
import { Link } from "react-router-dom";
import { AlertTriangle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface Material {
  id: number;
  name: string;
  availableQuantity: number;
  baseUnit: string;
}

interface LowStockAlertsCardProps {
  lowStockMaterials: Material[];
  totalLowStock: number;
}

export const LowStockAlertsCard: React.FC<LowStockAlertsCardProps> = ({ 
  lowStockMaterials, 
  totalLowStock 
}) => {
  return (
    <Card className="border-l-4 border-l-red-500 rounded-2xl">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-red-500" />
          Low Stock Alerts
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {lowStockMaterials.map((material) => (
            <div key={material.id} className="flex items-center justify-between p-2 bg-red-50 rounded">
              <span className="text-sm font-medium">{material.name}</span>
              <Badge variant="destructive" className="text-xs">
                {material.availableQuantity} {material.baseUnit}
              </Badge>
            </div>
          ))}
          {totalLowStock > lowStockMaterials.length && (
            <Link to="/inventory">
              <Button variant="outline" size="sm" className="w-full mt-2">
                View All ({totalLowStock - lowStockMaterials.length} more)
              </Button>
            </Link>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default LowStockAlertsCard;

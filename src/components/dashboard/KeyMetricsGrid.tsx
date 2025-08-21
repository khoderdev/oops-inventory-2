import React from "react";
import { AlertTriangle, DollarSign, Utensils, Warehouse } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { formatCurrency } from "@/utils/dayOperationsFormattings";

interface DashboardStats {
  totalMaterials: number;
  totalStockEntries: number;
  totalMenuItems: number;
  lowStockItems: number;
  totalStockValue: number;
  totalEmployees: number;
  pendingOrders: number;
  todaysSales: number;
}

interface KeyMetricsGridProps {
  stats: DashboardStats;
}

export const KeyMetricsGrid: React.FC<KeyMetricsGridProps> = ({ stats }) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      <Card className="rounded-2xl">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Materials</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalMaterials}</p>
            </div>
            <Warehouse className="h-8 w-8 text-blue-500" />
          </div>
        </CardContent>
      </Card>

      <Card className="rounded-2xl">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Stock Value</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatCurrency(stats.totalStockValue)}
              </p>
            </div>
            <DollarSign className="h-8 w-8 text-green-500" />
          </div>
        </CardContent>
      </Card>

      <Card className="rounded-2xl">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Menu Items</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalMenuItems}</p>
            </div>
            <Utensils className="h-8 w-8 text-purple-500" />
          </div>
        </CardContent>
      </Card>

      {/* <Card className="rounded-2xl">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Low Stock</p>
              <p className="text-2xl font-bold text-gray-900">{stats.lowStockItems}</p>
            </div>
            <AlertTriangle className={`h-8 w-8 ${stats.lowStockItems > 0 ? 'text-red-500' : 'text-gray-400'}`} />
          </div>
        </CardContent>
      </Card> */}
    </div>
  );
};

export default KeyMetricsGrid;

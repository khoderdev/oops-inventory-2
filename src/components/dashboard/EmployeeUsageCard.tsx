import React from "react";
import { Link } from "react-router-dom";
import { TrendingUp, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/utils/dayOperationsFormattings";

interface UsageStats {
  totals?: {
    totalCount: number;
    totalCost: number;
  };
}

interface EmployeeUsageCardProps {
  usageStats: UsageStats;
}

export const EmployeeUsageCard: React.FC<EmployeeUsageCardProps> = ({ usageStats }) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-blue-500" />
          Employee Usage Today
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Total Records:</span>
            <span className="font-semibold">{usageStats.totals?.totalCount || 0}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Total Cost:</span>
            <span className="font-semibold text-red-600">
              {formatCurrency(usageStats.totals?.totalCost || 0)}
            </span>
          </div>
          <Link to="/employees/usage">
            <Button variant="outline" size="sm" className="w-full">
              View Details <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
};

export default EmployeeUsageCard;

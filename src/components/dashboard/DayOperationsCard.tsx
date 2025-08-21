import React from "react";
import { Link } from "react-router-dom";
import { AlertTriangle, Calendar, ChevronRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/utils/dayOperationsFormattings";

interface DayOperationsCardProps {
  loading: boolean;
  currentDay: any; // Replace with proper type when available
}

export const DayOperationsCard: React.FC<DayOperationsCardProps> = ({ loading, currentDay }) => {
  return (
    <Card className="border-l-4 border-l-blue-500 rounded-2xl">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Day Operations Status
          </CardTitle>
          <Link to="/day-operations">
            <Button variant="outline" size="sm">
              View Details <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </Link>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-1/3"></div>
          </div>
        ) : currentDay ? (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Status:</span>
              <Badge variant={currentDay.status === "opened" ? "default" : "secondary"}>
                {currentDay.status === "opened" ? "Day Open" : "Day Closed"}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Today's Sales:</span>
              <span className="font-semibold text-green-600">
                {formatCurrency(currentDay.totalSales || 0)}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Transactions:</span>
              <span className="font-semibold">{currentDay.totalTransactions || 0}</span>
            </div>
            {currentDay.status === "opened" && (
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Expected Cash:</span>
                <span className="font-semibold text-blue-600">
                  {formatCurrency(currentDay.expectedCash || 0)}
                </span>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-4">
            <AlertTriangle className="h-8 w-8 text-amber-500 mx-auto mb-2" />
            <p className="text-sm text-gray-600 mb-3">No active day operation</p>
            <Link to="/day-operations">
              <Button size="sm">Open Day</Button>
            </Link>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default DayOperationsCard;

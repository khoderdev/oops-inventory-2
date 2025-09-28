import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { AlertTriangle, Calendar, ChevronRight, RefreshCw } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/utils/dayOperationsFormattings";
import { useDayOperations } from "@/hooks/useDayOperations";
import { dayOperationsAPI } from "@/api/dayOperations.api";
import { DayOperation } from "@/types/inventory";

export const DayOperationsCard: React.FC = () => {
  const { refreshAll } = useDayOperations();
  const [localDay, setLocalDay] = useState<DayOperation | null>(null);
  const [localLoading, setLocalLoading] = useState(true);
  const [localError, setLocalError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const isDayOpen = localDay?.status === "opened";
  
  // Direct API call function to bypass context
  const fetchDayOperationDirect = async () => {
    try {
      setLocalLoading(true);
      setLocalError(null);
      const response = await dayOperationsAPI.getCurrentDayOperation();
      setLocalDay(response.currentDay);
      setLastUpdated(new Date());
      refreshAll();
    } catch (error) {
      console.error("❌ Direct API call failed:", error);
      setLocalError("Failed to fetch current day");
    } finally {
      setLocalLoading(false);
    }
  };
  
  // Initial fetch on mount
  useEffect(() => {
    fetchDayOperationDirect();
    const intervalId = setInterval(() => {
      fetchDayOperationDirect();
    }, 5000);
    
    return () => clearInterval(intervalId);
  }, []);
  
  // Manual refresh function for user-triggered updates
  const handleManualRefresh = () => {
    fetchDayOperationDirect();
  };

  return (
    <Card className="border-l-4 border-l-blue-500 rounded-2xl">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Day Operations Status
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={handleManualRefresh} 
              disabled={localLoading}
              title="Refresh data"
            >
              <RefreshCw className={`h-4 w-4 ${localLoading ? 'animate-spin' : ''}`} />
            </Button>
            <Link to="/day-operations">
              <Button variant="outline" size="sm">
                View All <ChevronRight className="ml-1 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
        {lastUpdated && (
          <p className="text-xs text-muted-foreground mt-1">
            Last updated: {lastUpdated.toLocaleTimeString()}
          </p>
        )}
      </CardHeader>
      <CardContent>
        {localLoading && !localDay ? (
          <div className="flex items-center justify-center py-6">
            <p className="text-muted-foreground">Loading...</p>
          </div>
        ) : localDay ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Status</p>
                <div className="flex items-center gap-2 mt-1">
                  <Badge
                    variant={isDayOpen ? "default" : "destructive"}
                    className={`${isDayOpen ? "bg-green-500" : "bg-red-500"} hover:${isDayOpen ? "bg-green-600" : "bg-red-600"}`}
                  >
                    {localDay.status === "opened" ? "Open" : "Closed"}
                  </Badge>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm font-medium">Total Sales</p>
                <p className="text-2xl font-bold">{formatCurrency(localDay.totalSales || 0)}</p>
              </div>
            </div>

            <div className="space-y-1">
              <p className="text-sm font-medium">Transactions</p>
              <p className="text-xl">{localDay.totalTransactions || 0}</p>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center py-6">
            <div className="flex items-center gap-2 text-amber-500">
              <AlertTriangle className="h-5 w-5" />
              <p>{localError || "No day operation found"}</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default DayOperationsCard;

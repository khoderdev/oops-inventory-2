import React, { useEffect } from "react";
import { useDayOperations } from "@/hooks/useDayOperations";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, AlertCircle, CheckCircle2 } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { format } from "date-fns";

interface DayOperationsStatusProps {
  onOpenDay?: () => void;
  onCloseDay?: () => void;
  autoRefresh?: boolean;
  refreshInterval?: number;
}

export const DayOperationsStatus: React.FC<DayOperationsStatusProps> = ({ onOpenDay, onCloseDay, autoRefresh = true, refreshInterval = 30000 }) => {
  const { currentDay, currentDayLoading, currentDayError, isDayOpen, isDayClosed, hasActiveDay, actionError, actionSuccess, clearError, clearSuccess, refreshCurrentDay } = useDayOperations(autoRefresh, refreshInterval);

  // Clear messages after 5 seconds
  useEffect(() => {
    if (actionError || actionSuccess) {
      const timer = setTimeout(() => {
        if (actionError) clearError();
        if (actionSuccess) clearSuccess();
      }, 5000);

      return () => clearTimeout(timer);
    }
  }, [actionError, actionSuccess, clearError, clearSuccess]);

  const handleRefresh = () => {
    refreshCurrentDay();
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Day Operations Status</CardTitle>
        <CardDescription>Current day operation status and controls</CardDescription>
      </CardHeader>

      <CardContent>
        {currentDayLoading ? (
          <div className="flex items-center justify-center py-6">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <span className="ml-2">Loading day status...</span>
          </div>
        ) : currentDayError ? (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{currentDayError}</AlertDescription>
          </Alert>
        ) : (
          <>
            {actionError && (
              <Alert variant="destructive" className="mb-4">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{actionError}</AlertDescription>
              </Alert>
            )}

            {actionSuccess && (
              <Alert variant="default" className="mb-4 bg-green-50 text-green-800 border-green-200">
                <CheckCircle2 className="h-4 w-4" />
                <AlertTitle>Success</AlertTitle>
                <AlertDescription>{actionSuccess}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="font-medium">Status:</span>
                {hasActiveDay ? <span className={`font-bold ${isDayOpen ? "text-green-600" : "text-red-600"}`}>{isDayOpen ? "OPEN" : "CLOSED"}</span> : <span className="font-bold text-gray-500">No active day</span>}
              </div>

              {currentDay && (
                <>
                  <div className="flex items-center justify-between">
                    <span>{currentDay.date}</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="font-medium">Opened At:</span>
                    <span>
                      {currentDay.openedAt 
                        ? format(new Date(currentDay.openedAt), 'h:mm a')
                        : 'N/A'}
                    </span>
                  </div>
                  
                  {isDayClosed && currentDay.closedAt && (
                    <div className="flex items-center justify-between">
                      <span className="font-medium">Closed At:</span>
                      <span>{format(new Date(currentDay.closedAt), 'h:mm a')}</span>
                    </div>
                  )}

                  <div className="flex items-center justify-between">
                    <span className="font-medium">Opening cash:</span>
                    <span>${currentDay.openingCash?.toFixed(2) || '0.00'}</span>
                  </div>

                  {isDayClosed && currentDay.closingCash !== undefined && (
                    <div className="flex items-center justify-between">
                      <span className="font-medium">Closing Cash:</span>
                      <span>${currentDay.closingCash.toFixed(2)}</span>
                    </div>
                  )}
                </>
              )}
            </div>
          </>
        )}
      </CardContent>

      <CardFooter className="flex justify-between">
        <Button variant="outline" onClick={handleRefresh} disabled={currentDayLoading}>
          {currentDayLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Refreshing...
            </>
          ) : (
            "Refresh"
          )}
        </Button>

        <div className="space-x-2">
          <Button variant="default" onClick={onOpenDay} disabled={currentDayLoading || isDayOpen}>
            Open Day
          </Button>

          <Button variant="destructive" onClick={onCloseDay} disabled={currentDayLoading || !isDayOpen}>
            Close Day
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
};

export default DayOperationsStatus;

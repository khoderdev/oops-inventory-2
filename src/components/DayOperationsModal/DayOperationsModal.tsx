import * as React from "react";
import { useCallback, useState, useEffect, useRef } from "react";
import { Dialog, DialogContent, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { DayOperationsFormData } from "@/types/dayOperations";
import { useDayOperations } from "@/hooks/useDayOperations";
import { useDailyReports } from "@/hooks/useDailyReports";
import { useAuth } from "@/contexts/AuthContext";
import { formatCurrency as defaultFormatCurrency } from "@/utils/dayOperationsFormattings";
import { toast } from "@/components/ui/use-toast";
import { OpenDayRequest, CloseDayRequest } from "@/types/inventory";

// Simplified modal props interface - only UI control props remain
interface DayOperationsModalProps {
  open?: boolean;
  isOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  onClose?: () => void;
  type: "open" | "close";
}

const DayOperationsModal: React.FC<DayOperationsModalProps> = ({ open, isOpen, onOpenChange, onClose, type }) => {
  // Get data and actions from hooks
  const { currentDay, userOrderStats, openDay, closeDay, actionLoading, actionSuccess, refreshCurrentDay } = useDayOperations();

  // Get daily reports functionality
  const { handleViewReport, setShowReportModal } = useDailyReports();

  // Get authenticated user information
  const { user } = useAuth();

  const isOpenType = type === "open";
  const isModalOpen = open !== undefined ? open : isOpen;

  // Track if we're showing optimistic UI
  const [optimisticSuccess, setOptimisticSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const backgroundProcessingRef = useRef(false);
  const reportShownRef = useRef(false); // Track if report has been shown already

  // Local form state
  const [formData, setFormData] = useState<DayOperationsFormData>({
    openingCash: 0,
    closingCash: 0,
    openedBy: "",
    closedBy: "",
    notes: ""
  });

  const [cashValue, setCashValue] = useState("");
  const [isSubmitted, setIsSubmitted] = useState(false);

  const loadingText = isOpenType ? "Opening..." : "Closing...";
  const submitText = isOpenType ? "Open Day" : "Close Day";

  // Pre-load form data for faster rendering
  const formDataRef = useRef<DayOperationsFormData>({
    openingCash: 0,
    closingCash: 0,
    openedBy: "",
    closedBy: "",
    notes: ""
  });

  // Initialize form data based on type and user - optimized to run only once
  useEffect(() => {
    // Prepare data immediately for fast rendering
    const initialData = {
      openingCash: isOpenType ? 0 : undefined,
      closingCash: !isOpenType ? 0 : undefined,
      openedBy: isOpenType ? user?.fullName || "" : undefined,
      closedBy: !isOpenType ? user?.fullName || "" : undefined,
      notes: ""
    };

    formDataRef.current = initialData;
    setFormData(initialData);
    setCashValue(isOpenType ? "0" : "0");
    setIsSubmitted(false);
    setOptimisticSuccess(false);
    setIsSubmitting(false);
    backgroundProcessingRef.current = false;
    reportShownRef.current = false; // Reset report shown flag when modal opens or type changes
  }, [type, isOpenType, user]);

  // Optimistic UI update - close modal immediately on submit
  useEffect(() => {
    if (optimisticSuccess) {
      // Close modal immediately for better UX
      if (onOpenChange) {
        onOpenChange(false);
      } else if (onClose) {
        onClose();
      }

      // If we just closed a day and have a date, show the report
      // Only proceed if we haven't shown the report yet (prevents infinite loop)
      if (!isOpenType && currentDay?.date && !reportShownRef.current) {
        // Mark that we're showing the report to prevent loops
        reportShownRef.current = true;
        
        // Small delay to ensure the modal is closed first and data is refreshed
        setTimeout(() => {
          console.log("🔄 Triggering daily report after day close");
          // Format date string properly for the API
          const dateString = new Date(currentDay.date).toISOString().split("T")[0];
          
          // Single refresh before showing report
          refreshCurrentDay()
            .then(() => {
              console.log("✅ Current day refreshed, generating report for", dateString);
              // Generate and show the report
              handleViewReport(dateString);
              setShowReportModal(true);
            })
            .catch(error => {
              console.error("❌ Error refreshing day data:", error);
              // Try to show report anyway
              handleViewReport(dateString);
              setShowReportModal(true);
            });
        }, 300); // Increased to ensure backend has time to process
      }
    }
  }, [optimisticSuccess, onOpenChange, onClose, isOpenType, currentDay, handleViewReport, setShowReportModal, refreshCurrentDay]);

  // Background processing monitor
  useEffect(() => {
    // If we've submitted the form and the action was successful
    if (isSubmitted && actionSuccess && !actionLoading && backgroundProcessingRef.current) {
      // Background processing completed successfully
      console.log("✅ Background processing completed successfully");
      backgroundProcessingRef.current = false;
      setIsSubmitted(false);
    }
  }, [isSubmitted, actionSuccess, actionLoading]);

  const handleOpenChange = useCallback(
    (open: boolean) => {
      // Don't allow closing during submission
      if (isSubmitting) return;

      if (onOpenChange) {
        onOpenChange(open);
      } else if (!open && onClose) {
        onClose();
      }
    },
    [onOpenChange, onClose, isSubmitting]
  );

  const handleCashChange = useCallback(
    (value: string) => {
      setCashValue(value);
      setFormData(prev => ({
        ...prev,
        ...(isOpenType ? { openingCash: value ? parseFloat(value) : 0 } : { closingCash: value ? parseFloat(value) : 0 })
      }));
    },
    [isOpenType]
  );

  const handleStaffChange = useCallback(
    (value: string) => {
      setFormData(prev => ({
        ...prev,
        ...(isOpenType ? { openedBy: value } : { closedBy: value })
      }));
    },
    [isOpenType]
  );

  const handleNotesChange = useCallback((value: string) => {
    setFormData(prev => ({
      ...prev,
      notes: value
    }));
  }, []);

  const handleUseExpectedCash = useCallback(() => {
    if (currentDay?.expectedCash) {
      const value = currentDay.expectedCash.toString();
      setCashValue(value);
      setFormData(prev => ({
        ...prev,
        ...(isOpenType ? { openingCash: parseFloat(value) } : { closingCash: parseFloat(value) })
      }));
    }
  }, [currentDay, isOpenType]);

  const handleSubmit = useCallback(() => {
    // Prevent multiple submissions
    if (isSubmitting) return;

    setIsSubmitting(true);

    // Make sure we have a valid user ID
    const userId = user?.id;

    // Check if user ID is valid before proceeding
    if (!userId) {
      console.error("Cannot submit day operation: No valid user ID found");
      toast({
        title: "Authentication Error",
        description: "You must be logged in with a valid user account to perform this action.",
        variant: "destructive"
      });
      setIsSubmitting(false);
      return;
    }

    // Show optimistic success immediately
    setOptimisticSuccess(true);

    // Process in background
    backgroundProcessingRef.current = true;
    setIsSubmitted(true);

    // Use setTimeout to move API call to next tick for smoother UI
    setTimeout(() => {
      // Process in background without blocking UI
      if (isOpenType) {
        // Create properly typed data object for opening day
        const openDayData: OpenDayRequest = {
          openingCash: formData.openingCash || 0,
          openedBy: formData.openedBy || user?.fullName || "",
          notes: formData.notes || "",
          userId: userId
        };
        
        openDay(openDayData)
          .catch(error => {
            console.error("Error opening day:", error);
            toast({
              title: "Error Opening Day",
              description: "The operation completed but there was an issue with the server. Please check the day status.",
              variant: "destructive"
            });
          })
          .finally(() => {
            setIsSubmitting(false);
          });
      } else {
        // Create properly typed data object for closing day
        const closeDayData: CloseDayRequest = {
          closingCash: formData.closingCash || 0,
          closedBy: formData.closedBy || user?.fullName || "",
          notes: formData.notes || "",
          userId: userId
        };
        
        console.log("📊 Closing day with data:", closeDayData);
        
        closeDay(closeDayData)
          .then(() => {
            console.log("✅ Day closed successfully, report will be generated automatically");
            // The optimistic UI effect will handle showing the report
          })
          .catch(error => {
            console.error("❌ Error closing day:", error);
            toast({
              title: "Error Closing Day",
              description: "The operation completed but there was an issue with the server. Please check the day status.",
              variant: "destructive"
            });
          })
          .finally(() => {
            setIsSubmitting(false);
          });
      }
    }, 10);
  }, [formData, isOpenType, openDay, closeDay, user, isSubmitting]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === "Enter" && e.target instanceof HTMLInputElement) {
      e.preventDefault();
    }
  }, []);

  const handleNotesKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" && e.ctrlKey && !isSubmitting) {
        e.preventDefault();
        handleSubmit();
      }
    },
    [handleSubmit, isSubmitting]
  );

  // Memoized format currency function
  const formatCurrency = useCallback((amount: number) => {
    return defaultFormatCurrency(amount);
  }, []);

  return (
    <Dialog open={isModalOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md" onKeyDown={handleKeyDown}>
        <DialogTitle>{isOpenType ? "Open Day" : "Close Day"}</DialogTitle>
        <div className="space-y-2">
          <Label htmlFor="cash-amount">{isOpenType ? "Opening cash Amount" : "Actual Closing cash Amount *"}</Label>
          {!isOpenType && (
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
              <Input
                id="cash-amount"
                type="number"
                step="0.01"
                value={cashValue}
                onChange={e => handleCashChange(e.target.value)}
                onKeyDown={e => {
                  if (e.key === "Enter" && !isSubmitting) {
                    e.preventDefault();
                    handleSubmit();
                  }
                }}
                placeholder="0.00"
                required={!isOpenType}
                autoFocus
                className="flex-1"
              />
              <Button type="button" variant="outline" onClick={handleUseExpectedCash} className="bg-blue-100 text-blue-700 border-blue-200 hover:bg-blue-200 hover:text-blue-800 whitespace-nowrap" title="Click to use expected cash amount" disabled={!currentDay?.expectedCash}>
                Expected: {formatCurrency(currentDay?.expectedCash || 0)}
              </Button>
            </div>
          )}

          {!isOpenType && userOrderStats && userOrderStats.length > 0 && (
            <div className="space-y-2">
              <Label>User Order Statistics</Label>
              <div className="bg-gray-50 p-3 rounded-md border border-gray-200 max-h-48 overflow-y-auto">
                <table className="w-full text-sm">
                  <thead className="text-xs text-gray-700 uppercase bg-gray-100">
                    <tr>
                      <th className="px-2 py-1 text-left">Staff</th>
                      <th className="px-2 py-1 text-right">Orders</th>
                      <th className="px-2 py-1 text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {userOrderStats.map((stat, index) => (
                      <tr key={index} className="border-t border-gray-200">
                        <td className="px-2 py-1 font-medium">{stat.userName}</td>
                        <td className="px-2 py-1 text-right">{stat.orderCount}</td>
                        <td className="px-2 py-1 text-right">{formatCurrency(stat.totalAmount)}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="font-medium border-t border-gray-300 bg-gray-50">
                    <tr>
                      <td className="px-2 py-1">Total</td>
                      <td className="px-2 py-1 text-right">{userOrderStats.reduce((sum, stat) => sum + stat.orderCount, 0)}</td>
                      <td className="px-2 py-1 text-right">{formatCurrency(userOrderStats.reduce((sum, stat) => sum + stat.totalAmount, 0))}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="notes">{isOpenType ? "Notes (Optional)" : "Closing Notes (Optional)"}</Label>
            <Textarea id="notes" value={formData.notes || ""} onChange={e => handleNotesChange(e.target.value)} onKeyDown={handleNotesKeyDown} rows={3} placeholder={isOpenType ? "Any opening notes... (Ctrl+Enter to submit)" : "Any closing notes..."} />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => handleOpenChange(false)} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting || !user?.id} variant={isOpenType ? "default" : "destructive"}>
            {isSubmitting ? loadingText : submitText}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default DayOperationsModal;

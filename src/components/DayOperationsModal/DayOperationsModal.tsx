import * as React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { DayOperationsFormData, DayOperationsModalProps } from "@/types/dayOperations";

const DayOperationsModal: React.FC<DayOperationsModalProps> = ({
  open,
  isOpen,
  onOpenChange,
  onClose,
  onSubmit,
  type,
  formData,
  onFormChange,
  onChange,
  isLoading = false,
  currentDay,
  expectedCash,
  userOrderStats,
  formatCurrency = amount => {
    const numAmount = typeof amount === "number" ? amount : 0;
    return `$${numAmount.toFixed(2)}`;
  }
}) => {
  const isModalOpen = open ?? isOpen ?? false;
  const handleOpenChange = (state: boolean) => {
    if (onOpenChange) onOpenChange(state);
    if (!state && onClose) onClose();
  };

  const handleFormChange = (data: DayOperationsFormData) => {
    if (onFormChange) onFormChange(data);
    if (onChange) onChange(data);
  };

  const effectiveCurrentDay =
    currentDay ??
    (expectedCash !== undefined || userOrderStats !== undefined
      ? {
          expectedCash: expectedCash,
          userOrderStats: userOrderStats
        }
      : null);
  const isOpenType = type === "open";
  const title = isOpenType ? "Open New Day" : "Close Current Day";
  const submitText = isOpenType ? "Open Day" : "Close Day";
  const loadingText = isOpenType ? "Opening..." : "Closing...";

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !isLoading) {
      e.preventDefault();
      onSubmit();
    } else if (e.key === "Escape") {
      e.preventDefault();
      handleOpenChange(false);
    }
  };

  const handleCashChange = (value: string) => {
    const numValue = parseFloat(value) || 0;
    if (isOpenType) {
      handleFormChange({ ...formData, openingCash: numValue });
    } else {
      handleFormChange({ ...formData, closingCash: numValue });
    }
  };

  const handleStaffChange = (value: string) => {
    if (isOpenType) {
      handleFormChange({ ...formData, openedBy: value });
    } else {
      handleFormChange({ ...formData, closedBy: value });
    }
  };

  const handleNotesChange = (value: string) => {
    handleFormChange({ ...formData, notes: value });
  };

  const handleNotesKeyDown = (e: React.KeyboardEvent) => {
    if (isOpenType && e.key === "Enter" && e.ctrlKey && !isLoading) {
      e.preventDefault();
      onSubmit();
    }
  };

  const handleUseExpectedCash = () => {
    if (effectiveCurrentDay?.expectedCash !== undefined) {
      handleFormChange({ ...formData, closingCash: effectiveCurrentDay.expectedCash });
    }
  };

  const cashValue = isOpenType ? formData.openingCash || 0 : formData.closingCash || 0;
  const staffValue = isOpenType ? formData.openedBy || "" : formData.closedBy || "";

  return (
    <Dialog open={isModalOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md" onKeyDown={handleKeyDown}>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="cash-amount">{isOpenType ? "Opening Cash Amount" : "Actual Closing Cash Amount *"}</Label>

            {!isOpenType && effectiveCurrentDay ? (
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                <Input
                  id="cash-amount"
                  type="number"
                  step="0.01"
                  value={cashValue}
                  onChange={e => handleCashChange(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === "Enter" && !isLoading) {
                      e.preventDefault();
                      onSubmit();
                    }
                  }}
                  placeholder="0.00"
                  required={!isOpenType}
                  autoFocus
                  className="flex-1"
                />
                <Button type="button" variant="outline" onClick={handleUseExpectedCash} className="bg-blue-100 text-blue-700 border-blue-200 hover:bg-blue-200 hover:text-blue-800 whitespace-nowrap" title="Click to use expected cash amount">
                  Expected: {formatCurrency(effectiveCurrentDay.expectedCash || 0)}
                </Button>
              </div>
            ) : (
              <Input
                id="cash-amount"
                type="number"
                step="0.01"
                value={cashValue}
                onChange={e => handleCashChange(e.target.value)}
                onKeyDown={e => {
                  if (e.key === "Enter" && !isLoading) {
                    e.preventDefault();
                    onSubmit();
                  }
                }}
                placeholder="0.00"
                autoFocus
              />
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="staff-name">{isOpenType ? "Opened By" : "Closed By"}</Label>
            <Input id="staff-name" type="text" value={staffValue} onChange={e => handleStaffChange(e.target.value)} className="bg-gray-50" placeholder="Staff name" readOnly />
            <p className="text-xs text-muted-foreground">Automatically detected from logged-in user</p>
          </div>

          {!isOpenType && effectiveCurrentDay?.userOrderStats && effectiveCurrentDay.userOrderStats.length > 0 && (
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
                    {effectiveCurrentDay.userOrderStats.map((stat, index) => (
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
                      <td className="px-2 py-1 text-right">{effectiveCurrentDay.userOrderStats.reduce((sum, stat) => sum + stat.orderCount, 0)}</td>
                      <td className="px-2 py-1 text-right">{formatCurrency(effectiveCurrentDay.userOrderStats.reduce((sum, stat) => sum + stat.totalAmount, 0))}</td>
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
          <Button variant="outline" onClick={() => handleOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={onSubmit} disabled={isLoading} variant={isOpenType ? "default" : "destructive"}>
            {isLoading ? loadingText : submitText}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default DayOperationsModal;

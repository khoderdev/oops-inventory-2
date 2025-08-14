import * as React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { Banknote, Calendar } from "lucide-react";

export interface DayOperationsFormData {
  openingCash?: number;
  closingCash?: number;
  openedBy?: string;
  closedBy?: string;
  notes?: string;
}

export interface DayOperationsModalProps {
  // Support both naming patterns
  open?: boolean;
  isOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  onClose?: () => void;
  onSubmit: () => void;
  type: "open" | "close";
  formData: DayOperationsFormData;
  onFormChange?: (data: DayOperationsFormData) => void;
  onChange?: (data: DayOperationsFormData) => void;
  isLoading?: boolean;
  currentDay?: {
    expectedCash?: number;
  } | null;
  expectedCash?: number;
  formatCurrency?: (amount: number) => string;
}

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
  formatCurrency = amount => {
    // Handle undefined, null, or non-numeric values
    const numAmount = typeof amount === 'number' ? amount : 0;
    return `$${numAmount.toFixed(2)}`;
  }
}) => {
  // Handle both naming patterns
  const isModalOpen = open ?? isOpen ?? false;
  const handleOpenChange = (state: boolean) => {
    if (onOpenChange) onOpenChange(state);
    if (!state && onClose) onClose();
  };
  
  const handleFormChange = (data: DayOperationsFormData) => {
    if (onFormChange) onFormChange(data);
    if (onChange) onChange(data);
  };
  
  // Use expectedCash if currentDay is not provided
  const effectiveCurrentDay = currentDay ?? (expectedCash !== undefined ? { expectedCash } : null);
  const isOpenType = type === "open";
  const title = isOpenType ? "Open New Day" : "Close Current Day";
  const submitText = isOpenType ? "Open Day" : "Close Day";
  const loadingText = isOpenType ? "Opening..." : "Closing...";

  // Event handlers
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

  // Computed values
  const cashValue = isOpenType ? formData.openingCash || 0 : formData.closingCash || 0;
  const staffValue = isOpenType ? formData.openedBy || "" : formData.closedBy || "";

  return (
    <Dialog open={isModalOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md" onKeyDown={handleKeyDown}>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Cash Amount Field */}
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

          {/* Staff Field */}
          <div className="space-y-2">
            <Label htmlFor="staff-name">{isOpenType ? "Opened By" : "Closed By"}</Label>
            <Input id="staff-name" type="text" value={staffValue} onChange={e => handleStaffChange(e.target.value)} className="bg-gray-50" placeholder="Staff name" readOnly />
            <p className="text-xs text-muted-foreground">Automatically detected from logged-in user</p>
          </div>

          {/* Notes Field */}
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

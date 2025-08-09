import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { POSCartItem } from "@/types/inventory";
import { FileText } from "lucide-react";
import React, { useEffect, useState } from "react";

interface ItemNotesDialogProps {
  isOpen: boolean;
  onClose: () => void;
  item: POSCartItem | null;
  onNotesChange: (itemId: string, notes: string) => void;
}

export const ItemNotesDialog: React.FC<ItemNotesDialogProps> = ({ 
  isOpen, 
  onClose, 
  item, 
  onNotesChange 
}) => {
  const [localNotes, setLocalNotes] = useState("");


  // Reset local notes whenever the dialog opens or item changes
  useEffect(() => {
    if (isOpen && item) {
      // Force reset the notes to the current item's notes
      const newNotes = item.notes || "";
      setLocalNotes(newNotes);
    }
  }, [isOpen, item?.id]);

  // Clear notes when dialog closes
  useEffect(() => {
    if (!isOpen) {
      setLocalNotes("");
    }
  }, [isOpen]);

  const handleSave = () => {
    if (item) {
      onNotesChange(item.id, localNotes);
    }
    onClose();
  };

  const handleCancel = () => {
    if (item) {
      setLocalNotes(item.notes || ""); // Reset to original notes
    }
    onClose();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      // Enter to save (Shift+Enter for new line)
      e.preventDefault();
      handleSave();
    } else if (e.key === "Escape") {
      // Escape to cancel
      e.preventDefault();
      handleCancel();
    }
  };

  if (!item) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogTitle className="flex items-center space-x-2 text-lg font-semibold mb-4">
          <FileText className="w-5 h-5" />
          <span>Item Notes</span>
        </DialogTitle>
        <DialogDescription className="sr-only">
          Add or edit special instructions and notes for this order item
        </DialogDescription>

        <div className="space-y-4">
          {/* Item Information */}
          <div className="p-3 bg-gray-50 rounded-lg border">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium text-gray-900">{item.name}</h3>
                <p className="text-sm text-gray-600">Quantity: {item.quantity}</p>
              </div>
              <div className="text-right">
                <p className="font-medium text-gray-900">${(item.price * item.quantity).toFixed(2)}</p>
                <p className="text-sm text-gray-600">${item.price.toFixed(2)} each</p>
              </div>
            </div>
          </div>

          {/* Notes Input */}
          <div>
            <label htmlFor="item-notes" className="block text-sm font-medium text-gray-700 mb-2">
              Special instructions for kitchen/sections:
            </label>
            <Textarea 
              id="item-notes"
              placeholder="Enter special instructions (e.g., 'without onions', 'extra spicy', 'well done')..."
              value={localNotes}
              onChange={e => setLocalNotes(e.target.value)}
              onKeyDown={handleKeyDown}
              className="min-h-[100px] resize-none"
              // Note: Removed autoFocus to prevent aria-hidden conflicts with Radix UI Dialog
              // Users can manually click/tab to the textarea when ready
              // This is more accessible as it doesn't force unexpected focus changes
            />
            <p className="text-xs text-gray-500 mt-1">
              Enter to save, Shift+Enter for new line, Esc to cancel
            </p>
          </div>

          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={handleCancel}>
              Cancel
            </Button>
            <Button onClick={handleSave}>
              Save Notes
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

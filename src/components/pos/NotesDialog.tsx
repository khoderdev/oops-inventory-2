import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { FileText } from "lucide-react";
import React, { useEffect, useState } from "react";

interface NotesDialogProps {
  isOpen: boolean;
  onClose: () => void;
  notes: string;
  onNotesChange: (notes: string) => void;
}

export const NotesDialog: React.FC<NotesDialogProps> = ({ isOpen, onClose, notes, onNotesChange }) => {
  const [localNotes, setLocalNotes] = useState(notes);

  // Update local notes when props change
  useEffect(() => {
    setLocalNotes(notes);
  }, [notes]);

  const handleSave = () => {
    onNotesChange(localNotes);
    onClose();
  };

  const handleCancel = () => {
    setLocalNotes(notes); // Reset to original notes
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

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <FileText className="w-5 h-5" />
            <span>Order Notes</span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-2">
              Add notes (remarks) for this order:
            </label>
            <Textarea id="notes" placeholder="Enter any special instructions or notes for this order... (Enter to save, Shift+Enter for new line, Esc to cancel)" value={localNotes} onChange={e => setLocalNotes(e.target.value)} onKeyDown={handleKeyDown} className="min-h-[120px] resize-none" autoFocus />
          </div>

          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={handleCancel}>
              Cancel
            </Button>
            <Button onClick={handleSave}>Save Notes</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

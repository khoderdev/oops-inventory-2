import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Trash2, RefreshCw } from "lucide-react";
import { Table } from "@/types/inventory";

export interface DeleteTableModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirmDelete: () => void;
  table: Table | null;
  isDeleting: boolean;
}

export const DeleteTableModal: React.FC<DeleteTableModalProps> = ({
  isOpen,
  onClose,
  onConfirmDelete,
  table,
  isDeleting
}) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-red-600">
            <Trash2 className="w-5 h-5" />
            Delete Table
          </DialogTitle>
        </DialogHeader>

        <div className="py-4">
          <p className="text-gray-700 mb-4">
            Are you sure you want to permanently delete{" "}
            <span className="font-semibold">
              Table {table?.number}
              {table?.name && ` (${table.name})`}
            </span>
            ?
          </p>
        </div>

        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isDeleting}
          >
            Cancel
          </Button>
          <Button 
            variant="destructive" 
            onClick={onConfirmDelete} 
            disabled={isDeleting} 
            className="bg-red-600 hover:bg-red-700"
          >
            {isDeleting ? (
              <>
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                Deleting...
              </>
            ) : (
              <>
                <Trash2 className="w-4 h-4 mr-2" />
                Delete
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

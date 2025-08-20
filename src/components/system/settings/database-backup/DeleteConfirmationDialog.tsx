import { AlertCircle, Trash2 } from "lucide-react";
import React from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { backupAPI } from "@/api/backup.api";
import { DeleteConfirmationDialogProps } from "@/types/backup-scheduler";

const DeleteConfirmationDialog: React.FC<DeleteConfirmationDialogProps> = ({ open, onOpenChange, backup, onConfirm }) => {
  const handleConfirm = () => {
    onConfirm();
    onOpenChange(false);
  };
  if (!backup) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Delete Backup</DialogTitle>
          <DialogDescription>Are you sure you want to delete this backup? This action cannot be undone.</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>This will permanently delete the backup "{backup.name}" and all its formats.</AlertDescription>
          </Alert>

          <div className="bg-muted p-3 rounded">
            <p className="text-sm font-medium mb-2">Backup Details:</p>
            <div className="text-xs space-y-1">
              <p>
                <span className="font-medium">Name:</span> {backup.name}
              </p>
              <p>
                <span className="font-medium">Created:</span> {backupAPI.formatDate(backup.createdAt)}
              </p>
              <p>
                <span className="font-medium">Size:</span> {backupAPI.formatFileSize(backup.totalSize)}
              </p>
              <p>
                <span className="font-medium">Formats:</span> {backup.formats.map(f => f.type.toUpperCase()).join(", ")}
              </p>
            </div>
          </div>

          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleConfirm}>
              <Trash2 className="mr-2 h-4 w-4" />
              Delete Backup
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default DeleteConfirmationDialog;

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Trash2, Settings } from "lucide-react";
import { useMediaQuery } from "@/hooks/use-media-query";

export interface BulkAction {
  id: string;
  label: string;
  icon?: React.ReactNode;
  onClick: () => void;
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";
  requiresConfirmation?: boolean;
  confirmationTitle?: string;
  confirmationDescription?: string;
  confirmationActionText?: string;
}

export interface BulkEditDialogProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description: string;
  children: React.ReactNode;
  onSubmit: () => void;
  isLoading?: boolean;
  submitText?: string;
  cancelText?: string;
}

export interface BulkSelectionToolbarProps<T> {
  selectedItems: Set<T>;
  totalItems: number;
  selectionLabel?: string;
  onSelectAll?: (checked: boolean) => void;
  onClearSelection?: () => void;
  bulkActions?: BulkAction[];
  bulkEditDialog?: {
    isOpen: boolean;
    onOpen: () => void;
    onClose: () => void;
    title: string;
    description: string;
    children: React.ReactNode;
    onSubmit: () => void;
    isLoading?: boolean;
    submitText?: string;
    cancelText?: string;
  };
  className?: string;
  position?: "top" | "bottom" | "inline";
  showSelectAll?: boolean;
}

export function BulkEditDialog({
  isOpen,
  onClose,
  title,
  description,
  children,
  onSubmit,
  isLoading = false,
  submitText = "Update",
  cancelText = "Cancel"
}: BulkEditDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          {children}
        </div>
        
        <DialogFooter>
          <Button 
            type="button" 
            variant="outline" 
            onClick={onClose}
            disabled={isLoading}
          >
            {cancelText}
          </Button>
          <Button 
            type="button" 
            onClick={onSubmit}
            disabled={isLoading}
          >
            {isLoading ? "Processing..." : submitText}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function BulkSelectionToolbar<T>({
  selectedItems,
  totalItems,
  selectionLabel = "item",
  onSelectAll,
  onClearSelection,
  bulkActions = [],
  bulkEditDialog,
  className = "",
  position = "top",
  showSelectAll = true
}: BulkSelectionToolbarProps<T>) {
  const isMobile = useMediaQuery("(max-width: 600px)");
  const selectedCount = selectedItems.size;
  const allSelected = totalItems > 0 && selectedCount === totalItems;
  const someSelected = selectedCount > 0 && selectedCount < totalItems;
  const hasSelection = selectedCount > 0;
  
  // Determine positioning classes based on position prop
  const positionClasses = {
    top: "mb-4",
    bottom: "mt-4",
    inline: ""
  };
  
  // If no items are selected and no select all option, don't render the toolbar
  if (!hasSelection && !showSelectAll) {
    return null;
  }
  
  return (
    <div className={`flex items-center justify-between gap-2 px-2 py-2 bg-white rounded-lg border ${positionClasses[position]} ${className}`}>
      {showSelectAll && (
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={allSelected}
            ref={el => {
              if (el) el.indeterminate = someSelected;
            }}
            onChange={e => onSelectAll?.(e.target.checked)}
            className="w-4 h-4"
          />
          <span className="text-sm font-medium">
            {hasSelection 
              ? `${selectedCount} ${selectedCount === 1 ? selectionLabel : `${selectionLabel}s`} selected` 
              : `Select all ${selectionLabel}s`}
          </span>
        </div>
      )}
      
      {!showSelectAll && hasSelection && (
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">
            {`${selectedCount} ${selectedCount === 1 ? selectionLabel : `${selectionLabel}s`} selected`}
          </span>
        </div>
      )}
      
      {hasSelection && (
        <div className="flex gap-2">
          {bulkEditDialog && (
            <Button 
              variant="outline" 
              size={isMobile ? "sm" : "default"} 
              onClick={bulkEditDialog.onOpen}
            >
              <Settings className={`${isMobile ? "h-4 w-4" : "h-5 w-5"} mr-1`} />
              Edit ({selectedCount})
            </Button>
          )}
          
          {bulkActions.map(action => (
            action.requiresConfirmation ? (
              <AlertDialog key={action.id}>
                <AlertDialogTrigger asChild>
                  <Button 
                    variant={action.variant || "default"} 
                    size={isMobile ? "sm" : "default"}
                  >
                    {action.icon && (
                      <span className={`${isMobile ? "h-4 w-4" : "h-5 w-5"} mr-1`}>
                        {action.icon}
                      </span>
                    )}
                    {action.label} ({selectedCount})
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>{action.confirmationTitle || "Confirm Action"}</AlertDialogTitle>
                    <AlertDialogDescription>
                      {action.confirmationDescription || `Are you sure you want to perform this action on ${selectedCount} ${selectedCount === 1 ? selectionLabel : `${selectionLabel}s`}?`}
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction 
                      onClick={action.onClick} 
                      className={action.variant === "destructive" ? "bg-red-600 hover:bg-red-700" : ""}
                    >
                      {action.confirmationActionText || "Continue"}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            ) : (
              <Button 
                key={action.id}
                variant={action.variant || "default"} 
                size={isMobile ? "sm" : "default"}
                onClick={action.onClick}
              >
                {action.icon && (
                  <span className={`${isMobile ? "h-4 w-4" : "h-5 w-5"} mr-1`}>
                    {action.icon}
                  </span>
                )}
                {action.label} ({selectedCount})
              </Button>
            )
          ))}
          
          {onClearSelection && (
            <Button 
              variant="ghost" 
              size={isMobile ? "sm" : "default"}
              onClick={onClearSelection}
            >
              Clear
            </Button>
          )}
        </div>
      )}
    </div>
  );
}

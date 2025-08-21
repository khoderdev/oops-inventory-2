import { menuAPI } from "@/api/menu.api.ts.tsx";
import { printersAPI } from "@/api/printers.api";
import { stockAPI } from "@/api/stock.api.ts.tsx";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/components/ui/use-toast";
import { MenuItem, Printer, StockEntryWithMaterial, StockEntry } from "@/types/inventory";
import { Loader2, Printer as PrinterIcon, X } from "lucide-react";
import React, { useEffect, useState } from "react";

interface BulkPrinterAssignmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedItems: Set<string>;
  itemType: "stock" | "menu";
  onAssignmentChange?: (updated?: StockEntry[]) => void;
  onBulkAssign?: (ids: (string | number)[], printerId: number | null) => Promise<StockEntry[] | void>;
}

export const BulkPrinterAssignmentDialog: React.FC<BulkPrinterAssignmentDialogProps> = ({
  open,
  onOpenChange,
  selectedItems,
  itemType,
  onAssignmentChange,
  onBulkAssign
}) => {
  const [printers, setPrinters] = useState<Printer[]>([]);
  const [selectedPrinterId, setSelectedPrinterId] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Fetch printers when dialog opens
  useEffect(() => {
    if (open) {
      const fetchPrinters = async () => {
        try {
          setIsLoading(true);
          const response = await printersAPI.getPrinters();
          // Handle the API response format: { success: true, printers: [...] }
          const printersData = response.printers || [];
          // Ensure we always have an array
          setPrinters(Array.isArray(printersData) ? printersData : []);
        } catch (error) {
          console.error("Error fetching printers:", error);
          toast({
            title: "Error",
            description: "Failed to load printers",
            variant: "destructive"
          });
          // Ensure printers is always an array even on error
          setPrinters([]);
        } finally {
          setIsLoading(false);
        }
      };

      fetchPrinters();
    }
  }, [open]);

  // Reset form when dialog opens/closes
  useEffect(() => {
    if (open) {
      setSelectedPrinterId("");
    }
  }, [open]);

  const handleAssignPrinter = async () => {
    if (selectedItems.size === 0) return;

    try {
      setIsSaving(true);
      const itemIds = Array.from(selectedItems);
      const printerId = selectedPrinterId === "none" ? null : parseInt(selectedPrinterId);

      let updatedEntries: StockEntry[] | undefined;
      if (itemType === "stock") {
        if (onBulkAssign) {
          const res = await onBulkAssign(itemIds, printerId);
          updatedEntries = res as StockEntry[] | undefined;
        } else {
          const res: any = await stockAPI.bulkAssignPrinter(itemIds, printerId);
          updatedEntries = res?.data?.stockEntries || res?.stockEntries;
        }
      } else {
        await menuAPI.bulkAssignPrinter(itemIds, printerId);
      }

      toast({
        title: "Success",
        description: `Printer ${printerId ? "assigned to" : "removed from"} ${selectedItems.size} ${itemType === "stock" ? "stock entries" : "menu items"}`,
        variant: "default"
      });

      onAssignmentChange?.(updatedEntries);
      onOpenChange(false);
    } catch (error) {
      console.error("Error assigning printer:", error);
      toast({
        title: "Error",
        description: "Failed to assign printer",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleRemovePrinter = async () => {
    if (selectedItems.size === 0) return;

    try {
      setIsSaving(true);
      const itemIds = Array.from(selectedItems);

      let updatedEntries: StockEntry[] | undefined;
      if (itemType === "stock") {
        if (onBulkAssign) {
          const res = await onBulkAssign(itemIds, null);
          updatedEntries = res as StockEntry[] | undefined;
        } else {
          const res: any = await stockAPI.bulkAssignPrinter(itemIds, null);
          updatedEntries = res?.data?.stockEntries || res?.stockEntries;
        }
      } else {
        await menuAPI.bulkAssignPrinter(itemIds, null);
      }

      toast({
        title: "Success",
        description: `Printer removed from ${selectedItems.size} ${itemType === "stock" ? "stock entries" : "menu items"}`,
        variant: "default"
      });

      onAssignmentChange?.(updatedEntries);
      onOpenChange(false);
    } catch (error) {
      console.error("Error removing printer:", error);
      toast({
        title: "Error",
        description: "Failed to remove printer",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <PrinterIcon className="h-5 w-5" />
            Bulk Assign Printer
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="text-sm text-muted-foreground">
            Assign a printer to {selectedItems.size} selected {itemType === "stock" ? "stock entries" : "menu items"}
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="h-6 w-6 animate-spin" />
              <span className="ml-2">Loading printers...</span>
            </div>
          ) : (
            <div className="space-y-2">
              <label htmlFor="printer-select" className="text-sm font-medium">
                Select Printer
              </label>
              <Select value={selectedPrinterId} onValueChange={setSelectedPrinterId}>
                <SelectTrigger id="printer-select">
                  <SelectValue placeholder="Choose a printer" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No printer assigned</SelectItem>
                  {Array.isArray(printers) && printers.map((printer) => (
                    <SelectItem key={printer.id} value={printer.id.toString()}>
                      <div className="flex items-center justify-between w-full">
                        <span>{printer.name}</span>
                        <span className={`ml-2 px-2 py-1 rounded-full text-xs ${
                          printer.status === "online" 
                            ? "bg-green-100 text-green-800" 
                            : "bg-red-100 text-red-800"
                        }`}>
                          {printer.status}
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-4">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSaving}
            >
              Cancel
            </Button>
            <Button
              variant="outline"
              onClick={handleRemovePrinter}
              disabled={isSaving || selectedItems.size === 0}
            >
              {isSaving ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <X className="h-4 w-4 mr-2" />
              )}
              Remove Printer
            </Button>
            <Button
              onClick={handleAssignPrinter}
              disabled={isSaving || !selectedPrinterId || selectedItems.size === 0}
            >
              {isSaving ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <PrinterIcon className="h-4 w-4 mr-2" />
              )}
              Assign Printer
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

import { menuAPI } from "@/api/menu.api.ts.tsx";
import { printersAPI } from "@/api/printers.api.ts";
import { stockAPI } from "@/api/stock.api.ts.tsx";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { MenuItem, StockEntryWithMaterial, StockEntry } from "@/types/inventory";
import { Printer } from "@/types/printer";
import { Loader2, Printer as PrinterIcon, X } from "lucide-react";
import React, { useEffect, useState } from "react";

interface PrinterAssignmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item: StockEntryWithMaterial | MenuItem | null;
  itemType: "stock" | "menu";
  onAssignmentChange?: (updated?: StockEntry) => void;
  onAssign?: (id: string | number, printerId: number | null) => Promise<StockEntry | void>;
}

export const PrinterAssignmentDialog: React.FC<PrinterAssignmentDialogProps> = ({ open, onOpenChange, item, itemType, onAssignmentChange, onAssign }) => {
  const [printers, setPrinters] = useState<Printer[]>([]);
  const [selectedPrinterId, setSelectedPrinterId] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  // Load printers on component mount
  useEffect(() => {
    const fetchPrinters = async () => {
      try {
        setIsLoading(true);
        const response = await printersAPI.getPrinters();
        // Handle the API response format: { success: true, printers: [...] }
        const printersData = response.printers || [];
        // Ensure we always have an array
        setPrinters(Array.isArray(printersData) ? printersData : []);
      } catch (error) {
        console.error("Failed to fetch printers:", error);
        // Set empty array on error to prevent map error
        setPrinters([]);
        toast({
          title: "Error",
          description: "Failed to load printers",
          variant: "destructive"
        });
      } finally {
        setIsLoading(false);
      }
    };

    if (open) {
      fetchPrinters();
    }
  }, [open, toast]);

  // Set initial selected printer when item changes
  useEffect(() => {
    if (item?.printerId) {
      setSelectedPrinterId(item.printerId.toString());
    } else {
      setSelectedPrinterId("none");
    }
  }, [item]);

  const handleAssignPrinter = async () => {
    if (!item) return;

    try {
      setIsSaving(true);
      const printerId = selectedPrinterId && selectedPrinterId !== "none" ? parseInt(selectedPrinterId) : null;

      if (itemType === "stock") {
        let updated: StockEntry | undefined;
        if (onAssign) {
          const res = await onAssign(item.id, printerId);
          updated = res as StockEntry | undefined;
        } else {
          const res: any = await stockAPI.assignPrinter(item.id, printerId);
          updated = res?.data?.stockEntry || res?.stockEntry;
        }
        toast({
          title: "Success",
          description: `Printer ${printerId ? "assigned to" : "removed from"} stock entry`
        });
        // Pass updated stock entry back for optimistic UI update
        onAssignmentChange?.(updated);
      } else {
        await menuAPI.assignPrinter(item.id, printerId);
        toast({
          title: "Success",
          description: `Printer ${printerId ? "assigned to" : "removed from"} menu item`
        });
        onAssignmentChange?.();
      }

      onOpenChange(false);
    } catch (error) {
      console.error("Failed to assign printer:", error);
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
    setSelectedPrinterId("none");
  };

  const getItemName = () => {
    if (!item) return "";
    if (itemType === "stock") {
      const stockItem = item as StockEntryWithMaterial;
      return stockItem.material?.name || "Unknown Item";
    } else {
      const menuItem = item as MenuItem;
      return menuItem.name || "Unknown Item";
    }
  };

  const getCurrentPrinter = () => {
    if (!item?.assignedPrinter) return null;
    return item.assignedPrinter;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <PrinterIcon className="h-5 w-5" />
            Assign Printer
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-gray-700">Item</label>
            <p className="text-sm text-gray-600">{getItemName()}</p>
          </div>

          {getCurrentPrinter() && (
            <div>
              <label className="text-sm font-medium text-gray-700">Current Assignment</label>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="secondary" className="flex items-center gap-1">
                  <PrinterIcon className="h-3 w-3" />
                  {getCurrentPrinter()?.name}
                </Badge>
                <Button variant="ghost" size="sm" onClick={handleRemovePrinter} className="h-6 w-6 p-0">
                  <X className="h-3 w-3" />
                </Button>
              </div>
            </div>
          )}

          <div>
            <label className="text-sm font-medium text-gray-700">Select Printer</label>
            {isLoading ? (
              <div className="flex items-center justify-center p-4">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="ml-2 text-sm text-gray-500">Loading printers...</span>
              </div>
            ) : (
              <Select value={selectedPrinterId} onValueChange={setSelectedPrinterId}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select a printer (optional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No printer assigned</SelectItem>
                  {Array.isArray(printers) && printers.map(printer => (
                    <SelectItem key={printer.id} value={printer.id.toString()}>
                      <div className="flex items-center gap-2">
                        <PrinterIcon className="h-4 w-4" />
                        <span>{printer.name}</span>
                        <Badge variant="outline" className="text-xs">
                          {printer.type}
                        </Badge>
                        {printer.status === "offline" && (
                          <Badge variant="destructive" className="text-xs">
                            Offline
                          </Badge>
                        )}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          {selectedPrinterId && selectedPrinterId !== "none" && (
            <div className="bg-blue-50 p-3 rounded-md">
              <p className="text-sm text-blue-800">When this item is ordered, it will be printed on the selected printer.</p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleAssignPrinter} disabled={isSaving}>
            {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {selectedPrinterId && selectedPrinterId !== "none" ? "Assign Printer" : "Remove Assignment"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

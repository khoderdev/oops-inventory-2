import React, { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { printerAPI } from "../../api/printer.api";
import type { Printer } from "../../types/printer";
import { AlertCircle, Bluetooth, Cable, Check, Power, Printer as PrinterIcon, Settings, Usb, Wifi } from "lucide-react";

interface PrinterSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPrinterSelect: (printer: Printer) => void;
  context: "payment" | "manual_print";
  selectedPrinter?: Printer | null;
  onShowSettings?: () => void;
}

export const PrinterSelectorModal: React.FC<PrinterSelectorModalProps> = ({
  isOpen,
  onClose,
  onPrinterSelect,
  context,
  selectedPrinter,
  onShowSettings
}) => {
  const [printers, setPrinters] = useState<Printer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [testingPrinter, setTestingPrinter] = useState<number | null>(null);

  // Connection type icons
  const getConnectionIcon = (connectionType: string) => {
    switch (connectionType) {
      case "network":
        return <Wifi className="w-4 h-4" />;
      case "usb":
        return <Usb className="w-4 h-4" />;
      case "bluetooth":
        return <Bluetooth className="w-4 h-4" />;
      case "serial":
        return <Cable className="w-4 h-4" />;
      default:
        return <PrinterIcon className="w-4 h-4" />;
    }
  };

  // Status badge
  const getStatusBadge = (printer: Printer) => {
    const statusConfig = {
      online: { color: "bg-green-100 text-green-800", text: "Online" },
      offline: { color: "bg-gray-100 text-gray-800", text: "Offline" },
      error: { color: "bg-red-100 text-red-800", text: "Error" },
      printing: { color: "bg-blue-100 text-blue-800", text: "Printing" }
    };

    const config = statusConfig[printer.status as keyof typeof statusConfig] || statusConfig.offline;
    return <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${config.color}`}>{config.text}</span>;
  };

  // Load printers
  const loadPrinters = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await printerAPI.getPrinters();
      let filteredPrinters = response.printers || [];

      // Filter active printers only
      filteredPrinters = filteredPrinters.filter(p => p.isActive);

      setPrinters(filteredPrinters);
    } catch (err: any) {
      setError(err.message || "Failed to load printers");
      console.error("Error loading printers:", err);
    } finally {
      setLoading(false);
    }
  };

  // Test printer
  const handleTestPrinter = async (printerId: number, event: React.MouseEvent) => {
    event.stopPropagation();

    try {
      setTestingPrinter(printerId);
      await printerAPI.printTestPage(printerId);
    } catch (err: any) {
      console.error("Test print failed:", err);
    } finally {
      setTestingPrinter(null);
    }
  };

  // Handle printer selection
  const handlePrinterSelect = (printer: Printer) => {
    onPrinterSelect(printer);
    onClose();
  };

  // Load printers when modal opens
  useEffect(() => {
    if (isOpen) {
      loadPrinters();
    }
  }, [isOpen]);

  const getContextTitle = () => {
    switch (context) {
      case "payment":
        return "Select Printer for Receipt";
      case "manual_print":
        return "Select Printer for Manual Print";
      default:
        return "Select Printer";
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            {getContextTitle()}
            {onShowSettings && (
              <Button
                variant="outline"
                size="sm"
                onClick={onShowSettings}
                className="ml-2"
              >
                <Settings className="w-4 h-4 mr-1" />
                Settings
              </Button>
            )}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {loading && (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-2">Loading printers...</span>
            </div>
          )}

          {error && (
            <div className="flex items-center p-4 bg-red-50 border border-red-200 rounded-lg">
              <AlertCircle className="w-4 h-4 text-red-500 mr-2" />
              <span className="text-red-700">{error}</span>
            </div>
          )}

          {!loading && !error && printers.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <PrinterIcon className="w-12 h-12 mx-auto mb-2 text-gray-300" />
              <p>No active printers found</p>
            </div>
          )}

          {!loading && !error && printers.length > 0 && (
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {printers.map((printer) => (
                <div
                  key={printer.id}
                  className={`flex items-center justify-between p-3 border rounded-lg cursor-pointer transition-colors ${
                    selectedPrinter?.id === printer.id
                      ? "border-blue-500 bg-blue-50"
                      : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                  }`}
                  onClick={() => handlePrinterSelect(printer)}
                >
                  <div className="flex items-center space-x-3">
                    <div className="flex items-center space-x-2">
                      {getConnectionIcon(printer.connectionType)}
                      <span className="font-medium">{printer.name}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      {getStatusBadge(printer)}
                      <Badge variant="outline" className="text-xs">
                        {printer.type}
                      </Badge>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    {selectedPrinter?.id === printer.id && (
                      <Check className="w-4 h-4 text-blue-600" />
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={(e) => handleTestPrinter(printer.id, e)}
                      disabled={testingPrinter === printer.id}
                      className="text-xs"
                    >
                      {testingPrinter === printer.id ? (
                        <div className="animate-spin rounded-full h-3 w-3 border-b border-gray-600"></div>
                      ) : (
                        "Test"
                      )}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex justify-end space-x-2 pt-4">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

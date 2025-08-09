import { AlertCircle, Bluetooth, Cable, Check, Power, Printer, Usb, Wifi } from "lucide-react";
import React, { useEffect, useState } from "react";
import { printerAPI } from "../../api/printer.api";
import type { Printer as PrinterType } from "../../types/printer";

interface PrinterSelectorProps {
  onPrinterSelect: (printer: PrinterType | null) => void;
  selectedPrinterId?: number | null;
  label?: string;
  placeholder?: string;
  showStatus?: boolean;
  showTestButton?: boolean;
  filterByType?: string[];
  filterByStatus?: "active" | "all";
  size?: "sm" | "md" | "lg";
  className?: string;
  disabled?: boolean;
  required?: boolean;
}

const PrinterSelector: React.FC<PrinterSelectorProps> = ({ onPrinterSelect, selectedPrinterId = null, label = "Select Printer", placeholder = "Choose a printer...", showStatus = true, showTestButton = false, filterByType = [], filterByStatus = "active", size = "md", className = "", disabled = false, required = false }) => {
  const [printers, setPrinters] = useState<PrinterType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [testingPrinter, setTestingPrinter] = useState<number | null>(null);

  // Size variants
  const sizeClasses = {
    sm: "text-sm py-2 px-3",
    md: "text-sm py-2.5 px-4",
    lg: "text-base py-3 px-4"
  };

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
        return <Printer className="w-4 h-4" />;
    }
  };

  // Status badge
  const getStatusBadge = (printer: PrinterType) => {
    if (!showStatus) return null;

    const statusConfig = {
      online: { color: "bg-green-100 text-green-800", text: "Online" },
      offline: { color: "bg-gray-100 text-gray-800", text: "Offline" },
      error: { color: "bg-red-100 text-red-800", text: "Error" },
      printing: { color: "bg-blue-100 text-blue-800", text: "Printing" }
    };

    const config = statusConfig[printer.status] || statusConfig.offline;

    return <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${config.color}`}>{config.text}</span>;
  };

  // Create stable filter key
  const filterTypeKey = filterByType.join(",");

  // Load printers
  const loadPrinters = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await printerAPI.getPrinters();
      let filteredPrinters = response.printers || [];

      // Filter by status
      if (filterByStatus === "active") {
        filteredPrinters = filteredPrinters.filter(p => p.isActive);
      }

      // Filter by type
      if (filterByType.length > 0) {
        filteredPrinters = filteredPrinters.filter(p => filterByType.includes(p.type));
      }

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
      // You could add a toast notification here
    } catch (err: any) {
      console.error("Test print failed:", err);
      // You could add error notification here
    } finally {
      setTestingPrinter(null);
    }
  };

  // Handle printer selection
  const handlePrinterSelect = (printer: PrinterType) => {
    onPrinterSelect(printer);
    setIsOpen(false);
  };

  // Get selected printer
  const selectedPrinter = printers.find(p => p.id === selectedPrinterId);

  useEffect(() => {
    loadPrinters();
  }, [filterByType.join(","), filterByStatus]);

  if (loading) {
    return (
      <div className={`relative ${className}`}>
        {label && (
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {label} {required && <span className="text-red-500">*</span>}
          </label>
        )}
        <div className={`w-full border border-gray-300 rounded-lg ${sizeClasses[size]} bg-gray-50 animate-pulse`}>Loading printers...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`relative ${className}`}>
        {label && (
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {label} {required && <span className="text-red-500">*</span>}
          </label>
        )}
        <div className={`w-full border border-red-300 rounded-lg ${sizeClasses[size]} bg-red-50 text-red-700 flex items-center`}>
          <AlertCircle className="w-4 h-4 mr-2" />
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className={`relative ${className}`}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}

      {/* Dropdown Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        disabled={disabled || printers.length === 0}
        className={`
          w-full text-left border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 
          ${sizeClasses[size]}
          ${disabled ? "bg-gray-50 text-gray-400 cursor-not-allowed" : "bg-white hover:bg-gray-50"}
          ${printers.length === 0 ? "border-gray-200" : "border-gray-300"}
          ${selectedPrinter ? "text-gray-900" : "text-gray-500"}
        `}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3 flex-1 min-w-0">
            {selectedPrinter ? (
              <>
                {getConnectionIcon(selectedPrinter.connectionType)}
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-gray-900 truncate">{selectedPrinter.name}</div>
                  <div className="text-xs text-gray-500 truncate">
                    {selectedPrinter.type} • {selectedPrinter.connectionType}
                  </div>
                </div>
                {getStatusBadge(selectedPrinter)}
              </>
            ) : (
              <>
                <Printer className="w-4 h-4 text-gray-400" />
                <span className="truncate">{placeholder}</span>
              </>
            )}
          </div>
          <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-auto">
          {printers.length === 0 ? (
            <div className="px-4 py-3 text-sm text-gray-500 text-center">No printers available</div>
          ) : (
            <>
              {/* Clear Selection Option */}
              {!required && (
                <button
                  type="button"
                  onClick={() => {
                    onPrinterSelect(null);
                    setIsOpen(false);
                  }}
                  className="w-full px-4 py-3 text-left text-sm text-gray-500 hover:bg-gray-50 flex items-center"
                >
                  <span className="w-4 h-4 mr-3" />
                  <span>No printer selected</span>
                </button>
              )}

              {/* Printer Options */}
              {printers.map(printer => (
                <button
                  key={printer.id}
                  type="button"
                  onClick={() => handlePrinterSelect(printer)}
                  className={`
                    w-full px-4 py-3 text-left text-sm hover:bg-gray-50 flex items-center justify-between
                    ${selectedPrinterId === printer.id ? "bg-blue-50 text-blue-700" : "text-gray-900"}
                  `}
                >
                  <div className="flex items-center space-x-3 flex-1 min-w-0">
                    {getConnectionIcon(printer.connectionType)}
                    <div className="flex-1 min-w-0">
                      <div className="font-medium truncate">{printer.name}</div>
                      <div className="text-xs text-gray-500 truncate">
                        {printer.type} • {printer.connectionType}
                        {printer.location && ` • ${printer.location}`}
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      {getStatusBadge(printer)}
                      {showTestButton && printer.isActive && (
                        <button type="button" onClick={e => handleTestPrinter(printer.id, e)} disabled={testingPrinter === printer.id} className="p-1 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors" title="Test printer">
                          {testingPrinter === printer.id ? <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" /> : <Power className="w-4 h-4" />}
                        </button>
                      )}
                      {selectedPrinterId === printer.id && <Check className="w-4 h-4 text-blue-600" />}
                    </div>
                  </div>
                </button>
              ))}
            </>
          )}
        </div>
      )}

      {/* Click outside to close */}
      {isOpen && <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />}
    </div>
  );
};

export default PrinterSelector;

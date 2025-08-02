import React from "react";
import { usePrinterSelector } from "../../hooks/usePrinterSelector";
import PrinterSelector from "../common/PrinterSelector";

/**
 * Example usage of PrinterSelector component
 * These examples show different ways to use the printer selector
 */

// Example 1: Basic Usage
export const BasicPrinterSelector: React.FC = () => {
  const { selectedPrinter, selectPrinter } = usePrinterSelector();

  const handlePrint = () => {
    if (selectedPrinter) {
      console.log("Printing to:", selectedPrinter.name);
      // Add your print logic here
    } else {
      alert("Please select a printer first");
    }
  };

  return (
    <div className="space-y-4">
      <PrinterSelector onPrinterSelect={selectPrinter} selectedPrinterId={selectedPrinter?.id} label="Choose Printer" placeholder="Select a printer to continue..." showStatus={true} showTestButton={true} />

      <button onClick={handlePrint} disabled={!selectedPrinter} className="px-4 py-2 bg-blue-600 text-white rounded-lg disabled:bg-gray-300 disabled:cursor-not-allowed">
        Print Document
      </button>
    </div>
  );
};

// Example 2: Thermal Printers Only
export const ThermalPrinterSelector: React.FC = () => {
  const { selectedPrinter, selectPrinter } = usePrinterSelector();

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium">Receipt Printing</h3>
      <PrinterSelector onPrinterSelect={selectPrinter} selectedPrinterId={selectedPrinter?.id} label="Receipt Printer" placeholder="Choose thermal printer..." filterByType={["thermal", "receipt"]} showStatus={true} showTestButton={true} required={true} />
    </div>
  );
};

// Example 3: Compact Size with Status
export const CompactPrinterSelector: React.FC = () => {
  const { selectedPrinter, selectPrinter } = usePrinterSelector();

  return (
    <div className="max-w-xs">
      <PrinterSelector onPrinterSelect={selectPrinter} selectedPrinterId={selectedPrinter?.id} placeholder="Quick select..." size="sm" showStatus={false} className="w-full" />
    </div>
  );
};

// Example 4: Large Size with All Features
export const FullFeaturedPrinterSelector: React.FC = () => {
  const { selectedPrinter, selectPrinter } = usePrinterSelector();

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold mb-4">Print Management</h2>
        <PrinterSelector onPrinterSelect={selectPrinter} selectedPrinterId={selectedPrinter?.id} label="Select Printer for Job" placeholder="Choose from available printers..." size="lg" showStatus={true} showTestButton={true} filterByStatus="active" required={true} className="mb-4" />

        {selectedPrinter && (
          <div className="p-4 bg-blue-50 rounded-lg">
            <h4 className="font-medium text-blue-900">Selected Printer Details</h4>
            <div className="mt-2 text-sm text-blue-700">
              <p>
                <strong>Name:</strong> {selectedPrinter.name}
              </p>
              <p>
                <strong>Type:</strong> {selectedPrinter.type}
              </p>
              <p>
                <strong>Connection:</strong> {selectedPrinter.connectionType}
              </p>
              <p>
                <strong>Status:</strong> {selectedPrinter.status}
              </p>
              {selectedPrinter.location && (
                <p>
                  <strong>Location:</strong> {selectedPrinter.location}
                </p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// Example 5: In a Form
export const PrinterSelectorInForm: React.FC = () => {
  const { selectedPrinter, selectPrinter } = usePrinterSelector();
  const [documentName, setDocumentName] = React.useState("");
  const [copies, setCopies] = React.useState(1);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedPrinter) {
      alert("Please select a printer");
      return;
    }

    console.log("Print Job:", {
      printer: selectedPrinter,
      document: documentName,
      copies: copies
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-w-md">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Document Name</label>
        <input type="text" value={documentName} onChange={e => setDocumentName(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" placeholder="Enter document name..." required />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Number of Copies</label>
        <input type="number" min="1" max="10" value={copies} onChange={e => setCopies(parseInt(e.target.value) || 1)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
      </div>

      <PrinterSelector onPrinterSelect={selectPrinter} selectedPrinterId={selectedPrinter?.id} label="Target Printer" placeholder="Select printer for this job..." showStatus={true} showTestButton={true} required={true} />

      <button type="submit" className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2">
        Submit Print Job
      </button>
    </form>
  );
};

// Example 6: Multiple Printer Selection (for different purposes)
export const MultiPurposePrinterSelector: React.FC = () => {
  const receiptPrinter = usePrinterSelector();
  const labelPrinter = usePrinterSelector();
  const reportPrinter = usePrinterSelector();

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold">Multi-Purpose Printing Setup</h2>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="space-y-2">
          <PrinterSelector onPrinterSelect={receiptPrinter.selectPrinter} selectedPrinterId={receiptPrinter.selectedPrinterId} label="Receipt Printer" placeholder="For customer receipts..." filterByType={["thermal", "receipt"]} showStatus={true} size="sm" />
        </div>

        <div className="space-y-2">
          <PrinterSelector onPrinterSelect={labelPrinter.selectPrinter} selectedPrinterId={labelPrinter.selectedPrinterId} label="Label Printer" placeholder="For product labels..." filterByType={["label"]} showStatus={true} size="sm" />
        </div>

        <div className="space-y-2">
          <PrinterSelector onPrinterSelect={reportPrinter.selectPrinter} selectedPrinterId={reportPrinter.selectedPrinterId} label="Report Printer" placeholder="For reports..." filterByType={["inkjet", "laser"]} showStatus={true} size="sm" />
        </div>
      </div>

      <div className="p-4 bg-gray-50 rounded-lg">
        <h4 className="font-medium mb-2">Current Configuration:</h4>
        <div className="text-sm space-y-1">
          <p>
            <strong>Receipts:</strong> {receiptPrinter.selectedPrinter?.name || "Not selected"}
          </p>
          <p>
            <strong>Labels:</strong> {labelPrinter.selectedPrinter?.name || "Not selected"}
          </p>
          <p>
            <strong>Reports:</strong> {reportPrinter.selectedPrinter?.name || "Not selected"}
          </p>
        </div>
      </div>
    </div>
  );
};

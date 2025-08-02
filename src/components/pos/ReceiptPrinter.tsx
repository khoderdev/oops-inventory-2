import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { ReceiptPrinterProps } from "@/types/inventory";
import { formatCurrency } from "@/utils/conversionLogic";
import { AlertCircle, CheckCircle, Loader2, Printer } from "lucide-react";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";

export const ReceiptPrinter: React.FC<ReceiptPrinterProps> = ({
  isOpen,
  onClose,
  receiptData,
  autoPrint = false,
  onPrintSuccess,
  businessInfo = {
    name: "oOps Resto-Café",
    address: "Batroun, seaside",
    phone: "+961 81 510 059"
  }
}) => {
  const receiptRef = useRef<HTMLDivElement>(null);
  const [isPrinting, setIsPrinting] = useState(false);
  const [printError, setPrintError] = useState<string | null>(null);
  const [dataValidated, setDataValidated] = useState(false);
  const [lastPrintTime, setLastPrintTime] = useState<number | null>(null);

  // Validate receipt data integrity
  const validationResult = useMemo(() => {
    if (!receiptData) {
      return { isValid: false, errors: ["No receipt data provided"] };
    }

    const errors: string[] = [];

    // Validate required fields
    if (!receiptData.id) errors.push("Missing receipt ID");
    if (!receiptData.date) errors.push("Missing receipt date");
    if (!receiptData.time) errors.push("Missing receipt time");
    if (!receiptData.cashier) errors.push("Missing cashier information");
    if (!receiptData.items || receiptData.items.length === 0) {
      errors.push("No items in receipt");
    }

    // Validate financial calculations
    if (receiptData.items && receiptData.items.length > 0) {
      const calculatedSubtotal = receiptData.items.reduce((sum, item) => {
        const itemTotal = item.quantity * item.unitPrice;
        if (Math.abs(itemTotal - item.totalPrice) > 0.01) {
          errors.push(`Item "${item.name}" has incorrect total price`);
        }
        return sum + item.totalPrice;
      }, 0);

      if (Math.abs(calculatedSubtotal - receiptData.subtotal) > 0.01) {
        errors.push("Subtotal calculation mismatch");
      }

      // Validate discount calculations
      if (receiptData.discountAmount && receiptData.discountAmount > 0) {
        if (receiptData.discountType === "percentage" && receiptData.discountValue) {
          const expectedDiscount = (receiptData.subtotal * receiptData.discountValue) / 100;
          if (Math.abs(expectedDiscount - receiptData.discountAmount) > 0.01) {
            errors.push("Percentage discount calculation mismatch");
          }
        } else if (receiptData.discountType === "fixed" && receiptData.discountValue) {
          if (Math.abs(receiptData.discountValue - receiptData.discountAmount) > 0.01) {
            errors.push("Fixed discount amount mismatch");
          }
        }
      }

      // Validate final total
      const expectedTotal = receiptData.subtotal - (receiptData.discountAmount || 0) + receiptData.tax;
      if (Math.abs(expectedTotal - receiptData.total) > 0.01) {
        errors.push("Final total calculation mismatch");
      }

      // Validate payment calculations
      const expectedChange = receiptData.paymentAmount - receiptData.total;
      if (Math.abs(expectedChange - receiptData.change) > 0.01) {
        errors.push("Change calculation mismatch");
      }
    }

    return { isValid: errors.length === 0, errors };
  }, [receiptData]);

  // Update validation state
  useEffect(() => {
    setDataValidated(validationResult.isValid);
    if (!validationResult.isValid) {
      console.warn("Receipt data validation failed:", validationResult.errors);
    }
  }, [validationResult]);

  // Enhanced print function using native browser print dialog
  const handlePrint = useCallback(async () => {
    // Prevent multiple simultaneous print operations
    if (isPrinting) {
      console.warn("Print operation already in progress");
      return;
    }

    // Validate data before printing
    if (!validationResult.isValid) {
      setPrintError(`Cannot print: ${validationResult.errors.join(", ")}`);
      return;
    }

    if (!receiptRef.current || !receiptData) {
      setPrintError("Receipt data or reference not available");
      return;
    }

    setIsPrinting(true);
    setPrintError(null);

    try {
      // Create print styles for the current document
      const printStyles = `
        <style id="receipt-print-styles">
          @media print {
            /* Hide everything except our receipt */
            body > *:not(.receipt-print-container) {
              display: none !important;
            }
            
            body {
              margin: 0 !important;
              padding: 0 !important;
              background: white !important;
            }
            
            .receipt-print-container {
              display: block !important;
              position: static !important;
              width: 100mm !important;
              max-width: 100mm !important;
              margin: 0 auto !important;
              padding: 2mm !important;
              font-family: 'Courier New', 'Lucida Console', monospace !important;
              font-size: 12px !important;
              line-height: 1.3 !important;
              color: #000 !important;
              background: white !important;
            }
            
            /* Reset all nested elements */
            .receipt-print-container * {
              font-family: 'Courier New', 'Lucida Console', monospace !important;
              color: #000 !important;
              background: transparent !important;
              box-shadow: none !important;
              text-shadow: none !important;
              border-radius: 0 !important;
            }
            
            /* Preserve flex layouts */
            .receipt-print-container .flex {
              display: flex !important;
            }
            
            .receipt-print-container .justify-between {
              justify-content: space-between !important;
            }
            
            .receipt-print-container .text-center {
              text-align: center !important;
            }
            
            .receipt-print-container .font-bold {
              font-weight: bold !important;
            }
            
            .receipt-print-container .capitalize {
              text-transform: capitalize !important;
            }
            
            /* Ensure borders show up */
            .receipt-print-container .border-t {
              border-top: 1px solid #000 !important;
            }
            
            .receipt-print-container .border-b {
              border-bottom: 1px solid #000 !important;
            }
            
            .receipt-print-container .border-dashed {
              border-style: dashed !important;
            }
            
            /* Specific receipt section styling with proper spacing */
            .receipt-print-container .business-name {
              font-size: 16px !important;
              font-weight: bold !important;
              text-transform: uppercase !important;
              margin-bottom: 3mm !important;
            }
            
            .receipt-print-container .business-info {
              font-size: 10px !important;
              line-height: 1.2 !important;
            }
            
            /* Header section spacing */
            .receipt-print-container .header {
              padding-bottom: 6mm !important;
              margin-bottom: 8mm !important;
            }
            
            /* Receipt info section spacing */
            .receipt-print-container .receipt-info {
              margin-bottom: 8mm !important;
            }
            
            /* Items section spacing */
            .receipt-print-container .items {
              margin-bottom: 8mm !important;
            }
            
            .receipt-print-container .item {
              margin-bottom: 3mm !important;
            }
            
            /* Totals section spacing */
            .receipt-print-container .totals {
              margin-top: 8mm !important;
              padding-top: 5mm !important;
            }
            
            /* Payment info section spacing */
            .receipt-print-container .payment-info {
              margin-top: 8mm !important;
              padding-top: 5mm !important;
            }
            
            /* Footer section spacing */
            .receipt-print-container .footer {
              margin-top: 9mm !important;
              padding-top: 5mm !important;
            }
            
            /* Override specific inline styles with attribute selectors */
            .receipt-print-container [style*="paddingBottom: 6mm"] {
              padding-bottom: 6mm !important;
              margin-bottom: 8mm !important;
            }
            
            .receipt-print-container [style*="marginBottom: 8mm"] {
              margin-bottom: 8mm !important;
            }
            
            .receipt-print-container [style*="paddingTop: 5mm"] {
              padding-top: 5mm !important;
            }
            
            .receipt-print-container [style*="marginTop: 8mm"] {
              margin-top: 8mm !important;
            }
            
            .receipt-print-container [style*="marginTop: 9mm"] {
              margin-top: 9mm !important;
            }
            
            /* Target sections by their content/structure */
            .receipt-print-container .header {
              padding-bottom: 6mm !important;
              margin-bottom: 8mm !important;
            }
            
            .receipt-print-container .receipt-info {
              margin-bottom: 8mm !important;
            }
            
            .receipt-print-container .items {
              margin-bottom: 8mm !important;
            }
            
            .receipt-print-container .totals {
              margin-top: 8mm !important;
              padding-top: 5mm !important;
            }
            
            .receipt-print-container .payment-info {
              margin-top: 8mm !important;
              padding-top: 5mm !important;
            }
            
            .receipt-print-container .footer {
              margin-top: 9mm !important;
              padding-top: 5mm !important;
            }
            
            @page {
              size: 80mm auto;
              margin: 5mm;
            }
          }
        </style>
      `;

      // Remove existing print styles if any
      const existingStyles = document.getElementById("receipt-print-styles");
      if (existingStyles) {
        existingStyles.remove();
      }

      // Add print styles to document head
      document.head.insertAdjacentHTML("beforeend", printStyles);

      // Create a temporary print container
      const printContainer = document.createElement("div");
      printContainer.className = "receipt-print-container";
      printContainer.style.position = "fixed";
      printContainer.style.top = "-9999px";
      printContainer.style.left = "-9999px";
      printContainer.innerHTML = receiptRef.current.innerHTML;
      
      // Remove conflicting inline styles from sections to allow CSS to take over
      const sectionsToUpdate = [
        { selector: '.header', marginBottom: '8mm', paddingBottom: '6mm' },
        { selector: '.receipt-info', marginBottom: '8mm' },
        { selector: '.items', marginBottom: '8mm' },
        { selector: '.totals', marginTop: '8mm', paddingTop: '5mm' },
        { selector: '.payment-info', marginTop: '8mm', paddingTop: '5mm' },
        { selector: '.footer', marginTop: '9mm', paddingTop: '5mm' }
      ];
      
      sectionsToUpdate.forEach(({ selector, marginBottom, marginTop, paddingBottom, paddingTop }) => {
        const element = printContainer.querySelector(selector);
        if (element) {
          // Remove existing margin/padding from inline styles
          const style = element.getAttribute('style') || '';
          let newStyle = style
            .replace(/margin[^;]*;?/g, '')
            .replace(/padding[^;]*;?/g, '');
          
          // Add our spacing
          if (marginBottom) newStyle += `margin-bottom: ${marginBottom} !important;`;
          if (marginTop) newStyle += `margin-top: ${marginTop} !important;`;
          if (paddingBottom) newStyle += `padding-bottom: ${paddingBottom} !important;`;
          if (paddingTop) newStyle += `padding-top: ${paddingTop} !important;`;
          
          element.setAttribute('style', newStyle);
        }
      });

      // Add print container to body
      document.body.appendChild(printContainer);

      // Small delay to ensure styles are applied
      await new Promise(resolve => setTimeout(resolve, 100));

      // Trigger native print dialog
      window.print();

      // Clean up
      setTimeout(() => {
        // Remove print styles and container
        const stylesToRemove = document.getElementById("receipt-print-styles");
        if (stylesToRemove) {
          stylesToRemove.remove();
        }
        if (printContainer && printContainer.parentNode) {
          printContainer.parentNode.removeChild(printContainer);
        }
      }, 1000);

      // Track successful print
      setLastPrintTime(Date.now());

      // Call success callback to clear cart/items
      if (onPrintSuccess) {
        console.log("🧹 Calling onPrintSuccess to clear cart after successful print");
        onPrintSuccess();
      }
    } catch (error) {
      console.error("Print operation failed:", error);
      setPrintError(error instanceof Error ? error.message : "Print operation failed");
    } finally {
      setIsPrinting(false);
    }
  }, [receiptData, businessInfo, validationResult, isPrinting, dataValidated, onPrintSuccess]);

  // Handle keyboard events
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (isOpen && event.key === "Enter") {
        event.preventDefault();
        handlePrint();
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleKeyDown);
    }

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, handlePrint]);

  // Enhanced auto-print with validation and error handling
  useEffect(() => {
    if (isOpen && autoPrint && receiptData && receiptRef.current && dataValidated && !isPrinting) {
      // Ensure dialog is fully rendered and data is validated
      const timer = setTimeout(() => {
        if (receiptRef.current && validationResult.isValid) {
          handlePrint();
        } else {
          console.warn("Auto-print skipped due to validation errors:", validationResult.errors);
        }
      }, 800); // Increased delay for better reliability

      return () => clearTimeout(timer);
    }
  }, [isOpen, autoPrint, receiptData, dataValidated, validationResult.isValid, validationResult.errors, handlePrint, isPrinting]);

  // Clear errors when dialog closes
  useEffect(() => {
    if (!isOpen) {
      setPrintError(null);
      setIsPrinting(false);
    }
  }, [isOpen]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!isOpen) return;

      if (event.key === "Enter" || event.key === "p") {
        event.preventDefault();
        handlePrint();
      } else if (event.key === "Escape") {
        event.preventDefault();
        onClose();
      } else if (event.key === "r" && event.ctrlKey) {
        event.preventDefault();
        // Refresh/revalidate data
        setDataValidated(false);
        setTimeout(() => setDataValidated(validationResult.isValid), 100);
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleKeyDown);
    }

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, handlePrint, onClose, validationResult.isValid]);

  if (!receiptData) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md w-full max-h-[95vh] h-auto flex flex-col p-0 pt-2">
        {/* Scrollable Receipt Container */}
        <div className="flex-1 overflow-y-auto p-0">
          <div ref={receiptRef} className="receipt bg-white text-black" style={{ width: "100%", maxWidth: "120mm", padding: "4mm", margin: "0 auto", fontFamily: "Courier New, monospace", fontSize: "16px", lineHeight: "1.2", transform: "scale(1)", transformOrigin: "top center" }}>
            {/* Header */}
            <div className="header text-center border-b-2 border-black/25" style={{ paddingBottom: "6mm", marginBottom: "8mm" }}>
              <div className="business-name font-bold" style={{ fontSize: "21px", marginBottom: "2mm" }}>
                {businessInfo.name}
              </div>
              <div className="business-info" style={{ fontSize: "13.5px", lineHeight: "1.1" }}>
                <div>{businessInfo.address}</div>
                <div>Phone: {businessInfo.phone}</div>
                {businessInfo.taxId && <div>Tax ID: {businessInfo.taxId}</div>}
              </div>
            </div>

            {/* Receipt Info */}
            <div className="receipt-info" style={{ fontSize: "13.5px", marginBottom: "8mm" }}>
              <div className="flex justify-between">
                <span>Receipt #:</span>
                <span>{receiptData.id}</span>
              </div>
              <div className="flex justify-between">
                <span>Date:</span>
                <span>{receiptData.date}</span>
              </div>
              <div className="flex justify-between">
                <span>Time:</span>
                <span>{receiptData.time}</span>
              </div>
              <div className="flex justify-between">
                <span>Cashier:</span>
                <span>{receiptData.cashier}</span>
              </div>
            </div>

            {/* Items */}
            <div className="items" style={{ marginBottom: "8mm" }}>
              {receiptData.items.map((item, index) => (
                <div key={index} className="item" style={{ marginBottom: "3mm", fontSize: "13.5px" }}>
                  <div className="item-line flex justify-between" style={{ marginBottom: "1.5mm" }}>
                    <span className="flex-1">{item.name}</span>
                    <span>{formatCurrency(item.totalPrice)}</span>
                  </div>
                  <div className="item-details text-black/50" style={{ fontSize: "12px", marginLeft: "4.5mm" }}>
                    {item.quantity} × {formatCurrency(item.unitPrice)}
                  </div>
                </div>
              ))}
            </div>

            {/* Totals */}
            <div className="totals border-t border-black/25" style={{ paddingTop: "5mm", marginTop: "8mm" }}>
              {/* Subtotal */}
              <div className="total-line flex justify-between" style={{ fontSize: "13.5px", marginBottom: "1.5mm" }}>
                <span>Subtotal:</span>
                <span>{formatCurrency(receiptData.subtotal)}</span>
              </div>

              {/* Discount (if applied) */}
              {receiptData.discountAmount && receiptData.discountAmount > 0 && (
                <div className="total-line flex justify-between" style={{ fontSize: "13.5px", marginBottom: "1.5mm", color: "#d97706" }}>
                  <span>Discount ({receiptData.discountType === "percentage" ? `${receiptData.discountValue}%` : formatCurrency(receiptData.discountValue || 0)}):</span>
                  <span>-{formatCurrency(receiptData.discountAmount)}</span>
                </div>
              )}

              {/* Tax (if applicable) */}
              {receiptData.tax > 0 && (
                <div className="total-line flex justify-between" style={{ fontSize: "13.5px", marginBottom: "1.5mm" }}>
                  <span>Tax:</span>
                  <span>{formatCurrency(receiptData.tax)}</span>
                </div>
              )}

              <div className="final-total flex justify-between font-bold border-t border-black/25" style={{ fontSize: "16.5px", paddingTop: "2mm", marginTop: "2mm" }}>
                <span>TOTAL:</span>
                <span>{formatCurrency(receiptData.total)}</span>
              </div>
            </div>

            {/* Payment Info */}
            <div className="payment-info border-t border-dashed border-black/30" style={{ marginTop: "8mm", paddingTop: "5mm", fontSize: "13.5px" }}>
              <div className="flex justify-between">
                <span>Payment Method:</span>
                <span className="capitalize">{receiptData.paymentMethod}</span>
              </div>
              <div className="flex justify-between">
                <span>Amount Paid:</span>
                <span>{formatCurrency(receiptData.paymentAmount)}</span>
              </div>
              {receiptData.change > 0 && (
                <div className="flex justify-between font-bold">
                  <span>Change:</span>
                  <span>{formatCurrency(receiptData.change)}</span>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="footer text-center border-t border-dashed border-black/30" style={{ marginTop: "9mm", paddingTop: "5mm", fontSize: "12px" }}>
              <div>oOps! dont forget to visit us again soon!</div>
            </div>
          </div>
        </div>

        {/* Status and Error Display */}
        {(printError || !dataValidated || isPrinting) && (
          <div className="p-4 border-t bg-gray-50">
            {printError && (
              <div className="flex items-center gap-2 text-red-600 text-sm mb-2">
                <AlertCircle className="w-4 h-4" />
                <span>{printError}</span>
              </div>
            )}
            {!dataValidated && !printError && (
              <div className="flex items-center gap-2 text-amber-600 text-sm mb-2">
                <AlertCircle className="w-4 h-4" />
                <span>Data validation issues detected. Please verify receipt accuracy.</span>
              </div>
            )}
            {isPrinting && (
              <div className="flex items-center gap-2 text-blue-600 text-sm">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Preparing receipt for printing...</span>
              </div>
            )}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex p-0 gap-0 flex-shrink-0">
          <Button className="flex-1 h-14 rounded-bl-lg rounded-br-none rounded-tl-none rounded-tr-none border-none bg-gray-200 hover:bg-red-500 hover:text-white text-gray-700 font-medium transition-colors" variant="ghost" onClick={onClose} disabled={isPrinting}>
            {isPrinting ? "Printing..." : "Close"}
          </Button>

          <Button className="flex-1 h-14 rounded-br-lg rounded-bl-none rounded-tr-none rounded-tl-none border-none bg-blue-600 hover:bg-blue-700 hover:text-white text-white font-medium transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed" onClick={handlePrint} disabled={isPrinting || !dataValidated} title={!dataValidated ? "Cannot print: Data validation failed" : "Print receipt (Enter or P)"}>
            {isPrinting ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Printing...
              </>
            ) : (
              <>
                <Printer className="w-5 h-5 mr-2" />
                Print
              </>
            )}
          </Button>

          {/* Validation Status Indicator */}
          <div className="absolute top-4 left-3 flex items-center gap-1">
            {dataValidated ? (
              <div title="Data validated successfully">
                <CheckCircle className="w-4 h-4 text-green-500" />
              </div>
            ) : (
              <div title="Data validation issues detected">
                <AlertCircle className="w-4 h-4 text-amber-500" />
              </div>
            )}
            {lastPrintTime && (
              <span className="text-xs text-gray-500 ml-1" title={`Last printed: ${new Date(lastPrintTime).toLocaleString()}`}>
                ✓
              </span>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

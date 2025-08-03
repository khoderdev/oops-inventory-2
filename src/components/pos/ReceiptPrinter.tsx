import { printerAPI } from "@/api/printer.api";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { useAuth } from "@/contexts/AuthContext";
import { usePrinterSelector } from "@/hooks/usePrinterSelector";
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
  const { user } = useAuth();
  const receiptRef = useRef<HTMLDivElement>(null);
  const [isPrinting, setIsPrinting] = useState(false);
  const [printError, setPrintError] = useState<string | null>(null);
  const [dataValidated, setDataValidated] = useState(false);
  const [lastPrintTime, setLastPrintTime] = useState<number | null>(null);
  const [autoPrintAttempted, setAutoPrintAttempted] = useState(false);

  // Printer selector hook
  const { getSavedPrinter, hasSavedPrinter } = usePrinterSelector();

  // Generate receipt content for thermal printer - optimized for 80mm thermal paper
  const generateReceiptContent = useCallback((receiptData: ReceiptPrinterProps["receiptData"], businessInfo: ReceiptPrinterProps["businessInfo"], currentUser?: { username?: string }) => {
    if (!receiptData) return "";

    // 80mm thermal receipt formatting (48 characters wide)
    let content = "";

    // Header with centered alignment
    const centerText = (text: string, width: number = 48) => {
      const padding = Math.max(0, Math.floor((width - text.length) / 2));
      return " ".repeat(padding) + text;
    };

    // Function to handle Arabic text encoding for thermal printers
    const handleArabicText = (text: string): string => {
      // Only remove specific problematic Chinese/Unicode characters
      // Keep normal ASCII and Arabic characters intact
      if (!text) return text;
      
      // Only remove if the text contains actual Chinese characters mixed with other text
      // This is more conservative to avoid corrupting normal English text
      return text
        .replace(/[\u4e00-\u9fff]+/g, "") // Remove Chinese character sequences only
        .replace(/[\u3400-\u4dbf]+/g, "") // Remove CJK Extension A sequences only
        .trim();
    };

    content += centerText(businessInfo.name.toUpperCase()) + "\n";
    content += centerText(businessInfo.address) + "\n";
    content += centerText(businessInfo.phone) + "\n";
    content += "================================================\n";
    content += "\n";

    // Receipt info - left aligned
    content += `Receipt #: ${receiptData.id}\n`;
    content += `Date: ${receiptData.date}\n`;
    content += `Time: ${receiptData.time}\n`;
    content += `Cashier: ${receiptData.cashier || currentUser?.username || "Unknown User"}\n`;
    content += "------------------------------------------------\n";
    content += "\n";

    // Items with proper alignment
    receiptData.items.forEach((item, index) => {
      // Item name (handle Arabic text and truncate if too long)
      const cleanItemName = handleArabicText(item.name);
      const itemName = cleanItemName.length > 40 ? cleanItemName.substring(0, 37) + "..." : cleanItemName;
      content += `${itemName}\n`;

      // Quantity, unit price, and total with right alignment
      const qtyPrice = `${item.quantity}x ${formatCurrency(item.unitPrice)}`;
      const total = formatCurrency(item.totalPrice);
      const spacesNeeded = 48 - qtyPrice.length - total.length;
      content += qtyPrice + " ".repeat(Math.max(1, spacesNeeded)) + total + "\n";

      // Reduced spacing between items (except last item)
      if (index < receiptData.items.length - 1) {
        // No extra newline - items will be closer together
      }
    });

    content += "\n";
    content += "------------------------------------------------\n";

    // Totals with right alignment
    const subtotalText = "Subtotal:";
    const subtotalValue = formatCurrency(receiptData.subtotal);
    const subtotalSpaces = 48 - subtotalText.length - subtotalValue.length;
    content += subtotalText + " ".repeat(Math.max(1, subtotalSpaces)) + subtotalValue + "\n";

    // Discount (if applicable)
    if (receiptData.discountAmount && receiptData.discountAmount > 0) {
      const discountText = "Discount:";
      const discountValue = "-" + formatCurrency(receiptData.discountAmount);
      const discountSpaces = 48 - discountText.length - discountValue.length;
      content += discountText + " ".repeat(Math.max(1, discountSpaces)) + discountValue + "\n";
    }

    // Tax
    const taxText = "Tax:";
    const taxValue = formatCurrency(receiptData.tax);
    const taxSpaces = 48 - taxText.length - taxValue.length;
    content += taxText + " ".repeat(Math.max(1, taxSpaces)) + taxValue + "\n";

    content += "================================================\n";

    // Total with emphasis
    const totalText = "TOTAL:";
    const totalValue = formatCurrency(receiptData.total);
    const totalSpaces = 48 - totalText.length - totalValue.length;
    content += totalText + " ".repeat(Math.max(1, totalSpaces)) + totalValue + "\n";

    content += "\n";

    // Payment info
    if (receiptData.paymentMethod && receiptData.paymentMethod !== "report") {
      content += "Payment Method:\n";
      content += receiptData.paymentMethod.toUpperCase() + "\n";
      content += "\n";
    }

    const paidText = "Amount Paid:";
    const paidValue = formatCurrency(receiptData.paymentAmount);
    const paidSpaces = 48 - paidText.length - paidValue.length;
    content += paidText + " ".repeat(Math.max(1, paidSpaces)) + paidValue + "\n";

    const changeText = "Change:";
    const changeValue = formatCurrency(receiptData.change);
    const changeSpaces = 48 - changeText.length - changeValue.length;
    content += changeText + " ".repeat(Math.max(1, changeSpaces)) + changeValue + "\n";

    content += "\n";
    content += "================================================\n";
    content += "\n";
    content += centerText("Thank you for your visit!") + "\n";
    content += "\n";
    content += centerText("*** oOps! dont forget to visit us again soon! ***") + "\n";
    content += "\n";
    content += "\n";
    content += "\n";
    content += "\n";
    content += "\n";

    // Add thermal printer paper cut command (ESC/POS)
    return content + "\x1B\x69"; // ESC i - Full cut command
  }, []);

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
    // Cashier validation removed since we now have fallback to logged-in user
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

  // Enhanced print function with automatic printer communication
  const handlePrint = useCallback(async () => {
    // Prevent multiple simultaneous print operations
    if (isPrinting) {
      console.warn("Print operation already in progress");
      return;
    }

    // Prevent rapid successive print attempts (cooldown period)
    const now = Date.now();
    if (lastPrintTime && now - lastPrintTime < 2000) {
      // 2 second cooldown
      console.warn("Print cooldown active, please wait before printing again");
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
      // First, try to send to the selected printer automatically
      if (hasSavedPrinter()) {
        const savedPrinter = getSavedPrinter();
        if (savedPrinter) {
          console.log(`🖨️ Sending receipt to printer: ${savedPrinter.name}`);
          console.log(`📋 Printer Details:`, {
            id: savedPrinter.id,
            name: savedPrinter.name,
            type: savedPrinter.type,
            connectionType: savedPrinter.connectionType,
            status: savedPrinter.status
          });

          // Create receipt content for the printer
          const receiptContent = generateReceiptContent(receiptData, businessInfo, user);
          console.log(`📄 Generated receipt content for thermal printer:`);
          console.log(`--- RECEIPT CONTENT START ---`);
          console.log(receiptContent);
          console.log(`--- RECEIPT CONTENT END ---`);
          
          // Check if footer message is included
          if (receiptContent.includes("oOps! dont forget to visit us again soon!")) {
            console.log(`✅ Footer message IS included in receipt content`);
          } else {
            console.log(`❌ Footer message NOT found in receipt content`);
          }
          
          // Also log the last 200 characters to see what's at the end
          console.log(`🔍 Last 200 characters of receipt:`);
          console.log(receiptContent.slice(-200));

          const printJobData = {
            printerId: savedPrinter.id,
            jobType: "receipt" as const,
            content: {
              rawContent: receiptContent,
              format: "text",
              encoding: "utf8"
            },
            priority: 1,
            metadata: {
              receiptId: receiptData.id,
              date: receiptData.date,
              time: receiptData.time,
              cashier: receiptData.cashier,
              total: receiptData.total
            }
          };

          console.log(`📤 Sending print job with data:`, printJobData);

          try {
            const printJobResponse = await printerAPI.createPrintJob(printJobData);

            console.log(`📨 Print job sent to network printer:`, {
              printerId: savedPrinter.id,
              printerName: savedPrinter.name,
              jobId: printJobResponse.job?.id,
              status: printJobResponse.job?.status
            });

            if (printJobResponse.success && printJobResponse.job) {
              console.log(`✅ Print job created successfully! Job ID: ${printJobResponse.job.id}, Status: ${printJobResponse.job.status}`);

              // For network printers, we consider the job successful if it's created and accepted
              // The actual printing happens asynchronously on the network printer
              if (printJobResponse.job.status === "completed" || printJobResponse.job.status === "pending" || printJobResponse.job.status === "printing") {
                console.log(`🖨️ Print job successfully queued for network printer: ${savedPrinter.name}`);

                // Track successful print
                setLastPrintTime(Date.now());

                // Call success callback to clear cart/items
                if (onPrintSuccess) {
                  console.log("🧹 Calling onPrintSuccess to clear cart after successful network print job");
                  onPrintSuccess();
                }

                return; // Exit early on successful network printing
              } else if (printJobResponse.job.status === "failed") {
                console.warn(`❌ Network printer rejected the job. Status: ${printJobResponse.job.status}`);
                setPrintError(`Network printer "${savedPrinter.name}" is not responding or offline. Please check printer connection.`);
                return;
              } else {
                console.warn(`⚠️ Unexpected print job status: ${printJobResponse.job.status}`);
                setPrintError(`Print job has unexpected status: ${printJobResponse.job.status}`);
                return;
              }
            } else {
              console.error("❌ Print job creation failed:", printJobResponse);
              setPrintError(`Failed to send print job to "${savedPrinter.name}": ${printJobResponse.message || "Network printer communication error"}`);
              return;
            }
          } catch (printerError) {
            console.error("🚨 Network printer communication error:", printerError);
            const errorMessage = printerError instanceof Error ? printerError.message : "Unknown network error";
            setPrintError(`Cannot reach network printer "${savedPrinter.name}": ${errorMessage}`);
            return;
          }
        } else {
          console.log("⚠️ No saved printer found in localStorage");
          setPrintError("No saved printer found. Please configure a network printer in settings.");
          return;
        }
      } else {
        console.log("ℹ️ No printer selected - prompting user to configure printer");
        setPrintError("No network printer selected. Please configure a printer in settings to enable automatic printing.");
        return;
      }
    } catch (error) {
      console.error("Print operation failed:", error);
      setPrintError(error instanceof Error ? error.message : "Print operation failed");
    } finally {
      setIsPrinting(false);
    }
  }, [receiptData, businessInfo, validationResult, isPrinting, onPrintSuccess, hasSavedPrinter, getSavedPrinter, generateReceiptContent, user, lastPrintTime]);

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
    if (isOpen && autoPrint && receiptData && receiptRef.current && dataValidated && !isPrinting && !autoPrintAttempted) {
      console.log("🔄 Auto-print conditions met, attempting auto-print...");
      setAutoPrintAttempted(true); // Mark that we've attempted auto-print

      // Ensure dialog is fully rendered and data is validated
      const timer = setTimeout(() => {
        if (receiptRef.current && validationResult.isValid) {
          console.log("✅ Auto-print validation passed, calling handlePrint");
          handlePrint();
        } else {
          console.warn("❌ Auto-print skipped due to validation errors:", validationResult.errors);
        }
      }, 800); // Increased delay for better reliability

      return () => clearTimeout(timer);
    }
  }, [isOpen, autoPrint, receiptData, dataValidated, validationResult.isValid, validationResult.errors, handlePrint, isPrinting, autoPrintAttempted]);

  // Clear errors when dialog closes
  useEffect(() => {
    if (!isOpen) {
      setPrintError(null);
      setIsPrinting(false);
      setAutoPrintAttempted(false); // Reset auto-print flag for next time
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
                <span>{receiptData.cashier || user?.username || "Unknown User"}</span>
              </div>
            </div>

            {/* Separator between receipt info and items */}
            <div className="separator" style={{ borderTop: "1px solid #ccc", margin: "4mm 0", width: "100%" }}></div>

            {/* Items */}
            <div className="items" style={{ marginBottom: "8mm" }}>
              {receiptData.items.map((item, index) => (
                <div key={index} className="item" style={{ marginBottom: "1.5mm", fontSize: "13.5px" }}>
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

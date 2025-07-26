import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter } from "@/components/ui/dialog";
import { ReceiptPrinterProps } from "@/types/inventory";
import { formatCurrency } from "@/utils/conversionLogic";
import { Printer } from "lucide-react";
import React, { useCallback, useEffect, useRef } from "react";

export const ReceiptPrinter: React.FC<ReceiptPrinterProps> = ({
  isOpen,
  onClose,
  receiptData,
  autoPrint = false,
  businessInfo = {
    name: "oOps Resto-Café",
    address: "Batroun, seaside",
    phone: "+961 81 510 059"
  }
}) => {
  const receiptRef = useRef<HTMLDivElement>(null);

  // Handle print function
  const handlePrint = useCallback(() => {
    if (receiptRef.current) {
      const printWindow = window.open("", "_blank");
      if (printWindow) {
        printWindow.document.write(`
          <html>
            <head>
              <title>Receipt #${receiptData.id}</title>
              <style>
                body {
                  font-family: 'Courier New', monospace;
                  font-size: 11px;
                  line-height: 1.2;
                  margin: 0;
                  padding: 0;
                  background: white;
                }
                .receipt {
                  width: 80mm;
                  max-width: 80mm;
                  margin: 0 auto;
                  background: white;
                  padding: 2mm;
                  box-sizing: border-box;
                }
                .header {
                  text-align: center;
                  border-bottom: 2px solid #000;
                  padding-bottom: 3mm;
                  margin-bottom: 4mm;
                }
                .business-name {
                  font-size: 14px;
                  font-weight: bold;
                  margin-bottom: 1mm;
                }
                .business-info {
                  font-size: 9px;
                  line-height: 1.1;
                }
                .receipt-info {
                  margin-bottom: 4mm;
                  font-size: 9px;
                }
                .items {
                  margin-bottom: 4mm;
                }
                .item {
                  margin-bottom: 2mm;
                  font-size: 9px;
                }
                .item-line {
                  display: flex;
                  justify-content: space-between;
                  margin-bottom: 1mm;
                }
                .item-details {
                  font-size: 8px;
                  color: #666;
                  margin-left: 3mm;
                }
                .totals {
                  border-top: 1px solid #000;
                  padding-top: 3mm;
                  margin-top: 4mm;
                }
                .total-line {
                  display: flex;
                  justify-content: space-between;
                  margin-bottom: 1mm;
                  font-size: 9px;
                }
                .final-total {
                  font-weight: bold;
                  font-size: 11px;
                  border-top: 1px solid #000;
                  padding-top: 2mm;
                  margin-top: 2mm;
                }
                .payment-info {
                  margin-top: 4mm;
                  padding-top: 3mm;
                  border-top: 1px dashed #0000004D;
                  font-size: 9px;
                }
                .footer {
                  text-align: center;
                  margin-top: 5mm;
                  padding-top: 3mm;
                  border-top: 1px dashed #0000004D;
                  font-size: 8px;
                }
                @media print {
                  @page {
                    size: 80mm auto;
                    margin: 0;
                  }
                  body { 
                    margin: 0; 
                    padding: 0;
                    -webkit-print-color-adjust: exact;
                    color-adjust: exact;
                  }
                  .receipt { 
                    border: none; 
                    box-shadow: none;
                    width: 80mm;
                    padding: 2mm;
                  }
                }
              </style>
            </head>
            <body>
              ${receiptRef.current.innerHTML}
            </body>
          </html>
        `);
        printWindow.document.close();
        printWindow.print();
        printWindow.close();
      }
    }
  }, [receiptData]);

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

  // Auto-print when dialog opens if autoPrint is true
  useEffect(() => {
    if (isOpen && autoPrint && receiptData && receiptRef.current) {
      // Small delay to ensure the dialog is fully rendered
      const timer = setTimeout(() => {
        if (receiptRef.current) {
          const printWindow = window.open("", "_blank");
          if (printWindow) {
            printWindow.document.write(`
              <html>
                <head>
                  <title>Receipt #${receiptData.id}</title>
                  <style>
                    body {
                      font-family: 'Courier New', monospace;
                      font-size: 12px;
                      line-height: 1.4;
                      margin: 0;
                      padding: 20px;
                      background: white;
                    }
                    .receipt {
                      max-width: 300px;
                      margin: 0 auto;
                      background: white;
                      padding: 20px;
                      border: 1px solid #ddd;
                    }
                    @media print {
                      body { margin: 0; padding: 0; }
                      .receipt { border: none; box-shadow: none; }
                    }
                  </style>
                </head>
                <body>
                  ${receiptRef.current.innerHTML}
                </body>
              </html>
            `);
            printWindow.document.close();
            printWindow.print();
            printWindow.close();
          }
        }
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [isOpen, autoPrint, receiptData]);

  if (!receiptData) return null;

  // const handlePrint = useCallback(() => {
  //   if (receiptRef.current) {
  //     const printWindow = window.open("", "_blank");
  //     if (printWindow) {
  //       printWindow.document.write(`
  //         <html>
  //           <head>
  //             <title>Receipt #${receiptData.id}</title>
  //             <style>
  //               body {
  //                 font-family: 'Courier New', monospace;
  //                 font-size: 11px;
  //                 line-height: 1.2;
  //                 margin: 0;
  //                 padding: 0;
  //                 background: white;
  //               }
  //               .receipt {
  //                 width: 80mm;
  //                 max-width: 80mm;
  //                 margin: 0 auto;
  //                 background: white;
  //                 padding: 2mm;
  //                 box-sizing: border-box;
  //               }
  //               .header {
  //                 text-align: center;
  //                 border-bottom: 2px solid #000;
  //                 padding-bottom: 3mm;
  //                 margin-bottom: 4mm;
  //               }
  //               .business-name {
  //                 font-size: 14px;
  //                 font-weight: bold;
  //                 margin-bottom: 1mm;
  //               }
  //               .business-info {
  //                 font-size: 9px;
  //                 line-height: 1.1;
  //               }
  //               .receipt-info {
  //                 margin-bottom: 4mm;
  //                 font-size: 9px;
  //               }
  //               .items {
  //                 margin-bottom: 4mm;
  //               }
  //               .item {
  //                 margin-bottom: 2mm;
  //                 font-size: 9px;
  //               }
  //               .item-line {
  //                 display: flex;
  //                 justify-content: space-between;
  //                 margin-bottom: 1mm;
  //               }
  //               .item-details {
  //                 font-size: 8px;
  //                 color: #666;
  //                 margin-left: 3mm;
  //               }
  //               .totals {
  //                 border-top: 1px solid #000;
  //                 padding-top: 3mm;
  //                 margin-top: 4mm;
  //               }
  //               .total-line {
  //                 display: flex;
  //                 justify-content: space-between;
  //                 margin-bottom: 1mm;
  //                 font-size: 9px;
  //               }
  //               .final-total {
  //                 font-weight: bold;
  //                 font-size: 11px;
  //                 border-top: 1px solid #000;
  //                 padding-top: 2mm;
  //                 margin-top: 2mm;
  //               }
  //               .payment-info {
  //                 margin-top: 4mm;
  //                 padding-top: 3mm;
  //                 border-top: 1px dashed #0000004D;
  //                 font-size: 9px;
  //               }
  //               .footer {
  //                 text-align: center;
  //                 margin-top: 5mm;
  //                 padding-top: 3mm;
  //                 border-top: 1px dashed #0000004D;
  //                 font-size: 8px;
  //               }
  //               @media print {
  //                 @page {
  //                   size: 80mm auto;
  //                   margin: 0;
  //                 }
  //                 body {
  //                   margin: 0;
  //                   padding: 0;
  //                   -webkit-print-color-adjust: exact;
  //                   color-adjust: exact;
  //                 }
  //                 .receipt {
  //                   border: none;
  //                   box-shadow: none;
  //                   width: 80mm;
  //                   padding: 2mm;
  //                 }
  //               }
  //             </style>
  //           </head>
  //           <body>
  //             ${receiptRef.current.innerHTML}
  //           </body>
  //         </html>
  //       `);
  //       printWindow.document.close();
  //       printWindow.print();
  //       printWindow.close();
  //     }
  //   }
  // }, [receiptData]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md w-full max-h-[95vh] h-auto flex flex-col p-0 pt-2">
        {/* Scrollable Receipt Container */}
        <div className="flex-1 overflow-y-auto px-6 py-2">
          <div ref={receiptRef} className="receipt bg-white text-black" style={{ width: "100%", maxWidth: "120mm", padding: "4mm", margin: "0 auto", border: "1px solid #ddd", fontFamily: "Courier New, monospace", fontSize: "16px", lineHeight: "1.2", transform: "scale(1)", transformOrigin: "top center" }}>
            {/* Header */}
            <div className="header text-center border-b-2 border-black/25" style={{ paddingBottom: "4.5mm", marginBottom: "6mm" }}>
              <div className="business-name font-bold" style={{ fontSize: "21px", marginBottom: "1.5mm" }}>
                {businessInfo.name}
              </div>
              <div className="business-info" style={{ fontSize: "13.5px", lineHeight: "1.1" }}>
                <div>{businessInfo.address}</div>
                <div>Phone: {businessInfo.phone}</div>
                {businessInfo.taxId && <div>Tax ID: {businessInfo.taxId}</div>}
              </div>
            </div>

            {/* Receipt Info */}
            <div className="receipt-info" style={{ fontSize: "13.5px", marginBottom: "6mm" }}>
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
            <div className="items" style={{ marginBottom: "6mm" }}>
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
            <div className="totals border-t border-black/25" style={{ paddingTop: "4.5mm", marginTop: "6mm" }}>
              <div className="final-total flex justify-between font-bold" style={{ fontSize: "16.5px" }}>
                <span>TOTAL:</span>
                <span>{formatCurrency(receiptData.total)}</span>
              </div>
            </div>

            {/* Payment Info */}
            <div className="payment-info border-t border-dashed border-black/30" style={{ marginTop: "6mm", paddingTop: "4.5mm", fontSize: "13.5px" }}>
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
            <div className="footer text-center border-t border-dashed border-black/30" style={{ marginTop: "7.5mm", paddingTop: "4.5mm", fontSize: "12px" }}>
              <div>oOps! dont forget to visit us again soon!</div>
            </div>
          </div>
        </div>

        <DialogFooter className="flex p-0 gap-0 flex-shrink-0 border-t border-gray-200">
          <Button className="flex-1 h-14 rounded-bl-lg border-0 border-r border-gray-200 bg-white hover:bg-gray-50 text-gray-700 font-medium transition-colors" variant="ghost" onClick={onClose}>
            Close
          </Button>
          <Button className="flex-1 h-14 rounded-br-lg border-0 bg-blue-600 hover:bg-blue-700 text-white font-medium transition-colors" onClick={handlePrint}>
            <Printer className="w-5 h-5 mr-2" />
            Print
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ReceiptPrinterProps } from "@/types/inventory";
import { formatCurrency } from "@/utils/conversionLogic";
import { Download, Printer } from "lucide-react";
import React, { useEffect, useRef } from "react";

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

  const handlePrint = () => {
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
  };

  const handleDownload = () => {
    if (receiptRef.current) {
      const receiptContent = receiptRef.current.innerHTML;
      const blob = new Blob(
        [
          `
        <html>
          <head>
            <title>Receipt #${receiptData.id}</title>
            <style>
              body { font-family: 'Courier New', monospace; font-size: 11px; line-height: 1.2; margin: 0; padding: 2mm; }
              .receipt { width: 80mm; max-width: 80mm; margin: 0 auto; padding: 2mm; box-sizing: border-box; }
              /* 80mm thermal receipt styles */
            </style>
          </head>
          <body>${receiptContent}</body>
        </html>
      `
        ],
        { type: "text/html" }
      );

      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `receipt-${receiptData.id}.html`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-sm h-auto overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Printer className="w-5 h-5" />
            <span>Receipt Preview</span>
          </DialogTitle>
          <DialogDescription>Review and print the transaction receipt</DialogDescription>
        </DialogHeader>

        <div ref={receiptRef} className="receipt bg-white text-black" style={{ width: "100%", maxWidth: "60mm", padding: "2mm", margin: "0 auto", border: "1px solid #ddd", fontFamily: "Courier New, monospace", fontSize: "11px", lineHeight: "1.2" }}>
          {/* Header */}
          <div className="header text-center border-b-2 border-black/25" style={{ paddingBottom: "3mm", marginBottom: "4mm" }}>
            <div className="business-name font-bold" style={{ fontSize: "14px", marginBottom: "1mm" }}>
              {businessInfo.name}
            </div>
            <div className="business-info" style={{ fontSize: "9px", lineHeight: "1.1" }}>
              <div>{businessInfo.address}</div>
              <div>Phone: {businessInfo.phone}</div>
              {businessInfo.taxId && <div>Tax ID: {businessInfo.taxId}</div>}
            </div>
          </div>

          {/* Receipt Info */}
          <div className="receipt-info" style={{ fontSize: "9px", marginBottom: "4mm" }}>
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
          <div className="items" style={{ marginBottom: "4mm" }}>
            {receiptData.items.map((item, index) => (
              <div key={index} className="item" style={{ marginBottom: "2mm", fontSize: "9px" }}>
                <div className="item-line flex justify-between" style={{ marginBottom: "1mm" }}>
                  <span className="flex-1">{item.name}</span>
                  <span>{formatCurrency(item.totalPrice)}</span>
                </div>
                <div className="item-details text-black/50" style={{ fontSize: "8px", marginLeft: "3mm" }}>
                  {item.quantity} × {formatCurrency(item.unitPrice)}
                </div>
              </div>
            ))}
          </div>

          {/* Totals */}
          <div className="totals border-t border-black/25" style={{ paddingTop: "3mm", marginTop: "4mm" }}>
            <div className="total-line flex justify-between" style={{ marginBottom: "1mm", fontSize: "9px" }}>
              <span>Subtotal:</span>
              <span>{formatCurrency(receiptData.subtotal)}</span>
            </div>
            <div className="total-line flex justify-between" style={{ marginBottom: "1mm", fontSize: "9px" }}>
              <span>Tax (10%):</span>
              <span>{formatCurrency(receiptData.tax)}</span>
            </div>
            <div className="final-total flex justify-between font-bold border-t border-black/25" style={{ fontSize: "11px", paddingTop: "2mm", marginTop: "2mm" }}>
              <span>TOTAL:</span>
              <span>{formatCurrency(receiptData.total)}</span>
            </div>
          </div>

          {/* Payment Info */}
          <div className="payment-info border-t border-dashed border-black/30" style={{ marginTop: "4mm", paddingTop: "3mm", fontSize: "9px" }}>
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
          <div className="footer text-center border-t border-dashed border-black/30" style={{ marginTop: "5mm", paddingTop: "3mm", fontSize: "8px" }}>
            <div>oOps! dont forget to visit us again soon!</div>
          </div>
        </div>

        <DialogFooter className="flex justify-between">
          <div className="flex space-x-2">
            <Button variant="outline" size="sm" onClick={handleDownload}>
              <Download className="w-4 h-4 mr-2" />
              Download
            </Button>
            {/* <Button variant="outline" size="sm" disabled>
              <Mail className="w-4 h-4 mr-2" />
              Email
            </Button>
            <Button variant="outline" size="sm" disabled>
              <Share2 className="w-4 h-4 mr-2" />
              Share
            </Button> */}
          </div>
          <div className="flex space-x-2">
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
            <Button onClick={handlePrint}>
              <Printer className="w-4 h-4 mr-2" />
              Print
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

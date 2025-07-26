import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ReceiptPrinterProps } from "@/types/inventory";
import { formatCurrency } from "@/utils/conversionLogic";
import { Download, Mail, Printer, Share2 } from "lucide-react";
import React, { useRef } from "react";

export const ReceiptPrinter: React.FC<ReceiptPrinterProps> = ({
  isOpen,
  onClose,
  receiptData,
  businessInfo = {
    name: "Your Business Name",
    address: "123 Business Street, City, State 12345",
    phone: "(555) 123-4567",
    email: "info@yourbusiness.com",
    taxId: "TAX-123456789"
  }
}) => {
  const receiptRef = useRef<HTMLDivElement>(null);

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
                .header {
                  text-align: center;
                  border-bottom: 2px solid #000;
                  padding-bottom: 10px;
                  margin-bottom: 15px;
                }
                .business-name {
                  font-size: 18px;
                  font-weight: bold;
                  margin-bottom: 5px;
                }
                .business-info {
                  font-size: 10px;
                  line-height: 1.2;
                }
                .receipt-info {
                  margin-bottom: 15px;
                  font-size: 11px;
                }
                .items {
                  margin-bottom: 15px;
                }
                .item {
                  margin-bottom: 8px;
                  font-size: 11px;
                }
                .item-line {
                  display: flex;
                  justify-content: space-between;
                  margin-bottom: 2px;
                }
                .item-details {
                  font-size: 10px;
                  color: #666;
                  margin-left: 10px;
                }
                .totals {
                  border-top: 1px solid #000;
                  padding-top: 10px;
                  margin-top: 15px;
                }
                .total-line {
                  display: flex;
                  justify-content: space-between;
                  margin-bottom: 3px;
                  font-size: 11px;
                }
                .final-total {
                  font-weight: bold;
                  font-size: 14px;
                  border-top: 1px solid #000;
                  padding-top: 5px;
                  margin-top: 5px;
                }
                .payment-info {
                  margin-top: 15px;
                  padding-top: 10px;
                  border-top: 1px dashed #000;
                  font-size: 11px;
                }
                .footer {
                  text-align: center;
                  margin-top: 20px;
                  padding-top: 10px;
                  border-top: 1px dashed #000;
                  font-size: 10px;
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
              body { font-family: 'Courier New', monospace; font-size: 12px; line-height: 1.4; margin: 20px; }
              .receipt { max-width: 300px; margin: 0 auto; }
              /* Add more styles as needed */
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
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Printer className="w-5 h-5" />
            <span>Receipt Preview</span>
          </DialogTitle>
          <DialogDescription>Review and print the transaction receipt</DialogDescription>
        </DialogHeader>

        <div ref={receiptRef} className="receipt bg-white text-black p-6 border border-gray-300">
          {/* Header */}
          <div className="header text-center border-b-2 border-black pb-3 mb-4">
            <div className="business-name text-lg font-bold mb-1">{businessInfo.name}</div>
            <div className="business-info text-xs leading-tight">
              <div>{businessInfo.address}</div>
              <div>Phone: {businessInfo.phone}</div>
              <div>Email: {businessInfo.email}</div>
              {businessInfo.taxId && <div>Tax ID: {businessInfo.taxId}</div>}
            </div>
          </div>

          {/* Receipt Info */}
          <div className="receipt-info text-xs mb-4">
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
          <div className="items mb-4">
            {receiptData.items.map((item, index) => (
              <div key={index} className="item mb-2 text-xs">
                <div className="item-line flex justify-between">
                  <span className="flex-1">{item.name}</span>
                  <span>{formatCurrency(item.totalPrice)}</span>
                </div>
                <div className="item-details text-xs text-gray-600 ml-2">
                  {item.quantity} × {formatCurrency(item.unitPrice)} ({item.type})
                </div>
              </div>
            ))}
          </div>

          {/* Totals */}
          <div className="totals border-t border-black pt-3">
            <div className="total-line flex justify-between text-xs">
              <span>Subtotal:</span>
              <span>{formatCurrency(receiptData.subtotal)}</span>
            </div>
            <div className="total-line flex justify-between text-xs">
              <span>Tax (10%):</span>
              <span>{formatCurrency(receiptData.tax)}</span>
            </div>
            <div className="final-total flex justify-between font-bold text-sm border-t border-black pt-2 mt-2">
              <span>TOTAL:</span>
              <span>{formatCurrency(receiptData.total)}</span>
            </div>
          </div>

          {/* Payment Info */}
          <div className="payment-info border-t border-dashed border-black pt-3 mt-4 text-xs">
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
          <div className="footer text-center border-t border-dashed border-black pt-3 mt-5 text-xs">
            <div className="mb-2">Thank you for your business!</div>
            <div className="mb-1">Please keep this receipt for your records</div>
            <div>Visit us again soon!</div>
          </div>
        </div>

        <DialogFooter className="flex justify-between">
          <div className="flex space-x-2">
            <Button variant="outline" size="sm" onClick={handleDownload}>
              <Download className="w-4 h-4 mr-2" />
              Download
            </Button>
            <Button variant="outline" size="sm" disabled>
              <Mail className="w-4 h-4 mr-2" />
              Email
            </Button>
            <Button variant="outline" size="sm" disabled>
              <Share2 className="w-4 h-4 mr-2" />
              Share
            </Button>
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

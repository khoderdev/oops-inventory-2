import React from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import PrinterSelector from "@/components/common/PrinterSelector";
import { ReportGenerator } from "../../analytics/ReportGenerator";
import { PaymentDialog } from "../PaymentDialog";
import { DiscountDialog } from "../DiscountDialog";
import { NotesDialog } from "../NotesDialog";
import { ItemNotesDialog } from "../ItemNotesDialog";
import { VoidOrderDialog } from "../VoidOrderDialog";
import { POSClientOrders } from "../POSClientOrders";
import { TablesLayout } from "../TablesLayout";
import { ReceiptPrinter } from "../ReceiptPrinter";
import { AlertCircle, AlertTriangle, Check, FileText } from "lucide-react";
import { POSDialogsProps } from "@/types/pos";

export const POSDialogs: React.FC<POSDialogsProps> = ({
  showPaymentDialog,
  setShowPaymentDialog,
  total,
  paymentAmount,
  setPaymentAmount,
  onPayment,
  isLoading,
  showReceiptDialog,
  setShowReceiptDialog,
  lastSaleData,
  shouldAutoPrint,
  setShouldAutoPrint,
  showDiscountDialog,
  setShowDiscountDialog,
  discountAmount,
  onDiscountAmountChange,
  subtotal,
  onApplyDiscount,
  showNotesDialog,
  setShowNotesDialog,
  orderNotes,
  setOrderNotes,
  showItemNotesDialog,
  setShowItemNotesDialog,
  selectedItemForNotes,
  setSelectedItemForNotes,
  onItemNotesChange,
  showVoidDialog,
  setShowVoidDialog,
  currentOrder,
  orderLoading,
  onConfirmVoid,
  showOrdersDialog,
  setShowOrdersDialog,
  onOrderSelect,
  onOrderStatusChange,
  showTablesLayout,
  setShowTablesLayout,
  tables,
  selectedTable,
  onTableSelect,
  onCloseTablesLayout,
  tableOrders,
  showReportsDialog,
  setShowReportsDialog,
  showPrinterSelector,
  setShowPrinterSelector,
  printerSelectionContext,
  selectedPrinter,
  onPrinterSelect,
  onClosePrinterSelector,
  hasSavedPrinter,
  getSavedPrinter,
  clearPrinterSelection,
  showUnsavedDialog,
  setShowUnsavedDialog,
  onSaveOrder,
  showNegativeStockDialog,
  setShowNegativeStockDialog,
  negativeStockWarnings,
  successMessage,
  error
}) => {
  return (
    <>
      <PaymentDialog isOpen={showPaymentDialog} onClose={() => setShowPaymentDialog(false)} total={total} paymentAmount={paymentAmount} onPaymentAmountChange={setPaymentAmount} onPayment={onPayment} isLoading={isLoading} />

      {/* Receipt Printer Dialog */}
      {showReceiptDialog && lastSaleData && (
        <ReceiptPrinter
          isOpen={showReceiptDialog}
          onClose={() => {
            setShowReceiptDialog(false);
            setShouldAutoPrint(false);
          }}
          receiptData={lastSaleData}
          autoPrint={shouldAutoPrint}
        />
      )}

      {/* Discount Dialog */}
      <DiscountDialog isOpen={showDiscountDialog} onClose={() => setShowDiscountDialog(false)} discountAmount={discountAmount} onDiscountAmountChange={onDiscountAmountChange} onDiscount={() => {}} orderSubtotal={subtotal} onApplyDiscount={onApplyDiscount} />

      {/* Notes Dialog */}
      <NotesDialog isOpen={showNotesDialog} onClose={() => setShowNotesDialog(false)} notes={orderNotes} onNotesChange={setOrderNotes} />

      {/* Item Notes Dialog */}
      <ItemNotesDialog
        key={selectedItemForNotes?.id || "no-item"}
        isOpen={showItemNotesDialog}
        onClose={() => {
          setShowItemNotesDialog(false);
          setSelectedItemForNotes(null);
        }}
        item={selectedItemForNotes}
        onNotesChange={onItemNotesChange}
      />

      {/* Void Order Dialog */}
      <VoidOrderDialog isOpen={showVoidDialog} onClose={() => setShowVoidDialog(false)} onConfirm={onConfirmVoid} order={currentOrder} isLoading={orderLoading} />

      {/* Orders Management Dialog */}
      <POSClientOrders isOpen={showOrdersDialog} onClose={() => setShowOrdersDialog(false)} onOrderSelect={onOrderSelect} onOrderStatusChange={onOrderStatusChange} />

      {/* Tables Layout Dialog */}
      {showTablesLayout && (
        <Dialog open={showTablesLayout} onOpenChange={setShowTablesLayout}>
          <DialogContent className="w-screen h-screen max-w-none max-h-none m-0 p-0 !z-50 bg-white overflow-hidden">
            <DialogTitle className="sr-only">Tables Layout</DialogTitle>
            <DialogDescription className="sr-only">Manage restaurant table layout and assignments</DialogDescription>
            <div className="w-full h-full flex flex-col overflow-hidden">
              <TablesLayout tables={tables} selectedTable={selectedTable} onTableSelect={onTableSelect} onClose={onCloseTablesLayout} tableOrders={tableOrders} />
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Reports Dialog */}
      <Dialog open={showReportsDialog} onOpenChange={setShowReportsDialog}>
        <DialogContent className="w-screen h-screen max-w-none !z-50 max-h-none m-0 p-0 bg-white overflow-hidden">
          <DialogTitle className="sr-only">Reports & Analytics</DialogTitle>
          <DialogDescription className="sr-only">View sales reports, analytics, and business insights</DialogDescription>
          <div className="w-full h-full flex flex-col overflow-hidden">
            <div className="flex-shrink-0 flex items-center justify-between p-4 bg-primary">
              <div className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-white" />
                <h2 className="text-2xl font-bold text-white">Reports & Analytics</h2>
              </div>
            </div>
            <ReportGenerator className="flex-1 overflow-hidden" />
          </div>
        </DialogContent>
      </Dialog>

      {/* Printer Selector Modal */}
      <Dialog open={showPrinterSelector} onOpenChange={setShowPrinterSelector}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Select Printer</DialogTitle>
            <DialogDescription>
              {printerSelectionContext === "payment" ? "Choose a printer for the payment receipt" : "Choose a printer to print the receipt"}
              {hasSavedPrinter() && (
                <div className="mt-2 p-2 bg-blue-50 rounded-md border border-blue-200">
                  <p className="text-sm text-blue-800">
                    <strong>Current saved printer:</strong> {getSavedPrinter()?.name}
                  </p>
                  <p className="text-xs text-blue-600 mt-1">Selecting a new printer will save it for future use.</p>
                </div>
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <PrinterSelector onPrinterSelect={onPrinterSelect} selectedPrinterId={selectedPrinter?.id || null} label="Available Printers" showStatus={true} showTestButton={true} size="md" />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={onClosePrinterSelector}>
              Cancel
            </Button>
            {hasSavedPrinter() && (
              <Button
                variant="outline"
                onClick={() => {
                  clearPrinterSelection();
                  onClosePrinterSelector();
                }}
                className="text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                Clear Saved Printer
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Unsaved Changes Dialog */}
      <Dialog open={showUnsavedDialog} onOpenChange={setShowUnsavedDialog}>
        <DialogContent className="w-screen h-screen max-w-none max-h-none m-0 p-0 bg-white overflow-hidden">
          <div className="w-full h-full flex flex-col overflow-hidden">
            <DialogHeader className="flex-shrink-0 p-6 border-b">
              <DialogTitle className="flex items-center space-x-2">
                <AlertTriangle className="w-5 h-5 text-amber-500" />
                <span>Unsaved Changes</span>
              </DialogTitle>
              <DialogDescription>You have unsaved changes in your current order. Would you like to save them?</DialogDescription>
            </DialogHeader>

            <div className="flex-1 flex items-center justify-center p-6">
              <div className="text-center space-y-4">
                <div className="text-lg text-gray-600">Your current order has unsaved changes that will be lost if you continue.</div>
                <div className="text-sm text-gray-500">Choose whether to save your progress or discard the changes.</div>
              </div>
            </div>

            <DialogFooter className="flex-shrink-0 p-6 border-t">
              <Button
                variant="outline"
                onClick={() => {
                  setShowUnsavedDialog(false);
                }}
              >
                Discard Changes
              </Button>
              <Button
                onClick={() => {
                  onSaveOrder();
                  setShowUnsavedDialog(false);
                }}
              >
                Save Order
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>

      {/* Negative Stock Warning Dialog */}
      <Dialog open={showNegativeStockDialog} onOpenChange={setShowNegativeStockDialog}>
        <DialogContent className="w-screen h-screen max-w-none max-h-none m-0 p-0 bg-white overflow-hidden">
          <div className="w-full h-full flex flex-col overflow-hidden">
            <DialogHeader className="flex-shrink-0 p-6 border-b">
              <DialogTitle className="flex items-center space-x-2">
                <AlertTriangle className="w-5 h-5 text-amber-500" />
                <span>Stock Warning</span>
              </DialogTitle>
              <DialogDescription>Some items have low or negative stock levels</DialogDescription>
            </DialogHeader>

            <div className="flex-1 p-6 overflow-y-auto">
              <div className="space-y-2">
                {negativeStockWarnings.map((warning, index) => (
                  <Alert key={index}>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      <strong>{warning.materialName}</strong>: Low stock - Available: {warning.availableQuantity}, Required: {warning.requiredQuantity}
                    </AlertDescription>
                  </Alert>
                ))}
              </div>
            </div>

            <DialogFooter className="flex-shrink-0 p-6 border-t">
              <Button onClick={() => setShowNegativeStockDialog(false)}>Acknowledge</Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>

      {/* Success/Error Messages */}
      {successMessage && (
        <div className="fixed top-4 right-4 z-50">
          <Alert className="bg-green-50 border-green-200">
            <Check className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">{successMessage}</AlertDescription>
          </Alert>
        </div>
      )}

      {error && (
        <div className="fixed top-4 right-4 z-50">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        </div>
      )}
    </>
  );
};

import { PrinterSelectorModal } from "@/components/common/PrinterSelectorModal";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { POSClientProps } from "@/types/inventory";
import { Employee } from "@/types/employee";
import { AlertCircle, AlertTriangle, Check, CheckCircle, DollarSign, FileText, GripVertical, Trash2, XCircle } from "lucide-react";
import React from "react";
import { ReportGenerator } from "../analytics/ReportGenerator";
import { ActionBar } from "./ActionBar";
import { CategoryTabs } from "./CategoryTabs";
import { DiscountDialog } from "./DiscountDialog";
import { ItemNotesDialog } from "./ItemNotesDialog";
import { NotesDialog } from "./NotesDialog";
import { OrderItemsList } from "./OrderItemsList";
import { OrderSummary } from "./OrderSummary";
import { PaymentDialog } from "./PaymentDialog";
import { POSClientOrders } from "./POSClientOrders";
import { VirtualizedProductGrid } from "./VirtualizedProductGrid";
import { ReceiptPrinter } from "./ReceiptPrinter";
import { TablesLayout } from "./TablesLayout";
import { VoidOrderDialog } from "./VoidOrderDialog";
import { formatCurrency } from "@/utils/conversionLogic";
import { usePOS } from "./usePOS";

export const POSClient: React.FC<POSClientProps> = ({ sectionAssignments, onSaleComplete, onOrderSelect, selectedOrderForPOS, onOrderProcessed, refreshCountsRef }) => {
  // Use the custom hook to get all state and functions
  const posState = usePOS({ sectionAssignments, onSaleComplete, onOrderSelect, selectedOrderForPOS, onOrderProcessed, refreshCountsRef });

  // Destructure the needed values from the hook
  const {
    cart,
    isLoading,
    error,
    successMessage,
    activeCategory,
    setActiveCategory,
    showPaymentDialog,
    setShowPaymentDialog,
    showReceiptDialog,
    setShowReceiptDialog,
    lastSaleData,
    orderType,
    selectedTable,
    selectedEmployee,
    hasUnsavedChanges,
    showSuccessCheckmark,
    showVoidDialog,
    setShowVoidDialog,
    showOrdersDialog,
    showReportsDialog,
    setShowReportsDialog,
    activeView,
    setActiveView,
    incompleteTableOrdersCount,
    incompleteDeliveryTakeawayCount,
    leftPanelWidth,
    rightPanelPixelWidth,
    isResizing,
    showDiscountDialog,
    setShowDiscountDialog,
    showNotesDialog,
    setShowNotesDialog,
    showItemNotesDialog,
    selectedItemForNotes,
    orderNotes,
    setOrderNotes,
    appliedDiscount,
    discountAmount,
    showPrinterSelector,
    printerSelectionContext,
    containerRef,
    categories,
    subtotal,
    total,
    filteredPosItems,
    currentOrder,
    selectedPrinter,
    addToCart,
    updateCartQuantity,
    showError,
    showSuccess,
    paymentAmount,
    setPaymentAmount,
    handleCloseOrdersDialog,
    handleOrderSelectCallback,
    clearCartWithAnimation,
    resetToTakeaway,
    clearCart,
    handleShowReports,
    handleShowDiscount,
    handleDiscountAmountChange,
    handleApplyDiscount,
    handleRemoveDiscount,
    handleItemNotesChange,
    handleShowItemNotes,
    handleCloseItemNotes,
    handlePaymentWithPrinter,
    handlePrintReceiptWithPrinter,
    handlePrinterSelect,
    handleClosePrinterSelector,
    handleShowPrinterSettings,
    fetchIncompleteOrders,
    handleOrderTypeChange,
    handleTableSelect,
    handleTableSelection,
    handleCloseTablesLayout,
    handleEmployeeSelection,
    handlePrintReceipt,
    handleVoidOrder,
    handleConfirmVoid,
    handleShowOrders,
    handleCancelOrder,
    handleManualSave,
    handlePayment,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    fetchTablesData,
    refreshAllCounts,
    formatItemsForPrinterCallback,
    printItemsToAssignedPrinters,
    handleOrderSelect,
    tables,
    negativeStockWarnings,
    showNegativeStockDialog,
    setShowNegativeStockDialog,
    shouldAutoPrint,
    setShouldAutoPrint,
    isSaving,
    setIsSaving,
    showTablesLayout,
    setShowTablesLayout
  } = posState;

  // Wrapper functions to match OrderItemsList expected signatures
  const handleTableSelectWrapper = () => {
    // This should trigger table selection UI
    setShowTablesLayout(true);
  };

  const handleEmployeeSelectWrapper = (employee: Employee) => {
    handleEmployeeSelection(employee);
  };

  // Render the POS interface
  return (
    <div ref={containerRef} className="flex h-screen w-screen bg-gray-50 overflow-hidden fixed inset-0">
      {/* Left Panel - Cart and Order Management */}
      <div className="flex flex-col bg-white border-r border-gray-200 transition-all duration-200 h-screen" style={{ width: `${leftPanelWidth}%` }}>
        {/* Order Type/Table Selection - Fixed height at top (matches CategoryTabs) */}
        <div className="border-b border-gray-200 bg-white flex-shrink-0 h-16">
          {/* This space can be used for order type/table info header if needed */}
          <div className="h-full flex items-center px-4">
            <span className="text-sm font-medium text-gray-700">
              {orderType === 'table' && selectedTable ? `Table ${selectedTable.number}` : 
               orderType === 'delivery' ? 'Delivery Order' : 
               orderType === 'takeaway' ? 'Takeaway Order' : 'Current Order'}
            </span>
          </div>
        </div>

        {/* Order Items List - Takes remaining space (matches Product Grid) */}
        <div className="flex-1 overflow-hidden min-h-0">
          <OrderItemsList
            cart={cart}
            updateCartQuantity={updateCartQuantity}
            orderType={orderType}
            selectedTable={selectedTable}
            selectedEmployee={selectedEmployee}
            onOrderTypeChange={handleOrderTypeChange}
            onTableSelect={handleTableSelectWrapper}
            onEmployeeSelect={handleEmployeeSelectWrapper}
            incompleteTableOrdersCount={incompleteTableOrdersCount}
            orderStatus={currentOrder?.status}
            isOrderCompleted={currentOrder?.status === "paid" || currentOrder?.status === "served"}
            discountReason={appliedDiscount?.reason}
            leftPanelPixelWidth={rightPanelPixelWidth}
            onShowItemNotes={handleShowItemNotes}
          />
        </div>

        {/* Order Summary - Fixed height at bottom (matches ActionBar) */}
        <div className="bg-white flex-shrink-0 h-[12.4rem]">
          <OrderSummary cart={cart} subtotal={subtotal} total={total} appliedDiscount={appliedDiscount} onPaymentClick={() => setShowPaymentDialog(true)} onSaveClick={clearCart} orderStatus={currentOrder?.status} isOrderCompleted={currentOrder?.status === "paid" || currentOrder?.status === "served"} onRemoveDiscount={handleRemoveDiscount} />
        </div>
      </div>

      {/* Resize Handle */}
      <div className="w-1 bg-gray-300 cursor-col-resize hover:bg-blue-400 transition-colors duration-200 flex-shrink-0" onMouseDown={handleMouseDown} />

      {/* Right Panel - Product Grid and Categories */}
      <div className="flex flex-col bg-white h-screen" style={{ width: `${100 - leftPanelWidth}%` }}>
        {/* Category Tabs - Fixed height at top */}
        <div className="border-b border-gray-200 bg-white flex-shrink-0 h-16">
          <CategoryTabs categories={categories} activeCategory={activeCategory} onCategoryChange={setActiveCategory} />
        </div>

        {/* Product Grid - Takes remaining space */}
        <div className="flex-1 overflow-hidden min-h-0">
          <VirtualizedProductGrid posItems={filteredPosItems} onAddToCart={addToCart} isLoading={isLoading} rightPanelPixelWidth={containerRef.current ? (containerRef.current.offsetWidth * (100 - leftPanelWidth)) / 100 : 800} />
        </div>

        {/* Action Bar - Fixed height at bottom */}
        <div className="bg-white flex-shrink-0 h-[7.8rem]">
          <ActionBar hasUnsavedChanges={hasUnsavedChanges} incompleteOrdersCount={incompleteTableOrdersCount} incompleteDeliveryTakeawayCount={incompleteDeliveryTakeawayCount} onSaveOrder={handleManualSave} onShowOrders={handleShowOrders} onShowReports={handleShowReports} onCancelOrder={handleCancelOrder} onVoidOrder={handleVoidOrder} onPrintReceipt={handlePrintReceipt} canPrintReceipt={cart.length > 0} canVoidOrder={currentOrder?.id ? true : false} isOrderLoading={isSaving} />
        </div>
      </div>

      {/* Dialogs */}
      {showPaymentDialog && <PaymentDialog isOpen={showPaymentDialog} onClose={() => setShowPaymentDialog(false)} total={total} onPayment={handlePaymentWithPrinter} paymentAmount={paymentAmount} onPaymentAmountChange={setPaymentAmount} isLoading={false} />}

      {showReceiptDialog && lastSaleData && <ReceiptPrinter isOpen={showReceiptDialog} onClose={() => setShowReceiptDialog(false)} receiptData={lastSaleData} onPrint={handlePrintReceiptWithPrinter} />}

      {showDiscountDialog && <DiscountDialog isOpen={showDiscountDialog} onClose={() => setShowDiscountDialog(false)} discountAmount={discountAmount} onDiscountAmountChange={handleDiscountAmountChange} onDiscount={() => {}} orderSubtotal={subtotal} onApplyDiscount={handleApplyDiscount} />}

      {showItemNotesDialog && selectedItemForNotes && <ItemNotesDialog isOpen={showItemNotesDialog} onClose={handleCloseItemNotes} item={selectedItemForNotes} onNotesChange={handleItemNotesChange} />}

      {showNotesDialog && <NotesDialog isOpen={showNotesDialog} onClose={() => setShowNotesDialog(false)} notes={orderNotes} onNotesChange={setOrderNotes} />}

      {showVoidDialog && <VoidOrderDialog isOpen={showVoidDialog} onClose={() => setShowVoidDialog(false)} onConfirm={(reason: string, restoreStock: boolean) => handleConfirmVoid()} order={currentOrder} />}

      {showOrdersDialog && <POSClientOrders isOpen={showOrdersDialog} onClose={handleCloseOrdersDialog} onOrderSelect={handleOrderSelectCallback} activeView={activeView} onViewChange={setActiveView} refreshTrigger={fetchIncompleteOrders} />}

      {showReportsDialog && (
        <Dialog open={showReportsDialog} onOpenChange={() => setShowReportsDialog(false)}>
          <DialogContent className="max-w-6xl max-h-[90vh] overflow-auto">
            <DialogHeader>
              <DialogTitle>Sales Reports</DialogTitle>
            </DialogHeader>
            <ReportGenerator />
          </DialogContent>
        </Dialog>
      )}

      {showTablesLayout && <TablesLayout isOpen={showTablesLayout} onClose={handleCloseTablesLayout} onTableSelect={handleTableSelection} tables={tables} refreshTables={fetchTablesData} />}

      {showPrinterSelector && <PrinterSelectorModal isOpen={showPrinterSelector} onClose={handleClosePrinterSelector} onPrinterSelect={handlePrinterSelect} context={printerSelectionContext} selectedPrinter={selectedPrinter} onShowSettings={handleShowPrinterSettings} />}

      {/* Negative Stock Warning Dialog */}
      {showNegativeStockDialog && negativeStockWarnings.length > 0 && (
        <Dialog open={showNegativeStockDialog} onOpenChange={setShowNegativeStockDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-yellow-500" />
                Stock Warning
              </DialogTitle>
              <DialogDescription>The following items have insufficient stock:</DialogDescription>
            </DialogHeader>
            <div className="space-y-2">
              {negativeStockWarnings.map((warning, index) => (
                <Alert key={index} className="border-yellow-200 bg-yellow-50">
                  <AlertCircle className="h-4 w-4 text-yellow-600" />
                  <AlertDescription className="text-yellow-800">
                    <strong>{warning.materialName}</strong>: Requested {warning.requiredQuantity}, but only {warning.availableQuantity} available
                  </AlertDescription>
                </Alert>
              ))}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowNegativeStockDialog(false)}>
                Continue Anyway
              </Button>
              <Button
                onClick={() => {
                  setShowNegativeStockDialog(false);
                  // Optionally refresh inventory
                  refreshAllCounts();
                }}
              >
                Refresh Stock
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Success/Error Messages */}
      {error && (
        <div className="fixed top-4 right-4 z-50">
          <Alert className="border-red-200 bg-red-50">
            <XCircle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-800">{error}</AlertDescription>
          </Alert>
        </div>
      )}

      {successMessage && (
        <div className="fixed top-4 right-4 z-50">
          <Alert className="border-green-200 bg-green-50">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">{successMessage}</AlertDescription>
          </Alert>
        </div>
      )}

      {showSuccessCheckmark && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 flex flex-col items-center">
            <Check className="h-16 w-16 text-green-500 mb-4" />
            <p className="text-lg font-semibold text-gray-900">Order Completed!</p>
          </div>
        </div>
      )}
    </div>
  );
};

import React, { useEffect, useCallback } from "react";
import { POSClientProps, OrderSummary as OrderSummaryType } from "@/types/inventory";
import { usePOSState } from "./hooks/usePOSState";
import { usePOSData } from "./hooks/usePOSData";
import { usePOSHandlers } from "./hooks/usePOSHandlers";
import { usePOSCart } from "./hooks/usePOSCart";
import { POSLayout } from "./components/POSLayout";
import { POSDialogs } from "./components/POSDialogs";

export const POSClient: React.FC<POSClientProps> = ({ sectionAssignments, onSaleComplete, onOrderSelect, onOrderProcessed }) => {
  const state = usePOSState();
  const data = usePOSData({ sectionAssignments, showError: state.showError });

  const subtotal = (state.cart || []).filter(Boolean).reduce((sum, item) => {
    if (!item || typeof item.price !== "number" || typeof item.quantity !== "number") {
      console.warn("Invalid cart item found:", item);
      return sum;
    }
    return sum + item.price * item.quantity;
  }, 0);

  const tax = 0;
  const discountAmountCalculated = state.appliedDiscount ? state.appliedDiscount.amount : 0;
  const total = Math.max(0, subtotal - discountAmountCalculated);
  const handlers = usePOSHandlers({
    cart: state.cart,
    setCart: state.setCart,
    orderType: state.orderType,
    setOrderType: state.setOrderType,
    selectedTable: state.selectedTable,
    setSelectedTable: state.setSelectedTable,
    selectedEmployee: state.selectedEmployee,
    setSelectedEmployee: state.setSelectedEmployee,
    appliedDiscount: state.appliedDiscount,
    setAppliedDiscount: state.setAppliedDiscount,
    discountAmount: state.discountAmount,
    setDiscountAmount: state.setDiscountAmount,
    orderNotes: state.orderNotes,
    setOrderNotes: state.setOrderNotes,
    paymentAmount: state.paymentAmount,
    setPaymentAmount: state.setPaymentAmount,
    lastSaleData: state.lastSaleData,
    setLastSaleData: state.setLastSaleData,
    showError: state.showError,
    showSuccess: state.showSuccess,
    clearCartWithAnimation: state.clearCartWithAnimation,
    clearCart: state.clearCart,
    setHasUnsavedChanges: state.setHasUnsavedChanges,
    setShowTablesLayout: state.setShowTablesLayout,
    setShowReceiptDialog: state.setShowReceiptDialog,
    setShouldAutoPrint: state.setShouldAutoPrint,
    setShowPaymentDialog: state.setShowPaymentDialog,
    setShowPrinterSelector: state.setShowPrinterSelector,
    setPrinterSelectionContext: state.setPrinterSelectionContext,
    printerSelectionContext: state.printerSelectionContext,
    tables: data.tables,
    setTables: data.setTables,
    menuItems: data.menuItems,
    stockEntries: data.stockEntries,
    subtotal,
    total,
    tax,
    refreshOrderData: data.refreshOrderData,
    refreshAllCounts: data.refreshAllCounts,
    fetchTablesData: data.fetchTablesData,
    onSaleComplete,
    onOrderProcessed
  });

  const cartHooks = usePOSCart({
    cart: state.cart,
    setCart: state.setCart,
    menuItems: data.menuItems,
    stockEntries: data.stockEntries,
    tables: data.tables,
    optimisticAssignments: data.optimisticAssignments,
    showSuccess: state.showSuccess,
    recalculateEmployeeDiscount: handlers.recalculateEmployeeDiscount,
    setHasUnsavedChanges: state.setHasUnsavedChanges
  });

  const fetchIncompleteOrders = useCallback(async () => {
    const counts = await data.fetchIncompleteOrders();
    state.setIncompleteOrdersCount(counts.incompleteOrdersCount);
    state.setTableOrders(counts.tableOrders);
    state.setIncompleteTableOrdersCount(counts.incompleteTableOrdersCount);
    state.setIncompleteDeliveryTakeawayCount(counts.incompleteDeliveryTakeawayCount);
  }, [data.fetchIncompleteOrders, state]);

  const handleOrderSelectCallback = useCallback(
    (order: OrderSummaryType) => {
      if (onOrderSelect) {
        onOrderSelect(order);
      }
    },
    [onOrderSelect]
  );

  const availablePosItems = data.posItems.filter(posItem => {
    const matchesSearch = posItem.name.toLowerCase().includes("") || posItem.category?.toLowerCase().includes("");
    return matchesSearch;
  });

  const categories = ["all", ...Array.from(new Set(data.posItems.map(item => item.category).filter(Boolean)))];
  const filteredPosItems = state.activeCategory === "all" ? availablePosItems : availablePosItems.filter(item => item.category === state.activeCategory);

  useEffect(() => {
    return () => {
      if (state.errorTimeoutRef.current) {
        clearTimeout(state.errorTimeoutRef.current);
      }
      if (state.successTimeoutRef.current) {
        clearTimeout(state.successTimeoutRef.current);
      }
      if (state.checkmarkTimeoutRef.current) {
        clearTimeout(state.checkmarkTimeoutRef.current);
      }
    };
  }, [state]);

  useEffect(() => {
    fetchIncompleteOrders();
    const interval = setInterval(fetchIncompleteOrders, 30000);
    return () => clearInterval(interval);
  }, [fetchIncompleteOrders]);

  return (
    <>
      <POSLayout
        leftPanelWidth={state.leftPanelWidth}
        setLeftPanelWidth={state.setLeftPanelWidth}
        rightPanelPixelWidth={state.rightPanelPixelWidth}
        setRightPanelPixelWidth={state.setRightPanelPixelWidth}
        isResizing={state.isResizing}
        setIsResizing={state.setIsResizing}
        containerRef={state.containerRef}
        activeView={state.activeView}
        setActiveView={state.setActiveView}
        cart={state.cart}
        orderType={state.orderType}
        selectedTable={state.selectedTable}
        selectedEmployee={state.selectedEmployee}
        subtotal={subtotal}
        total={total}
        hasUnsavedChanges={state.hasUnsavedChanges}
        showSuccessCheckmark={state.showSuccessCheckmark}
        currentOrder={handlers.currentOrder}
        appliedDiscount={state.appliedDiscount}
        categories={categories}
        activeCategory={state.activeCategory}
        setActiveCategory={state.setActiveCategory}
        filteredPosItems={filteredPosItems}
        isProductsLoading={data.status.isLoading}
        incompleteTableOrdersCount={state.incompleteTableOrdersCount}
        incompleteOrdersCount={state.incompleteOrdersCount}
        incompleteDeliveryTakeawayCount={state.incompleteDeliveryTakeawayCount}
        updateCartQuantity={handlers.updateCartQuantity}
        onOrderTypeChange={handlers.handleOrderTypeChange}
        onTableSelect={handlers.handleTableSelect}
        onEmployeeSelect={handlers.handleEmployeeSelection}
        onItemNotesChange={handlers.handleItemNotesChange}
        onShowItemNotes={item => {
          state.setSelectedItemForNotes(item);
          state.setShowItemNotesDialog(true);
        }}
        onRemoveDiscount={handlers.handleRemoveDiscount}
        onPaymentClick={() => {
          state.setPaymentAmount(total.toString());
          state.setShowPaymentDialog(true);
        }}
        onSaveClick={handlers.handleManualSave}
        onAddToCart={cartHooks.addToCart}
        clearCart={state.clearCart}
        onSaveOrder={handlers.handleManualSave}
        onPrintReceipt={handlers.handlePrintReceipt}
        onVoidOrder={() => state.setShowVoidDialog(true)}
        onShowOrders={() => state.setShowOrdersDialog(true)}
        onShowReports={() => state.setShowReportsDialog(true)}
        onCancelOrder={handlers.handleCancelOrder}
        onDiscount={() => state.setShowDiscountDialog(true)}
        onShowPrinterSettings={() => {
          state.setPrinterSelectionContext("manual_print");
          state.setShowPrinterSelector(true);
        }}
        hasSavedPrinter={handlers.hasSavedPrinter()}
        savedPrinterName={handlers.getSavedPrinter()?.name}
        isOrderLoading={handlers.orderLoading}
        canPrintReceipt={state.cart && state.cart.length > 0}
        canVoidOrder={!!handlers.currentOrder}
      />

      <POSDialogs
        showPaymentDialog={state.showPaymentDialog}
        setShowPaymentDialog={state.setShowPaymentDialog}
        total={total}
        paymentAmount={state.paymentAmount}
        setPaymentAmount={state.setPaymentAmount}
        onPayment={handlers.handlePayment}
        isLoading={state.isLoading}
        showReceiptDialog={state.showReceiptDialog}
        setShowReceiptDialog={state.setShowReceiptDialog}
        lastSaleData={state.lastSaleData}
        shouldAutoPrint={state.shouldAutoPrint}
        setShouldAutoPrint={state.setShouldAutoPrint}
        showDiscountDialog={state.showDiscountDialog}
        setShowDiscountDialog={state.setShowDiscountDialog}
        discountAmount={state.discountAmount}
        onDiscountAmountChange={state.setDiscountAmount}
        subtotal={subtotal}
        onApplyDiscount={handlers.handleApplyDiscount}
        showNotesDialog={state.showNotesDialog}
        setShowNotesDialog={state.setShowNotesDialog}
        orderNotes={state.orderNotes}
        setOrderNotes={state.setOrderNotes}
        showItemNotesDialog={state.showItemNotesDialog}
        setShowItemNotesDialog={state.setShowItemNotesDialog}
        selectedItemForNotes={state.selectedItemForNotes}
        setSelectedItemForNotes={state.setSelectedItemForNotes}
        onItemNotesChange={handlers.handleItemNotesChange}
        showVoidDialog={state.showVoidDialog}
        setShowVoidDialog={state.setShowVoidDialog}
        currentOrder={handlers.currentOrder}
        orderLoading={handlers.orderLoading}
        onConfirmVoid={handlers.handleConfirmVoid}
        showOrdersDialog={state.showOrdersDialog}
        setShowOrdersDialog={state.setShowOrdersDialog}
        onOrderSelect={handleOrderSelectCallback}
        onOrderStatusChange={fetchIncompleteOrders}
        showTablesLayout={state.showTablesLayout}
        setShowTablesLayout={state.setShowTablesLayout}
        tables={data.tables}
        selectedTable={state.selectedTable}
        onTableSelect={handlers.handleTableSelection}
        onCloseTablesLayout={() => state.setShowTablesLayout(false)}
        tableOrders={state.tableOrders}
        showReportsDialog={state.showReportsDialog}
        setShowReportsDialog={state.setShowReportsDialog}
        showPrinterSelector={state.showPrinterSelector}
        setShowPrinterSelector={state.setShowPrinterSelector}
        printerSelectionContext={state.printerSelectionContext}
        selectedPrinter={handlers.selectedPrinter}
        onPrinterSelect={handlers.handlePrinterSelect}
        onClosePrinterSelector={() => {
          state.setShowPrinterSelector(false);
          state.setPrinterSelectionContext(null);
        }}
        hasSavedPrinter={handlers.hasSavedPrinter}
        getSavedPrinter={handlers.getSavedPrinter}
        clearPrinterSelection={handlers.clearSelection}
        showUnsavedDialog={state.showUnsavedDialog}
        setShowUnsavedDialog={state.setShowUnsavedDialog}
        onSaveOrder={handlers.handleManualSave}
        showNegativeStockDialog={state.showNegativeStockDialog}
        setShowNegativeStockDialog={state.setShowNegativeStockDialog}
        negativeStockWarnings={state.negativeStockWarnings}
        successMessage={state.successMessage}
        error={state.error}
      />
    </>
  );
};

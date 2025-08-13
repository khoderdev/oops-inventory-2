import { useCallback } from "react";
import { ordersAPI } from "@/api/orders.api";
import { POSCartItem } from "@/types/inventory";
import { OrderSummary as OrderSummaryType } from "@/types/orders";

export const usePOSHandlers = (posState: any) => {
  const {
    // Cart and order state
    cart, setCart, currentOrder, subtotal, total, appliedDiscount, setAppliedDiscount, discountAmount, setDiscountAmount,
    
    // UI state management
    setOrderType, setSelectedTable, setShowTablesLayout, setHasUnsavedChanges, setIsPaymentCompleted, setIsTableManuallySelected,
    
    // Dialog states
    setShowOrdersDialog, setShowReportsDialog, setShowDiscountDialog, setShowItemNotesDialog, setSelectedItemForNotes,
    setShowReceiptDialog, setLastSaleData, lastSaleData, setShowPrinterSelector, setPrinterSelectionContext, printerSelectionContext,
    
    // Order counts and tracking
    setIncompleteOrdersCount, setTableOrders, setIncompleteTableOrdersCount, setIncompleteDeliveryTakeawayCount,
    setIncompleteDeliveryCount, setIncompleteTakeawayCount,
    
    // Refs and utilities
    processedOrderRef, selectPrinter, showError, showSuccess, onOrderSelect
  } = posState;

  // Handler functions
  const handleCloseOrdersDialog = useCallback(() => {
    console.log("📋 Closing orders dialog");
    setShowOrdersDialog(false);
  }, [setShowOrdersDialog]);

  const handleOrderSelectCallback = useCallback(
    (order: OrderSummaryType) => {
      console.log("📋 Order selected:", { orderId: order.id, orderNumber: order.orderNumber });
      if (onOrderSelect) {
        onOrderSelect(order);
      }
    },
    [onOrderSelect]
  );

  const clearCartWithAnimation = useCallback(() => {
    console.log("🛒 Clearing cart with animation");
    setCart([]);
    setHasUnsavedChanges(false);
    setIsPaymentCompleted(false);
    setIsTableManuallySelected(false);
    processedOrderRef.current = null;
  }, [setCart, setHasUnsavedChanges, setIsPaymentCompleted, setIsTableManuallySelected, processedOrderRef]);

  const resetToTakeaway = useCallback(() => {
    console.log("📋 Resetting order type to takeaway");
    setOrderType("takeaway");
    setSelectedTable(undefined);
    setShowTablesLayout(false);
  }, [setOrderType, setSelectedTable, setShowTablesLayout]);

  const clearCart = useCallback(() => {
    console.log("🛒 Clearing cart");
    setCart([]);
    setHasUnsavedChanges(false);
  }, [setCart, setHasUnsavedChanges]);

  const handleShowReports = useCallback(() => {
    console.log("📊 Opening reports dialog");
    setShowReportsDialog(true);
  }, [setShowReportsDialog]);

  const handleShowDiscount = useCallback(() => {
    if (cart.length === 0) {
      console.log("💸 Attempted to apply discount to empty cart");
      showError("Cannot apply discount to empty cart");
      return;
    }
    console.log("💸 Opening discount dialog");
    setShowDiscountDialog(true);
  }, [cart.length, showError, setShowDiscountDialog]);

  const handleDiscountAmountChange = useCallback((amount: number) => {
    console.log("💸 Discount amount changed:", amount);
    setDiscountAmount(amount);
  }, [setDiscountAmount]);

  const handleApplyDiscount = useCallback(
    (discountData: { type: "percentage" | "fixed"; value: number; reason?: string }) => {
      if (cart.length === 0) {
        console.log("💸 Attempted to apply discount to empty cart");
        showError("Cannot apply discount to empty cart");
        return;
      }
      const currentSubtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
      let discountAmount = 0;
      if (discountData.type === "percentage") {
        const safePercentage = Math.min(discountData.value, 100);
        discountAmount = (currentSubtotal * safePercentage) / 100;
      } else {
        discountAmount = Math.min(discountData.value, currentSubtotal);
      }
      console.log("💸 Applying discount:", { ...discountData, amount: discountAmount });
      setAppliedDiscount({
        type: discountData.type,
        value: discountData.value,
        amount: discountAmount,
        reason: discountData.reason
      });
      setDiscountAmount(discountAmount);
      setShowDiscountDialog(false);
      const discountText = discountData.type === "percentage" ? `${discountData.value}% discount` : `$${discountData.value} discount`;
      showSuccess(`${discountText} applied - Saved $${discountAmount.toFixed(2)}`);
    },
    [cart, showError, showSuccess, setAppliedDiscount, setDiscountAmount, setShowDiscountDialog]
  );

  const handleRemoveDiscount = useCallback(() => {
    console.log("💸 Removing discount");
    setAppliedDiscount(null);
    setDiscountAmount(0);
    showSuccess("Discount removed");
  }, [showSuccess, setAppliedDiscount, setDiscountAmount]);

  const handleItemNotesChange = useCallback(
    (itemId: string, notes: string) => {
      console.log("📝 Updating item notes:", { itemId, notes });
      setCart(prevCart => {
        const updatedCart = prevCart.map(item => (item.id === itemId ? { ...item, notes: notes.trim() || undefined } : item));
        return updatedCart;
      });
      if (notes.trim()) {
        showSuccess("Item notes saved");
      } else {
        showSuccess("Item notes removed");
      }
    },
    [showSuccess, setCart]
  );

  const handleShowItemNotes = useCallback((item: POSCartItem) => {
    console.log("📝 Opening item notes dialog for:", item.id);
    const itemCopy = { ...item };
    setSelectedItemForNotes(itemCopy);
    setShowItemNotesDialog(true);
  }, [setSelectedItemForNotes, setShowItemNotesDialog]);

  const handleCloseItemNotes = useCallback(() => {
    console.log("📝 Closing item notes dialog");
    setShowItemNotesDialog(false);
    setSelectedItemForNotes(null);
  }, [setShowItemNotesDialog, setSelectedItemForNotes]);

  const handlePaymentWithPrinter = useCallback(async (printer?: any) => {
    console.log("🖨️ Initiating payment with printer:", printer?.name || "No printer selected");
    // TODO: Implement payment with printer functionality
  }, []);

  const handlePrintReceiptWithPrinter = useCallback(
    async (printer?: any) => {
      console.log("🖨️ Preparing receipt for printing:", { printer: printer?.name || "No printer" });
      let receiptData = lastSaleData;
      if (!receiptData) {
        const itemsToUse = currentOrder?.items && currentOrder.items.length > 0 ? currentOrder.items : cart;
        if (!itemsToUse || itemsToUse.length === 0) {
          console.log("🖨️ No items to print for receipt");
          showError("No items to print");
          return;
        }
        receiptData = {
          id: currentOrder?.orderNumber || `DRAFT-${Date.now()}`,
          date: new Date().toLocaleDateString(),
          time: new Date().toLocaleTimeString(),
          cashier: "",
          items: itemsToUse.map(item => ({
            name: item.name,
            quantity: item.quantity,
            unitPrice: item.unitPrice || item.price,
            totalPrice: item.totalPrice || item.price * item.quantity,
            type: item.type
          })),
          subtotal: currentOrder?.subtotal ? (typeof currentOrder.subtotal === "string" ? parseFloat(currentOrder.subtotal) : currentOrder.subtotal) : subtotal,
          tax: currentOrder?.tax ? (typeof currentOrder.tax === "string" ? parseFloat(currentOrder.tax) : currentOrder.tax) : 0,
          total: currentOrder?.total ? (typeof currentOrder.total === "string" ? parseFloat(currentOrder.total) : currentOrder.total) : total,
          paymentAmount: currentOrder?.total ? (typeof currentOrder.total === "string" ? parseFloat(currentOrder.total) : currentOrder.total) : total,
          change: 0,
          paymentMethod: "cash",
          discountType: currentOrder?.discountType || appliedDiscount?.type || null,
          discountValue: currentOrder?.discountValue ? (typeof currentOrder.discountValue === "string" ? parseFloat(currentOrder.discountValue) : currentOrder.discountValue) : appliedDiscount?.value || null,
          discountAmount: currentOrder?.discountAmount ? (typeof currentOrder.discountAmount === "string" ? parseFloat(currentOrder.discountAmount) : currentOrder.discountAmount) : appliedDiscount?.amount || null,
          discountReason: currentOrder?.discountReason || appliedDiscount?.reason || null
        };
        console.log("🖨️ Generated receipt data:", { receiptId: receiptData.id, items: receiptData.items.length });
        setLastSaleData(receiptData);
      }
      setShowReceiptDialog(true);
    },
    [lastSaleData, showError, currentOrder, cart, subtotal, total, appliedDiscount, setLastSaleData, setShowReceiptDialog]
  );

  const handlePrinterSelect = useCallback(
    (printer: any) => {
      console.log("🖨️ Printer selected:", { printerId: printer?.id, printerName: printer?.name });
      selectPrinter(printer);
      setShowPrinterSelector(false);
      if (printerSelectionContext === "payment") {
        handlePaymentWithPrinter(printer);
      } else if (printerSelectionContext === "manual_print") {
        handlePrintReceiptWithPrinter(printer);
      }
      setPrinterSelectionContext(null);
    },
    [selectPrinter, printerSelectionContext, handlePaymentWithPrinter, handlePrintReceiptWithPrinter, setShowPrinterSelector, setPrinterSelectionContext]
  );

  const handleClosePrinterSelector = useCallback(() => {
    console.log("🖨️ Closing printer selector");
    setShowPrinterSelector(false);
    setPrinterSelectionContext(null);
  }, [setShowPrinterSelector, setPrinterSelectionContext]);

  const handleShowPrinterSettings = useCallback(() => {
    console.log("🖨️ Opening printer settings");
    setPrinterSelectionContext("manual_print");
    setShowPrinterSelector(true);
  }, [setPrinterSelectionContext, setShowPrinterSelector]);

  const fetchIncompleteOrders = useCallback(async () => {
    console.log("📋 Fetching incomplete orders");
    try {
      const response = await ordersAPI.getOrders();
      if (response?.data) {
        let ordersArray: OrderSummaryType[];
        type NestedResponse = { data: OrderSummaryType[] };
        if (Array.isArray(response.data)) {
          ordersArray = response.data;
        } else if (response.data && typeof response.data === "object" && "data" in response.data && Array.isArray((response.data as NestedResponse).data)) {
          ordersArray = (response.data as NestedResponse).data;
        } else {
          console.log("📋 No valid orders data received");
          setIncompleteOrdersCount(0);
          setTableOrders({});
          setIncompleteTableOrdersCount(0);
          setIncompleteDeliveryTakeawayCount(0);
          setIncompleteDeliveryCount(0);
          setIncompleteTakeawayCount(0);
          return;
        }
        const incompleteStatuses = ["draft", "confirmed", "preparing", "ready"];
        const incompleteOrders = ordersArray.filter(order => incompleteStatuses.includes(order.status));
        console.log("📋 Incomplete orders fetched:", { count: incompleteOrders.length });
        setIncompleteOrdersCount(incompleteOrders.length);
        const deliveryCount = incompleteOrders.filter(order => order.orderType === "delivery").length;
        const takeawayCount = incompleteOrders.filter(order => order.orderType === "takeaway").length;
        const deliveryTakeawayCount = deliveryCount + takeawayCount;
        const uniqueTablesWithOrders = new Set(incompleteOrders.filter(order => order.orderType === "table" && order.tableNumber).map(order => order.tableNumber));
        const tableOrdersCount = uniqueTablesWithOrders.size;
        setIncompleteTableOrdersCount(tableOrdersCount);
        setIncompleteDeliveryTakeawayCount(deliveryTakeawayCount);
        setIncompleteDeliveryCount(deliveryCount);
        setIncompleteTakeawayCount(takeawayCount);
        const tableOrdersMap: { [tableId: string]: number } = {};
        incompleteOrders.forEach(order => {
          if (order.tableNumber) {
            const tableKey = order.tableNumber.toString();
            tableOrdersMap[tableKey] = (tableOrdersMap[tableKey] || 0) + 1;
          }
        });
        console.log("📍 Table orders updated:", tableOrdersMap);
        setTableOrders(tableOrdersMap);
      } else {
        console.log("📋 No orders data available");
        setIncompleteOrdersCount(0);
        setTableOrders({});
        setIncompleteTableOrdersCount(0);
        setIncompleteDeliveryTakeawayCount(0);
        setIncompleteDeliveryCount(0);
        setIncompleteTakeawayCount(0);
      }
    } catch (error) {
      console.error("❌ Error fetching incomplete orders:", error);
      setIncompleteOrdersCount(0);
      setTableOrders({});
      setIncompleteTableOrdersCount(0);
      setIncompleteDeliveryTakeawayCount(0);
      setIncompleteDeliveryCount(0);
      setIncompleteTakeawayCount(0);
    }
  }, [setIncompleteOrdersCount, setTableOrders, setIncompleteTableOrdersCount, setIncompleteDeliveryTakeawayCount, setIncompleteDeliveryCount, setIncompleteTakeawayCount]);

  return {
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
    fetchIncompleteOrders
  };
};

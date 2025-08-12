import { useCallback } from "react";
import { ordersAPI } from "@/api/orders.api";
import { printerAPI } from "@/api/printer.api";
import { useOrderManagement } from "@/hooks/useOrderManagement";
import { usePrinterSelector } from "@/hooks/usePrinterSelector";
import { POSCartItem, MenuItem, StockEntryWithMaterial, Table, Employee, OrderType } from "@/types/inventory";
import { generatePreviewOrderNumber } from "@/utils/orderNumberGenerator";
import { OrderPersistence } from "@/utils/orderPersistence";
import { formatItemsForPrinter } from "@/utils/thermalPrinterFormatter";
import { UsePOSHandlersProps } from "@/types/pos";

export const usePOSHandlers = (props: UsePOSHandlersProps) => {
  const { cart, setCart, orderType, setOrderType, selectedTable, setSelectedTable, selectedEmployee, setSelectedEmployee, appliedDiscount, setAppliedDiscount, setDiscountAmount, setOrderNotes, setPaymentAmount, lastSaleData, setLastSaleData, showError, showSuccess, setHasUnsavedChanges, setShowTablesLayout, setShowReceiptDialog, setShowPrinterSelector, setPrinterSelectionContext, menuItems, stockEntries, subtotal, total, refreshOrderData, fetchTablesData } = props;
  const { currentOrder, isLoading: orderLoading, createOrder, loadOrder, updateOrder, voidOrder, clearOrder } = useOrderManagement();
  const { selectedPrinter, selectPrinter, clearSelection, hasSavedPrinter, getSavedPrinter } = usePrinterSelector();

  const recalculateEmployeeDiscount = useCallback(
    (newCart: POSCartItem[]) => {
      if (selectedEmployee && selectedEmployee.discountPercentage > 0 && orderType === "employees") {
        const currentSubtotal = newCart.reduce((sum, item) => sum + item.price * item.quantity, 0);
        const discountAmount = (currentSubtotal * selectedEmployee.discountPercentage) / 100;
        const employeeDiscount = {
          type: "percentage" as const,
          value: selectedEmployee.discountPercentage,
          amount: discountAmount,
          reason: `Employee discount - ${selectedEmployee.user?.firstName} ${selectedEmployee.user?.lastName} (${selectedEmployee.department})`
        };
        setAppliedDiscount(employeeDiscount);
        setDiscountAmount(discountAmount);
      }
    },
    [selectedEmployee, orderType, setAppliedDiscount, setDiscountAmount]
  );

  const updateCartQuantity = useCallback(
    (cartId: string, newQuantity: number) => {
      let newCart: POSCartItem[];
      if (newQuantity <= 0) {
        newCart = cart.filter(item => item.id !== cartId);
        setCart(newCart);
      } else {
        newCart = cart.map(item => (item.id === cartId ? { ...item, quantity: newQuantity } : item));
        setCart(newCart);
      }
      recalculateEmployeeDiscount(newCart);
    },
    [cart, setCart, recalculateEmployeeDiscount]
  );

  const handleOrderTypeChange = useCallback(
    (type: OrderType) => {
      setOrderType(type);
      if (type !== "table") {
        setSelectedTable(undefined);
      }
    },
    [setOrderType, setSelectedTable]
  );

  const handleTableSelect = useCallback(async () => {
    await fetchTablesData();
    setShowTablesLayout(true);
  }, [fetchTablesData, setShowTablesLayout]);

  const handleTableSelection = useCallback(
    async (table: Table) => {
      setSelectedTable(table);
      setOrderType("table");
      setShowTablesLayout(false);

      if (table.status === "opened" && table.currentOrder) {
        try {
          const response = await ordersAPI.getOrder(table.currentOrder.orderId);
          const responseData = response.data as { data?: any } | any;
          const existingOrder = responseData.data || responseData;

          if (existingOrder && existingOrder.items) {
            const cartItems: POSCartItem[] = existingOrder.items
              .map((item: any) => {
                let originalItem: StockEntryWithMaterial | MenuItem;
                if (item.type === "material" && item.materialId) {
                  originalItem = stockEntries.find(se => se.materialId === item.materialId);
                } else if (item.type === "menu_item" && item.menuItemId) {
                  originalItem = menuItems.find(m => m.id === item.menuItemId);
                }
                if (!originalItem) {
                  return null;
                }
                return {
                  id: item.id,
                  name: item.name,
                  price: parseFloat(item.unitPrice.toString()),
                  quantity: item.quantity,
                  type: item.type as "material" | "menu_item",
                  originalItem,
                  notes: item.notes || undefined
                };
              })
              .filter(Boolean) as POSCartItem[];
            setCart(cartItems);
            showSuccess(`Loaded existing order ${existingOrder.orderNumber} for Table ${table.number}`);
          }
        } catch (error) {
          showError("Failed to load existing table order");
        }
      } else {
        setCart([]);
        setAppliedDiscount(null);
        setDiscountAmount(0);
        if (clearOrder) {
          clearOrder();
        }
        OrderPersistence.clearCurrentOrder();
        setHasUnsavedChanges(false);
        setSelectedEmployee(undefined);
        showSuccess(`Table ${table.number} selected - Ready for new order`);
      }
      await refreshOrderData();
    },
    [setSelectedTable, setOrderType, setShowTablesLayout, stockEntries, menuItems, setCart, showSuccess, showError, setAppliedDiscount, setDiscountAmount, clearOrder, setHasUnsavedChanges, setSelectedEmployee, refreshOrderData]
  );

  const handleEmployeeSelection = useCallback(
    (employee: Employee) => {
      setSelectedEmployee(employee);
      setOrderType("employees");
      if (employee.discountPercentage > 0) {
        const discountValue = employee.discountPercentage;
        const currentSubtotal = (cart || []).reduce((sum, item) => sum + item.price * item.quantity, 0);
        const discountAmount = (currentSubtotal * discountValue) / 100;
        const employeeDiscount = {
          type: "percentage" as const,
          value: discountValue,
          amount: discountAmount,
          reason: `Employee discount - ${employee.user?.firstName} ${employee.user?.lastName} (${employee.department})`
        };
        setAppliedDiscount(employeeDiscount);
        setDiscountAmount(discountAmount);
        showSuccess(`Applied ${discountValue}% employee discount for ${employee.user?.firstName} ${employee.user?.lastName}`);
      }
    },
    [cart, setSelectedEmployee, setOrderType, setAppliedDiscount, setDiscountAmount, showSuccess]
  );

  const handleApplyDiscount = useCallback(
    (discountData: { type: "percentage" | "fixed"; value: number; reason?: string }) => {
      if (cart.length === 0) {
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
      setAppliedDiscount({
        type: discountData.type,
        value: discountData.value,
        amount: discountAmount,
        reason: discountData.reason
      });
      setDiscountAmount(discountAmount);
      const discountText = discountData.type === "percentage" ? `${discountData.value}% discount` : `$${discountData.value} discount`;
      showSuccess(`${discountText} applied - Saved $${discountAmount.toFixed(2)}`);
    },
    [cart, showError, showSuccess, setAppliedDiscount, setDiscountAmount]
  );

  const handleRemoveDiscount = useCallback(() => {
    setAppliedDiscount(null);
    setDiscountAmount(0);
    showSuccess("Discount removed");
  }, [setAppliedDiscount, setDiscountAmount, showSuccess]);

  const handleItemNotesChange = useCallback(
    (itemId: string, notes: string) => {
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
    [setCart, showSuccess]
  );

  const formatItemsForPrinterCallback = useCallback(
    (items: POSCartItem[]): string => {
      return formatItemsForPrinter({
        items,
        currentOrder,
        orderType,
        selectedTable,
        selectedEmployee,
        generatePreviewOrderNumber
      });
    },
    [currentOrder, orderType, selectedTable, selectedEmployee]
  );

  const printItemsToAssignedPrinters = useCallback(
    async (cartItems: POSCartItem[]) => {
      try {
        const itemsByPrinter = new Map<number, POSCartItem[]>();
        cartItems.forEach(item => {
          const printerId = item.printerId || item.assignedPrinter?.id;
          if (printerId) {
            if (!itemsByPrinter.has(printerId)) {
              itemsByPrinter.set(printerId, []);
            }
            itemsByPrinter.get(printerId)!.push(item);
          }
        });

        const printPromises = Array.from(itemsByPrinter.entries()).map(async ([printerId, items]) => {
          try {
            const printContent = formatItemsForPrinterCallback(items);
            const printJobData = {
              printerId: printerId,
              jobType: "receipt" as const,
              content: {
                rawContent: printContent,
                format: "text",
                encoding: "utf8"
              },
              priority: 1,
              metadata: {
                orderType: "pos_order",
                itemCount: items.length,
                timestamp: new Date().toISOString()
              }
            };
            const result = await printerAPI.createPrintJob(printJobData);
            return { printerId, success: true, jobId: result.job?.id };
          } catch (error) {
            console.error(`❌ Failed to print to printer ${printerId}:`, error);
            return { printerId, success: false, error };
          }
        });

        const results = await Promise.allSettled(printPromises);
        const successfulPrints = results.filter(result => result.status === "fulfilled" && result.value.success).length;
        const totalPrinters = itemsByPrinter.size;

        if (successfulPrints > 0) {
          if (successfulPrints === totalPrinters) {
            showSuccess(`✅ Items printed to ${successfulPrints} printer(s) successfully!`);
          } else {
            showSuccess(`⚠️ Items printed to ${successfulPrints}/${totalPrinters} printers. Check printer status for failed prints.`);
          }
        } else if (totalPrinters > 0) {
          showError(`❌ Failed to print items to assigned printers. Please check printer connectivity.`);
        }
      } catch (error) {
        console.error("❌ Error in printItemsToAssignedPrinters:", error);
        showError("Failed to print items to printers. Please try manual printing.");
      }
    },
    [showSuccess, showError, formatItemsForPrinterCallback]
  );

  const handlePrintReceiptWithPrinter = useCallback(
    async (printer?: any) => {
      let receiptData = lastSaleData;
      if (!receiptData) {
        const itemsToUse = currentOrder?.items && currentOrder.items.length > 0 ? currentOrder.items : cart;
        if (!itemsToUse || itemsToUse.length === 0) {
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
        setLastSaleData(receiptData);
      }
      setShowReceiptDialog(true);
    },
    [lastSaleData, showError, currentOrder, cart, subtotal, total, appliedDiscount, setLastSaleData, setShowReceiptDialog]
  );

  const handlePrinterSelect = useCallback(
    (printer: any) => {
      selectPrinter(printer);
      setShowPrinterSelector(false);
      if (props.printerSelectionContext === "payment") {
      } else if (props.printerSelectionContext === "manual_print") {
        handlePrintReceiptWithPrinter(printer);
      }
      setPrinterSelectionContext(null);
    },
    [selectPrinter, setShowPrinterSelector, handlePrintReceiptWithPrinter, setPrinterSelectionContext, props.printerSelectionContext]
  );

  const handlePrintReceipt = useCallback(() => {
    const itemsToUse = currentOrder?.items && currentOrder.items.length > 0 ? currentOrder.items : cart;
    if (!itemsToUse || itemsToUse.length === 0) {
      showError("No items to print");
      return;
    }
    const receiptData = {
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
    setLastSaleData(receiptData);
    if (hasSavedPrinter()) {
      const savedPrinter = getSavedPrinter();
      handlePrintReceiptWithPrinter(savedPrinter);
    } else {
      setPrinterSelectionContext("manual_print");
      setShowPrinterSelector(true);
    }
  }, [cart, currentOrder, subtotal, total, appliedDiscount, showError, hasSavedPrinter, getSavedPrinter, handlePrintReceiptWithPrinter, setLastSaleData, setPrinterSelectionContext, setShowPrinterSelector]);

  const resetToTakeaway = useCallback(() => {
    setOrderType("takeaway");
    setSelectedTable(undefined);
    setShowTablesLayout(false);
  }, [setOrderType, setSelectedTable, setShowTablesLayout]);

  const handleCancelOrder = useCallback(() => {
    setCart([]);
    setOrderType("takeaway");
    setSelectedTable(undefined);
    setSelectedEmployee(undefined);
    setAppliedDiscount(null);
    setDiscountAmount(0);
    if (clearOrder) {
      clearOrder();
    }
    OrderPersistence.clearCurrentOrder();
    setHasUnsavedChanges(false);
    setShowTablesLayout(false);
    setPaymentAmount("");
    setOrderNotes("");
  }, [setCart, setOrderType, setSelectedTable, setSelectedEmployee, setAppliedDiscount, setDiscountAmount, clearOrder, setHasUnsavedChanges, setShowTablesLayout, setPaymentAmount, setOrderNotes]);

  const handleManualSave = useCallback(async () => {
    if (!cart || cart.length === 0) {
      showError("Cannot save empty order");
      return;
    }

    try {
      const orderData = {
        orderType,
        tableId: selectedTable?.id,
        employeeId: selectedEmployee?.id,
        items: cart.map(item => ({
          id: item.id,
          name: item.name,
          type: item.type,
          quantity: item.quantity,
          unitPrice: item.price,
          totalPrice: item.price * item.quantity,
          notes: item.notes || "",
          // Include required materialId or menuItemId based on item type
          ...(item.type === "menu_item" && item.menuItemId ? { menuItemId: item.menuItemId } : {}),
          ...(item.type === "material" && item.materialId ? { materialId: item.materialId } : {})
        })),
        subtotal,
        tax: 0,
        total,
        discountType: appliedDiscount?.type || null,
        discountValue: appliedDiscount?.value || null,
        discountAmount: appliedDiscount?.amount || null,
        discountReason: appliedDiscount?.reason || null,
        status: "pending" as const
      };

      const savedOrder = await createOrder(orderData);
      
      if (savedOrder) {
        showSuccess(`Order ${savedOrder.orderNumber} saved successfully!`);
        
        // Clear the cart and reset state
        setCart([]);
        setAppliedDiscount(null);
        setDiscountAmount(0);
        setHasUnsavedChanges(false);
        OrderPersistence.clearCurrentOrder();
        
        // Print items to assigned printers if available
        if (cart.some(item => item.printerId || item.assignedPrinter)) {
          await printItemsToAssignedPrinters(cart);
        }
        
        // Refresh order data
        if (refreshOrderData) {
          await refreshOrderData();
        }
      }
    } catch (error) {
      console.error("Error saving order:", error);
      showError("Failed to save order. Please try again.");
    }
  }, [cart, orderType, selectedTable, selectedEmployee, subtotal, total, appliedDiscount, createOrder, showSuccess, showError, setCart, setAppliedDiscount, setDiscountAmount, setHasUnsavedChanges, printItemsToAssignedPrinters, refreshOrderData]);

  const handlePayment = useCallback(async (paymentData: { amount: number; method: string }) => {
    if (!cart || cart.length === 0) {
      showError("Cannot process payment for empty cart");
      return;
    }

    try {
      // First save the order if it doesn't exist
      let orderToProcess = currentOrder;
      if (!orderToProcess) {
        const orderData = {
          orderType,
          tableId: selectedTable?.id,
          employeeId: selectedEmployee?.id,
          items: cart.map(item => ({
            id: item.id,
            name: item.name,
            type: item.type,
            quantity: item.quantity,
            unitPrice: item.price,
            totalPrice: item.price * item.quantity,
            notes: item.notes || "",
            // Include required materialId or menuItemId based on item type
            ...(item.type === "menu_item" && item.menuItemId ? { menuItemId: item.menuItemId } : {}),
            ...(item.type === "material" && item.materialId ? { materialId: item.materialId } : {})
          })),
          subtotal,
          tax: 0,
          total,
          discountType: appliedDiscount?.type || null,
          discountValue: appliedDiscount?.value || null,
          discountAmount: appliedDiscount?.amount || null,
          discountReason: appliedDiscount?.reason || null,
          status: "completed" as const
        };
        orderToProcess = await createOrder(orderData);
      }

      if (orderToProcess) {
        showSuccess(`Payment of $${paymentData.amount.toFixed(2)} processed successfully!`);
        
        // Set last sale data for receipt
        const receiptData = {
          id: orderToProcess.orderNumber || `ORDER-${Date.now()}`,
          date: new Date().toLocaleDateString(),
          time: new Date().toLocaleTimeString(),
          cashier: selectedEmployee?.user?.firstName || "",
          items: cart.map(item => ({
            name: item.name,
            quantity: item.quantity,
            unitPrice: item.price,
            totalPrice: item.price * item.quantity,
            type: item.type
          })),
          subtotal,
          tax: 0,
          total,
          paymentAmount: paymentData.amount,
          change: Math.max(0, paymentData.amount - total),
          paymentMethod: paymentData.method,
          discountType: appliedDiscount?.type || null,
          discountValue: appliedDiscount?.value || null,
          discountAmount: appliedDiscount?.amount || null,
          discountReason: appliedDiscount?.reason || null
        };
        setLastSaleData(receiptData);
        
        // Clear the cart and reset state
        setCart([]);
        setAppliedDiscount(null);
        setDiscountAmount(0);
        setHasUnsavedChanges(false);
        OrderPersistence.clearCurrentOrder();
        
        // Print items to assigned printers if available
        if (cart.some(item => item.printerId || item.assignedPrinter)) {
          await printItemsToAssignedPrinters(cart);
        }
        
        // Refresh order data
        if (refreshOrderData) {
          await refreshOrderData();
        }
      }
    } catch (error) {
      console.error("Error processing payment:", error);
      showError("Failed to process payment. Please try again.");
    }
  }, [cart, currentOrder, orderType, selectedTable, selectedEmployee, subtotal, total, appliedDiscount, createOrder, showSuccess, showError, setCart, setAppliedDiscount, setDiscountAmount, setHasUnsavedChanges, setLastSaleData, printItemsToAssignedPrinters, refreshOrderData]);

  const handleConfirmVoid = useCallback(async () => {
    if (!currentOrder) {
      showError("No order to void");
      return;
    }

    try {
      await voidOrder(currentOrder.id);
      showSuccess(`Order ${currentOrder.orderNumber} has been voided successfully`);
      
      // Clear the cart and reset state
      setCart([]);
      setAppliedDiscount(null);
      setDiscountAmount(0);
      setHasUnsavedChanges(false);
      OrderPersistence.clearCurrentOrder();
      
      // Refresh order data
      if (refreshOrderData) {
        await refreshOrderData();
      }
    } catch (error) {
      console.error("Error voiding order:", error);
      showError("Failed to void order. Please try again.");
    }
  }, [currentOrder, voidOrder, showSuccess, showError, setCart, setAppliedDiscount, setDiscountAmount, setHasUnsavedChanges, refreshOrderData]);

  return {
    currentOrder,
    orderLoading,
    createOrder,
    loadOrder,
    updateOrder,
    voidOrder,
    clearOrder,
    selectedPrinter,
    selectPrinter,
    clearSelection,
    hasSavedPrinter,
    getSavedPrinter,
    updateCartQuantity,
    handleOrderTypeChange,
    handleTableSelect,
    handleTableSelection,
    handleEmployeeSelection,
    handleApplyDiscount,
    handleRemoveDiscount,
    handleItemNotesChange,
    handlePrintReceipt,
    handlePrintReceiptWithPrinter,
    handlePrinterSelect,
    resetToTakeaway,
    handleCancelOrder,
    handleManualSave,
    handlePayment,
    handleConfirmVoid,
    recalculateEmployeeDiscount,
    printItemsToAssignedPrinters,
    formatItemsForPrinterCallback
  };
};

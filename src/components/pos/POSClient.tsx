import { menuAPI } from "@/api/menu.api.ts.tsx";
import { ordersAPI } from "@/api/orders.api";
import { printerAPI } from "@/api/printer.api";
import { tablesAPI } from "@/api/tables.api";
import { usePrefetch } from "@/hooks/usePrefetch";
import { useOrdersPrefetch } from "@/hooks/useOrdersPrefetch";
import PrinterSelector from "@/components/common/PrinterSelector";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useOrderManagement } from "@/hooks/useOrderManagement";
import { usePrinterSelector } from "@/hooks/usePrinterSelector";
import { Employee } from "@/types/employee";
import { MenuItem, NegativeStockWarning, POSCartItem, POSClientProps, POSItem, ReceiptData, SaleResponse, SectionAssignment, StockEntryWithMaterial, Table } from "@/types/inventory";
import { OrderSummary as OrderSummaryType, OrderType } from "@/types/orders";
import { generatePreviewOrderNumber } from "@/utils/orderNumberGenerator";
import { OrderPersistence } from "@/utils/orderPersistence";
import { formatItemsForPrinter } from "@/utils/thermalPrinterFormatter";
import { AlertCircle, AlertTriangle, Check, CheckCircle, DollarSign, FileText, GripVertical, Trash2 } from "lucide-react";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
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

export const POSClient: React.FC<POSClientProps> = ({ sectionAssignments, onSaleComplete, onOrderSelect, selectedOrderForPOS, onOrderProcessed, refreshCountsRef }) => {
  const { stock, menu, status, refresh: refreshInventory } = usePrefetch({ autoFetch: true, parallel: true, onError: error => console.error("❌ Failed to load inventory data:", error) });
  const handleOrdersError = useCallback((error: Error) => {
    console.error("❌ Failed to load orders data:", error);
  }, []);
  const orderDataTypes = useMemo(() => ["orderSummaries"] as ("orderSummaries" | "orders")[], []);
  const { refresh: refreshOrders } = useOrdersPrefetch({ autoFetch: true, dataTypes: orderDataTypes, onError: handleOrdersError });
  const [cart, setCart] = useState<POSCartItem[]>([]);
  const [searchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [stockEntries, setStockEntries] = useState<StockEntryWithMaterial[]>([]);
  const [posItems, setPosItems] = useState<POSItem[]>([]);
  const [optimisticAssignments, setOptimisticAssignments] = useState<SectionAssignment[]>(sectionAssignments);
  const [negativeStockWarnings] = useState<NegativeStockWarning[]>([]);
  const [showNegativeStockDialog, setShowNegativeStockDialog] = useState(false);
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState<string>("");
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [showReceiptDialog, setShowReceiptDialog] = useState(false);
  const [lastSaleData, setLastSaleData] = useState<ReceiptData | null>(null);
  const [orderType, setOrderType] = useState<OrderType>("takeaway");
  const [selectedTable, setSelectedTable] = useState<Table | undefined>(undefined);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | undefined>(undefined);
  const [showTablesLayout, setShowTablesLayout] = useState(false);
  const [tables, setTables] = useState<Table[]>([]);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [isPaymentCompleted, setIsPaymentCompleted] = useState(false);
  const [isTableManuallySelected, setIsTableManuallySelected] = useState(false);
  const [showUnsavedDialog, setShowUnsavedDialog] = useState(false);
  const [showSuccessCheckmark, setShowSuccessCheckmark] = useState(false);
  const [shouldAutoPrint, setShouldAutoPrint] = useState(false);
  const [showVoidDialog, setShowVoidDialog] = useState(false);
  const [showOrdersDialog, setShowOrdersDialog] = useState(false);
  const [showReportsDialog, setShowReportsDialog] = useState(false);
  const [activeView, setActiveView] = useState<"cart" | "products">("products");
  const [incompleteOrdersCount, setIncompleteOrdersCount] = useState<number>(0);
  const [tableOrders, setTableOrders] = useState<{ [tableId: string]: number }>({});
  const [incompleteTableOrdersCount, setIncompleteTableOrdersCount] = useState<number>(0);
  const [incompleteDeliveryTakeawayCount, setIncompleteDeliveryTakeawayCount] = useState<number>(0);
  const [, setIncompleteDeliveryCount] = useState<number>(0);
  const [, setIncompleteTakeawayCount] = useState<number>(0);
  const errorTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const successTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const checkmarkTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const processedOrderRef = useRef<string | null>(null);
  const [leftPanelWidth, setLeftPanelWidth] = useState(33.33);
  const [rightPanelPixelWidth, setRightPanelPixelWidth] = useState(0);
  const [isResizing, setIsResizing] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const [showDiscountDialog, setShowDiscountDialog] = useState(false);
  const [showNotesDialog, setShowNotesDialog] = useState(false);
  const [showItemNotesDialog, setShowItemNotesDialog] = useState(false);
  const [selectedItemForNotes, setSelectedItemForNotes] = useState<POSCartItem | null>(null);
  const [orderNotes, setOrderNotes] = useState<string>("");
  const [discountAmount, setDiscountAmount] = useState<number>(0);
  const [appliedDiscount, setAppliedDiscount] = useState<{ type: "percentage" | "fixed"; value: number; amount: number; reason?: string } | null>(null);
  const [showPrinterSelector, setShowPrinterSelector] = useState(false);
  const [printerSelectionContext, setPrinterSelectionContext] = useState<"payment" | "manual_print" | null>(null);
  const { selectedPrinter, selectPrinter, clearSelection, hasSavedPrinter, getSavedPrinter } = usePrinterSelector();
  const [isSaving, setIsSaving] = useState(false);

  // 🛒 Calculate subtotal and total
  const subtotal = (cart || []).filter(Boolean).reduce((sum, item) => {
    if (!item || typeof item.price !== "number" || typeof item.quantity !== "number") {
      console.warn("⚠️ Invalid cart item found:", item);
      return sum;
    }
    return sum + item.price * item.quantity;
  }, 0);
  const tax = 0;
  const discountAmountCalculated = appliedDiscount ? appliedDiscount.amount : 0;
  const total = Math.max(0, subtotal - discountAmountCalculated);
  // console.log("🛒 Subtotal calculated:", { subtotal, discount: discountAmountCalculated, total });

  const handleCloseOrdersDialog = useCallback(() => {
    console.log("📋 Closing orders dialog");
    setShowOrdersDialog(false);
  }, []);

  const handleOrderSelectCallback = useCallback(
    (order: OrderSummaryType) => {
      console.log("📋 Order selected:", { orderId: order.id, orderNumber: order.orderNumber });
      if (onOrderSelect) {
        onOrderSelect(order);
      }
    },
    [onOrderSelect]
  );

  const { currentOrder, isLoading: orderLoading, createOrder, loadOrder, updateOrder, voidOrder, clearOrder } = useOrderManagement();

  const showError = useCallback((message: string) => {
    console.error("❌ Error displayed:", message);
    setError(message);
    if (errorTimeoutRef.current) clearTimeout(errorTimeoutRef.current);
    errorTimeoutRef.current = setTimeout(() => setError(null), 5000);
  }, []);

  const showSuccess = useCallback((message: string) => {
    console.log("✅ Success message displayed:", message);
    setSuccessMessage(message);
    if (successTimeoutRef.current) clearTimeout(successTimeoutRef.current);
    successTimeoutRef.current = setTimeout(() => setSuccessMessage(null), 3000);
  }, []);

  useEffect(() => {
    const handleResize = () => {
      if (!containerRef.current) return;
      const containerWidth = containerRef.current.offsetWidth;
      console.log("🖥️ Window resized:", { containerWidth, leftPanelWidth });
      if (containerWidth < 1024) {
        setLeftPanelWidth(33.33);
      }
      const rightPanelWidth = 100 - leftPanelWidth;
      const calculatedRightPanelPixelWidth = (rightPanelWidth / 100) * containerWidth;
      setRightPanelPixelWidth(calculatedRightPanelPixelWidth);
    };
    const timeoutId = setTimeout(() => {
      handleResize();
    }, 100);
    window.addEventListener("resize", handleResize);
    return () => {
      clearTimeout(timeoutId);
      window.removeEventListener("resize", handleResize);
    };
  }, [leftPanelWidth]);

  useEffect(() => {
    // Completely block selectedOrderForPOS when table is manually selected
    if (isTableManuallySelected) {
      console.log("🚫 Completely blocking selectedOrderForPOS due to manual table selection:", { 
        selectedOrderId: selectedOrderForPOS?.id, 
        tableManuallySelected: isTableManuallySelected 
      });
      return;
    }
    
    // Block selectedOrderForPOS if there's already a current order being edited
    if (currentOrder && selectedOrderForPOS && currentOrder.id && selectedOrderForPOS.id && 
        currentOrder.id.toString() === selectedOrderForPOS.id.toString()) {
      console.log("🚫 Blocking selectedOrderForPOS - order already loaded and being edited:", { 
        currentOrderId: currentOrder.id, 
        selectedOrderId: selectedOrderForPOS.id 
      });
      return;
    }
    
    if (selectedOrderForPOS && !isPaymentCompleted) {
      console.log("📋 Loading selected order for POS:", { orderId: selectedOrderForPOS.id });
      if (!selectedOrderForPOS.items || selectedOrderForPOS.items.length === 0) {
        if (loadOrder) {
          console.log("📋 Fetching order details:", selectedOrderForPOS.id);
          loadOrder(selectedOrderForPOS.id.toString());
        }
        return;
      }
      const orderId = selectedOrderForPOS.id.toString();
      if (processedOrderRef.current === orderId) {
        console.log("📋 Order already processed, skipping:", orderId);
        return;
      }
      processedOrderRef.current = orderId;
      
      // Check if this is a completed order - don't load it into cart
      if (selectedOrderForPOS.status === 'completed' || selectedOrderForPOS.status === 'paid') {
        console.log("📋 Skipping completed order load:", { orderId, status: selectedOrderForPOS.status });
        return;
      }
      
      const cartItems: POSCartItem[] = selectedOrderForPOS.items
        .map((item: any, index: number) => {
          if (item.menuItem) {
            return {
              id: `order-${selectedOrderForPOS.id}-menu-${item.menuItem.id}-${index}`,
              name: item.menuItem.name,
              price: item.menuItem.price,
              quantity: item.quantity,
              type: "menu_item" as const,
              menuItemId: item.menuItem.id,
              originalItem: item.menuItem,
              stockEntryId: undefined,
              notes: item.notes || undefined
            };
          } else if (item.material) {
            return {
              id: `order-${selectedOrderForPOS.id}-material-${item.material.id}-${index}`,
              name: item.material.name,
              price: parseFloat(item.unitPrice),
              quantity: item.quantity,
              type: "material" as const,
              materialId: item.material.id,
              originalItem: item.material,
              stockEntryId: undefined,
              notes: item.notes || undefined
            };
          }
          return null;
        })
        .filter(Boolean) as POSCartItem[];
      console.log("🛒 Cart updated from selected order:", { orderId, items: cartItems.length });
      setOrderType(selectedOrderForPOS.orderType);
      if (selectedOrderForPOS.orderType === "table" && selectedOrderForPOS.tableId) {
        console.log("📍 Setting selected table:", selectedOrderForPOS.tableId);
        setSelectedTable(tables.find(t => t.id === selectedOrderForPOS.tableId));
      }
      if (selectedOrderForPOS.discountAmount && parseFloat(selectedOrderForPOS.discountAmount.toString()) > 0) {
        const discount = {
          type: (selectedOrderForPOS.discountType as "percentage" | "fixed") || "fixed",
          value: parseFloat(selectedOrderForPOS.discountValue?.toString() || "0"),
          amount: parseFloat(selectedOrderForPOS.discountAmount.toString()),
          reason: selectedOrderForPOS.discountReason || undefined
        };
        console.log("💸 Applying discount from order:", discount);
        setAppliedDiscount(discount);
      }
      if (loadOrder) {
        loadOrder(selectedOrderForPOS.id.toString());
      }
      setCart(cartItems);
      setTimeout(() => {
        if (processedOrderRef.current === orderId) {
          processedOrderRef.current = null;
        }
      }, 1000);
      setHasUnsavedChanges(true);
    } else if (!selectedOrderForPOS) {
      console.log("📋 No selected order, resetting processed order reference");
      processedOrderRef.current = null;
    }
  }, [selectedOrderForPOS, loadOrder, posItems, isPaymentCompleted, isTableManuallySelected]);

  useEffect(() => {
    if (currentOrder && currentOrder.items && currentOrder.items.length > 0) {
      const currentOrderId = currentOrder.id.toString();
      console.log("📋 Current order loaded:", { orderId: currentOrderId, items: currentOrder.items.length });
      
      // Don't reload cart if user is actively editing (has unsaved changes)
      if (hasUnsavedChanges) {
        console.log("🚫 Blocking currentOrder cart reload - user has unsaved changes");
        return;
      }
      
      if (selectedOrderForPOS && selectedOrderForPOS.id.toString() === currentOrderId && processedOrderRef.current !== currentOrderId) {
        processedOrderRef.current = currentOrderId;
        const cartItems: POSCartItem[] = currentOrder.items
          .map((item: any, index: number) => {
            if (item.menuItem) {
              return {
                id: `current-${currentOrder.id}-menu-${item.menuItem.id}-${index}`,
                name: item.menuItem.name,
                price: item.menuItem.price,
                quantity: item.quantity,
                type: "menu_item" as const,
                menuItemId: item.menuItem.id,
                originalItem: item.menuItem,
                stockEntryId: undefined,
                notes: item.notes || undefined
              };
            } else if (item.material) {
              return {
                id: `current-${currentOrder.id}-material-${item.material.id}-${index}`,
                name: item.material.name,
                price: parseFloat(item.unitPrice),
                quantity: item.quantity,
                type: "material" as const,
                materialId: item.material.id,
                originalItem: item.material,
                stockEntryId: undefined,
                notes: item.notes || undefined
              };
            }
            return null;
          })
          .filter(Boolean) as POSCartItem[];
        console.log("🛒 Cart updated from current order:", { orderId: currentOrderId, items: cartItems.length });
        setCart(cartItems);
        setOrderType(currentOrder.orderType);
        if (currentOrder.orderType === "table" && currentOrder.tableId) {
          console.log("📍 Setting selected table for current order:", currentOrder.tableId);
          setSelectedTable(tables.find(t => t.id === currentOrder.tableId));
        }
        if (currentOrder.discountAmount && parseFloat(currentOrder.discountAmount.toString()) > 0) {
          const discount = {
            type: (currentOrder.discountType as "percentage" | "fixed") || "fixed",
            value: parseFloat(currentOrder.discountValue?.toString() || "0"),
            amount: parseFloat(currentOrder.discountAmount.toString()),
            reason: currentOrder.discountReason || undefined
          };
          console.log("💸 Applying discount from current order:", discount);
          setAppliedDiscount(discount);
        }
        setHasUnsavedChanges(true);
        setTimeout(() => {
          if (processedOrderRef.current === currentOrderId) {
            processedOrderRef.current = null;
          }
        }, 1000);
      }
    }
  }, [currentOrder, selectedOrderForPOS, tables]);

  const clearCartWithAnimation = useCallback(() => {
    console.log("🛒 Clearing cart with animation");
    setCart([]);
    setHasUnsavedChanges(false);
    setIsPaymentCompleted(false);
    setIsTableManuallySelected(false);
    processedOrderRef.current = null;
  }, []);

  const resetToTakeaway = useCallback(() => {
    console.log("📋 Resetting order type to takeaway");
    setOrderType("takeaway");
    setSelectedTable(undefined);
    setShowTablesLayout(false);
  }, []);

  const clearCart = useCallback(() => {
    console.log("🛒 Clearing cart");
    setCart([]);
    setHasUnsavedChanges(false);
  }, []);

  const handleShowReports = useCallback(() => {
    console.log("📊 Opening reports dialog");
    setShowReportsDialog(true);
  }, []);

  const handleShowDiscount = useCallback(() => {
    if (cart.length === 0) {
      console.log("💸 Attempted to apply discount to empty cart");
      showError("Cannot apply discount to empty cart");
      return;
    }
    console.log("💸 Opening discount dialog");
    setShowDiscountDialog(true);
  }, [cart.length, showError]);

  const handleDiscountAmountChange = useCallback((amount: number) => {
    console.log("💸 Discount amount changed:", amount);
    setDiscountAmount(amount);
  }, []);

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
    [cart, showError, showSuccess]
  );

  const handleRemoveDiscount = useCallback(() => {
    console.log("💸 Removing discount");
    setAppliedDiscount(null);
    setDiscountAmount(0);
    showSuccess("Discount removed");
  }, [showSuccess]);

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
    [showSuccess]
  );

  const handleShowItemNotes = useCallback((item: POSCartItem) => {
    console.log("📝 Opening item notes dialog for:", item.id);
    const itemCopy = { ...item };
    setSelectedItemForNotes(itemCopy);
    setShowItemNotesDialog(true);
  }, []);

  const handleCloseItemNotes = useCallback(() => {
    console.log("📝 Closing item notes dialog");
    setShowItemNotesDialog(false);
    setSelectedItemForNotes(null);
  }, []);

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
    [lastSaleData, showError, currentOrder, cart, subtotal, total, appliedDiscount]
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
    [selectPrinter, printerSelectionContext, handlePaymentWithPrinter, handlePrintReceiptWithPrinter]
  );

  const handleClosePrinterSelector = useCallback(() => {
    console.log("🖨️ Closing printer selector");
    setShowPrinterSelector(false);
    setPrinterSelectionContext(null);
  }, []);

  const handleShowPrinterSettings = useCallback(() => {
    console.log("🖨️ Opening printer settings");
    setPrinterSelectionContext("manual_print");
    setShowPrinterSelector(true);
  }, []);

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
  }, []);

  const handleOrderSelect = useCallback(
    async (order: any) => {
      console.log("📋 Selecting order:", { orderId: order.id });
      try {
        setIsLoading(true);
        setError(null);
        setCart([]);
        setHasUnsavedChanges(false);
        setAppliedDiscount(null);
        setDiscountAmount(0);
        if (loadOrder) {
          console.log("📋 Loading order details:", order.id);
          await loadOrder(order.id);
        } else {
          console.error("❌ loadOrder function is not available!");
        }
        setHasUnsavedChanges(false);
      } catch (error) {
        console.error("❌ Failed to load order:", error);
        showError("Failed to load order for editing. Please try again.");
      } finally {
        setIsLoading(false);
      }
    },
    [loadOrder, showError]
  );

  useEffect(() => {
    if (selectedOrderForPOS) {
      console.log("📋 Processing selected order for POS:", { orderId: selectedOrderForPOS.id });
      handleOrderSelect(selectedOrderForPOS)
        .then(() => {
          if (onOrderProcessed) {
            console.log("📋 Order processed callback triggered");
            onOrderProcessed();
          }
        })
        .catch(error => {
          console.error("❌ Failed to process order:", error);
          if (onOrderProcessed) {
            onOrderProcessed();
          }
        });
    }
  }, [selectedOrderForPOS, handleOrderSelect, onOrderProcessed]);

  useEffect(() => {
    console.log("📍 Updating section assignments:", { count: sectionAssignments.length });
    setOptimisticAssignments(sectionAssignments);
  }, [sectionAssignments]);

  useEffect(() => {
    return () => {
      console.log("🧹 Cleaning up timeouts");
      if (errorTimeoutRef.current) {
        clearTimeout(errorTimeoutRef.current);
      }
      if (successTimeoutRef.current) {
        clearTimeout(successTimeoutRef.current);
      }
      if (checkmarkTimeoutRef.current) {
        clearTimeout(checkmarkTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (stock && stock.length > 0) {
      console.log("📦 Stock entries updated:", { count: stock.length });
      setStockEntries(stock);
    }
  }, [stock]);

  useEffect(() => {
    if (menu && menu.length > 0) {
      console.log("🍽️ Menu items updated:", { count: menu.length });
      setMenuItems(menu);
    }
  }, [menu]);

  useEffect(() => {
    if (menu && stock) {
      console.log("🛍️ Converting menu and stock to POS items");
      const convertToPOSItems = () => {
        const posItemsFromData: POSItem[] = [];
        menu.forEach(menuItem => {
          if (menuItem.isPOSItem) {
            posItemsFromData.push({
              id: `menu-${menuItem.id}`,
              name: menuItem.name,
              price: menuItem.price,
              category: menuItem.category,
              type: "menu_item",
              menuItemId: menuItem.id,
              unit: menuItem.unit,
              availableQuantity: menuItem.availableQuantity,
              costPerUnit: menuItem.costPerUnit,
              createdAt: menuItem.createdAt.toString(),
              updatedAt: menuItem.updatedAt.toString(),
              description: menuItem.description,
              image: menuItem.image
            });
          }
        });

        stock.forEach(stockEntry => {
          if (stockEntry.isPOSItem && stockEntry.material) {
            posItemsFromData.push({
              id: `stock-${stockEntry.id}`,
              name: stockEntry.material.name,
              price: stockEntry.costPerBaseUnit || 0,
              category: stockEntry.material.category,
              type: "stock_entry",
              materialId: Number(stockEntry.materialId),
              unit: stockEntry.material.baseUnit,
              description: `${stockEntry.material.name} - ${stockEntry.material.baseUnit}`,
              availableQuantity: 0,
              costPerUnit: stockEntry.costPerBaseUnit || 0,
              createdAt: "",
              updatedAt: ""
            });
          }
        });
        // console.log("🛍️ POS items generated:", { count: posItemsFromData.length });
        setPosItems(posItemsFromData);
      };
      convertToPOSItems();
    }
  }, [menu, stock, status.isLoading]);

  useEffect(() => {
    const fetchAdditionalData = async () => {
      console.log("📍 Fetching additional data (tables)");
      try {
        setIsLoading(true);
        const tablesResponse = await tablesAPI.getTables({ includeOrders: true });
        const responseData = tablesResponse.data as Table[] | { data: Table[] };
        const tablesData = Array.isArray(responseData) ? responseData : responseData.data || [];
        console.log("📍 Tables fetched:", { count: tablesData.length });
        setTables(tablesData);
      } catch (error) {
        console.error("❌ Failed to load tables:", error);
        showError("Failed to load additional data");
      } finally {
        setIsLoading(false);
      }
    };
    if (!status.isLoading && menu.length > 0 && stock.length > 0) {
      fetchAdditionalData();
    }
  }, [status.isLoading, menu.length, stock.length, showError]);

  useEffect(() => {
    const loadSavedOrder = async () => {
      const savedOrder = OrderPersistence.loadCurrentOrder();
      if (savedOrder && savedOrder.items && savedOrder.items.length > 0) {
        console.log("📋 Restoring saved order:", { orderType: savedOrder.orderType, itemCount: savedOrder.items.length });
        const cartItems: POSCartItem[] = savedOrder.items
          .map(item => {
            let originalItem: StockEntryWithMaterial | MenuItem;
            if (item.type === "material" && item.materialId) {
              originalItem = stockEntries.find(se => se.materialId === item.materialId);
            } else if (item.type === "menu_item" && item.menuItemId) {
              originalItem = menuItems.find(m => m.id === item.menuItemId);
            }
            if (!originalItem) {
              console.warn("⚠️ Original item not found for saved order item:", item);
              return null;
            }
            return {
              id: item.id,
              name: item.name,
              price: item.unitPrice,
              quantity: item.quantity,
              type: item.type as "material" | "menu_item",
              originalItem,
              notes: item.notes || undefined
            };
          })
          .filter(Boolean) as POSCartItem[];
        setCart(cartItems);
        setOrderType(savedOrder.orderType);
        if (savedOrder.tableId) {
          const table = tables.find(t => t.id === savedOrder.tableId);
          console.log("📍 Restoring selected table:", savedOrder.tableId);
          setSelectedTable(table);
        }
        setHasUnsavedChanges(true);
        showSuccess("Previous order restored from auto-save");
      }
    };
    if (optimisticAssignments.length > 0 && menuItems.length > 0) {
      loadSavedOrder();
    }
  }, [optimisticAssignments, menuItems, stockEntries, tables, showSuccess]);

  useEffect(() => {
    if (!stockEntries.length && !menuItems.length) {
      console.log("📦 No stock or menu items available");
      return;
    }
  }, [currentOrder, stockEntries, menuItems]);

  useEffect(() => {
    console.log("🛒 Cart change detected:", { hasItems: cart.length > 0, itemCount: cart.length });
    if (cart && cart.length > 0) {
      setHasUnsavedChanges(true);
    } else {
      setHasUnsavedChanges(false);
    }
  }, [cart]);

  useEffect(() => {
    console.log("🍽️ Fetching menu items");
    const fetchMenuItems = async () => {
      try {
        const response = await menuAPI.getMenus();
        console.log("🍽️ Menu items fetched:", { count: response.data.length });
        setMenuItems(response.data);
      } catch (error) {
        console.error("❌ Failed to load menu items:", error);
        showError("Failed to load menu items");
      }
    };

    fetchMenuItems();
  }, [showError]);

  const fetchTablesData = useCallback(async () => {
    console.log("📍 Fetching tables data");
    try {
      const tablesResponse = await tablesAPI.getTables({ includeOrders: true });
      const responseData = tablesResponse.data as Table[] | { data: Table[] };
      const tablesData = Array.isArray(responseData) ? responseData : responseData.data || [];
      console.log("📍 Tables data refreshed:", { count: tablesData.length });
      setTables(tablesData);
    } catch (error) {
      console.error("❌ Failed to refresh tables data:", error);
    }
  }, []);

  const refreshOrderData = useCallback(async () => {
    console.log("🔄 Refreshing order data");
    await Promise.all([refreshOrders(), fetchTablesData(), refreshCountsRef?.current ? refreshCountsRef.current() : Promise.resolve()]);
  }, [refreshOrders, fetchTablesData, refreshCountsRef]);

  const refreshAllCounts = useCallback(async () => {
    console.log("🔄 Refreshing all counts (orders, inventory, tables)");
    await Promise.all([refreshOrders(), refreshInventory(), fetchTablesData(), refreshCountsRef?.current ? refreshCountsRef.current() : Promise.resolve()]);
  }, [refreshOrders, refreshInventory, fetchTablesData, refreshCountsRef]);

  useEffect(() => {
    console.log("📋 Starting incomplete orders polling");
    fetchIncompleteOrders();
    const interval = setInterval(fetchIncompleteOrders, 30000);
    return () => {
      console.log("📋 Stopping incomplete orders polling");
      clearInterval(interval);
    };
  }, [fetchIncompleteOrders]);

  const availablePosItems = posItems.filter(posItem => {
    const matchesSearch = searchTerm === "" || posItem.name.toLowerCase().includes(searchTerm.toLowerCase()) || posItem.category?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  const categories = ["all", ...Array.from(new Set(posItems.map(item => item.category).filter(Boolean)))];
  const filteredPosItems = activeCategory === "all" ? availablePosItems : availablePosItems.filter(item => item.category === activeCategory);
  // console.log("🛍️ Filtered POS items:", { activeCategory, count: filteredPosItems.length });

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
        console.log("💸 Recalculating employee discount:", employeeDiscount);
        setAppliedDiscount(employeeDiscount);
        setDiscountAmount(discountAmount);
      }
    },
    [selectedEmployee, orderType]
  );

  const addToCart = useCallback(
    (posItem: POSItem) => {
      console.log("🛒 Adding item to cart:", { itemId: posItem.id, name: posItem.name });
      const cartId = `pos-${posItem.id}`;
      setCart(prevCart => {
        const currentCart = prevCart || [];
        const existingItem = currentCart.find(cartItem => cartItem.id === cartId);
        let newCart: POSCartItem[];
        if (existingItem) {
          newCart = currentCart.map(cartItem => (cartItem.id === cartId ? { ...cartItem, quantity: cartItem.quantity + 1 } : cartItem));
          console.log("🛒 Updated existing item quantity:", { itemId: cartId, newQuantity: existingItem.quantity + 1 });
        } else {
          if (posItem.type === "menu_item") {
            const menuItemId = posItem.menuItemId;
            const menuItem = menuItems.find(mi => {
              const miId = typeof mi.id === "string" ? parseInt(mi.id) || 0 : mi.id;
              const targetId = typeof menuItemId === "string" ? parseInt(menuItemId) || 0 : menuItemId;
              return miId === targetId;
            });
            if (!menuItem) {
              console.warn("⚠️ Menu item not found for POS item:", posItem);
              return currentCart;
            }
            const newItem: POSCartItem = {
              id: cartId,
              name: posItem.name,
              price: posItem.price,
              quantity: 1,
              type: "menu_item",
              originalItem: menuItem,
              posItem,
              stockEntryId: undefined,
              menuItemId: typeof menuItemId === "string" ? parseInt(menuItemId) || 0 : menuItemId,
              printerId: menuItem?.printerId || posItem?.printerId,
              assignedPrinter: menuItem?.assignedPrinter || posItem?.assignedPrinter
            };
            newCart = [...currentCart, newItem];
            console.log("🛒 Added new menu item to cart:", newItem);
          } else {
            const stockEntry = stockEntries.find(se => {
              const stockEntryMaterialId = String(se.materialId);
              const posItemMaterialId = String(posItem.materialId);
              return stockEntryMaterialId === posItemMaterialId;
            });
            if (!stockEntry) {
              console.warn("⚠️ Stock entry not found:", posItem);
              return currentCart;
            }
            const newItem: POSCartItem = {
              id: cartId,
              name: posItem.name,
              price: posItem.price,
              quantity: 1,
              type: "material",
              originalItem: stockEntry,
              posItem,
              stockEntryId: posItem.materialId,
              menuItemId: undefined,
              printerId: stockEntry.printerId || posItem.printerId,
              assignedPrinter: stockEntry.assignedPrinter || posItem.assignedPrinter
            };
            newCart = [...currentCart, newItem];
            console.log("🛒 Added new material item to cart:", newItem);
          }
        }
        setTimeout(() => {
          recalculateEmployeeDiscount(newCart);
        }, 0);
        return newCart;
      });
    },
    [menuItems, stockEntries, recalculateEmployeeDiscount]
  );

  const updateCartQuantity = useCallback(
    (cartId: string, newQuantity: number) => {
      console.log("🛒 Updating cart item quantity:", { cartId, newQuantity });
      let newCart: POSCartItem[];
      if (newQuantity <= 0) {
        newCart = cart.filter(item => item.id !== cartId);
        console.log("🛒 Removed item from cart:", cartId);
        setCart(newCart);
      } else {
        newCart = cart.map(item => (item.id === cartId ? { ...item, quantity: newQuantity } : item));
        setCart(newCart);
      }
      recalculateEmployeeDiscount(newCart);
    },
    [cart, recalculateEmployeeDiscount]
  );

  const handleOrderTypeChange = useCallback((type: OrderType) => {
    console.log("📋 Changing order type:", type);
    setOrderType(type);
    if (type !== "table") {
      console.log("📍 Clearing selected table for non-table order type");
      setSelectedTable(undefined);
    }
  }, []);

  const handleTableSelect = useCallback(async () => {
    console.log("📍 Opening table selection layout");
    await fetchTablesData();
    setShowTablesLayout(true);
  }, [fetchTablesData]);

  const handleTableSelection = useCallback(
    async (table: Table) => {
      console.log("📍 Table selected:", { tableId: table.id, tableNumber: table.number });
      
      // Set flag to prevent selectedOrderForPOS from overriding this table selection
      setIsTableManuallySelected(true);
      
      // Clear any existing selectedOrderForPOS to prevent override
      if (onOrderProcessed) {
        onOrderProcessed();
      }
      
      // Clear current order state to prevent conflicts
      if (clearOrder) {
        clearOrder();
      }
      processedOrderRef.current = null;
      
      setSelectedTable(table);
      setOrderType("table");
      setShowTablesLayout(false);

      if (table.status === "opened" && table.currentOrder) {
        try {
          console.log("📋 Loading existing order for table:", table.currentOrder.orderId);
          const response = await ordersAPI.getOrder(table.currentOrder.orderId);
          const responseData = response.data as { data?: any } | any;
          const existingOrder = responseData.data || responseData;
          if (existingOrder && existingOrder.items) {
            const cartItems: POSCartItem[] = existingOrder.items
              .map(item => {
                let originalItem: StockEntryWithMaterial | MenuItem;
                
                if (item.type === "material" && item.materialId) {
                  originalItem = stockEntries.find(se => 
                    String(se.materialId) === String(item.materialId)
                  );
                } else if (item.type === "menu_item" && item.menuItemId) {
                  originalItem = menuItems.find(m => 
                    String(m.id) === String(item.menuItemId)
                  );
                }
                
                
                
                const cartItem = {
                  id: item.id,
                  name: item.name,
                  price: parseFloat(item.unitPrice.toString()),
                  quantity: item.quantity,
                  type: item.type as "material" | "menu_item",
                  originalItem: originalItem!,
                  notes: item.notes || undefined
                };
                return cartItem;
              })
              .filter(Boolean) as POSCartItem[];
            console.log("🛒 Loaded cart from table order:", { orderId: existingOrder.orderId, items: cartItems.length });
            setCart(cartItems);
            
            // 🔧 FIX: Load the existing order so that saving will update instead of creating new
            await loadOrder(existingOrder.id);
            console.log("📋 Loaded current order for table:", { orderId: existingOrder.id, orderNumber: existingOrder.orderNumber });
            
            // Load existing discount information if present
            if (existingOrder.discountAmount && parseFloat(existingOrder.discountAmount.toString()) > 0) {
              setAppliedDiscount({
                type: (existingOrder.discountType as "percentage" | "fixed") || "fixed",
                value: parseFloat(existingOrder.discountValue?.toString() || "0"),
                amount: parseFloat(existingOrder.discountAmount.toString()),
                reason: existingOrder.discountReason || undefined
              });
              setDiscountAmount(parseFloat(existingOrder.discountAmount.toString()));
              console.log("💰 Loaded existing discount:", { 
                type: existingOrder.discountType, 
                amount: existingOrder.discountAmount 
              });
            }
            
            // Load existing order notes if present
            if (existingOrder.notes) {
              setOrderNotes(existingOrder.notes);
              console.log("📝 Loaded existing order notes");
            }
            
            showSuccess(`Loaded existing order ${existingOrder.orderNumber} for Table ${table.number}`);
          }
        } catch (error) {
          console.error("❌ Failed to load table order:", error);
          showError("Failed to load existing table order");
        }
      } else {
        console.log("🛒 Clearing cart for new table order");
        setCart([]);
        // Clear all order-related state for new table order
        setAppliedDiscount(null);
        setDiscountAmount(0);
        setOrderNotes("");
        if (clearOrder) {
          clearOrder();
        }
        OrderPersistence.clearCurrentOrder();
        setHasUnsavedChanges(false);
        setSelectedEmployee(undefined);
        processedOrderRef.current = null;
        showSuccess(`Table ${table.number} selected - Ready for new order`);
      }

      await refreshOrderData();
      
      // Reset the flag after a longer delay to ensure table selection is protected
      setTimeout(() => {
        setIsTableManuallySelected(false);
      }, 5000);
    },
    [loadOrder, menuItems, stockEntries, showSuccess, showError, refreshOrderData, clearOrder]
  );

  const handleCloseTablesLayout = useCallback(() => {
    console.log("📍 Closing tables layout");
    setShowTablesLayout(false);
  }, []);

  const handleEmployeeSelection = useCallback(
    (employee: Employee) => {
      console.log("👤 Employee selected:", { employeeId: employee.id, name: `${employee.user?.firstName} ${employee.user?.lastName}` });
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
        console.log("💸 Applying employee discount:", employeeDiscount);
        setAppliedDiscount(employeeDiscount);
        setDiscountAmount(discountAmount);
        showSuccess(`Applied ${discountValue}% employee discount for ${employee.user?.firstName} ${employee.user?.lastName}`);
      }
    },
    [cart, showSuccess]
  );

  const handlePrintReceipt = useCallback(() => {
    console.log("🖨️ Initiating receipt print");
    const itemsToUse = currentOrder?.items && currentOrder.items.length > 0 ? currentOrder.items : cart;
    if (!itemsToUse || itemsToUse.length === 0) {
      console.log("🖨️ No items available for receipt");
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
    console.log("🖨️ Generated receipt data:", { receiptId: receiptData.id, items: receiptData.items.length });
    setLastSaleData(receiptData);
    if (hasSavedPrinter()) {
      const savedPrinter = getSavedPrinter();
      console.log("🖨️ Using saved printer for receipt:", savedPrinter?.name);
      handlePrintReceiptWithPrinter(savedPrinter);
    } else {
      console.log("🖨️ No saved printer, opening printer selector");
      setPrinterSelectionContext("manual_print");
      setShowPrinterSelector(true);
    }
  }, [cart, currentOrder, subtotal, total, appliedDiscount, showError, hasSavedPrinter, getSavedPrinter, handlePrintReceiptWithPrinter]);

  const handleVoidOrder = useCallback(() => {
    if (!currentOrder) {
      console.log("📋 No current order to void");
      showError("No current order to void");
      return;
    }
    if ((!cart || cart.length === 0) && !currentOrder.items?.length) {
      console.log("📋 Attempted to void empty order");
      showError("Cannot void an empty order");
      return;
    }
    console.log("📋 Opening void order dialog");
    setShowVoidDialog(true);
  }, [currentOrder, cart, showError]);

  const handleConfirmVoid = useCallback(
    async (reason: string, restoreStock: boolean) => {
      console.log("📋 Confirming order void:", { orderId: currentOrder?.id, reason, restoreStock });
      try {
        setShowVoidDialog(false);
        const result = await voidOrder(reason, restoreStock);
        console.log("📋 Order voided:", { orderId: currentOrder?.id, stockRestorations: result.stockRestorations?.length || 0 });
        clearCartWithAnimation();
        setHasUnsavedChanges(false);
        OrderPersistence.clearCurrentOrder();
        if (clearOrder) {
          clearOrder();
        }
        resetToTakeaway();
        await refreshAllCounts();
        let successMessage = "Order voided successfully";
        if (result.stockRestorations && result.stockRestorations.length > 0) {
          successMessage += `. Stock restored for ${result.stockRestorations.length} item(s).`;
        }
        showSuccess(successMessage);
      } catch (error) {
        console.error("❌ Failed to void order:", error);
      }
    },
    [voidOrder, clearCartWithAnimation, showSuccess, resetToTakeaway, clearOrder, refreshAllCounts]
  );

  const handleShowOrders = useCallback(() => {
    console.log("📋 Opening orders dialog");
    setShowOrdersDialog(true);
  }, []);

  const handleCancelOrder = useCallback(() => {
    console.log("📋 Canceling order");
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
    setError(null);
    setSuccessMessage(null);
  }, [clearOrder]);

  const formatItemsForPrinterCallback = useCallback(
    (items: POSCartItem[]): string => {
      console.log("🖨️ Formatting items for printer:", { itemCount: items.length });
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
      console.log("🖨️ Printing items to assigned printers:", { itemCount: cartItems.length });
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
        console.log("🖨️ Items grouped by printer:", { printerCount: itemsByPrinter.size });
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
            console.log("🖨️ Creating print job for printer:", { printerId, itemCount: items.length });
            const result = await printerAPI.createPrintJob(printJobData);
            console.log("🖨️ Print job created:", { printerId, jobId: result.job?.id });
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
          console.log("🖨️ Print results:", { successful: successfulPrints, total: totalPrinters });
          if (successfulPrints === totalPrinters) {
            showSuccess(`✅ Items printed to ${successfulPrints} printer(s) successfully!`);
          } else {
            showSuccess(`⚠️ Items printed to ${successfulPrints}/${totalPrinters} printers. Check printer status for failed prints.`);
          }
        } else if (totalPrinters > 0) {
          console.log("🖨️ All print jobs failed");
          showError(`❌ Failed to print items to assigned printers. Please check printer connectivity.`);
        }
      } catch (error) {
        console.error("❌ Error in printItemsToAssignedPrinters:", error);
        showError("Failed to print items to printers. Please try manual printing.");
      }
    },
    [showSuccess, showError, formatItemsForPrinterCallback]
  );

  const handleManualSave = useCallback(async () => {
    if (cart.length === 0) {
      console.log("📋 Attempted to save empty order");
      showError("Cannot save empty order");
      return;
    }
    console.log("📋 Saving order manually");
    try {
      setIsLoading(true);
      let savedOrder;
      if (currentOrder?.id) {
        // 🔧 FIX: Identify new items that need to be added to the existing order
        const existingOrderItems = currentOrder.items || [];
        const newItems = cart.filter(cartItem => {
          // Check if this cart item already exists in the order
          const existsInOrder = existingOrderItems.some(orderItem => {
            if (cartItem.type === "menu_item" && orderItem.type === "menu_item") {
              return String(orderItem.menuItemId) === String((cartItem.originalItem as MenuItem).id);
            } else if (cartItem.type === "material" && orderItem.type === "material") {
              return String(orderItem.materialId) === String((cartItem.originalItem as StockEntryWithMaterial).materialId);
            }
            return false;
          });
          return !existsInOrder;
        });

        if (newItems.length > 0) {
          // Add only the new items to the existing order
          const itemsToAdd = newItems.map(item => ({
            materialId: item.type === "material" ? String((item.originalItem as StockEntryWithMaterial).materialId) : undefined,
            menuItemId: item.type === "menu_item" ? String((item.originalItem as MenuItem).id) : undefined,
            assignmentId: undefined,
            name: item.name,
            quantity: item.quantity,
            unitPrice: item.price,
            totalPrice: item.price * item.quantity,
            type: item.type as "material" | "menu_item",
            notes: item.notes || undefined
          }));
          
          console.log("📋 Adding new items to existing order:", { 
            orderId: currentOrder.id, 
            existingItems: existingOrderItems.length,
            newItems: itemsToAdd.length 
          });
          
          // Use addOrderItems API instead of updateOrder
          const response = await ordersAPI.addOrderItems(currentOrder.id, itemsToAdd);
          savedOrder = response.data;
        } else {
          // No new items, just update discount/notes if changed
          const updateData = {
            discountType: appliedDiscount?.type,
            discountValue: appliedDiscount?.value,
            discountAmount: appliedDiscount?.amount || 0,
            discountReason: appliedDiscount?.reason,
            notes: orderNotes || undefined
          };
          console.log("📋 Updating existing order metadata:", { orderId: currentOrder.id });
          savedOrder = await updateOrder(updateData);
        }
      } else {
        const createData = {
          orderType,
          tableId: selectedTable?.id,
          employeeId: selectedEmployee?.id,
          items: cart.map(item => {
            return {
              materialId: item.type === "material" ? String((item.originalItem as StockEntryWithMaterial).materialId) : undefined,
              menuItemId: item.type === "menu_item" ? String((item.originalItem as MenuItem).id) : undefined,
              assignmentId: undefined,
              name: item.name,
              quantity: item.quantity,
              unitPrice: item.price,
              totalPrice: item.price * item.quantity,
              type: item.type as "material" | "menu_item",
              notes: item.notes || undefined,
              menuItem: item.type === "menu_item"
            };
          }),
          notes: orderNotes || undefined,
          discountType: appliedDiscount?.type,
          discountValue: appliedDiscount?.value,
          discountAmount: appliedDiscount?.amount || 0,
          discountReason: appliedDiscount?.reason
        };
        console.log("📋 Creating new order:", { orderType, itemCount: createData.items.length });
        savedOrder = await createOrder(createData);
      }
      const orderIdentifier = savedOrder?.orderNumber || savedOrder?.id || savedOrder?.order?.orderNumber || savedOrder?.order?.id || currentOrder?.orderNumber || currentOrder?.id || "New Order";
      console.log("📋 Order saved:", { orderIdentifier });
      showSuccess(`Order ${orderIdentifier} saved successfully!`);
      await printItemsToAssignedPrinters(cart);
      
      // Clear the selected order to prevent reload
      if (onOrderProcessed) {
        onOrderProcessed();
      }
      
      // Set flag to prevent order reload after save
      setIsPaymentCompleted(true);
      
      clearCartWithAnimation();
      
      // Delay the refresh to allow database to update and prevent immediate reload
      setTimeout(async () => {
        await refreshOrderData();
        setIsPaymentCompleted(false);
      }, 2000);
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
    } catch (error) {
      console.error("❌ Failed to save order:", error);
      showError("Failed to save order. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }, [cart, orderType, selectedTable, selectedEmployee, appliedDiscount, orderNotes, currentOrder, createOrder, updateOrder, clearOrder, clearCartWithAnimation, showSuccess, showError, refreshOrderData, printItemsToAssignedPrinters]);

  const handlePayment = useCallback(async () => {
    if (cart.length === 0) {
      console.log("💳 Attempted payment with empty cart");
      showError("Cart is empty");
      return;
    }
    if (currentOrder && currentOrder.status === "paid") {
      const orderIdentifier = currentOrder?.orderNumber || currentOrder?.id || "Current Order";
      console.log("💳 Order already paid:", orderIdentifier);
      showError(`Order ${orderIdentifier} is already completed`);
      setShowPaymentDialog(false);
      clearOrder();
      return;
    }
    console.log("💳 Initiating payment");
    setIsLoading(true);
    try {
      let orderToComplete = currentOrder;
      if (!currentOrder) {
        const orderData = {
          orderType,
          tableId: selectedTable?.id,
          employeeId: selectedEmployee?.id,
          items: cart.map(item => {
            const orderItem = {
              materialId: item.type === "material" ? String((item.originalItem as StockEntryWithMaterial).materialId) : undefined,
              menuItemId: item.type === "menu_item" ? String((item.originalItem as MenuItem).id) : undefined,
              assignmentId: undefined,
              name: item.name,
              quantity: item.quantity,
              unitPrice: item.price,
              totalPrice: item.price * item.quantity,
              type: item.type as "material" | "menu_item",
              notes: item.notes || undefined,
              menuItem: item.type === "menu_item"
            };
            return orderItem;
          }),
          notes: orderNotes || undefined,
          discountType: appliedDiscount?.type,
          discountValue: appliedDiscount?.value,
          discountAmount: appliedDiscount?.amount || 0,
          discountReason: appliedDiscount?.reason
        };
        console.log("📋 Creating order for payment:", { orderType, itemCount: orderData.items.length });
        const createOrderResponse = await createOrder(orderData);
        if (createOrderResponse && typeof createOrderResponse === "object" && "order" in createOrderResponse) {
          orderToComplete = (createOrderResponse as any).order;
        } else {
          orderToComplete = createOrderResponse;
        }
      }
      if (!orderToComplete && currentOrder) {
        orderToComplete = currentOrder;
      }
      if (!orderToComplete) {
        throw new Error("No order available - both orderToComplete and currentOrder are null");
      }
      if (!orderToComplete.id) {
        const orderAny = orderToComplete as any;
        const orderId = orderToComplete.id || orderAny.orderId || orderAny.orderNumber;
        if (orderId) {
          orderToComplete.id = orderId;
        } else {
          throw new Error(`Order created but missing ID. Order structure: ${JSON.stringify(orderToComplete)}`);
        }
      }
      const paymentData = {
        paymentMethod: "cash",
        paymentAmount: parseFloat(paymentAmount) || total,
        change: Math.max(0, (parseFloat(paymentAmount) || total) - total)
      };
      console.log("💳 Processing payment:", { orderId: orderToComplete.id, paymentAmount: paymentData.paymentAmount });
      const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error("Order completion timeout - API call took too long")), 15000));
      const response = (await Promise.race([ordersAPI.completeOrder(orderToComplete.id, paymentData), timeoutPromise])) as any;
      let order: any, saleId: string;

      if (response?.data) {
        if (response.data.order && response.data.saleId) {
          order = response.data.order;
          saleId = response.data.saleId;
        } else if (response.data.order) {
          order = response.data.order;
          saleId = order.id || `sale-${Date.now()}`;
        } else if (response.data.id) {
          order = response.data;
          saleId = response.data.id;
        } else {
          order = { id: orderToComplete.id, items: cart, subtotal: subtotal, tax: tax, total: total, status: "completed" };
          saleId = `sale-${Date.now()}`;
        }
      } else {
        order = { id: orderToComplete.id, items: cart, subtotal: subtotal, tax: tax, total: total, status: "completed" };
        saleId = `sale-${Date.now()}`;
      }
      console.log("💳 Payment completed:", { saleId, orderId: order.id });

      const receiptData = {
        id: saleId || `receipt-${Date.now()}`,
        date: new Date().toLocaleDateString(),
        time: new Date().toLocaleTimeString(),
        cashier: "",
        items: (order.items || cart).map(item => ({
          name: item.name,
          quantity: item.quantity,
          unitPrice: item.unitPrice || item.price,
          totalPrice: item.totalPrice || item.price * item.quantity,
          type: item.type
        })),
        subtotal: order.subtotal || subtotal,
        tax: order.tax || tax,
        total: order.total || total,
        paymentAmount: paymentData.paymentAmount,
        change: paymentData.change || 0,
        paymentMethod: paymentData.paymentMethod,
        discountType: order.discountType || appliedDiscount?.type || null,
        discountValue: order.discountValue ? (typeof order.discountValue === "string" ? parseFloat(order.discountValue) : order.discountValue) : appliedDiscount?.value || null,
        discountAmount: order.discountAmount ? (typeof order.discountAmount === "string" ? parseFloat(order.discountAmount) : order.discountAmount) : appliedDiscount?.amount || null,
        discountReason: order.discountReason || appliedDiscount?.reason || null
      };
      console.log("🖨️ Generated receipt for payment:", { receiptId: receiptData.id, items: receiptData.items.length });

      if (selectedTable && orderType === "table") {
        try {
          console.log("📍 Clearing table reservation:", selectedTable.id);
          await tablesAPI.clearReservation(selectedTable.id);
          const tablesResponse = await tablesAPI.getTables({ includeOrders: true });
          const responseData = tablesResponse.data as Table[] | { data: Table[] };
          const refreshedTables = Array.isArray(responseData) ? responseData : responseData.data || [];
          console.log("📍 Tables refreshed after payment:", { count: refreshedTables.length });
          setTables(refreshedTables);
        } catch (error) {
          console.error("⚠️ Table update error (non-critical):", error);
        }
      }

      if (selectedEmployee && orderType === "employees") {
        try {
          const { recordEmployeeUsageWithSettlementUpdate } = await import("@/utils/employeeUsageUtils");
          const posTransactionId = order.orderNumber || saleId;
          console.log("👤 Recording employee usage:", { employeeId: selectedEmployee.id, transactionId: posTransactionId });
          await recordEmployeeUsageWithSettlementUpdate(selectedEmployee, cart, posTransactionId);
          console.log("✅ Employee usage recorded and settlement updated");
        } catch (error) {
          console.error("⚠️ Employee usage recording error (non-critical):", error);
        }
      }
      await printItemsToAssignedPrinters(cart);
      setLastSaleData(receiptData);
      setShowReceiptDialog(true);
      setShouldAutoPrint(hasSavedPrinter());
      setShowPaymentDialog(false);
      setPaymentAmount("");
      
      // Set payment completed flag to prevent order reloading
      setIsPaymentCompleted(true);
      
      // Clear all order-related state immediately
      setAppliedDiscount(null);
      setDiscountAmount(0);
      setOrderNotes("");
      setSelectedEmployee(null);
      setHasUnsavedChanges(false);
      processedOrderRef.current = null;
      
      // Clear order persistence
      OrderPersistence.clearCurrentOrder();
      
      // Clear cart with animation
      setTimeout(() => {
        clearCartWithAnimation();
      }, 100);
      
      // Reset to takeaway mode
      resetToTakeaway();
      
      // Refresh counts but prevent order reloading
      await refreshAllCounts();
      
      // Reset payment completed flag after a delay to allow for proper cleanup
      setTimeout(() => {
        setIsPaymentCompleted(false);
      }, 2000);
      if (onSaleComplete) {
        const response = {
          sale: { id: saleId },
          message: "Sale completed"
        } as SaleResponse;
        console.log("💳 Sale completion callback triggered:", { saleId });
        onSaleComplete(response);
      }
    } catch (error: unknown) {
      console.error("❌ Payment failed:", error);
      const errorMessage = error && typeof error === "object" && "response" in error && error.response && typeof error.response === "object" && "data" in error.response && error.response.data && typeof error.response.data === "object" && "message" in error.response.data ? (error.response.data.message as string) : "Sale failed. Please try again.";
      showError(errorMessage);
      setShowPaymentDialog(false);
    } finally {
      setIsLoading(false);
    }
  }, [cart, total, paymentAmount, subtotal, tax, showError, clearCartWithAnimation, onSaleComplete, currentOrder, selectedTable, selectedEmployee, orderType, orderNotes, clearOrder, resetToTakeaway, createOrder, appliedDiscount, refreshAllCounts, hasSavedPrinter, printItemsToAssignedPrinters]);

  const handleMouseDown = () => {
    console.log("🖱️ Starting panel resize");
    setIsResizing(true);
    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!containerRef.current) return;
    const containerRect = containerRef.current.getBoundingClientRect();
    const newWidth = ((e.clientX - containerRect.left) / containerRect.width) * 100;
    const minWidth = 20;
    const maxWidth = 60;
    if (newWidth >= minWidth && newWidth <= maxWidth) {
      console.log("🖱️ Resizing panel:", { newWidth });
      setLeftPanelWidth(newWidth);
      const rightPanelWidth = 100 - newWidth;
      const calculatedRightPanelPixelWidth = (rightPanelWidth / 100) * containerRect.width;
      setRightPanelPixelWidth(calculatedRightPanelPixelWidth);
    }
  };

  const handleMouseUp = () => {
    console.log("🖱️ Panel resize completed");
    setIsResizing(false);
    document.removeEventListener("mousemove", handleMouseMove);
    document.removeEventListener("mouseup", handleMouseUp);
  };

  return (
    <>
      <div ref={containerRef} className="h-full flex flex-col lg:flex-row bg-gray-50 safe-area-padding">
        {(cart && cart.length > 0) && !showSuccessCheckmark && (
          <div className="lg:hidden bg-white border-b border-gray-200 p-3 flex-shrink-0">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                {(cart && cart.length > 0) && (
                  <span className="text-sm text-blue-600 font-bold">
                    {currentOrder ? (
                      <div className="flex items-center space-x-1">
                        <span>{currentOrder.orderNumber}</span>
                        <span className={`text-xs font-medium ${currentOrder.status === "draft" ? "text-orange-600" : currentOrder.status === "paid" ? "text-green-600" : currentOrder.status === "cancelled" ? "text-red-600" : "text-gray-600"}`}>({currentOrder.status})</span>
                      </div>
                    ) : cart && cart.length > 0 && (orderType === "delivery" || orderType === "takeaway" || orderType === "bar" || orderType === "employees" || orderType === "table") ? (
                      <span>{generatePreviewOrderNumber()}</span>
                    ) : hasUnsavedChanges ? (
                      <span>{generatePreviewOrderNumber()}</span>
                    ) : null}
                  </span>
                )}
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-600">{cart && cart.length > 0 ? `${cart.length} items` : "Empty"}</span>
                {cart && cart.length > 0 && (
                  <>
                    <Button variant="outline" size="sm" onClick={() => setShowDiscountDialog(true)} className="text-xs px-2 py-1 h-6" disabled={currentOrder?.status === "paid" || currentOrder?.status === "served"}>
                      <DollarSign className="w-3 h-3 mr-1" />
                      Discount
                    </Button>
                    <Trash2 className="w-4 h-4 text-red-600 cursor-pointer" onClick={clearCart} />
                  </>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Left Panel - Cart/Order Details (Desktop) / Full Width (Mobile) */}
        <div
          className="cart flex flex-col h-full bg-white lg:border-r lg:border-gray-200"
          style={{
            width: typeof window !== "undefined" && window.innerWidth >= 1024 ? `${leftPanelWidth}%` : "100%"
          }}
        >
          {/* Cart Header - Fixed (Desktop Only) */}
          <div className="card-header hidden lg:block border-b border-gray-200 px-3 flex-shrink-0">
            <div className={`flex items-center justify-between ${(cart && cart.length > 0) && !showSuccessCheckmark ? "py-2" : ""}`}>
              <div className="flex flex-col xl:flex-row items-start xl:items-center space-y-1 xl:space-y-0 xl:space-x-2">
                {/* Order Status Indicator */}
                {(cart && cart.length > 0) && !showSuccessCheckmark && (
                  <span className="text-lg text-blue-600 font-bold">
                    {currentOrder ? (
                      <div className="flex items-center space-x-1">
                        <span>{currentOrder.orderNumber}</span>
                        <span className={`text-xs font-medium ${currentOrder.status === "draft" ? "text-orange-600" : currentOrder.status === "paid" ? "text-green-600" : currentOrder.status === "cancelled" ? "text-red-600" : "text-gray-600"}`}>({currentOrder.status})</span>
                      </div>
                    ) : cart && cart.length > 0 && (orderType === "delivery" || orderType === "takeaway" || orderType === "bar" || orderType === "employees" || orderType === "table") ? (
                      <span>{generatePreviewOrderNumber()}</span>
                    ) : hasUnsavedChanges ? (
                      <span>{generatePreviewOrderNumber()}</span>
                    ) : null}
                  </span>
                )}
              </div>
              <div className="flex items-center space-x-2">
                {cart && cart.length > 0 && (
                  <>
                    <Button variant="outline" size="sm" onClick={() => setShowDiscountDialog(true)} className="text-xs px-2 py-1 h-7" disabled={currentOrder?.status === "paid" || currentOrder?.status === "served"}>
                      <DollarSign className="w-3 h-3" />
                      Discount
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => setShowNotesDialog(true)} className="text-xs px-2 py-1 h-7 relative" disabled={currentOrder?.status === "paid" || currentOrder?.status === "served"}>
                      <FileText className={`w-3 h-3 ${currentOrder?.notes || orderNotes ? "text-blue-500 drop-shadow-sm shadow-blue-500" : ""}`} />
                      Notes
                    </Button>
                    <Trash2 className="w-5 h-5 text-red-600 cursor-pointer" onClick={clearCart} />
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Order Items List - Scrollable */}
          <div className="flex-1 h-full relative overflow-hidden">
            <div className="h-full overflow-y-auto">
              <OrderItemsList
                cart={cart}
                updateCartQuantity={updateCartQuantity}
                orderType={orderType}
                selectedTable={selectedTable}
                selectedEmployee={selectedEmployee}
                onOrderTypeChange={handleOrderTypeChange}
                onTableSelect={handleTableSelect}
                onEmployeeSelect={handleEmployeeSelection}
                incompleteTableOrdersCount={incompleteTableOrdersCount}
                orderStatus={currentOrder?.status}
                isOrderCompleted={currentOrder?.status === "paid" || currentOrder?.status === "served"}
                discountReason={appliedDiscount?.reason || currentOrder?.discountReason}
                leftPanelPixelWidth={containerRef.current ? (leftPanelWidth / 100) * containerRef.current.offsetWidth : 0}
                onItemNotesChange={handleItemNotesChange}
                onShowItemNotes={handleShowItemNotes}
              />
            </div>

            {/* Success Animation Overlay */}
            {showSuccessCheckmark && (
              <div className="absolute inset-0 flex items-center justify-center z-10">
                <div className="text-center">
                  <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4 animate-scale-in" />
                  <p className="text-green-700 font-medium text-lg">Order Completed!</p>
                  <p className="text-green-600 text-sm mt-1">Cart cleared successfully</p>
                </div>
              </div>
            )}
          </div>

          {/* Order Summary - Fixed Footer */}
          {!showSuccessCheckmark && (
            <div className="flex-shrink-0 border-t border-gray-200 bg-white">
              <OrderSummary
                cart={cart}
                subtotal={subtotal}
                total={total}
                orderStatus={currentOrder?.status}
                isOrderCompleted={currentOrder?.status === "paid" || currentOrder?.status === "served"}
                appliedDiscount={appliedDiscount}
                onRemoveDiscount={handleRemoveDiscount}
                onPaymentClick={() => {
                  // Check if current order is already completed
                  if (currentOrder && currentOrder.status === "paid") {
                    const orderIdentifier = currentOrder?.orderNumber || currentOrder?.id || "Current Order";
                    showError(`Order ${orderIdentifier} is already completed`);
                    return;
                  }
                  setPaymentAmount(total.toString());
                  setShowPaymentDialog(true);
                }}
                onSaveClick={handleManualSave}
              />
            </div>
          )}
        </div>

        {/* Resize Handle (Desktop Only) */}
        {typeof window !== "undefined" && window.innerWidth >= 1024 && (
          <div onMouseDown={handleMouseDown} className={`hidden lg:block w-1 bg-gray-300/50 hover:bg-blue-400 cursor-col-resize transition-colors duration-200 relative group ${isResizing ? "bg-blue-500" : ""}`}>
            <div className="absolute inset-y-0 -left-1 -right-1 flex items-center justify-center">
              <GripVertical className="w-3 h-3 text-gray-400 group-hover:text-blue-500 transition-colors" />
            </div>
          </div>
        )}

        {/* Right Panel - Product Grid (Desktop) / Mobile Product Section */}
        <div
          className="products flex flex-col h-full bg-white"
          style={{
            width: typeof window !== "undefined" && window.innerWidth >= 1024 ? `${100 - leftPanelWidth}%` : "100%"
          }}
        >
          {/* Mobile Toggle Buttons (visible on mobile only) */}
          <div className="lg:hidden bg-gray-50 border-b border-gray-200 p-2 flex-shrink-0">
            <div className="flex space-x-2">
              <Button variant={activeView === "cart" ? "default" : "outline"} size="sm" onClick={() => setActiveView("cart")} className="flex-1 btn-touch">
                Cart ({cart?.length || 0})
              </Button>
              <Button variant={activeView === "products" ? "default" : "outline"} size="sm" onClick={() => setActiveView("products")} className="flex-1 btn-touch">
                Products
              </Button>
            </div>
          </div>

          {/* Mobile Cart View */}
          <div className={`lg:hidden ${activeView === "cart" ? "flex" : "hidden"} flex-col h-full`}>
            {/* Order Items List - Mobile */}
            <div className="flex-1 overflow-y-auto">
              <OrderItemsList
                cart={cart}
                updateCartQuantity={updateCartQuantity}
                orderType={orderType}
                selectedTable={selectedTable}
                selectedEmployee={selectedEmployee}
                onOrderTypeChange={handleOrderTypeChange}
                onTableSelect={handleTableSelect}
                onEmployeeSelect={handleEmployeeSelection}
                incompleteTableOrdersCount={incompleteTableOrdersCount}
                orderStatus={currentOrder?.status}
                isOrderCompleted={currentOrder?.status === "paid" || currentOrder?.status === "served"}
                discountReason={appliedDiscount?.reason || currentOrder?.discountReason}
                leftPanelPixelWidth={containerRef.current ? (leftPanelWidth / 100) * containerRef.current.offsetWidth : 0}
                onItemNotesChange={handleItemNotesChange}
                onShowItemNotes={handleShowItemNotes}
              />
            </div>

            {/* Order Summary - Mobile */}
            {!showSuccessCheckmark && (
              <div className="flex-shrink-0 border-t border-gray-200 bg-white safe-area-bottom">
                <OrderSummary
                  cart={cart}
                  subtotal={subtotal}
                  total={total}
                  orderStatus={currentOrder?.status}
                  isOrderCompleted={currentOrder?.status === "paid" || currentOrder?.status === "served"}
                  appliedDiscount={appliedDiscount}
                  onRemoveDiscount={handleRemoveDiscount}
                  onPaymentClick={() => {
                    setPaymentAmount(total.toString());
                    setShowPaymentDialog(true);
                  }}
                  onSaveClick={handleManualSave}
                />
              </div>
            )}
          </div>

          {/* Desktop/Mobile Product View */}
          <div className={`${activeView === "products" || (typeof window !== "undefined" && window.innerWidth >= 1024) ? "flex" : "hidden"} lg:flex flex-col h-full`}>
            {/* Top Controls - Fixed Header */}
            <div className="flex-shrink-0 border-b border-gray-200 bg-white">
              <CategoryTabs categories={categories} activeCategory={activeCategory} onCategoryChange={setActiveCategory} />
            </div>

            {/* Product Grid - Scrollable */}
            <div className="flex-1 overflow-y-auto !bg-gray-50">
              <VirtualizedProductGrid posItems={filteredPosItems} onAddToCart={addToCart} rightPanelPixelWidth={rightPanelPixelWidth} isLoading={status.isLoading || (posItems.length === 0 && (menu.length === 0 || stock.length === 0))} />
            </div>

            {/* Bottom Action Bar - Fixed Footer */}
            <div className="flex-shrink-0 border-t border-gray-200 bg-white safe-area-bottom">
              <ActionBar
                onSaveOrder={handleManualSave}
                onPrintReceipt={handlePrintReceipt}
                onVoidOrder={handleVoidOrder}
                onShowOrders={handleShowOrders}
                onShowReports={handleShowReports}
                onCancelOrder={handleCancelOrder}
                onDiscount={handleShowDiscount}
                hasUnsavedChanges={hasUnsavedChanges}
                isOrderLoading={orderLoading}
                canPrintReceipt={cart && cart.length > 0}
                canVoidOrder={!!currentOrder}
                incompleteOrdersCount={incompleteOrdersCount}
                incompleteDeliveryTakeawayCount={incompleteDeliveryTakeawayCount}
                onShowPrinterSettings={handleShowPrinterSettings}
                hasSavedPrinter={hasSavedPrinter()}
                savedPrinterName={getSavedPrinter()?.name}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Payment Dialog */}
      <PaymentDialog isOpen={showPaymentDialog} onClose={() => setShowPaymentDialog(false)} total={total} paymentAmount={paymentAmount} onPaymentAmountChange={setPaymentAmount} onPayment={handlePayment} isLoading={isLoading} />

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

      {/* Tables Layout Dialog */}
      {showTablesLayout && <TablesLayout tables={Array.isArray(tables) ? tables : []} selectedTable={selectedTable} onTableSelect={handleTableSelection} onClose={handleCloseTablesLayout} />}

      {/* Receipt Printer Dialog */}
      {showReceiptDialog && lastSaleData && (
        <ReceiptPrinter
          isOpen={showReceiptDialog}
          onClose={() => {
            setShowReceiptDialog(false);
            setShouldAutoPrint(false); // Reset auto-print flag
          }}
          receiptData={lastSaleData}
          autoPrint={shouldAutoPrint}
        />
      )}

      {/* Discount Dialog */}
      <DiscountDialog isOpen={showDiscountDialog} onClose={() => setShowDiscountDialog(false)} discountAmount={discountAmount} onDiscountAmountChange={handleDiscountAmountChange} onDiscount={() => {}} orderSubtotal={subtotal} onApplyDiscount={handleApplyDiscount} />

      {/* Payment Dialog */}
      <PaymentDialog isOpen={showPaymentDialog} onClose={() => setShowPaymentDialog(false)} total={total} paymentAmount={paymentAmount} onPaymentAmountChange={setPaymentAmount} onPayment={handlePayment} isLoading={isLoading} />

      {/* Void Order Dialog */}
      <VoidOrderDialog isOpen={showVoidDialog} onClose={() => setShowVoidDialog(false)} onConfirm={handleConfirmVoid} order={currentOrder} isLoading={orderLoading} />

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
            <PrinterSelector onPrinterSelect={handlePrinterSelect} selectedPrinterId={selectedPrinter?.id || null} label="Available Printers" showStatus={true} showTestButton={true} size="md" />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={handleClosePrinterSelector}>
              Cancel
            </Button>
            {hasSavedPrinter() && (
              <Button
                variant="outline"
                onClick={() => {
                  clearSelection();
                  handleClosePrinterSelector();
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
                  // Continue with the action that triggered this dialog
                }}
              >
                Discard Changes
              </Button>
              <Button
                onClick={() => {
                  handleManualSave();
                  setShowUnsavedDialog(false);
                }}
              >
                Save Order
              </Button>
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

      {/* Orders Management Dialog */}
      <POSClientOrders isOpen={showOrdersDialog} onClose={handleCloseOrdersDialog} onOrderSelect={handleOrderSelectCallback} onOrderStatusChange={fetchIncompleteOrders} />

      {/* Tables Layout Dialog */}
      {showTablesLayout && (
        <Dialog open={showTablesLayout} onOpenChange={setShowTablesLayout}>
          <DialogContent className="w-screen h-screen max-w-none max-h-none m-0 p-0 !z-50 bg-white overflow-hidden">
            <DialogTitle className="sr-only">Tables Layout</DialogTitle>
            <DialogDescription className="sr-only">Manage restaurant table layout and assignments</DialogDescription>
            <div className="w-full h-full flex flex-col overflow-hidden">
              <TablesLayout tables={tables} selectedTable={selectedTable} onTableSelect={handleTableSelection} onClose={handleCloseTablesLayout} tableOrders={tableOrders} />
            </div>
          </DialogContent>
        </Dialog>
      )}

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

      {/* Notes Dialog */}
      <NotesDialog isOpen={showNotesDialog} onClose={() => setShowNotesDialog(false)} notes={orderNotes} onNotesChange={setOrderNotes} />

      {/* Item Notes Dialog */}
      <ItemNotesDialog key={selectedItemForNotes?.id || "no-item"} isOpen={showItemNotesDialog} onClose={handleCloseItemNotes} item={selectedItemForNotes} onNotesChange={handleItemNotesChange} />
    </>
  );
};

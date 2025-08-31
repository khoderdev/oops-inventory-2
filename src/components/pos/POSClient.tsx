import { ordersAPI } from "@/api/orders.api";
import { tablesAPI } from "@/api/tables.api";
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
import { useVoidPrinter } from "./VoidPrinter";
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
import { ItemsGrid } from "./ItemsGrid";
import { ReceiptPrinter } from "./ReceiptPrinter";
import { TablesLayout } from "./TablesLayout";
import { VoidOrderDialog } from "./VoidOrderDialog";
import { Category } from "@/types/categories";
import { useMenuItems } from "@/contexts/MenuItemsContext";
import printerAPI from "@/api/printer.api";
import { posAPI } from "@/api/pos.api";

export const POSClient: React.FC<POSClientProps> = ({ sectionAssignments, onSaleComplete, onOrderSelect, selectedOrderForPOS, onOrderProcessed, refreshCountsRef, isDayOpen = true }) => {
  // Use MenuItemsContext for menu items data
  const { foodMenuItems, beverageMenuItems, menuItemsLoading, menuItemCategories, beverageCategories, fetchMenuItems, handleTabChange } = useMenuItems();
  const [cart, setCart] = useState<POSCartItem[]>([]);
  const [searchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [stockEntries, setStockEntries] = useState<StockEntryWithMaterial[]>([]);
  const [posItems, setPosItems] = useState<POSItem[]>([]);
  const [categoriesMap, setCategoriesMap] = useState<Map<number, string>>(new Map());
  const [isItemsGridStable, setIsItemsGridStable] = useState(false);
  const [isPOSActionInProgress, setIsPOSActionInProgress] = useState(false);
  const [isItemsGridLoading, setIsItemsGridLoading] = useState(true);
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
  const justSavedRef = useRef<boolean>(false);
  const completedOrdersRef = useRef<Set<string>>(new Set());
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

  // Ensure menu items are loaded from context (explicitly load both food and beverages)
  useEffect(() => {
    let cancelled = false;
    const ensureMenuItemsLoaded = async () => {
      try {
        await fetchMenuItems('both');
      } catch (e) {
        console.error("❌ POSClient: Failed to ensure menu items via context:", e);
      }
    };
    ensureMenuItemsLoaded();
    return () => {
      cancelled = true;
    };
  }, [fetchMenuItems]);

  const categories = useMemo(() => {
    const uniqueCategories = new Set<string>();
    uniqueCategories.add("all");
    posItems.forEach(item => {
      if (item.category) {
        if (typeof item.category === "string") {
          uniqueCategories.add(item.category);
        } else if (typeof item.category === "object" && item.category !== null && "name" in item.category) {
          // Handle Category object format
          uniqueCategories.add(item.category.name);
        } else if (typeof item.category === "number") {
          // Handle category ID format - use the categoriesMap to get the name
          const categoryName = categoriesMap.get(item.category);
          if (categoryName) {
            uniqueCategories.add(categoryName);
          }
        }
      }
    });

    return Array.from(uniqueCategories);
  }, [posItems, categoriesMap]);

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

  const handleCloseOrdersDialog = useCallback(() => {
    setShowOrdersDialog(false);
  }, []);

  const handleOrderSelectCallback = useCallback(
    (order: OrderSummaryType) => {
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
    setSuccessMessage(message);
    if (successTimeoutRef.current) clearTimeout(successTimeoutRef.current);
    successTimeoutRef.current = setTimeout(() => setSuccessMessage(null), 3000);
  }, []);

  useEffect(() => {
    const handleResize = () => {
      if (!containerRef.current) return;
      const containerWidth = containerRef.current.offsetWidth;
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

  // When switching back to the Products view (especially on mobile), force a re-measure
  // and allow the grid to refresh its items to avoid empty renders after being hidden.
  useEffect(() => {
    if (activeView === "products") {
      // Let layout settle, then trigger resize so rightPanelPixelWidth recalculates
      setTimeout(() => {
        try {
          window.dispatchEvent(new Event("resize"));
        } catch {}
        // Mark grid unstable so posItems state can refresh from memoizedPosItems if needed
        setIsItemsGridStable(false);
      }, 0);
    }
  }, [activeView]);

  useEffect(() => {
    // Block selectedOrderForPOS if there's already a current order being edited
    if (currentOrder && selectedOrderForPOS && currentOrder.id && selectedOrderForPOS.id && currentOrder.id.toString() === selectedOrderForPOS.id.toString()) {
      return;
    }

    // Block if order has been completed
    if (selectedOrderForPOS && completedOrdersRef.current.has(selectedOrderForPOS.id.toString())) {
      return;
    }

    if (selectedOrderForPOS && !isPaymentCompleted) {
      if (!selectedOrderForPOS.items || selectedOrderForPOS.items.length === 0) {
        if (loadOrder) {
          loadOrder(selectedOrderForPOS.id.toString());
        }
        return;
      }
      const orderId = selectedOrderForPOS.id.toString();
      if (processedOrderRef.current === orderId) {
        return;
      }
      processedOrderRef.current = orderId;

      // Check if this is a completed order - don't load it into cart
      if (selectedOrderForPOS.status === "completed" || selectedOrderForPOS.status === "paid") {
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
              orderItemId: item.id?.toString?.() || item.id,
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
              orderItemId: item.id?.toString?.() || item.id,
              notes: item.notes || undefined
            };
          }
          return null;
        })
        .filter(Boolean) as POSCartItem[];
      setOrderType(selectedOrderForPOS.orderType);
      if (selectedOrderForPOS.orderType === "table" && selectedOrderForPOS.tableId) {
        setSelectedTable(tables.find(t => t.id === selectedOrderForPOS.tableId));
      }
      if (selectedOrderForPOS.discountAmount && parseFloat(selectedOrderForPOS.discountAmount.toString()) > 0) {
        const discount = {
          type: (selectedOrderForPOS.discountType as "percentage" | "fixed") || "fixed",
          value: parseFloat(selectedOrderForPOS.discountValue?.toString() || "0"),
          amount: parseFloat(selectedOrderForPOS.discountAmount.toString()),
          reason: selectedOrderForPOS.discountReason || undefined
        };
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
      processedOrderRef.current = null;
    }
  }, [selectedOrderForPOS, loadOrder, posItems, isPaymentCompleted, isTableManuallySelected]);

  useEffect(() => {
    if (currentOrder && currentOrder.items && currentOrder.items.length > 0) {
      if (justSavedRef.current) {
        return;
      }
      const currentOrderId = currentOrder.id.toString();
      if (hasUnsavedChanges) {
        return;
      }
      if (selectedOrderForPOS && selectedOrderForPOS.id.toString() === currentOrderId && cart.length > 0) {
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
                orderItemId: item.id?.toString?.() || item.id,
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
                orderItemId: item.id?.toString?.() || item.id,
                notes: item.notes || undefined
              };
            }
            return null;
          })
          .filter(Boolean) as POSCartItem[];
        setCart(cartItems);
        setOrderType(currentOrder.orderType);
        if (currentOrder.orderType === "table" && currentOrder.tableId) {
          setSelectedTable(tables.find(t => t.id === currentOrder.tableId));
        }
        if (currentOrder.discountAmount && parseFloat(currentOrder.discountAmount.toString()) > 0) {
          const discount = {
            type: (currentOrder.discountType as "percentage" | "fixed") || "fixed",
            value: parseFloat(currentOrder.discountValue?.toString() || "0"),
            amount: parseFloat(currentOrder.discountAmount.toString()),
            reason: currentOrder.discountReason || undefined
          };
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
    setCart([]);
    setHasUnsavedChanges(false);
    setIsPaymentCompleted(false);
    setIsTableManuallySelected(false);
    processedOrderRef.current = null;
  }, []);

  const resetToTakeaway = useCallback(() => {
    setOrderType("takeaway");
    setSelectedTable(undefined);
    setShowTablesLayout(false);
  }, []);

  const clearCart = useCallback(() => {
    setCart([]);
    setHasUnsavedChanges(false);
  }, []);

  const handleShowReports = useCallback(() => {
    setShowReportsDialog(true);
  }, []);

  const handleShowDiscount = useCallback(() => {
    if (cart.length === 0) {
      showError("Cannot apply discount to empty cart");
      return;
    }
    setShowDiscountDialog(true);
  }, [cart.length, showError]);

  const handleDiscountAmountChange = useCallback((amount: number) => {
    setDiscountAmount(amount);
  }, []);

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
      setShowDiscountDialog(false);
      const discountText = discountData.type === "percentage" ? `${discountData.value}% discount` : `$${discountData.value} discount`;
      showSuccess(`${discountText} applied - Saved $${discountAmount.toFixed(2)}`);
    },
    [cart, showError, showSuccess]
  );

  const handleRemoveDiscount = useCallback(() => {
    setAppliedDiscount(null);
    setDiscountAmount(0);
    showSuccess("Discount removed");
  }, [showSuccess]);

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
    [showSuccess]
  );

  const handleShowItemNotes = useCallback((item: POSCartItem) => {
    const itemCopy = { ...item };
    setSelectedItemForNotes(itemCopy);
    setShowItemNotesDialog(true);
  }, []);

  const handleCloseItemNotes = useCallback(() => {
    setShowItemNotesDialog(false);
    setSelectedItemForNotes(null);
  }, []);

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
    [lastSaleData, showError, currentOrder, cart, subtotal, total, appliedDiscount]
  );

  const handlePrinterSelect = useCallback(
    (printer: any) => {
      selectPrinter(printer);
      setShowPrinterSelector(false);
      if (printerSelectionContext === "payment") {
      } else if (printerSelectionContext === "manual_print") {
        handlePrintReceiptWithPrinter(printer);
      }
      setPrinterSelectionContext(null);
    },
    [selectPrinter, printerSelectionContext, handlePrintReceiptWithPrinter]
  );

  const handleClosePrinterSelector = useCallback(() => {
    setShowPrinterSelector(false);
    setPrinterSelectionContext(null);
  }, []);

  const handleShowPrinterSettings = useCallback(() => {
    setPrinterSelectionContext("manual_print");
    setShowPrinterSelector(true);
  }, []);

  const fetchIncompleteOrders = useCallback(async () => {
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
        setTableOrders(tableOrdersMap);
      } else {
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
      try {
        setIsLoading(true);
        setError(null);
        setCart([]);
        setHasUnsavedChanges(false);
        setAppliedDiscount(null);
        setDiscountAmount(0);
        if (loadOrder) {
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
      handleOrderSelect(selectedOrderForPOS)
        .then(() => {
          if (onOrderProcessed) {
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
    setOptimisticAssignments(sectionAssignments);
  }, [sectionAssignments]);

  useEffect(() => {
    return () => {
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

  // Keep local menuItems in sync with context for legacy lookups in this component
  useEffect(() => {
    const combined = [...(foodMenuItems || []), ...(beverageMenuItems || [])];
    setMenuItems(combined);
  }, [foodMenuItems, beverageMenuItems]);

  // Build categories map from context categories
  useEffect(() => {
    const categoryMap = new Map<number, string>();
    if (menuItemCategories && menuItemCategories.length > 0) {
      menuItemCategories.filter(c => c.isActive).forEach(c => categoryMap.set(c.id, c.name));
    }
    if (beverageCategories && beverageCategories.length > 0) {
      beverageCategories.filter(c => c.isActive).forEach(c => categoryMap.set(c.id, c.name));
    }
    setCategoriesMap(categoryMap);
  }, [menuItemCategories, beverageCategories]);

  // Fetch POS items directly from API to get variants data
  const [apiPosItems, setApiPosItems] = useState<POSItem[]>([]);
  
  const fetchPOSItems = useCallback(async () => {
    try {
      const response = await posAPI.getPOSItems();
      if (response && response.data && response.data.data) {
        setApiPosItems(response.data.data);
      } else {
        setApiPosItems([]);
      }
    } catch (error) {
      console.error("Error fetching POS items:", error);
      setApiPosItems([]);
    }
  }, []);

  // Fetch POS items on mount and when menu items change
  useEffect(() => {
    fetchPOSItems();
  }, [fetchPOSItems, foodMenuItems, beverageMenuItems]);

  // Memoized POS items to prevent unnecessary re-renders during POS operations
  const memoizedPosItems = useMemo(() => {
    return apiPosItems;
  }, [apiPosItems]);

  // Update posItems state only when memoized items actually change and no POS action is in progress
  useEffect(() => {
    // Block updates during POS actions to prevent grid refresh
    if (isPOSActionInProgress) return;
    if (!isItemsGridStable) {
      setPosItems(memoizedPosItems);
      setIsItemsGridStable(true);
    } else {
      const hasSignificantChange = memoizedPosItems.length !== posItems.length || memoizedPosItems.some((item, index) => !posItems[index] || item.id !== posItems[index].id || item.name !== posItems[index].name || item.price !== posItems[index].price);
      if (hasSignificantChange) setPosItems(memoizedPosItems);
    }
    // Loading state mirrors context loading
    setIsItemsGridLoading(!!menuItemsLoading);
  }, [memoizedPosItems, isItemsGridStable, posItems, isPOSActionInProgress, menuItemsLoading]);

  const fetchTablesData = useCallback(async () => {
    try {
      const tablesResponse = await tablesAPI.getTables({ includeOrders: true });
      const responseData = tablesResponse.data as Table[] | { data: Table[] };
      const tablesData = Array.isArray(responseData) ? responseData : responseData.data || [];
      setTables(tablesData);
    } catch (error) {
      console.error("❌ Failed to refresh tables data:", error);
    }
  }, []);

  // Load tables data once POS items are available
  useEffect(() => {
    if (posItems.length > 0) {
      fetchTablesData();
    }
  }, [posItems.length, fetchTablesData]);

  useEffect(() => {
    const loadSavedOrder = async () => {
      const savedOrder = OrderPersistence.loadCurrentOrder();
      if (savedOrder && savedOrder.items && savedOrder.items.length > 0) {
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
      return;
    }
  }, [currentOrder, stockEntries, menuItems]);

  useEffect(() => {
    if (cart && cart.length > 0) {
      setHasUnsavedChanges(true);
    } else {
      setHasUnsavedChanges(false);
    }
  }, [cart]);

  const refreshAllCounts = useCallback(async () => {
    await Promise.all([fetchMenuItems(), fetchTablesData(), refreshCountsRef?.current ? refreshCountsRef.current() : Promise.resolve()]);
  }, [fetchMenuItems, fetchTablesData, refreshCountsRef]);

  const availablePosItems = posItems.filter(posItem => {
    const getCategoryString = (category: string | number | Category | { id: number; name: string; value: string } | undefined): string => {
      if (!category) return "";
      if (typeof category === "string") return category;
      if (typeof category === "number") return category.toString();
      if (typeof category === "object") {
        return category.name || category.value || "";
      }
      return "";
    };

    const categoryString = getCategoryString(posItem.category);
    const matchesSearch = searchTerm === "" || posItem.name.toLowerCase().includes(searchTerm.toLowerCase()) || categoryString.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  const filteredPosItems = activeCategory === "all" ? availablePosItems : availablePosItems.filter(item => item.category === activeCategory);

  const recalculateEmployeeDiscount = useCallback(
    (newCart: POSCartItem[]) => {
      if (selectedEmployee && selectedEmployee.discountPercentage > 0 && orderType === "employees") {
        const currentSubtotal = newCart.reduce((sum, item) => sum + item.price * item.quantity, 0);
        const discountAmount = (currentSubtotal * selectedEmployee.discountPercentage) / 100;
        const employeeDiscount = {
          type: "percentage" as const,
          value: selectedEmployee.discountPercentage,
          amount: discountAmount,
          reason: `Employee discount - ${selectedEmployee.user?.firstName} ${selectedEmployee.user?.lastName} (${selectedEmployee.department?.name || selectedEmployee.department?.code || ""})`
        };
        setAppliedDiscount(employeeDiscount);
        setDiscountAmount(discountAmount);
      }
    },
    [selectedEmployee, orderType]
  );

  const addToCart = useCallback(
    (posItem: POSItem) => {
      setIsPOSActionInProgress(true);
      const cartId = `pos-${posItem.id}`;
      setCart(prevCart => {
        const currentCart = prevCart || [];

        // Check if item already exists in cart (including items from loaded saved orders)
        let existingItem = currentCart.find(cartItem => cartItem.id === cartId);

        // If not found by cartId, check by item type and ID for better matching
        if (!existingItem) {
          existingItem = currentCart.find(cartItem => {
            if (posItem.type === "menu_item" && cartItem.type === "menu_item") {
              const cartMenuItemId = cartItem.menuItemId;
              const posMenuItemId = posItem.menuItemId;
              const cartIdNormalized = typeof cartMenuItemId === "string" ? parseInt(cartMenuItemId) || 0 : cartMenuItemId;
              const posIdNormalized = typeof posMenuItemId === "string" ? parseInt(posMenuItemId) || 0 : posMenuItemId;
              return cartIdNormalized === posIdNormalized;
            } else if (posItem.type === "stock_entry" && cartItem.type === "material") {
              const cartMaterialId = cartItem.stockEntryId;
              const posMaterialId = posItem.materialId;
              return String(cartMaterialId) === String(posMaterialId);
            }
            return false;
          });
        }

        let newCart: POSCartItem[];
        if (existingItem) {
          newCart = currentCart.map(cartItem => {
            // Update by cartId or by matching item properties
            const shouldUpdate =
              cartItem.id === cartId ||
              (posItem.type === "menu_item" && cartItem.type === "menu_item" && Number(cartItem.menuItemId) === Number(posItem.menuItemId)) ||
              // POSItem uses type "stock_entry" while POSCartItem uses type "material" for stock entries
              (posItem.type === "stock_entry" && cartItem.type === "material" && String(cartItem.stockEntryId) === String(posItem.materialId));

            return shouldUpdate ? { ...cartItem, quantity: cartItem.quantity + 1 } : cartItem;
          });
        } else {
          if (posItem.type === "menu_item") {
            const menuItemId = posItem.menuItemId || posItem.id;
            const menuItem = menuItems.find(mi => {
              const miId = typeof mi.id === "string" ? parseInt(mi.id) || 0 : mi.id;
              const targetId = typeof menuItemId === "string" ? parseInt(menuItemId) || 0 : menuItemId;
              return miId === targetId;
            });
            const finalMenuItem = menuItem || {
              id: menuItemId,
              name: posItem.name,
              price: posItem.price,
              printerId: posItem.printerId,
              assignedPrinter: posItem.assignedPrinter
            };
            
            if (!menuItem) {
              console.warn("⚠️ Menu item not found, using fallback for POS item:", posItem);
            }
            
            const newItem: POSCartItem = {
              id: cartId,
              name: posItem.displayName || posItem.name,
              price: posItem.price,
              quantity: 1,
              type: "menu_item",
              originalItem: finalMenuItem,
              posItem,
              stockEntryId: undefined,
              // Store as string to match POSCartItem type
              menuItemId: String(menuItemId),
              printerId: finalMenuItem?.printerId || posItem?.printerId,
              assignedPrinter: finalMenuItem?.assignedPrinter || posItem?.assignedPrinter
            };
            newCart = [...currentCart, newItem];
          } else {
            const stockEntry = stockEntries.find(se => {
              const stockEntryMaterialId = String(se.materialId);
              const posItemMaterialId = String(posItem.materialId);
              return stockEntryMaterialId === posItemMaterialId;
            });
            const finalStockEntry = stockEntry || {
              id: posItem.materialId,
              materialId: posItem.materialId,
              material: { name: posItem.name },
              printerId: posItem.printerId,
              assignedPrinter: posItem.assignedPrinter
            };
            
            if (!stockEntry) {
              console.warn("⚠️ Stock entry not found, using fallback for POS item:", posItem);
            }
            
            const newItem: POSCartItem = {
              id: cartId,
              name: posItem.name,
              price: posItem.price,
              quantity: 1,
              type: "material",
              originalItem: finalStockEntry,
              posItem,
              stockEntryId: posItem.materialId,
              menuItemId: undefined,
              printerId: finalStockEntry.printerId || posItem.printerId,
              assignedPrinter: finalStockEntry.assignedPrinter || posItem.assignedPrinter
            };
            newCart = [...currentCart, newItem];
          }
        }
        setTimeout(() => {
          recalculateEmployeeDiscount(newCart);
          // Reset POS action flag after cart update is complete
          setIsPOSActionInProgress(false);
        }, 0);
        return newCart;
      });
    },
    [menuItems, stockEntries, recalculateEmployeeDiscount]
  );

  const updateCartQuantity = useCallback(
    (cartId: string, newQuantity: number) => {
      setIsPOSActionInProgress(true);
      let newCart: POSCartItem[];
      if (newQuantity <= 0) {
        newCart = cart.filter(item => item.id !== cartId);
        setCart(newCart);
      } else {
        newCart = cart.map(item => (item.id === cartId ? { ...item, quantity: newQuantity } : item));
        setCart(newCart);
      }
      recalculateEmployeeDiscount(newCart);
      // Reset POS action flag after cart update
      setTimeout(() => setIsPOSActionInProgress(false), 50);
    },
    [cart, recalculateEmployeeDiscount]
  );

  const handleOrderTypeChange = useCallback((type: OrderType) => {
    setOrderType(type);
    if (type !== "table") {
      setSelectedTable(undefined);
    }
  }, []);

  const handleTableSelect = useCallback(async () => {
    await fetchTablesData();
    setShowTablesLayout(true);
  }, [fetchTablesData]);

  const handleTableSelection = useCallback(
    async (table: Table) => {
      setIsPOSActionInProgress(true);
      setIsTableManuallySelected(true);
      if (onOrderProcessed) {
        onOrderProcessed();
      }
      if (clearOrder) {
        clearOrder();
      }
      processedOrderRef.current = null;
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
              .map(item => {
                let originalItem: StockEntryWithMaterial | MenuItem;

                if (item.type === "material" && item.materialId) {
                  originalItem = stockEntries.find(se => String(se.materialId) === String(item.materialId));
                } else if (item.type === "menu_item" && item.menuItemId) {
                  originalItem = menuItems.find(m => String(m.id) === String(item.menuItemId));
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
            setCart(cartItems);

            // 🔧 FIX: Load the existing order so that saving will update instead of creating new
            await loadOrder(existingOrder.id);

            // Load existing discount information if present
            if (existingOrder.discountAmount && parseFloat(existingOrder.discountAmount.toString()) > 0) {
              setAppliedDiscount({
                type: (existingOrder.discountType as "percentage" | "fixed") || "fixed",
                value: parseFloat(existingOrder.discountValue?.toString() || "0"),
                amount: parseFloat(existingOrder.discountAmount.toString()),
                reason: existingOrder.discountReason || undefined
              });
              setDiscountAmount(parseFloat(existingOrder.discountAmount.toString()));
            }
            if (existingOrder.notes) {
              setOrderNotes(existingOrder.notes);
            }
          }
        } catch (error) {
          console.error("❌ Failed to load table order:", error);
          showError("Failed to load existing table order");
        }
      } else {
        setCart([]);
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
      }
      setTimeout(() => {
        setIsTableManuallySelected(false);
        setIsPOSActionInProgress(false);
      }, 5000);
    },
    [loadOrder, menuItems, stockEntries, showSuccess, showError, clearOrder]
  );

  const handleCloseTablesLayout = useCallback(() => {
    setShowTablesLayout(false);
  }, []);

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
          reason: `Employee discount - ${employee.user?.firstName} ${employee.user?.lastName} (${employee.department?.name || employee.department?.code || ""})`
        };
        setAppliedDiscount(employeeDiscount);
        setDiscountAmount(discountAmount);
        showSuccess(`Applied ${discountValue}% employee discount for ${employee.user?.firstName} ${employee.user?.lastName}`);
      }
    },
    [cart, showSuccess]
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
      cashier: selectedEmployee && orderType === "employees" ? `${selectedEmployee.user?.firstName || ""} ${selectedEmployee.user?.lastName || ""}`.trim() : "",
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
      discountReason: currentOrder?.discountReason || appliedDiscount?.reason || null,
      employeeName: selectedEmployee && orderType === "employees" ? `${selectedEmployee.user?.firstName || ""} ${selectedEmployee.user?.lastName || ""}`.trim() : null,
      orderType: orderType,
      tableNumber: selectedTable?.number || null
    };
    setLastSaleData(receiptData);
    if (hasSavedPrinter()) {
      const savedPrinter = getSavedPrinter();
      handlePrintReceiptWithPrinter(savedPrinter);
    } else {
      setPrinterSelectionContext("manual_print");
      setShowPrinterSelector(true);
    }
  }, [cart, currentOrder, subtotal, total, appliedDiscount, showError, hasSavedPrinter, getSavedPrinter, handlePrintReceiptWithPrinter]);

  const handleVoidOrder = useCallback(() => {
    if (!currentOrder) {
      showError("No current order to void");
      return;
    }
    if ((!cart || cart.length === 0) && !currentOrder.items?.length) {
      showError("Cannot void an empty order");
      return;
    }
    setShowVoidDialog(true);
  }, [currentOrder, cart, showError]);

  const handleConfirmVoid = useCallback(
    async (reason: string, restoreStock: boolean) => {
      try {
        setShowVoidDialog(false);
        const result = await voidOrder(reason, restoreStock);
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
    setShowOrdersDialog(true);
  }, []);

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
    setError(null);
    setSuccessMessage(null);
  }, [clearOrder]);

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

  // Use the VoidPrinter hook
  const { printVoidReceiptsForRemovedItems } = useVoidPrinter({ showSuccess, showError });

  const handleManualSave = useCallback(async () => {
    if (cart.length === 0) {
      showError("Cannot save empty order");
      return;
    }
    setIsPOSActionInProgress(true);
    setIsLoading(true);
    try {
      setShowSuccessCheckmark(true);
      justSavedRef.current = true;
      setTimeout(() => {
        clearCartWithAnimation();
        setAppliedDiscount(null);
        setDiscountAmount(0);
        setPaymentAmount("");
        setOrderNotes("");
        setHasUnsavedChanges(true);
        setOrderType("takeaway");
        setSelectedTable(undefined);
        setSelectedEmployee(undefined);
        OrderPersistence.clearCurrentOrder();
        setShowTablesLayout(false);
        if (clearOrder) clearOrder();
        setTimeout(() => {
          setShowSuccessCheckmark(false);
          justSavedRef.current = false;
        }, 2000);
      }, 100);

      // BACKGROUND PROCESSING - Handle actual API calls without blocking UI
      const backgroundSaving = async () => {
        try {
          let savedOrder;
          if (currentOrder?.id) {
            const existingOrderItems = (currentOrder.items || []) as any[];
            const keyForOrderItem = (oi: any) => {
              if (oi.menuItem) return `menu:${oi.menuItem.id}`;
              if (oi.menuItemId) return `menu:${oi.menuItemId}`;
              if (oi.material) return `mat:${oi.material.id}`;
              if (oi.materialId) return `mat:${oi.materialId}`;
              return `id:${oi.id}`;
            };
            const keyForCartItem = (ci: POSCartItem) => {
              if (ci.type === "menu_item") return `menu:${(ci.originalItem as MenuItem).id}`;
              return `mat:${(ci.originalItem as StockEntryWithMaterial).materialId}`;
            };
            const existingMap = new Map<string, { qty: number; ids: string[]; unitPrice: number }>();
            existingOrderItems.forEach(oi => {
              const key = keyForOrderItem(oi);
              const prev = existingMap.get(key);
              const idStr = (oi.id?.toString?.() || oi.id) as string;
              const unitPrice = typeof oi.unitPrice === "string" ? parseFloat(oi.unitPrice) : oi.unitPrice;
              if (prev) {
                prev.qty += oi.quantity || 0;
                prev.ids.push(idStr);
                prev.unitPrice = unitPrice ?? prev.unitPrice;
              } else {
                existingMap.set(key, { qty: oi.quantity || 0, ids: [idStr], unitPrice: unitPrice ?? 0 });
              }
            });
            const desiredMap = new Map<string, { qty: number; sample: POSCartItem }>();
            (cart || []).forEach(ci => {
              const key = keyForCartItem(ci);
              const prev = desiredMap.get(key);
              if (prev) {
                prev.qty += ci.quantity;
              } else {
                desiredMap.set(key, { qty: ci.quantity, sample: ci });
              }
            });

            const itemIdsToRemove: string[] = [];
            const removedItemsForVoidReceipt: POSCartItem[] = [];

            existingMap.forEach((val, key) => {
              const desired = desiredMap.get(key);
              if (!desired || desired.qty !== val.qty) {
                itemIdsToRemove.push(...val.ids);
                const orderItem = existingOrderItems.find(oi => keyForOrderItem(oi) === key);
                if (orderItem && (!desired || desired.qty < val.qty)) {
                  const removedQuantity = val.qty - (desired?.qty || 0);
                  let printerId: number | undefined;
                  let assignedPrinter: any;
                  if (orderItem.menuItem || orderItem.menuItemId) {
                    const menuItemId = orderItem.menuItemId || orderItem.menuItem?.id;
                    const originalMenuItem = menuItems.find(mi => mi.id === menuItemId);
                    printerId = originalMenuItem?.printerId;
                    assignedPrinter = originalMenuItem?.assignedPrinter;
                    const menuItemIdAsNumber = typeof menuItemId === "string" ? parseInt(menuItemId) : menuItemId;
                    const menuItemIdAsString = String(menuItemId);
                    const foundByNumber = menuItems.find(mi => mi.id === menuItemIdAsNumber);
                    const foundByString = menuItems.find(mi => String(mi.id) === menuItemIdAsString);
                    if (!originalMenuItem && (foundByNumber || foundByString)) {
                      const correctMenuItem = foundByNumber || foundByString;
                      printerId = correctMenuItem?.printerId;
                      assignedPrinter = correctMenuItem?.assignedPrinter;
                    }
                  } else if (orderItem.material || orderItem.materialId) {
                    const materialId = orderItem.materialId || orderItem.material?.id;
                    const originalStockEntry = stockEntries.find(se => se.materialId === materialId);
                    printerId = originalStockEntry?.printerId;
                    assignedPrinter = originalStockEntry?.assignedPrinter;
                  }
                  const voidItem: POSCartItem = {
                    id: `void-${orderItem.id}`,
                    name: orderItem.name || orderItem.menuItem?.name || orderItem.material?.name || "Unknown Item",
                    price: typeof orderItem.unitPrice === "string" ? parseFloat(orderItem.unitPrice) : orderItem.unitPrice || 0,
                    quantity: removedQuantity,
                    type: orderItem.menuItem || orderItem.menuItemId ? "menu_item" : "material",
                    originalItem: orderItem.menuItem || orderItem.material || orderItem,
                    notes: orderItem.notes,
                    printerId: printerId,
                    assignedPrinter: assignedPrinter
                  };
                  removedItemsForVoidReceipt.push(voidItem);
                }
              }
            });
            const itemsToAdd: Array<{
              materialId?: string;
              menuItemId?: string;
              assignmentId?: string;
              name: string;
              quantity: number;
              unitPrice: number;
              totalPrice: number;
              type: "material" | "menu_item";
              notes?: string;
            }> = [];
            desiredMap.forEach(({ qty, sample }, key) => {
              const existing = existingMap.get(key);
              if (!existing || existing.qty !== qty) {
                const isMenu = sample.type === "menu_item";
                const unitPrice = sample.price;
                itemsToAdd.push({
                  materialId: !isMenu ? String((sample.originalItem as StockEntryWithMaterial).materialId) : undefined,
                  menuItemId: isMenu ? String((sample.originalItem as MenuItem).id) : undefined,
                  assignmentId: undefined,
                  name: sample.name,
                  quantity: qty,
                  unitPrice,
                  totalPrice: unitPrice * qty,
                  type: sample.type,
                  notes: sample.notes || undefined
                });
              }
            });
            if (removedItemsForVoidReceipt.length > 0) {
              await printVoidReceiptsForRemovedItems(removedItemsForVoidReceipt, {
                currentOrder,
                selectedTable
              });
            }
            if (itemIdsToRemove.length > 0) {
              const respRemove = await ordersAPI.removeOrderItems(currentOrder.id, itemIdsToRemove.map(String));
              savedOrder = respRemove.data;
            }
            if (itemsToAdd.length > 0) {
              const mappedItemsToAdd = itemsToAdd.map(item => ({
                ...item,
                price: item.unitPrice.toString(),
                total: item.totalPrice.toString()
              }));
              const respAdd = await ordersAPI.addOrderItems(currentOrder.id, mappedItemsToAdd);
              savedOrder = respAdd.data;
            }
            const updateData = {
              discountType: appliedDiscount?.type,
              discountValue: appliedDiscount?.value,
              discountAmount: appliedDiscount?.amount || 0,
              discountReason: appliedDiscount?.reason,
              notes: orderNotes || undefined
            };
            savedOrder = await updateOrder(updateData);
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
                  notes: item.notes || undefined
                };
              }),
              notes: orderNotes || undefined,
              discountType: appliedDiscount?.type,
              discountValue: appliedDiscount?.value,
              discountAmount: appliedDiscount?.amount || 0,
              discountReason: appliedDiscount?.reason
            };
            savedOrder = await createOrder(createData);
          }

          const orderIdentifier = savedOrder?.orderNumber || savedOrder?.id || savedOrder?.order?.orderNumber || savedOrder?.order?.id || currentOrder?.orderNumber || currentOrder?.id || "New Order";

          // PARALLEL BACKGROUND OPERATIONS - Don't block UI
          const backgroundOperations = [
            (async () => {
              try {
                await printItemsToAssignedPrinters(cart);
              } catch (error) {
                console.error("⚠️ Printing error (non-critical):", error);
              }
            })(),
            (async () => {
              try {
                if (onOrderProcessed) onOrderProcessed();
                await refreshAllCounts();
              } catch (error) {
                console.error("⚠️ Count refresh error (non-critical):", error);
              }
            })()
          ];
          Promise.allSettled(backgroundOperations);
        } catch (error: unknown) {
          console.error("❌ Background save processing failed:", error);
        }
      };

      // Start background processing without awaiting
      backgroundSaving();
    } catch (error: unknown) {
      console.error("❌ Save failed:", error);
      const errorMessage = error && typeof error === "object" && "response" in error && error.response && typeof error.response === "object" && "data" in error.response && error.response.data && typeof error.response.data === "object" && "message" in error.response.data ? (error.response.data.message as string) : "Failed to save order. Please try again.";
      showError(errorMessage);
    } finally {
      setIsLoading(false);
      setIsPOSActionInProgress(false);
    }
  }, [cart, orderType, selectedTable, selectedEmployee, appliedDiscount, orderNotes, currentOrder, createOrder, updateOrder, clearOrder, clearCartWithAnimation, showSuccess, showError, printItemsToAssignedPrinters, refreshAllCounts, onOrderProcessed, menuItems, stockEntries, printVoidReceiptsForRemovedItems]);

  const handlePayment = useCallback(async () => {
    if (cart.length === 0) {
      showError("Cart is empty");
      return;
    }
    if (currentOrder && currentOrder.status === "paid") {
      const orderIdentifier = currentOrder?.orderNumber || currentOrder?.id || "Current Order";
      showError(`Order ${orderIdentifier} is already completed`);
      setShowPaymentDialog(false);
      clearOrder();
      return;
    }
    setIsPOSActionInProgress(true);
    setIsLoading(true);

    // Generate optimistic data immediately for instant UX
    const optimisticSaleId = `sale-${Date.now()}`;
    const optimisticPaymentData = {
      paymentMethod: "cash",
      paymentAmount: parseFloat(paymentAmount) || total,
      change: Math.max(0, (parseFloat(paymentAmount) || total) - total)
    };

    // Create receipt data immediately for instant display
    const optimisticReceiptData = {
      id: optimisticSaleId,
      date: new Date().toLocaleDateString(),
      time: new Date().toLocaleTimeString(),
      cashier: selectedEmployee && orderType === "employees" ? `${selectedEmployee.user?.firstName || ""} ${selectedEmployee.user?.lastName || ""}`.trim() : "",
      items: cart.map(item => ({
        name: item.name,
        quantity: item.quantity,
        unitPrice: item.price,
        totalPrice: item.price * item.quantity,
        type: item.type
      })),
      subtotal: subtotal,
      tax: tax,
      total: total,
      paymentAmount: optimisticPaymentData.paymentAmount,
      change: optimisticPaymentData.change || 0,
      paymentMethod: optimisticPaymentData.paymentMethod,
      discountType: appliedDiscount?.type || null,
      discountValue: appliedDiscount?.value || null,
      discountAmount: appliedDiscount?.amount || null,
      discountReason: appliedDiscount?.reason || null,
      employeeName: selectedEmployee && orderType === "employees" ? `${selectedEmployee.user?.firstName || ""} ${selectedEmployee.user?.lastName || ""}`.trim() : null,
      orderType: orderType,
      tableNumber: selectedTable?.number || null
    };

    try {
      // INSTANT UI UPDATES - Show success immediately
      setShowPaymentDialog(false);
      setPaymentAmount("");
      setIsPaymentCompleted(true);
      setLastSaleData(optimisticReceiptData);
      setShowReceiptDialog(true);
      setShouldAutoPrint(hasSavedPrinter());
      setShowSuccessCheckmark(true);

      // CRITICAL: Mark order as completed immediately to prevent reloading
      if (currentOrder?.id) {
        completedOrdersRef.current.add(currentOrder.id.toString());
      }

      // Clear UI state immediately for instant feedback
      setAppliedDiscount(null);
      setDiscountAmount(0);
      setOrderNotes("");
      setHasUnsavedChanges(false);
      processedOrderRef.current = null;
      OrderPersistence.clearCurrentOrder();

      // Start cart clearing animation immediately
      setTimeout(() => {
        clearCartWithAnimation();
        setTimeout(() => setShowSuccessCheckmark(false), 2000);
      }, 100);

      // BACKGROUND PROCESSING - Handle actual API calls without blocking UI
      const backgroundProcessing = async () => {
        try {
          let orderToComplete = currentOrder;

          // Create order if needed
          if (!currentOrder) {
            const orderData = {
              orderType,
              tableId: selectedTable?.id,
              employeeId: selectedEmployee?.id,
              items: cart.map(item => ({
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
              })),
              notes: orderNotes || undefined,
              discountType: appliedDiscount?.type,
              discountValue: appliedDiscount?.value,
              discountAmount: appliedDiscount?.amount || 0,
              discountReason: appliedDiscount?.reason
            };
            const createOrderResponse = await createOrder(orderData);
            orderToComplete = createOrderResponse && typeof createOrderResponse === "object" && "order" in createOrderResponse ? (createOrderResponse as any).order : createOrderResponse;
          }

          if (!orderToComplete) {
            throw new Error("No order available for completion");
          }

          // Ensure order has valid ID
          if (!orderToComplete.id) {
            const orderAny = orderToComplete as any;
            const orderId = orderToComplete.id || orderAny.orderId || orderAny.orderNumber;
            if (orderId) {
              orderToComplete.id = orderId;
            } else {
              throw new Error(`Order created but missing ID`);
            }
          }

          // Complete order with timeout protection
          const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error("Order completion timeout")), 10000));

          const response = (await Promise.race([ordersAPI.completeOrder(orderToComplete.id, optimisticPaymentData), timeoutPromise])) as any;

          // Extract order and sale ID from response
          let order: any, saleId: string;
          if (response?.data) {
            if (response.data.order && response.data.saleId) {
              order = response.data.order;
              saleId = response.data.saleId;
            } else if (response.data.order) {
              order = response.data.order;
              saleId = order.id || optimisticSaleId;
            } else if (response.data.id) {
              order = response.data;
              saleId = response.data.id;
            } else {
              order = { id: orderToComplete.id, items: cart, subtotal, tax, total, status: "completed" };
              saleId = optimisticSaleId;
            }
          } else {
            order = { id: orderToComplete.id, items: cart, subtotal, tax, total, status: "completed" };
            saleId = optimisticSaleId;
          }
          // Update receipt with actual data if different from optimistic
          if (saleId !== optimisticSaleId) {
            const updatedReceiptData = { ...optimisticReceiptData, id: saleId };
            setLastSaleData(updatedReceiptData);
          }
          completedOrdersRef.current.add(orderToComplete.id.toString());
          const backgroundOperations = [];
          if (selectedTable && orderType === "table") {
            backgroundOperations.push(
              (async () => {
                try {
                  await tablesAPI.clearReservation(selectedTable.id);
                  const tablesResponse = await tablesAPI.getTables({ includeOrders: true });
                  const responseData = tablesResponse.data as Table[] | { data: Table[] };
                  const refreshedTables = Array.isArray(responseData) ? responseData : responseData.data || [];
                  setTables(refreshedTables);
                } catch (error) {
                  console.error("⚠️ Table update error (non-critical):", error);
                }
              })()
            );
          }

          // Employee usage recording
          if (selectedEmployee && orderType === "employees") {
            backgroundOperations.push(
              (async () => {
                try {
                  const { recordEmployeeUsageWithSettlementUpdate } = await import("@/utils/employeeUsageUtils");
                  const posTransactionId = order.orderNumber || saleId;
                  await recordEmployeeUsageWithSettlementUpdate(selectedEmployee, cart, posTransactionId);
                } catch (error) {
                  console.error("⚠️ Employee usage recording error (non-critical):", error);
                }
              })()
            );
          }

          // Printing
          backgroundOperations.push(
            (async () => {
              try {
                await printItemsToAssignedPrinters(cart);
              } catch (error) {
                console.error("⚠️ Printing error (non-critical):", error);
              }
            })()
          );

          // Count refresh
          backgroundOperations.push(
            (async () => {
              try {
                await refreshAllCounts();
              } catch (error) {
                console.error("⚠️ Count refresh error (non-critical):", error);
              }
            })()
          );

          // Execute all background operations in parallel
          await Promise.allSettled(backgroundOperations);

          // Trigger sale completion callback
          if (onSaleComplete) {
            const response = {
              sale: { id: saleId },
              message: "Sale completed"
            } as SaleResponse;
            onSaleComplete(response);
          }
        } catch (error: unknown) {
          console.error("❌ Background payment processing failed:", error);
        }
      };
      backgroundProcessing();
      clearOrder();
      setSelectedEmployee(null);
      setSelectedTable(null);
      resetToTakeaway();
      setTimeout(() => {
        setIsPaymentCompleted(false);
      }, 750);
    } catch (error: unknown) {
      console.error("❌ Payment failed:", error);
      const errorMessage = error && typeof error === "object" && "response" in error && error.response && typeof error.response === "object" && "data" in error.response && error.response.data && typeof error.response.data === "object" && "message" in error.response.data ? (error.response.data.message as string) : "Sale failed. Please try again.";
      showError(errorMessage);
      setShowPaymentDialog(false);
    } finally {
      setIsLoading(false);
      setIsPOSActionInProgress(false);
    }
  }, [cart, total, paymentAmount, subtotal, tax, showError, clearCartWithAnimation, onSaleComplete, currentOrder, selectedTable, selectedEmployee, orderType, orderNotes, clearOrder, resetToTakeaway, createOrder, appliedDiscount, refreshAllCounts, hasSavedPrinter, printItemsToAssignedPrinters]);

  const handleMouseDown = () => {
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
      setLeftPanelWidth(newWidth);
      const rightPanelWidth = 100 - newWidth;
      const calculatedRightPanelPixelWidth = (rightPanelWidth / 100) * containerRect.width;
      setRightPanelPixelWidth(calculatedRightPanelPixelWidth);
    }
  };

  const handleMouseUp = () => {
    setIsResizing(false);
    document.removeEventListener("mousemove", handleMouseMove);
    document.removeEventListener("mouseup", handleMouseUp);
  };

  return (
    <>
      <div ref={containerRef} className="h-full flex flex-col lg:flex-row bg-gray-50 safe-area-padding">
        {cart && cart.length > 0 && !showSuccessCheckmark && (
          <div className="md:!hidden bg-white border-b border-gray-200 px-3 p-1 flex-shrink-0">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                {cart && cart.length > 0 && (
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
                    <Button variant="outline" size="sm" onClick={() => setShowDiscountDialog(true)} className="text-xs p-2" disabled={currentOrder?.status === "paid" || currentOrder?.status === "served"}>
                      <DollarSign className="w-3 h-3" />
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
          className="cart hidden lg:flex flex-col h-full bg-white lg:border-r lg:border-gray-200"
          style={{
            width: typeof window !== "undefined" && window.innerWidth >= 1024 ? `${leftPanelWidth}%` : "100%"
          }}
        >
          {/* Cart Header - Fixed (Desktop Only) */}
          <div className="card-header hidden lg:block border-b border-gray-200 px-3 flex-shrink-0">
            <div className={`flex items-center justify-between ${cart && cart.length > 0 && !showSuccessCheckmark ? "py-2" : ""}`}>
              <div className="flex flex-col xl:flex-row items-start xl:items-center space-y-1 xl:space-y-0 xl:space-x-2">
                {/* Order Status Indicator */}
                {cart && cart.length > 0 && !showSuccessCheckmark && (
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
              <div className="hidden lg:flex items-center space-x-2">
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
          <div className="hidden lg:block flex-1 h-full relative overflow-hidden">
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
              <div className="absolute inset-0 flex items-center justify-center z-10 select-none">
                <div className="text-center">
                  <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4 animate-scale-in" />
                  <p className="text-green-700 font-medium text-lg">Order Completed!</p>
                  <p className="text-green-600 text-sm mt-1">Cart cleared successfully</p>
                </div>
              </div>
            )}

            {/* Cancelled Animation Overlay */}
            {currentOrder?.status === "cancelled" && (
              <div className="absolute inset-0 flex items-center justify-center mt-10 z-10 select-none">
                <div className="text-center">
                  <img src="/void.png" alt="" className="w-52 mx-auto" />
                </div>
              </div>
            )}
          </div>

          {/* Order Summary - Fixed Footer */}
          {!showSuccessCheckmark && (
            <div className="hidden lg:block border-t border-gray-200 bg-white">
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
          <div className="lg:hidden bg-gray-50 flex-shrink-0">
            <div className="flex border-b">
              <Button variant={activeView === "cart" ? "default" : "outline"} size="sm" onClick={() => setActiveView("cart")} className="flex-1 btn-touch !rounded-none">
                Cart ({cart?.length || 0})
              </Button>
              <Button variant={activeView === "products" ? "default" : "outline"} size="sm" onClick={() => setActiveView("products")} className="flex-1 btn-touch !rounded-none">
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
            <div className="flex-1 min-h-0 !bg-gray-50 p-2">
              <ItemsGrid
                key={`${activeView}-${rightPanelPixelWidth}`}
                posItems={filteredPosItems}
                onAddToCart={addToCart}
                rightPanelPixelWidth={rightPanelPixelWidth}
                isLoading={isItemsGridLoading}
              />
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
                isDayOpen={isDayOpen}
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
            setShouldAutoPrint(false);
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
      <div className="h-[50dvh]">
        <POSClientOrders isOpen={showOrdersDialog} onClose={handleCloseOrdersDialog} onOrderSelect={handleOrderSelectCallback} onOrderStatusChange={fetchIncompleteOrders} />
      </div>

      {/* Tables Layout Dialog */}
      {showTablesLayout && (
        <Dialog open={showTablesLayout} onOpenChange={setShowTablesLayout}>
          <DialogContent className="w-screen h- max-w-none max-h-none m-0 p-0 !z-50 bg-white overflow-hidden">
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

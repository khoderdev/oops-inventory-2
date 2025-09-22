import { ordersAPI } from "@/api/orders.api";
import { printerAPI } from "@/api/printer.api";
import { tablesAPI } from "@/api/tables.api";
import PrinterSelector from "@/components/common/PrinterSelector";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useOrderManagement } from "@/hooks/useOrderManagement";
import { usePrinterSelector } from "@/hooks/usePrinterSelector";
import { Employee } from "@/types/employee";
import { MenuItem, NegativeStockWarning, POSCartItem, POSClientProps, POSItem, ReceiptData, SaleResponse, SectionAssignment, StockEntryWithMaterial, Table } from "@/types/inventory";
import { Order, OrderSummary as OrderSummaryType, OrderType, UpdateOrderData } from "@/types/orders";
import { generatePreviewOrderNumber } from "@/utils/orderNumberGenerator";
import { OrderPersistence } from "@/utils/orderPersistence";
import { formatItemsForPrinter } from "@/utils/thermalPrinterFormatter";
import { useVoidPrinter } from "./VoidPrinter";
import { AlertCircle, AlertTriangle, Check, CheckCircle, DollarSign, FileText, GripVertical, Printer, ShoppingBag, ShoppingCart, Trash2 } from "lucide-react";
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
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import * as posActions from "@/store/slices/posSlice";
import {
  addToCart as addToCartAction,
  updateCartQuantity as updateCartQuantityAction,
  clearCart as clearCartAction,
  clearCartWithAnimation as clearCartWithAnimationAction,
  setOrderType as setOrderTypeAction,
  setSelectedTable as setSelectedTableAction,
  setSelectedEmployee as setSelectedEmployeeAction,
  applyDiscount as applyDiscountAction,
  removeDiscount as removeDiscountAction,
  setOrderNotes as setOrderNotesAction,
  setItemNotes as setItemNotesAction,
  setShowPaymentDialog as setShowPaymentDialogAction,
  setShowReceiptDialog as setShowReceiptDialogAction,
  setShowTablesLayout as setShowTablesLayoutAction,
  setShowDiscountDialog as setShowDiscountDialogAction,
  setShowNotesDialog as setShowNotesDialogAction,
  setShowItemNotesDialog as setShowItemNotesDialogAction,
  setShowVoidDialog as setShowVoidDialogAction,
  setShowOrdersDialog as setShowOrdersDialogAction,
  setShowReportsDialog as setShowReportsDialogAction,
  setShowPrinterSelector as setShowPrinterSelectorAction,
  setSelectedItemForNotes as setSelectedItemForNotesAction,
  setError as setErrorAction,
  setSuccessMessage as setSuccessMessageAction,
  setShowSuccessCheckmark as setShowSuccessCheckmarkAction,
  setIsLoading as setIsLoadingAction,
  setIsPOSActionInProgress as setIsPOSActionInProgressAction,
  setIsTableManuallySelected as setIsTableManuallySelectedAction,
  setIsPaymentCompleted as setIsPaymentCompletedAction,
  setLastSaleData as setLastSaleDataAction,
  generateReceiptData as generateReceiptDataAction,
  setShowPrinterSelector
} from "@/store/slices/posSlice";

export const POSClient: React.FC<POSClientProps> = ({ sectionAssignments, onSaleComplete, onOrderSelect, selectedOrderForPOS, onOrderProcessed, refreshCountsRef, isDayOpen = true }) => {
  // Redux
  const dispatch = useAppDispatch();
  const { cart, orderType, selectedTable, selectedEmployee, currentOrder, hasUnsavedChanges, isPaymentCompleted, isLoading, error, successMessage, showSuccessCheckmark, showPaymentDialog, showReceiptDialog, showTablesLayout, showDiscountDialog, showNotesDialog, showItemNotesDialog, showVoidDialog, showOrdersDialog, showReportsDialog, showPrinterSelector, selectedItemForNotes, orderNotes, appliedDiscount, lastSaleData, isTableManuallySelected, isPOSActionInProgress, selectedSaleForEdit, editingSaleId } =
    useAppSelector(state => state.pos);

  // Context and local state
  const { foodMenuItems, beverageMenuItems, menuItemsLoading, menuItemCategories, beverageCategories, fetchMenuItems } = useMenuItems();
  const [searchTerm] = React.useState("");
  const [menuItems, setMenuItems] = React.useState<MenuItem[]>([]);
  const [stockEntries, setStockEntries] = React.useState<StockEntryWithMaterial[]>([]);
  const [posItems, setPosItems] = React.useState<POSItem[]>([]);
  const [categoriesMap, setCategoriesMap] = React.useState<Map<number, string>>(new Map());
  const [isItemsGridStable, setIsItemsGridStable] = React.useState(false);
  const [isItemsGridLoading, setIsItemsGridLoading] = React.useState(true);
  const [optimisticAssignments, setOptimisticAssignments] = React.useState<SectionAssignment[]>(sectionAssignments);
  const [negativeStockWarnings] = React.useState<NegativeStockWarning[]>([]);
  const [showNegativeStockDialog, setShowNegativeStockDialog] = React.useState(false);
  const [paymentAmount, setPaymentAmount] = React.useState<string>("");
  const [activeCategory, setActiveCategory] = React.useState<string>("all");
  const [tables, setTables] = React.useState<Table[]>([]);
  const [showUnsavedDialog, setShowUnsavedDialog] = React.useState(false);
  const [shouldAutoPrint, setShouldAutoPrint] = React.useState(false);
  const [activeView, setActiveView] = React.useState<"cart" | "products">("products");
  const [incompleteOrdersCount, setIncompleteOrdersCount] = React.useState<number>(0);
  const [tableOrders, setTableOrders] = React.useState<{ [tableId: string]: number }>({});
  const [incompleteTableOrdersCount, setIncompleteTableOrdersCount] = React.useState<number>(0);
  const [incompleteDeliveryTakeawayCount, setIncompleteDeliveryTakeawayCount] = React.useState<number>(0);
  const [, setIncompleteDeliveryCount] = React.useState<number>(0);
  const [, setIncompleteTakeawayCount] = React.useState<number>(0);
  const [leftPanelWidth, setLeftPanelWidth] = React.useState(33.33);
  const [rightPanelPixelWidth, setRightPanelPixelWidth] = React.useState(0);
  const [isResizing, setIsResizing] = React.useState(false);
  const [printerSelectionContext, setPrinterSelectionContext] = React.useState<"payment" | "manual_print" | null>(null);
  

  // Filter posItems based on activeCategory
  const filteredPosItems = React.useMemo(() => {
    return activeCategory === "all"
      ? posItems
      : posItems.filter(item => {
          if (typeof item.category === "string") {
            return item.category === activeCategory;
          } else if (typeof item.category === "object" && item.category?.name) {
            return item.category.name === activeCategory;
          } else if (typeof item.category === "number") {
            // Find category by ID and compare names
            const categoryObj = categoriesMap.get(item.category);
            return categoryObj === activeCategory;
          }
          return false;
        });
  }, [posItems, activeCategory, categoriesMap]);

  // Create categories array from posItems
  const categories = React.useMemo(() => {
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

  // Refs
  const errorTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const successTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const checkmarkTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const processedOrderRef = useRef<string | null>(null);
  const justSavedRef = useRef<boolean>(false);
  const completedOrdersRef = useRef<Set<string>>(new Set());
  const containerRef = useRef<HTMLDivElement>(null);
  const routerStateProcessedRef = useRef(false);

  // Hooks
  const { selectedPrinter, selectPrinter, clearSelection, hasSavedPrinter, getSavedPrinter } = usePrinterSelector();
  const { currentOrder: hookCurrentOrder, isLoading: orderLoading, createOrder, loadOrder, updateOrder, voidOrder, clearOrder } = useOrderManagement();
  const { printVoidReceiptsForRemovedItems } = useVoidPrinter({
    showSuccess: message => dispatch(setSuccessMessageAction(message)),
    showError: message => dispatch(setErrorAction(message))
  });

  // Utility functions
  const showError = useCallback(
    (message: string) => {
      console.error("❌ Error displayed:", message);
      dispatch(setErrorAction(message));
      if (errorTimeoutRef.current) clearTimeout(errorTimeoutRef.current);
      errorTimeoutRef.current = setTimeout(() => dispatch(setErrorAction(null)), 5000);
    },
    [dispatch]
  );

  const showSuccess = useCallback(
    (message: string) => {
      dispatch(setSuccessMessageAction(message));
      if (successTimeoutRef.current) clearTimeout(successTimeoutRef.current);
      successTimeoutRef.current = setTimeout(() => dispatch(setSuccessMessageAction(null)), 3000);
    },
    [dispatch]
  );

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
  
    // Memoized POS items to prevent unnecessary re-renders during POS operations
    // Remove the memoizedPosItems and replace with this useEffect:
    useEffect(() => {
      if (menuItemsLoading) {
        setIsItemsGridLoading(true);
        return;
      }
  
      // Only proceed if we have menu items
      const allMenuItems = [...(foodMenuItems || []), ...(beverageMenuItems || [])];
      if (allMenuItems.length === 0) {
        setIsItemsGridLoading(false);
        return;
      }
  
      const transformedItems: POSItem[] = allMenuItems
        .filter(menuItem => menuItem?.isPOSItem)
        .map(menuItem => {
          // Handle category transformation with fallbacks
          let categoryName = "Uncategorized";
  
          if (menuItem.category) {
            if (typeof menuItem.category === "object" && "id" in menuItem.category) {
              categoryName = categoriesMap.get(menuItem.category.id) || (menuItem.category as any).name || (menuItem.category as any).value || "Uncategorized";
            } else if (typeof menuItem.category === "number") {
              categoryName = categoriesMap.get(menuItem.category) || "Uncategorized";
            } else if (typeof menuItem.category === "string") {
              categoryName = menuItem.category;
            }
          }
  
          // Transform variants if they exist
          const variants = menuItem.variants ? transformVariants(menuItem.variants) : undefined;
  
          return {
            id: `menu-${menuItem.id}`,
            name: menuItem.name,
            price: typeof menuItem.price === "number" && !isNaN(menuItem.price) ? menuItem.price : 0,
            category: categoryName,
            type: "menu_item",
            menuItemId: menuItem.id,
            unit: menuItem.unit || "unit",
            availableQuantity: menuItem.availableQuantity || 0,
            costPerUnit: menuItem.costPerUnit || 0,
            createdAt: menuItem.createdAt?.toString() || new Date().toISOString(),
            updatedAt: menuItem.updatedAt?.toString() || new Date().toISOString(),
            description: menuItem.description,
            image: menuItem.image,
            imageUrl: undefined,
            variants: variants
          };
        });
  
      setPosItems(transformedItems);
      setIsItemsGridLoading(false);
    }, [foodMenuItems, beverageMenuItems, categoriesMap, menuItemsLoading]);

     // Helper function for variants transformation
  const transformVariants = (
    variants: any
  ): Array<{
    id: string | number;
    name: string;
    volume: number;
    unit: string;
    price: string | number;
  }> => {
    if (Array.isArray(variants)) return variants;

    if (variants && typeof variants === "object") {
      if (variants.variantVolumes) {
        return Object.keys(variants.variantVolumes).map(variantKey => ({
          id: variantKey,
          name: variantKey,
          volume: variants.variantVolumes[variantKey] || 0,
          unit: variants.variantVolumeUnits?.[variantKey] || "cl",
          price: variants.variantPrices?.[variantKey] || 0
        }));
      }

      // Handle other possible variant formats
      return Object.entries(variants).map(([key, value]: [string, any]) => ({
        id: key,
        name: key,
        volume: value.volume || value.size || 0,
        unit: value.unit || "cl",
        price: value.price || 0
      }));
    }

    return [];
  };

  // Calculate derived values
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

  // Create a stable cart for rendering
  const stableCart = useMemo(() => {
    return cart.length > 0 ? [...cart] : [];
  }, [cart]);

  // Effects and handlers will be continued in the next part
  // This is just the initial setup with state management

  // Fetch tables data
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

  const fetchIncompleteOrdersCount = useCallback(async () => {
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
      }
    } catch (error) {
      console.error("❌ Error fetching incomplete orders:", error);
      setIncompleteOrdersCount(0);
      setTableOrders({});
      setIncompleteTableOrdersCount(0);
      setIncompleteDeliveryTakeawayCount(0);
    }
  }, []);

  // Refresh all counts
  const refreshAllCounts = useCallback(async () => {
    await Promise.all([fetchMenuItems(), fetchTablesData(), refreshCountsRef?.current ? refreshCountsRef.current() : Promise.resolve(), fetchIncompleteOrdersCount()]);
  }, [fetchMenuItems, fetchTablesData, refreshCountsRef, fetchIncompleteOrdersCount]);

  // Handler functions
  const handleCloseOrdersDialog = useCallback(() => {
    dispatch(setShowOrdersDialogAction(false));
  }, [dispatch]);

  const handleOrderSelectCallback = useCallback(
    (order: OrderSummaryType) => {
      if (onOrderSelect) {
        onOrderSelect(order);
      }
    },
    [onOrderSelect]
  );

  const clearCartWithAnimation = useCallback(() => {
    dispatch(clearCartWithAnimationAction());
    processedOrderRef.current = null;
  }, [dispatch]);

  const resetToTakeaway = useCallback(() => {
    dispatch(setOrderTypeAction("takeaway"));
    dispatch(setSelectedTableAction(undefined));
    dispatch(setShowTablesLayoutAction(false));
  }, [dispatch]);

  const clearCart = useCallback(() => {
    dispatch(clearCartAction());
  }, [dispatch]);

  const handleShowReports = useCallback(() => {
    dispatch(setShowReportsDialogAction(true));
  }, [dispatch]);

  const handleShowDiscount = useCallback(() => {
    if (cart.length === 0) {
      showError("Cannot apply discount to empty cart");
      return;
    }
    dispatch(setShowDiscountDialogAction(true));
  }, [cart.length, showError, dispatch]);

  const handleDiscountAmountChange = useCallback((amount: number) => {
    // This is handled in the discount dialog component
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

      dispatch(
        applyDiscountAction({
          type: discountData.type,
          value: discountData.value,
          reason: discountData.reason
        })
      );

      dispatch(setShowDiscountDialogAction(false));
      const discountText = discountData.type === "percentage" ? `${discountData.value}% discount` : `$${discountData.value} discount`;
      showSuccess(`${discountText} applied - Saved $${discountAmount.toFixed(2)}`);
    },
    [cart, showError, showSuccess, dispatch]
  );

  const handleRemoveDiscount = useCallback(() => {
    dispatch(removeDiscountAction());
    showSuccess("Discount removed");
  }, [showSuccess, dispatch]);

  const handleItemNotesChange = useCallback(
    (itemId: string, notes: string) => {
      dispatch(setItemNotesAction({ itemId, notes }));
      if (notes.trim()) {
        showSuccess("Item notes saved");
      } else {
        showSuccess("Item notes removed");
      }
    },
    [showSuccess, dispatch]
  );

  const handleShowItemNotes = useCallback(
    (item: POSCartItem) => {
      const itemCopy = { ...item };
      dispatch(setSelectedItemForNotesAction(itemCopy));
      dispatch(setShowItemNotesDialogAction(true));
    },
    [dispatch]
  );

  const handleCloseItemNotes = useCallback(() => {
    dispatch(setShowItemNotesDialogAction(false));
    dispatch(setSelectedItemForNotesAction(null));
  }, [dispatch]);

  const handleOrderTypeChange = useCallback(
    (type: OrderType) => {
      dispatch(setOrderTypeAction(type));
      if (type !== "table") {
        dispatch(setSelectedTableAction(undefined));
      }
    },
    [dispatch]
  );

  const handleTableSelect = useCallback(async () => {
    await fetchTablesData();
    dispatch(setShowTablesLayoutAction(true));
  }, [fetchTablesData, dispatch]);

  const handleCloseTablesLayout = useCallback(() => {
    dispatch(setShowTablesLayoutAction(false));
  }, [dispatch]);

  const handleEmployeeSelection = useCallback(
    (employee: Employee) => {
      dispatch(setSelectedEmployeeAction(employee));
      dispatch(setOrderTypeAction("employees"));

      if (employee.discountPercentage > 0) {
        const discountValue = employee.discountPercentage;
        const currentSubtotal = (cart || []).reduce((sum, item) => sum + item.price * item.quantity, 0);
        const discountAmount = (currentSubtotal * discountValue) / 100;

        dispatch(
          applyDiscountAction({
            type: "percentage",
            value: discountValue,
            reason: `Employee discount - ${employee.user?.firstName} ${employee.user?.lastName} (${employee.department?.name || employee.department?.code || ""})`
          })
        );

        showSuccess(`Applied ${discountValue}% employee discount for ${employee.user?.firstName} ${employee.user?.lastName}`);
      }
    },
    [cart, showSuccess, dispatch]
  );

  const handleVoidOrder = useCallback(() => {
    if (!currentOrder) {
      showError("No current order to void");
      return;
    }
    if ((!cart || cart.length === 0) && !currentOrder.items?.length) {
      showError("Cannot void an empty order");
      return;
    }
    dispatch(setShowVoidDialogAction(true));
  }, [currentOrder, cart, showError, dispatch]);

  const handleConfirmVoid = useCallback(
    async (reason: string, restoreStock: boolean) => {
      try {
        dispatch(setShowVoidDialogAction(false));
        const result = await voidOrder(reason, restoreStock);
        clearCartWithAnimation();
        // Note: setHasUnsavedChanges action needs to be added to posSlice
        // For now, we'll handle this with local state
        // dispatch(setHasUnsavedChangesAction(false));
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
    [voidOrder, clearCartWithAnimation, showSuccess, resetToTakeaway, clearOrder, refreshAllCounts, dispatch]
  );

  const handleShowOrders = useCallback(() => {
    dispatch(setShowOrdersDialogAction(true));
  }, [dispatch]);

  const handleCancelOrder = useCallback(() => {
    dispatch(clearCartAction());
    dispatch(setOrderTypeAction("takeaway"));
    dispatch(setSelectedTableAction(undefined));
    dispatch(setSelectedEmployeeAction(undefined));
    dispatch(removeDiscountAction());
    if (clearOrder) {
      clearOrder();
    }
    OrderPersistence.clearCurrentOrder();
    // Note: setHasUnsavedChanges action needs to be added to posSlice
    // For now, we'll handle this with local state
    // dispatch(setHasUnsavedChangesAction(false));
    dispatch(setShowTablesLayoutAction(false));
    setPaymentAmount("");
    dispatch(setErrorAction(null));
    dispatch(setSuccessMessageAction(null));
  }, [clearOrder, dispatch]);

  // Add missing functions

  // Handle payment function
  const handlePayment = useCallback(async () => {
    if (cart.length === 0) {
      showError("Cart is empty");
      return;
    }

    if (currentOrder && currentOrder.status === "paid") {
      const orderIdentifier = currentOrder?.orderNumber || currentOrder?.id || "Current Order";
      showError(`Order ${orderIdentifier} is already completed`);
      dispatch(setShowPaymentDialogAction(false));
      clearOrder();
      return;
    }

    dispatch(setIsPOSActionInProgressAction(true));
    dispatch(setIsLoadingAction(true));

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
      dispatch(setShowPaymentDialogAction(false));
      setPaymentAmount("");
      dispatch(setIsPaymentCompletedAction(true));
      dispatch(setLastSaleDataAction(optimisticReceiptData));
      dispatch(setShowReceiptDialogAction(true));
      setShouldAutoPrint(hasSavedPrinter());
      dispatch(setShowSuccessCheckmarkAction(true));

      // CRITICAL: Mark order as completed immediately to prevent reloading
      if (currentOrder?.id) {
        completedOrdersRef.current.add(currentOrder.id.toString());
      }

      // Clear UI state immediately for instant feedback
      dispatch(removeDiscountAction());
      dispatch(setOrderNotesAction(""));
      // dispatch(setHasUnsavedChangesAction(false)); // Commented out as action needs to be added to posSlice
      processedOrderRef.current = null;
      OrderPersistence.clearCurrentOrder();

      // Start cart clearing animation immediately
      setTimeout(() => {
        clearCartWithAnimation();
        setTimeout(() => dispatch(setShowSuccessCheckmarkAction(false)), 2000);
      }, 100);

      // BACKGROUND PROCESSING - Handle actual API calls without blocking UI
      const backgroundProcessing = async () => {
        try {
          let orderToComplete = currentOrder;

          // Determine if we're editing a sale
          const isEditingSale = !!selectedSaleForEdit;
          
          // Create or update order if needed
          if (!currentOrder) {
            // Check if we're editing an existing sale
            if (isEditingSale && selectedSaleForEdit) {
              console.log("🔄 Updating existing sale for payment:", selectedSaleForEdit.id);
              
              // Prepare update data
              const updateData = {
                orderType: (selectedSaleForEdit as any).orderType || orderType, // Handle potential missing orderType in SaleRecord
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
              
              // Update the existing sale/order
              const updateResponse = await updateOrder(selectedSaleForEdit.id.toString(), updateData);
              orderToComplete = updateResponse && typeof updateResponse === "object" && "order" in updateResponse ? (updateResponse as any).order : updateResponse;
              console.log("✅ Successfully updated existing sale before payment");
            } else {
              console.log("🆕 Creating new order for payment");
              console.log("Applied discount:", appliedDiscount);
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

          console.log(`📝 Completing order ${orderToComplete.id} with payment data:`, optimisticPaymentData);
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
            dispatch(setLastSaleDataAction(updatedReceiptData));
          }

          completedOrdersRef.current.add(orderToComplete.id.toString());
          
          // Clear both selectedSaleForEdit and editingSaleId after successful payment
          // Since the sale is now complete, we don't need to track it anymore
          if (selectedSaleForEdit) {
            console.log("🔑 Before clearing selectedSaleForEdit and editingSaleId:", editingSaleId);
            dispatch(posActions.setSelectedSaleForEdit(null));
            dispatch(posActions.clearEditingSaleId());
            console.log("🔑 After payment, cleared both selectedSaleForEdit and editingSaleId");
          }

          // Execute background operations
          await refreshAllCounts();

          // Notify parent component if provided
          if (onSaleComplete) {
            // Map cart items to SoldItem and MenuItemSale arrays with type safety
            const soldItems = cart
              .filter(item => item.type === "material" && item.originalItem)
              .map(item => {
                try {
                  const materialItem = item.originalItem as StockEntryWithMaterial;
                  return {
                    quantity: item.quantity || 0,
                    unitPrice: item.price || 0,
                    materialId: String(materialItem?.materialId || "0"),
                    totalPrice: (item.price || 0) * (item.quantity || 0),
                    materialName: materialItem?.material?.name || "Unknown Material",
                    unit: materialItem?.purchasedUnit || "unit"
                  };
                } catch (e) {
                  console.error("Error mapping sold item:", e, item);
                  return {
                    quantity: 0,
                    unitPrice: 0,
                    materialId: "0",
                    totalPrice: 0,
                    materialName: "Error Item",
                    unit: "unit"
                  };
                }
              });

            const menuItemSales = cart
              .filter(item => item.type === "menu_item" && item.originalItem)
              .map(item => {
                try {
                  const menuItem = item.originalItem as MenuItem;
                  return {
                    menuItemId: String(menuItem?.id || "0"),
                    menuItemName: item.name || "Unknown Item",
                    quantity: item.quantity || 0,
                    unitPrice: item.price || 0,
                    totalPrice: (item.price || 0) * (item.quantity || 0),
                    ingredients: [], // Would need actual ingredients data
                    // Add missing fields to satisfy TypeScript
                    notes: item.notes || undefined,
                    id: `${Date.now()}-${Math.random().toString(36).substring(2, 9)}` // Generate a temporary ID
                  };
                } catch (e) {
                  console.error("Error mapping menu item sale:", e, item);
                  return {
                    menuItemId: "0",
                    menuItemName: "Error Item",
                    quantity: 0,
                    unitPrice: 0,
                    totalPrice: 0,
                    ingredients: [],
                    notes: undefined,
                    id: `${Date.now()}-${Math.random().toString(36).substring(2, 9)}` // Generate a temporary ID
                  };
                }
              });

            onSaleComplete({
              sale: {
                id: saleId,
                orderNumber: orderToComplete.orderNumber || order.orderNumber,
                saleDate: new Date(),
                items: soldItems,
                menuItems: menuItemSales,
                totalAmount: total,
                sectionId: orderToComplete.sectionId || "",
                order: {
                  id: orderToComplete.id.toString(),
                  orderNumber: orderToComplete.orderNumber || order.orderNumber,
                  orderType: orderToComplete.orderType || "standard"
                },
                createdAt: new Date(),
                updatedAt: new Date()
              },
              totalAmount: total,
              message: `Sale ${isEditingSale ? 'updated' : 'completed'} successfully for order #${orderToComplete.orderNumber || order.orderNumber || 'N/A'}`
            });
          }
        } catch (error) {
          console.error("❌ Background payment processing failed:", error);
        } finally {
          dispatch(setIsLoadingAction(false));
          dispatch(setIsPOSActionInProgressAction(false));
        }
      };

      // Start background processing without awaiting
      backgroundProcessing();
    } catch (error: unknown) {
      console.error("❌ Payment failed:", error);
      const errorMessage = error && typeof error === "object" && "response" in error && error.response && typeof error.response === "object" && "data" in error.response && error.response.data && typeof error.response.data === "object" && "message" in error.response.data ? (error.response.data.message as string) : "Failed to process payment. Please try again.";
      showError(errorMessage);
      dispatch(setIsLoadingAction(false));
      dispatch(setIsPOSActionInProgressAction(false));
    }
  }, [cart, currentOrder, orderType, selectedTable, selectedEmployee, appliedDiscount, orderNotes, paymentAmount, subtotal, tax, total, selectedSaleForEdit, showError, showSuccess, dispatch, clearOrder, clearCartWithAnimation, hasSavedPrinter, createOrder, updateOrder, refreshAllCounts, onSaleComplete]);

  // Handle manual save function
  const handleManualSave = useCallback(async () => {
    if (cart.length === 0) {
      showError("Cannot save empty order");
      return;
    }

    // Log the selected sale for edit state before saving
    console.log("🔍 Selected sale for edit before saving:", selectedSaleForEdit);
    console.log("🔑 Current editingSaleId before saving:", editingSaleId);
    
    // Determine if we're in edit mode
    const isEditMode = !!editingSaleId;
    console.log(`📝 Save operation mode: ${isEditMode ? 'EDIT existing sale' : 'CREATE new sale'}`);
    if (isEditMode) {
      console.log(`🔄 Will update sale with ID: ${editingSaleId}`);
    }
    
    // Store the current editingSaleId in a local variable to ensure it's not lost
    const currentEditingSaleId = editingSaleId;
    
    dispatch(setIsPOSActionInProgressAction(true));
    dispatch(setIsLoadingAction(true));

    try {
      dispatch(setShowSuccessCheckmarkAction(true));
      justSavedRef.current = true;

      setTimeout(() => {
        clearCartWithAnimation();
        dispatch(removeDiscountAction());
        setPaymentAmount("");
        dispatch(setOrderNotesAction(""));
        // dispatch(setHasUnsavedChangesAction(true)); // Commented out as action needs to be added to posSlice
        dispatch(setOrderTypeAction("takeaway"));
        dispatch(setSelectedTableAction(undefined));
        dispatch(setSelectedEmployeeAction(undefined));
        OrderPersistence.clearCurrentOrder();
        dispatch(setShowTablesLayoutAction(false));
        if (clearOrder) clearOrder();

        setTimeout(() => {
          dispatch(setShowSuccessCheckmarkAction(false));
          justSavedRef.current = false;
        }, 2000);
      }, 100);

      // BACKGROUND PROCESSING - Handle actual API calls without blocking UI
      const backgroundSaving = async () => {
        try {
          let savedOrder;
          // Check if we're editing an existing order or sale
          if (currentOrder?.id || currentEditingSaleId) {
            // Update existing order logic
            console.log("🔄 Updating existing order/sale", currentOrder?.id || currentEditingSaleId);
            console.log("📝 Using editingSaleId:", currentEditingSaleId);
            
            // Prepare update data
            const updateData: UpdateOrderData = {
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

            // Determine which ID to use for the update
            const orderId = currentOrder?.id || currentEditingSaleId;
            console.log(`📝 Using updateOrder API for ${orderId}`);
            console.log(`🔄 Is this an edited sale? ${!!currentEditingSaleId}`);
            
            try {
              // For sales editing, use ordersAPI directly to ensure the request is made
              if (currentEditingSaleId && !currentOrder?.id) {
                console.log(`💾 Direct API call for sale editing with ID: ${currentEditingSaleId}`);
                const response = await ordersAPI.updateOrder(currentEditingSaleId, updateData);
                savedOrder = response.data;
                console.log(`✅ Sale updated successfully via direct API call:`, savedOrder);
              } else {
                // Use the hook's updateOrder for regular orders
                console.log(`💾 Using hook's updateOrder for ID: ${orderId}`);
                savedOrder = await updateOrder(orderId, updateData);
                console.log(`✅ Order updated successfully via hook:`, savedOrder);
              }
            } catch (error) {
              console.error(`❌ Error updating order/sale:`, error);
              throw error;
            }
            showSuccess("Order updated successfully");
          } else {
            // Create new order
            console.log("🆕 Creating new order");
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
            showSuccess("New order created successfully");
          }

          // Background operations
          if (onOrderProcessed) onOrderProcessed();
          await refreshAllCounts();
          
          // Clear the selected sale for edit to prevent reloading
          // We'll explicitly clear the editingSaleId after a successful save
          dispatch(posActions.setSelectedSaleForEdit(null));
          dispatch(posActions.clearEditingSaleId());
          console.log("🔑 After successful save, cleared both selectedSaleForEdit and editingSaleId");
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
      dispatch(setIsLoadingAction(false));
      dispatch(setIsPOSActionInProgressAction(false));
    }
  }, [cart, orderType, selectedTable, selectedEmployee, appliedDiscount, orderNotes, currentOrder, selectedSaleForEdit, editingSaleId, createOrder, updateOrder, clearOrder, clearCartWithAnimation, showSuccess, showError, dispatch, refreshAllCounts, onOrderProcessed]);

  // Handle selectedOrderForPOS prop with protection for table selection
  useEffect(() => {
    // Skip if table was manually selected - this prevents the selectedOrderForPOS from overriding
    // the user's manual table selection
    if (isTableManuallySelected) {
      console.log("🔝️ Blocking selectedOrderForPOS effect - table was manually selected");
      return;
    }

    // Skip if there's a POS action in progress
    if (isPOSActionInProgress) {
      console.log("🔝️ Blocking selectedOrderForPOS effect - POS action in progress");
      return;
    }

    // Load selected order when selectedOrderForPOS changes
    if (selectedOrderForPOS && !isTableManuallySelected) {
      const orderId = selectedOrderForPOS.id;
      if (completedOrdersRef.current.has(orderId.toString())) {
        console.log("🚫 Blocking order load - order already completed", orderId);
        return;
      }

      if (processedOrderRef.current === orderId) {
        console.log("🚫 Blocking order load - order already processed", orderId);
        return;
      }

      // Load the order
      loadOrder(orderId);
      processedOrderRef.current = orderId;
    }
  }, [selectedOrderForPOS, loadOrder, isTableManuallySelected, isPOSActionInProgress]);

  // Reference to track processed sales to prevent duplicate loading
  const processedSaleIdRef = useRef<string | null>(null);
  
  // Handle loading a sale from Sales history
  useEffect(() => {
    // Skip if no sale is selected
    if (!selectedSaleForEdit) {
      return;
    }
    
    // Log that the effect was triggered
    console.log("🔄 useEffect for loading sale triggered with selectedSaleForEdit:", selectedSaleForEdit);
    
    const loadSaleFromHistory = async () => {
      // Only proceed if we have a sale to edit and it's different from the last one we processed
      if (selectedSaleForEdit && (!processedSaleIdRef.current || processedSaleIdRef.current !== selectedSaleForEdit.id.toString())) {
        console.log("🔄 Loading sale from history:", selectedSaleForEdit);
        
        // Store the current sale ID to prevent duplicate processing
        processedSaleIdRef.current = selectedSaleForEdit.id.toString();
        
        // Store the sale ID for later use when saving
        if (selectedSaleForEdit.id) {
          dispatch(posActions.setEditingSaleId(selectedSaleForEdit.id.toString()));
          console.log("🔑 Setting editingSaleId for later use:", selectedSaleForEdit.id.toString());
        }

        // Clear current cart and state
        dispatch(clearCartAction());
        dispatch(removeDiscountAction());
        dispatch(setOrderNotesAction(""));

        if (clearOrder) {
          clearOrder();
        }

        // Set order type and related info
        if (selectedSaleForEdit.orderType === "table" && selectedSaleForEdit.tableId) {
          try {
            // Try to fetch the table info
            const tableResponse = await tablesAPI.getTable(selectedSaleForEdit.tableId);
            const table = tableResponse.data;
            if (table) {
              dispatch(setSelectedTableAction(table));
              dispatch(setOrderTypeAction("table"));
            }
          } catch (error) {
            console.error("Failed to load table for sale:", error);
            dispatch(setOrderTypeAction(selectedSaleForEdit.orderType || "takeaway"));
          }
        } else if (selectedSaleForEdit.orderType === "employees" && selectedSaleForEdit.employeeId) {
          try {
            // Try to fetch employee info
            const employeeResponse = await fetch(`/api/employees/${selectedSaleForEdit.employeeId}`).then(res => res.json());
            if (employeeResponse.data) {
              dispatch(setSelectedEmployeeAction(employeeResponse.data));
              dispatch(setOrderTypeAction("employees"));
            }
          } catch (error) {
            console.error("Failed to load employee for sale:", error);
            dispatch(setOrderTypeAction(selectedSaleForEdit.orderType || "takeaway"));
          }
        } else {
          dispatch(setOrderTypeAction(selectedSaleForEdit.orderType || "takeaway"));
        }

        // Add items to cart
        const cartItems: POSCartItem[] = [];

        // Add menu items
        if (selectedSaleForEdit.menuItems && selectedSaleForEdit.menuItems.length > 0) {
          selectedSaleForEdit.menuItems.forEach(item => {
            const menuItem = menuItems.find(mi => String(mi.id) === String(item.menuItemId));

            cartItems.push({
              id: `history-${item.id || Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
              name: item.menuItemName || "Unknown Item",
              price: parseFloat(item.unitPrice?.toString() || "0"),
              quantity: item.quantity || 1,
              type: "menu_item",
              originalItem: menuItem || ({ id: item.menuItemId, name: item.menuItemName } as any),
              menuItemId: String(item.menuItemId),
              notes: item.notes
            });
          });
        }

        // Add material items
        if (selectedSaleForEdit.items && selectedSaleForEdit.items.length > 0) {
          selectedSaleForEdit.items.forEach(item => {
            const stockEntry = stockEntries.find(se => String(se.materialId) === String(item.materialId));

            cartItems.push({
              id: `history-${item.id || Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
              name: item.materialName || "Unknown Material",
              price: parseFloat(item.unitPrice?.toString() || "0"),
              quantity: item.quantity || 1,
              type: "material",
              originalItem: stockEntry || ({ materialId: item.materialId, material: { name: item.materialName } } as any),
              materialId: String(item.materialId),
              notes: item.notes
            });
          });
        }

        // Add items to cart
        cartItems.forEach(item => {
          dispatch(addToCartAction(item));
        });

        // Apply discount if present
        if (selectedSaleForEdit.discountAmount && parseFloat(selectedSaleForEdit.discountAmount.toString()) > 0) {
          dispatch(
            applyDiscountAction({
              type: (selectedSaleForEdit.discountType as "percentage" | "fixed") || "fixed",
              value: parseFloat(selectedSaleForEdit.discountValue?.toString() || "0"),
              reason: selectedSaleForEdit.discountReason || "From history"
            })
          );
        }

        // Set notes if present
        if (selectedSaleForEdit.notes) {
          dispatch(setOrderNotesAction(selectedSaleForEdit.notes));
        }

        // Clear the selected sale to prevent reloading
        // The editingSaleId will be preserved by our updated reducer
        console.log("🔑 Before clearing selectedSaleForEdit, editingSaleId:", editingSaleId);
        console.log("🧹 Clearing selectedSaleForEdit after loading");
        dispatch(posActions.setSelectedSaleForEdit(null));
        console.log("🔑 After clearing selectedSaleForEdit, editingSaleId is still:", editingSaleId);

        console.log("✅ Sale loaded from history successfully");
      }
    };

    // Call the async function and handle any errors
    loadSaleFromHistory().catch(error => {
      console.error("❌ Error loading sale from history:", error);
    });
    
    // Only depend on selectedSaleForEdit, not on editingSaleId
    // This prevents the effect from running again when only editingSaleId changes
  }, [dispatch, menuItems, stockEntries, clearOrder, selectedSaleForEdit]);

  // Add this effect to handle router state with orders from SalesHistoryPage
  useEffect(() => {
    if (routerStateProcessedRef.current) {
      return;
    }

    try {
      // Try to access the router state safely
      const routerState = window.history.state?.usr;

      if (routerState && routerState.selectedOrderForPOS && routerState.selectedOrderForPOS.fromSalesHistory) {
        console.log("🚨 DETECTED ORDER FROM ROUTER STATE:", routerState.selectedOrderForPOS);
        routerStateProcessedRef.current = true; // Mark as processed

        // Process this order if it hasn't been processed yet
        if (!processedOrderRef.current || processedOrderRef.current !== routerState.selectedOrderForPOS.id.toString()) {
          console.log("🚨 PROCESSING ORDER FROM ROUTER STATE");

          // DIRECT CART POPULATION - Most aggressive approach
          const order = routerState.selectedOrderForPOS;
          if (order.items && Array.isArray(order.items) && order.items.length > 0) {
            console.log("🚒 DIRECT POPULATION FROM ROUTER STATE:", order.items.length, "items");

            // Process each item in the order
            order.items.forEach((item: any, index: number) => {
              if (item.menuItem) {
                const cartItem: POSCartItem = {
                  id: `router-${order.id}-menu-${item.menuItem.id}-${index}`,
                  name: item.menuItem.name,
                  price: item.unitPrice || item.menuItem.price,
                  quantity: item.quantity,
                  type: "menu_item" as const,
                  menuItemId: item.menuItem.id.toString(),
                  originalItem: item.menuItem,
                  stockEntryId: undefined,
                  orderItemId: item.id?.toString?.() || item.id,
                  notes: item.notes || undefined
                };
                dispatch(addToCartAction(cartItem));
              } else if (item.material) {
                const cartItem: POSCartItem = {
                  id: `router-${order.id}-material-${item.material.id}-${index}`,
                  name: item.material.name,
                  price: parseFloat(item.unitPrice),
                  quantity: item.quantity,
                  type: "material" as const,
                  materialId: item.material.id.toString(),
                  stockEntryId: undefined,
                  originalItem: item.material,
                  orderItemId: item.id?.toString?.() || item.id,
                  notes: item.notes || undefined
                };
                dispatch(addToCartAction(cartItem));
              }
            });

            processedOrderRef.current = order.id.toString();

            // Also set order type, table, etc.
            dispatch(setOrderTypeAction(order.orderType));
            if (order.orderType === "table" && order.tableId) {
              const table = tables.find(t => t.id === order.tableId);
              if (table) {
                dispatch(setSelectedTableAction(table));
              }
            }
            if (order.discountAmount && parseFloat(order.discountAmount.toString()) > 0) {
              dispatch(
                applyDiscountAction({
                  type: (order.discountType as "percentage" | "fixed") || "fixed",
                  value: parseFloat(order.discountValue?.toString() || "0"),
                  reason: order.discountReason
                })
              );
            }
          }
        }
      }
    } catch (error) {
      console.error("❌ Error accessing router state:", error);
    }
  }, [dispatch, tables]); // Add dependencies as needed

  // Handle printer receipt functions
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

    dispatch(setLastSaleDataAction(receiptData));

    if (hasSavedPrinter()) {
      const savedPrinter = getSavedPrinter();
      handlePrintReceiptWithPrinter(savedPrinter);
    } else {
      setPrinterSelectionContext("manual_print");
      dispatch(setShowPrinterSelectorAction(true));
    }
  }, [cart, currentOrder, subtotal, total, appliedDiscount, showError, hasSavedPrinter, getSavedPrinter, dispatch, orderType, selectedTable, selectedEmployee]);

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

        dispatch(setLastSaleDataAction(receiptData));
      }

      dispatch(setShowReceiptDialogAction(true));
    },
    [lastSaleData, showError, currentOrder, cart, subtotal, total, appliedDiscount, dispatch]
  );

  const handlePrinterSelect = useCallback(
    (printer: any) => {
      selectPrinter(printer);
      dispatch(setShowPrinterSelectorAction(false));

      if (printerSelectionContext === "payment") {
        // Payment printing handled elsewhere
      } else if (printerSelectionContext === "manual_print") {
        handlePrintReceiptWithPrinter(printer);
      }

      setPrinterSelectionContext(null);
    },
    [selectPrinter, printerSelectionContext, handlePrintReceiptWithPrinter, dispatch]
  );

  const handleShowPrinterSettings = useCallback(() => {
    setPrinterSelectionContext("manual_print");
    setShowPrinterSelector(true);
  }, []);

  const handleClosePrinterSelector = useCallback(() => {
    dispatch(setShowPrinterSelectorAction(false));
    setPrinterSelectionContext(null);
  }, [dispatch]);

  // Add to cart handler
  const addToCart = useCallback(
    (posItem: POSItem) => {
      dispatch(setIsPOSActionInProgressAction(true));

      // Create a unique cart ID that includes variant information if present
      const variantId = posItem.selectedVariant ? `-variant-${posItem.selectedVariant.name}-${posItem.selectedVariant.volume}${posItem.selectedVariant.unit}` : "";
      const cartId = `pos-${posItem.id}${variantId}`;

      // Convert POSItem to POSCartItem before dispatching to addToCartAction
      const cartItem: POSCartItem = {
        id: cartId,
        name: posItem.name,
        price: posItem.price,
        quantity: 1, // Default quantity for new cart items
        type: posItem.type === "menu_item" ? "menu_item" : "material",
        // Use appropriate originalItem based on type
        originalItem: posItem.type === "menu_item" ? ({ id: posItem.menuItemId, name: posItem.name } as MenuItem) : ({ materialId: posItem.materialId, material: posItem.material } as StockEntryWithMaterial),
        posItem: posItem, // Store the original POSItem for reference
        stockEntryId: posItem.type === "stock_entry" ? posItem.id : undefined,
        menuItemId: posItem.type === "menu_item" ? String(posItem.menuItemId) : undefined,
        materialId: posItem.materialId,
        printerId: posItem.printerId,
        assignedPrinter: posItem.assignedPrinter,
        // Include variant information if present
        variant: posItem.selectedVariant
      };

      // Use the Redux action to add to cart with the converted item
      dispatch(addToCartAction(cartItem));

      // Reset POS action flag after cart update is complete
      setTimeout(() => {
        dispatch(setIsPOSActionInProgressAction(false));
      }, 0);
    },
    [dispatch]
  );

  // Update cart quantity handler
  const updateCartQuantity = useCallback(
    (cartId: string, newQuantity: number) => {
      dispatch(setIsPOSActionInProgressAction(true));
      dispatch(updateCartQuantityAction({ cartId, newQuantity }));

      // Reset POS action flag after cart update
      setTimeout(() => dispatch(setIsPOSActionInProgressAction(false)), 50);
    },
    [dispatch]
  );

  // Handle table selection
  const handleTableSelection = useCallback(
    async (table: Table) => {
      dispatch(setIsPOSActionInProgressAction(true));
      dispatch(setIsTableManuallySelectedAction(true));

      if (onOrderProcessed) {
        onOrderProcessed();
      }

      if (clearOrder) {
        clearOrder();
      }

      processedOrderRef.current = null;
      dispatch(setSelectedTableAction(table));
      dispatch(setOrderTypeAction("table"));
      dispatch(setShowTablesLayoutAction(false));

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

            // Use Redux actions to update state
            // Note: We need to modify the addToCart action in posSlice to accept cartItems
            // For now, we'll set the cart directly
            cartItems.forEach(item => {
              dispatch(addToCartAction(item));
            });

            // 🔧 FIX: Load the existing order so that saving will update instead of creating new
            await loadOrder(existingOrder.id);

            // Load existing discount information if present
            if (existingOrder.discountAmount && parseFloat(existingOrder.discountAmount.toString()) > 0) {
              dispatch(
                applyDiscountAction({
                  type: (existingOrder.discountType as "percentage" | "fixed") || "fixed",
                  value: parseFloat(existingOrder.discountValue?.toString() || "0"),
                  reason: existingOrder.discountReason
                })
              );
            }

            if (existingOrder.notes) {
              dispatch(setOrderNotesAction(existingOrder.notes));
            }
          }
        } catch (error) {
          console.error("❌ Failed to load table order:", error);
          showError("Failed to load existing table order");
        }
      } else {
        dispatch(clearCartAction());
        dispatch(removeDiscountAction());
        dispatch(setOrderNotesAction(""));

        if (clearOrder) {
          clearOrder();
        }

        OrderPersistence.clearCurrentOrder();
        dispatch(setSelectedEmployeeAction(undefined));
        processedOrderRef.current = null;
      }

      setTimeout(() => {
        dispatch(setIsTableManuallySelectedAction(false));
        dispatch(setIsPOSActionInProgressAction(false));
      }, 5000);
    },
    [loadOrder, menuItems, stockEntries, showError, clearOrder, dispatch, onOrderProcessed]
  );

  // Return the component JSX
  return (
    <div className="h-full flex flex-col" ref={containerRef}>
      {/* Error and Success Messages */}
      {error && (
        <Alert variant="destructive" className="mb-2">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {successMessage && (
        <Alert className="mb-2 border-green-500 bg-green-50">
          <CheckCircle className="h-4 w-4 text-green-500" />
          <AlertDescription className="text-green-700">{successMessage}</AlertDescription>
        </Alert>
      )}

      {/* Main POS Layout */}
      <div className="flex-1 flex flex-col lg:flex-row h-full relative overflow-hidden">
        {/* Left Panel - Cart and Order Details */}
        <div className={`flex-none lg:border-r border-gray-200 flex flex-col h-full ${isResizing ? "select-none" : ""}`} style={{ width: `${leftPanelWidth}%` }}>
          {/* Order Items List - Scrollable */}
          <div className="hidden lg:block flex-1 h-full relative overflow-hidden">
            <div className="h-full overflow-y-auto">
              <OrderItemsList
                key={`desktop-order-items-${cart.length}`} // Only re-render when cart length changes
                cart={stableCart}
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
          </div>

          {/* Order Summary - Fixed Height */}
          <div className="hidden lg:block flex-none border-t border-gray-200 bg-gray-50">
            <OrderSummary cart={stableCart} subtotal={subtotal} total={total} appliedDiscount={appliedDiscount} onRemoveDiscount={handleRemoveDiscount} onSaveClick={handleManualSave} onPaymentClick={() => dispatch(setShowPaymentDialogAction(true))} orderStatus={currentOrder?.status} isOrderCompleted={isPaymentCompleted} />
          </div>

          {/* Mobile View Tabs */}
          <div className="lg:hidden flex border-b border-gray-200">
            <Button variant={activeView === "products" ? "default" : "ghost"} className="flex-1 rounded-none border-b-2 border-transparent py-2 px-4" onClick={() => setActiveView("products")}>
              <ShoppingBag className="mr-2 h-4 w-4" />
              Products
            </Button>
            <Button variant={activeView === "cart" ? "default" : "ghost"} className="flex-1 rounded-none border-b-2 border-transparent py-2 px-4 relative" onClick={() => setActiveView("cart")}>
              <ShoppingCart className="mr-2 h-4 w-4" />
              Cart
              {cart.length > 0 && <span className="absolute top-1 right-1 bg-red-500 text-white rounded-full h-5 w-5 flex items-center justify-center text-xs font-bold">{cart.length}</span>}
            </Button>
          </div>

          {/* Mobile Cart View */}
          <div className={`lg:hidden ${activeView === "cart" ? "flex" : "hidden"} flex-col h-full`}>
            {/* Order Items List - Mobile */}
            <div className="flex-1 overflow-y-auto">
              <OrderItemsList
                key={`mobile-order-items-${cart.length}`} // Only re-render when cart length changes
                cart={stableCart}
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
            <div className="flex-none border-t border-gray-200 bg-gray-50">
              <OrderSummary cart={stableCart} subtotal={subtotal} total={total} appliedDiscount={appliedDiscount} onRemoveDiscount={handleRemoveDiscount} onSaveClick={handleManualSave} onPaymentClick={() => dispatch(setShowPaymentDialogAction(true))} orderStatus={currentOrder?.status} isOrderCompleted={isPaymentCompleted} />
            </div>
          </div>
        </div>

        {/* Resizer Handle */}
        <div className={`hidden lg:block w-1 cursor-col-resize bg-transparent hover:bg-blue-500 active:bg-blue-600 transition-colors ${isResizing ? "bg-blue-500" : ""}`} onMouseDown={() => setIsResizing(true)} />

        {/* Right Panel - Products */}
        <div className={`flex-1 flex flex-col h-full ${activeView === "products" || window.innerWidth >= 1024 ? "flex" : "hidden"}`} style={{ minWidth: "300px" }}>
          {/* Category Tabs */}
          <div className="flex-none border-b border-gray-200 bg-white">
            <CategoryTabs categories={categories} activeCategory={activeCategory} onCategoryChange={setActiveCategory} />
          </div>

          {/* Products Grid */}
          <div className="flex-1 overflow-y-auto bg-gray-50 p-2">
            <ItemsGrid posItems={filteredPosItems} onAddToCart={addToCart} isLoading={isItemsGridLoading} rightPanelPixelWidth={rightPanelPixelWidth} />
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

          {/* Mobile Action Bar */}
          <div className="lg:hidden border-t border-gray-200 bg-white p-2">
            <ActionBar onShowOrders={handleShowOrders} onShowReports={handleShowReports} incompleteOrdersCount={incompleteOrdersCount} incompleteTableOrdersCount={incompleteTableOrdersCount} incompleteDeliveryTakeawayCount={incompleteDeliveryTakeawayCount} />
          </div>
        </div>
      </div>

      {/* Dialogs */}
      {showPaymentDialog && <PaymentDialog isOpen={showPaymentDialog} onClose={() => dispatch(setShowPaymentDialogAction(false))} total={total} paymentAmount={paymentAmount} onPaymentAmountChange={setPaymentAmount} onPayment={handlePayment} isLoading={isLoading} />}

      {showReceiptDialog && lastSaleData && (
        <Dialog open={showReceiptDialog} onOpenChange={open => !open && dispatch(setShowReceiptDialogAction(false))}>
          <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Receipt</DialogTitle>
            </DialogHeader>
            <ReceiptPrinter isOpen={showReceiptDialog} onClose={() => dispatch(setShowReceiptDialogAction(false))} receiptData={lastSaleData} autoPrint={shouldAutoPrint} onPrintSuccess={() => setShouldAutoPrint(false)} />
            <DialogFooter className="flex justify-between">
              <Button variant="outline" onClick={() => dispatch(setShowReceiptDialogAction(false))}>
                Close
              </Button>
              <Button onClick={handlePrintReceipt}>
                <Printer className="mr-2 h-4 w-4" /> Print Again
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {showTablesLayout && <TablesLayout onClose={handleCloseTablesLayout} tables={tables} onTableSelect={handleTableSelection} tableOrders={tableOrders} />}

      {showDiscountDialog && <DiscountDialog isOpen={showDiscountDialog} onClose={() => dispatch(setShowDiscountDialogAction(false))} orderSubtotal={subtotal} onApplyDiscount={handleApplyDiscount} discountAmount={appliedDiscount?.amount || 0} onDiscountAmountChange={handleDiscountAmountChange} onDiscount={() => {}} />}

      {showNotesDialog && <NotesDialog isOpen={showNotesDialog} onClose={() => dispatch(setShowNotesDialogAction(false))} notes={orderNotes} onNotesChange={notes => dispatch(setOrderNotesAction(notes))} />}

      {showItemNotesDialog && selectedItemForNotes && <ItemNotesDialog isOpen={showItemNotesDialog} onClose={handleCloseItemNotes} item={selectedItemForNotes} onNotesChange={handleItemNotesChange} />}

      {showVoidDialog && <VoidOrderDialog isOpen={showVoidDialog} onClose={() => dispatch(setShowVoidDialogAction(false))} onConfirm={handleConfirmVoid} order={currentOrder} isLoading={isLoading} />}

      {showOrdersDialog && <POSClientOrders isOpen={showOrdersDialog} onClose={handleCloseOrdersDialog} onOrderSelect={handleOrderSelectCallback} onOrderStatusChange={() => fetchIncompleteOrdersCount()} />}

      {showReportsDialog && (
        <Dialog open={showReportsDialog} onOpenChange={open => !open && dispatch(setShowReportsDialogAction(false))}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Reports</DialogTitle>
            </DialogHeader>
            <ReportGenerator />
          </DialogContent>
        </Dialog>
      )}

      {showPrinterSelector && (
        <Dialog open={showPrinterSelector} onOpenChange={open => !open && handleClosePrinterSelector()}>
          <DialogContent>
            <DialogTitle>Select Printer</DialogTitle>
            <PrinterSelector onPrinterSelect={handlePrinterSelect} selectedPrinterId={selectedPrinter?.id} showStatus={true} showTestButton={true} />
          </DialogContent>
        </Dialog>
      )}

      {/* Success Checkmark Animation */}
      {showSuccessCheckmark && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div className="bg-white rounded-full p-4 shadow-lg">
            <Check className="text-green-500 h-16 w-16" />
          </div>
        </div>
      )}

      {/* Negative Stock Warning Dialog */}
      {showNegativeStockDialog && negativeStockWarnings.length > 0 && (
        <Dialog open={showNegativeStockDialog} onOpenChange={open => !open && setShowNegativeStockDialog(false)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center text-amber-600">
                <AlertTriangle className="mr-2 h-5 w-5" />
                Stock Warning
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <p>The following items will go into negative stock if this order is processed:</p>
              <ul className="list-disc pl-5 space-y-2">
                {negativeStockWarnings.map((warning, index) => (
                  <li key={index} className="text-amber-700">
                    <span className="font-medium">{warning.materialName}</span>: Current stock {warning.availableQuantity} {warning.unit}, needed {warning.requiredQuantity} {warning.unit}
                  </li>
                ))}
              </ul>
              <p>Do you want to continue anyway?</p>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowNegativeStockDialog(false)}>
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={() => {
                  setShowNegativeStockDialog(false);
                  // Continue with payment or save
                }}
              >
                Continue Anyway
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

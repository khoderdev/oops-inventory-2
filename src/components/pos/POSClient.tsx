import { logDevOnly } from "@/utils/logDevOnly";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { createOrder as createOrderThunk, fetchOrderById, updateOrder as updateOrderThunk, voidOrder as voidOrderThunk, setActiveOrder, clearStockRestorations } from "@/store/slices/ordersSlice";
import { selectActiveOrder, selectIsCreating, selectIsUpdating, selectIsVoiding, selectIsAnyLoading, selectLastStockRestorations } from "@/store/slices/ordersSelectors";
import { usePrinterSelector } from "@/hooks/usePrinterSelector";
import { Employee } from "@/types/employee";
import { MenuItem, NegativeStockWarning, POSCartItem, POSClientProps, POSItem, ReceiptData, SaleResponse, StockEntryWithMaterial, Table } from "@/types/inventory";
import { CreateOrderData, Order, OrderSummary as OrderSummaryType, OrderType, UpdateOrderData } from "@/types/orders";
import { generatePreviewOrderNumber } from "@/utils/orderNumberGenerator";
import { OrderPersistence } from "@/utils/orderPersistence";
import { formatItemsForPrinter } from "@/utils/thermalPrinterFormatter";
import { useVoidPrinter } from "./VoidPrinter";
import { AlertCircle, AlertTriangle, Check, CheckCircle, DollarSign, FileText, GripVertical, Settings, Trash2 } from "lucide-react";
import { useDailyReports } from "@/hooks/useDailyReports";
import { useDayOperations } from "@/hooks/useDayOperations";
import DailyReports from "@/components/analytics/DailyReports";
import React, { lazy, Suspense, useCallback, useEffect, useMemo, useRef, useState, useTransition } from "react";
import { tablesAPI } from "@/api/tables.api";
import { ordersAPI } from "@/api/orders.api";
import printerAPI from "@/api/printer.api";
import { Button } from "../ui/button";
import { Alert, AlertDescription } from "../ui/alert";
import PrinterSelector from "../common/PrinterSelector";

// Optimized hooks
import { usePOSState } from "@/hooks/usePOSState";
import { useOptimizedPOSData } from "@/hooks/useOptimizedPOSData";

// Lazy load heavy components
const ReportGenerator = lazy(() => import("../analytics/ReportGenerator"));
const ActionBar = lazy(() => import("./ActionBar"));
const CategoryTabs = lazy(() => import("./CategoryTabs"));
const DiscountDialog = lazy(() => import("./DiscountDialog"));
const ItemNotesDialog = lazy(() => import("./ItemNotesDialog"));
const OrderItemsList = lazy(() => import("./OrderItemsList"));
const PaymentDialog = lazy(() => import("./PaymentDialog"));
const POSClientOrders = lazy(() => import("./POSClientOrders"));
const ItemsGrid = lazy(() => import("./ItemsGrid"));
const ReceiptPrinter = lazy(() => import("./ReceiptPrinter"));
const VoidOrderDialog = lazy(() => import("./VoidOrderDialog"));
const TablesLayout = lazy(() => import("./TablesLayout"));

// Redux actions
import {
  setCart,
  addToCart as addToCartAction,
  updateCartQuantity as updateCartQuantityAction,
  clearCart as clearCartAction,
  clearCartWithAnimation as clearCartWithAnimationAction,
  setSelectedEmployee as setSelectedEmployeeAction,
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
  setHasUnsavedChanges as setHasUnsavedChangesAction,
  setOrderType as setOrderTypeAction,
  setSelectedTable as setSelectedTableAction,
  applyDiscount as applyDiscountAction,
  completeOrder
} from "@/store/slices/posSlice";
import NotesDialog from "./NotesDialog";
import OrderSummary from "./OrderSummary";

import { Modal } from "./Modal";

const EMPTY_ARRAY: any[] = [];

const POSClientComponent: React.FC<POSClientProps> = ({ sectionAssignments, onSaleComplete, onOrderSelect, selectedOrderForPOS, onOrderProcessed, refreshCountsRef, isDayOpen = true }) => {
  const dispatch = useAppDispatch();
  const [isPending, startTransition] = useTransition();

  // Consolidated Redux state (1 selector instead of 30+)
  const posState = usePOSState();
  const { cart, orderType, selectedTable, selectedEmployee, posCurrentOrder, hasUnsavedChanges, isLoading, error, successMessage, showSuccessCheckmark, showPaymentDialog, showReceiptDialog, showTablesLayout, showDiscountDialog, showNotesDialog, showItemNotesDialog, showVoidDialog, showOrdersDialog, showReportsDialog, showPrinterSelector, selectedItemForNotes, orderNotes, appliedDiscount, lastSaleData, isTableManuallySelected, editingSaleId, selectedSaleForEdit, isPOSActionInProgress } =
    posState;

  // Optimized POS data hook (handles transformation in service layer)
  const { posItems, filteredPosItems, categories, isLoading: posDataLoading, activeCategory, setActiveCategory } = useOptimizedPOSData(isPOSActionInProgress);

  // Day operations
  const { handleViewReport, showReportModal, setShowReportModal, selectedReport, loading: reportLoading, error: reportError, setError: setReportError } = useDailyReports();
  const { currentDay, closeDay, refreshCurrentDay, actionLoading: dayActionLoading } = useDayOperations();

  // Local state (minimal)
  const [negativeStockWarnings] = useState<NegativeStockWarning[]>([]);
  const [showNegativeStockDialog, setShowNegativeStockDialog] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState<string>("");
  const [tables, setTables] = useState<Table[]>([]);
  const [showUnsavedDialog, setShowUnsavedDialog] = useState(false);
  const [printedTables, setPrintedTables] = useState<string[]>([]);
  const [incompleteOrdersCount, setIncompleteOrdersCount] = useState<number>(0);
  const [tableOrders, setTableOrders] = useState<{ [tableId: string]: number }>({});
  const [incompleteTableOrdersCount, setIncompleteTableOrdersCount] = useState<number>(0);
  const [incompleteDeliveryTakeawayCount, setIncompleteDeliveryTakeawayCount] = useState<number>(0);
  const [leftPanelWidth, setLeftPanelWidth] = useState(33.33);
  const [rightPanelPixelWidth, setRightPanelPixelWidth] = useState(0);
  const [isResizing, setIsResizing] = useState(false);
  const resizeRafRef = useRef<number | null>(null);
  const [printerSelectionContext, setPrinterSelectionContext] = useState<"payment" | "manual_print" | null>(null);
  const [activeView, setActiveView] = useState<"cart" | "products">("products");
  const [showDayCloseDialog, setShowDayCloseDialog] = useState(false);
  const [closingCash, setClosingCash] = useState<string>("");
  const [dayCloseNotes, setDayCloseNotes] = useState<string>("");

  // Refs
  const errorTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const successTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const processedOrderRef = useRef<string | null>(null);
  const justSavedRef = useRef<boolean>(false);
  const completedOrdersRef = useRef<Set<string>>(new Set());
  const containerRef = useRef<HTMLDivElement>(null);
  const routerStateProcessedRef = useRef(false);
  const dayReportShownRef = useRef<boolean>(false);
  const processedSaleIdRef = useRef<string | null>(null);

  // Redux orders state
  const currentOrder = useAppSelector(selectActiveOrder);
  const isCreatingOrder = useAppSelector(selectIsCreating);
  const isUpdatingOrder = useAppSelector(selectIsUpdating);
  const isVoidingOrder = useAppSelector(selectIsVoiding);
  const orderLoading = useAppSelector(selectIsAnyLoading);
  const lastStockRestorations = useAppSelector(selectLastStockRestorations);

  const { selectedPrinter, selectPrinter, clearSelection, hasSavedPrinter, getSavedPrinter } = usePrinterSelector();
  const { printVoidReceiptsForRemovedItems } = useVoidPrinter({
    showSuccess: message => dispatch(setSuccessMessageAction(message)),
    showError: message => dispatch(setErrorAction(message))
  });

  // Reset showTablesLayout to false on component mount
  useEffect(() => {
    if (showTablesLayout) {
      dispatch(setShowTablesLayoutAction(false));
    }
  }, []);

  // Cleanup RAF on unmount
  useEffect(() => {
    return () => {
      if (resizeRafRef.current) {
        cancelAnimationFrame(resizeRafRef.current);
      }
    };
  }, []);

  // Consolidated useEffect for data fetching
  useEffect(() => {
    const fetchData = async () => {
      try {
        await Promise.all([fetchTablesData(), fetchIncompleteOrdersCount()]);
      } catch (err) {
        console.error("Error fetching initial data:", err);
      }
    };

    fetchData();

    // Set up periodic refresh (5 minutes)
    const intervalId = setInterval(() => {
      if (!isPOSActionInProgress) {
        fetchData();
      }
    }, 300000);

    return () => clearInterval(intervalId);
  }, [isPOSActionInProgress]);

  // Utility functions
  const showError = useCallback(
    (message: string) => {
      console.error("❌ Error:", message);
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

  // Calculations
  const subtotal = useMemo(() => {
    return (cart || []).filter(Boolean).reduce((sum, item) => {
      if (!item || typeof item.price !== "number" || typeof item.quantity !== "number") {
        return sum;
      }
      return sum + item.price * item.quantity;
    }, 0);
  }, [cart]);

  const tax = 0;
  const discountAmountCalculated = appliedDiscount ? appliedDiscount.amount : 0;
  const total = Math.max(0, subtotal - discountAmountCalculated);

  // Data fetching functions
  const fetchTablesData = useCallback(async () => {
    try {
      const tablesResponse = await tablesAPI.getTables({ includeOrders: true });
      const responseData = tablesResponse.data as Table[] | { data: Table[] };
      const tablesData = Array.isArray(responseData) ? responseData : responseData.data || [];
      setTables(tablesData);
    } catch (error) {
      console.error("Failed to refresh tables data:", error);
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
        } else if (response.data && typeof response.data === "object" && "data" in response.data) {
          ordersArray = (response.data as NestedResponse).data;
        } else {
          setIncompleteOrdersCount(0);
          return;
        }

        const incompleteStatuses = ["draft", "confirmed", "preparing", "ready"];
        const incompleteOrders = ordersArray.filter(order => incompleteStatuses.includes(order.status));
        setIncompleteOrdersCount(incompleteOrders.length);

        const deliveryCount = incompleteOrders.filter(order => order.orderType === "delivery").length;
        const takeawayCount = incompleteOrders.filter(order => order.orderType === "takeaway").length;
        setIncompleteDeliveryTakeawayCount(deliveryCount + takeawayCount);

        const uniqueTablesWithOrders = new Set(incompleteOrders.filter(order => order.orderType === "table" && order.tableNumber).map(order => order.tableNumber));
        setIncompleteTableOrdersCount(uniqueTablesWithOrders.size);

        const tableOrdersMap: { [tableId: string]: number } = {};
        incompleteOrders.forEach(order => {
          if (order.tableNumber) {
            const tableKey = order.tableNumber.toString();
            tableOrdersMap[tableKey] = (tableOrdersMap[tableKey] || 0) + 1;
          }
        });
        setTableOrders(tableOrdersMap);
      }
    } catch (error) {
      console.error("Error fetching incomplete orders:", error);
      setIncompleteOrdersCount(0);
    }
  }, []);

  // Order management functions
  const createOrder = useCallback(
    async (data: CreateOrderData): Promise<Order> => {
      const result = await dispatch(createOrderThunk(data));
      if (createOrderThunk.fulfilled.match(result)) {
        return result.payload;
      }
      throw new Error((result.payload as string) || "Failed to create order");
    },
    [dispatch]
  );

  const loadOrder = useCallback(
    async (orderId: string): Promise<Order> => {
      const result = await dispatch(fetchOrderById(orderId));
      if (fetchOrderById.fulfilled.match(result)) {
        return result.payload;
      }
      throw new Error((result.payload as string) || "Failed to load order");
    },
    [dispatch]
  );

  // Handle selectedOrderForPOS prop - load order when passed from parent
  useEffect(() => {
    if (!selectedOrderForPOS) return;
    
    console.log("📥 [POSClient] selectedOrderForPOS changed:", selectedOrderForPOS);
    
    const loadSelectedOrder = async () => {
      try {
        // Load the full order
        const fullOrderResponse = await loadOrder(selectedOrderForPOS.id);
        console.log("📄 [POSClient] Loaded selectedOrderForPOS response:", fullOrderResponse);
        
        // Extract the actual order data (handle nested data structure)
        const fullOrder = (fullOrderResponse as any)?.data || fullOrderResponse;
        console.log("📄 [POSClient] Extracted selectedOrderForPOS data:", fullOrder);
        
        // Convert order items to cart items (same logic as handleTableSelection)
        const cartItems: POSCartItem[] = fullOrder.items.map(item => {
          const unitPrice = typeof item.unitPrice === 'string' ? parseFloat(item.unitPrice) : item.unitPrice;
          const quantity = typeof item.quantity === 'string' ? parseFloat(item.quantity) : item.quantity;
          
          const originalItem = item.menuItem || item.material || {
            id: item.menuItemId || item.materialId || item.id,
            name: item.name,
            price: unitPrice
          };
          
          return {
            id: item.id?.toString() || `${item.menuItemId || item.materialId}-${Date.now()}`,
            menuItemId: item.menuItemId?.toString() || undefined,
            materialId: item.materialId?.toString() || undefined,
            name: item.name,
            price: unitPrice,
            quantity: quantity,
            type: item.type as "menu_item" | "stock_entry" | "material",
            notes: item.notes || undefined,
            originalItem: originalItem as any,
            orderItemId: item.id?.toString(),
            variant: item.selectedVariant ? {
              id: item.selectedVariant.name,
              name: item.selectedVariant.name,
              volume: item.selectedVariant.volume,
              unit: item.selectedVariant.unit,
              price: typeof item.selectedVariant.price === 'string' 
                ? parseFloat(item.selectedVariant.price) 
                : item.selectedVariant.price
            } : undefined
          };
        });
        
        console.log("🛒 [POSClient] Setting cart from selectedOrderForPOS:", cartItems);
        dispatch(setCart(cartItems));
        
        // Set order notes if any
        if (fullOrder.notes) {
          dispatch(setOrderNotesAction(fullOrder.notes));
        }
        
        // Set discount if any
        if (fullOrder.discountType && fullOrder.discountValue) {
          dispatch(applyDiscountAction({
            type: fullOrder.discountType as "percentage" | "fixed",
            value: fullOrder.discountValue,
            reason: fullOrder.discountReason
          }));
        }
        
        // Set table if it's a table order
        if (fullOrder.table) {
          dispatch(setSelectedTableAction(fullOrder.table));
          dispatch(setOrderTypeAction("table"));
        }
        
        showSuccess(`Loaded order ${fullOrder.orderNumber}`);
      } catch (error) {
        console.error("❌ [POSClient] Error loading selectedOrderForPOS:", error);
        showError("Failed to load order");
      }
    };
    
    loadSelectedOrder();
  }, [selectedOrderForPOS, loadOrder, dispatch, showSuccess, showError]);

  const updateOrder = useCallback(
    async (orderIdOrData: string | UpdateOrderData, maybeData?: UpdateOrderData): Promise<Order> => {
      let orderId: string;
      let data: UpdateOrderData;

      if (typeof orderIdOrData === "string") {
        orderId = orderIdOrData;
        data = maybeData as UpdateOrderData;
      } else {
        if (!currentOrder) {
          throw new Error("No current order to update");
        }
        data = orderIdOrData;
        orderId = currentOrder.id;
      }

      const result = await dispatch(updateOrderThunk({ orderId, data }));
      if (updateOrderThunk.fulfilled.match(result)) {
        return result.payload;
      }
      throw new Error((result.payload as string) || "Failed to update order");
    },
    [dispatch, currentOrder]
  );

  const voidOrder = useCallback(
    async (reason?: string, restoreStock: boolean = true) => {
      if (!currentOrder) {
        throw new Error("No current order to void");
      }

      const result = await dispatch(
        voidOrderThunk({
          orderId: currentOrder.id,
          data: {
            reason: reason || "Order voided by user",
            restoreStock
          }
        })
      );

      if (voidOrderThunk.fulfilled.match(result)) {
        return result.payload;
      }
      throw new Error((result.payload as string) || "Failed to void order");
    },
    [dispatch, currentOrder]
  );

  const clearOrder = useCallback(() => {
    dispatch(setActiveOrder(null));
    dispatch(clearStockRestorations());
  }, [dispatch]);

  // Cart clearing functions (must be declared before handleTableSelection)
  const clearCart = useCallback(() => {
    dispatch(clearCartAction());
  }, [dispatch]);

  const clearCartWithAnimation = useCallback(() => {
    dispatch(clearCartWithAnimationAction());
    processedOrderRef.current = null;
  }, [dispatch]);

  // Table selection handler
  const handleTableSelection = useCallback(
    async (table: Table) => {
      try {
        console.log("🎯 [POSClient] handleTableSelection called:", { tableId: table.id, tableNumber: table.number, status: table.status });
        
        dispatch(setIsTableManuallySelectedAction(true));
        dispatch(setSelectedTableAction(table));
        dispatch(setOrderTypeAction("table"));
        dispatch(setShowTablesLayoutAction(false));

        // Check if this table has an existing order
        const tableKey = table.number?.toString() || table.id?.toString();
        const hasExistingOrder = tableOrders[tableKey] && tableOrders[tableKey] > 0;
        
        console.log("🔍 [POSClient] Table order check:", { tableKey, hasExistingOrder, tableOrders });

        if (hasExistingOrder && table.status === "opened") {
          // Table has an existing order - fetch and load it
          console.log("📋 [POSClient] Loading existing order for table", table.number);
          
          try {
            // Fetch draft orders to find the order for this table
            const response = await ordersAPI.getOrders({ 
              status: "draft",
              tableNumber: table.number 
            });
            
            console.log("📦 [POSClient] Orders response:", response);
            
            // Handle nested data structure: response.data.data
            const orders = (response.data as any)?.data || response.data;
            
            if (orders && Array.isArray(orders) && orders.length > 0) {
              const tableOrder = orders[0]; // Get the first draft order for this table
              console.log("✅ [POSClient] Found order for table:", tableOrder);
              
              // Load the order
              const fullOrderResponse = await loadOrder(tableOrder.id);
              console.log("📄 [POSClient] Loaded full order response:", fullOrderResponse);
              
              // Extract the actual order data (handle nested data structure)
              const fullOrder = (fullOrderResponse as any)?.data || fullOrderResponse;
              console.log("📄 [POSClient] Extracted order data:", fullOrder);
              console.log("📄 [POSClient] Order items:", fullOrder.items);
              
              // Convert order items to cart items
              const cartItems: POSCartItem[] = fullOrder.items.map(item => {
                console.log("🔄 [POSClient] Converting order item:", {
                  id: item.id,
                  name: item.name,
                  type: item.type,
                  unitPrice: item.unitPrice,
                  hasMenuItem: !!item.menuItem,
                  hasMaterial: !!item.material
                });
                
                // Parse numeric values from strings
                const unitPrice = typeof item.unitPrice === 'string' ? parseFloat(item.unitPrice) : item.unitPrice;
                const quantity = typeof item.quantity === 'string' ? parseFloat(item.quantity) : item.quantity;
                
                // Use the full menuItem or material object if available, otherwise create minimal object
                const originalItem = item.menuItem || item.material || {
                  id: item.menuItemId || item.materialId || item.id,
                  name: item.name,
                  price: unitPrice
                };
                
                return {
                  id: item.id?.toString() || `${item.menuItemId || item.materialId}-${Date.now()}`,
                  menuItemId: item.menuItemId?.toString() || undefined,
                  materialId: item.materialId?.toString() || undefined,
                  name: item.name,
                  price: unitPrice,
                  quantity: quantity,
                  type: item.type as "menu_item" | "stock_entry" | "material",
                  notes: item.notes || undefined,
                  originalItem: originalItem as any,
                  // Store the backend order item ID for updates
                  orderItemId: item.id?.toString(),
                  // Map selectedVariant from OrderItem to variant in POSCartItem
                  variant: item.selectedVariant ? {
                    id: item.selectedVariant.name,
                    name: item.selectedVariant.name,
                    volume: item.selectedVariant.volume,
                    unit: item.selectedVariant.unit,
                    price: typeof item.selectedVariant.price === 'string' 
                      ? parseFloat(item.selectedVariant.price) 
                      : item.selectedVariant.price
                  } : undefined
                };
              });
              
              console.log("🛒 [POSClient] Setting cart items:", cartItems);
              console.log("🛒 [POSClient] Cart items count:", cartItems.length);
              console.log("🛒 [POSClient] First cart item:", cartItems[0]);
              
              // CRITICAL FIX: Set the active order FIRST so handleManualSave knows to UPDATE instead of CREATE
              dispatch(setActiveOrder(fullOrder));
              console.log("✅ [POSClient] Set active order:", fullOrder.id, fullOrder.orderNumber);
              
              // Set the cart with the order items
              dispatch(setCart(cartItems));
              
              // Verify cart was set in Redux
              setTimeout(() => {
                console.log("✅ [POSClient] Cart verification after dispatch - current cart from Redux:", cart);
                console.log("✅ [POSClient] Cart length from Redux:", cart.length);
                if (cart.length === 0) {
                  console.error("🚨 [POSClient] CRITICAL: Cart is EMPTY in Redux after setCart dispatch!");
                }
              }, 100);
              
              // Set order notes if any
              if (fullOrder.notes) {
                dispatch(setOrderNotesAction(fullOrder.notes));
              }
              
              // Set discount if any
              if (fullOrder.discountType && fullOrder.discountValue) {
                dispatch(applyDiscountAction({
                  type: fullOrder.discountType as "percentage" | "fixed",
                  value: fullOrder.discountValue,
                  reason: fullOrder.discountReason
                }));
              }
              
              showSuccess(`Loaded order for Table ${table.number}`);
            } else {
              console.log("⚠️ [POSClient] No incomplete orders found for table", table.number);
              // Clear cart for new order
              clearOrder();
              clearCart();
              showSuccess(`Table ${table.number} selected - Start new order`);
            }
          } catch (error) {
            console.error("❌ [POSClient] Error loading table order:", error);
            // Clear cart on error
            clearOrder();
            clearCart();
            showError("Failed to load table order");
          }
        } else {
          // No existing order - clear cart for new order
          console.log("🆕 [POSClient] No existing order - starting fresh");
          clearOrder();
          clearCart();
          showSuccess(`Table ${table.number} selected`);
        }
      } catch (error) {
        console.error("❌ [POSClient] Error selecting table:", error);
        showError("Failed to select table");
      }
    },
    [dispatch, clearOrder, clearCart, showSuccess, showError, tableOrders, loadOrder]
  );

  // Save order handler
  const handleManualSave = useCallback(async () => {
    if (cart.length === 0) {
      showError("Cannot save empty order");
      return;
    }

    if (currentOrder?.status === "paid") {
      showError(`Order ${currentOrder.orderNumber} is already completed`);
      return;
    }

    try {
      dispatch(setIsLoadingAction(true));

      const orderData = {
        orderType,
        tableId: selectedTable?.id ? String(selectedTable.id) : undefined,
        employeeId: selectedEmployee?.id,
        items: cart.map(item => ({
          type: item.type,
          menuItemId: item.menuItemId ? String(item.menuItemId) : undefined,
          materialId: item.materialId ? String(item.materialId) : undefined,
          name: item.name,
          quantity: item.quantity,
          unitPrice: item.price,
          totalPrice: item.price * item.quantity,
          notes: item.notes
        })),
        notes: orderNotes,
        // Flatten discount fields instead of nested object
        discountType: appliedDiscount?.type,
        discountValue: appliedDiscount?.value,
        discountReason: appliedDiscount?.reason
      };

      console.log("💾 [handleManualSave] Saving order:", {
        hasCurrentOrder: !!currentOrder,
        currentOrderId: currentOrder?.id,
        cartLength: cart.length,
        orderType
      });

      let savedOrder: Order;
      if (currentOrder?.id) {
        // Update existing order - ensure we have a valid order ID
        console.log("📝 [handleManualSave] Updating existing order:", currentOrder.id);
        savedOrder = await updateOrder(currentOrder.id, orderData as UpdateOrderData);
        showSuccess(`Order ${savedOrder.orderNumber} updated successfully`);
      } else {
        // Create new order
        console.log("✨ [handleManualSave] Creating new order");
        savedOrder = await createOrder(orderData as CreateOrderData);
        // CRITICAL FIX: Set the newly created order as active order
        dispatch(setActiveOrder(savedOrder));
        showSuccess(`Order ${savedOrder.orderNumber} saved successfully`);
      }

      dispatch(setHasUnsavedChangesAction(false));
      await fetchIncompleteOrdersCount();
      await fetchTablesData();
    } catch (error: any) {
      console.error("❌ [handleManualSave] Error saving order:", error);
      showError(error.message || "Failed to save order");
    } finally {
      dispatch(setIsLoadingAction(false));
    }
  }, [cart, currentOrder, orderType, selectedTable, selectedEmployee, orderNotes, appliedDiscount, dispatch, createOrder, updateOrder, showSuccess, showError, fetchIncompleteOrdersCount, fetchTablesData]);

  // Payment handler
  const handlePayment = useCallback(async () => {
    if (cart.length === 0) {
      showError("Cannot complete payment with empty cart");
      return;
    }

    try {
      dispatch(setIsLoadingAction(true));
      dispatch(setShowPaymentDialogAction(false));

      let orderId: string;

      // If no current order, create one first
      if (!currentOrder) {
        const orderData: CreateOrderData = {
          orderType,
          tableId: selectedTable?.id || undefined,
          employeeId: selectedEmployee?.id || null,
          items: cart.map(item => ({
            type: item.type,
            menuItemId: item.menuItemId ? String(item.menuItemId) : undefined,
            materialId: item.materialId ? String(item.materialId) : undefined,
            name: item.name,
            quantity: item.quantity,
            unitPrice: item.price,
            totalPrice: item.price * item.quantity,
            notes: item.notes
          })),
          notes: orderNotes,
          // Flatten discount fields instead of nested object
          discountType: appliedDiscount?.type,
          discountValue: appliedDiscount?.value,
          discountReason: appliedDiscount?.reason
        };

        const newOrder = await createOrder(orderData);
        orderId = newOrder.id;
      } else {
        if (currentOrder.status === "paid") {
          showError(`Order ${currentOrder.orderNumber} is already completed`);
          dispatch(setIsLoadingAction(false));
          return;
        }
        orderId = currentOrder.id;
      }

      const paymentData = {
        paymentMethod: "cash",
        paymentAmount: parseFloat(paymentAmount) || total,
        change: Math.max(0, parseFloat(paymentAmount) - total)
      };

      const result = await dispatch(
        completeOrder({
          orderId,
          paymentData
        })
      );

      if (completeOrder.fulfilled.match(result)) {
        const responseData = result.payload as any;
        const completedOrder = responseData.order || responseData;

        // Generate receipt data
        const now = new Date();
        const receiptData: ReceiptData = {
          id: completedOrder.orderNumber || generatePreviewOrderNumber(),
          date: now.toLocaleDateString(),
          time: now.toLocaleTimeString(),
          items: cart.map(item => ({
            name: item.name,
            quantity: item.quantity,
            unitPrice: item.price,
            totalPrice: item.price * item.quantity,
            type: item.type
          })),
          subtotal,
          discountType: appliedDiscount?.type || null,
          discountValue: appliedDiscount?.value || null,
          discountAmount: appliedDiscount?.amount || null,
          discountReason: appliedDiscount?.reason || null,
          tax,
          total,
          paymentMethod: paymentData.paymentMethod,
          paymentAmount: paymentData.paymentAmount,
          change: paymentData.change,
          orderType,
          tableNumber: selectedTable?.number || null,
          employeeName: selectedEmployee ? `${selectedEmployee.user?.firstName} ${selectedEmployee.user?.lastName}` : null,
          cashier: "POS User"
        };

        dispatch(setLastSaleDataAction(receiptData));
        dispatch(setShowSuccessCheckmarkAction(true));

        // Show success animation
        setTimeout(() => {
          dispatch(setShowSuccessCheckmarkAction(false));
          dispatch(setShowReceiptDialogAction(true));
          clearCartWithAnimation();
          clearOrder();
        }, 1500);

        showSuccess(`Order ${completedOrder.orderNumber} completed successfully!`);

        // Refresh counts
        await fetchIncompleteOrdersCount();
        await fetchTablesData();
      }
    } catch (error: any) {
      console.error("Error completing order:", error);
      showError(error.message || "Failed to complete order");
    } finally {
      dispatch(setIsLoadingAction(false));
    }
  }, [currentOrder, cart, paymentAmount, total, subtotal, tax, appliedDiscount, orderType, selectedTable, selectedEmployee, orderNotes, dispatch, createOrder, showSuccess, showError, clearCartWithAnimation, clearOrder, fetchIncompleteOrdersCount, fetchTablesData]);

  // Manual print handler
  const handleManualPrint = useCallback(() => {
    if (cart.length === 0) {
      showError("No items to print");
      return;
    }

    setPrinterSelectionContext("manual_print");
    dispatch(setShowPrinterSelectorAction(true));
  }, [cart, dispatch, showError]);

  // Printer settings handler
  const handleShowPrinterSettings = useCallback(() => {
    setPrinterSelectionContext("manual_print");
    dispatch(setShowPrinterSelectorAction(true));
  }, [dispatch]);

  // Printer selected handler
  const handlePrinterSelected = useCallback(async () => {
    if (!selectedPrinter) {
      showError("Please select a printer");
      return;
    }

    dispatch(setShowPrinterSelectorAction(false));

    if (printerSelectionContext === "manual_print") {
      try {
        const formattedReceipt = formatItemsForPrinter({
          items: cart,
          currentOrder,
          orderType,
          selectedTable: selectedTable || null,
          selectedEmployee: selectedEmployee || null,
          generatePreviewOrderNumber
        });

        await printerAPI.createPrintJob({
          printerId: selectedPrinter.id,
          jobType: "receipt",
          content: {
            rawContent: formattedReceipt
          },
          settings: {
            copies: 1
          }
        });

        showSuccess(`Receipt sent to ${selectedPrinter.name}`);
      } catch (error: any) {
        console.error("Error printing receipt:", error);
        showError(error.message || "Failed to print receipt");
      }
    }
  }, [selectedPrinter, printerSelectionContext, cart, currentOrder, subtotal, tax, total, appliedDiscount, orderType, selectedTable, selectedEmployee, dispatch, showSuccess, showError]);

  // Close day handler
  const handleCloseDayClick = useCallback(() => {
    setShowDayCloseDialog(true);
  }, []);

  // Confirm close day handler
  const handleConfirmCloseDay = useCallback(async () => {
    if (!closingCash) {
      showError("Please enter closing cash amount");
      return;
    }

    try {
      await closeDay({
        closingCash: parseFloat(closingCash),
        notes: dayCloseNotes
      });

      setShowDayCloseDialog(false);
      setClosingCash("");
      setDayCloseNotes("");
      showSuccess("Day closed successfully");

      // Refresh current day
      await refreshCurrentDay();
    } catch (error: any) {
      console.error("Error closing day:", error);
      showError(error.message || "Failed to close day");
    }
  }, [closingCash, dayCloseNotes, closeDay, refreshCurrentDay, showSuccess, showError]);

  // Cart operations
  const addToCart = useCallback(
    (posItem: POSItem) => {
      dispatch(setIsPOSActionInProgressAction(true));

      const variantId = posItem.selectedVariant ? `-variant-${posItem.selectedVariant.name}-${posItem.selectedVariant.volume}${posItem.selectedVariant.unit}` : "";
      const cartId = `pos-${posItem.id}${variantId}`;

      const cartItem: POSCartItem = {
        id: cartId,
        name: posItem.name,
        price: posItem.price,
        quantity: 1,
        type: posItem.type === "menu_item" ? "menu_item" : "material",
        originalItem: posItem.type === "menu_item" ? ({ id: posItem.menuItemId, name: posItem.name } as MenuItem) : ({ materialId: posItem.materialId, material: posItem.material } as StockEntryWithMaterial),
        posItem: posItem,
        stockEntryId: posItem.type === "stock_entry" ? posItem.id : undefined,
        menuItemId: posItem.type === "menu_item" ? String(posItem.menuItemId) : undefined,
        materialId: posItem.materialId,
        printerId: posItem.printerId,
        assignedPrinter: posItem.assignedPrinter,
        variant: posItem.selectedVariant
      };

      dispatch(addToCartAction(cartItem));

      // Use transition for non-urgent state update
      startTransition(() => {
        setTimeout(() => {
          dispatch(setIsPOSActionInProgressAction(false));
        }, 0);
      });
    },
    [dispatch, startTransition]
  );

  const handleAddToCart = useCallback(
    (posItem: POSItem) => {
      logDevOnly("🛒 Adding to cart:", posItem.name);
      addToCart(posItem);
    },
    [addToCart]
  );

  const updateCartQuantity = useCallback(
    (cartId: string, newQuantity: number) => {
      dispatch(setIsPOSActionInProgressAction(true));
      dispatch(updateCartQuantityAction({ cartId, newQuantity }));

      startTransition(() => {
        setTimeout(() => dispatch(setIsPOSActionInProgressAction(false)), 50);
      });
    },
    [dispatch, startTransition]
  );

  // Category change handler (debounced via hook)
  const handleCategoryChange = useCallback(
    (category: string) => {
      logDevOnly(`🔄 Category changed to: ${category}`);
      setActiveCategory(category);
    },
    [setActiveCategory]
  );

  // Render loading fallback
  const renderLoadingFallback = () => (
    <div className="flex items-center justify-center h-full">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
    </div>
  );

  return (
    <>
      <div ref={containerRef} className="h-full flex flex-col lg:flex-row bg-gray-50 safe-area-padding">
        {/* Left Panel - Cart */}
        <div
          className="cart hidden lg:flex flex-col h-full bg-white lg:border-r lg:border-gray-200"
          style={{
            width: typeof window !== "undefined" && window.innerWidth >= 1024 ? `${leftPanelWidth}%` : "100%"
          }}
        >
          {/* Cart Header */}
          <div className="card-header hidden lg:block border-b border-gray-200 px-3 flex-shrink-0">
            <div className={`flex items-center justify-between ${cart && cart.length > 0 && !showSuccessCheckmark ? "py-2" : ""}`}>
              <div className="flex flex-col xl:flex-row items-start xl:items-center space-y-1 xl:space-y-0 xl:space-x-2">
                {cart && cart.length > 0 && !showSuccessCheckmark && (
                  <span className="text-lg text-blue-600 font-bold">
                    {currentOrder ? (
                      <div className="flex items-center space-x-1">
                        <span>{currentOrder.orderNumber}</span>
                        <span className={`text-xs font-medium ${currentOrder.status === "draft" ? "text-orange-600" : currentOrder.status === "paid" ? "text-green-600" : "text-gray-600"}`}>({currentOrder.status})</span>
                      </div>
                    ) : (
                      <span>{generatePreviewOrderNumber()}</span>
                    )}
                  </span>
                )}
              </div>
              <div className="hidden lg:flex items-center space-x-2">
                {cart && cart.length > 0 && (
                  <>
                    <Button variant="outline" size="sm" onClick={() => dispatch(setShowDiscountDialogAction(true))} className="text-xs px-2 py-1 h-7" disabled={currentOrder?.status === "paid"}>
                      <DollarSign className="w-3 h-3" />
                      Discount
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => dispatch(setShowNotesDialogAction(true))} className="text-xs px-2 py-1 h-7" disabled={currentOrder?.status === "paid"}>
                      <FileText className={`w-3 h-3 ${orderNotes ? "text-blue-500" : ""}`} />
                      Notes
                    </Button>
                    <Trash2 className="w-5 h-5 text-red-600 cursor-pointer" onClick={clearCart} />
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Order Items List */}
          <div className="hidden lg:block flex-1 h-full relative overflow-hidden">
            <div className="h-full overflow-y-auto">
              <Suspense fallback={renderLoadingFallback()}>
                <OrderItemsList
                  cart={cart}
                  updateCartQuantity={updateCartQuantity}
                  orderType={orderType}
                  selectedTable={selectedTable}
                  selectedEmployee={selectedEmployee}
                  onOrderTypeChange={type => dispatch(setOrderTypeAction(type))}
                  onTableSelect={() => dispatch(setShowTablesLayoutAction(true))}
                  onEmployeeSelect={emp => dispatch(setSelectedEmployeeAction(emp))}
                  incompleteTableOrdersCount={incompleteTableOrdersCount}
                  orderStatus={currentOrder?.status}
                  isOrderCompleted={currentOrder?.status === "paid"}
                  discountReason={appliedDiscount?.reason}
                  leftPanelPixelWidth={containerRef.current ? (leftPanelWidth / 100) * containerRef.current.offsetWidth : 0}
                  onItemNotesChange={(itemId, notes) => dispatch(setItemNotesAction({ itemId, notes }))}
                  onShowItemNotes={item => {
                    dispatch(setSelectedItemForNotesAction(item));
                    dispatch(setShowItemNotesDialogAction(true));
                  }}
                />
              </Suspense>
            </div>

            {/* Success Animation */}
            {showSuccessCheckmark && (
              <div className="absolute inset-0 flex items-center justify-center z-10">
                <div className="text-center">
                  <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4 animate-scale-in" />
                  <p className="text-green-700 font-medium text-lg">Order Completed!</p>
                </div>
              </div>
            )}
          </div>

          {/* Order Summary */}
          {!showSuccessCheckmark && (
            <div className="hidden lg:block border-t border-gray-200 bg-white">
              <Suspense fallback={renderLoadingFallback()}>
                <OrderSummary
                  cart={cart}
                  subtotal={subtotal}
                  total={total}
                  orderStatus={currentOrder?.status}
                  isOrderCompleted={currentOrder?.status === "paid"}
                  appliedDiscount={appliedDiscount}
                  onRemoveDiscount={() => dispatch(removeDiscountAction())}
                  onPaymentClick={() => {
                    if (currentOrder?.status === "paid") {
                      showError(`Order ${currentOrder.orderNumber} is already completed`);
                      return;
                    }
                    setPaymentAmount(total.toString());
                    dispatch(setShowPaymentDialogAction(true));
                  }}
                  onSaveClick={handleManualSave}
                />
              </Suspense>
            </div>
          )}
        </div>

        {/* Resize Handle */}
        {typeof window !== "undefined" && window.innerWidth >= 1024 && (
          <div
            onMouseDown={e => {
              e.preventDefault();
              setIsResizing(true);

              const startX = e.clientX;
              const startWidth = leftPanelWidth;
              const containerWidth = containerRef.current?.offsetWidth || 0;

              // Optimized mouse move handler with requestAnimationFrame
              const handleMouseMove = (moveEvent: MouseEvent) => {
                // Cancel previous frame if it hasn't executed yet
                if (resizeRafRef.current) {
                  cancelAnimationFrame(resizeRafRef.current);
                }

                // Schedule update for next frame
                resizeRafRef.current = requestAnimationFrame(() => {
                  const deltaX = moveEvent.clientX - startX;
                  const calculatedWidth = startWidth + (deltaX / containerWidth) * 100;

                  // Calculate max width: either 500px or 30% of container, whichever is smaller
                  const maxWidthPx = 500;
                  const maxWidthPercent = Math.min(30, (maxWidthPx / containerWidth) * 100);

                  // Min: 20%, Max: 30% or 500px (whichever is smaller)
                  const newWidthPercent = Math.max(20, Math.min(maxWidthPercent, calculatedWidth));
                  setLeftPanelWidth(newWidthPercent);
                  setRightPanelPixelWidth(containerWidth - (containerWidth * newWidthPercent) / 100);
                });
              };

              const handleMouseUp = () => {
                setIsResizing(false);

                // Clean up RAF if pending
                if (resizeRafRef.current) {
                  cancelAnimationFrame(resizeRafRef.current);
                  resizeRafRef.current = null;
                }

                document.removeEventListener("mousemove", handleMouseMove);
                document.removeEventListener("mouseup", handleMouseUp);
              };

              document.addEventListener("mousemove", handleMouseMove);
              document.addEventListener("mouseup", handleMouseUp);
            }}
            className={`hidden lg:block w-1 bg-gray-300/50 hover:bg-blue-400 cursor-col-resize flex-shrink-0 transition-colors ${isResizing ? "bg-blue-500" : ""}`}
            style={{ minWidth: "4px", maxWidth: "4px" }}
          >
            <div className="flex items-center justify-center h-full">
              <GripVertical className="w-3 h-3 text-gray-400" />
            </div>
          </div>
        )}

        {/* Right Panel - Products */}
        <div
          className="products flex flex-col h-full bg-white"
          style={{
            width: typeof window !== "undefined" && window.innerWidth >= 1024 ? `${100 - leftPanelWidth}%` : "100%"
          }}
        >
          {/* Category Tabs */}
          <div className="flex-shrink-0 border-b border-gray-200 bg-white">
            <Suspense fallback={<div className="h-12" />}>
              <CategoryTabs categories={categories} activeCategory={activeCategory} onCategoryChange={handleCategoryChange} />
            </Suspense>
          </div>

          {/* Product Grid */}
          <div className="flex-1 min-h-0 !bg-gray-50 p-2">
            <Suspense fallback={renderLoadingFallback()}>
              <ItemsGrid posItems={filteredPosItems} onAddToCart={handleAddToCart} rightPanelPixelWidth={rightPanelPixelWidth} isLoading={posDataLoading} />
            </Suspense>
          </div>

          {/* Action Bar */}
          <div className="flex-shrink-0 border-t border-gray-200 bg-white">
            <Suspense fallback={<div className="h-16" />}>
              <ActionBar
                onSaveOrder={handleManualSave}
                onPrintReceipt={handleManualPrint}
                onVoidOrder={() => dispatch(setShowVoidDialogAction(true))}
                onShowOrders={() => dispatch(setShowOrdersDialogAction(true))}
                onShowReports={() => dispatch(setShowReportsDialogAction(true))}
                onCancelOrder={clearCart}
                onDiscount={() => dispatch(setShowDiscountDialogAction(true))}
                onCloseDayClick={handleCloseDayClick}
                hasUnsavedChanges={hasUnsavedChanges}
                isOrderLoading={orderLoading}
                canPrintReceipt={cart.length > 0}
                canVoidOrder={!!currentOrder}
                incompleteOrdersCount={incompleteOrdersCount}
                incompleteDeliveryTakeawayCount={incompleteDeliveryTakeawayCount}
                onShowPrinterSettings={handleShowPrinterSettings}
                hasSavedPrinter={hasSavedPrinter()}
                savedPrinterName={getSavedPrinter()?.name}
                isDayOpen={isDayOpen}
                currentDay={currentDay}
              />
            </Suspense>
          </div>
        </div>
      </div>

      {/* Dialogs */}
      <Suspense fallback={null}>
        {showPaymentDialog && <PaymentDialog isOpen={showPaymentDialog} onClose={() => dispatch(setShowPaymentDialogAction(false))} total={total} paymentAmount={paymentAmount} onPaymentAmountChange={setPaymentAmount} onPayment={handlePayment} isLoading={isLoading} />}

        {showReceiptDialog && lastSaleData && <ReceiptPrinter isOpen={showReceiptDialog} onClose={() => dispatch(setShowReceiptDialogAction(false))} receiptData={lastSaleData} autoPrint={false} />}

        {showDiscountDialog && (
          <DiscountDialog
            isOpen={showDiscountDialog}
            onClose={() => dispatch(setShowDiscountDialogAction(false))}
            onDiscountAmountChange={() => {}}
            onDiscount={() => {}}
            orderSubtotal={subtotal}
            onApplyDiscount={data => {
              dispatch(applyDiscountAction(data));
              dispatch(setShowDiscountDialogAction(false));
            }}
          />
        )}

        {showVoidDialog && (
          <VoidOrderDialog
            isOpen={showVoidDialog}
            onClose={() => dispatch(setShowVoidDialogAction(false))}
            onConfirm={async (reason, restoreStock) => {
              await voidOrder(reason, restoreStock);
              clearCartWithAnimation();
              clearOrder(); // Clear active order after voiding
            }}
            order={currentOrder}
            isLoading={orderLoading}
          />
        )}

        {showOrdersDialog && (
          <Suspense fallback={renderLoadingFallback()}>
            <POSClientOrders isOpen={showOrdersDialog} onClose={() => dispatch(setShowOrdersDialogAction(false))} onOrderSelect={onOrderSelect} onOrderStatusChange={fetchIncompleteOrdersCount} />
          </Suspense>
        )}

        {showNotesDialog && <NotesDialog isOpen={showNotesDialog} onClose={() => dispatch(setShowNotesDialogAction(false))} notes={orderNotes} onNotesChange={notes => dispatch(setOrderNotesAction(notes))} />}

        {showItemNotesDialog && selectedItemForNotes && <ItemNotesDialog isOpen={showItemNotesDialog} onClose={() => dispatch(setShowItemNotesDialogAction(false))} item={selectedItemForNotes} onNotesChange={(itemId, notes) => dispatch(setItemNotesAction({ itemId, notes }))} />}

        <Modal 
          isOpen={showTablesLayout} 
          onClose={() => dispatch(setShowTablesLayoutAction(false))} 
          showCloseButton={false}
          width="w-screen"
          height="h-screen"
          maxWidth="max-w-none"
          maxHeight="max-h-none"
          modalStyle="bg-white dark:bg-gray-900 border-none"
          headerStyle="flex justify-between items-center p-4 border-b dark:border-gray-700 bg-inherit z-10"
          contentStyle="flex-1 overflow-hidden p-0"
          footerStyle="p-4 border-t dark:border-gray-700 bg-gray-50"
          preventClickOutside={true}
          footer={
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center space-x-6">
                {[
                  { status: "available", color: "bg-green-100 border-green-300", label: "Available" },
                  { status: "opened", color: "bg-red-100 border-red-300", label: "Open" },
                  { status: "reserved", color: "bg-yellow-100 border-yellow-300", label: "Reserved" },
                  { status: "cleaning", color: "bg-gray-100 border-gray-300", label: "Cleaning" }
                ].map(item => (
                  <div key={item.status} className="flex items-center space-x-2">
                    <div className={`w-4 h-4 rounded-full ${item.color} border-2`}></div>
                    <span className="text-sm text-gray-600">{item.label}</span>
                  </div>
                ))}
              </div>

              <div className="flex space-x-3">
                <Button variant="outline" onClick={() => dispatch(setShowTablesLayoutAction(false))}>
                  Cancel
                </Button>
                {selectedTable && (
                  <Button 
                    onClick={() => selectedTable && handleTableSelection(selectedTable)} 
                    disabled={!selectedTable || selectedTable.status === "cleaning"} 
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    {selectedTable?.status === "opened" ? "Continue Order" : "Start Order"}
                  </Button>
                )}
              </div>
            </div>
          }
        >
          <TablesLayout 
            onTableSelect={handleTableSelection} 
            onClose={() => dispatch(setShowTablesLayoutAction(false))} 
            hideHeaderFooter={false}
          />
        </Modal>

        {showPrinterSelector && (
          <Dialog open={showPrinterSelector} onOpenChange={open => dispatch(setShowPrinterSelectorAction(open))}>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>Select Printer</DialogTitle>
                <DialogDescription>Choose a printer for {printerSelectionContext === "payment" ? "payment receipt" : "manual print"}</DialogDescription>
              </DialogHeader>
              <PrinterSelector
                selectedPrinterId={selectedPrinter?.id ?? null}
                onPrinterSelect={printer => {
                  if (printer) {
                    selectPrinter(printer);
                  } else {
                    clearSelection();
                  }
                }}
              />
              <DialogFooter>
                <Button variant="outline" onClick={() => dispatch(setShowPrinterSelectorAction(false))}>
                  Cancel
                </Button>
                <Button onClick={handlePrinterSelected}>Continue</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}

        {showDayCloseDialog && (
          <Dialog open={showDayCloseDialog} onOpenChange={setShowDayCloseDialog}>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>Close Day</DialogTitle>
                <DialogDescription>Enter the closing cash amount and any notes for the day.</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Closing Cash Amount</label>
                  <input type="number" value={closingCash} onChange={e => setClosingCash(e.target.value)} className="w-full px-3 py-2 border rounded-md" placeholder="Enter closing cash amount" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Notes (Optional)</label>
                  <textarea value={dayCloseNotes} onChange={e => setDayCloseNotes(e.target.value)} className="w-full px-3 py-2 border rounded-md" rows={3} placeholder="Add any notes about the day" />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowDayCloseDialog(false)}>
                  Cancel
                </Button>
                <Button onClick={handleConfirmCloseDay} disabled={!closingCash || dayActionLoading}>
                  {dayActionLoading ? "Closing..." : "Close Day"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </Suspense>

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

export const POSClient = React.memo(POSClientComponent, (prevProps, nextProps) => {
  return prevProps.isDayOpen === nextProps.isDayOpen && prevProps.selectedOrderForPOS === nextProps.selectedOrderForPOS;
});

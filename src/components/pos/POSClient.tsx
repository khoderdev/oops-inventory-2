import { logDevOnly } from "@/utils/logDevOnly";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { createOrder as createOrderThunk, fetchOrderById, updateOrder as updateOrderThunk, voidOrder as voidOrderThunk, setActiveOrder, clearStockRestorations } from "@/store/slices/ordersSlice";
import { selectActiveOrder, selectIsAnyLoading } from "@/store/slices/ordersSelectors";
import { usePrinterSelector } from "@/hooks/usePrinterSelector";
import { MenuItem, POSCartItem, POSClientProps, POSItem, ReceiptData, StockEntryWithMaterial, Table } from "@/types/inventory";
import { CreateOrderData, Order, OrderType, UpdateOrderData } from "@/types/orders";
import { generatePreviewOrderNumber } from "@/utils/orderNumberGenerator";
import { formatItemsForPrinter } from "@/utils/thermalPrinterFormatter";
import { AlertCircle, Check, CheckCircle, DollarSign, FileText, GripVertical, Trash2 } from "lucide-react";
import { useDayOperations } from "@/hooks/useDayOperations";
import React, { lazy, Suspense, useCallback, useEffect, useMemo, useRef, useState, useTransition } from "react";
import { ordersAPI } from "@/api/orders.api";
import printerAPI from "@/api/printer.api";
import { useGetOrdersQuery } from "@/store/api/posApi";
import { Button } from "../ui/button";
import { Alert, AlertDescription } from "../ui/alert";
import PrinterSelector from "../common/PrinterSelector";
import { usePOSState } from "@/hooks/usePOSState";
import { usePOSData } from "@/hooks/usePOSData";
import { useAuth } from "@/contexts/AuthContext";
import { Modal } from "./Modal";
import NotesDialog from "./NotesDialog";
import OrderSummary from "./OrderSummary";

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
  optimisticClearCart as optimisticClearCartAction,
  restoreCartFromBackup as restoreCartFromBackupAction,
  confirmCartClear as confirmCartClearAction,
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
  completeOrder,
  // Cleanup actions
  resetEphemeralState,
  resetPaymentState,
  resetDayCloseState,
  resetPrinterSelectionState,
  // New state actions
  setPaymentAmount as setPaymentAmountAction,
  setShowDayCloseDialog as setShowDayCloseDialogAction,
  setClosingCash as setClosingCashAction,
  setDayCloseNotes as setDayCloseNotesAction,
  setPrinterSelectionContext as setPrinterSelectionContextAction
} from "@/store/slices/posSlice";

const POSClientComponent: React.FC<POSClientProps> = ({ onOrderSelect, selectedOrderForPOS, isDayOpen = true }) => {
  const dispatch = useAppDispatch();
  const [, startTransition] = useTransition();
  const { isAuthenticated } = useAuth();

  // Consolidated Redux state (1 selector instead of 30+)
  const posState = usePOSState();
  const { 
    cart, orderType, selectedTable, selectedEmployee, hasUnsavedChanges, isLoading, error, successMessage, 
    showSuccessCheckmark, showPaymentDialog, showReceiptDialog, showTablesLayout, showDiscountDialog, 
    showNotesDialog, showItemNotesDialog, showVoidDialog, showOrdersDialog, showPrinterSelector, 
    selectedItemForNotes, orderNotes, appliedDiscount, lastSaleData, editingSaleId, selectedSaleForEdit, 
    isPOSActionInProgress,
    // New Redux state fields (previously local)
    paymentAmount, showDayCloseDialog, closingCash, dayCloseNotes, printerSelectionContext
  } = posState;

  const { filteredPosItems, categories, isLoading: posDataLoading, activeCategory, setActiveCategory } = usePOSData(isPOSActionInProgress);
  const { currentDay, closeDay, refreshCurrentDay, actionLoading: dayActionLoading } = useDayOperations();
  const { data: ordersData = [] } = useGetOrdersQuery({}, { pollingInterval: 0, refetchOnMountOrArgChange: false, refetchOnFocus: false, skip: !isAuthenticated });

  // Calculate orders counts from RTK Query data (memoized)
  const { incompleteOrdersCount, tableOrders, incompleteTableOrdersCount, incompleteDeliveryTakeawayCount } = useMemo(() => {
    const incompleteStatuses = ["draft", "confirmed", "preparing", "ready"];
    const incompleteOrders = ordersData.filter(order => incompleteStatuses.includes(order.status));
    const deliveryCount = incompleteOrders.filter(order => order.orderType === "delivery").length;
    const takeawayCount = incompleteOrders.filter(order => order.orderType === "takeaway").length;
    const uniqueTablesWithOrders = new Set(incompleteOrders.filter(order => order.orderType === "table" && order.tableNumber).map(order => order.tableNumber));
    const tableOrdersMap: { [tableId: string]: number } = {};
    incompleteOrders.forEach(order => {
      if (order.tableNumber) {
        const tableKey = order.tableNumber.toString();
        tableOrdersMap[tableKey] = (tableOrdersMap[tableKey] || 0) + 1;
      }
    });
    return {
      incompleteOrdersCount: incompleteOrders.length,
      tableOrders: tableOrdersMap,
      incompleteTableOrdersCount: uniqueTablesWithOrders.size,
      incompleteDeliveryTakeawayCount: deliveryCount + takeawayCount
    };
  }, [ordersData]);

  // Local state (minimal - only ephemeral UI layout state)
  const [leftPanelWidth, setLeftPanelWidth] = useState(33.33);
  const [rightPanelPixelWidth, setRightPanelPixelWidth] = useState(0);
  const [isResizing, setIsResizing] = useState(false);
  const resizeRafRef = useRef<number | null>(null);
  const errorTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const successTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const processedOrderRef = useRef<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const processedSaleIdRef = useRef<string | null>(null);
  const currentOrder = useAppSelector(selectActiveOrder);
  const orderLoading = useAppSelector(selectIsAnyLoading);
  const { selectedPrinter, selectPrinter, clearSelection, hasSavedPrinter, getSavedPrinter } = usePrinterSelector();

  // Reset showTablesLayout to false on component mount
  useEffect(() => {
    if (showTablesLayout) {
      dispatch(setShowTablesLayoutAction(false));
    }
  }, []);

  useEffect(() => {
    return () => {
      if (resizeRafRef.current) {
        cancelAnimationFrame(resizeRafRef.current);
      }
    };
  }, []);

  useEffect(() => {
    return () => {
      console.log("🧹 [POSClient] Cleaning up ephemeral state on unmount");
      dispatch(resetEphemeralState());
    };
  }, [dispatch]);

  // Reset payment state when payment dialog closes
  useEffect(() => {
    if (!showPaymentDialog) {
      dispatch(resetPaymentState());
    }
  }, [showPaymentDialog, dispatch]);

  // Reset day close state when dialog closes
  useEffect(() => {
    if (!showDayCloseDialog) {
      dispatch(resetDayCloseState());
    }
  }, [showDayCloseDialog, dispatch]);

  // Reset printer selection state when dialog closes
  useEffect(() => {
    if (!showPrinterSelector) {
      dispatch(resetPrinterSelectionState());
    }
  }, [showPrinterSelector, dispatch]);

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

  // Order management functions
  const createOrder = useCallback(
    async (data: CreateOrderData): Promise<Order> => {
      const result = await dispatch(createOrderThunk(data));
      if (createOrderThunk.fulfilled.match(result)) {
        const payload = result.payload as any;
        const order = payload.order || payload;
        console.log("✅ [createOrder] Order created:", order);
        return order;
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

  useEffect(() => {
    if (!selectedOrderForPOS) return;
    const loadSelectedOrder = async () => {
      try {
        const fullOrderResponse = await loadOrder(selectedOrderForPOS.id);
        const fullOrder = (fullOrderResponse as any)?.data || fullOrderResponse;
        const cartItems: POSCartItem[] = fullOrder.items.map(item => {
          const unitPrice = typeof item.unitPrice === "string" ? parseFloat(item.unitPrice) : item.unitPrice;
          const quantity = typeof item.quantity === "string" ? parseFloat(item.quantity) : item.quantity;

          const originalItem = item.menuItem ||
            item.material || {
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
            variant: item.selectedVariant
              ? {
                  id: item.selectedVariant.name,
                  name: item.selectedVariant.name,
                  volume: item.selectedVariant.volume,
                  unit: item.selectedVariant.unit,
                  price: typeof item.selectedVariant.price === "string" ? parseFloat(item.selectedVariant.price) : item.selectedVariant.price
                }
              : undefined
          };
        });

        dispatch(setCart(cartItems));

        if (fullOrder.notes) {
          dispatch(setOrderNotesAction(fullOrder.notes));
        }

        if (fullOrder.discountType && fullOrder.discountValue) {
          dispatch(
            applyDiscountAction({
              type: fullOrder.discountType as "percentage" | "fixed",
              value: fullOrder.discountValue,
              reason: fullOrder.discountReason
            })
          );
        }

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

  // Handle selectedSaleForEdit from Sales component - load sale for editing
  useEffect(() => {
    if (!selectedSaleForEdit || !editingSaleId) return;
    if (processedSaleIdRef.current === editingSaleId) {
      return;
    }
    processedSaleIdRef.current = editingSaleId;
    const loadSaleForEdit = async () => {
      try {
        const fullOrderResponse = await loadOrder(editingSaleId);
        const fullOrder = (fullOrderResponse as any)?.data || fullOrderResponse;
        // Convert order items to cart items
        const cartItems: POSCartItem[] = fullOrder.items.map(item => {
          const unitPrice = typeof item.unitPrice === "string" ? parseFloat(item.unitPrice) : item.unitPrice;
          const quantity = typeof item.quantity === "string" ? parseFloat(item.quantity) : item.quantity;

          const originalItem = item.menuItem ||
            item.material || {
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
            variant: item.selectedVariant
              ? {
                  id: item.selectedVariant.name,
                  name: item.selectedVariant.name,
                  volume: item.selectedVariant.volume,
                  unit: item.selectedVariant.unit,
                  price: typeof item.selectedVariant.price === "string" ? parseFloat(item.selectedVariant.price) : item.selectedVariant.price
                }
              : undefined
          };
        });

        dispatch(setActiveOrder(fullOrder));
        dispatch(setCart(cartItems));
        if (fullOrder.notes) {
          dispatch(setOrderNotesAction(fullOrder.notes));
        }
        if (fullOrder.discountType && fullOrder.discountValue) {
          dispatch(
            applyDiscountAction({
              type: fullOrder.discountType as "percentage" | "fixed",
              value: fullOrder.discountValue,
              reason: fullOrder.discountReason
            })
          );
        }
        if (fullOrder.table) {
          dispatch(setSelectedTableAction(fullOrder.table));
          dispatch(setOrderTypeAction("table"));
        }
        if (fullOrder.employee) {
          dispatch(setSelectedEmployeeAction(fullOrder.employee));
          dispatch(setOrderTypeAction("employees"));
        }
        if (selectedSaleForEdit.orderType) {
          dispatch(setOrderTypeAction(selectedSaleForEdit.orderType as OrderType));
        }

        showSuccess(`Loaded sale ${fullOrder.orderNumber} for editing`);
      } catch (error) {
        console.error("❌ [POSClient] Error loading sale for edit:", error);
        showError("Failed to load sale for editing");
      }
    };

    loadSaleForEdit();
  }, [selectedSaleForEdit, editingSaleId, loadOrder, dispatch, showSuccess, showError]);

  const updateOrder = useCallback(
    async (orderIdOrData: string | UpdateOrderData, maybeData?: UpdateOrderData) => {
      let orderId: string;
      let data: UpdateOrderData;

      if (typeof orderIdOrData === "string") {
        orderId = orderIdOrData;
        data = maybeData as UpdateOrderData;
        if (!data) {
          console.error("❌ [updateOrder] Missing data parameter when orderId is provided:", orderId);
          throw new Error("Update data is required when providing orderId");
        }
      } else {
        if (!currentOrder) {
          throw new Error("No current order to update");
        }
        data = orderIdOrData;
        orderId = currentOrder.id;
      }

      const result = await dispatch(updateOrderThunk({ orderId, data }));
      if (updateOrderThunk.fulfilled.match(result)) {
        return result;
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
        return result;
      }
      throw new Error((result.payload as string) || "Failed to void order");
    },
    [dispatch, currentOrder]
  );

  const clearOrder = useCallback(() => {
    dispatch(setActiveOrder(null));
    dispatch(clearStockRestorations());
  }, [dispatch]);

  const clearCart = useCallback(() => {
    dispatch(clearCartAction());
  }, [dispatch]);

  const clearCartWithAnimation = useCallback(() => {
    dispatch(clearCartWithAnimationAction());
    processedOrderRef.current = null;
  }, [dispatch]);
  const handleTableSelection = useCallback(
    async (table: Table) => {
      try {
        dispatch(setIsTableManuallySelectedAction(true));
        dispatch(setSelectedTableAction(table));
        dispatch(setOrderTypeAction("table"));
        dispatch(setShowTablesLayoutAction(false));
        const tableKey = table.number?.toString() || table.id?.toString();
        const hasExistingOrder = tableOrders[tableKey] && tableOrders[tableKey] > 0;
        if (hasExistingOrder && table.status === "opened") {
          try {
            const response = await ordersAPI.getOrders({
              status: "draft",
              tableNumber: table.number
            });
            const orders = (response.data as any)?.data || response.data;
            if (orders && Array.isArray(orders) && orders.length > 0) {
              const tableOrder = orders[0];
              const fullOrderResponse = await loadOrder(tableOrder.id);
              const fullOrder = (fullOrderResponse as any)?.data || fullOrderResponse;
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
                const unitPrice = typeof item.unitPrice === "string" ? parseFloat(item.unitPrice) : item.unitPrice;
                const quantity = typeof item.quantity === "string" ? parseFloat(item.quantity) : item.quantity;
                // Use the full menuItem or material object if available, otherwise create minimal object
                const originalItem = item.menuItem ||
                  item.material || {
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
                  variant: item.selectedVariant
                    ? {
                        id: item.selectedVariant.name,
                        name: item.selectedVariant.name,
                        volume: item.selectedVariant.volume,
                        unit: item.selectedVariant.unit,
                        price: typeof item.selectedVariant.price === "string" ? parseFloat(item.selectedVariant.price) : item.selectedVariant.price
                      }
                    : undefined
                };
              });

              dispatch(setActiveOrder(fullOrder));
              dispatch(setCart(cartItems));

              if (fullOrder.notes) {
                dispatch(setOrderNotesAction(fullOrder.notes));
              }

              if (fullOrder.discountType && fullOrder.discountValue) {
                dispatch(
                  applyDiscountAction({
                    type: fullOrder.discountType as "percentage" | "fixed",
                    value: fullOrder.discountValue,
                    reason: fullOrder.discountReason
                  })
                );
              }

              showSuccess(`Loaded order for Table ${table.number}`);
            } else {
              clearOrder();
              clearCart();
              showSuccess(`Table ${table.number} selected - Start new order`);
            }
          } catch (error) {
            console.error("❌ [POSClient] Error loading table order:", error);
            clearOrder();
            clearCart();
            showError("Failed to load table order");
          }
        } else {
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

  // Save order handler with optimistic UI
  const handleManualSave = useCallback(async () => {
    if (cart.length === 0) {
      showError("Cannot save empty order");
      return;
    }

    if (currentOrder?.status === "paid") {
      showError(`Order ${currentOrder.orderNumber} is already completed`);
      return;
    }

    // 🚀 INSTANT UI UPDATE - Clear cart and show success immediately
    dispatch(optimisticClearCartAction());
    const optimisticOrderNumber = currentOrder?.orderNumber || generatePreviewOrderNumber();
    showSuccess(`Order ${optimisticOrderNumber} saved successfully! ✓`);

    // Hide success animation after 2 seconds
    setTimeout(() => {
      dispatch(confirmCartClearAction());
      // Reset table selection to original state
      dispatch(setSelectedTableAction(null));
      dispatch(setOrderTypeAction("takeaway"));
    }, 2000);

    // 🔄 BACKGROUND PROCESSING - Handle actual save
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
      discountType: appliedDiscount?.type,
      discountValue: appliedDiscount?.value,
      discountReason: appliedDiscount?.reason
    };

    // Process in background without blocking UI
    (async () => {
      try {
        let savedOrder: Order;
        if (currentOrder?.id) {
          const updateOrderResult = await updateOrder(currentOrder.id.toString(), orderData as UpdateOrderData);
          const payload = updateOrderResult.payload as any;
          savedOrder = payload.order || payload;
          console.log("✅ Order updated in background:", savedOrder.orderNumber);
        } else {
          const createOrderResult = await createOrder(orderData as CreateOrderData);
          savedOrder = createOrderResult;
          dispatch(setActiveOrder(savedOrder));
          console.log("✅ Order created in background:", savedOrder.orderNumber);
        }

        dispatch(setHasUnsavedChangesAction(false));
        
        // Save to localStorage for resilience
        try {
          localStorage.setItem('pos_last_saved_order', JSON.stringify({
            orderId: savedOrder.id,
            orderNumber: savedOrder.orderNumber,
            timestamp: Date.now()
          }));
        } catch (e) {
          console.warn("Failed to save to localStorage:", e);
        }
      } catch (error: any) {
        console.error("❌ [handleManualSave] Background error:", error);
        
        // 🔄 ROLLBACK - Restore cart on error
        dispatch(restoreCartFromBackupAction());
        showError(error.message || "Failed to save order - cart restored");
        
        // Try to save to localStorage as backup
        try {
          localStorage.setItem('pos_failed_order', JSON.stringify({
            orderData,
            error: error.message,
            timestamp: Date.now()
          }));
          console.log("💾 Failed order saved to localStorage for recovery");
        } catch (e) {
          console.warn("Failed to save failed order to localStorage:", e);
        }
      }
    })();
  }, [cart, currentOrder, orderType, selectedTable, selectedEmployee, orderNotes, appliedDiscount, dispatch, createOrder, updateOrder, showSuccess, showError]);

  // Payment handler with optimistic UI
  const handlePayment = useCallback(async () => {
    if (cart.length === 0) {
      showError("Cannot complete payment with empty cart");
      return;
    }

    if (currentOrder?.status === "paid") {
      showError(`Order ${currentOrder.orderNumber} is already completed`);
      return;
    }

    // 🚀 INSTANT UI UPDATE - Generate optimistic receipt and clear cart immediately
    const now = new Date();
    const optimisticOrderNumber = currentOrder?.orderNumber || generatePreviewOrderNumber();
    const paymentData = {
      paymentMethod: "cash",
      paymentAmount: parseFloat(paymentAmount) || total,
      change: Math.max(0, parseFloat(paymentAmount) - total)
    };

    const optimisticReceipt: ReceiptData = {
      id: optimisticOrderNumber,
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

    // Close payment dialog and show instant success
    dispatch(setShowPaymentDialogAction(false));
    dispatch(setLastSaleDataAction(optimisticReceipt));
    dispatch(optimisticClearCartAction());
    dispatch(setShowSuccessCheckmarkAction(true));
    showSuccess(`Payment completed! 💰`);

    // Show receipt after brief animation
    setTimeout(() => {
      dispatch(setShowSuccessCheckmarkAction(false));
      dispatch(setShowReceiptDialogAction(true));
      dispatch(confirmCartClearAction());
      // Reset table selection to original state
      dispatch(setSelectedTableAction(null));
      dispatch(setOrderTypeAction("takeaway"));
    }, 1500);

    // 🔄 BACKGROUND PROCESSING - Handle actual payment
    (async () => {
      try {
        let orderId: string;
        
        // Create order if needed
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
            discountType: appliedDiscount?.type,
            discountValue: appliedDiscount?.value,
            discountReason: appliedDiscount?.reason
          };

          const newOrder = await createOrder(orderData);
          if (!newOrder || !newOrder.id) {
            throw new Error("Failed to create order - no ID returned");
          }
          orderId = newOrder.id;
        } else {
          if (!currentOrder.id) {
            throw new Error("Invalid order - missing order ID");
          }
          orderId = currentOrder.id;
        }

        // Complete payment
        const result = await dispatch(
          completeOrder({
            orderId,
            paymentData
          })
        );

        if (completeOrder.fulfilled.match(result)) {
          const responseData = result.payload as any;
          const completedOrder = responseData.order || responseData;
          
          // Update receipt with actual order number if different
          if (completedOrder.orderNumber !== optimisticOrderNumber) {
            const updatedReceipt = { ...optimisticReceipt, id: completedOrder.orderNumber };
            dispatch(setLastSaleDataAction(updatedReceipt));
          }

          console.log("✅ Payment completed in background:", completedOrder.orderNumber);
          
          // Clear order state
          clearOrder();
          
          // Save to localStorage for resilience
          try {
            localStorage.setItem('pos_last_payment', JSON.stringify({
              orderId: completedOrder.id,
              orderNumber: completedOrder.orderNumber,
              total,
              timestamp: Date.now()
            }));
          } catch (e) {
            console.warn("Failed to save to localStorage:", e);
          }
        }
      } catch (error: any) {
        console.error("❌ [handlePayment] Background error:", error);
        
        // 🔄 ROLLBACK - Restore cart and close receipt on error
        dispatch(restoreCartFromBackupAction());
        dispatch(setShowReceiptDialogAction(false));
        showError(error.message || "Payment failed - cart restored");
        
        // Save failed payment to localStorage
        try {
          localStorage.setItem('pos_failed_payment', JSON.stringify({
            cart: cart.map(item => ({ name: item.name, quantity: item.quantity, price: item.price })),
            total,
            error: error.message,
            timestamp: Date.now()
          }));
          console.log("💾 Failed payment saved to localStorage for recovery");
        } catch (e) {
          console.warn("Failed to save failed payment to localStorage:", e);
        }
      }
    })();
  }, [currentOrder, cart, paymentAmount, total, subtotal, tax, appliedDiscount, orderType, selectedTable, selectedEmployee, orderNotes, dispatch, createOrder, showSuccess, showError, clearOrder]);

  // Manual print handler
  const handleManualPrint = useCallback(() => {
    if (cart.length === 0) {
      showError("No items to print");
      return;
    }

    dispatch(setPrinterSelectionContextAction("manual_print"));
    dispatch(setShowPrinterSelectorAction(true));
  }, [cart, dispatch, showError]);

  // Printer settings handler
  const handleShowPrinterSettings = useCallback(() => {
    dispatch(setPrinterSelectionContextAction("manual_print"));
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
    dispatch(setShowDayCloseDialogAction(true));
  }, [dispatch]);

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

      dispatch(resetDayCloseState());
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
      const variantId = posItem.selectedVariant?.name ? `-variant-${posItem.selectedVariant.name}-${posItem.selectedVariant.volume}${posItem.selectedVariant.unit}` : "";
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
      startTransition(() => {
        setTimeout(() => dispatch(setIsPOSActionInProgressAction(false)), 0);
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
                    dispatch(setPaymentAmountAction(total.toString()));
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
        {showPaymentDialog && <PaymentDialog isOpen={showPaymentDialog} onClose={() => dispatch(setShowPaymentDialogAction(false))} total={total} paymentAmount={paymentAmount} onPaymentAmountChange={(amount) => dispatch(setPaymentAmountAction(amount))} onPayment={handlePayment} isLoading={isLoading} />}

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
            <POSClientOrders isOpen={showOrdersDialog} onClose={() => dispatch(setShowOrdersDialogAction(false))} onOrderSelect={onOrderSelect} onOrderStatusChange={() => {}} />
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
                  <Button onClick={() => selectedTable && handleTableSelection(selectedTable)} disabled={!selectedTable || selectedTable.status === "cleaning"} className="bg-blue-600 hover:bg-blue-700">
                    {selectedTable?.status === "opened" ? "Continue Order" : "Start Order"}
                  </Button>
                )}
              </div>
            </div>
          }
        >
          <TablesLayout onTableSelect={handleTableSelection} onClose={() => dispatch(setShowTablesLayoutAction(false))} hideHeaderFooter={false} />
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
          <Dialog open={showDayCloseDialog} onOpenChange={(open) => dispatch(setShowDayCloseDialogAction(open))}>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>Close Day</DialogTitle>
                <DialogDescription>Enter the closing cash amount and any notes for the day.</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Closing Cash Amount</label>
                  <input type="number" value={closingCash} onChange={e => dispatch(setClosingCashAction(e.target.value))} className="w-full px-3 py-2 border rounded-md" placeholder="Enter closing cash amount" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Notes (Optional)</label>
                  <textarea value={dayCloseNotes} onChange={e => dispatch(setDayCloseNotesAction(e.target.value))} className="w-full px-3 py-2 border rounded-md" rows={3} placeholder="Add any notes about the day" />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => dispatch(setShowDayCloseDialogAction(false))}>
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

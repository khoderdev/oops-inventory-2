import { ordersAPI } from "@/api/orders.api";
import { salesAPI } from "@/api/sales.api.ts.tsx";
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
import React, { useCallback, useEffect, useMemo, useRef } from "react";
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
import { setCart } from "@/store/slices/posSlice";
import {
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
  generateReceiptData as generateReceiptDataAction,
  setShowPrinterSelector,
  setHasUnsavedChanges as setHasUnsavedChangesAction,
  setOrderType as setOrderTypeAction,
  setSelectedTable as setSelectedTableAction,
  applyDiscount as applyDiscountAction
} from "@/store/slices/posSlice";
import { PerformanceMonitor } from "./PerformanceMonitor";
import PerformanceValidator from "./PerformanceValidator";

const POSClientComponent: React.FC<POSClientProps> = ({ sectionAssignments, onSaleComplete, onOrderSelect, selectedOrderForPOS, onOrderProcessed, refreshCountsRef, isDayOpen = true }) => {
  // Redux
  const dispatch = useAppDispatch();
  const {
    cart,
    orderType,
    selectedTable,
    selectedEmployee,
    currentOrder,
    hasUnsavedChanges,
    isPaymentCompleted,
    isLoading,
    error,
    successMessage,
    showSuccessCheckmark,
    showPaymentDialog,
    showReceiptDialog,
    showTablesLayout,
    showDiscountDialog,
    showNotesDialog,
    showItemNotesDialog,
    showVoidDialog,
    showOrdersDialog,
    showReportsDialog,
    showPrinterSelector,
    selectedItemForNotes,
    orderNotes,
    appliedDiscount,
    lastSaleData,
    isTableManuallySelected,
    isPOSActionInProgress,
    selectedSaleForEdit,
    editingSaleId
  } = useAppSelector(state => state.pos);

  const { foodMenuItems, beverageMenuItems, menuItemsLoading, menuItemCategories, beverageCategories, fetchMenuItems } = useMenuItems();
  const [searchTerm] = React.useState("");
  const [menuItems, setMenuItems] = React.useState<MenuItem[]>([]);
  const [stockEntries, setStockEntries] = React.useState<StockEntryWithMaterial[]>([]);
  const [isItemsGridStable, setIsItemsGridStable] = React.useState(false);
  const [isItemsGridLoading, setIsItemsGridLoading] = React.useState(true);
  // Simplified performance monitoring
  const renderCount = useRef(0);
  
  // Loading state will be managed after posItems is defined
  const [optimisticAssignments, setOptimisticAssignments] = React.useState<SectionAssignment[]>(sectionAssignments);
  const [negativeStockWarnings] = React.useState<NegativeStockWarning[]>([]);
  const [showNegativeStockDialog, setShowNegativeStockDialog] = React.useState(false);
  const [paymentAmount, setPaymentAmount] = React.useState<string>("");
  const [activeCategory, setActiveCategory] = React.useState<string>("all");

  // Minimal performance tracking
  if (process.env.NODE_ENV === "development") {
    renderCount.current += 1;
  }

  // Stable callback references to prevent unnecessary re-renders
  const handleCategoryChange = useCallback((category: string) => {
    setActiveCategory(category);
  }, []);
  const [tables, setTables] = React.useState<Table[]>([]);
  const [showUnsavedDialog, setShowUnsavedDialog] = React.useState(false);
  const [printedTables, setPrintedTables] = React.useState<string[]>([]);
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
  const [activeView, setActiveView] = React.useState<"cart" | "products">("products");

  // Build categories map from context categories with ultra-stable memoization
  const categoriesMap = useMemo(() => {
    const categoryMap = new Map<number, string>();

    // Only process if we have actual categories data
    if (menuItemCategories?.length > 0) {
      menuItemCategories
        .filter(c => c?.isActive)
        .forEach(c => {
          if (c?.id && c?.name) categoryMap.set(c.id, c.name);
        });
    }
    if (beverageCategories?.length > 0) {
      beverageCategories
        .filter(c => c?.isActive)
        .forEach(c => {
          if (c?.id && c?.name) categoryMap.set(c.id, c.name);
        });
    }

    return categoryMap;
  }, [
    menuItemCategories,
    beverageCategories
  ]);

  // Memoized helper function for variants transformation to prevent recreation
  const transformVariants = useCallback(
    (
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
    },
    []
  );

  // Memoized POS items with ultra-optimized dependencies to prevent cascade re-renders
  const posItems = useMemo(() => {
    // Early return for loading state without side effects
    if (menuItemsLoading) {
      return [];
    }

    // Only proceed if we have menu items and categories are ready
    const allMenuItems = [...(foodMenuItems || []), ...(beverageMenuItems || [])];
    if (allMenuItems.length === 0) {
      return [];
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

    return transformedItems;
  }, [
    foodMenuItems,
    beverageMenuItems,
    categoriesMap,
    transformVariants
  ]);

  // Filter posItems based on activeCategory with ultra-stable reference
  const filteredPosItems = useMemo(() => {
    // Early return for "all" category to prevent unnecessary filtering
    if (activeCategory === "all") {
      return posItems;
    }

    return posItems.filter(item => {
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

  // Create categories array from posItems with ultra-stable reference
  const categories = useMemo(() => {
    const uniqueCategories = new Set<string>(["all"]);

    // Use for-loop for better performance than forEach
    for (let i = 0; i < posItems.length; i++) {
      const item = posItems[i];
      if (!item?.category) continue;

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

    // Convert to sorted array with consistent ordering
    const categoriesArray = Array.from(uniqueCategories);
    categoriesArray.sort((a, b) => {
      if (a === "all") return -1;
      if (b === "all") return 1;
      return a.localeCompare(b);
    });

    return categoriesArray;
  }, [posItems, categoriesMap]);

  // Manage loading state with minimal dependencies to prevent render loops
  useEffect(() => {
    if (menuItemsLoading) {
      setIsItemsGridLoading(true);
    } else {
      // Use a small delay to ensure smooth transition without blocking
      const timer = setTimeout(() => {
        setIsItemsGridLoading(false);
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [menuItemsLoading]); // Only depend on loading state, not data

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

  // Create a stable cart for rendering with minimal dependencies
  const stableCart = useMemo(() => {
    return cart.length > 0 ? [...cart] : [];
  }, [cart]);

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

  const mapOrderItemsToCart = (order: Order | Record<string, any>): POSCartItem[] => {
    // Handle case where order might have a nested data structure
    const actualOrder = order && typeof order === "object" && "data" in order && order.data ? (order.data as Order) : (order as Order);

    if (!actualOrder || !actualOrder.items) {
      console.error("❌ Order or order.items is missing:", actualOrder);
      return [];
    }

    console.log("🔍 Mapping order items to cart. Order structure:", JSON.stringify(actualOrder, null, 2));
    console.log("🔍 Order items length:", actualOrder.items?.length);

    // Check if items is actually an array
    if (!Array.isArray(actualOrder.items)) {
      console.error("❌ order.items is not an array:", actualOrder.items);
      return [];
    }

    return actualOrder.items
      .map((item: any, index: number) => {
        console.log("🔍 Processing item:", item);

        if (item.menuItem) {
          console.log("📋 Creating cart item for menu item:", item.menuItem.name);
          return {
            id: `current-${actualOrder.id}-menu-${item.menuItem.id}-${index}`,
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
        } else if (item.material) {
          console.log("📋 Creating cart item for material:", item.material.name);
          return {
            id: `current-${actualOrder.id}-material-${item.material.id}-${index}`,
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
        } else {
          console.error("❌ Item has neither menuItem nor material:", item);
          return null;
        }
      })
      .filter(Boolean) as POSCartItem[];
  };

  const handleOrderSelect = useCallback(
    async (order: any) => {
      try {
        console.log("🔄 handleOrderSelect called with order:", order);
        dispatch(setIsLoadingAction(true));
        dispatch(setErrorAction(null));

        // Reset cart and order state
        dispatch(setCart([])); // Using directly imported setCart
        dispatch(posActions.clearCart()); // This will reset hasUnsavedChanges to false
        dispatch(posActions.removeDiscount()); // This will set appliedDiscount to null

        // Check if this is from sales history
        const isFromSalesHistory = order.fromSalesHistory === true;
        console.log("🏷️ Is from sales history:", isFromSalesHistory, "Order ID:", order.id);

        // DIRECT APPROACH: If this is from sales history, we'll create cart items directly
        // from the order without waiting for loadOrder
        if (isFromSalesHistory && order.items) {
          console.log("🚀 DIRECT APPROACH: Creating cart items directly from order");
          console.log("📦 Order items:", order.items);

          // Create cart items directly from the order
          const directCartItems: POSCartItem[] = [];

          // Process each item in the order
          order.items.forEach((item: any, index: number) => {
            console.log("🔍 Processing item directly:", item);

            if (item.menuItem) {
              directCartItems.push({
                id: `direct-${order.id}-menu-${item.menuItem.id}-${index}`,
                name: item.menuItem.name,
                price: item.unitPrice || item.menuItem.price,
                quantity: item.quantity,
                type: "menu_item" as const,
                menuItemId: item.menuItem.id.toString(),
                originalItem: item.menuItem,
                stockEntryId: undefined,
                orderItemId: item.id?.toString?.() || item.id,
                notes: item.notes || undefined
              });
              console.log("📋 Created direct cart item for menu item:", item.menuItem.name);
            } else if (item.material) {
              directCartItems.push({
                id: `direct-${order.id}-material-${item.material.id}-${index}`,
                name: item.material.name,
                price: parseFloat(item.unitPrice),
                quantity: item.quantity,
                type: "material" as const,
                materialId: item.material.id.toString(),
                stockEntryId: undefined,
                originalItem: item.material,
                orderItemId: item.id?.toString?.() || item.id,
                notes: item.notes || undefined
              });
              console.log("📋 Created direct cart item for material:", item.material.name);
            }
          });

          // If we created any cart items, set them
          if (directCartItems.length > 0) {
            console.log("🛒 Setting cart with direct items:", directCartItems);
            dispatch(setCart(directCartItems));
            dispatch(setHasUnsavedChangesAction(true));
            processedOrderRef.current = order.id.toString();

            // Also set order type, table, etc.
            dispatch(setOrderTypeAction(order.orderType));
            if (order.orderType === "table" && order.tableId) {
              dispatch(setSelectedTableAction(tables.find(t => t.id === order.tableId)));
            }
            if (order.discountAmount && parseFloat(order.discountAmount.toString()) > 0) {
              dispatch(
                applyDiscountAction({
                  type: (order.discountType as "percentage" | "fixed") || "fixed",
                  value: parseFloat(order.discountValue?.toString() || "0"),
                  reason: order.discountReason || undefined
                })
              );
            }
          }
        }

        // Still load the order through the API for consistency
        if (loadOrder) {
          const loadedOrder = await loadOrder(order.id);
          console.log("📥 Order loaded - FULL STRUCTURE:", JSON.stringify(loadedOrder, null, 2));

          // If we haven't already populated the cart directly, do it now
          if (!processedOrderRef.current || processedOrderRef.current !== order.id.toString()) {
            console.log("🛒 Populating cart from loaded order");

            // Normalize the order structure
            let adaptedOrder = loadedOrder;
            if (!Array.isArray(loadedOrder?.items)) {
              if (loadedOrder && typeof loadedOrder === "object" && "data" in loadedOrder && loadedOrder.data && typeof loadedOrder.data === "object" && "items" in loadedOrder.data && Array.isArray(loadedOrder.data.items)) {
                adaptedOrder = loadedOrder.data as Order;
              }
            }

            // Create cart items
            const cartItems = mapOrderItemsToCart(adaptedOrder);

            if (cartItems.length > 0) {
              console.log("🛒 Setting cart with API-loaded items:", cartItems);
              dispatch(setCart(cartItems));
              dispatch(setHasUnsavedChangesAction(true));

              // Set order properties
              dispatch(setOrderTypeAction(adaptedOrder.orderType));
              if (adaptedOrder.orderType === "table" && adaptedOrder.tableId) {
                dispatch(setSelectedTableAction(tables.find(t => t.id === adaptedOrder.tableId)));
              }
              if (adaptedOrder.discountAmount && parseFloat(adaptedOrder.discountAmount.toString()) > 0) {
                dispatch(
                  applyDiscountAction({
                    type: (adaptedOrder.discountType as "percentage" | "fixed") || "fixed",
                    value: parseFloat(adaptedOrder.discountValue?.toString() || "0"),
                    reason: adaptedOrder.discountReason || undefined
                  })
                );
              }

              // Mark as processed
              processedOrderRef.current = order.id.toString();
            }
          }

          return loadedOrder;
        } else {
          console.error("❌ loadOrder function is not available!");
          return null;
        }
      } catch (error) {
        console.error("❌ Failed to load order:", error);
        showError("Failed to load order for editing. Please try again.");
        throw error;
      } finally {
        dispatch(setIsLoadingAction(false));
      }
    },
    [loadOrder, showError, tables]
  );

  useEffect(() => {
    if (selectedOrderForPOS) {
      console.log("🔄 selectedOrderForPOS effect triggered:", selectedOrderForPOS);
      console.log("📊 Current state - cart length:", cart.length, "processedOrderRef:", processedOrderRef.current);

      // Use a ref to track if we've already processed this order
      if (processedOrderRef.current === selectedOrderForPOS.id.toString() && cart.length > 0) {
        console.log("🛑 Already processed this order with items, skipping");
        return;
      }

      // For sales history orders, we need special handling
      const isFromSalesHistory = selectedOrderForPOS.fromSalesHistory === true;

      if (isFromSalesHistory) {
        console.log("🚨 SALES HISTORY ORDER DETECTED:", selectedOrderForPOS.id);
        console.log("📦 Order structure:", JSON.stringify(selectedOrderForPOS, null, 2));

        // EMERGENCY DIRECT POPULATION - If the order has items, populate cart directly
        if (selectedOrderForPOS.items && Array.isArray(selectedOrderForPOS.items) && selectedOrderForPOS.items.length > 0) {
          console.log("🚒 EMERGENCY: Directly populating cart from selectedOrderForPOS");

          const emergencyCartItems: POSCartItem[] = [];

          selectedOrderForPOS.items.forEach((item: any, index: number) => {
            if (item.menuItem) {
              emergencyCartItems.push({
                id: `emergency-${selectedOrderForPOS.id}-menu-${item.menuItem.id}-${index}`,
                name: item.menuItem.name,
                price: item.unitPrice || item.menuItem.price,
                quantity: item.quantity,
                type: "menu_item" as const,
                menuItemId: item.menuItem.id.toString(),
                originalItem: item.menuItem,
                stockEntryId: undefined,
                orderItemId: item.id?.toString?.() || item.id,
                notes: item.notes || undefined
              });
            } else if (item.material) {
              emergencyCartItems.push({
                id: `emergency-${selectedOrderForPOS.id}-material-${item.material.id}-${index}`,
                name: item.material.name,
                price: parseFloat(item.unitPrice),
                quantity: item.quantity,
                type: "material" as const,
                materialId: item.material.id.toString(),
                stockEntryId: undefined,
                originalItem: item.material,
                orderItemId: item.id?.toString?.() || item.id,
                notes: item.notes || undefined
              });
            }
          });

          if (emergencyCartItems.length > 0) {
            console.log("🚒 EMERGENCY: Setting cart with", emergencyCartItems.length, "items");
            dispatch(setCart(emergencyCartItems));
            dispatch(setHasUnsavedChangesAction(true));
            processedOrderRef.current = selectedOrderForPOS.id.toString();

            // Also set order type, table, etc.
            dispatch(setOrderTypeAction(selectedOrderForPOS.orderType));
            if (selectedOrderForPOS.orderType === "table" && selectedOrderForPOS.tableId) {
              dispatch(setSelectedTableAction(tables.find(t => t.id === selectedOrderForPOS.tableId)));
            }
            if (selectedOrderForPOS.discountAmount && parseFloat(selectedOrderForPOS.discountAmount.toString()) > 0) {
              dispatch(
                applyDiscountAction({
                  type: (selectedOrderForPOS.discountType as "percentage" | "fixed") || "fixed",
                  value: parseFloat(selectedOrderForPOS.discountValue?.toString() || "0"),
                  reason: selectedOrderForPOS.discountReason || undefined
                })
              );
            }

            // Still call handleOrderSelect to ensure backend state is consistent
            handleOrderSelect(selectedOrderForPOS)
              .then(() => {
                if (onOrderProcessed) onOrderProcessed();
              })
              .catch(error => {
                console.error("❌ Failed to process order (but cart was populated):", error);
                if (onOrderProcessed) onOrderProcessed();
              });

            return;
          }
        }
      }

      // Standard flow if emergency population didn't happen
      handleOrderSelect(selectedOrderForPOS)
        .then(loadedOrder => {
          if (onOrderProcessed) {
            onOrderProcessed();
          }

          // Final check - if cart is still empty, try one last approach
          if (cart.length === 0 && loadedOrder) {
            console.log("🆘 LAST RESORT: Cart still empty after all attempts, trying final approach");

            // Try to extract items from the loaded order or current order
            const finalOrder = loadedOrder || currentOrder;
            if (finalOrder && finalOrder.items && Array.isArray(finalOrder.items)) {
              const lastResortItems = mapOrderItemsToCart(finalOrder);
              if (lastResortItems.length > 0) {
                console.log("🆘 LAST RESORT: Setting cart with", lastResortItems.length, "items");
                dispatch(setCart(lastResortItems));
                dispatch(setHasUnsavedChangesAction(true));
              }
            }

            // Always mark as processed to prevent infinite loops
            processedOrderRef.current = selectedOrderForPOS.id.toString();
          }
        })
        .catch(error => {
          console.error("❌ Failed to process order:", error);
          if (onOrderProcessed) {
            onOrderProcessed();
          }
        });
    }
  }, [selectedOrderForPOS, handleOrderSelect, onOrderProcessed, currentOrder, cart.length, tables]);

  // Refresh all counts
  const refreshAllCounts = useCallback(async () => {
    await Promise.all([fetchMenuItems(), fetchTablesData(), refreshCountsRef?.current ? refreshCountsRef.current() : Promise.resolve(), fetchIncompleteOrdersCount()]);
  }, [fetchMenuItems, fetchTablesData, refreshCountsRef, fetchIncompleteOrdersCount]);

  // Handler functions
  const handleCloseOrdersDialog = useCallback(() => {
    dispatch(setShowOrdersDialogAction(false));
  }, [dispatch]);

  // Panel resizing functionality
  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      setIsResizing(true);

      const startX = e.clientX;
      const startWidth = leftPanelWidth;
      const containerWidth = containerRef.current?.offsetWidth || 0;

      const handleMouseMove = (moveEvent: MouseEvent) => {
        if (!isResizing) return;

        const deltaX = moveEvent.clientX - startX;
        const newWidthPercent = Math.max(20, Math.min(80, startWidth + (deltaX / containerWidth) * 100));

        setLeftPanelWidth(newWidthPercent);
        setRightPanelPixelWidth(containerWidth - (containerWidth * newWidthPercent) / 100);
      };

      const handleMouseUp = () => {
        setIsResizing(false);
        document.removeEventListener("mousemove", handleMouseMove);
        document.removeEventListener("mouseup", handleMouseUp);
      };

      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
    },
    [isResizing, leftPanelWidth, setIsResizing, setLeftPanelWidth, setRightPanelPixelWidth]
  );

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
    dispatch(setOrderTypeAction("takeaway" as OrderType));
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
      dispatch(setOrderTypeAction("employees" as OrderType));

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
        // Set hasUnsavedChanges to false
        dispatch(setHasUnsavedChangesAction(false));
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
    dispatch(setOrderTypeAction("takeaway" as OrderType));
    dispatch(setSelectedTableAction(undefined));
    dispatch(setSelectedEmployeeAction(undefined));
    dispatch(removeDiscountAction());
    if (clearOrder) {
      clearOrder();
    }
    OrderPersistence.clearCurrentOrder();
    // Set hasUnsavedChanges to false
    dispatch(setHasUnsavedChangesAction(false));
    dispatch(setShowTablesLayoutAction(false));
    setPaymentAmount("");
    dispatch(setErrorAction(null));
    dispatch(setSuccessMessageAction(null));
  }, [clearOrder, dispatch]);

  // Add missing functions

  // Handle payment function
  const handlePayment = useCallback(async () => {
    console.log("🚀 [PAYMENT_DEBUG] handlePayment function called!");
    console.log("🚀 [PAYMENT_DEBUG] cart.length:", cart.length);
    console.log("🚀 [PAYMENT_DEBUG] currentOrder:", currentOrder);

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
      // setShouldAutoPrint(hasSavedPrinter()); // FIXME: This function doesn't exist
      dispatch(setShowSuccessCheckmarkAction(true));

      // CRITICAL: Mark order as completed immediately to prevent reloading
      if (currentOrder?.id) {
        completedOrdersRef.current.add(currentOrder.id.toString());
      }

      // Clear UI state immediately for instant feedback
      dispatch(removeDiscountAction());
      dispatch(setOrderNotesAction(""));
      dispatch(setHasUnsavedChangesAction(false)); // Set hasUnsavedChanges to false
      processedOrderRef.current = null;
      OrderPersistence.clearCurrentOrder();

      // Start cart clearing animation immediately
      setTimeout(() => {
        clearCartWithAnimation();
        setTimeout(() => dispatch(setShowSuccessCheckmarkAction(false)), 2000);
      }, 100);

      // BACKGROUND PROCESSING - Handle actual API calls without blocking UI
      console.log("🚀 [PAYMENT_DEBUG] About to start background processing");

      const backgroundProcessing = async () => {
        try {
          console.log("🔄 [PAYMENT_DEBUG] Background processing started");
          console.log("🔄 [PAYMENT_DEBUG] currentOrder exists:", !!currentOrder);
          if (currentOrder) {
            console.log("🔄 [PAYMENT_DEBUG] currentOrder details:", {
              id: currentOrder.id,
              status: currentOrder.status,
              orderNumber: currentOrder.orderNumber
            });
          }

          let orderToComplete = currentOrder;

          // Create order if needed
          if (!currentOrder) {
            console.log("🔄 [PAYMENT_DEBUG] No currentOrder found, creating new order");
            const orderData = {
              orderType,
              tableId: selectedTable?.id,
              employeeId: selectedEmployee?.id ? Number(selectedEmployee.id) : undefined,
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
            console.log("🔄 [PAYMENT_DEBUG] Calling createOrder with data:", orderData);
            const createOrderResponse = await createOrder(orderData);
            console.log("✅ [PAYMENT_DEBUG] createOrder response:", createOrderResponse);
            orderToComplete = createOrderResponse && typeof createOrderResponse === "object" && "order" in createOrderResponse ? (createOrderResponse as any).order : createOrderResponse;
            console.log("✅ [PAYMENT_DEBUG] orderToComplete after createOrder:", orderToComplete);
          } else {
            console.log("🔄 [PAYMENT_DEBUG] Using existing currentOrder, skipping createOrder");
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
            dispatch(setLastSaleDataAction(updatedReceiptData));
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

  // Handle manual save function
  const handleManualSave = useCallback(async () => {
    if (cart.length === 0) {
      showError("Cannot save empty order");
      return;
    }
    const isEditMode = !!editingSaleId;
    if (isEditMode) {
    }
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
        dispatch(setOrderTypeAction("takeaway" as OrderType));
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
            // Prepare update data
            const updateData: UpdateOrderData = {
              orderType,
              tableId: selectedTable?.id,
              employeeId: selectedEmployee?.id ? String(selectedEmployee.id) : undefined,
              items: cart.map(item => {
                return {
                  id: item.orderItemId || item.id, // Use existing orderItemId if available, otherwise use cart item id
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

            // Determine if we're dealing with a sale or an order
            let isSaleUpdate = false;
            let orderId;
            let saleId;

            // If we have a current order loaded, use its ID
            if (currentOrder?.id) {
              orderId = currentOrder.id;
            }
            // If we're editing a sale and the selectedSaleForEdit has an orderId property
            else if (selectedSaleForEdit?.orderId) {
              // We have both the sale ID and order ID
              orderId = selectedSaleForEdit.orderId;
              saleId = selectedSaleForEdit.id;
              isSaleUpdate = true;
            }
            // If we have an editingSaleId but no orderId mapping
            else if (currentEditingSaleId) {
              // This is likely a sale ID, not an order ID
              saleId = currentEditingSaleId;
              isSaleUpdate = true;
            }
            // No valid ID found
            else {
              throw new Error("No valid ID found for update operation");
            }
            if (isSaleUpdate) {
            }

            try {
              // For sales editing, use the appropriate API based on whether it's a sale or order
              if (currentEditingSaleId && !currentOrder?.id) {
                if (isSaleUpdate) {
                  // Convert updateData to SaleRecord format
                  const saleData = {
                    id: saleId,
                    items: updateData.items
                      .filter(item => item.type === "material")
                      .map(item => ({
                        materialId: item.materialId,
                        materialName: item.name,
                        quantity: item.quantity,
                        unitPrice: item.unitPrice,
                        totalPrice: item.totalPrice
                      })),
                    menuItems: updateData.items
                      .filter(item => item.type === "menu_item")
                      .map(item => ({
                        menuItemId: item.menuItemId,
                        menuItemName: item.name,
                        quantity: item.quantity,
                        unitPrice: item.unitPrice,
                        totalPrice: item.totalPrice
                      })),
                    section: selectedTable ? { id: selectedTable.id, name: selectedTable.name } : undefined,
                    notes: updateData.notes,
                    discountType: updateData.discountType,
                    discountValue: updateData.discountValue,
                    discountAmount: updateData.discountAmount,
                    totalAmount: total
                  };
                  const response = await salesAPI.updateSale(saleId, saleData as any);
                  savedOrder = response.data || response;
                } else {
                  const response = await ordersAPI.updateOrder(orderId, updateData);
                  savedOrder = response.data;
                }
              } else {
                savedOrder = await updateOrder(orderId, updateData);
              }
            } catch (error) {
              console.error(`❌ Error updating order/sale:`, error);
              throw error;
            }
            showSuccess("Order updated successfully");
          } else {
            // Create new order
            const createData = {
              orderType,
              tableId: selectedTable?.id,
              employeeId: selectedEmployee?.id ? Number(selectedEmployee.id) : undefined,
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
      return;
    }
    // Skip if there's a POS action in progress
    if (isPOSActionInProgress) {
      return;
    }
    // Load selected order when selectedOrderForPOS changes
    if (selectedOrderForPOS && !isTableManuallySelected) {
      const orderId = selectedOrderForPOS.id;
      if (completedOrdersRef.current.has(orderId.toString())) {
        return;
      }
      if (processedOrderRef.current === orderId) {
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

    const loadSaleFromHistory = async () => {
      // Only proceed if we have a sale to edit and it's different from the last one we processed
      if (selectedSaleForEdit && (!processedSaleIdRef.current || processedSaleIdRef.current !== selectedSaleForEdit.id.toString())) {
        // Store the current sale ID to prevent duplicate processing
        processedSaleIdRef.current = selectedSaleForEdit.id.toString();
        // Store the sale ID for later use when saving
        if (selectedSaleForEdit.id) {
          dispatch(posActions.setEditingSaleId(selectedSaleForEdit.id.toString()));
        }
        // Clear current cart and state
        dispatch(clearCartAction());
        dispatch(removeDiscountAction());
        dispatch(setOrderNotesAction(""));

        if (clearOrder) {
          clearOrder();
        }
        // Set order type and related info
        // Ensure orderType is a valid OrderType value
        const rawOrderType = selectedSaleForEdit.order?.orderType || "takeaway";
        // Validate that it's a valid OrderType
        const validOrderTypes: OrderType[] = ["delivery", "takeaway", "table", "employees", "bar"];
        const orderType: OrderType = validOrderTypes.includes(rawOrderType as OrderType) ? (rawOrderType as OrderType) : "takeaway";
        // Get tableId and employeeId from order if available
        // Use type assertion to access properties that might not be in the type definition
        const tableId = (selectedSaleForEdit.order as any)?.tableId;
        const employeeId = (selectedSaleForEdit.order as any)?.employeeId;

        if (orderType === "table" && tableId) {
          try {
            // Try to fetch the table info
            const tableResponse = await tablesAPI.getTable(tableId);
            const table = tableResponse.data;
            if (table) {
              dispatch(setSelectedTableAction(table));
              dispatch(setOrderTypeAction("table" as OrderType));
            }
          } catch (error) {
            console.error("Failed to load table for sale:", error);
            // orderType is already validated as OrderType
            dispatch(setOrderTypeAction(orderType));
          }
        } else if (orderType === "employees" && employeeId) {
          try {
            // Try to fetch employee info
            const employeeResponse = await fetch(`/api/employees/${employeeId}`).then(res => res.json());
            if (employeeResponse.data) {
              dispatch(setSelectedEmployeeAction(employeeResponse.data));
              dispatch(setOrderTypeAction("employees" as OrderType));
            }
          } catch (error) {
            console.error("Failed to load employee for sale:", error);
            // orderType is already validated as OrderType
            dispatch(setOrderTypeAction(orderType));
          }
        } else {
          // orderType is already validated as OrderType
          dispatch(setOrderTypeAction(orderType));
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
        // Get discount info from order if available
        const discountAmount = selectedSaleForEdit.order?.discountAmount || selectedSaleForEdit.discountAmount;
        const discountType = selectedSaleForEdit.order?.discountType || selectedSaleForEdit.discountType;
        const discountValue = selectedSaleForEdit.order?.discountValue || selectedSaleForEdit.discountValue;
        const discountReason = selectedSaleForEdit.order?.discountReason || selectedSaleForEdit.discountReason;

        if (discountAmount && parseFloat(discountAmount.toString()) > 0) {
          dispatch(
            applyDiscountAction({
              type: (discountType as "percentage" | "fixed") || "fixed",
              value: parseFloat(discountValue?.toString() || "0"),
              reason: discountReason || "From history"
            })
          );
        }

        // Set notes if present
        // Get notes from order if available
        const notes = selectedSaleForEdit.order?.notes || selectedSaleForEdit.notes;
        if (notes) {
          dispatch(setOrderNotesAction(notes));
        }
        // Clear the selected sale to prevent reloading
        // The editingSaleId will be preserved by our updated reducer
        dispatch(posActions.setSelectedSaleForEdit(null));
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
        routerStateProcessedRef.current = true; // Mark as processed
        // Process this order if it hasn't been processed yet
        if (!processedOrderRef.current || processedOrderRef.current !== routerState.selectedOrderForPOS.id.toString()) {
          // DIRECT CART POPULATION - Most aggressive approach
          const order = routerState.selectedOrderForPOS;
          if (order.items && Array.isArray(order.items) && order.items.length > 0) {
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
            dispatch(setOrderTypeAction(order.orderType as OrderType));
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

    // Add table to printed tables if this is a table order
    if (selectedTable && orderType === "table") {
      setPrintedTables(prev => {
        const tableId = selectedTable.id.toString();
        if (!prev.includes(tableId)) {
          return [...prev, tableId];
        }
        return prev;
      });
    }

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

  // Add to cart handler - optimized for performance
  const addToCart = useCallback(
    (posItem: POSItem) => {
      // Performance tracking for cart operations
      if (process.env.NODE_ENV === "development") {
        console.log("🛒 addToCart called - tracking performance");
      }

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

  // Ultra-stable callback wrapper for addToCart to prevent unnecessary re-renders
  const handleAddToCart = useCallback(
    (posItem: POSItem) => {
      // Performance validation - ensure we're not re-rendering excessively
      if (process.env.NODE_ENV === "development" && renderCount.current > 15) {
        console.warn("⚠️ handleAddToCart called during high render count:", renderCount.current);
      }
      addToCart(posItem);
    },
    [addToCart]
  );

  // Update cart quantity handler - performance optimized
  const updateCartQuantity = useCallback(
    (cartId: string, newQuantity: number) => {
      // Performance tracking
      if (process.env.NODE_ENV === "development") {
        console.log("🔢 updateCartQuantity called - performance tracking");
      }

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
      dispatch(setOrderTypeAction("table" as OrderType));
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
    <>
      <PerformanceValidator componentName="POSClient" renderCount={20} showAlerts={process.env.NODE_ENV === "development"} />
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
                    <Button variant="outline" size="sm" onClick={() => dispatch(setShowDiscountDialogAction(true))} className="text-xs p-2" disabled={currentOrder?.status === "paid" || currentOrder?.status === "served"}>
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
                    <Button variant="outline" size="sm" onClick={() => dispatch(setShowDiscountDialogAction(true))} className="text-xs px-2 py-1 h-7" disabled={currentOrder?.status === "paid" || currentOrder?.status === "served"}>
                      <DollarSign className="w-3 h-3" />
                      Discount
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => dispatch(setShowNotesDialogAction(true))} className="text-xs px-2 py-1 h-7 relative" disabled={currentOrder?.status === "paid" || currentOrder?.status === "served"}>
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
                  dispatch(setShowPaymentDialogAction(true));
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
                    dispatch(setShowPaymentDialogAction(true));
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
              <CategoryTabs categories={categories} activeCategory={activeCategory} onCategoryChange={handleCategoryChange} />
            </div>

            {/* Product Grid - Scrollable */}
            <div className="flex-1 min-h-0 !bg-gray-50 p-2">
              {/* ItemsGrid with stable props to prevent unnecessary re-renders */}
              <ItemsGrid posItems={filteredPosItems} onAddToCart={handleAddToCart} rightPanelPixelWidth={rightPanelPixelWidth} isLoading={isItemsGridLoading} />
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
      <PaymentDialog isOpen={showPaymentDialog} onClose={() => dispatch(setShowPaymentDialogAction(false))} total={total} paymentAmount={paymentAmount} onPaymentAmountChange={setPaymentAmount} onPayment={handlePayment} isLoading={isLoading} />

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
      {showReceiptDialog && lastSaleData && <ReceiptPrinter isOpen={showReceiptDialog} onClose={() => dispatch(setShowReceiptDialogAction(false))} receiptData={lastSaleData} autoPrint={false} />}

      {/* Discount Dialog */}
      <DiscountDialog isOpen={showDiscountDialog} onClose={() => dispatch(setShowDiscountDialogAction(false))} onDiscountAmountChange={handleDiscountAmountChange} onDiscount={() => {}} orderSubtotal={subtotal} onApplyDiscount={handleApplyDiscount} />

      {/* Payment Dialog */}
      <PaymentDialog isOpen={showPaymentDialog} onClose={() => dispatch(setShowPaymentDialogAction(false))} total={total} paymentAmount={paymentAmount} onPaymentAmountChange={setPaymentAmount} onPayment={handlePayment} isLoading={isLoading} />

      {/* Void Order Dialog */}
      <VoidOrderDialog isOpen={showVoidDialog} onClose={() => dispatch(setShowVoidDialogAction(false))} onConfirm={handleConfirmVoid} order={currentOrder} isLoading={orderLoading} />

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
        <POSClientOrders isOpen={showOrdersDialog} onClose={handleCloseOrdersDialog} onOrderSelect={handleOrderSelectCallback} onOrderStatusChange={fetchIncompleteOrdersCount} />
      </div>

      {/* Tables Layout Dialog */}
      {showTablesLayout && (
        <Dialog open={showTablesLayout} onOpenChange={open => dispatch(setShowTablesLayoutAction(open))}>
          <DialogContent className="w-screen h- max-w-none max-h-none m-0 p-0 !z-50 bg-white overflow-hidden">
            <DialogTitle className="sr-only">Tables Layout</DialogTitle>
            <DialogDescription className="sr-only">Manage restaurant table layout and assignments</DialogDescription>
            <div className="w-full h-full flex flex-col overflow-hidden">
              <TablesLayout tables={tables} selectedTable={selectedTable} onTableSelect={handleTableSelection} onClose={handleCloseTablesLayout} tableOrders={tableOrders} printedTables={printedTables} />
            </div>
          </DialogContent>
        </Dialog>
      )}

      <Dialog open={showReportsDialog} onOpenChange={open => dispatch(setShowReportsDialogAction(open))}>
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
      <NotesDialog isOpen={showNotesDialog} onClose={() => dispatch(setShowNotesDialogAction(false))} notes={orderNotes} onNotesChange={notes => dispatch(setOrderNotesAction(notes))} />

      {/* Item Notes Dialog */}
      <ItemNotesDialog key={selectedItemForNotes?.id || "no-item"} isOpen={showItemNotesDialog} onClose={() => dispatch(setShowItemNotesDialogAction(false))} item={selectedItemForNotes} onNotesChange={handleItemNotesChange} />
    </>
  );
};

export const POSClient = React.memo(POSClientComponent, (prevProps, nextProps) => {
  return prevProps.isDayOpen === nextProps.isDayOpen && prevProps.sectionAssignments === nextProps.sectionAssignments && prevProps.selectedOrderForPOS === nextProps.selectedOrderForPOS && prevProps.onSaleComplete === nextProps.onSaleComplete && prevProps.onOrderSelect === nextProps.onOrderSelect && prevProps.onOrderProcessed === nextProps.onOrderProcessed && prevProps.refreshCountsRef === nextProps.refreshCountsRef;
});

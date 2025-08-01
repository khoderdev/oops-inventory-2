import { menuAPI } from "@/api/menu.api.ts.tsx";
import { ordersAPI } from "@/api/orders.api";
import { posAPI } from "@/api/pos.api.ts";
import { stockAPI } from "@/api/stock.api.ts.tsx";
import { tablesAPI } from "@/api/tables.api";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useOrderManagement } from "@/hooks/useOrderManagement";
import { Employee, EmployeeDepartment } from "@/types/employee";
import { MenuItem, NegativeStockWarning, POSCartItem, POSClientProps, POSItem, ReceiptData, SaleResponse, SectionAssignment, StockEntryWithMaterial, Table } from "@/types/inventory";
import { OrderSummary as OrderSummaryType, OrderType } from "@/types/orders";
import { generatePreviewOrderNumber } from "@/utils/orderNumberGenerator";
import { OrderPersistence } from "@/utils/orderPersistence";
import { AlertCircle, AlertTriangle, Check, CheckCircle, DollarSign, FileText, Trash2 } from "lucide-react";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { ReportGenerator } from "../analytics/ReportGenerator";
import { ActionBar } from "./ActionBar";
import { CategoryTabs } from "./CategoryTabs";
import { DiscountDialog } from "./DiscountDialog";
import { OrderItemsList } from "./OrderItemsList";
import { OrderSummary } from "./OrderSummary";
import { PaymentDialog } from "./PaymentDialog";
import { POSClientOrders } from "./POSClientOrders";
import { ProductGrid } from "./ProductGrid";
import { ReceiptPrinter } from "./ReceiptPrinter";
import { TablesLayout } from "./TablesLayout";
import { VoidOrderDialog } from "./VoidOrderDialog";

export const POSClient: React.FC<POSClientProps> = ({ sectionAssignments, onSaleComplete, onOrderSelect, selectedOrderForPOS, onOrderProcessed }) => {
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
  const [showDiscountDialog, setShowDiscountDialog] = useState(false);
  const [discountAmount, setDiscountAmount] = useState<number>(0);
  const [appliedDiscount, setAppliedDiscount] = useState<{
    type: "percentage" | "fixed";
    value: number;
    amount: number;
    reason?: string;
  } | null>(null);

  // Stable callbacks to prevent POSClientOrders re-renders
  const handleCloseOrdersDialog = useCallback(() => {
    setShowOrdersDialog(false);
  }, []);

  const handleOrderSelectCallback = useCallback(
    (order: any) => {
      if (onOrderSelect) {
        onOrderSelect(order);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [] // onOrderSelect is a stable prop, no need to include in deps
  );

  // Order management hook
  const { currentOrder, isLoading: orderLoading, error: orderError, createOrder, loadOrder, updateOrder, voidOrder, clearOrder } = useOrderManagement();

  // Helper functions
  const showError = useCallback((message: string) => {
    setError(message);
    if (errorTimeoutRef.current) clearTimeout(errorTimeoutRef.current);
    errorTimeoutRef.current = setTimeout(() => setError(null), 5000);
  }, []);

  const showSuccess = useCallback((message: string) => {
    setSuccessMessage(message);
    if (successTimeoutRef.current) clearTimeout(successTimeoutRef.current);
    successTimeoutRef.current = setTimeout(() => setSuccessMessage(null), 3000);
  }, []);

  // Clear cart with animation
  const clearCartWithAnimation = useCallback(() => {
    // Show success checkmark animation
    setShowSuccessCheckmark(true);

    // Clear cart immediately for instant feedback
    setCart([]);

    // Hide animation after 1500ms
    if (checkmarkTimeoutRef.current) {
      clearTimeout(checkmarkTimeoutRef.current);
    }
    checkmarkTimeoutRef.current = setTimeout(() => {
      setShowSuccessCheckmark(false);
    }, 1500);
  }, []);

  // Helper function to automatically select TAKE AWAY after order actions
  const resetToTakeaway = useCallback(() => {
    setOrderType("takeaway");
    setSelectedTable(undefined);
    setShowTablesLayout(false);
  }, []);

  // Clear cart without animation (for trash button)
  const clearCart = useCallback(() => {
    setCart([]);
    setHasUnsavedChanges(false);
  }, []);

  const handleShowReports = useCallback(() => {
    setShowReportsDialog(true);
  }, []);

  // Handle discount dialog
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

      // Apply the discount
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

  // Fetch incomplete orders count and table orders for notifications
  const fetchIncompleteOrders = useCallback(async () => {
    try {
      // Fetch all orders (we'll filter on frontend since backend doesn't support multiple status filtering)
      const response = await ordersAPI.getOrders();

      console.log("Orders API response:", response);

      if (response?.data) {
        // Handle the nested response structure: {data: {data: Array}}
        let ordersArray: OrderSummaryType[];

        // Define type for nested response
        type NestedResponse = { data: OrderSummaryType[] };

        // Check if response.data is a nested structure or direct array
        if (Array.isArray(response.data)) {
          ordersArray = response.data;
        } else if (response.data && typeof response.data === "object" && "data" in response.data && Array.isArray((response.data as NestedResponse).data)) {
          ordersArray = (response.data as NestedResponse).data;
        } else {
          console.warn("Unexpected orders API response structure:", response.data);
          setIncompleteOrdersCount(0);
          setTableOrders({});
          return;
        }

        // Filter for incomplete orders (not paid or cancelled)
        const incompleteOrders = ordersArray.filter(order => order.status !== "paid" && order.status !== "cancelled");

        console.log("Incomplete orders found:", incompleteOrders.length);
        console.log(
          "Orders by type:",
          incompleteOrders.map(o => ({ id: o.id, type: o.orderType, status: o.status }))
        );

        // Count total incomplete orders
        setIncompleteOrdersCount(incompleteOrders.length);

        // Separate counts by order type
        const deliveryCount = incompleteOrders.filter(order => order.orderType === "delivery").length;
        const takeawayCount = incompleteOrders.filter(order => order.orderType === "takeaway").length;
        const deliveryTakeawayCount = deliveryCount + takeawayCount;

        // Count unique tables with incomplete orders (not total orders)
        const uniqueTablesWithOrders = new Set(incompleteOrders.filter(order => order.orderType === "table" && order.tableNumber).map(order => order.tableNumber));
        const tableOrdersCount = uniqueTablesWithOrders.size;

        setIncompleteTableOrdersCount(tableOrdersCount);
        setIncompleteDeliveryTakeawayCount(deliveryTakeawayCount);
        setIncompleteDeliveryCount(deliveryCount);
        setIncompleteTakeawayCount(takeawayCount);

        console.log("Tables with incomplete orders count:", tableOrdersCount);
        console.log("Delivery orders count:", deliveryCount);
        console.log("Takeaway orders count:", takeawayCount);
        console.log("Delivery/Takeaway orders count:", deliveryTakeawayCount);

        // Group orders by table for table notifications
        const tableOrdersMap: { [tableId: string]: number } = {};
        incompleteOrders.forEach(order => {
          if (order.tableNumber) {
            const tableKey = order.tableNumber.toString();
            tableOrdersMap[tableKey] = (tableOrdersMap[tableKey] || 0) + 1;
          }
        });
        setTableOrders(tableOrdersMap);
      } else {
        // No data received
        setIncompleteOrdersCount(0);
        setTableOrders({});
        setIncompleteTableOrdersCount(0);
        setIncompleteDeliveryTakeawayCount(0);
        setIncompleteDeliveryCount(0);
        setIncompleteTakeawayCount(0);
      }
    } catch (error) {
      console.error("Error fetching incomplete orders:", error);
      // Reset counts on error
      setIncompleteOrdersCount(0);
      setTableOrders({});
      setIncompleteTableOrdersCount(0);
      setIncompleteDeliveryTakeawayCount(0);
      setIncompleteDeliveryCount(0);
      setIncompleteTakeawayCount(0);
      // Don't show error to user as this is background functionality
    }
  }, []);

  // Comprehensive reset function - clears everything in POS system
  const handleCancelOrder = useCallback(() => {
    // Clear cart and local state
    setCart([]);
    setHasUnsavedChanges(false);

    // Reset order type and table selection
    setOrderType("takeaway");
    setSelectedTable(undefined);
    setShowTablesLayout(false);

    // Clear search and filters
    setActiveCategory("all");

    // Clear any dialogs
    setShowPaymentDialog(false);
    setShowReceiptDialog(false);
    setShowVoidDialog(false);
    setShowOrdersDialog(false);
    setShowNegativeStockDialog(false);
    setShowUnsavedDialog(false);
    setShowReportsDialog(false);
    setShowDiscountDialog(false);

    // Clear payment amount
    setPaymentAmount("");

    // Clear messages
    setError(null);
    setSuccessMessage(null);

    // Clear any timeouts
    if (errorTimeoutRef.current) {
      clearTimeout(errorTimeoutRef.current);
      errorTimeoutRef.current = null;
    }
    if (successTimeoutRef.current) {
      clearTimeout(successTimeoutRef.current);
      successTimeoutRef.current = null;
    }
    if (checkmarkTimeoutRef.current) {
      clearTimeout(checkmarkTimeoutRef.current);
      checkmarkTimeoutRef.current = null;
    }

    // Clear current order from order management
    if (clearOrder) {
      clearOrder();
    }
    // Clear all order persistence data (localStorage)
    OrderPersistence.clearAllData();
    // Show success message
  }, [clearOrder]);

  // Handle order selection for editing
  const handleOrderSelect = useCallback(
    async (order: any) => {
      try {
        setIsLoading(true);
        setError(null);

        console.log("📋 Loading order for editing:", order);
        console.log("🔍 Order details:", {
          id: order.id,
          orderNumber: order.orderNumber,
          orderType: order.orderType,
          status: order.status,
          hasItems: !!order.items,
          itemsLength: order.items?.length || 0
        });

        // Clear current cart and state first
        console.log("🧹 Clearing current state before loading order");
        setCart([]);
        setHasUnsavedChanges(false);
        setAppliedDiscount(null);
        setDiscountAmount(0);

        // Load the order using the order management hook
        // This will set currentOrder, which will trigger the useEffect to transform items to cart
        if (loadOrder) {
          console.log("🔄 Calling loadOrder with ID:", order.id);
          await loadOrder(order.id);
          console.log("✅ Order loaded successfully via loadOrder hook");
        } else {
          console.error("❌ loadOrder function is not available!");
        }

        // The cart transformation will be handled by the useEffect that watches currentOrder
        // No need to manually transform items here anymore

        setHasUnsavedChanges(false); // This is an existing order, not unsaved

        console.log("🎯 Order selection completed");
      } catch (error) {
        console.error("❌ Failed to load order:", error);
        showError("Failed to load order for editing. Please try again.");
      } finally {
        setIsLoading(false);
      }
    },
    [loadOrder, showError]
  );

  // Handle selectedOrderForPOS prop changes
  useEffect(() => {
    if (selectedOrderForPOS) {
      console.log("📎 POSClient: Processing selectedOrderForPOS:", selectedOrderForPOS);

      // Call the internal handleOrderSelect to load the order
      handleOrderSelect(selectedOrderForPOS)
        .then(() => {
          console.log("✅ Order processed successfully");
          // Notify parent that order has been processed
          if (onOrderProcessed) {
            onOrderProcessed();
          }
        })
        .catch(error => {
          console.error("❌ Failed to process order:", error);
          // Still notify parent to clear the state
          if (onOrderProcessed) {
            onOrderProcessed();
          }
        });
    }
  }, [selectedOrderForPOS, handleOrderSelect, onOrderProcessed]);

  // Update optimistic assignments when props change
  useEffect(() => {
    setOptimisticAssignments(sectionAssignments);
  }, [sectionAssignments]);

  // Cleanup timeout references on unmount
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

  // Fetch initial data (POS items, stock entries, menu items, tables)
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        setIsLoading(true);

        // Fetch unified POS items (replaces separate stock/menu fetching for POS)
        const posResponse = await posAPI.getPOSItems();
        const posData = posResponse.data?.data || [];
        setPosItems(posData);

        // Still fetch stock entries and menu items for backward compatibility
        const stockResponse = await stockAPI.getStockEntries();
        const stockData = stockResponse.data || [];
        setStockEntries(stockData);

        const menuResponse = await menuAPI.getMenus();
        const menuData = menuResponse.data || [];
        setMenuItems(menuData);

        // Fetch tables with order information
        const tablesResponse = await tablesAPI.getTables({ includeOrders: true });
        const responseData = tablesResponse.data as Table[] | { data: Table[] };
        const tablesData = Array.isArray(responseData) ? responseData : responseData.data || [];
        setTables(tablesData);
      } catch (error) {
        showError("Failed to load data");
      } finally {
        setIsLoading(false);
      }
    };

    fetchInitialData();
  }, [showError]);

  // Manual save function
  const handleManualSave = useCallback(async () => {
    if (cart.length === 0) {
      showError("Cannot save empty order");
      return;
    }

    console.log("💾 Starting manual save...");
    console.log("🛒 Cart for saving:", cart);

    try {
      const orderData = {
        orderType,
        tableId: selectedTable?.id,
        items: cart.map(item => {
          console.log("📝 Processing save item:", item);
          console.log("🔍 Item type:", item.type);
          console.log("🔍 Original item:", item.originalItem);

          const orderItem = {
            materialId: item.type === "material" ? String((item.originalItem as StockEntryWithMaterial).materialId) : undefined,
            menuItemId: item.type === "menu" ? String((item.originalItem as MenuItem).id) : undefined,
            assignmentId: undefined,
            name: item.name,
            quantity: item.quantity,
            unitPrice: item.price,
            totalPrice: item.price * item.quantity,
            type: item.type,
            notes: undefined
          };

          console.log("📋 Created save item:", orderItem);
          return orderItem;
        }),
        discountType: appliedDiscount?.type,
        discountValue: appliedDiscount?.value,
        discountAmount: appliedDiscount?.amount || 0,
        discountReason: appliedDiscount?.reason
      };

      console.log("📦 Final save data:", orderData);

      if (currentOrder) {
        // Update existing order
        const updateItems = cart.map((item, index) => ({
          id: currentOrder.items[index]?.id || `temp-${Date.now()}-${index}`,
          materialId: item.type === "material" ? (item.originalItem as StockEntryWithMaterial).materialId : undefined,
          menuItemId: item.type === "menu" ? (item.originalItem as MenuItem).id : undefined,
          assignmentId: undefined,
          name: item.name,
          quantity: item.quantity,
          unitPrice: item.price,
          totalPrice: item.price * item.quantity,
          type: item.type,
          notes: undefined
        }));
        await updateOrder({ items: updateItems });
        showSuccess("Order updated successfully");
      } else {
        // Create new order
        await createOrder(orderData);
        showSuccess("Order Saved");
      }

      // Refresh tables to update status in UI
      if (orderType === "table") {
        try {
          const tablesResponse = await tablesAPI.getTables({ includeOrders: true });
          const responseData = tablesResponse.data as Table[] | { data: Table[] };
          const refreshedTables = Array.isArray(responseData) ? responseData : responseData.data || [];
          setTables(refreshedTables);
        } catch (error) {
          // Handle table refresh error silently
        }
      }

      // Clear cart with animation after successful save
      clearCartWithAnimation();
      setHasUnsavedChanges(false);

      // Clear discount state
      setAppliedDiscount(null);
      setDiscountAmount(0);

      // Clear current order from order management
      if (clearOrder) {
        clearOrder();
      }

      // Clear order persistence data
      OrderPersistence.clearCurrentOrder();
    } catch (error) {
      showError("Failed to save order");
    }
  }, [cart, orderType, selectedTable, currentOrder, updateOrder, createOrder, showSuccess, showError, clearCartWithAnimation, clearOrder, appliedDiscount]);

  // Load saved order on component mount
  useEffect(() => {
    const loadSavedOrder = async () => {
      const savedOrder = OrderPersistence.loadCurrentOrder();
      if (savedOrder && savedOrder.items && savedOrder.items.length > 0) {
        // Convert saved OrderItem[] back to POSCartItem[]
        const cartItems: POSCartItem[] = savedOrder.items.map(item => {
          let originalItem: StockEntryWithMaterial | MenuItem;

          if (item.type === "material" && item.materialId) {
            // Find the stock entry by materialId
            originalItem = stockEntries.find(se => se.materialId === item.materialId);
          } else if (item.type === "menu" && item.menuItemId) {
            // Find the menu item by menuItemId
            originalItem = menuItems.find(m => m.id === item.menuItemId);
          }

          if (!originalItem) {
            return null;
          }

          return {
            id: item.id,
            name: item.name,
            price: item.unitPrice,
            quantity: item.quantity,
            type: item.type as "material" | "menu",
            originalItem
          };
        });

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

  // Transform currentOrder items to cart when order is loaded
  useEffect(() => {
    console.log("🔄 useEffect triggered - currentOrder changed:", {
      hasCurrentOrder: !!currentOrder,
      currentOrderId: currentOrder?.id,
      currentOrderNumber: currentOrder?.orderNumber,
      hasItems: !!currentOrder?.items,
      itemsLength: currentOrder?.items?.length || 0,
      stockEntriesLength: stockEntries.length,
      menuItemsLength: menuItems.length
    });

    // Only proceed if we have the required data loaded
    if (!stockEntries.length && !menuItems.length) {
      console.log("⏳ Waiting for stock entries and menu items to load...");
      console.log("📊 Current state:", {
        stockEntriesLength: stockEntries.length,
        menuItemsLength: menuItems.length,
        hasCurrentOrder: !!currentOrder,
        hasOrderItems: !!currentOrder?.items?.length
      });
      return;
    }

    if (currentOrder && currentOrder.items && currentOrder.items.length > 0) {
      console.log("🔄 Transforming currentOrder items to cart:", currentOrder.items);
      console.log("📊 Current order structure:", {
        id: currentOrder.id,
        orderNumber: currentOrder.orderNumber,
        orderType: currentOrder.orderType,
        itemsCount: currentOrder.items.length,
        firstItem: currentOrder.items[0]
      });
      console.log("📦 Available data:", {
        stockEntriesCount: stockEntries.length,
        menuItemsCount: menuItems.length
      });

      // Transform order items to POSCartItem format
      const cartItems: POSCartItem[] = currentOrder.items
        .map((item: any) => {
          console.log("🔍 Processing item:", item);

          let originalItem: StockEntryWithMaterial | MenuItem;

          // Handle materialId as number (from your data)
          const materialId = typeof item.materialId === "number" ? item.materialId : parseInt(item.materialId || "0");
          const menuItemId = typeof item.menuItemId === "number" ? item.menuItemId : parseInt(item.menuItemId || "0");

          if (item.type === "material" && materialId) {
            // Find the stock entry by materialId (handle number type)
            const foundStockEntry = stockEntries.find(se => {
              const stockMaterialId = typeof se.materialId === "string" ? parseInt(se.materialId) : se.materialId;
              return stockMaterialId === materialId;
            });

            if (foundStockEntry) {
              console.log("✅ Found stock entry for materialId:", materialId, foundStockEntry);
              originalItem = foundStockEntry;
            } else {
              console.log(
                "⚠️ Stock entry not found for materialId:",
                materialId,
                "Available stock entries:",
                stockEntries.map(se => ({ id: se.materialId, name: se.material?.name }))
              );
              // Create a minimal fallback object with required properties
              originalItem = {
                id: materialId.toString(),
                materialId: materialId.toString(),
                material: item.material || { id: materialId, name: item.name },
                quantity: item.quantity,
                unitPrice: parseFloat(item.unitPrice?.toString() || "0"),
                // Required StockEntry properties with sensible defaults
                wasteReason: "",
                supplier: "Unknown",
                purchasedQuantity: item.quantity || 0,
                purchasedUnit: "unit",
                costPerPurchasedUnit: parseFloat(item.unitPrice?.toString() || "0"),
                totalCost: (item.quantity || 0) * parseFloat(item.unitPrice?.toString() || "0"),
                purchaseDate: new Date(),
                isPOSItem: true,
                createdAt: new Date(),
                updatedAt: new Date()
              } as StockEntryWithMaterial;
            }
          } else if (item.type === "menu" && menuItemId) {
            // Find the menu item by menuItemId (handle number type)
            const foundMenuItem = menuItems.find(m => {
              const menuId = typeof m.id === "string" ? parseInt(m.id) : m.id;
              return menuId === menuItemId;
            });

            if (foundMenuItem) {
              console.log("✅ Found menu item for menuItemId:", menuItemId, foundMenuItem);
              originalItem = foundMenuItem;
            } else {
              console.log(
                "⚠️ Menu item not found for menuItemId:",
                menuItemId,
                "Available menu items:",
                menuItems.map(m => ({ id: m.id, name: m.name }))
              );
              originalItem = {
                id: menuItemId,
                name: item.name,
                price: parseFloat(item.unitPrice?.toString() || "0")
              } as MenuItem;
            }
          } else {
            console.log("⚠️ Creating fallback original item for:", item);
            // Fallback: create a minimal original item
            originalItem = {
              id: item.id || item.materialId || item.menuItemId,
              name: item.name,
              price: parseFloat(item.unitPrice?.toString() || "0")
            } as any;
          }

          const cartItem = {
            id: item.id.toString(),
            name: item.name,
            price: parseFloat(item.unitPrice?.toString() || "0"),
            quantity: item.quantity,
            type: item.type as "material" | "menu",
            originalItem
          };

          console.log("✨ Created cart item:", cartItem);
          return cartItem;
        })
        .filter(Boolean); // Remove any null items

      console.log("✅ Final transformed cart items:", cartItems);
      console.log("📦 Setting cart with", cartItems.length, "items");
      console.log(
        "🔍 Cart items details:",
        cartItems.map(item => ({
          id: item.id,
          name: item.name,
          type: item.type,
          quantity: item.quantity,
          price: item.price
        }))
      );
      setCart(cartItems);

      // Set order type and related data
      if (currentOrder.orderType) {
        console.log("🏷️ Setting order type:", currentOrder.orderType);
        setOrderType(currentOrder.orderType);
      }

      // Set table if it's a table order
      if (currentOrder.tableId && currentOrder.orderType === "table") {
        console.log("🪑 Loading table for order:", currentOrder.tableId);
        // Create async function to fetch table data
        const loadTableData = async () => {
          try {
            const tableResponse = await tablesAPI.getTable(currentOrder.tableId);
            if (tableResponse.data) {
              console.log("🪑 API response structure:", tableResponse);
              console.log("🪑 Table data to set:", tableResponse.data);

              // Handle nested API response structure
              // Check if the response has nested data (backend returns {data: {data: tableObject}})
              const nestedResponse = tableResponse.data as Table | { data: Table };
              const tableData = "data" in nestedResponse ? nestedResponse.data : nestedResponse;
              console.log("🪑 Final table data:", tableData);
              setSelectedTable(tableData);
            }
          } catch (error) {
            console.error("Failed to fetch table:", error);
            // Fallback: create a minimal table object from available data
            if (currentOrder.tableNumber) {
              const fallbackTable: Table = {
                id: currentOrder.tableId,
                number: currentOrder.tableNumber,
                seats: 4, // Default value
                status: "opened",
                position: { x: 0, y: 0 }, // Default position
                shape: "round" // Default shape
              };
              setSelectedTable(fallbackTable);
            }
          }
        };

        loadTableData();
      }

      // Set employee if it's an employee order
      if (currentOrder.orderType === "employees" && currentOrder.employeeId) {
        console.log("👤 Loading selected employee:", currentOrder.employeeId);
        const loadEmployeeData = async () => {
          try {
            // Import employeeAPI if not already imported
            const { employeeAPI } = await import("@/api/employee.api");
            const employeeResponse = await employeeAPI.getEmployee(parseInt(currentOrder.employeeId.toString()));
            if (employeeResponse.data) {
              setSelectedEmployee(employeeResponse.data);
              console.log("👤 Employee loaded:", employeeResponse.data);
            }
          } catch (error) {
            console.error("Failed to load employee data:", error);
            // Fallback: create a minimal employee object if API fails
            const fallbackEmployee: Employee = {
              id: parseInt(currentOrder.employeeId.toString()),
              userId: 0,
              employeeNumber: currentOrder.employeeId.toString(),
              department: "other" as EmployeeDepartment,
              position: "Unknown",
              baseSalary: 0,
              discountPercentage: 0,
              hireDate: new Date().toISOString(),
              isActive: true,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString()
            };
            setSelectedEmployee(fallbackEmployee);
          }
        };
        loadEmployeeData();
      }

      // Apply discount if present
      if (currentOrder.discountAmount && parseFloat(currentOrder.discountAmount.toString()) > 0) {
        console.log("💰 Applying discount:", currentOrder.discountAmount);
        setAppliedDiscount({
          type: (currentOrder.discountType as "percentage" | "fixed") || "fixed",
          value: parseFloat(currentOrder.discountValue?.toString() || "0"),
          amount: parseFloat(currentOrder.discountAmount.toString()),
          reason: currentOrder.discountReason || undefined
        });
        setDiscountAmount(parseFloat(currentOrder.discountAmount.toString()));
      }
    } else if (currentOrder && (!currentOrder.items || currentOrder.items.length === 0)) {
      // If currentOrder exists but has no items, clear the cart
      console.log("🔄 Current order has no items, clearing cart");
      setCart([]);
    } else if (!currentOrder) {
      console.log("❌ No currentOrder available");
    } else {
      console.log("⚠️ CurrentOrder exists but no items:", currentOrder);
    }

    console.log("🏁 useEffect completed. Final state:", {
      hasCurrentOrder: !!currentOrder,
      orderItemsLength: currentOrder?.items?.length || 0,
      stockEntriesLength: stockEntries.length,
      menuItemsLength: menuItems.length,
      cartWillBeSet: !!currentOrder?.items?.length
    });
  }, [currentOrder, stockEntries, menuItems]);

  // Track unsaved changes when cart changes
  useEffect(() => {
    console.log("🛍️ Cart state changed:", {
      cartLength: cart?.length || 0,
      cartItems: cart?.map(item => ({ id: item.id, name: item.name, quantity: item.quantity })) || []
    });

    if (cart && cart.length > 0) {
      setHasUnsavedChanges(true);
    } else {
      setHasUnsavedChanges(false);
    }
  }, [cart]);

  // Fetch menu items
  useEffect(() => {
    const fetchMenuItems = async () => {
      try {
        const response = await menuAPI.getMenus();
        setMenuItems(response.data);
      } catch (error) {
        showError("Failed to load menu items");
      }
    };

    fetchMenuItems();
  }, [showError]);

  // Fetch incomplete orders for notifications
  useEffect(() => {
    // Initial fetch
    fetchIncompleteOrders();

    // Set up interval to refresh every 30 seconds
    const interval = setInterval(fetchIncompleteOrders, 30000);

    // Cleanup interval on unmount
    return () => clearInterval(interval);
  }, [fetchIncompleteOrders]);

  // Get available POS items (filter by search term and category)
  const availablePosItems = posItems.filter(posItem => {
    // Check search term
    const matchesSearch = searchTerm === "" || posItem.name.toLowerCase().includes(searchTerm.toLowerCase()) || posItem.category?.toLowerCase().includes(searchTerm.toLowerCase());

    return matchesSearch;
  });

  // Get unique categories from POS items
  const categories = ["all", ...Array.from(new Set(posItems.map(item => item.category).filter(Boolean)))];

  // Filter POS items by category
  const filteredPosItems = activeCategory === "all" ? availablePosItems : availablePosItems.filter(item => item.category === activeCategory);

  // Function to recalculate employee discount when cart changes
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
    [selectedEmployee, orderType]
  );

  // Cart operations - Updated for unified POS items
  const addToCart = useCallback(
    (posItem: POSItem) => {
      console.log("🛒 Adding to cart:", posItem);
      const cartId = `pos-${posItem.id}`;

      setCart(prevCart => {
        const currentCart = prevCart || [];
        const existingItem = currentCart.find(cartItem => cartItem.id === cartId);
        let newCart: POSCartItem[];

        if (existingItem) {
          newCart = currentCart.map(cartItem => (cartItem.id === cartId ? { ...cartItem, quantity: cartItem.quantity + 1 } : cartItem));
        } else {
          if (posItem.type === "menu_item") {
            // Handle menu items
            const menuItemId = typeof posItem.id === "string" ? parseInt(posItem.id) || 0 : posItem.id;
            const menuItem = menuItems.find(mi => {
              const miId = typeof mi.id === "string" ? parseInt(mi.id) || 0 : mi.id;
              return miId === menuItemId;
            });
            if (!menuItem) {
              console.warn("❌ Menu item not found:", posItem, "Available menu items:", menuItems);
              return currentCart; // Return current cart if menu item not found
            }
            console.log("✅ Menu item found:", menuItem);
            console.log("📝 Creating menu item for cart with ID:", menuItemId);

            const newItem: POSCartItem = {
              id: cartId,
              name: posItem.name,
              price: posItem.price,
              quantity: 1,
              type: "menu",
              originalItem: menuItem,
              posItem,
              stockEntryId: undefined,
              menuItemId: menuItemId
            };
            console.log("🎉 Adding menu item to cart:", newItem);
            console.log("📊 Cart before adding:", currentCart);
            const newCart = [...currentCart, newItem];
            console.log("📊 Cart after adding:", newCart);
            return newCart;
          } else {
            // Handle stock entry items
            const stockEntry = stockEntries.find(se => {
              // Convert both to strings for comparison since stockEntry.materialId is string and posItem.materialId is number
              const stockEntryMaterialId = String(se.materialId);
              const posItemMaterialId = String(posItem.materialId);
              return stockEntryMaterialId === posItemMaterialId;
            });
            if (!stockEntry) {
              console.warn("Stock entry not found:", posItem);
              return currentCart; // Return current cart if stock entry not found
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
              menuItemId: undefined
            };
            newCart = [...currentCart, newItem];
          }
        }

        // Recalculate employee discount after cart update
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
      let newCart: POSCartItem[];
      if (newQuantity <= 0) {
        newCart = cart.filter(item => item.id !== cartId);
        setCart(newCart);
      } else {
        newCart = cart.map(item => (item.id === cartId ? { ...item, quantity: newQuantity } : item));
        setCart(newCart);
      }

      // Recalculate employee discount if applicable
      recalculateEmployeeDiscount(newCart);
    },
    [cart, recalculateEmployeeDiscount]
  );

  // Order type handlers
  const handleOrderTypeChange = useCallback((type: OrderType) => {
    setOrderType(type);
    if (type !== "table") {
      setSelectedTable(undefined);
    }
  }, []);

  const handleTableSelect = useCallback(() => {
    setShowTablesLayout(true);
  }, []);

  const handleTableSelection = useCallback(
    async (table: Table) => {
      setSelectedTable(table);
      setOrderType("table");
      setShowTablesLayout(false);

      // If table is opened and has currentOrder, load existing order
      if (table.status === "opened" && table.currentOrder) {
        try {
          // Get the full order details using the orderId from currentOrder
          const response = await ordersAPI.getOrder(table.currentOrder.orderId);
          // Handle nested response structure - API sometimes returns nested data
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const responseData = response.data as { data?: any } | any;
          const existingOrder = responseData.data || responseData;

          if (existingOrder && existingOrder.items) {
            // Load the order using order management hook to set currentOrder state
            const loadedOrder = await loadOrder(existingOrder.id);

            // Convert order items to cart items
            const cartItems: POSCartItem[] = existingOrder.items.map(item => {
              let originalItem: StockEntryWithMaterial | MenuItem;

              if (item.type === "material" && item.materialId) {
                // Find the stock entry by materialId
                originalItem = stockEntries.find(se => se.materialId === item.materialId);
              } else if (item.type === "menu" && item.menuItemId) {
                // Find the menu item by menuItemId
                originalItem = menuItems.find(m => m.id === item.menuItemId);
              }

              if (!originalItem) {
                return null;
              }

              const cartItem = {
                id: item.id,
                name: item.name,
                price: parseFloat(item.unitPrice.toString()),
                quantity: item.quantity,
                type: item.type as "material" | "menu",
                originalItem
              };
              return cartItem;
            });

            setCart(cartItems);
            showSuccess(`Loaded existing order ${existingOrder.orderNumber} for Table ${table.number}`);
          }
        } catch (error) {
          showError("Failed to load existing table order");
        }
      }
    },
    [loadOrder, menuItems, stockEntries, showSuccess, showError]
  );

  const handleCloseTablesLayout = useCallback(() => {
    setShowTablesLayout(false);
  }, []);

  // Employee selection handlers
  const handleEmployeeSelect = useCallback(() => {
    // This will be handled by the EmployeeSelector component in OrderItemsList
  }, []);

  const handleEmployeeSelection = useCallback(
    (employee: Employee) => {
      setSelectedEmployee(employee);
      setOrderType("employees");

      // Automatically apply employee discount
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
    [cart, showSuccess]
  );

  // Calculate totals - with safety check for undefined cart
  const subtotal = (cart || []).reduce((sum, item) => sum + item.price * item.quantity, 0);
  const tax = 0; // No tax applied
  const discountAmountCalculated = appliedDiscount ? appliedDiscount.amount : 0;
  const total = Math.max(0, subtotal - discountAmountCalculated); // Total equals subtotal minus discount

  // Print current order receipt
  const handlePrintReceipt = useCallback(() => {
    // Use current order data if available, otherwise use cart
    const itemsToUse = currentOrder?.items && currentOrder.items.length > 0 ? currentOrder.items : cart;

    if (!itemsToUse || itemsToUse.length === 0) {
      showError("No items to print");
      return;
    }

    // Create receipt data from current order or cart
    const receiptData = {
      id: currentOrder?.orderNumber || `DRAFT-${Date.now()}`,
      date: new Date().toLocaleDateString(),
      time: new Date().toLocaleTimeString(),
      cashier: "Current User",
      items: itemsToUse.map(item => ({
        name: item.name,
        quantity: item.quantity,
        unitPrice: item.unitPrice || item.price,
        totalPrice: item.totalPrice || item.price * item.quantity,
        type: item.type
      })),
      subtotal: currentOrder?.subtotal ? (typeof currentOrder.subtotal === "string" ? parseFloat(currentOrder.subtotal) : currentOrder.subtotal) : subtotal,
      tax: currentOrder?.tax ? (typeof currentOrder.tax === "string" ? parseFloat(currentOrder.tax) : currentOrder.tax) : tax,
      total: currentOrder?.total ? (typeof currentOrder.total === "string" ? parseFloat(currentOrder.total) : currentOrder.total) : total,
      paymentAmount: currentOrder?.total ? (typeof currentOrder.total === "string" ? parseFloat(currentOrder.total) : currentOrder.total) : total,
      change: 0,
      paymentMethod: "cash",
      // Include discount information if available
      discountType: currentOrder?.discountType || appliedDiscount?.type || null,
      discountValue: currentOrder?.discountValue ? (typeof currentOrder.discountValue === "string" ? parseFloat(currentOrder.discountValue) : currentOrder.discountValue) : appliedDiscount?.value || null,
      discountAmount: currentOrder?.discountAmount ? (typeof currentOrder.discountAmount === "string" ? parseFloat(currentOrder.discountAmount) : currentOrder.discountAmount) : appliedDiscount?.amount || null,
      discountReason: currentOrder?.discountReason || appliedDiscount?.reason || null
    };

    // Set receipt data and show receipt dialog
    setLastSaleData(receiptData);
    setShouldAutoPrint(false); // Manual print - don't auto-print
    setShowReceiptDialog(true);
  }, [cart, currentOrder, subtotal, tax, total, appliedDiscount, showError]);

  // Handle void order
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

  // Confirm void order
  const handleConfirmVoid = useCallback(
    async (reason: string, restoreStock: boolean) => {
      try {
        setShowVoidDialog(false);

        const result = await voidOrder(reason, restoreStock);

        // Clear cart and local storage after successful void
        clearCartWithAnimation();
        setHasUnsavedChanges(false);
        OrderPersistence.clearCurrentOrder();

        // Clear current order from order management (voidOrder hook may handle this, but ensure it's cleared)
        if (clearOrder) {
          clearOrder();
        }

        // Automatically select TAKE AWAY after voiding
        resetToTakeaway();

        // Refresh tables if this was a table order
        if (orderType === "table" && selectedTable) {
          try {
            const tablesResponse = await tablesAPI.getTables({ includeOrders: true });
            const responseData = tablesResponse.data as Table[] | { data: Table[] };
            const refreshedTables = Array.isArray(responseData) ? responseData : responseData.data || [];
            setTables(refreshedTables);
          } catch (error) {
            console.error("Failed to refresh tables:", error);
          }
        }

        // Show success message with stock restoration info
        let successMessage = "Order voided successfully";
        if (result.stockRestorations && result.stockRestorations.length > 0) {
          successMessage += `. Stock restored for ${result.stockRestorations.length} item(s).`;
        }
        showSuccess(successMessage);
      } catch (error) {
        // Error is already handled by the voidOrder function
      }
    },
    [voidOrder, clearCartWithAnimation, orderType, selectedTable, showSuccess, resetToTakeaway, clearOrder]
  );

  // Handle orders dialog
  const handleShowOrders = useCallback(() => {
    setShowOrdersDialog(true);
  }, []);

  // Handle payment
  const handlePayment = useCallback(async () => {
    if (cart.length === 0) {
      showError("Cart is empty");
      return;
    }

    // Check if current order is already completed
    if (currentOrder && currentOrder.status === "paid") {
      console.log("⚠️ Order is already completed:", {
        id: currentOrder.id,
        orderNumber: currentOrder.orderNumber,
        status: currentOrder.status,
        completedAt: currentOrder.completedAt
      });
      showError(`Order ${currentOrder.orderNumber || currentOrder.id} is already completed`);
      setShowPaymentDialog(false);
      // Clear the current order since it's completed
      clearOrder();
      return;
    }

    console.log("💰 Starting payment process...");
    console.log("🛒 Current cart:", cart);
    if (currentOrder) {
      console.log("📋 Current order status:", {
        id: currentOrder.id,
        orderNumber: currentOrder.orderNumber,
        status: currentOrder.status,
        total: currentOrder.total
      });
    }

    // Check each cart item in detail
    cart.forEach((item, index) => {
      console.log(`🔍 Cart item ${index}:`, {
        id: item.id,
        name: item.name,
        type: item.type,
        originalItem: item.originalItem,
        hasOriginalItem: !!item.originalItem,
        originalItemType: typeof item.originalItem,
        menuItemId: item.menuItemId,
        stockEntryId: item.stockEntryId
      });
    });

    setIsLoading(true);
    try {
      let orderToComplete = currentOrder;

      // Always create/update order first, then complete it
      if (!currentOrder) {
        // Create a new order first
        const orderData = {
          orderType,
          tableId: selectedTable?.id,
          items: cart.map(item => {
            console.log("📝 Processing cart item:", item);
            console.log("🔍 Item type:", item.type);
            console.log("🔍 Original item:", item.originalItem);

            const orderItem = {
              materialId: item.type === "material" ? String((item.originalItem as StockEntryWithMaterial).materialId) : undefined,
              menuItemId: item.type === "menu" ? String((item.originalItem as MenuItem).id) : undefined,
              assignmentId: undefined,
              name: item.name,
              quantity: item.quantity,
              unitPrice: item.price,
              totalPrice: item.price * item.quantity,
              type: item.type,
              notes: undefined
            };

            console.log("📋 Created order item:", orderItem);
            return orderItem;
          }),
          discountType: appliedDiscount?.type,
          discountValue: appliedDiscount?.value,
          discountAmount: appliedDiscount?.amount || 0,
          discountReason: appliedDiscount?.reason
        };

        console.log("📦 Final order data:", orderData);

        console.log("🚀 Calling createOrder function...");
        const createOrderResponse = await createOrder(orderData);
        console.log("📝 createOrder returned:", createOrderResponse);

        // Extract the actual order from the response
        if (createOrderResponse && typeof createOrderResponse === "object" && "order" in createOrderResponse) {
          orderToComplete = (createOrderResponse as any).order;
          console.log("✅ Extracted order from response.order:", orderToComplete);
        } else {
          orderToComplete = createOrderResponse;
          console.log("⚠️ Using response directly as order:", orderToComplete);
        }

        console.log("🔍 Order structure analysis:", {
          hasOrder: !!orderToComplete,
          orderType: typeof orderToComplete,
          hasId: orderToComplete ? "id" in orderToComplete : false,
          idValue: orderToComplete?.id,
          orderKeys: orderToComplete ? Object.keys(orderToComplete) : "no order",
          fullOrder: orderToComplete
        });
      }

      // Use currentOrder if orderToComplete is not available
      if (!orderToComplete && currentOrder) {
        console.log("⚠️ Using currentOrder as fallback:", currentOrder);
        orderToComplete = currentOrder;
      }

      // Ensure we have a valid order with ID
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

      // Now complete the order with payment using the order ID directly
      const paymentData = {
        paymentMethod: "cash",
        paymentAmount: parseFloat(paymentAmount) || total,
        change: Math.max(0, (parseFloat(paymentAmount) || total) - total)
      };

      const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error("Order completion timeout - API call took too long")), 15000));

      const response = (await Promise.race([ordersAPI.completeOrder(orderToComplete.id, paymentData), timeoutPromise])) as any;

      console.log("📨 API Response received:", response);
      console.log("📨 Response data:", response?.data);

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
          order = {
            id: orderToComplete.id,
            items: cart,
            subtotal: subtotal,
            tax: tax,
            total: total,
            status: "completed"
          };
          saleId = `sale-${Date.now()}`;
        }
      } else {
        order = {
          id: orderToComplete.id,
          items: cart,
          subtotal: subtotal,
          tax: tax,
          total: total,
          status: "completed"
        };
        saleId = `sale-${Date.now()}`;
      }

      const receiptData = {
        id: saleId || `receipt-${Date.now()}`,
        date: new Date().toLocaleDateString(),
        time: new Date().toLocaleTimeString(),
        cashier: "Current User",
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
        // Include discount information
        discountType: order.discountType || appliedDiscount?.type || null,
        discountValue: order.discountValue ? (typeof order.discountValue === "string" ? parseFloat(order.discountValue) : order.discountValue) : appliedDiscount?.value || null,
        discountAmount: order.discountAmount ? (typeof order.discountAmount === "string" ? parseFloat(order.discountAmount) : order.discountAmount) : appliedDiscount?.amount || null,
        discountReason: order.discountReason || appliedDiscount?.reason || null
      };

      // Update table status if this was a table order
      if (selectedTable && orderType === "table") {
        console.log("🏢 Updating table status...");
        try {
          // Clear table reservation/status
          await tablesAPI.clearReservation(selectedTable.id);
          // Refresh tables to update UI
          const tablesResponse = await tablesAPI.getTables({ includeOrders: true });
          const responseData = tablesResponse.data as Table[] | { data: Table[] };
          const refreshedTables = Array.isArray(responseData) ? responseData : responseData.data || [];
          setTables(refreshedTables);
          console.log("✅ Table status updated successfully");
        } catch (error) {
          console.log("⚠️ Table update error (non-critical):", error);
        }
      }

      // Record employee usage if this was an employee order
      if (selectedEmployee && orderType === "employees") {
        console.log("👤 Recording employee usage...");
        try {
          const { recordEmployeeUsage } = await import("@/utils/employeeUsageUtils");
          // Use orderNumber as posTransactionId instead of saleId (order ID)
          const posTransactionId = order.orderNumber || saleId;
          console.log("📝 Using posTransactionId:", posTransactionId, "(orderNumber:", order.orderNumber, ", saleId:", saleId, ")");
          await recordEmployeeUsage(selectedEmployee, cart, posTransactionId);
          console.log("✅ Employee usage recorded successfully");
        } catch (error) {
          console.log("⚠️ Employee usage recording error (non-critical):", error);
        }
      }

      // Set receipt data for printing
      setLastSaleData(receiptData);

      clearCartWithAnimation();
      setPaymentAmount("");
      setShowPaymentDialog(false);
      setShouldAutoPrint(false);
      setShowReceiptDialog(true);

      // Clear discount state
      setAppliedDiscount(null);
      setDiscountAmount(0);

      // Clear employee selection
      setSelectedEmployee(null);

      clearOrder();
      OrderPersistence.clearCurrentOrder();
      setHasUnsavedChanges(false);
      resetToTakeaway();

      // Callback for parent component
      if (onSaleComplete) {
        const response = {
          sale: { id: saleId },
          message: "Sale completed"
        } as SaleResponse;
        onSaleComplete(response);
      }
    } catch (error: unknown) {
      console.error("❌ Payment failed with error:", error);
      const errorMessage = error && typeof error === "object" && "response" in error && error.response && typeof error.response === "object" && "data" in error.response && error.response.data && typeof error.response.data === "object" && "message" in error.response.data ? (error.response.data.message as string) : "Sale failed. Please try again.";
      showError(errorMessage);
      setShowPaymentDialog(false);
    } finally {
      setIsLoading(false);
    }
  }, [cart, total, paymentAmount, subtotal, tax, showError, clearCartWithAnimation, onSaleComplete, currentOrder, selectedTable, selectedEmployee, orderType, clearOrder, resetToTakeaway, createOrder, appliedDiscount]);

  return (
    <>
      <div className="h-full flex flex-col lg:flex-row bg-gray-50 safe-area-padding">
        {/* Mobile Header - Order Summary (visible on mobile only) */}
        <div className="lg:hidden bg-white border-b border-gray-200 p-3 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              {(hasUnsavedChanges || currentOrder || (cart && cart.length > 0 && (orderType === "delivery" || orderType === "takeaway"))) && !showSuccessCheckmark && (
                <span className="text-sm text-blue-600 font-bold">
                  {currentOrder ? (
                    <div className="flex items-center space-x-1">
                      <span>{currentOrder.orderNumber}</span>
                      <span className={`text-xs font-medium ${currentOrder.status === "draft" ? "text-orange-600" : currentOrder.status === "paid" ? "text-green-600" : currentOrder.status === "cancelled" ? "text-red-600" : "text-gray-600"}`}>({currentOrder.status})</span>
                    </div>
                  ) : cart && cart.length > 0 && (orderType === "delivery" || orderType === "takeaway") ? (
                    <span>{generatePreviewOrderNumber()}</span>
                  ) : hasUnsavedChanges ? (
                    "Unsaved"
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

        {/* Left Panel - Cart/Order Details (Desktop) / Full Width (Mobile) */}
        <div className="cart flex flex-col h-full lg:w-1/3 bg-white lg:border-r lg:border-gray-200">
          {/* Cart Header - Fixed (Desktop Only) */}
          <div className="hidden lg:block border-b border-gray-200 px-3 flex-shrink-0">
            <div className="flex items-center justify-between py-2">
              <div className="flex flex-col xl:flex-row items-start xl:items-center space-y-1 xl:space-y-0 xl:space-x-2">
                {/* Order Status Indicator */}
                {(hasUnsavedChanges || currentOrder || (cart && cart.length > 0 && (orderType === "delivery" || orderType === "takeaway"))) && !showSuccessCheckmark && (
                  <span className="text-lg text-blue-600 font-bold">
                    {currentOrder ? (
                      <div className="flex items-center space-x-1">
                        <span>{currentOrder.orderNumber}</span>
                        <span className={`text-xs font-medium ${currentOrder.status === "draft" ? "text-orange-600" : currentOrder.status === "paid" ? "text-green-600" : currentOrder.status === "cancelled" ? "text-red-600" : "text-gray-600"}`}>({currentOrder.status})</span>
                      </div>
                    ) : cart && cart.length > 0 && (orderType === "delivery" || orderType === "takeaway") ? (
                      <span>{generatePreviewOrderNumber()}</span>
                    ) : hasUnsavedChanges ? (
                      "Unsaved"
                    ) : null}
                  </span>
                )}
              </div>
              <div className="flex items-center space-x-2">
                {cart && cart.length > 0 && (
                  <>
                    <Button variant="outline" size="sm" onClick={() => setShowDiscountDialog(true)} className="text-xs px-2 py-1 h-7" disabled={currentOrder?.status === "paid" || currentOrder?.status === "served"}>
                      <DollarSign className="w-3 h-3 mr-1" />
                      Discount
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
              <OrderItemsList cart={cart} updateCartQuantity={updateCartQuantity} orderType={orderType} selectedTable={selectedTable} selectedEmployee={selectedEmployee} onOrderTypeChange={handleOrderTypeChange} onTableSelect={handleTableSelect} onEmployeeSelect={handleEmployeeSelection} incompleteTableOrdersCount={incompleteTableOrdersCount} orderStatus={currentOrder?.status} isOrderCompleted={currentOrder?.status === "paid" || currentOrder?.status === "served"} />
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
                    console.log("⚠️ Cannot open payment dialog - order is already completed:", {
                      id: currentOrder.id,
                      orderNumber: currentOrder.orderNumber,
                      status: currentOrder.status
                    });
                    showError(`Order ${currentOrder.orderNumber || currentOrder.id} is already completed`);
                    return;
                  }
                  console.log("💰 Opening payment dialog, auto-filling amount:", total);
                  setPaymentAmount(total.toString());
                  setShowPaymentDialog(true);
                }}
                onSaveClick={handleManualSave}
              />
            </div>
          )}
        </div>

        {/* Right Panel - Product Grid (Desktop) / Mobile Product Section */}
        <div className="flex-1 flex flex-col bg-white h-full lg:h-auto">
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
              <OrderItemsList cart={cart} updateCartQuantity={updateCartQuantity} orderType={orderType} selectedTable={selectedTable} selectedEmployee={selectedEmployee} onOrderTypeChange={handleOrderTypeChange} onTableSelect={handleTableSelect} onEmployeeSelect={handleEmployeeSelection} incompleteTableOrdersCount={incompleteTableOrdersCount} orderStatus={currentOrder?.status} isOrderCompleted={currentOrder?.status === "paid" || currentOrder?.status === "served"} />
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
                    console.log("💰 Opening payment dialog, auto-filling amount:", total);
                    setPaymentAmount(total.toString());
                    setShowPaymentDialog(true);
                  }}
                  onSaveClick={handleManualSave}
                />
              </div>
            )}
          </div>

          {/* Desktop/Mobile Product View */}
          <div className={`${activeView === "products" || window.innerWidth >= 1024 ? "flex" : "hidden"} lg:flex flex-col h-full`}>
            {/* Top Controls - Fixed Header */}
            <div className="flex-shrink-0 border-b border-gray-200 bg-white">
              <CategoryTabs categories={categories} activeCategory={activeCategory} onCategoryChange={setActiveCategory} />
            </div>

            {/* Product Grid - Scrollable */}
            <div className="flex-1 overflow-y-auto">
              <ProductGrid posItems={filteredPosItems} onAddToCart={addToCart} />
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
              />
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
        <ReceiptPrinter
          isOpen={showReceiptDialog}
          onClose={() => {
            setShowReceiptDialog(false);
            setShouldAutoPrint(false); // Reset auto-print flag
          }}
          receiptData={lastSaleData}
          autoPrint={shouldAutoPrint}
        />

        {/* Discount Dialog */}
        <DiscountDialog isOpen={showDiscountDialog} onClose={() => setShowDiscountDialog(false)} discountAmount={discountAmount} onDiscountAmountChange={handleDiscountAmountChange} onDiscount={() => {}} orderSubtotal={subtotal} onApplyDiscount={handleApplyDiscount} />

        {/* Payment Dialog */}
        <PaymentDialog isOpen={showPaymentDialog} onClose={() => setShowPaymentDialog(false)} total={total} paymentAmount={paymentAmount} onPaymentAmountChange={setPaymentAmount} onPayment={handlePayment} isLoading={isLoading} />

        {/* Void Order Dialog */}
        <VoidOrderDialog isOpen={showVoidDialog} onClose={() => setShowVoidDialog(false)} onConfirm={handleConfirmVoid} order={currentOrder} isLoading={orderLoading} />

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
        <POSClientOrders isOpen={showOrdersDialog} onClose={handleCloseOrdersDialog} onOrderSelect={handleOrderSelectCallback} />

        {/* Tables Layout Dialog */}
        {showTablesLayout && (
          <Dialog open={showTablesLayout} onOpenChange={setShowTablesLayout}>
            <DialogContent className="w-screen h-screen max-w-none max-h-none m-0 p-0 !z-50 bg-white overflow-hidden">
              <div className="w-full h-full flex flex-col overflow-hidden">
                <TablesLayout tables={tables} selectedTable={selectedTable} onTableSelect={handleTableSelection} onClose={handleCloseTablesLayout} tableOrders={tableOrders} />
              </div>
            </DialogContent>
          </Dialog>
        )}

        <Dialog open={showReportsDialog} onOpenChange={setShowReportsDialog}>
          <DialogContent className="w-screen h-screen max-w-none !z-50 max-h-none m-0 p-0 bg-white overflow-hidden">
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

        {/* Receipt Printer Dialog */}
        <ReceiptPrinter isOpen={showReceiptDialog} onClose={() => setShowReceiptDialog(false)} receiptData={lastSaleData} autoPrint={shouldAutoPrint} />
      </div>
    </>
  );
};

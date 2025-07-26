import { menuAPI } from "@/api/menu.api.ts.tsx";
import { ordersAPI } from "@/api/orders.api";
import { posAPI } from "@/api/pos.api.ts";
import { stockAPI } from "@/api/stock.api.ts.tsx";
import { tablesAPI } from "@/api/tables.api";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useOrderManagement } from "@/hooks/useOrderManagement";
import { MenuItem, NegativeStockWarning, OrderType, POSCartItem, POSClientProps, ReceiptData, SaleResponse, SectionAssignment, StockEntryWithMaterial, Table } from "@/types/inventory";
import { formatCurrency } from "@/utils/conversionLogic";
import { LocalOrderData, OrderPersistence } from "@/utils/orderPersistence";
import { AlertCircle, AlertTriangle, Check, Save, Trash2 } from "lucide-react";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { ActionBar } from "./ActionBar";
import { CategoryTabs } from "./CategoryTabs";
import { OrderItemsList } from "./OrderItemsList";
import { OrderSummary } from "./OrderSummary";
import { PaymentDialog } from "./PaymentDialog";
import { ProductGrid } from "./ProductGrid";
import { ReceiptPrinter } from "./ReceiptPrinter";
import { TablesLayout } from "./TablesLayout";

export const POSClient: React.FC<POSClientProps> = ({ sectionAssignments, onSaleComplete }) => {
  const [selectedSectionId] = useState<string>("");
  const [cart, setCart] = useState<POSCartItem[]>([]);
  const [searchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [stockEntries, setStockEntries] = useState<StockEntryWithMaterial[]>([]);
  const [optimisticAssignments, setOptimisticAssignments] = useState<SectionAssignment[]>(sectionAssignments);
  const [negativeStockWarnings, setNegativeStockWarnings] = useState<NegativeStockWarning[]>([]);
  const [showNegativeStockDialog, setShowNegativeStockDialog] = useState(false);
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState<string>("");
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [showReceiptDialog, setShowReceiptDialog] = useState(false);
  const [lastSaleData, setLastSaleData] = useState<ReceiptData | null>(null);
  const [orderType, setOrderType] = useState<OrderType>("takeaway");
  const [selectedTable, setSelectedTable] = useState<Table | undefined>(undefined);
  const [showTablesLayout, setShowTablesLayout] = useState(false);
  const [tables, setTables] = useState<Table[]>([]);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [showUnsavedDialog, setShowUnsavedDialog] = useState(false);
  const [lastAutoSave, setLastAutoSave] = useState<Date | null>(null);
  const errorTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const successTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const autoSaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Order management hook
  const { currentOrder, isLoading: orderLoading, error: orderError, createOrder, loadOrder, updateOrder, updateOrderStatus, completeOrder, clearOrder } = useOrderManagement();

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

  // Update optimistic assignments when props change
  useEffect(() => {
    setOptimisticAssignments(sectionAssignments);
  }, [sectionAssignments]);

  // Fetch initial data (stock entries, menu items, tables)
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        setIsLoading(true);

        // Fetch stock entries
        const stockResponse = await stockAPI.getStockEntries();
        const stockData = stockResponse.data || [];
        setStockEntries(stockData);

        // Fetch menu items
        const menuResponse = await menuAPI.getMenus();
        const menuData = menuResponse.data || [];
        setMenuItems(menuData);

        // Fetch tables with order information
        const tablesResponse = await tablesAPI.getTables({ includeOrders: true });
        console.log("Tables API response:", tablesResponse);

        // Handle both possible response structures
        const responseData = tablesResponse.data as Table[] | { data: Table[] };
        const tablesData = Array.isArray(responseData) ? responseData : responseData.data || [];
        console.log("Final tablesData:", tablesData, "Length:", tablesData.length);
        setTables(tablesData);
      } catch (error) {
        console.error("Failed to fetch initial data:", error);
        showError("Failed to load data");
      } finally {
        setIsLoading(false);
      }
    };

    fetchInitialData();
  }, [showError]);

  // Auto-save functionality
  const scheduleAutoSave = useCallback(() => {
    if (autoSaveTimeoutRef.current) {
      clearTimeout(autoSaveTimeoutRef.current);
    }

    autoSaveTimeoutRef.current = setTimeout(() => {
      if (cart.length > 0) {
        handleAutoSave();
      }
    }, 3000); // 3 seconds delay
  }, [cart]);

  const handleAutoSave = useCallback(async () => {
    // Only auto-save if we have a current order with a valid ID
    const orderId = currentOrder?.id || (currentOrder as any)?.data?.id;
    if (!currentOrder || !orderId) {
      console.log("🔍 Auto-save skipped: No current order ID");
      return;
    }

    try {
      console.log("🔍 Auto-saving order:", orderId);
      // Convert POSCartItem[] to OrderItem[]
      const items = cart.map(cartItem => ({
        id: cartItem.id,
        materialId: cartItem.type === "material" ? cartItem.originalItem.id : undefined,
        menuItemId: cartItem.type === "menu" ? cartItem.originalItem.id : undefined,
        assignmentId: undefined, // Assignment info is handled separately
        name: cartItem.name,
        quantity: cartItem.quantity,
        unitPrice: cartItem.price,
        totalPrice: cartItem.price * cartItem.quantity,
        type: cartItem.type,
        notes: undefined
      }));

      const orderData: LocalOrderData = {
        orderType,
        tableId: selectedTable?.id,
        tableNumber: selectedTable?.number,
        customerName: undefined, // Add customer info if needed
        customerPhone: undefined,
        customerAddress: undefined,
        items,
        notes: undefined,
        lastModified: Date.now(),
        autoSaveEnabled: true
      };

      // Save to localStorage
      OrderPersistence.saveCurrentOrder(orderData);
      setLastAutoSave(new Date());
      setHasUnsavedChanges(false);

      // Also try to save to backend if we have an order
      if (currentOrder) {
        const items = cart.map(cartItem => {
          if (cartItem.type === "material") {
            const stockEntry = cartItem.originalItem as StockEntryWithMaterial;
            return {
              type: "individual" as const,
              materialId: stockEntry.materialId || "",
              materialName: stockEntry.material?.name || cartItem.name,
              quantity: cartItem.quantity,
              unitPrice: cartItem.price,
              totalPrice: cartItem.price * cartItem.quantity
            };
          } else {
            const menuItem = cartItem.originalItem as MenuItem;
            return {
              type: "menu" as const,
              menuItemId: menuItem.id,
              menuItemName: menuItem.name,
              quantity: cartItem.quantity,
              unitPrice: cartItem.price,
              totalPrice: cartItem.price * cartItem.quantity
            };
          }
        });

        await updateOrder({
          items,
          orderType,
          tableId: selectedTable?.id,
          totalAmount: cart.reduce((sum, item) => sum + item.price * item.quantity, 0)
        });
      }
    } catch (error) {
      console.error("Auto-save failed:", error);
    }
  }, [cart, orderType, selectedTable, currentOrder, updateOrder]);

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
            originalItem = stockEntries.find(se => se.materialId === item.materialId) || stockEntries[0];
          } else if (item.type === "menu" && item.menuItemId) {
            // Find the menu item by menuItemId
            originalItem = menuItems.find(m => m.id === item.menuItemId) || menuItems[0];
          } else {
            // Fallback to first available item
            originalItem = stockEntries[0] || menuItems[0];
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

  // Schedule auto-save when cart changes
  useEffect(() => {
    console.log("🔍 Auto-save useEffect triggered. Cart length:", cart.length, "currentOrder:", currentOrder);
    if (cart.length > 0) {
      setHasUnsavedChanges(true);
      // Only schedule auto-save if we have a current order to update
      const orderId = currentOrder?.id || (currentOrder as any)?.data?.id;
      if (currentOrder && orderId) {
        console.log("🔍 Scheduling auto-save for order:", orderId);
        scheduleAutoSave();
      } else {
        console.log("🔍 Auto-save not scheduled: No current order ID. CurrentOrder:", currentOrder);
      }
    } else {
      // Clear saved order when cart is empty
      OrderPersistence.clearCurrentOrder();
      setHasUnsavedChanges(false);
      setLastAutoSave(null);
    }
  }, [cart, scheduleAutoSave, currentOrder]);

  // Additional effect to handle auto-save when currentOrder is set after loading
  useEffect(() => {
    const orderId = currentOrder?.id || (currentOrder as any)?.data?.id;
    if (currentOrder && orderId && cart.length > 0 && hasUnsavedChanges) {
      console.log("🔍 CurrentOrder is now set, scheduling auto-save for:", orderId);
      scheduleAutoSave();
    }
  }, [currentOrder, cart.length, hasUnsavedChanges, scheduleAutoSave]);

  // Cleanup auto-save timeout on unmount
  useEffect(() => {
    return () => {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }
    };
  }, []);

  // Fetch menu items
  useEffect(() => {
    const fetchMenuItems = async () => {
      try {
        const response = await menuAPI.getMenus();
        setMenuItems(response.data);
      } catch (error) {
        console.error("Failed to fetch menu items:", error);
        showError("Failed to load menu items");
      }
    };

    fetchMenuItems();
  }, [showError]);

  // Get available stock entries (filter by search term and available quantity)
  const availableStockEntries = stockEntries.filter(stockEntry => {
    // Check if stock entry has available quantity
    const hasQuantity = stockEntry.purchasedIndividualQuantity && stockEntry.purchasedIndividualQuantity > 0;

    // Check search term
    const matchesSearch = searchTerm === "" || stockEntry.material?.name.toLowerCase().includes(searchTerm.toLowerCase()) || stockEntry.material?.category?.toLowerCase().includes(searchTerm.toLowerCase());

    return hasQuantity && matchesSearch;
  });

  // Get available menu items
  const availableMenuItems = menuItems.filter(menuItem => searchTerm === "" || menuItem.name.toLowerCase().includes(searchTerm.toLowerCase()) || menuItem.category?.toLowerCase().includes(searchTerm.toLowerCase()));

  // Get unique categories
  const categories = ["all", ...Array.from(new Set([...availableStockEntries.map(item => item.material?.category).filter(Boolean), ...availableMenuItems.map(item => item.category).filter(Boolean)]))];

  // Filter items by category
  const filteredStockEntries = activeCategory === "all" ? availableStockEntries : availableStockEntries.filter(item => item.material?.category === activeCategory);

  const filteredMenuItems = activeCategory === "all" ? availableMenuItems : availableMenuItems.filter(item => item.category === activeCategory);

  // Cart operations
  const addToCart = useCallback((item: StockEntryWithMaterial | MenuItem, type: "material" | "menu") => {
    const cartId = type === "material" ? `material-${item.id}` : `menu-${item.id}`;

    setCart(prevCart => {
      const existingItem = prevCart.find(cartItem => cartItem.id === cartId);

      if (existingItem) {
        return prevCart.map(cartItem => (cartItem.id === cartId ? { ...cartItem, quantity: cartItem.quantity + 1 } : cartItem));
      } else {
        // Calculate price for material items
        let itemPrice = 0;
        if (type === "material") {
          // Get cost from stock entry directly
          const stockEntry = item as StockEntryWithMaterial;
          // Try costPerBaseUnit first (this is the cost per individual unit)
          if (stockEntry.costPerBaseUnit && stockEntry.costPerBaseUnit.toString() !== "0") {
            itemPrice = parseFloat(stockEntry.costPerBaseUnit.toString());
          }
          // Fallback: calculate from totalCost and individual quantity
          else if (stockEntry.totalCost && stockEntry.purchasedIndividualQuantity) {
            itemPrice = parseFloat(stockEntry.totalCost.toString()) / stockEntry.purchasedIndividualQuantity;
          }
        } else {
          itemPrice = (item as MenuItem).price || 0;
        }

        const newItem: POSCartItem = {
          id: cartId,
          name: type === "material" ? (item as StockEntryWithMaterial).material?.name || "Unknown" : (item as MenuItem).name,
          price: itemPrice,
          quantity: 1,
          type,
          originalItem: item
        };
        return [...prevCart, newItem];
      }
    });
  }, []);

  const updateCartQuantity = useCallback((cartId: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      setCart(prevCart => prevCart.filter(item => item.id !== cartId));
    } else {
      setCart(prevCart => prevCart.map(item => (item.id === cartId ? { ...item, quantity: newQuantity } : item)));
    }
  }, []);

  const clearCart = useCallback(() => {
    setCart([]);
  }, []);

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
      console.log("🔍 Table selected:", table);
      console.log("🔍 Table status:", table.status);
      console.log("🔍 Table currentOrder:", table.currentOrder);

      setSelectedTable(table);
      setOrderType("table");
      setShowTablesLayout(false);

      // If table is opened and has currentOrder, load existing order
      if (table.status === "opened" && table.currentOrder) {
        console.log("🔍 Loading order for opened table...");
        try {
          // Get the full order details using the orderId from currentOrder
          console.log("🔍 Fetching order with ID:", table.currentOrder.orderId);
          const response = await ordersAPI.getOrder(table.currentOrder.orderId);
          // Handle nested response structure - API sometimes returns nested data
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const responseData = response.data as { data?: any } | any;
          const existingOrder = responseData.data || responseData;
          console.log("🔍 Fetched order:", existingOrder);

          if (existingOrder && existingOrder.items) {
            console.log("🔍 Order items:", existingOrder.items);
            console.log("🔍 Available stockEntries:", stockEntries.length);
            console.log("🔍 Available menuItems:", menuItems.length);

            // Load the order using order management hook to set currentOrder state
            const loadedOrder = await loadOrder(existingOrder.id);
            console.log("🔍 Loaded order:", loadedOrder);
            console.log("🔍 After loadOrder, currentOrder state:", currentOrder);

            // Convert order items to cart items
            const cartItems: POSCartItem[] = existingOrder.items.map(item => {
              console.log("🔍 Processing item:", item);
              let originalItem: StockEntryWithMaterial | MenuItem;

              if (item.type === "material" && item.materialId) {
                // Find the stock entry by materialId
                originalItem = stockEntries.find(se => se.materialId === item.materialId) || stockEntries[0];
                console.log("🔍 Found material originalItem:", originalItem);
              } else if (item.type === "menu" && item.menuItemId) {
                // Find the menu item by menuItemId
                originalItem = menuItems.find(m => m.id === item.menuItemId) || menuItems[0];
                console.log("🔍 Found menu originalItem:", originalItem);
              } else {
                // Fallback to first available item
                originalItem = stockEntries[0] || menuItems[0];
                console.log("🔍 Using fallback originalItem:", originalItem);
              }

              const cartItem = {
                id: item.id,
                name: item.name,
                price: parseFloat(item.unitPrice.toString()),
                quantity: item.quantity,
                type: item.type as "material" | "menu",
                originalItem
              };
              console.log("🔍 Created cart item:", cartItem);
              return cartItem;
            });

            console.log("🔍 Final cart items:", cartItems);
            setCart(cartItems);
            showSuccess(`Loaded existing order ${existingOrder.orderNumber} for Table ${table.number}`);
          } else {
            console.log("🔍 No existing order or items found");
          }
        } catch (error) {
          console.error("🔍 Failed to load table order:", error);
          showError("Failed to load existing table order");
        }
      } else {
        console.log("🔍 Table is not opened or has no currentOrder");
      }
    },
    [loadOrder, menuItems, stockEntries, showSuccess, showError]
  );

  // Save current order as draft
  const handleSaveOrder = useCallback(async () => {
    if (cart.length === 0) {
      showError("Cannot save empty order");
      return;
    }

    try {
      const orderData = {
        orderType,
        tableId: selectedTable?.id,
        items: cart.map(item => ({
          // Don't include id for new order items (CreateOrderData expects Omit<OrderItem, "id">[])
          materialId: item.type === "material" ? (item.originalItem as StockEntryWithMaterial).materialId : undefined,
          menuItemId: item.type === "menu" ? (item.originalItem as MenuItem).id : undefined,
          assignmentId: undefined, // Assignment info is handled separately
          name: item.name,
          quantity: item.quantity,
          unitPrice: item.price,
          totalPrice: item.price * item.quantity,
          type: item.type,
          notes: undefined
        }))
      };

      if (currentOrder) {
        // For updates, we need to include existing item IDs or generate new ones
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
        await createOrder(orderData);
        showSuccess("Order saved as draft");
      }

      // Refresh tables to update status in UI
      if (orderType === "table") {
        try {
          const tablesResponse = await tablesAPI.getTables({ includeOrders: true });
          const responseData = tablesResponse.data as Table[] | { data: Table[] };
          const refreshedTables = Array.isArray(responseData) ? responseData : responseData.data || [];
          setTables(refreshedTables);
        } catch (error) {
          console.error("Failed to refresh tables:", error);
        }
      }

      setHasUnsavedChanges(false);
    } catch (error) {
      console.error("Failed to save order:", error);
      showError("Failed to save order");
    }
  }, [cart, orderType, selectedTable, currentOrder, updateOrder, createOrder, showSuccess, showError]);

  const handleCloseTablesLayout = useCallback(() => {
    setShowTablesLayout(false);
  }, []);

  // Calculate totals
  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const tax = subtotal * 0.1; // 10% tax
  const total = subtotal + tax;

  // Handle payment
  const handlePayment = useCallback(async () => {
    if (cart.length === 0) {
      showError("Cart is empty");
      return;
    }

    setIsLoading(true);
    try {
      // If we have a current order, complete it through the order system
      if (currentOrder) {
        const paymentData = {
          paymentMethod: "cash",
          paymentAmount: parseFloat(paymentAmount) || total,
          change: Math.max(0, (parseFloat(paymentAmount) || total) - total)
        };

        const { order, saleId } = await completeOrder(paymentData);

        // Prepare receipt data from completed order
        const receiptData = {
          id: saleId,
          date: new Date().toLocaleDateString(),
          time: new Date().toLocaleTimeString(),
          cashier: "Current User",
          items: order.items.map(item => ({
            name: item.name,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            totalPrice: item.totalPrice,
            type: item.type
          })),
          subtotal: order.subtotal,
          tax: order.tax,
          total: order.total,
          paymentAmount: paymentData.paymentAmount,
          change: paymentData.change || 0,
          paymentMethod: paymentData.paymentMethod
        };

        setLastSaleData(receiptData);
        showSuccess(`Order completed successfully! Total: ${formatCurrency(order.total)}`);

        // Update table status if this was a table order
        if (selectedTable && orderType === "table") {
          try {
            // Clear table reservation/status
            await tablesAPI.clearReservation(selectedTable.id);
            // Refresh tables to update UI
            const tablesResponse = await tablesAPI.getTables({ includeOrders: true });
            const responseData = tablesResponse.data as Table[] | { data: Table[] };
            const refreshedTables = Array.isArray(responseData) ? responseData : responseData.data || [];
            setTables(refreshedTables);
          } catch (error) {
            console.error("Failed to clear table:", error);
          }
        }
      } else {
        // Fallback to direct sale creation for backward compatibility
        const saleData = {
          sectionId: selectedSectionId || sections[0]?.id,
          saleDate: new Date(),
          items: cart
            .filter(item => item.type === "material")
            .map(item => ({
              materialId: (item.originalItem as StockEntryWithMaterial).materialId || "",
              assignmentId: item.originalItem.id,
              sectionId: (item.originalItem as StockEntryWithMaterial).sectionId,
              quantity: item.quantity,
              unit: (item.originalItem as StockEntryWithMaterial).assignedUnit || "piece",
              unitPrice: item.price,
              totalPrice: item.price * item.quantity,
              materialName: item.name
            })),
          menuItems: cart
            .filter(item => item.type === "menu")
            .map(item => ({
              menuItemId: (item.originalItem as MenuItem).id,
              quantity: item.quantity,
              unitPrice: item.price,
              totalPrice: item.price * item.quantity,
              menuItemName: item.name,
              ingredients: [],
              createdAt: new Date(),
              updatedAt: new Date()
            })),
          totalAmount: total,
          paymentAmount: parseFloat(paymentAmount) || total,
          paymentMethod: "cash",
          createdAt: new Date(),
          updatedAt: new Date()
        };

        const response = await posAPI.createSale(saleData);

        if (response.data?.negativeStockWarnings && response.data.negativeStockWarnings.length > 0) {
          setNegativeStockWarnings(response.data.negativeStockWarnings);
          setShowNegativeStockDialog(true);
        }

        // Prepare receipt data
        const receiptData = {
          id: response.data?.sale?.id || `POS-${Date.now()}`,
          date: new Date().toLocaleDateString(),
          time: new Date().toLocaleTimeString(),
          cashier: "Current User",
          items: cart.map(item => ({
            name: item.name,
            quantity: item.quantity,
            unitPrice: item.price,
            totalPrice: item.price * item.quantity,
            type: item.type
          })),
          subtotal,
          tax,
          total,
          paymentAmount: parseFloat(paymentAmount) || total,
          change: Math.max(0, (parseFloat(paymentAmount) || total) - total),
          paymentMethod: "cash"
        };

        setLastSaleData(receiptData);
        showSuccess(`Sale completed successfully! Total: ${formatCurrency(total)}`);

        // Update optimistic assignments
        if (response?.data && "updatedAssignments" in response.data && response.data.updatedAssignments) {
          setOptimisticAssignments(response.data.updatedAssignments as SectionAssignment[]);
        }
      }

      clearCart();
      setPaymentAmount("");
      setShowPaymentDialog(false);
      setShowReceiptDialog(true);

      // Clear current order and local storage
      clearOrder();
      OrderPersistence.clearCurrentOrder();
      setHasUnsavedChanges(false);
      setLastAutoSave(null);

      // Callback for parent component
      if (onSaleComplete) {
        // Create a mock response for the callback
        const mockResponse = {
          sale: { id: Date.now().toString() } as any,
          message: "Sale completed"
        } as SaleResponse;
        onSaleComplete(mockResponse);
      }
    } catch (error: unknown) {
      console.error("Sale failed:", error);
      const errorMessage = error && typeof error === "object" && "response" in error && error.response && typeof error.response === "object" && "data" in error.response && error.response.data && typeof error.response.data === "object" && "message" in error.response.data ? (error.response.data.message as string) : "Sale failed. Please try again.";
      showError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [cart, selectedSectionId, total, paymentAmount, subtotal, tax, showError, showSuccess, clearCart, onSaleComplete, currentOrder, completeOrder, selectedTable, orderType, clearOrder]);

  // Quick amount buttons for payment
  const quickAmounts = [10, 20, 50, 100, 200, 500];

  return (
    <div className="h-full flex bg-gray-100">
      {/* Left Panel - Cart/Order Details */}
      <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
        {/* Cart Header */}
        <div className="border-b border-gray-200 p-3">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-gray-800">Current Order</h2>
            {cart.length > 0 && <Trash2 className="w-6 h-6 mr-1 cursor-pointer text-red-600 hover:text-red-700" onClick={clearCart} />}
          </div>
        </div>

        {/* Order Items List */}
        <OrderItemsList cart={cart} updateCartQuantity={updateCartQuantity} orderType={orderType} selectedTable={selectedTable} onOrderTypeChange={handleOrderTypeChange} onTableSelect={handleTableSelect} />

        {/* Order Summary */}
        <OrderSummary cart={cart} subtotal={subtotal} total={total} onPaymentClick={() => setShowPaymentDialog(true)} />
      </div>

      {/* Right Panel - Product Grid */}
      <div className="flex-1 flex flex-col bg-white">
        {/* Top Controls */}
        <CategoryTabs categories={categories} activeCategory={activeCategory} onCategoryChange={setActiveCategory} />
        {/* Product Grid */}
        <ProductGrid filteredItems={filteredStockEntries} filteredMenuItems={filteredMenuItems} onAddToCart={addToCart} />

        {/* Bottom Action Bar */}
        <ActionBar onSaveOrder={handleSaveOrder} hasUnsavedChanges={hasUnsavedChanges} isOrderLoading={orderLoading} />
      </div>

      {/* Payment Dialog */}
      <PaymentDialog isOpen={showPaymentDialog} onClose={() => setShowPaymentDialog(false)} total={total} paymentAmount={paymentAmount} onPaymentAmountChange={setPaymentAmount} onPayment={handlePayment} isLoading={isLoading} />

      {/* Negative Stock Warning Dialog */}
      <Dialog open={showNegativeStockDialog} onOpenChange={setShowNegativeStockDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <AlertTriangle className="w-5 h-5 text-amber-500" />
              <span>Stock Warning</span>
            </DialogTitle>
            <DialogDescription>Some items have low or negative stock levels</DialogDescription>
          </DialogHeader>

          <div className="space-y-2 max-h-60 overflow-y-auto">
            {negativeStockWarnings.map((warning, index) => (
              <Alert key={index}>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <strong>{warning.materialName}</strong>: Low stock - Available: {warning.availableQuantity}, Required: {warning.requiredQuantity}
                </AlertDescription>
              </Alert>
            ))}
          </div>

          <DialogFooter>
            <Button onClick={() => setShowNegativeStockDialog(false)}>Acknowledge</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Tables Layout Dialog */}
      {showTablesLayout && <TablesLayout tables={Array.isArray(tables) ? tables : []} selectedTable={selectedTable} onTableSelect={handleTableSelection} onClose={handleCloseTablesLayout} />}

      {/* Receipt Printer Dialog */}
      <ReceiptPrinter isOpen={showReceiptDialog} onClose={() => setShowReceiptDialog(false)} receiptData={lastSaleData} />

      {/* Order Status Indicator */}
      {(hasUnsavedChanges || currentOrder || lastAutoSave) && (
        <div className="fixed top-4 left-4 z-50">
          <Alert className="bg-blue-50 border-blue-200">
            <Save className="h-4 w-4 text-blue-600" />
            <AlertDescription className="text-blue-800">
              {currentOrder ? (
                <div className="flex items-center space-x-2">
                  <span>Order #{currentOrder.orderNumber}</span>
                  <span className="text-xs">({currentOrder.status})</span>
                </div>
              ) : hasUnsavedChanges ? (
                "Unsaved changes"
              ) : lastAutoSave ? (
                `Auto-saved at ${lastAutoSave.toLocaleTimeString()}`
              ) : null}
            </AlertDescription>
          </Alert>
        </div>
      )}

      {/* Unsaved Changes Dialog */}
      <Dialog open={showUnsavedDialog} onOpenChange={setShowUnsavedDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <AlertTriangle className="w-5 h-5 text-amber-500" />
              <span>Unsaved Changes</span>
            </DialogTitle>
            <DialogDescription>You have unsaved changes in your current order. Would you like to save them?</DialogDescription>
          </DialogHeader>
          <DialogFooter>
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
                handleSaveOrder();
                setShowUnsavedDialog(false);
              }}
            >
              Save Order
            </Button>
          </DialogFooter>
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
    </div>
  );
};

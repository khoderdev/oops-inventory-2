import { menuAPI } from "@/api/menu.api.ts.tsx";
import { ordersAPI } from "@/api/orders.api";
import { printerAPI } from "@/api/printer.api";
import { tablesAPI } from "@/api/tables.api";
import { getCategoriesByType } from "@/api/categories.api";
import { usePrefetch } from "@/hooks/usePrefetch";
import { useOrdersPrefetch } from "@/hooks/useOrdersPrefetch";
import { useOrderManagement } from "@/hooks/useOrderManagement";
import { usePrinterSelector } from "@/hooks/usePrinterSelector";
import { Employee } from "@/types/employee";
import { MenuItem, NegativeStockWarning, POSCartItem, POSClientProps, POSItem, ReceiptData, SaleResponse, SectionAssignment, StockEntryWithMaterial, Table } from "@/types/inventory";
import { OrderSummary as OrderSummaryType, OrderType } from "@/types/orders";
import { generatePreviewOrderNumber } from "@/utils/orderNumberGenerator";
import { OrderPersistence } from "@/utils/orderPersistence";
import { formatItemsForPrinter } from "@/utils/thermalPrinterFormatter";
import { useVoidPrinter } from "./VoidPrinter";
import { usePOSHandlers } from "./usePOSHandlers";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

export const usePOS = ({ sectionAssignments, onSaleComplete, onOrderSelect, selectedOrderForPOS, onOrderProcessed, refreshCountsRef }: POSClientProps) => {
  // API hooks
  const { stock, menu, status, refresh: refreshInventory } = usePrefetch({ autoFetch: true, parallel: true, onError: error => console.error("❌ Failed to load inventory data:", error) });
  const handleOrdersError = useCallback((error: Error) => {
    console.error("❌ Failed to load orders data:", error);
  }, []);
  const orderDataTypes = useMemo(() => ["orderSummaries"] as ("orderSummaries" | "orders")[], []);
  const { refresh: refreshOrders } = useOrdersPrefetch({ autoFetch: true, dataTypes: orderDataTypes, onError: handleOrdersError });
  const { currentOrder, isLoading: orderLoading, createOrder, loadOrder, updateOrder, voidOrder, clearOrder } = useOrderManagement();
  const { selectedPrinter, selectPrinter, clearSelection, hasSavedPrinter, getSavedPrinter } = usePrinterSelector();
  const { printVoidReceiptsForRemovedItems } = useVoidPrinter({ showSuccess: () => {}, showError: () => {} });

  // State variables
  const [cart, setCart] = useState<POSCartItem[]>([]);
  const [searchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [stockEntries, setStockEntries] = useState<StockEntryWithMaterial[]>([]);
  const [posItems, setPosItems] = useState<POSItem[]>([]);
  const [categoriesMap, setCategoriesMap] = useState<Map<number, string>>(new Map());
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
  const [leftPanelWidth, setLeftPanelWidth] = useState(33.3);
  const [rightPanelPixelWidth, setRightPanelPixelWidth] = useState(0);
  const [isResizing, setIsResizing] = useState(false);
  const [showDiscountDialog, setShowDiscountDialog] = useState(false);
  const [showNotesDialog, setShowNotesDialog] = useState(false);
  const [showItemNotesDialog, setShowItemNotesDialog] = useState(false);
  const [selectedItemForNotes, setSelectedItemForNotes] = useState<POSCartItem | null>(null);
  const [orderNotes, setOrderNotes] = useState<string>("");
  const [discountAmount, setDiscountAmount] = useState<number>(0);
  const [appliedDiscount, setAppliedDiscount] = useState<{ type: "percentage" | "fixed"; value: number; amount: number; reason?: string } | null>(null);
  const [showPrinterSelector, setShowPrinterSelector] = useState(false);
  const [printerSelectionContext, setPrinterSelectionContext] = useState<"payment" | "manual_print" | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Refs
  const errorTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const successTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const checkmarkTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const processedOrderRef = useRef<string | null>(null);
  const justSavedRef = useRef<boolean>(false);
  const completedOrdersRef = useRef<Set<string>>(new Set());
  const containerRef = useRef<HTMLDivElement>(null);

  // Computed values
  const categories = useMemo(() => {
    const uniqueCategories = new Set<string>();
    uniqueCategories.add("all");
    posItems.forEach(item => {
      if (item.category && typeof item.category === "string") {
        uniqueCategories.add(item.category);
      }
    });
    return Array.from(uniqueCategories);
  }, [posItems]);

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

  const availablePosItems = posItems.filter(posItem => {
    const matchesSearch = searchTerm === "" || posItem.name.toLowerCase().includes(searchTerm.toLowerCase()) || posItem.category?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  const filteredPosItems = activeCategory === "all" ? availablePosItems : availablePosItems.filter(item => item.category === activeCategory);

  // Utility functions
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

  // Handler functions from usePOSHandlers
  const handlers = usePOSHandlers({
    // Cart and order state
    cart, setCart, currentOrder, subtotal, total, appliedDiscount, setAppliedDiscount, discountAmount, setDiscountAmount,
    
    // UI state management
    setOrderType, setSelectedTable, setShowTablesLayout, setHasUnsavedChanges, setIsPaymentCompleted, setIsTableManuallySelected,
    
    // Dialog states
    setShowOrdersDialog, setShowReportsDialog, setShowDiscountDialog, setShowItemNotesDialog, setSelectedItemForNotes,
    setShowReceiptDialog, setLastSaleData, lastSaleData, setShowPrinterSelector, setPrinterSelectionContext, printerSelectionContext,
    
    // Order counts and tracking
    setIncompleteOrdersCount, setTableOrders, setIncompleteTableOrdersCount, setIncompleteDeliveryTakeawayCount,
    setIncompleteDeliveryCount: () => {}, // placeholder
    setIncompleteTakeawayCount: () => {}, // placeholder
    
    // Refs and utilities
    processedOrderRef, selectPrinter, showError, showSuccess, onOrderSelect
  });

  // Effects
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

  useEffect(() => {
    // Completely block selectedOrderForPOS when table is manually selected
    if (justSavedRef.current) {
      console.log("🚫 Blocking selectedOrderForPOS due to recent save");
      return;
    }
    if (isTableManuallySelected) {
      console.log("🚫 Completely blocking selectedOrderForPOS due to manual table selection:", {
        selectedOrderId: selectedOrderForPOS?.id,
        tableManuallySelected: isTableManuallySelected
      });
      return;
    }

    // Block selectedOrderForPOS if there's already a current order being edited
    if (currentOrder && selectedOrderForPOS && currentOrder.id && selectedOrderForPOS.id && currentOrder.id.toString() === selectedOrderForPOS.id.toString()) {
      console.log("🚫 Blocking selectedOrderForPOS - order already loaded and being edited:", {
        currentOrderId: currentOrder.id,
        selectedOrderId: selectedOrderForPOS.id
      });
      return;
    }

    // Block if order has been completed
    if (selectedOrderForPOS && completedOrdersRef.current.has(selectedOrderForPOS.id.toString())) {
      console.log("🚫 Blocking selectedOrderForPOS - order has been completed:", {
        orderId: selectedOrderForPOS.id,
        completedOrders: Array.from(completedOrdersRef.current)
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
      if (selectedOrderForPOS.status === "completed" || selectedOrderForPOS.status === "paid") {
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
  }, [selectedOrderForPOS, loadOrder, posItems, isPaymentCompleted, isTableManuallySelected, tables]);

  useEffect(() => {
    if (currentOrder && currentOrder.items && currentOrder.items.length > 0) {
      if (justSavedRef.current) {
        console.log("🚫 Blocking currentOrder cart reload - recent save");
        return;
      }
      const currentOrderId = currentOrder.id.toString();
      console.log("📋 Current order loaded:", { orderId: currentOrderId, items: currentOrder.items.length });

      // Don't reload cart if user is actively editing (has unsaved changes)
      if (hasUnsavedChanges) {
        console.log("🚫 Blocking currentOrder cart reload - user has unsaved changes");
        return;
      }

      // CRITICAL FIX: Don't reload if this order was already loaded by selectedOrderForPOS effect
      // Only block if the cart actually has items (meaning selectedOrderForPOS effect successfully loaded it)
      if (selectedOrderForPOS && selectedOrderForPOS.id.toString() === currentOrderId && cart.length > 0) {
        console.log("🚫 Blocking currentOrder cart reload - order already loaded by selectedOrderForPOS effect:", {
          currentOrderId,
          selectedOrderId: selectedOrderForPOS.id,
          cartItems: cart.length
        });
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
  }, [currentOrder, selectedOrderForPOS, tables, hasUnsavedChanges, cart.length]);

  // Fetch categories mapping - ONLY ACTIVE CATEGORIES
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        console.log("📂 Fetching ACTIVE categories for POS");
        const [menuCategories, materialCategories] = await Promise.all([getCategoriesByType("menu_items"), getCategoriesByType("materials")]);

        const categoryMap = new Map<number, string>();

        // Add ONLY ACTIVE menu categories
        if (menuCategories?.totalItems) {
          menuCategories.totalItems
            .filter(category => category.isActive) // Only include active categories
            .forEach(category => {
              categoryMap.set(category.id, category.name);
            });
        }

        // Add ONLY ACTIVE material categories
        if (materialCategories?.totalItems) {
          materialCategories.totalItems
            .filter(category => category.isActive) // Only include active categories
            .forEach(category => {
              categoryMap.set(category.id, category.name);
            });
        }

        console.log("📂 ACTIVE categories map created:", { size: categoryMap.size });
        setCategoriesMap(categoryMap);
      } catch (error) {
        console.error("❌ Failed to fetch categories:", error);
      }
    };

    fetchCategories();
  }, []);

  useEffect(() => {
    if (menu && stock && categoriesMap.size > 0) {
      console.log("🛍️ Converting menu and stock to POS items");
      const convertToPOSItems = () => {
        const posItemsFromData: POSItem[] = [];
        menu.forEach(menuItem => {
          if (menuItem.isPOSItem) {
            // Extract category ID from category object or use the category directly if it's already an ID
            let categoryId: number;
            if (menuItem.category && typeof menuItem.category === "object" && "id" in menuItem.category) {
              categoryId = (menuItem.category as any).id;
            } else if (menuItem.category && typeof menuItem.category === "number") {
              categoryId = menuItem.category;
            } else {
              console.warn("⚠️ Invalid category format for menu item:", menuItem.name, menuItem.category);
              categoryId = 0;
            }
            const categoryName = categoriesMap.get(categoryId);

            // COMPLETELY HIDE items with deactivated categories - don't add them to POS
            if (!categoryName) {
              console.log(`🚫 Hiding menu item '${menuItem.name}' - category is deactivated`);
              return; // Skip this item completely
            }

            posItemsFromData.push({
              id: `menu-${menuItem.id}`,
              name: menuItem.name,
              price: menuItem.price,
              category: categoryName,
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
            // Extract category ID from category object or use the category directly if it's already an ID
            let categoryId: number;
            const category = stockEntry.material.category;

            if (category === null || category === undefined) {
              console.warn("⚠️ Null or undefined category for stock entry:", stockEntry.material.name);
              categoryId = 0;
            } else if (typeof category === "number") {
              categoryId = category;
            } else if (typeof category === "object" && category !== null && "id" in category) {
              categoryId = (category as any).id;
            } else {
              console.warn("⚠️ Invalid category type for stock entry:", stockEntry.material.name, category);
              categoryId = 0;
            }
            const categoryName = categoriesMap.get(categoryId);

            // COMPLETELY HIDE items with deactivated categories - don't add them to POS
            if (!categoryName) {
              console.log(`🚫 Hiding stock item '${stockEntry.material.name}' - category is deactivated`);
              return; // Skip this item completely
            }

            posItemsFromData.push({
              id: `stock-${stockEntry.id}`,
              name: stockEntry.material.name,
              price: stockEntry.costPerBaseUnit || 0,
              category: categoryName,
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
        console.log("🛍️ POS items generated with category names:", { count: posItemsFromData.length });
        setPosItems(posItemsFromData);
      };
      convertToPOSItems();
    }
  }, [menu, stock, status.isLoading, categoriesMap]);

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

  // Additional handler functions that need access to state
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

  // Return all the state and functions needed by the component
  return {
    // State
    cart,
    setCart,
    searchTerm,
    isLoading,
    setIsLoading,
    error,
    setError,
    successMessage,
    setSuccessMessage,
    menuItems,
    setMenuItems,
    stockEntries,
    setStockEntries,
    posItems,
    setPosItems,
    categoriesMap,
    setCategoriesMap,
    optimisticAssignments,
    setOptimisticAssignments,
    negativeStockWarnings,
    showNegativeStockDialog,
    setShowNegativeStockDialog,
    showPaymentDialog,
    setShowPaymentDialog,
    paymentAmount,
    setPaymentAmount,
    activeCategory,
    setActiveCategory,
    showReceiptDialog,
    setShowReceiptDialog,
    lastSaleData,
    setLastSaleData,
    orderType,
    setOrderType,
    selectedTable,
    setSelectedTable,
    selectedEmployee,
    setSelectedEmployee,
    showTablesLayout,
    setShowTablesLayout,
    tables,
    setTables,
    hasUnsavedChanges,
    setHasUnsavedChanges,
    isPaymentCompleted,
    setIsPaymentCompleted,
    isTableManuallySelected,
    setIsTableManuallySelected,
    showUnsavedDialog,
    setShowUnsavedDialog,
    showSuccessCheckmark,
    setShowSuccessCheckmark,
    shouldAutoPrint,
    setShouldAutoPrint,
    showVoidDialog,
    setShowVoidDialog,
    showOrdersDialog,
    setShowOrdersDialog,
    showReportsDialog,
    setShowReportsDialog,
    activeView,
    setActiveView,
    incompleteOrdersCount,
    setIncompleteOrdersCount,
    tableOrders,
    setTableOrders,
    incompleteTableOrdersCount,
    setIncompleteTableOrdersCount,
    incompleteDeliveryTakeawayCount,
    setIncompleteDeliveryTakeawayCount,
    leftPanelWidth,
    setLeftPanelWidth,
    rightPanelPixelWidth,
    setRightPanelPixelWidth,
    isResizing,
    setIsResizing,
    showDiscountDialog,
    setShowDiscountDialog,
    showNotesDialog,
    setShowNotesDialog,
    showItemNotesDialog,
    setShowItemNotesDialog,
    selectedItemForNotes,
    setSelectedItemForNotes,
    orderNotes,
    setOrderNotes,
    discountAmount,
    setDiscountAmount,
    appliedDiscount,
    setAppliedDiscount,
    showPrinterSelector,
    setShowPrinterSelector,
    printerSelectionContext,
    setPrinterSelectionContext,
    isSaving,
    setIsSaving,

    // Refs
    errorTimeoutRef,
    successTimeoutRef,
    checkmarkTimeoutRef,
    processedOrderRef,
    justSavedRef,
    completedOrdersRef,
    containerRef,

    // Computed values
    categories,
    subtotal,
    tax,
    discountAmountCalculated,
    total,
    availablePosItems,
    filteredPosItems,

    // API data and functions
    stock,
    menu,
    status,
    refreshInventory,
    refreshOrders,
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
    printVoidReceiptsForRemovedItems,

    // Utility functions
    showError,
    showSuccess,

    // Cart functions
    addToCart,
    updateCartQuantity,
    recalculateEmployeeDiscount,

    // Handler functions from usePOSHandlers
    handleCloseOrdersDialog: handlers.handleCloseOrdersDialog,
    handleOrderSelectCallback: handlers.handleOrderSelectCallback,
    clearCartWithAnimation: handlers.clearCartWithAnimation,
    resetToTakeaway: handlers.resetToTakeaway,
    clearCart: handlers.clearCart,
    handleShowReports: handlers.handleShowReports,
    handleShowDiscount: handlers.handleShowDiscount,
    handleDiscountAmountChange: handlers.handleDiscountAmountChange,
    handleApplyDiscount: handlers.handleApplyDiscount,
    handleRemoveDiscount: handlers.handleRemoveDiscount,
    handleItemNotesChange: handlers.handleItemNotesChange,
    handleShowItemNotes: handlers.handleShowItemNotes,
    handleCloseItemNotes: handlers.handleCloseItemNotes,
    handlePaymentWithPrinter: handlers.handlePaymentWithPrinter,
    handlePrintReceiptWithPrinter: handlers.handlePrintReceiptWithPrinter,
    handlePrinterSelect: handlers.handlePrinterSelect,
    handleClosePrinterSelector: handlers.handleClosePrinterSelector,
    handleShowPrinterSettings: handlers.handleShowPrinterSettings,
    fetchIncompleteOrders: handlers.fetchIncompleteOrders,

    // Additional handler functions (placeholders for now - need to be implemented)
    handleOrderTypeChange: (orderType: OrderType) => {
      console.log("🔄 Order type changed:", orderType);
      setOrderType(orderType);
    },
    handleTableSelect: (table: Table) => {
      console.log("📍 Table selected:", table);
      setSelectedTable(table);
    },
    handleTableSelection: (table: Table) => {
      console.log("📍 Table selection:", table);
      setSelectedTable(table);
      setShowTablesLayout(false);
    },
    handleCloseTablesLayout: () => {
      console.log("📍 Closing tables layout");
      setShowTablesLayout(false);
    },
    handleEmployeeSelection: (employee: Employee) => {
      console.log("👤 Employee selected:", employee);
      setSelectedEmployee(employee);
    },
    handlePrintReceipt: async (printer?: any) => {
      console.log("🖨️ Print receipt requested");
      // Placeholder implementation
    },
    handleVoidOrder: () => {
      console.log("❌ Void order requested");
      setShowVoidDialog(true);
    },
    handleConfirmVoid: async () => {
      console.log("❌ Confirming void order");
      // Placeholder implementation
    },
    handleShowOrders: () => {
      console.log("📋 Show orders requested");
      setShowOrdersDialog(true);
    },
    handleCancelOrder: () => {
      console.log("❌ Cancel order requested");
      // Placeholder implementation
    },
    handleManualSave: async () => {
      console.log("💾 Manual save requested");
      // Placeholder implementation
    },
    handlePayment: async (printer?: any) => {
      console.log("💳 Payment requested");
      // Placeholder implementation
    },
    handleMouseDown: (e: React.MouseEvent) => {
      console.log("🖱️ Mouse down");
      // Placeholder implementation
    },
    handleMouseMove: (e: React.MouseEvent) => {
      console.log("🖱️ Mouse move");
      // Placeholder implementation
    },
    handleMouseUp: () => {
      console.log("🖱️ Mouse up");
      // Placeholder implementation
    },
    fetchTablesData: async () => {
      console.log("📍 Fetching tables data");
      // Placeholder implementation
    },
    refreshAllCounts: async () => {
      console.log("🔄 Refreshing all counts");
      // Placeholder implementation
    },
    formatItemsForPrinterCallback: (items: POSCartItem[]) => {
      console.log("🖨️ Formatting items for printer");
      return formatItemsForPrinter({
        items,
        orderType: orderType || "takeaway",
        generatePreviewOrderNumber
      });
    },
    printItemsToAssignedPrinters: async (items: POSCartItem[]) => {
      console.log("🖨️ Printing items to assigned printers");
      // Placeholder implementation
    },
    handleOrderSelect: (order: any) => {
      console.log("📋 Order selected:", order);
      if (onOrderSelect) onOrderSelect(order);
    },

    // Additional state that POSClient expects (removing duplicates)
    // negativeStockWarnings, showNegativeStockDialog, setShowNegativeStockDialog already defined above
    // shouldAutoPrint, setShouldAutoPrint already defined above
    // isSaving, setIsSaving already defined above
    // tables already defined above

    // Props passed through
    sectionAssignments,
    onSaleComplete,
    onOrderSelect,
    selectedOrderForPOS,
    onOrderProcessed,
    refreshCountsRef
  };
};

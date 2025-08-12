import { useState, useRef, useCallback } from "react";
import { POSCartItem, Table, NegativeStockWarning, ReceiptData } from "@/types/inventory";
import { Employee } from "@/types/employee";
import { OrderType } from "@/types/orders";

export const usePOSState = () => {
  const [cart, setCart] = useState<POSCartItem[]>([]);
  const [orderType, setOrderType] = useState<OrderType>("takeaway");
  const [selectedTable, setSelectedTable] = useState<Table | undefined>(undefined);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | undefined>(undefined);
  const [orderNotes, setOrderNotes] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [showSuccessCheckmark, setShowSuccessCheckmark] = useState(false);
  const [activeView, setActiveView] = useState<"cart" | "products">("products");
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [showReceiptDialog, setShowReceiptDialog] = useState(false);
  const [showTablesLayout, setShowTablesLayout] = useState(false);
  const [showVoidDialog, setShowVoidDialog] = useState(false);
  const [showOrdersDialog, setShowOrdersDialog] = useState(false);
  const [showReportsDialog, setShowReportsDialog] = useState(false);
  const [showDiscountDialog, setShowDiscountDialog] = useState(false);
  const [showNotesDialog, setShowNotesDialog] = useState(false);
  const [showItemNotesDialog, setShowItemNotesDialog] = useState(false);
  const [showUnsavedDialog, setShowUnsavedDialog] = useState(false);
  const [showNegativeStockDialog, setShowNegativeStockDialog] = useState(false);
  const [showPrinterSelector, setShowPrinterSelector] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState<string>("");
  const [discountAmount, setDiscountAmount] = useState<number>(0);
  const [appliedDiscount, setAppliedDiscount] = useState<{ 
    type: "percentage" | "fixed"; 
    value: number; 
    amount: number; 
    reason?: string 
  } | null>(null);
  const [lastSaleData, setLastSaleData] = useState<ReceiptData | null>(null);
  const [shouldAutoPrint, setShouldAutoPrint] = useState(false);
  const [printerSelectionContext, setPrinterSelectionContext] = useState<"payment" | "manual_print" | null>(null);
  const [selectedItemForNotes, setSelectedItemForNotes] = useState<POSCartItem | null>(null);
  const [negativeStockWarnings] = useState<NegativeStockWarning[]>([]);
  const [leftPanelWidth, setLeftPanelWidth] = useState(33.33);
  const [rightPanelPixelWidth, setRightPanelPixelWidth] = useState(0);
  const [isResizing, setIsResizing] = useState(false);
  const [incompleteOrdersCount, setIncompleteOrdersCount] = useState<number>(0);
  const [tableOrders, setTableOrders] = useState<{ [tableId: string]: number }>({});
  const [incompleteTableOrdersCount, setIncompleteTableOrdersCount] = useState<number>(0);
  const [incompleteDeliveryTakeawayCount, setIncompleteDeliveryTakeawayCount] = useState<number>(0);
  const errorTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const successTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const checkmarkTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const processedOrderRef = useRef<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  const showError = useCallback((message: string) => {
    setError(message);
    if (errorTimeoutRef.current) clearTimeout(errorTimeoutRef.current);
    errorTimeoutRef.current = setTimeout(() => setError(null), 1500);
  }, []);

  const showSuccess = useCallback((message: string) => {
    setSuccessMessage(message);
    if (successTimeoutRef.current) clearTimeout(successTimeoutRef.current);
    successTimeoutRef.current = setTimeout(() => setSuccessMessage(null), 1500);
  }, []);

  const clearCartWithAnimation = useCallback(() => {
    if (processedOrderRef.current) {
      return;
    }
    setShowSuccessCheckmark(true);
    setCart([]);
    if (checkmarkTimeoutRef.current) {
      clearTimeout(checkmarkTimeoutRef.current);
    }
    checkmarkTimeoutRef.current = setTimeout(() => {
      setShowSuccessCheckmark(false);
    }, 1500);
  }, []);

  const clearCart = useCallback(() => {
    setCart([]);
    setHasUnsavedChanges(false);
  }, []);

  return {
    // State
    cart,
    setCart,
    orderType,
    setOrderType,
    selectedTable,
    setSelectedTable,
    selectedEmployee,
    setSelectedEmployee,
    orderNotes,
    setOrderNotes,
    isLoading,
    setIsLoading,
    error,
    setError,
    successMessage,
    setSuccessMessage,
    hasUnsavedChanges,
    setHasUnsavedChanges,
    showSuccessCheckmark,
    setShowSuccessCheckmark,
    activeView,
    setActiveView,
    activeCategory,
    setActiveCategory,
    
    // Dialog states
    showPaymentDialog,
    setShowPaymentDialog,
    showReceiptDialog,
    setShowReceiptDialog,
    showTablesLayout,
    setShowTablesLayout,
    showVoidDialog,
    setShowVoidDialog,
    showOrdersDialog,
    setShowOrdersDialog,
    showReportsDialog,
    setShowReportsDialog,
    showDiscountDialog,
    setShowDiscountDialog,
    showNotesDialog,
    setShowNotesDialog,
    showItemNotesDialog,
    setShowItemNotesDialog,
    showUnsavedDialog,
    setShowUnsavedDialog,
    showNegativeStockDialog,
    setShowNegativeStockDialog,
    showPrinterSelector,
    setShowPrinterSelector,
    
    // Payment and discount
    paymentAmount,
    setPaymentAmount,
    discountAmount,
    setDiscountAmount,
    appliedDiscount,
    setAppliedDiscount,
    
    // Receipt and printing
    lastSaleData,
    setLastSaleData,
    shouldAutoPrint,
    setShouldAutoPrint,
    printerSelectionContext,
    setPrinterSelectionContext,
    
    // Item notes
    selectedItemForNotes,
    setSelectedItemForNotes,
    
    // Warnings
    negativeStockWarnings,
    
    // Layout
    leftPanelWidth,
    setLeftPanelWidth,
    rightPanelPixelWidth,
    setRightPanelPixelWidth,
    isResizing,
    setIsResizing,
    
    // Order counts
    incompleteOrdersCount,
    setIncompleteOrdersCount,
    tableOrders,
    setTableOrders,
    incompleteTableOrdersCount,
    setIncompleteTableOrdersCount,
    incompleteDeliveryTakeawayCount,
    setIncompleteDeliveryTakeawayCount,
    
    // Refs
    errorTimeoutRef,
    successTimeoutRef,
    checkmarkTimeoutRef,
    processedOrderRef,
    containerRef,
    
    // Handlers
    showError,
    showSuccess,
    clearCartWithAnimation,
    clearCart,
  };
};

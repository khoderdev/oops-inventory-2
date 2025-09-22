// import { useDispatch, useSelector } from "react-redux";
// import { AppDispatch } from "@/store/";
// import * as posSelectors from "@/store/slices/posSelectors";
// import * as posActions from "@/store/slices/posSlice";
// import { POSCartItem, Table, ReceiptData } from "@/types/inventory";
// import { Employee } from "@/types/employee";
// import { OrderType, CreateOrderData, UpdateOrderData } from "@/types/orders";

// export const usePOSRedux = () => {
//   const dispatch = useDispatch<AppDispatch>();

//   // State selectors
//   const cart = useSelector(posSelectors.selectCart);
//   const currentOrder = useSelector(posSelectors.selectCurrentOrder);
//   const orderType = useSelector(posSelectors.selectOrderType);
//   const selectedTable = useSelector(posSelectors.selectSelectedTable);
//   const selectedEmployee = useSelector(posSelectors.selectSelectedEmployee);
//   const appliedDiscount = useSelector(posSelectors.selectAppliedDiscount);
//   const orderNotes = useSelector(posSelectors.selectOrderNotes);
//   const hasUnsavedChanges = useSelector(posSelectors.selectHasUnsavedChanges);
//   const isLoading = useSelector(posSelectors.selectIsLoading);
//   const error = useSelector(posSelectors.selectError);
//   const successMessage = useSelector(posSelectors.selectSuccessMessage);
//   const showSuccessCheckmark = useSelector(posSelectors.selectShowSuccessCheckmark);
//   const lastSaleData = useSelector(posSelectors.selectLastSaleData);
//   const salesHistory = useSelector(posSelectors.selectSalesHistory);
//   const selectedSaleForEdit = useSelector(posSelectors.selectSelectedSaleForEdit);

//   // Computed selectors
//   const subtotal = useSelector(posSelectors.selectSubtotal);
//   const total = useSelector(posSelectors.selectTotal);
//   const cartItemCount = useSelector(posSelectors.selectCartItemCount);
//   const isOrderCompleted = useSelector(posSelectors.selectIsOrderCompleted);
//   const isOrderCancelled = useSelector(posSelectors.selectIsOrderCancelled);
//   const orderNumber = useSelector(posSelectors.selectOrderNumber);
//   const orderId = useSelector(posSelectors.selectOrderId);
//   const isFromSalesHistory = useSelector(posSelectors.selectIsFromSalesHistory);

//   // Dialog selectors
//   const showPaymentDialog = useSelector(posSelectors.selectShowPaymentDialog);
//   const showReceiptDialog = useSelector(posSelectors.selectShowReceiptDialog);
//   const showTablesLayout = useSelector(posSelectors.selectShowTablesLayout);
//   const showDiscountDialog = useSelector(posSelectors.selectShowDiscountDialog);
//   const showNotesDialog = useSelector(posSelectors.selectShowNotesDialog);
//   const showItemNotesDialog = useSelector(posSelectors.selectShowItemNotesDialog);
//   const showVoidDialog = useSelector(posSelectors.selectShowVoidDialog);
//   const showOrdersDialog = useSelector(posSelectors.selectShowOrdersDialog);
//   const showReportsDialog = useSelector(posSelectors.selectShowReportsDialog);
//   const showPrinterSelector = useSelector(posSelectors.selectShowPrinterSelector);

//   // Cart actions
//   const addToCart = (item: POSCartItem) => dispatch(posActions.addToCart(item));
//   const updateCartQuantity = (cartId: string, newQuantity: number) => dispatch(posActions.updateCartQuantity({ cartId, newQuantity }));
//   const clearCart = () => dispatch(posActions.clearCart());
//   const clearCartWithAnimation = () => dispatch(posActions.clearCartWithAnimation());

//   // Order type actions
//   const setOrderType = (type: OrderType) => dispatch(posActions.setOrderType(type));
//   const setSelectedTable = (table: Table | null) => dispatch(posActions.setSelectedTable(table));
//   const setSelectedEmployee = (employee: Employee | null) => dispatch(posActions.setSelectedEmployee(employee));

//   // Discount actions
//   const applyDiscount = (discountData: { type: "percentage" | "fixed"; value: number; reason?: string }) => dispatch(posActions.applyDiscount(discountData));
//   const removeDiscount = () => dispatch(posActions.removeDiscount());

//   // Notes actions
//   const setOrderNotes = (notes: string) => dispatch(posActions.setOrderNotes(notes));
//   const setItemNotes = (itemId: string, notes: string) => dispatch(posActions.setItemNotes({ itemId, notes }));

//   // Dialog actions
//   const setShowPaymentDialog = (show: boolean) => dispatch(posActions.setShowPaymentDialog(show));
//   const setShowReceiptDialog = (show: boolean) => dispatch(posActions.setShowReceiptDialog(show));
//   const setShowTablesLayout = (show: boolean) => dispatch(posActions.setShowTablesLayout(show));
//   const setShowDiscountDialog = (show: boolean) => dispatch(posActions.setShowDiscountDialog(show));
//   const setShowNotesDialog = (show: boolean) => dispatch(posActions.setShowNotesDialog(show));
//   const setShowItemNotesDialog = (show: boolean) => dispatch(posActions.setShowItemNotesDialog(show));
//   const setShowVoidDialog = (show: boolean) => dispatch(posActions.setShowVoidDialog(show));
//   const setShowOrdersDialog = (show: boolean) => dispatch(posActions.setShowOrdersDialog(show));
//   const setShowReportsDialog = (show: boolean) => dispatch(posActions.setShowReportsDialog(show));
//   const setShowPrinterSelector = (show: boolean) => dispatch(posActions.setShowPrinterSelector(show));
//   const setSelectedItemForNotes = (item: POSCartItem | null) => dispatch(posActions.setSelectedItemForNotes(item));

//   // UI state actions
//   const setError = (error: string | null) => dispatch(posActions.setError(error));
//   const setSuccessMessage = (message: string | null) => dispatch(posActions.setSuccessMessage(message));
//   const setShowSuccessCheckmark = (show: boolean) => dispatch(posActions.setShowSuccessCheckmark(show));
//   const setIsLoading = (loading: boolean) => dispatch(posActions.setIsLoading(loading));
//   const setIsPOSActionInProgress = (inProgress: boolean) => dispatch(posActions.setIsPOSActionInProgress(inProgress));
//   const setIsTableManuallySelected = (selected: boolean) => dispatch(posActions.setIsTableManuallySelected(selected));

//   // Receipt actions
//   const setLastSaleData = (data: ReceiptData | null) => dispatch(posActions.setLastSaleData(data));
//   const generateReceiptData = () => dispatch(posActions.generateReceiptData());

//   // Sales history actions
//   const fetchSalesHistory = () => dispatch(posActions.fetchSalesHistory());
//   const setSelectedSaleForEdit = (sale: any | null) => dispatch(posActions.setSelectedSaleForEdit(sale));

//   // Order API actions
//   const loadOrder = (orderId: string) => dispatch(posActions.loadOrder(orderId));
//   const createOrder = (data: CreateOrderData) => dispatch(posActions.createOrder(data));
//   const updateOrder = (orderId: string, data: UpdateOrderData) => dispatch(posActions.updateOrder({ orderId, data }));
//   const completeOrder = (orderId: string, paymentData: { paymentMethod: string; paymentAmount: number; change?: number }) => dispatch(posActions.completeOrder({ orderId, paymentData }));
//   const voidOrder = (orderId: string, reason?: string, restoreStock: boolean = true) => dispatch(posActions.voidOrder({ orderId, reason, restoreStock }));
//   const addOrderItems = (orderId: string, items: any[]) => dispatch(posActions.addOrderItems({ orderId, items }));
//   const removeOrderItems = (orderId: string, itemIds: string[]) => dispatch(posActions.removeOrderItems({ orderId, itemIds }));

//   // Reset state
//   const resetState = () => dispatch(posActions.resetState());

//   return {
//     // State
//     cart,
//     currentOrder,
//     orderType,
//     selectedTable,
//     selectedEmployee,
//     appliedDiscount,
//     orderNotes,
//     hasUnsavedChanges,
//     isLoading,
//     error,
//     successMessage,
//     showSuccessCheckmark,
//     lastSaleData,
//     salesHistory,
//     selectedSaleForEdit,

//     // Computed values
//     subtotal,
//     total,
//     cartItemCount,
//     isOrderCompleted,
//     isOrderCancelled,
//     orderNumber,
//     orderId,
//     isFromSalesHistory,

//     // Dialog state
//     showPaymentDialog,
//     showReceiptDialog,
//     showTablesLayout,
//     showDiscountDialog,
//     showNotesDialog,
//     showItemNotesDialog,
//     showVoidDialog,
//     showOrdersDialog,
//     showReportsDialog,
//     showPrinterSelector,

//     // Cart actions
//     addToCart,
//     updateCartQuantity,
//     clearCart,
//     clearCartWithAnimation,

//     // Order type actions
//     setOrderType,
//     setSelectedTable,
//     setSelectedEmployee,

//     // Discount actions
//     applyDiscount,
//     removeDiscount,

//     // Notes actions
//     setOrderNotes,
//     setItemNotes,

//     // Dialog actions
//     setShowPaymentDialog,
//     setShowReceiptDialog,
//     setShowTablesLayout,
//     setShowDiscountDialog,
//     setShowNotesDialog,
//     setShowItemNotesDialog,
//     setShowVoidDialog,
//     setShowOrdersDialog,
//     setShowReportsDialog,
//     setShowPrinterSelector,
//     setSelectedItemForNotes,

//     // UI state actions
//     setError,
//     setSuccessMessage,
//     setShowSuccessCheckmark,
//     setIsLoading,
//     setIsPOSActionInProgress,
//     setIsTableManuallySelected,

//     // Receipt actions
//     setLastSaleData,
//     generateReceiptData,

//     // Sales history actions
//     fetchSalesHistory,
//     setSelectedSaleForEdit,

//     // Order API actions
//     loadOrder,
//     createOrder,
//     updateOrder,
//     completeOrder,
//     voidOrder,
//     addOrderItems,
//     removeOrderItems,

//     // Reset state
//     resetState
//   };
// };
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch } from "@/store/";
import * as posSelectors from "@/store/slices/posSelectors";
import * as posActions from "@/store/slices/posSlice";
import { POSCartItem, Table, ReceiptData } from "@/types/inventory";
import { Employee } from "@/types/employee";
import { OrderType, CreateOrderData, UpdateOrderData } from "@/types/orders";

export const usePOSRedux = () => {
  const dispatch = useDispatch<AppDispatch>();

  // State selectors
  const cart = useSelector(posSelectors.selectCart);
  const currentOrder = useSelector(posSelectors.selectCurrentOrder);
  const orderType = useSelector(posSelectors.selectOrderType);
  const selectedTable = useSelector(posSelectors.selectSelectedTable);
  const selectedEmployee = useSelector(posSelectors.selectSelectedEmployee);
  const appliedDiscount = useSelector(posSelectors.selectAppliedDiscount);
  const orderNotes = useSelector(posSelectors.selectOrderNotes);
  const hasUnsavedChanges = useSelector(posSelectors.selectHasUnsavedChanges);
  const isLoading = useSelector(posSelectors.selectIsLoading);
  const error = useSelector(posSelectors.selectError);
  const successMessage = useSelector(posSelectors.selectSuccessMessage);
  const showSuccessCheckmark = useSelector(posSelectors.selectShowSuccessCheckmark);
  const lastSaleData = useSelector(posSelectors.selectLastSaleData);
  const salesHistory = useSelector(posSelectors.selectSalesHistory);
  const selectedSaleForEdit = useSelector(posSelectors.selectSelectedSaleForEdit);
  const selectedItemFilter = useSelector(posSelectors.selectSelectedItemFilter || ((state) => null));
  const selectedSectionFilter = useSelector(posSelectors.selectSelectedSectionFilter || ((state) => null));
  const dateFrom = useSelector(posSelectors.selectDateFrom || ((state) => null));
  const dateTo = useSelector(posSelectors.selectDateTo || ((state) => null));
  const uniqueItemNames = useSelector(posSelectors.selectUniqueItemNames || ((state) => []));
  const uniqueSectionNames = useSelector(posSelectors.selectUniqueSectionNames || ((state) => []));

  // Computed selectors
  const subtotal = useSelector(posSelectors.selectSubtotal);
  const total = useSelector(posSelectors.selectTotal);
  const cartItemCount = useSelector(posSelectors.selectCartItemCount);
  const isOrderCompleted = useSelector(posSelectors.selectIsOrderCompleted);
  const isOrderCancelled = useSelector(posSelectors.selectIsOrderCancelled);
  const orderNumber = useSelector(posSelectors.selectOrderNumber);
  const orderId = useSelector(posSelectors.selectOrderId);
  const isFromSalesHistory = useSelector(posSelectors.selectIsFromSalesHistory);

  // Dialog selectors
  const showPaymentDialog = useSelector(posSelectors.selectShowPaymentDialog);
  const showReceiptDialog = useSelector(posSelectors.selectShowReceiptDialog);
  const showTablesLayout = useSelector(posSelectors.selectShowTablesLayout);
  const showDiscountDialog = useSelector(posSelectors.selectShowDiscountDialog);
  const showNotesDialog = useSelector(posSelectors.selectShowNotesDialog);
  const showItemNotesDialog = useSelector(posSelectors.selectShowItemNotesDialog);
  const showVoidDialog = useSelector(posSelectors.selectShowVoidDialog);
  const showOrdersDialog = useSelector(posSelectors.selectShowOrdersDialog);
  const showReportsDialog = useSelector(posSelectors.selectShowReportsDialog);
  const showPrinterSelector = useSelector(posSelectors.selectShowPrinterSelector);

  // Cart actions
  const addToCart = (item: POSCartItem) => dispatch(posActions.addToCart(item));
  const updateCartQuantity = (cartId: string, newQuantity: number) => dispatch(posActions.updateCartQuantity({ cartId, newQuantity }));
  const clearCart = () => dispatch(posActions.clearCart());
  const clearCartWithAnimation = () => dispatch(posActions.clearCartWithAnimation());

  // Order type actions
  const setOrderType = (type: OrderType) => dispatch(posActions.setOrderType(type));
  const setSelectedTable = (table: Table | null) => dispatch(posActions.setSelectedTable(table));
  const setSelectedEmployee = (employee: Employee | null) => dispatch(posActions.setSelectedEmployee(employee));

  // Discount actions
  const applyDiscount = (discountData: { type: "percentage" | "fixed"; value: number; reason?: string }) => dispatch(posActions.applyDiscount(discountData));
  const removeDiscount = () => dispatch(posActions.removeDiscount());

  // Notes actions
  const setOrderNotes = (notes: string) => dispatch(posActions.setOrderNotes(notes));
  const setItemNotes = (itemId: string, notes: string) => dispatch(posActions.setItemNotes({ itemId, notes }));

  // Dialog actions
  const setShowPaymentDialog = (show: boolean) => dispatch(posActions.setShowPaymentDialog(show));
  const setShowReceiptDialog = (show: boolean) => dispatch(posActions.setShowReceiptDialog(show));
  const setShowTablesLayout = (show: boolean) => dispatch(posActions.setShowTablesLayout(show));
  const setShowDiscountDialog = (show: boolean) => dispatch(posActions.setShowDiscountDialog(show));
  const setShowNotesDialog = (show: boolean) => dispatch(posActions.setShowNotesDialog(show));
  const setShowItemNotesDialog = (show: boolean) => dispatch(posActions.setShowItemNotesDialog(show));
  const setShowVoidDialog = (show: boolean) => dispatch(posActions.setShowVoidDialog(show));
  const setShowOrdersDialog = (show: boolean) => dispatch(posActions.setShowOrdersDialog(show));
  const setShowReportsDialog = (show: boolean) => dispatch(posActions.setShowReportsDialog(show));
  const setShowPrinterSelector = (show: boolean) => dispatch(posActions.setShowPrinterSelector(show));
  const setSelectedItemForNotes = (item: POSCartItem | null) => dispatch(posActions.setSelectedItemForNotes(item));

  // UI state actions
  const setError = (error: string | null) => dispatch(posActions.setError(error));
  const setSuccessMessage = (message: string | null) => dispatch(posActions.setSuccessMessage(message));
  const setShowSuccessCheckmark = (show: boolean) => dispatch(posActions.setShowSuccessCheckmark(show));
  const setIsLoading = (loading: boolean) => dispatch(posActions.setIsLoading(loading));
  const setIsPOSActionInProgress = (inProgress: boolean) => dispatch(posActions.setIsPOSActionInProgress(inProgress));
  const setIsTableManuallySelected = (selected: boolean) => dispatch(posActions.setIsTableManuallySelected(selected));

  // Receipt actions
  const setLastSaleData = (data: ReceiptData | null) => dispatch(posActions.setLastSaleData(data));
  const generateReceiptData = () => dispatch(posActions.generateReceiptData());

  // Sales history actions
  const fetchSalesHistory = () => dispatch(posActions.fetchSalesHistory());
  const setSelectedSaleForEdit = (sale: any | null) => dispatch(posActions.setSelectedSaleForEdit(sale));
  const setSelectedItemFilter = (filter: string) => dispatch(posActions.setSelectedItemFilter(filter));
  const setSelectedSectionFilter = (filter: string) => dispatch(posActions.setSelectedSectionFilter(filter));
  const setDateFrom = (date: Date | null) => dispatch(posActions.setDateFrom(date));
  const setDateTo = (date: Date | null) => dispatch(posActions.setDateTo(date));
  const setUniqueItemNames = (items: string[]) => dispatch(posActions.setUniqueItemNames(items));
  const setUniqueSectionNames = (sections: string[]) => dispatch(posActions.setUniqueSectionNames(sections));

  // Order API actions
  const loadOrder = (orderId: string) => dispatch(posActions.loadOrder(orderId));
  const createOrder = (data: CreateOrderData) => dispatch(posActions.createOrder(data));
  const updateOrder = (orderId: string, data: UpdateOrderData) => dispatch(posActions.updateOrder({ orderId, data }));
  const completeOrder = (orderId: string, paymentData: { paymentMethod: string; paymentAmount: number; change?: number }) => dispatch(posActions.completeOrder({ orderId, paymentData }));
  const voidOrder = (orderId: string, reason?: string, restoreStock: boolean = true) => dispatch(posActions.voidOrder({ orderId, reason, restoreStock }));
  const addOrderItems = (orderId: string, items: any[]) => dispatch(posActions.addOrderItems({ orderId, items }));
  const removeOrderItems = (orderId: string, itemIds: string[]) => dispatch(posActions.removeOrderItems({ orderId, itemIds }));

  // Reset state
  const resetState = () => dispatch(posActions.resetState());
  
  // We need to pre-select the filtered sales history and total to avoid infinite loops
  const filteredSalesHistory = useSelector((state: any) => 
    posSelectors.selectFilteredSalesHistory(state, {
      dateFrom: dateFrom instanceof Date ? dateFrom : undefined,
      dateTo: dateTo instanceof Date ? dateTo : undefined,
      section: selectedSectionFilter && selectedSectionFilter !== "all" ? String(selectedSectionFilter) : undefined,
      item: selectedItemFilter && selectedItemFilter !== "all" ? String(selectedItemFilter) : undefined
    })
  );
  
  const salesTotal = useSelector(posSelectors.selectSalesTotal);

  return {
    // State
    cart,
    currentOrder,
    orderType,
    selectedTable,
    selectedEmployee,
    appliedDiscount,
    orderNotes,
    hasUnsavedChanges,
    isLoading,
    error,
    successMessage,
    showSuccessCheckmark,
    lastSaleData,
    salesHistory,
    selectedSaleForEdit,
    selectedItemFilter,
    selectedSectionFilter,
    dateFrom,
    dateTo,
    uniqueItemNames,
    uniqueSectionNames,

    // Computed values
    subtotal,
    total,
    cartItemCount,
    isOrderCompleted,
    isOrderCancelled,
    orderNumber,
    orderId,
    isFromSalesHistory,

    // Dialog state
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

    // Cart actions
    addToCart,
    updateCartQuantity,
    clearCart,
    clearCartWithAnimation,

    // Order type actions
    setOrderType,
    setSelectedTable,
    setSelectedEmployee,

    // Discount actions
    applyDiscount,
    removeDiscount,

    // Notes actions
    setOrderNotes,
    setItemNotes,

    // Dialog actions
    setShowPaymentDialog,
    setShowReceiptDialog,
    setShowTablesLayout,
    setShowDiscountDialog,
    setShowNotesDialog,
    setShowItemNotesDialog,
    setShowVoidDialog,
    setShowOrdersDialog,
    setShowReportsDialog,
    setShowPrinterSelector,
    setSelectedItemForNotes,

    // UI state actions
    setError,
    setSuccessMessage,
    setShowSuccessCheckmark,
    setIsLoading,
    setIsPOSActionInProgress,
    setIsTableManuallySelected,

    // Receipt actions
    setLastSaleData,
    generateReceiptData,

    // Sales history actions
    fetchSalesHistory,
    setSelectedSaleForEdit,
    setSelectedItemFilter,
    setSelectedSectionFilter,
    setDateFrom,
    setDateTo,
    setUniqueItemNames,
    setUniqueSectionNames,

    // Order API actions
    loadOrder,
    createOrder,
    updateOrder,
    completeOrder,
    voidOrder,
    addOrderItems,
    removeOrderItems,

    // Reset state
    resetState,
    
    // Pre-selected filtered sales data
    filteredSalesHistory,
    salesTotal
  };
};

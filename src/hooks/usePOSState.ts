/**
 * Consolidated POS State Hook
 * Replaces 30+ individual Redux selectors with a single optimized selector
 */

import { useAppSelector } from "@/store/hooks";
import { RootState } from "@/store/";
import { shallowEqual } from "react-redux";
import { OrderType } from "@/types/orders";

export interface POSState {
  // Cart and order data
  cart: any[];
  orderType: OrderType;
  selectedTable: any;
  selectedEmployee: any;
  posCurrentOrder: any;
  previewOrderNumber: string;

  // UI state
  hasUnsavedChanges: boolean;
  isLoading: boolean;
  error: string | null;
  successMessage: string | null;
  showSuccessCheckmark: boolean;

  // Dialog states
  showPaymentDialog: boolean;
  showReceiptDialog: boolean;
  showTablesLayout: boolean;
  showDiscountDialog: boolean;
  showNotesDialog: boolean;
  showItemNotesDialog: boolean;
  showVoidDialog: boolean;
  showOrdersDialog: boolean;
  showReportsDialog: boolean;
  showPrinterSelector: boolean;

  // Other state
  selectedItemForNotes: any;
  orderNotes: string;
  appliedDiscount: any;
  lastSaleData: any;
  isTableManuallySelected: boolean;
  editingSaleId: string | null;
  selectedSaleForEdit: any;
  isPOSActionInProgress: boolean;

  // Payment dialog state
  paymentAmount: string;

  // Day close dialog state
  showDayCloseDialog: boolean;
  closingCash: string;
  dayCloseNotes: string;

  // Printer selection state
  printerSelectionContext: "payment" | "manual_print" | null;
}

/**
 * Selector function that extracts all POS state in one go
 */
const selectPOSState = (state: RootState): POSState => ({
  // Cart and order data
  cart: state.pos.cart || [],
  orderType: state.pos.orderType,
  selectedTable: state.pos.selectedTable,
  selectedEmployee: state.pos.selectedEmployee,
  posCurrentOrder: state.pos.currentOrder,
  previewOrderNumber: state.pos.previewOrderNumber,

  // UI state
  hasUnsavedChanges: state.pos.hasUnsavedChanges,
  isLoading: state.pos.isLoading,
  error: state.pos.error,
  successMessage: state.pos.successMessage,
  showSuccessCheckmark: state.pos.showSuccessCheckmark,

  // Dialog states
  showPaymentDialog: state.pos.showPaymentDialog,
  showReceiptDialog: state.pos.showReceiptDialog,
  showTablesLayout: state.pos.showTablesLayout,
  showDiscountDialog: state.pos.showDiscountDialog,
  showNotesDialog: state.pos.showNotesDialog,
  showItemNotesDialog: state.pos.showItemNotesDialog,
  showVoidDialog: state.pos.showVoidDialog,
  showOrdersDialog: state.pos.showOrdersDialog,
  showReportsDialog: state.pos.showReportsDialog,
  showPrinterSelector: state.pos.showPrinterSelector,

  // Other state
  selectedItemForNotes: state.pos.selectedItemForNotes,
  orderNotes: state.pos.orderNotes,
  appliedDiscount: state.pos.appliedDiscount,
  lastSaleData: state.pos.lastSaleData,
  isTableManuallySelected: state.pos.isTableManuallySelected,
  editingSaleId: state.pos.editingSaleId,
  selectedSaleForEdit: state.pos.selectedSaleForEdit,
  isPOSActionInProgress: state.pos.isPOSActionInProgress,

  // Payment dialog state
  paymentAmount: state.pos.paymentAmount,

  // Day close dialog state
  showDayCloseDialog: state.pos.showDayCloseDialog,
  closingCash: state.pos.closingCash,
  dayCloseNotes: state.pos.dayCloseNotes,

  // Printer selection state
  printerSelectionContext: state.pos.printerSelectionContext
});

/**
 * Custom hook that returns consolidated POS state
 * Uses shallow equality to prevent unnecessary re-renders
 */
export function usePOSState(): POSState {
  return useAppSelector(selectPOSState, shallowEqual);
}

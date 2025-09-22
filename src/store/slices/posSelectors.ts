import { createSelector } from "@reduxjs/toolkit";
import { RootState } from "@/store";

// Basic selectors
export const selectPOSState = (state: RootState) => state.pos;
export const selectCart = (state: RootState) => state.pos.cart;
export const selectCurrentOrder = (state: RootState) => state.pos.currentOrder;
export const selectOrderType = (state: RootState) => state.pos.orderType;
export const selectSelectedTable = (state: RootState) => state.pos.selectedTable;
export const selectSelectedEmployee = (state: RootState) => state.pos.selectedEmployee;
export const selectAppliedDiscount = (state: RootState) => state.pos.appliedDiscount;
export const selectOrderNotes = (state: RootState) => state.pos.orderNotes;
export const selectHasUnsavedChanges = (state: RootState) => state.pos.hasUnsavedChanges;
export const selectIsLoading = (state: RootState) => state.pos.isLoading;
export const selectError = (state: RootState) => state.pos.error;
export const selectSuccessMessage = (state: RootState) => state.pos.successMessage;
export const selectShowSuccessCheckmark = (state: RootState) => state.pos.showSuccessCheckmark;
export const selectLastSaleData = (state: RootState) => state.pos.lastSaleData;
export const selectSalesHistory = (state: RootState) => state.pos.salesHistory;
export const selectSelectedSaleForEdit = (state: RootState) => state.pos.selectedSaleForEdit;
export const selectEditingSaleId = (state: RootState) => state.pos.editingSaleId;

// Dialog selectors
export const selectShowPaymentDialog = (state: RootState) => state.pos.showPaymentDialog;
export const selectShowReceiptDialog = (state: RootState) => state.pos.showReceiptDialog;
export const selectShowTablesLayout = (state: RootState) => state.pos.showTablesLayout;
export const selectShowDiscountDialog = (state: RootState) => state.pos.showDiscountDialog;
export const selectShowNotesDialog = (state: RootState) => state.pos.showNotesDialog;
export const selectShowItemNotesDialog = (state: RootState) => state.pos.showItemNotesDialog;
export const selectShowVoidDialog = (state: RootState) => state.pos.showVoidDialog;
export const selectShowOrdersDialog = (state: RootState) => state.pos.showOrdersDialog;
export const selectShowReportsDialog = (state: RootState) => state.pos.showReportsDialog;
export const selectShowPrinterSelector = (state: RootState) => state.pos.showPrinterSelector;

// Computed selectors
export const selectSubtotal = createSelector([selectCart], cart => cart.reduce((sum, item) => sum + item.price * item.quantity, 0));

export const selectTotal = createSelector([selectSubtotal, selectAppliedDiscount], (subtotal, appliedDiscount) => {
  const discountAmount = appliedDiscount?.amount || 0;
  return subtotal - discountAmount;
});

export const selectCartItemCount = createSelector([selectCart], cart => cart.reduce((sum, item) => sum + item.quantity, 0));

export const selectCartItemsGroupedByType = createSelector([selectCart], cart => {
  const menuItems = cart.filter(item => item.type === "menu_item");
  const materialItems = cart.filter(item => item.type === "material");
  return { menuItems, materialItems };
});

export const selectOrderStatus = createSelector([selectCurrentOrder], currentOrder => currentOrder?.status);

export const selectIsOrderCompleted = createSelector([selectOrderStatus], status => status === "paid" || status === "served");

export const selectIsOrderCancelled = createSelector([selectOrderStatus], status => status === "cancelled");

export const selectOrderNumber = createSelector([selectCurrentOrder], currentOrder => currentOrder?.orderNumber);

export const selectOrderId = createSelector([selectCurrentOrder], currentOrder => currentOrder?.id);

export const selectOrderItems = createSelector([selectCurrentOrder], currentOrder => currentOrder?.items || []);

export const selectOrderSubtotal = createSelector([selectCurrentOrder], currentOrder => {
  if (!currentOrder) return 0;
  const subtotal = currentOrder.subtotal;
  return typeof subtotal === "string" ? parseFloat(subtotal) : subtotal || 0;
});

export const selectOrderTotal = createSelector([selectCurrentOrder], currentOrder => {
  if (!currentOrder) return 0;
  const total = currentOrder.total;
  return typeof total === "string" ? parseFloat(total) : total || 0;
});

export const selectOrderDiscountAmount = createSelector([selectCurrentOrder], currentOrder => {
  if (!currentOrder) return 0;
  const discountAmount = currentOrder.discountAmount;
  return typeof discountAmount === "string" ? parseFloat(discountAmount) : discountAmount || 0;
});

export const selectOrderDiscountType = createSelector([selectCurrentOrder], currentOrder => currentOrder?.discountType as "percentage" | "fixed" | null);

export const selectOrderDiscountValue = createSelector([selectCurrentOrder], currentOrder => {
  if (!currentOrder) return 0;
  const discountValue = currentOrder.discountValue;
  return typeof discountValue === "string" ? parseFloat(discountValue) : discountValue || 0;
});

export const selectOrderDiscountReason = createSelector([selectCurrentOrder], currentOrder => currentOrder?.discountReason);

export const selectOrderTableId = createSelector([selectCurrentOrder], currentOrder => currentOrder?.tableId);

export const selectOrderEmployeeId = createSelector([selectCurrentOrder], currentOrder => currentOrder?.employeeId);

export const selectOrderCreatedAt = createSelector([selectCurrentOrder], currentOrder => (currentOrder?.createdAt ? new Date(currentOrder.createdAt) : null));

export const selectOrderUpdatedAt = createSelector([selectCurrentOrder], currentOrder => (currentOrder?.updatedAt ? new Date(currentOrder.updatedAt) : null));

export const selectIsFromSalesHistory = createSelector([selectCurrentOrder], currentOrder => !!(currentOrder && (currentOrder as any).fromSalesHistory));

export const selectFilteredSalesHistory = createSelector([selectSalesHistory, (_, filters?: { dateFrom?: Date; dateTo?: Date; section?: string; item?: string }) => filters], (salesHistory, filters) => {
  if (!filters) return salesHistory;

  return salesHistory.filter(sale => {
    const saleDate = new Date(sale.saleDate);
    const matchesDate = (!filters.dateFrom || saleDate >= filters.dateFrom) && (!filters.dateTo || saleDate <= filters.dateTo);
    const matchesSection = !filters.section || filters.section === "all" || sale.section?.name === filters.section;
    const matchesItem = !filters.item || filters.item === "all" || sale.items?.some(item => item.materialName === filters.item) || sale.menuItems?.some(menuItem => menuItem.menuItemName === filters.item);

    return matchesDate && matchesSection && matchesItem;
  });
});

export const selectSalesTotal = createSelector([selectFilteredSalesHistory], sales =>
  sales.reduce((sum, sale) => {
    const totalAmount = typeof sale.totalAmount === "string" ? parseFloat(sale.totalAmount) : sale.totalAmount;
    return sum + (totalAmount || 0);
  }, 0)
);

export const selectUniqueSectionNames = createSelector([selectSalesHistory], sales => {
  const sections = new Set<string>();
  sales.forEach(sale => {
    if (sale.section?.name) {
      sections.add(sale.section.name);
    }
  });
  return Array.from(sections);
});

export const selectUniqueItemNames = createSelector([selectSalesHistory], sales => {
  const items = new Set<string>();
  sales.forEach(sale => {
    sale.items?.forEach(item => {
      if (item.materialName) {
        items.add(item.materialName);
      }
    });
    sale.menuItems?.forEach(menuItem => {
      if (menuItem.menuItemName) {
        items.add(menuItem.menuItemName);
      }
    });
  });
  return Array.from(items);
});

// Additional selectors for Sales component
export const selectSelectedItemFilter = (state: RootState) => state.pos.selectedItemFilter || null;
export const selectSelectedSectionFilter = (state: RootState) => state.pos.selectedSectionFilter || null;
export const selectDateFrom = (state: RootState) => state.pos.dateFrom || null;
export const selectDateTo = (state: RootState) => state.pos.dateTo || null;

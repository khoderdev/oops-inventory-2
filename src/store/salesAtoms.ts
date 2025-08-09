import { ItemSale, SaleRecord, StockRestorationItem } from "@/types/inventory";
import { atom } from "jotai";
import { atomWithStorage } from "jotai/utils";

// Base sales data atoms
export const salesAtom = atom<SaleRecord[]>([]);

// Loading and error states
export const salesLoadingAtom = atom<boolean>(false);
export const salesErrorAtom = atom<string | null>(null);

// Operation states
export const isRevertingAtom = atom<boolean>(false);
export const isDeletingAtom = atom<boolean>(false);
export const isBulkRevertingAtom = atom<boolean>(false);
export const isBulkDeletingAtom = atom<boolean>(false);

// Success messages and reports
export const revertSuccessAtom = atom<string | null>(null);
export const deleteSuccessAtom = atom<string | null>(null);
export const bulkRevertSuccessAtom = atom<string | null>(null);
export const stockRestorationReportAtom = atom<StockRestorationItem[]>([]);
export const bulkStockRestorationReportAtom = atom<StockRestorationItem[]>([]);

// Dialog states
export const revertDialogOpenAtom = atom<boolean>(false);
export const deleteDialogOpenAtom = atom<boolean>(false);
export const bulkRevertDialogOpenAtom = atom<boolean>(false);
export const bulkDeleteDialogOpenAtom = atom<boolean>(false);

// Selected items for operations
export const selectedSaleForRevertAtom = atom<SaleRecord | null>(null);
export const selectedSaleForDeleteAtom = atom<SaleRecord | null>(null);
export const selectedSaleIdsAtom = atom<Set<string>>(new Set<string>());

// Filter states (with persistence)
export const selectedItemFilterAtom = atomWithStorage("salesHistorySelectedItem", "all");
export const selectedSectionFilterAtom = atomWithStorage("salesHistorySelectedSection", "all");
export const dateFilterAtom = atomWithStorage("salesHistoryDateFilter", "");

// Derived atoms
export const itemSalesAtom = atom<ItemSale[]>(get => {
  const sales = get(salesAtom);
  const items: ItemSale[] = [];

  sales.forEach(sale => {
    // Add individual items
    sale.items?.forEach((item, index) => {
      items.push({
        id: `${sale.id}-item-${index}`,
        saleId: sale.id || "",
        saleDate: new Date(sale.saleDate),
        sectionId: sale.sectionId,
        sectionName: sale.section?.name,
        itemName: item.materialName || "Unknown Item",
        itemType: "individual",
        quantity: item.quantity,
        unit: item.unit,
        unitPrice: parseFloat(String(item.unitPrice || 0)),
        totalPrice: parseFloat(String(item.totalPrice || 0)),
        materialId: item.materialId
      });
    });

    // Add menu items
    sale.menuItems?.forEach((menuItem, index) => {
      items.push({
        id: `${sale.id}-menu-${index}`,
        saleId: sale.id || "",
        saleDate: new Date(sale.saleDate),
        sectionId: sale.sectionId,
        sectionName: sale.section?.name,
        itemName: menuItem.menuItemName || `Menu Item ${menuItem.menuItemId}`,
        itemType: "menu",
        quantity: menuItem.quantity,
        unitPrice: parseFloat(String(menuItem.unitPrice || 0)),
        totalPrice: parseFloat(String(menuItem.totalPrice || 0)),
        menuItemId: menuItem.menuItemId
      });
    });
  });

  return items;
});

export const uniqueItemNamesAtom = atom<string[]>(get => {
  const itemSales = get(itemSalesAtom);
  const names = new Set(itemSales.map(item => item.itemName));
  return Array.from(names).sort();
});

export const uniqueSectionNamesAtom = atom<string[]>(get => {
  const itemSales = get(itemSalesAtom);
  const sections = new Set(itemSales.map(item => item.sectionName || `Section ${item.sectionId}`).filter(Boolean));
  return Array.from(sections).sort();
});

export const filteredItemSalesAtom = atom<ItemSale[]>(get => {
  const itemSales = get(itemSalesAtom);
  const selectedItem = get(selectedItemFilterAtom);
  const selectedSection = get(selectedSectionFilterAtom);
  const dateFilter = get(dateFilterAtom);

  let filtered = [...itemSales];

  // Item filter
  if (selectedItem && selectedItem !== "all") {
    filtered = filtered.filter(item => item.itemName === selectedItem);
  }

  // Section filter
  if (selectedSection && selectedSection !== "all") {
    filtered = filtered.filter(item => {
      const itemSectionName = item.sectionName || `Section ${item.sectionId}`;
      return itemSectionName === selectedSection;
    });
  }

  // Date filter
  if (dateFilter) {
    filtered = filtered.filter(item => {
      const itemDate = item.saleDate.toISOString().split("T")[0];
      return itemDate === dateFilter;
    });
  }

  return filtered.sort((a, b) => b.saleDate.getTime() - a.saleDate.getTime());
});

export const allVisibleSelectedAtom = atom<boolean>(get => {
  const visibleSaleIds = get(visibleSaleIdsAtom);
  const selectedSaleIds = get(selectedSaleIdsAtom);
  return visibleSaleIds.size > 0 && Array.from(visibleSaleIds).every(id => selectedSaleIds.has(id));
});

export const someVisibleSelectedAtom = atom<boolean>(get => {
  const visibleSaleIds = get(visibleSaleIdsAtom);
  const selectedSaleIds = get(selectedSaleIdsAtom);
  return Array.from(visibleSaleIds).some(id => selectedSaleIds.has(id));
});

// Derived atoms for visible sale IDs
export const visibleSaleIdsAtom = atom<Set<string>>(get => {
  const filteredItemSales = get(filteredItemSalesAtom);
  const saleIds = new Set<string>();
  filteredItemSales.forEach(item => saleIds.add(item.saleId));
  return saleIds;
});

// Selection state atoms
export const isAllSelectedAtom = atom<boolean>(get => {
  const visibleSaleIds = get(visibleSaleIdsAtom);
  const selectedSaleIds = get(selectedSaleIdsAtom);
  if (visibleSaleIds.size === 0) return false;
  return Array.from(visibleSaleIds).every(id => selectedSaleIds.has(id));
});

export const hasSelectionAtom = atom<boolean>(get => {
  const selectedSaleIds = get(selectedSaleIdsAtom);
  return selectedSaleIds.size > 0;
});

// Summary calculations
export const totalSalesAtom = atom<number>(get => {
  const filteredItemSales = get(filteredItemSalesAtom);
  return filteredItemSales.reduce((sum, item) => sum + item.totalPrice, 0);
});

export const totalQuantityAtom = atom<number>(get => {
  const filteredItemSales = get(filteredItemSalesAtom);
  return filteredItemSales.reduce((sum, item) => sum + item.quantity, 0);
});

// Helper functions for selection
export const toggleSaleSelection = (get: any, set: any, saleId: string) => {
  const currentSelection = get(selectedSaleIdsAtom);
  const newSet = new Set(currentSelection);

  if (newSet.has(saleId)) {
    newSet.delete(saleId);
  } else {
    newSet.add(saleId);
  }

  set(selectedSaleIdsAtom, newSet);
};

export const toggleSelectAll = (get: any, set: any) => {
  const visibleSaleIds = get(visibleSaleIdsAtom);
  const selectedSaleIds = get(selectedSaleIdsAtom);
  const allSelected = Array.from(visibleSaleIds).every(id => selectedSaleIds.has(id));

  if (allSelected) {
    // Deselect all visible sales
    const newSet = new Set(selectedSaleIds);
    visibleSaleIds.forEach(id => newSet.delete(id));
    set(selectedSaleIdsAtom, newSet);
  } else {
    // Select all visible sales
    const newSet = new Set(selectedSaleIds);
    visibleSaleIds.forEach(id => newSet.add(id));
    set(selectedSaleIdsAtom, newSet);
  }
};

export const clearSelection = (get: any, set: any) => {
  set(selectedSaleIdsAtom, new Set());
};

export const clearFilters = (get: any, set: any) => {
  set(selectedItemFilterAtom, "all");
  set(selectedSectionFilterAtom, "all");
  set(dateFilterAtom, "");
};

import { salesAPI } from "@/api/sales.api.ts";
import { salesAtom } from "@/store/salesAtoms";
import { SaleRecord, StockRestorationItem } from "@/types/inventory";
import { useAtom } from "jotai";
import { useCallback, useState } from "react";

interface UseSalesOperationsReturn {
  // Data
  sales: SaleRecord[];
  isLoading: boolean;
  error: string | null;

  // Operation states
  isReverting: boolean;
  isDeleting: boolean;
  isBulkReverting: boolean;
  isBulkDeleting: boolean;

  // Success messages
  revertSuccess: string | null;
  deleteSuccess: string | null;
  setDeleteSuccess: (value: string | null) => void;
  bulkRevertSuccess: string | null;
  bulkDeleteSuccess: string | null;
  stockRestorationReport: StockRestorationItem[];
  bulkStockRestorationReport: StockRestorationItem[];

  // Dialog states
  revertDialogOpen: boolean;
  deleteDialogOpen: boolean;
  bulkRevertDialogOpen: boolean;
  bulkDeleteDialogOpen: boolean;
  stockRestorationModalOpen: boolean;
  deleteConfirmationModalOpen: boolean;

  // Selected items
  selectedSaleForRevert: SaleRecord | null;
  selectedSaleForDelete: SaleRecord | null;
  selectedSaleIds: Set<string>;

  // Setters for dialogs and selected items
  setRevertDialogOpen: (open: boolean) => void;
  setDeleteDialogOpen: (open: boolean) => void;
  setBulkRevertDialogOpen: (open: boolean) => void;
  setBulkDeleteDialogOpen: (open: boolean) => void;
  setStockRestorationModalOpen: (open: boolean) => void;
  setDeleteConfirmationModalOpen: (open: boolean) => void;
  setSelectedSaleForRevert: (sale: SaleRecord | null) => void;
  setSelectedSaleForDelete: (sale: SaleRecord | null) => void;
  setSelectedSaleIds: (ids: Set<string>) => void;

  // Actions
  fetchSales: () => Promise<void>;
  revertSale: (sale: SaleRecord) => Promise<void>;
  softDeleteSale: (sale: SaleRecord, itemId?: string, itemType?: "material" | "menu") => Promise<void>;
  deleteSaleItem: (saleId: string, itemId: string, itemType: "material" | "menu") => Promise<void>;
  bulkDeleteSales: (saleIds: Set<string>) => Promise<void>;
  bulkRevertSales: (saleIds: Set<string>) => Promise<void>;
}

export const useSalesOperations = (): UseSalesOperationsReturn => {
  const [sales, setSales] = useAtom(salesAtom);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isReverting, setIsReverting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isBulkReverting, setIsBulkReverting] = useState(false);
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);
  const [revertSuccess, setRevertSuccess] = useState<string | null>(null);
  const [deleteSuccess, setDeleteSuccess] = useState<string | null>(null);
  const [bulkRevertSuccess, setBulkRevertSuccess] = useState<string | null>(null);
  const [bulkDeleteSuccess, setBulkDeleteSuccess] = useState<string | null>(null);
  const [stockRestorationReport, setStockRestorationReport] = useState<StockRestorationItem[]>([]);
  const [bulkStockRestorationReport, setBulkStockRestorationReport] = useState<StockRestorationItem[]>([]);
  const [revertDialogOpen, setRevertDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [bulkRevertDialogOpen, setBulkRevertDialogOpen] = useState(false);
  const [bulkDeleteDialogOpen, setBulkDeleteDialogOpen] = useState(false);
  const [stockRestorationModalOpen, setStockRestorationModalOpen] = useState(false);
  const [deleteConfirmationModalOpen, setDeleteConfirmationModalOpen] = useState(false);
  const [selectedSaleForRevert, setSelectedSaleForRevert] = useState<SaleRecord | null>(null);
  const [selectedSaleForDelete, setSelectedSaleForDelete] = useState<SaleRecord | null>(null);
  const [selectedSaleIds, setSelectedSaleIds] = useState<Set<string>>(new Set());

  const fetchSales = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await salesAPI.getSales();
      setSales(response.data || []);
    } catch (error) {
      console.error("Error fetching sales:", error);
      setError(error instanceof Error ? error.message : "Failed to fetch sales");
    } finally {
      setIsLoading(false);
    }
  }, [setSales]);

  const revertSale = useCallback(
    async (sale: SaleRecord) => {
      if (!sale?.id) return;

      setIsReverting(true);
      setError(null);

      // Store original sales for potential rollback
      const originalSales = [...sales];

      try {
        // Optimistic update: remove sale immediately
        const updatedSales = sales.filter(s => s.id !== sale.id);
        setSales(updatedSales);
        setRevertDialogOpen(false);

        // Make API call
        const response = await salesAPI.revertSale(sale.id.toString());

        // Show stock restoration modal with details
        if (response.data.stockRestorationReport && response.data.stockRestorationReport.length > 0) {
          setStockRestorationReport(response.data.stockRestorationReport);
          setStockRestorationModalOpen(true);
        } else {
          setRevertSuccess("Sale reverted successfully!");
        }
      } catch (error) {
        console.error("Error reverting sale:", error);

        // Rollback: restore original sales
        setSales(originalSales);

        setError(error instanceof Error ? error.message : "Failed to revert sale");
      } finally {
        setIsReverting(false);
      }
    },
    [sales, setSales, setIsReverting, setError, setRevertDialogOpen, setRevertSuccess, setStockRestorationReport]
  );

  const softDeleteSale = useCallback(
    async (sale: SaleRecord, itemId?: string, itemType?: "material" | "menu"): Promise<void> => {
      if (!sale?.id) return;

      setIsDeleting(true);
      setError(null);

      try {
        if (itemId && itemType) {
          // Delete specific item from sale
          await salesAPI.deleteSaleItem(sale.id.toString(), itemId, itemType);
          // Refresh sales data to get the updated sale with the item removed
          await fetchSales();
        } else {
          // Delete entire sale
          await salesAPI.deleteSale(sale.id.toString());
          // Update local state for full sale deletion
          setSales(prevSales => prevSales.filter(s => s.id !== sale.id));
        }

        setDeleteDialogOpen(false);
        setDeleteConfirmationModalOpen(true);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to delete sale');
      } finally {
        setIsDeleting(false);
      }
    },
    [fetchSales, setSales, setIsDeleting, setError, setDeleteDialogOpen, setDeleteConfirmationModalOpen]
  );

  const deleteSaleItem = useCallback(
    async (saleId: string, itemId: string, itemType: "material" | "menu"): Promise<void> => {
      setIsDeleting(true);
      setError(null);
      try {
        await salesAPI.deleteSaleItem(saleId, itemId, itemType);
        // Refresh the sales data to reflect the deletion
        await fetchSales();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to delete sale item");
        throw err; // Re-throw to allow error handling in the component
      } finally {
        setIsDeleting(false);
      }
    },
    [fetchSales, setIsDeleting, setError]
  );

  const bulkDeleteSales = useCallback(
    async (saleIds: Set<string>) => {
      if (saleIds.size === 0) return;

      setIsBulkDeleting(true);
      setError(null);

      // Store original sales for potential rollback
      const originalSales = [...sales];

      try {
        // Optimistic update: remove sales immediately
        const updatedSales = sales.filter(sale => !saleIds.has(sale.id.toString()));
        setSales(updatedSales);
        setBulkDeleteDialogOpen(false);
        setSelectedSaleIds(new Set());

        // Make parallel API calls
        const deletePromises = Array.from(saleIds).map(saleId => salesAPI.deleteSale(saleId));
        await Promise.all(deletePromises);

        // Show success message
        setBulkDeleteSuccess(`Successfully deleted ${saleIds.size} sales!`);

        // Auto-hide success message
        setTimeout(() => setBulkDeleteSuccess(null), 3000);
      } catch (error) {
        console.error("Error bulk deleting sales:", error);

        // Rollback: restore original sales
        setSales(originalSales);

        setError(error instanceof Error ? error.message : "Failed to delete sales");

        // Auto-hide error message
        setTimeout(() => setError(null), 5000);
      } finally {
        setIsBulkDeleting(false);
      }
    },
    [sales, setSales, setSelectedSaleIds, setIsBulkDeleting, setError, setBulkDeleteDialogOpen, setBulkDeleteSuccess]
  );

  const bulkRevertSales = useCallback(
    async (saleIds: Set<string>) => {
      if (saleIds.size === 0) return;

      setIsBulkReverting(true);
      setError(null);

      // Store original sales for potential rollback
      const originalSales = [...sales];

      try {
        // Optimistic update: remove sales immediately
        const updatedSales = sales.filter(sale => !saleIds.has(sale.id.toString()));
        setSales(updatedSales);
        setBulkRevertDialogOpen(false);
        setSelectedSaleIds(new Set());

        // Make parallel API calls
        const revertPromises = Array.from(saleIds).map(saleId => salesAPI.revertSale(saleId));
        const responses = await Promise.all(revertPromises);

        // Combine all stock restoration reports
        const allRestorationItems: StockRestorationItem[] = [];
        responses.forEach(response => {
          if (response.data.stockRestorationReport) {
            allRestorationItems.push(...response.data.stockRestorationReport);
          }
        });

        // Group restoration items by material
        const groupedRestoration = allRestorationItems.reduce(
          (acc, item) => {
            const key = `${item.materialId}-${item.materialName}-${item.unit}`;
            if (acc[key]) {
              acc[key].quantityRestored += item.quantityRestored;
            } else {
              acc[key] = { ...item };
            }
            return acc;
          },
          {} as Record<string, StockRestorationItem>
        );

        const combinedReport = Object.values(groupedRestoration);

        // Show success message with restoration details
        if (combinedReport.length > 0) {
          setBulkStockRestorationReport(combinedReport);
          const restorationSummary = combinedReport.map(item => `${item.materialName}: +${item.quantityRestored} ${item.unit}`).join(", ");
          setBulkRevertSuccess(`Successfully reverted ${saleIds.size} sales! Stock restored: ${restorationSummary}`);
        } else {
          setBulkRevertSuccess(`Successfully reverted ${saleIds.size} sales!`);
        }

        // Auto-hide success message
        setTimeout(() => {
          setBulkRevertSuccess(null);
          setBulkStockRestorationReport([]);
        }, 8000);
      } catch (error) {
        console.error("Error bulk reverting sales:", error);
        // Rollback: restore original sales
        setSales(originalSales);
        setError(error instanceof Error ? error.message : "Failed to revert sales");
        // Auto-hide error message
        setTimeout(() => setError(null), 5000);
      } finally {
        setIsBulkReverting(false);
      }
    },
    [sales, setSales, setSelectedSaleIds, setIsBulkReverting, setError, setBulkRevertDialogOpen, setBulkRevertSuccess, setBulkStockRestorationReport]
  );

  return {
    // Data
    sales,
    isLoading,
    error,

    // Operation states
    isReverting,
    isDeleting,
    isBulkReverting,
    isBulkDeleting,

    // Success messages
    revertSuccess,
    deleteSuccess,
    bulkRevertSuccess,
    bulkDeleteSuccess,
    stockRestorationReport,
    bulkStockRestorationReport,

    // Dialog states
    revertDialogOpen,
    deleteDialogOpen,
    bulkRevertDialogOpen,
    bulkDeleteDialogOpen,
    stockRestorationModalOpen,
    deleteConfirmationModalOpen,

    // Selected items
    selectedSaleForRevert,
    selectedSaleForDelete,
    selectedSaleIds,

    // Setters for dialogs and selected items
    setDeleteSuccess,
    setRevertDialogOpen,
    setDeleteDialogOpen,
    setBulkRevertDialogOpen,
    setBulkDeleteDialogOpen,
    setStockRestorationModalOpen,
    setDeleteConfirmationModalOpen,
    setSelectedSaleForRevert,
    setSelectedSaleForDelete,
    setSelectedSaleIds,

    // Actions
    fetchSales,
    revertSale,
    softDeleteSale,
    deleteSaleItem,
    bulkDeleteSales,
    bulkRevertSales
  };
};

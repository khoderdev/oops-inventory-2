import { salesAPI } from "@/api/sales.api.ts";
import { SaleRecord, StockRestorationItem } from "@/types/inventory";
import { useCallback } from "react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { RootState } from "@/store/index";
import { setIsLoading, setError, setIsReverting, setIsDeleting, setIsBulkReverting, setIsBulkDeleting, setRevertSuccess, setDeleteSuccess, setBulkRevertSuccess, setBulkDeleteSuccess, setStockRestorationReport, setBulkStockRestorationReport, setRevertDialogOpen, setDeleteDialogOpen, setBulkRevertDialogOpen, setBulkDeleteDialogOpen, setStockRestorationModalOpen, setDeleteConfirmationModalOpen, setSelectedSaleForRevert, setSelectedSaleForDelete, clearSelection } from "@/store/slices/posSlice";

export const useSalesOperationsRedux = () => {
  const dispatch = useAppDispatch();
  const { salesHistory: sales, isLoading, error, isReverting, isDeleting, isBulkReverting, isBulkDeleting, revertSuccess, deleteSuccess, bulkRevertSuccess, bulkDeleteSuccess, stockRestorationReport, bulkStockRestorationReport, revertDialogOpen, deleteDialogOpen, bulkRevertDialogOpen, bulkDeleteDialogOpen, stockRestorationModalOpen, deleteConfirmationModalOpen, selectedSaleForRevert, selectedSaleForDelete, selectedItemIds } = useAppSelector(state => state.pos);

  const fetchSales = useCallback(async () => {
    dispatch(setIsLoading(true));
    dispatch(setError(null));
    try {
      const response = await salesAPI.getSales();
      // We would need to add a new action to update sales in Redux
      // For now, we'll just return the data
      return response.data || [];
    } catch (error) {
      console.error("Error fetching sales:", error);
      dispatch(setError(error instanceof Error ? error.message : "Failed to fetch sales"));
    } finally {
      dispatch(setIsLoading(false));
    }
  }, [dispatch]);

  const revertSale = useCallback(
    async (sale: SaleRecord) => {
      if (!sale?.id) return;

      dispatch(setIsReverting(true));
      dispatch(setError(null));

      try {
        // Make API call
        const response = await salesAPI.revertSale(sale.id.toString());
        dispatch(setRevertDialogOpen(false));

        // Show stock restoration modal with details
        if (response.data.stockRestorationReport && response.data.stockRestorationReport.length > 0) {
          dispatch(setStockRestorationReport(response.data.stockRestorationReport));
          dispatch(setStockRestorationModalOpen(true));
        } else {
          dispatch(setRevertSuccess("Sale reverted successfully!"));
        }

        // Refresh sales data
        await fetchSales();
      } catch (error) {
        console.error("Error reverting sale:", error);
        dispatch(setError(error instanceof Error ? error.message : "Failed to revert sale"));
      } finally {
        dispatch(setIsReverting(false));
      }
    },
    [dispatch, fetchSales]
  );

  const softDeleteSale = useCallback(
    async (sale: SaleRecord, itemId?: string, itemType?: "material" | "menu"): Promise<void> => {
      if (!sale?.id) return;

      dispatch(setIsDeleting(true));
      dispatch(setError(null));

      try {
        if (itemId && itemType) {
          // Delete specific item from sale
          await salesAPI.deleteSaleItem(sale.id.toString(), itemId, itemType);
          // Refresh sales data to get the updated sale with the item removed
          await fetchSales();
        } else {
          // Delete entire sale
          await salesAPI.deleteSale(sale.id.toString());
          // Refresh sales data
          await fetchSales();
        }

        dispatch(setDeleteDialogOpen(false));
        dispatch(setDeleteConfirmationModalOpen(false));
      } catch (err) {
        dispatch(setError(err instanceof Error ? err.message : "Failed to delete sale"));
      } finally {
        dispatch(setIsDeleting(false));
      }
    },
    [dispatch, fetchSales]
  );

  const deleteSaleItem = useCallback(
    async (saleId: string, itemId: string, itemType: "material" | "menu"): Promise<void> => {
      dispatch(setIsDeleting(true));
      dispatch(setError(null));
      try {
        // Delete the specific item
        await salesAPI.deleteSaleItem(saleId, itemId, itemType);
        // Refresh the sales data to reflect the deletion
        await fetchSales();
      } catch (err) {
        dispatch(setError(err instanceof Error ? err.message : "Failed to delete sale item"));
        throw err;
      } finally {
        dispatch(setIsDeleting(false));
      }
    },
    [dispatch, fetchSales]
  );

  const deleteSaleItems = useCallback(
    async (saleId: string, itemIds: string[], itemType: "material" | "menu") => {
      dispatch(setIsDeleting(true));
      dispatch(setError(null));
      try {
        const response = await salesAPI.deleteSaleItems(saleId, itemIds, itemType);
        await fetchSales();
        return response.data;
      } catch (err) {
        dispatch(setError(err instanceof Error ? err.message : "Failed to delete sale items"));
        throw err;
      } finally {
        dispatch(setIsDeleting(false));
      }
    },
    [dispatch, fetchSales]
  );

  const bulkRevertSales = useCallback(
    async (saleIds: Set<string>) => {
      if (saleIds.size === 0) return;

      dispatch(setIsBulkReverting(true));
      dispatch(setError(null));

      try {
        dispatch(setBulkRevertDialogOpen(false));
        dispatch(clearSelection());

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
          dispatch(setBulkStockRestorationReport(combinedReport));
          const restorationSummary = combinedReport.map(item => `${item.materialName}: +${item.quantityRestored} ${item.unit}`).join(", ");
          dispatch(setBulkRevertSuccess(`Successfully reverted ${saleIds.size} sales! Stock restored: ${restorationSummary}`));
        } else {
          dispatch(setBulkRevertSuccess(`Successfully reverted ${saleIds.size} sales!`));
        }

        // Refresh sales data
        await fetchSales();

        // Auto-hide success message
        setTimeout(() => {
          dispatch(setBulkRevertSuccess(null));
          dispatch(setBulkStockRestorationReport([]));
        }, 8000);
      } catch (error) {
        console.error("Error bulk reverting sales:", error);
        dispatch(setError(error instanceof Error ? error.message : "Failed to revert sales"));
        // Auto-hide error message
        setTimeout(() => dispatch(setError(null)), 5000);
      } finally {
        dispatch(setIsBulkReverting(false));
      }
    },
    [dispatch, fetchSales]
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
    selectedItemIds,

    // Actions
    fetchSales,
    revertSale,
    softDeleteSale,
    deleteSaleItem,
    deleteSaleItems,
    bulkRevertSales
  };
};

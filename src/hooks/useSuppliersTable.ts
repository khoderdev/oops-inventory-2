import { useState, useEffect, useMemo, useCallback } from 'react';
import { suppliersAPI } from '@/api/suppliers.api';
import { Supplier, SuppliersQueryParams } from '@/types/suppliers';
import { useToast } from './use-toast';

/**
 * Hook specifically designed for supplier data tables with sorting, filtering and pagination
 */
export const useSuppliersTable = (initialParams?: SuppliersQueryParams) => {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [params, setParams] = useState<SuppliersQueryParams>(initialParams || {});
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<boolean | undefined>(undefined);
  const { toast } = useToast();
  
  // Add refreshKey state to trigger re-fetches when data changes
  const [refreshKey, setRefreshKey] = useState(0);
  
  // Debounce API calls with a ref to track last fetch time
  const [lastFetchTime, setLastFetchTime] = useState(0);

  // Fetch suppliers - optimized to prevent excessive API calls
  const fetchData = useCallback(async (force = false) => {
    // Prevent multiple fetches within 2 seconds unless forced
    const now = Date.now();
    if (!force && now - lastFetchTime < 2000) {
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      setLastFetchTime(now);
      
      // Add cache-busting parameter only when needed
      const queryParams = { ...params, _t: now };
      const data = await suppliersAPI.getSuppliers(queryParams);
      setSuppliers(data);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch suppliers';
      setError(message);
      toast({
        title: 'Error',
        description: message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [params, toast, lastFetchTime]);

  // Initial fetch and param changes
  useEffect(() => {
    fetchData();
  }, [fetchData, refreshKey]);

  // Client-side filtering with memoization to prevent unnecessary recalculations
  const filteredSuppliers = useMemo(() => {
    let filtered = [...suppliers];
    
    // Apply search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(supplier => 
        (supplier.name?.toLowerCase().includes(term) || false) ||
        (supplier.contactPerson?.toLowerCase().includes(term) || false) ||
        (supplier.email?.toLowerCase().includes(term) || false) ||
        (supplier.phone?.toLowerCase().includes(term) || false) ||
        (supplier.address?.toLowerCase().includes(term) || false)
      );
    }
    
    // Apply status filter
    if (statusFilter !== undefined) {
      filtered = filtered.filter(supplier => supplier.isActive === statusFilter);
    }
    
    return filtered;
  }, [suppliers, searchTerm, statusFilter]);

  // Computed properties with memoization
  const activeSuppliers = useMemo(() => 
    suppliers.filter(supplier => supplier.isActive), 
    [suppliers]
  );
  
  const inactiveSuppliers = useMemo(() => 
    suppliers.filter(supplier => !supplier.isActive), 
    [suppliers]
  );

  // Update search and filters - optimized to prevent unnecessary renders
  const updateSearch = useCallback((term: string) => {
    setSearchTerm(term);
  }, []);

  const updateStatusFilter = useCallback((status: boolean | undefined) => {
    setStatusFilter(status);
  }, []);

  const updateSortOrder = useCallback((field: string, order: 'ASC' | 'DESC') => {
    setParams(prev => ({
      ...prev,
      sortBy: field,
      sortOrder: order
    }));
  }, []);

  const updatePage = useCallback((page: number) => {
    setParams(prev => ({
      ...prev,
      page
    }));
  }, []);

  const updatePageSize = useCallback((limit: number) => {
    setParams(prev => ({
      ...prev,
      limit,
      page: 1 // Reset to first page when changing page size
    }));
  }, []);

  // Toggle supplier status - optimized with local state update
  const toggleStatus = useCallback(async (id: number | string) => {
    try {
      setLoading(true);
      const response = await suppliersAPI.toggleSupplierStatus(id);
      
      // Update local state immediately for better UX
      setSuppliers(prev => 
        prev.map(supplier => 
          supplier.id === Number(id) 
            ? { ...supplier, isActive: !supplier.isActive }
            : supplier
        )
      );
      
      const statusText = response.data.isActive ? 'activated' : 'deactivated';
      toast({
        title: 'Success',
        description: `Supplier ${response.data.name} ${statusText} successfully`,
      });
      
      return response.data;
    } catch (err) {
      const message = err instanceof Error ? err.message : `Failed to toggle supplier status`;
      setError(message);
      toast({
        title: 'Error',
        description: message,
        variant: 'destructive',
      });
      return null;
    } finally {
      setLoading(false);
    }
  }, [toast]);

  // Refresh data - optimized to use the fetchData function and refreshKey
  const refresh = useCallback(() => {
    setRefreshKey(prev => prev + 1); // Increment refresh key to trigger re-fetch
    return fetchData(true); // Force refresh
  }, [fetchData]);

  // Reset all filters
  const resetFilters = useCallback(() => {
    setSearchTerm('');
    setStatusFilter(undefined);
    setParams(initialParams || {});
  }, [initialParams]);

  return {
    // Data
    suppliers,
    filteredSuppliers,
    activeSuppliers,
    inactiveSuppliers,
    loading,
    error,
    searchTerm,
    statusFilter,
    
    // Actions
    updateSearch,
    updateStatusFilter,
    updateSortOrder,
    updatePage,
    updatePageSize,
    toggleStatus,
    refresh,
    resetFilters
  };
};

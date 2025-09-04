import { useState, useEffect } from 'react';
import { suppliersAPI } from '@/api/suppliers.api';
import { 
  Supplier, 
  SuppliersQueryParams,
  SupplierPayment,
  SupplierPaymentsQueryParams
} from '@/types/suppliers';

/**
 * A simplified hook for supplier operations
 * Provides basic data fetching with automatic loading states
 */
export const useSuppliersSimple = (initialParams?: SuppliersQueryParams) => {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [params, setParams] = useState<SuppliersQueryParams | undefined>(initialParams);

  // Fetch suppliers on mount and when params change
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await suppliersAPI.getSuppliers(params);
        setSuppliers(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch suppliers');
        console.error('Error fetching suppliers:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [params]);

  // Update search parameters
  const updateParams = (newParams: SuppliersQueryParams) => {
    setParams(prev => ({ ...prev, ...newParams }));
  };

  // Filter to only active suppliers
  const filterActiveOnly = () => {
    setParams(prev => ({ ...prev, isActive: true }));
  };

  // Reset filters
  const resetFilters = () => {
    setParams(initialParams);
  };

  // Toggle supplier active status
  const toggleStatus = async (id: number | string) => {
    try {
      setLoading(true);
      const result = await suppliersAPI.toggleSupplierStatus(id);
      
      // Update the supplier in the local state
      setSuppliers(prev => 
        prev.map(supplier => 
          supplier.id === Number(id) 
            ? { ...supplier, isActive: !supplier.isActive }
            : supplier
        )
      );
      
      return result.data;
    } catch (err) {
      setError(err instanceof Error ? err.message : `Failed to toggle supplier status`);
      console.error('Error toggling supplier status:', err);
      return null;
    } finally {
      setLoading(false);
    }
  };

  return {
    suppliers,
    loading,
    error,
    updateParams,
    filterActiveOnly,
    resetFilters,
    toggleStatus
  };
};

/**
 * Hook for supplier payments with automatic loading
 */
export const useSupplierPayments = (supplierId?: number | string) => {
  const [payments, setPayments] = useState<SupplierPayment[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch payments when supplierId changes
  useEffect(() => {
    if (!supplierId) return;
    
    const fetchPayments = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await suppliersAPI.getSupplierPayments({ supplierId });
        setPayments(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch supplier payments');
        console.error('Error fetching supplier payments:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchPayments();
  }, [supplierId]);

  // Fetch payment statistics
  const fetchStats = async (id: number | string = supplierId!) => {
    if (!id) return null;
    
    try {
      setLoading(true);
      const response = await suppliersAPI.getSupplierPaymentStats(id);
      return response.data;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch payment statistics');
      console.error('Error fetching payment statistics:', err);
      return null;
    } finally {
      setLoading(false);
    }
  };

  return {
    payments,
    loading,
    error,
    fetchStats,
    refresh: async () => {
      if (supplierId) {
        try {
          setLoading(true);
          const data = await suppliersAPI.getSupplierPayments({ supplierId });
          setPayments(data);
        } catch (err) {
          console.error('Error refreshing payments:', err);
        } finally {
          setLoading(false);
        }
      }
    }
  };
};

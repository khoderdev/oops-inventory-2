import { useState, useEffect, useCallback } from 'react';
import { suppliersAPI } from '@/api/suppliers.api';
import { Supplier, SuppliersQueryParams } from '@/types/suppliers';
import { getDefaultStore } from 'jotai';

// Create a prefetch action for suppliers
const prefetchSuppliersAction = async (options?: { force?: boolean }) => {
  try {
    const response = await suppliersAPI.getSuppliers({ limit: 1000, _t: Date.now() });
    return response;
  } catch (error) {
    console.error('Error prefetching suppliers:', error);
    throw error;
  }
};

// Cache key for suppliers
const SUPPLIERS_CACHE_KEY = 'suppliers';

/**
 * Hook that provides suppliers data with prefetch capabilities
 * Similar to the prefetch pattern used in inventory components
 */
export const useSuppliersWithPrefetch = (params?: SuppliersQueryParams) => {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const store = getDefaultStore();
  
  // Cache management
  const invalidateCache = useCallback(() => {
    localStorage.removeItem(SUPPLIERS_CACHE_KEY);
  }, []);

  // Prefetch suppliers
  const prefetchSuppliers = useCallback(async (options?: { force?: boolean }) => {
    try {
      setLoading(true);
      const force = options?.force || false;
      
      // Check cache if not forcing refresh
      if (!force) {
        const cachedData = localStorage.getItem(SUPPLIERS_CACHE_KEY);
        if (cachedData) {
          const { data, timestamp } = JSON.parse(cachedData);
          // Cache valid for 60 seconds
          if (Date.now() - timestamp < 60000) {
            setSuppliers(data);
            setLoading(false);
            return data;
          }
        }
      }
      
      // Fetch fresh data
      const data = await suppliersAPI.getSuppliers({ 
        ...params,
        limit: 1000, 
        _t: Date.now() 
      });
      
      // Update cache
      localStorage.setItem(
        SUPPLIERS_CACHE_KEY, 
        JSON.stringify({ data, timestamp: Date.now() })
      );
      
      setSuppliers(data);
      return data;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch suppliers';
      setError(message);
      console.error('Error in prefetchSuppliers:', err);
      return [];
    } finally {
      setLoading(false);
    }
  }, [params]);

  // Initial fetch
  useEffect(() => {
    prefetchSuppliers();
  }, [prefetchSuppliers]);

  // CRUD operations with cache invalidation
  const createSupplierWithCache = async (...args: Parameters<typeof suppliersAPI.createSupplier>) => {
    const result = await suppliersAPI.createSupplier(...args);
    invalidateCache();
    prefetchSuppliers({ force: true }).catch(console.error);
    return result;
  };

  const updateSupplierWithCache = async (...args: Parameters<typeof suppliersAPI.updateSupplier>) => {
    const result = await suppliersAPI.updateSupplier(...args);
    invalidateCache();
    prefetchSuppliers({ force: true }).catch(console.error);
    return result;
  };

  const deleteSupplierWithCache = async (...args: Parameters<typeof suppliersAPI.deleteSupplier>) => {
    const result = await suppliersAPI.deleteSupplier(...args);
    invalidateCache();
    prefetchSuppliers({ force: true }).catch(console.error);
    return result;
  };

  const toggleSupplierStatusWithCache = async (...args: Parameters<typeof suppliersAPI.toggleSupplierStatus>) => {
    const result = await suppliersAPI.toggleSupplierStatus(...args);
    invalidateCache();
    prefetchSuppliers({ force: true }).catch(console.error);
    return result;
  };

  return {
    suppliers,
    loading,
    error,
    prefetchSuppliers,
    invalidateCache,
    createSupplierWithCache,
    updateSupplierWithCache,
    deleteSupplierWithCache,
    toggleSupplierStatusWithCache,
    refresh: (force = true) => prefetchSuppliers({ force })
  };
};

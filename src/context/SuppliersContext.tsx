import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import { suppliersAPI } from "@/api/suppliers.api";
import { Supplier, SupplierPayment, CreateSupplierData, UpdateSupplierData, CreateSupplierPaymentData, UpdateSupplierPaymentData } from "@/types/suppliers";
import { useToast } from "@/hooks/use-toast";

// Define the context type
interface SuppliersContextType {
  // Data
  suppliers: Supplier[];
  filteredSuppliers: Supplier[];
  loading: boolean;
  error: string | null;
  searchTerm: string;

  // Supplier actions
  fetchSuppliers: (force?: boolean) => Promise<void>;
  refresh: () => Promise<void>;
  getSupplier: (id: number | string) => Promise<Supplier | null>;
  createSupplier: (data: CreateSupplierData) => Promise<Supplier | null>;
  updateSupplier: (id: number | string, data: UpdateSupplierData) => Promise<Supplier | null>;
  deleteSupplier: (id: number | string) => Promise<boolean>;
  toggleSupplierStatus: (id: number | string) => Promise<any>;

  // Payment actions
  getSupplierPayments: (supplierId: number | string) => Promise<SupplierPayment[]>;
  createSupplierPayment: (data: CreateSupplierPaymentData) => Promise<{ data: SupplierPayment } | null>;
  updateSupplierPayment: (id: number | string, data: UpdateSupplierPaymentData) => Promise<{ data: SupplierPayment } | null>;
  deleteSupplierPayment: (id: number | string) => Promise<boolean>;

  // UI actions
  updateSearch: (term: string) => void;
  resetFilters: () => void;
}

// Create the context with a default value
const SuppliersContext = createContext<SuppliersContextType | undefined>(undefined);

// Provider component
export const SuppliersProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // State
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<boolean | undefined>(undefined);
  const [lastFetchTime, setLastFetchTime] = useState(0);
  const { toast } = useToast();

  // Fetch suppliers
  const fetchSuppliers = useCallback(
    async (force?: boolean) => {
      // Prevent multiple fetches within 2 seconds unless forced
      const now = Date.now();
      if (!force && now - lastFetchTime < 2000) {
        return;
      }

      try {
        setLoading(true);
        setError(null);
        setLastFetchTime(now);

        const data = await suppliersAPI.getSuppliers({ _t: now });
        setSuppliers(data);
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to fetch suppliers";
        setError(message);
        toast({
          title: "Error",
          description: message,
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    },
    [lastFetchTime, toast]
  );

  // Initial fetch
  useEffect(() => {
    fetchSuppliers();
  }, [fetchSuppliers]);

  // Get a single supplier
  const getSupplier = useCallback(
    async (id: number | string) => {
      try {
        setLoading(true);
        const response = await suppliersAPI.getSupplier(id);
        return response.data;
      } catch (err) {
        const message = err instanceof Error ? err.message : `Failed to fetch supplier #${id}`;
        toast({
          title: "Error",
          description: message,
          variant: "destructive"
        });
        return null;
      } finally {
        setLoading(false);
      }
    },
    [toast]
  );

  // Create a supplier
  const createSupplier = useCallback(
    async (data: CreateSupplierData) => {
      try {
        setLoading(true);
        const response = await suppliersAPI.createSupplier(data);

        // Update local state immediately for better UX
        setSuppliers(prev => [...prev, response.data]);

        toast({
          title: "Success",
          description: `Supplier ${response.data.name} created successfully`
        });

        return response.data;
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to create supplier";
        toast({
          title: "Error",
          description: message,
          variant: "destructive"
        });
        return null;
      } finally {
        setLoading(false);
      }
    },
    [toast]
  );

  // Update a supplier
  const updateSupplier = useCallback(
    async (id: number | string, data: UpdateSupplierData) => {
      try {
        setLoading(true);
        const response = await suppliersAPI.updateSupplier(id, data);

        // Update local state immediately for better UX
        setSuppliers(prev => prev.map(s => (s.id === Number(id) ? response.data : s)));

        toast({
          title: "Success",
          description: `Supplier ${response.data.name} updated successfully`
        });

        return response.data;
      } catch (err) {
        const message = err instanceof Error ? err.message : `Failed to update supplier #${id}`;
        toast({
          title: "Error",
          description: message,
          variant: "destructive"
        });
        return null;
      } finally {
        setLoading(false);
      }
    },
    [toast]
  );

  // Delete a supplier
  const deleteSupplier = useCallback(
    async (id: number | string) => {
      try {
        setLoading(true);
        await suppliersAPI.deleteSupplier(id);

        // Update local state immediately for better UX
        setSuppliers(prev => prev.filter(s => s.id !== Number(id)));

        toast({
          title: "Success",
          description: "Supplier deleted successfully"
        });

        return true;
      } catch (err) {
        const message = err instanceof Error ? err.message : `Failed to delete supplier #${id}`;
        toast({
          title: "Error",
          description: message,
          variant: "destructive"
        });
        return false;
      } finally {
        setLoading(false);
      }
    },
    [toast]
  );

  // Toggle supplier status
  const toggleSupplierStatus = useCallback(
    async (id: number | string) => {
      try {
        setLoading(true);
        const response = await suppliersAPI.toggleSupplierStatus(id);

        // Update local state immediately for better UX
        setSuppliers(prev => prev.map(supplier => (supplier.id === Number(id) ? { ...supplier, isActive: !supplier.isActive } : supplier)));

        const statusText = response.data.isActive ? "activated" : "deactivated";
        toast({
          title: "Success",
          description: `Supplier ${response.data.name} ${statusText} successfully`
        });

        return response.data;
      } catch (err) {
        const message = err instanceof Error ? err.message : `Failed to toggle supplier status`;
        toast({
          title: "Error",
          description: message,
          variant: "destructive"
        });
        return null;
      } finally {
        setLoading(false);
      }
    },
    [toast]
  );

  // Get supplier payments
  const getSupplierPayments = useCallback(
    async (supplierId: number | string) => {
      try {
        setLoading(true);
        const response = await suppliersAPI.getSupplierPayments({ supplierId });
        return response;
      } catch (err) {
        const message = err instanceof Error ? err.message : `Failed to fetch payments for supplier #${supplierId}`;
        toast({
          title: "Error",
          description: message,
          variant: "destructive"
        });
        return [];
      } finally {
        setLoading(false);
      }
    },
    [toast]
  );

  // Create supplier payment
  const createSupplierPayment = useCallback(
    async (data: CreateSupplierPaymentData) => {
      try {
        setLoading(true);
        const response = await suppliersAPI.createSupplierPayment(data);

        toast({
          title: "Success",
          description: "Payment created successfully"
        });

        await fetchSuppliers(true); // refresh suppliers

        return response.data; // <-- return actual payment object
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to create payment";
        toast({ title: "Error", description: message, variant: "destructive" });
        return null;
      } finally {
        setLoading(false);
      }
    },
    [fetchSuppliers, toast]
  );

  const updateSupplierPayment = useCallback(
    async (id: number | string, data: UpdateSupplierPaymentData) => {
      try {
        setLoading(true);
        const response = await suppliersAPI.updateSupplierPayment(id, data);

        toast({
          title: "Success",
          description: "Payment updated successfully"
        });

        await fetchSuppliers(true); // refresh suppliers

        return response.data; // <-- return actual payment object
      } catch (err) {
        const message = err instanceof Error ? err.message : `Failed to update payment #${id}`;
        toast({ title: "Error", description: message, variant: "destructive" });
        return null;
      } finally {
        setLoading(false);
      }
    },
    [fetchSuppliers, toast]
  );

  // Delete supplier payment
  const deleteSupplierPayment = useCallback(
    async (id: number | string) => {
      try {
        setLoading(true);
        await suppliersAPI.deleteSupplierPayment(id);

        toast({
          title: "Success",
          description: "Payment deleted successfully"
        });

        // Refresh supplier data to reflect the deleted payment
        fetchSuppliers(true);

        return true;
      } catch (err) {
        const message = err instanceof Error ? err.message : `Failed to delete payment #${id}`;
        toast({
          title: "Error",
          description: message,
          variant: "destructive"
        });
        return false;
      } finally {
        setLoading(false);
      }
    },
    [fetchSuppliers, toast]
  );

  // UI actions
  const updateSearch = useCallback((term: string) => {
    setSearchTerm(term);
  }, []);

  const updateStatusFilter = useCallback((status: boolean | undefined) => {
    setStatusFilter(status);
  }, []);

  const resetFilters = useCallback(() => {
    setSearchTerm("");
    setStatusFilter(undefined);
  }, []);

  // Client-side filtering
  const filteredSuppliers = React.useMemo(() => {
    let filtered = [...suppliers];

    // Apply search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(supplier => supplier.name?.toLowerCase().includes(term) || false || supplier.contactPerson?.toLowerCase().includes(term) || false || supplier.email?.toLowerCase().includes(term) || false || supplier.phone?.toLowerCase().includes(term) || false || supplier.address?.toLowerCase().includes(term) || false);
    }

    // Apply status filter
    if (statusFilter !== undefined) {
      filtered = filtered.filter(supplier => supplier.isActive === statusFilter);
    }

    return filtered;
  }, [suppliers, searchTerm, statusFilter]);

  // Simple refresh function that forces a data fetch
  const refresh = useCallback(async () => {
    return fetchSuppliers(true);
  }, [fetchSuppliers]);

  // Context value
  const value = {
    // Data
    suppliers,
    filteredSuppliers,
    loading,
    error,
    searchTerm,

    // Supplier actions
    fetchSuppliers,
    refresh,
    getSupplier,
    createSupplier,
    updateSupplier,
    deleteSupplier,
    toggleSupplierStatus,

    // Payment actions
    getSupplierPayments,
    createSupplierPayment,
    updateSupplierPayment,
    deleteSupplierPayment,

    // UI actions
    updateSearch,
    resetFilters
  };

  return <SuppliersContext.Provider value={value}>{children}</SuppliersContext.Provider>;
};

// Custom hook to use the context
export const useSuppliersContext = () => {
  const context = useContext(SuppliersContext);
  if (context === undefined) {
    throw new Error("useSuppliersContext must be used within a SuppliersProvider");
  }
  return context;
};

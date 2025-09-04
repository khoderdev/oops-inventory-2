import { useState, useCallback } from "react";
import { suppliersAPI } from "@/api/suppliers.api";
import { Supplier, CreateSupplierData, UpdateSupplierData, SuppliersQueryParams, SupplierPayment, CreateSupplierPaymentData, UpdateSupplierPaymentData, SupplierPaymentsQueryParams, SupplierPaymentStats } from "@/types/suppliers";
import { useToast } from "@/hooks/use-toast";

export const useSuppliers = () => {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [supplier, setSupplier] = useState<Supplier | null>(null);
  const [supplierPayments, setSupplierPayments] = useState<SupplierPayment[]>([]);
  const [paymentStats, setPaymentStats] = useState<SupplierPaymentStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  // Error handling helper
  const handleError = (error: unknown, customMessage?: string) => {
    const message = error instanceof Error ? error.message : customMessage || "An error occurred";
    setError(message);
    console.error("Suppliers API Error:", error);
    toast({
      title: "Error",
      description: message,
      variant: "destructive"
    });
    return message;
  };

  // Success toast helper
  const showSuccess = (message: string) => {
    toast({
      title: "Success",
      description: message
    });
  };

  // Supplier methods
  const fetchSuppliers = useCallback(async (params?: SuppliersQueryParams) => {
    try {
      setLoading(true);
      setError(null);
      const data = await suppliersAPI.getSuppliers(params);
      setSuppliers(data);
      return data;
    } catch (error) {
      handleError(error, "Failed to fetch suppliers");
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchActiveSuppliers = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await suppliersAPI.getActiveSuppliers();
      setSuppliers(data);
      return data;
    } catch (error) {
      handleError(error, "Failed to fetch active suppliers");
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchSupplier = useCallback(async (id: number | string) => {
    try {
      setLoading(true);
      setError(null);
      const response = await suppliersAPI.getSupplier(id);
      setSupplier(response.data);
      return response.data;
    } catch (error) {
      handleError(error, `Failed to fetch supplier with ID ${id}`);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // Debounce tracking for API calls
  const [lastApiCallTime, setLastApiCallTime] = useState(0);
  
  // Optimized supplier creation with debouncing
  const createSupplier = useCallback(
    async (data: CreateSupplierData) => {
      try {
        // Prevent rapid consecutive calls
        const now = Date.now();
        if (now - lastApiCallTime < 1000) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
        
        setLastApiCallTime(Date.now());
        setLoading(true);
        setError(null);
        
        const response = await suppliersAPI.createSupplier(data);
        showSuccess(`Supplier ${data.name} created successfully`);
        
        // Update local state directly instead of refetching everything
        setSuppliers(prev => [...prev, response.data]);
        return response.data;
      } catch (error) {
        handleError(error, "Failed to create supplier");
        return null;
      } finally {
        setLoading(false);
      }
    },
    [lastApiCallTime]
  );

  // Optimized supplier update with debouncing
  const updateSupplier = useCallback(
    async (id: number | string, data: UpdateSupplierData) => {
      try {
        // Prevent rapid consecutive calls
        const now = Date.now();
        if (now - lastApiCallTime < 1000) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
        
        setLastApiCallTime(Date.now());
        setLoading(true);
        setError(null);
        
        const response = await suppliersAPI.updateSupplier(id, data);
        showSuccess(`Supplier ${data.name || "information"} updated successfully`);
        
        // Update local state directly instead of refetching everything
        setSuppliers(prev => 
          prev.map(supplier => 
            supplier.id === Number(id) ? response.data : supplier
          )
        );
        
        return response.data;
      } catch (error) {
        handleError(error, `Failed to update supplier with ID ${id}`);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [lastApiCallTime]
  );

  const deleteSupplier = useCallback(
    async (id: number | string, supplierName?: string) => {
      try {
        setLoading(true);
        setError(null);
        await suppliersAPI.deleteSupplier(id);
        showSuccess(`Supplier ${supplierName || ""} deleted successfully`);
        await fetchSuppliers(); // Refresh the list
        return true;
      } catch (error) {
        handleError(error, `Failed to delete supplier with ID ${id}`);
        return false;
      } finally {
        setLoading(false);
      }
    },
    [fetchSuppliers]
  );

  const toggleSupplierStatus = useCallback(
    async (id: number | string) => {
      try {
        setLoading(true);
        setError(null);
        const response = await suppliersAPI.toggleSupplierStatus(id);
        const statusText = response.data.isActive ? "activated" : "deactivated";
        showSuccess(`Supplier ${response.data.name} ${statusText} successfully`);
        await fetchSuppliers(); // Refresh the list
        return response.data;
      } catch (error) {
        handleError(error, `Failed to toggle status for supplier with ID ${id}`);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [fetchSuppliers]
  );

  // Supplier Payment methods
  const fetchSupplierPayments = useCallback(async (params?: SupplierPaymentsQueryParams) => {
    try {
      setLoading(true);
      setError(null);
      const data = await suppliersAPI.getSupplierPayments(params);
      setSupplierPayments(data);
      return data;
    } catch (error) {
      handleError(error, "Failed to fetch supplier payments");
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchSupplierPayment = useCallback(async (id: number | string) => {
    try {
      setLoading(true);
      setError(null);
      const response = await suppliersAPI.getSupplierPayment(id);
      return response.data;
    } catch (error) {
      handleError(error, `Failed to fetch payment with ID ${id}`);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const createSupplierPayment = useCallback(
    async (data: CreateSupplierPaymentData) => {
      try {
        setLoading(true);
        setError(null);
        const response = await suppliersAPI.createSupplierPayment(data);
        showSuccess(`Payment of ${data.amount} created successfully`);
        await fetchSupplierPayments({ supplierId: data.supplierId });
        return response.data;
      } catch (error) {
        handleError(error, "Failed to create payment");
        return null;
      } finally {
        setLoading(false);
      }
    },
    [fetchSupplierPayments]
  );

  const updateSupplierPayment = useCallback(
    async (id: number | string, data: UpdateSupplierPaymentData) => {
      try {
        setLoading(true);
        setError(null);
        const response = await suppliersAPI.updateSupplierPayment(id, data);
        showSuccess(`Payment updated successfully`);
        if (data.supplierId) {
          await fetchSupplierPayments({ supplierId: data.supplierId });
        }
        return response.data;
      } catch (error) {
        handleError(error, `Failed to update payment with ID ${id}`);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [fetchSupplierPayments]
  );

  const deleteSupplierPayment = useCallback(
    async (id: number | string, supplierId?: number | string) => {
      try {
        setLoading(true);
        setError(null);
        await suppliersAPI.deleteSupplierPayment(id);
        showSuccess(`Payment deleted successfully`);
        if (supplierId) {
          await fetchSupplierPayments({ supplierId });
        }
        return true;
      } catch (error) {
        handleError(error, `Failed to delete payment with ID ${id}`);
        return false;
      } finally {
        setLoading(false);
      }
    },
    [fetchSupplierPayments]
  );

  const fetchSupplierPaymentStats = useCallback(async (supplierId: number | string) => {
    try {
      setLoading(true);
      setError(null);
      const response = await suppliersAPI.getSupplierPaymentStats(supplierId);
      setPaymentStats(response.data);
      return response.data;
    } catch (error) {
      handleError(error, `Failed to fetch payment statistics for supplier ${supplierId}`);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    // State
    suppliers,
    supplier,
    supplierPayments,
    paymentStats,
    loading,
    error,

    // Supplier methods
    fetchSuppliers,
    fetchActiveSuppliers,
    fetchSupplier,
    createSupplier,
    updateSupplier,
    deleteSupplier,
    toggleSupplierStatus,

    // Supplier Payment methods
    fetchSupplierPayments,
    fetchSupplierPayment,
    createSupplierPayment,
    updateSupplierPayment,
    deleteSupplierPayment,
    fetchSupplierPaymentStats
  };
};

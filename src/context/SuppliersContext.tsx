// import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
// import { suppliersAPI } from "@/api/suppliers.api";
// import { Supplier, SupplierPayment, CreateSupplierData, UpdateSupplierData, CreateSupplierPaymentData, UpdateSupplierPaymentData } from "@/types/suppliers";

// // Define the context type
// interface SuppliersContextType {
//   // Data
//   suppliers: Supplier[];
//   filteredSuppliers: Supplier[];
//   loading: boolean;
//   error: string | null;
//   searchTerm: string;

//   // Supplier actions
//   fetchSuppliers: (force?: boolean) => Promise<void>;
//   refresh: () => Promise<void>;
//   getSupplier: (id: number | string) => Promise<Supplier | null>;
//   createSupplier: (data: CreateSupplierData) => Promise<Supplier | null>;
//   updateSupplier: (id: number | string, data: UpdateSupplierData) => Promise<Supplier | null>;
//   deleteSupplier: (id: number | string) => Promise<boolean>;
//   toggleSupplierStatus: (id: number | string) => Promise<any>;

//   // Payment actions
//   getSupplierPayments: (supplierId: number | string) => Promise<SupplierPayment[]>;
//   createSupplierPayment: (data: CreateSupplierPaymentData) => Promise<{ data: SupplierPayment } | null>;
//   updateSupplierPayment: (id: number | string, data: UpdateSupplierPaymentData) => Promise<{ data: SupplierPayment } | null>;
//   deleteSupplierPayment: (id: number | string) => Promise<boolean>;

//   // UI actions
//   updateSearch: (term: string) => void;
//   resetFilters: () => void;
// }

// // Create the context with a default value
// const SuppliersContext = createContext<SuppliersContextType | undefined>(undefined);

// // Provider component
// export const SuppliersProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
//   // State
//   const [suppliers, setSuppliers] = useState<Supplier[]>([]);
//   const [loading, setLoading] = useState(false);
//   const [error, setError] = useState<string | null>(null);
//   const [searchTerm, setSearchTerm] = useState("");
//   const [statusFilter, setStatusFilter] = useState<boolean | undefined>(undefined);
//   const [lastFetchTime, setLastFetchTime] = useState(0);

//   // Fetch suppliers
//   const fetchSuppliers = useCallback(
//     async (force?: boolean) => {
//       // Prevent multiple fetches within 2 seconds unless forced
//       const now = Date.now();
//       if (!force && now - lastFetchTime < 2000) {
//         return;
//       }

//       try {
//         setLoading(true);
//         setError(null);
//         setLastFetchTime(now);

//         const data = await suppliersAPI.getSuppliers({ _t: now });
//         setSuppliers(data);
//       } catch (err) {
//         setError("Failed to fetch suppliers");
//       } finally {
//         setLoading(false);
//       }
//     },
//     [lastFetchTime]
//   );

//   // Initial fetch
//   useEffect(() => {
//     fetchSuppliers();
//   }, [fetchSuppliers]);

//   // Get a single supplier
//   const getSupplier = useCallback(async (id: number | string) => {
//     try {
//       setLoading(true);
//       const response = await suppliersAPI.getSupplier(id);
//       return response.data;
//     } catch (err) {
//       return null;
//     } finally {
//       setLoading(false);
//     }
//   }, []);

//   // Create a supplier
//   const createSupplier = useCallback(async (data: CreateSupplierData) => {
//     try {
//       setLoading(true);
//       const response = await suppliersAPI.createSupplier(data);
//       setSuppliers(prev => [...prev, response.data]);

//       return response.data;
//     } catch (err) {
//       return null;
//     } finally {
//       setLoading(false);
//     }
//   }, []);

//   // Update a supplier
//   const updateSupplier = useCallback(async (id: number | string, data: UpdateSupplierData) => {
//     try {
//       setLoading(true);
//       const response = await suppliersAPI.updateSupplier(id, data);
//       setSuppliers(prev => prev.map(s => (s.id === Number(id) ? response.data : s)));

//       return response.data;
//     } catch (err) {
//       return null;
//     } finally {
//       setLoading(false);
//     }
//   }, []);

//   // Delete a supplier
//   const deleteSupplier = useCallback(async (id: number | string) => {
//     try {
//       setLoading(true);
//       await suppliersAPI.deleteSupplier(id);
//       setSuppliers(prev => prev.filter(s => s.id !== Number(id)));

//       return true;
//     } catch (err) {
//       return false;
//     } finally {
//       setLoading(false);
//     }
//   }, []);

//   // Toggle supplier status
//   const toggleSupplierStatus = useCallback(async (id: number | string) => {
//     try {
//       setLoading(true);
//       const response = await suppliersAPI.toggleSupplierStatus(id);
//       setSuppliers(prev => prev.map(supplier => (supplier.id === Number(id) ? { ...supplier, isActive: !supplier.isActive } : supplier)));
//       return response.data;
//     } catch (err) {
//       return null;
//     } finally {
//       setLoading(false);
//     }
//   }, []);

//   // Get supplier payments
//   const getSupplierPayments = useCallback(async (supplierId: number | string) => {
//     try {
//       setLoading(true);
//       const response = await suppliersAPI.getSupplierPayments({ supplierId });
//       return response;
//     } catch (err) {
//       return [];
//     } finally {
//       setLoading(false);
//     }
//   }, []);

//   // Create supplier payment
//   const createSupplierPayment = useCallback(
//     async (data: CreateSupplierPaymentData) => {
//       try {
//         setLoading(true);
//         const response = await suppliersAPI.createSupplierPayment(data);
//         await fetchSuppliers(true); // refresh suppliers

//         return { data: response.data }; // Wrap the data in a data property
//       } catch (err) {
//         return { data: null }; // Return a consistent structure even on error
//       } finally {
//         setLoading(false);
//       }
//     },
//     [fetchSuppliers]
//   );

//   const updateSupplierPayment = useCallback(
//     async (id: number | string, data: UpdateSupplierPaymentData) => {
//       try {
//         setLoading(true);
//         const response = await suppliersAPI.updateSupplierPayment(id, data);
//         await fetchSuppliers(true); // refresh suppliers

//         return { data: response.data }; // Wrap the data in a data property
//       } catch (err) {
//         return { data: null }; // Return a consistent structure even on error
//       } finally {
//         setLoading(false);
//       }
//     },
//     [fetchSuppliers]
//   );

//   // Delete supplier payment
//   const deleteSupplierPayment = useCallback(
//     async (id: number | string) => {
//       try {
//         setLoading(true);
//         await suppliersAPI.deleteSupplierPayment(id);
//         fetchSuppliers(true);

//         return true;
//       } catch (err) {
//         return false;
//       } finally {
//         setLoading(false);
//       }
//     },
//     [fetchSuppliers]
//   );

//   // UI actions
//   const updateSearch = useCallback((term: string) => {
//     setSearchTerm(term);
//   }, []);

//   const resetFilters = useCallback(() => {
//     setSearchTerm("");
//     setStatusFilter(undefined);
//   }, []);

//   // Client-side filtering
//   const filteredSuppliers = React.useMemo(() => {
//     let filtered = [...suppliers];

//     // Apply search filter
//     if (searchTerm) {
//       const term = searchTerm.toLowerCase();
//       filtered = filtered.filter(supplier => supplier.name?.toLowerCase().includes(term) || false || supplier.contactPerson?.toLowerCase().includes(term) || false || supplier.email?.toLowerCase().includes(term) || false || supplier.phone?.toLowerCase().includes(term) || false || supplier.address?.toLowerCase().includes(term) || false);
//     }

//     // Apply status filter
//     if (statusFilter !== undefined) {
//       filtered = filtered.filter(supplier => supplier.isActive === statusFilter);
//     }

//     return filtered;
//   }, [suppliers, searchTerm, statusFilter]);

//   // Simple refresh function that forces a data fetch
//   const refresh = useCallback(async () => {
//     return fetchSuppliers(true);
//   }, [fetchSuppliers]);

//   // Context value
//   const value = {
//     // Data
//     suppliers,
//     filteredSuppliers,
//     loading,
//     error,
//     searchTerm,

//     // Supplier actions
//     fetchSuppliers,
//     refresh,
//     getSupplier,
//     createSupplier,
//     updateSupplier,
//     deleteSupplier,
//     toggleSupplierStatus,

//     // Payment actions
//     getSupplierPayments,
//     createSupplierPayment,
//     updateSupplierPayment,
//     deleteSupplierPayment,

//     // UI actions
//     updateSearch,
//     resetFilters
//   };

//   return <SuppliersContext.Provider value={value}>{children}</SuppliersContext.Provider>;
// };

// // Custom hook to use the context
// export const useSuppliersContext = () => {
//   const context = useContext(SuppliersContext);
//   if (context === undefined) {
//     throw new Error("useSuppliersContext must be used within a SuppliersProvider");
//   }
//   return context;
// };

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import { suppliersAPI } from "@/api/suppliers.api";
import { Supplier, SupplierPayment, CreateSupplierData, UpdateSupplierData, CreateSupplierPaymentData, UpdateSupplierPaymentData } from "@/types/suppliers";
import { StockEntry } from "@/types/inventory";

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

  // Stock Entry actions
  getSupplierStockEntries: (supplierId: number | string) => Promise<StockEntry[]>;

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
        setError("Failed to fetch suppliers");
      } finally {
        setLoading(false);
      }
    },
    [lastFetchTime]
  );

  // Initial fetch
  useEffect(() => {
    fetchSuppliers();
  }, [fetchSuppliers]);

  // Get a single supplier
  const getSupplier = useCallback(async (id: number | string) => {
    try {
      setLoading(true);
      const response = await suppliersAPI.getSupplier(id);
      return response.data;
    } catch (err) {
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // Create a supplier
  const createSupplier = useCallback(async (data: CreateSupplierData) => {
    try {
      setLoading(true);
      const response = await suppliersAPI.createSupplier(data);
      setSuppliers(prev => [...prev, response.data]);

      return response.data;
    } catch (err) {
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // Update a supplier
  const updateSupplier = useCallback(async (id: number | string, data: UpdateSupplierData) => {
    try {
      setLoading(true);
      const response = await suppliersAPI.updateSupplier(id, data);
      setSuppliers(prev => prev.map(s => (s.id === Number(id) ? response.data : s)));

      return response.data;
    } catch (err) {
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // Delete a supplier
  const deleteSupplier = useCallback(async (id: number | string) => {
    try {
      setLoading(true);
      await suppliersAPI.deleteSupplier(id);
      setSuppliers(prev => prev.filter(s => s.id !== Number(id)));

      return true;
    } catch (err) {
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  // Toggle supplier status
  const toggleSupplierStatus = useCallback(async (id: number | string) => {
    try {
      setLoading(true);
      const response = await suppliersAPI.toggleSupplierStatus(id);
      setSuppliers(prev => prev.map(supplier => (supplier.id === Number(id) ? { ...supplier, isActive: !supplier.isActive } : supplier)));
      return response.data;
    } catch (err) {
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // Get supplier payments
  const getSupplierPayments = useCallback(async (supplierId: number | string) => {
    try {
      setLoading(true);
      const response = await suppliersAPI.getSupplierPayments({ supplierId });
      return response;
    } catch (err) {
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  // Create supplier payment
  const createSupplierPayment = useCallback(
    async (data: CreateSupplierPaymentData) => {
      try {
        setLoading(true);
        const response = await suppliersAPI.createSupplierPayment(data);
        await fetchSuppliers(true); // refresh suppliers

        return { data: response.data }; // Wrap the data in a data property
      } catch (err) {
        return { data: null }; // Return a consistent structure even on error
      } finally {
        setLoading(false);
      }
    },
    [fetchSuppliers]
  );

  const updateSupplierPayment = useCallback(
    async (id: number | string, data: UpdateSupplierPaymentData) => {
      try {
        setLoading(true);
        const response = await suppliersAPI.updateSupplierPayment(id, data);
        await fetchSuppliers(true); // refresh suppliers

        return { data: response.data }; // Wrap the data in a data property
      } catch (err) {
        return { data: null }; // Return a consistent structure even on error
      } finally {
        setLoading(false);
      }
    },
    [fetchSuppliers]
  );

  // Delete supplier payment
  const deleteSupplierPayment = useCallback(
    async (id: number | string) => {
      try {
        setLoading(true);
        await suppliersAPI.deleteSupplierPayment(id);
        fetchSuppliers(true);

        return true;
      } catch (err) {
        return false;
      } finally {
        setLoading(false);
      }
    },
    [fetchSuppliers]
  );

  // NEW: Get supplier stock entries
  const getSupplierStockEntries = useCallback(async (supplierId: number | string) => {
    try {
      setLoading(true);
      const response = await suppliersAPI.getSupplierStockEntries(supplierId);
      return response || [];
    } catch (err) {
      console.error("Error fetching stock entries:", err);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  // UI actions
  const updateSearch = useCallback((term: string) => {
    setSearchTerm(term);
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

    // NEW: Stock Entry action
    getSupplierStockEntries,

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

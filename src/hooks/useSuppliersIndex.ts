/**
 * Supplier hooks index file
 * Exports all supplier-related hooks for easy importing
 */

// Export all supplier hooks
export { useSuppliers } from './useSuppliers';
export { useSuppliersSimple, useSupplierPayments } from './useSuppliersSimple';
export { useSuppliersWithPrefetch } from './useSuppliersWithPrefetch';
export { useSuppliersTable } from './useSuppliersTable';

// Example usage guide
/**
 * Supplier Hooks Usage Guide:
 * 
 * 1. useSuppliers - Comprehensive hook with all supplier operations
 *    Best for: Complex supplier management pages with full CRUD operations
 *    Example: 
 *    ```
 *    const { 
 *      suppliers, 
 *      createSupplier, 
 *      updateSupplier, 
 *      deleteSupplier,
 *      toggleSupplierStatus 
 *    } = useSuppliers();
 *    ```
 * 
 * 2. useSuppliersSimple - Lightweight hook for basic supplier operations
 *    Best for: Simple components that only need to display suppliers
 *    Example:
 *    ```
 *    const { 
 *      suppliers, 
 *      loading, 
 *      updateParams, 
 *      filterActiveOnly 
 *    } = useSuppliersSimple();
 *    ```
 * 
 * 3. useSupplierPayments - Specialized hook for supplier payment operations
 *    Best for: Payment management components
 *    Example:
 *    ```
 *    const { 
 *      payments, 
 *      loading, 
 *      fetchStats 
 *    } = useSupplierPayments(supplierId);
 *    ```
 * 
 * 4. useSuppliersWithPrefetch - Hook with prefetch and caching capabilities
 *    Best for: Components that need optimized data loading with caching
 *    Example:
 *    ```
 *    const { 
 *      suppliers, 
 *      refresh, 
 *      createSupplierWithCache 
 *    } = useSuppliersWithPrefetch();
 *    ```
 * 
 * 5. useSuppliersTable - Specialized hook for supplier data tables
 *    Best for: Table components with sorting, filtering, and pagination
 *    Example:
 *    ```
 *    const { 
 *      filteredSuppliers, 
 *      updateSearch, 
 *      updateStatusFilter, 
 *      updateSortOrder 
 *    } = useSuppliersTable();
 *    ```
 */

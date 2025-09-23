import React, { useEffect, useMemo, useState, useRef, useCallback } from "react";
import { usePOSRedux } from "@/hooks/usePOSRedux";
import { SaleRecord } from "@/types/inventory";
import { format } from "date-fns";
import { ChevronDown, ChevronUp, ExternalLink } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";

interface SalesProps {}

const Sales: React.FC<SalesProps> = () => {
  const { salesHistory, fetchSalesHistory, isLoading, error, selectedItemFilter, selectedSectionFilter, dateFrom, dateTo, setSelectedItemFilter, setSelectedSectionFilter, setDateFrom, setDateTo, uniqueItemNames, uniqueSectionNames, setUniqueItemNames, setUniqueSectionNames, filteredSalesHistory, salesTotal, setSelectedSaleForEdit, setEditingSaleId, lastSaleData, showSuccessCheckmark, successMessage } = usePOSRedux();
  const navigate = useNavigate();
  const [sortField, setSortField] = useState<keyof SaleRecord | null>(null);
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
  const [expandedSale, setExpandedSale] = useState<string | null>(null);
  const hasFetchedRef = useRef(false);

  useEffect(() => {
    if (salesHistory.length === 0 && !isLoading && !hasFetchedRef.current) {
      hasFetchedRef.current = true;
      fetchSalesHistory();
    }
  }, [fetchSalesHistory, salesHistory.length, isLoading]);

  // Auto-refresh sales when relevant POS events occur (payment completed, successful actions)
  useEffect(() => {
    // If a new receipt was generated or we showed the success checkmark / success message, refresh sales in background
    if (lastSaleData || showSuccessCheckmark || (successMessage && successMessage.toLowerCase().includes("success"))) {
      fetchSalesHistory();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lastSaleData, showSuccessCheckmark, successMessage]);
  useEffect(() => {
    if (salesHistory.length > 0 && (uniqueItemNames.length === 0 || uniqueSectionNames.length === 0)) {
      const items = new Set<string>();
      const sections = new Set<string>();
      salesHistory.forEach(sale => {
        sale.items?.forEach(item => item.materialName && items.add(item.materialName));
        sale.menuItems?.forEach(menuItem => menuItem.menuItemName && items.add(menuItem.menuItemName));
        sale.section?.name && sections.add(sale.section.name);
      });
      setUniqueItemNames(Array.from(items));
      setUniqueSectionNames(Array.from(sections));
    }
  }, [salesHistory, uniqueItemNames.length, uniqueSectionNames.length, setUniqueItemNames, setUniqueSectionNames]);

  // Handle sorting
  const handleSort = (field: keyof SaleRecord) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("desc");
    }
  };

  const sortedSales = useMemo(() => {
    if (!sortField) return filteredSalesHistory;
    return [...filteredSalesHistory].sort((a, b) => {
      const aValue = a[sortField];
      const bValue = b[sortField];
      if (typeof aValue === "string" && typeof bValue === "string") {
        return sortDirection === "asc" ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue);
      }
      if (typeof aValue === "number" && typeof bValue === "number") {
        return sortDirection === "asc" ? aValue - bValue : bValue - aValue;
      }
      return 0;
    });
  }, [filteredSalesHistory, sortField, sortDirection]);

  const toggleSaleDetails = (saleId: string) => {
    setExpandedSale(expandedSale === saleId ? null : saleId);
  };

  // Handle click on a sale row to navigate to POS screen - memoized to prevent unnecessary re-renders
  const handleSaleClick = useCallback(
    async (sale: SaleRecord) => {
      let orderId: string | null = null;

      // If we already have the order ID in the sale object, use it
      if (sale.order && sale.order.id) {
        orderId = sale.order.id.toString();
      } else if (sale.orderId) {
        // If orderId is directly on the sale object
        orderId = sale.orderId.toString();
      } else {
        // Fallback to using the sale ID as the order ID
        orderId = sale.id.toString();

        // Try to fetch the sale details to get the order ID
        try {
          const response = await fetch(`/api/sales/${sale.id}`);

          if (response.ok) {
            const saleData = await response.json();
            if (saleData.orderId) {
              orderId = saleData.orderId.toString();
            } else if (saleData.order && saleData.order.id) {
              orderId = saleData.order.id.toString();
            } else {
              console.warn(`⚠️ No order ID found in sale data for sale ${sale.id}`);
            }
          } else {
            console.warn(`⚠️ Failed to fetch sale details for sale ${sale.id}`);
          }
        } catch (error) {
          console.error(`❌ Error fetching sale details for sale ${sale.id}:`, error);
        }
      }

      setEditingSaleId(orderId);
      const saleWithOrderId = {
        ...sale,
        orderId: orderId
      };
      setSelectedSaleForEdit(saleWithOrderId);
      navigate("/pos");
    },
    [setSelectedSaleForEdit, setEditingSaleId, navigate]
  );

  // Format currency
  const formatCurrency = (amount: number | string) => {
    const num = typeof amount === "string" ? parseFloat(amount) : amount;
    return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(num);
  };

  // Format date
  const formatDate = (date: string | Date) => {
    return format(new Date(date), "MM/dd/yyyy HH:mm");
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Sales History</h1>

      {/* Filters */}
      <div className="mb-4 flex flex-wrap gap-4">
        <div className="flex-1 min-w-[200px]">
          <label className="block text-sm font-medium text-gray-700">Item Filter</label>
          <select value={selectedItemFilter} onChange={e => setSelectedItemFilter(e.target.value)} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50">
            <option value="all">All Items</option>
            {uniqueItemNames.map(item => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </div>
        <div className="flex-1 min-w-[200px]">
          <label className="block text-sm font-medium text-gray-700">Section Filter</label>
          <select value={selectedSectionFilter} onChange={e => setSelectedSectionFilter(e.target.value)} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50">
            <option value="all">All Sections</option>
            {uniqueSectionNames.map(section => (
              <option key={section} value={section}>
                {section}
              </option>
            ))}
          </select>
        </div>
        <div className="flex-1 min-w-[200px]">
          <label className="block text-sm font-medium text-gray-700">From Date</label>
          <input type="date" value={dateFrom ? format(dateFrom, "yyyy-MM-dd") : ""} onChange={e => setDateFrom(e.target.value ? new Date(e.target.value) : null)} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50" />
        </div>
        <div className="flex-1 min-w-[200px]">
          <label className="block text-sm font-medium text-gray-700">To Date</label>
          <input type="date" value={dateTo ? format(dateTo, "yyyy-MM-dd") : ""} onChange={e => setDateTo(e.target.value ? new Date(e.target.value) : null)} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50" />
        </div>
      </div>

      {/* Loading and Error States */}
      {error && <div className="text-red-500 mb-4">{error}</div>}

      {/* Sales Table - always render current data for instant UI; load happens in background */}
      <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer" onClick={() => handleSort("saleDate")}>
                  Date
                  {sortField === "saleDate" && (sortDirection === "asc" ? <ChevronUp className="inline ml-1" /> : <ChevronDown className="inline ml-1" />)}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer" onClick={() => handleSort("orderNumber")}>
                  Order Number
                  {sortField === "orderNumber" && (sortDirection === "asc" ? <ChevronUp className="inline ml-1" /> : <ChevronDown className="inline ml-1" />)}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer" onClick={() => handleSort("totalAmount")}>
                  Total
                  {sortField === "totalAmount" && (sortDirection === "asc" ? <ChevronUp className="inline ml-1" /> : <ChevronDown className="inline ml-1" />)}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Items</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Section</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {sortedSales.map(sale => (
                <React.Fragment key={sale.id}>
                  <tr className="hover:bg-gray-50 cursor-pointer">
                    <td className="px-6 py-4 whitespace-nowrap" onClick={() => toggleSaleDetails(sale.id)}>
                      {formatDate(sale.saleDate)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap" onClick={() => toggleSaleDetails(sale.id)}>
                      {sale.orderNumber}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap" onClick={() => toggleSaleDetails(sale.id)}>
                      {formatCurrency(sale.totalAmount)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap" onClick={() => toggleSaleDetails(sale.id)}>
                      {(sale.items?.length || 0) + (sale.menuItems?.length || 0)} items
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap" onClick={() => toggleSaleDetails(sale.id)}>
                      {sale.section?.name || "N/A"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap flex gap-2">
                      <Button variant="outline" size="sm" onClick={() => handleSaleClick(sale)} className="flex items-center gap-1 ml-2">
                        <ExternalLink className="h-4 w-4" /> Open in POS
                      </Button>
                    </td>
                  </tr>
                  {expandedSale === sale.id && (
                    <tr>
                      <td colSpan={6} className="px-6 py-4">
                        <div className="bg-gray-50 p-4 rounded-md">
                          <h3 className="text-lg font-medium mb-2">Sale Details</h3>
                          <table className="min-w-full divide-y divide-gray-200">
                            <thead>
                              <tr>
                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Item Name</th>
                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quantity</th>
                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Unit Price</th>
                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                              </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                              {sale.menuItems?.map((item, index) => (
                                <tr key={`menu-${index}`}>
                                  <td className="px-4 py-2">{item.menuItemName}</td>
                                  <td className="px-4 py-2">Menu Item</td>
                                  <td className="px-4 py-2">{item.quantity}</td>
                                  <td className="px-4 py-2">{formatCurrency(item.unitPrice)}</td>
                                  <td className="px-4 py-2">{formatCurrency(item.quantity * parseFloat(item.unitPrice.toString()))}</td>
                                </tr>
                              ))}
                              {sale.items?.map((item, index) => (
                                <tr key={`material-${index}`}>
                                  <td className="px-4 py-2">{item.materialName}</td>
                                  <td className="px-4 py-2">Material</td>
                                  <td className="px-4 py-2">{item.quantity}</td>
                                  <td className="px-4 py-2">{formatCurrency(item.unitPrice)}</td>
                                  <td className="px-4 py-2">{formatCurrency(item.quantity * parseFloat(item.unitPrice.toString()))}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
          <div className="mt-4 flex items-center justify-between">
            <p className="text-lg font-semibold">Total Sales: {formatCurrency(salesTotal)}</p>
            {isLoading && <span className="text-sm text-gray-500">Refreshing…</span>}
          </div>
        </div>
    </div>
  );
};

export default Sales;

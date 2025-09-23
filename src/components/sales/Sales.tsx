import React, { useEffect, useMemo, useState, useRef, useCallback } from "react";
import { usePOSRedux } from "@/hooks/usePOSRedux";
import { SaleRecord } from "@/types/inventory";
import { format } from "date-fns";
import { AlertCircle, ChevronDown, ChevronUp, ExternalLink, X } from "lucide-react";
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

      // Try to find the complete sale data from Redux store first
      const completeSale = salesHistory.find(s => s.id === sale.id);

      if (completeSale) {
        // Use the data from Redux store
        if (completeSale.order && completeSale.order.id) {
          orderId = completeSale.order.id.toString();
        } else if (completeSale.orderId) {
          orderId = completeSale.orderId.toString();
        }
      }

      // If still no orderId, use sale ID as fallback
      if (!orderId) {
        orderId = sale.id.toString();
        console.warn(`⚠️ Using sale ID as order ID fallback for sale ${sale.id}`);
      }

      setEditingSaleId(orderId);
      const saleWithOrderId = {
        ...sale,
        orderId: orderId
      };
      setSelectedSaleForEdit(saleWithOrderId);
      navigate("/pos");
    },
    [salesHistory, setSelectedSaleForEdit, setEditingSaleId, navigate]
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
    <div className="min-h-screen bg-gray-50 py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Sales History</h1>
          <p className="text-gray-600">View and manage your sales records</p>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Filters</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Item Filter</label>
              <select value={selectedItemFilter} onChange={e => setSelectedItemFilter(e.target.value)} className="w-full rounded-lg border-gray-300 bg-gray-50 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-colors duration-200 py-2.5 px-3">
                <option value="all">All Items</option>
                {uniqueItemNames.map(item => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Section Filter</label>
              <select value={selectedSectionFilter} onChange={e => setSelectedSectionFilter(e.target.value)} className="w-full rounded-lg border-gray-300 bg-gray-50 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-colors duration-200 py-2.5 px-3">
                <option value="all">All Sections</option>
                {uniqueSectionNames.map(section => (
                  <option key={section} value={section}>
                    {section}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">From Date</label>
              <input type="date" value={dateFrom ? format(dateFrom, "yyyy-MM-dd") : ""} onChange={e => setDateFrom(e.target.value ? new Date(e.target.value) : null)} className="w-full rounded-lg border-gray-300 bg-gray-50 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-colors duration-200 py-2.5 px-3" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">To Date</label>
              <input type="date" value={dateTo ? format(dateTo, "yyyy-MM-dd") : ""} onChange={e => setDateTo(e.target.value ? new Date(e.target.value) : null)} className="w-full rounded-lg border-gray-300 bg-gray-50 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-colors duration-200 py-2.5 px-3" />
            </div>
          </div>
        </div>

        {/* Loading and Error States */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <div className="flex items-center">
              <AlertCircle className="h-5 w-5 text-red-400 mr-2" />
              <span className="text-red-800 font-medium">{error}</span>
            </div>
          </div>
        )}

        {/* Sales Table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors duration-150 group" onClick={() => handleSort("saleDate")}>
                    <div className="flex items-center space-x-1">
                      <span>Date</span>
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-150">{sortField === "saleDate" ? sortDirection === "asc" ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}</div>
                    </div>
                  </th>

                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors duration-150 group" onClick={() => handleSort("orderNumber")}>
                    <div className="flex items-center space-x-1">
                      <span>Order Number</span>
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-150">{sortField === "orderNumber" ? sortDirection === "asc" ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}</div>
                    </div>
                  </th>

                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors duration-150 group" onClick={() => handleSort("totalAmount")}>
                    <div className="flex items-center space-x-1">
                      <span>Total</span>
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-150">{sortField === "totalAmount" ? sortDirection === "asc" ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}</div>
                    </div>
                  </th>

                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Items</th>

                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>

              <tbody className="bg-white divide-y divide-gray-200">
                {sortedSales.map(sale => (
                  <React.Fragment key={sale.id}>
                    <tr className="hover:bg-blue-50 transition-colors duration-150">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 cursor-pointer" onClick={() => toggleSaleDetails(sale.id)}>
                        {formatDate(sale.saleDate)}
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 cursor-pointer" onClick={() => toggleSaleDetails(sale.id)}>
                        {sale.orderNumber}
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900 cursor-pointer" onClick={() => toggleSaleDetails(sale.id)}>
                        {formatCurrency(sale.totalAmount)}
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 cursor-pointer" onClick={() => toggleSaleDetails(sale.id)}>
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">{(sale.items?.length || 0) + (sale.menuItems?.length || 0)} items</span>
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap">
                        <Button variant="outline" size="sm" onClick={() => handleSaleClick(sale)} className="flex items-center gap-2 bg-white hover:bg-gray-50 border-gray-300 text-gray-700 hover:text-gray-900 transition-colors duration-150">
                          <ExternalLink className="h-4 w-4" />
                          Edit in POS
                        </Button>
                      </td>
                    </tr>

                    {expandedSale === sale.id && (
                      <tr>
                        <td colSpan={6} className="px-6 py-4">
                          <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                            <div className="flex items-center justify-between mb-4">
                              <h3 className="text-lg font-semibold text-gray-900">Sale Details</h3>
                              <Button variant="ghost" size="sm" onClick={() => toggleSaleDetails(sale.id)} className="text-gray-500 hover:text-gray-700">
                                <X className="h-4 w-4" />
                              </Button>
                            </div>

                            <div className="overflow-x-auto">
                              <table className="min-w-full divide-y divide-gray-200">
                                <thead>
                                  <tr>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Item Name</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quantity</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Unit Price</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                                  </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                  {sale.menuItems?.map((item, index) => (
                                    <tr key={`menu-${index}`} className="hover:bg-gray-50">
                                      <td className="px-4 py-3 text-sm font-medium text-gray-900">{item.menuItemName}</td>
                                      <td className="px-4 py-3 text-sm text-gray-600">
                                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-green-100 text-green-800">Menu Item</span>
                                      </td>
                                      <td className="px-4 py-3 text-sm text-gray-600">{item.quantity}</td>
                                      <td className="px-4 py-3 text-sm text-gray-600">{formatCurrency(item.unitPrice)}</td>
                                      <td className="px-4 py-3 text-sm font-semibold text-gray-900">{formatCurrency(item.quantity * parseFloat(item.unitPrice.toString()))}</td>
                                    </tr>
                                  ))}

                                  {sale.items?.map((item, index) => (
                                    <tr key={`material-${index}`} className="hover:bg-gray-50">
                                      <td className="px-4 py-3 text-sm font-medium text-gray-900">{item.materialName}</td>
                                      <td className="px-4 py-3 text-sm text-gray-600">
                                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-purple-100 text-purple-800">Material</span>
                                      </td>
                                      <td className="px-4 py-3 text-sm text-gray-600">{item.quantity}</td>
                                      <td className="px-4 py-3 text-sm text-gray-600">{formatCurrency(item.unitPrice)}</td>
                                      <td className="px-4 py-3 text-sm font-semibold text-gray-900">{formatCurrency(item.quantity * parseFloat(item.unitPrice.toString()))}</td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>

          {/* Footer */}
          <div className="border-t border-gray-200 px-6 py-4 bg-gray-50">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <p className="text-lg font-semibold text-gray-900">
                Total Sales: <span className="text-blue-600">{formatCurrency(salesTotal)}</span>
              </p>
              {isLoading && (
                <div className="flex items-center space-x-2 text-gray-600">
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-600 border-t-transparent"></div>
                  <span className="text-sm">Refreshing...</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Sales;

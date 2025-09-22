import React, { useEffect, useMemo, useState } from "react";
import { usePOSRedux } from "@/hooks/usePOSRedux";
import { SaleRecord } from "@/types/inventory";
import { format } from "date-fns";
import { ArrowUpDown, ChevronDown, ChevronUp } from "lucide-react";

interface SalesProps {
  // Add any additional props if needed
}

const Sales: React.FC<SalesProps> = () => {
  const { salesHistory, fetchSalesHistory, isLoading, error, selectedItemFilter, selectedSectionFilter, dateFrom, dateTo, setSelectedItemFilter, setSelectedSectionFilter, setDateFrom, setDateTo, uniqueItemNames, uniqueSectionNames, setUniqueItemNames, setUniqueSectionNames, filteredSalesHistory, salesTotal } = usePOSRedux();

  const [sortField, setSortField] = useState<keyof SaleRecord | null>(null);
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
  const [expandedSale, setExpandedSale] = useState<string | null>(null);

  useEffect(() => {
    // Only fetch sales history if it's empty
    if (salesHistory.length === 0 && !isLoading) {
      fetchSalesHistory();
    }
  }, [fetchSalesHistory, salesHistory.length, isLoading]);

  // Update unique item and section names when sales history changes
  useEffect(() => {
    // Only update if salesHistory has items and the unique arrays are empty
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

  // Use the pre-selected sales total directly

  // Toggle expanded sale details
  const toggleSaleDetails = (saleId: string) => {
    setExpandedSale(expandedSale === saleId ? null : saleId);
  };

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
      {isLoading && <div className="text-center">Loading...</div>}
      {error && <div className="text-red-500 mb-4">{error}</div>}

      {/* Sales Table */}
      {!isLoading && !error && (
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
                  <tr>
                    <td className="px-6 py-4 whitespace-nowrap">{formatDate(sale.saleDate)}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{sale.orderNumber}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{formatCurrency(sale.totalAmount)}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{(sale.items?.length || 0) + (sale.menuItems?.length || 0)} items</td>
                    <td className="px-6 py-4 whitespace-nowrap">{sale.section?.name || "N/A"}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button onClick={() => toggleSaleDetails(sale.id)} className="text-indigo-600 hover:text-indigo-900">
                        {expandedSale === sale.id ? "Hide Details" : "Show Details"}
                      </button>
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
          <div className="mt-4 text-right">
            <p className="text-lg font-semibold">Total Sales: {formatCurrency(salesTotal)}</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default Sales;

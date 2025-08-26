import React, { useEffect, useRef, useState } from "react";
import { DollarSign, Utensils, Warehouse } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { formatCurrency } from "@/utils/dayOperationsFormattings";
import { stockAPI, type TotalStockValueResponse } from "@/api/stock.api.ts.tsx";

interface DashboardStats {
  totalMaterials: number;
  totalStockEntries: number;
  totalMenuItems: number;
  lowStockItems: number;
  totalStockValue: number;
  totalEmployees: number;
  pendingOrders: number;
  todaysSales: number;
}

interface KeyMetricsGridProps {
  stats: DashboardStats;
}

export const KeyMetricsGrid: React.FC<KeyMetricsGridProps> = ({ stats }) => {
  const [stockValueSummary, setStockValueSummary] = useState<TotalStockValueResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const firstLoadRef = useRef(true);
  // Tracks only unmount, not effect re-runs
  const unmountedRef = useRef(false);

  // Mark unmounted to avoid setting state after component is gone
  useEffect(() => {
    return () => {
      unmountedRef.current = true;
    };
  }, []);

  useEffect(() => {
    const fetchValue = async (withLoader: boolean) => {
      try {
        if (withLoader) {
          setLoading(true);
          setError(null);
        }
        const data = await stockAPI.getTotalStockValue();
        if (!unmountedRef.current) {
          setStockValueSummary(data);
          // Clear any previous error on success
          setError(null);
        }
      } catch (err) {
        console.warn("Failed to fetch total stock value:", err);
        if (!unmountedRef.current && withLoader) setError("Failed to load");
      } finally {
        if (!unmountedRef.current && withLoader) setLoading(false);
      }
    };

    // Initial and dependency-based refresh
    const withLoader = firstLoadRef.current;
    fetchValue(withLoader);
    if (firstLoadRef.current) firstLoadRef.current = false;

    // Light polling to keep it fresh without page refresh (no loader to avoid flicker)
    const id = setInterval(() => fetchValue(false), 15000);
    return () => {
      clearInterval(id);
    };
  }, [stats.totalMaterials, stats.totalStockEntries, stats.totalStockValue]);

  const mainStockValue = stockValueSummary?.totalStockValue ?? stats.totalStockValue;
  const entriesLabel = stockValueSummary ? String(stockValueSummary.entriesCount) : "-";
  const computedAtLabel = stockValueSummary ? new Date(stockValueSummary.computedAt).toLocaleString() : "-";
  const filtersLabel = stockValueSummary ? `materialId: ${stockValueSummary.filters.materialId || "Any"}, POS: ${stockValueSummary.filters.isPOSItem === "" ? "Any" : String(stockValueSummary.filters.isPOSItem)}, includeZero: ${stockValueSummary.filters.includeZero}` : "";

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <Card className="rounded-2xl">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Materials</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalMaterials}</p>
            </div>
            <Warehouse className="h-8 w-8 text-blue-500" />
          </div>
        </CardContent>
      </Card>

      <Card className="rounded-2xl">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Stock Value</p>
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(mainStockValue)}</p>
              <div className="mt-1">
                {loading ? (
                  <p className="text-xs text-gray-400">Loading…</p>
                ) : error ? (
                  <p className="text-xs text-red-500">{error}</p>
                ) : stockValueSummary ? (
                  <>
                    <p className="text-xs text-gray-500">Entries: {entriesLabel}</p>
                    <p className="text-[10px] text-gray-400">Computed: {computedAtLabel}</p>
                  </>
                ) : null}
              </div>
            </div>
            <DollarSign className="h-8 w-8 text-green-500" />
          </div>
        </CardContent>
      </Card>

      <Card className="rounded-2xl">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Menu Items</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalMenuItems}</p>
            </div>
            <Utensils className="h-8 w-8 text-purple-500" />
          </div>
        </CardContent>
      </Card>
      <Card className="rounded-2xl">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Sales</p>
              <p className="text-2xl font-bold text-gray-900">{stats.todaysSales}</p>
            </div>
            <DollarSign className="h-8 w-8 text-orange-500" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default KeyMetricsGrid;

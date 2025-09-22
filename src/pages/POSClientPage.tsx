import { ordersAPI } from "@/api/orders.api.ts";
import { salesAPI } from "@/api/sales.api.ts.tsx";
import POSLayout from "@/components/layout/POSLayout";
import { POSClient } from "@/components/pos/POSClient";
import { useAuth } from "@/contexts/AuthContext";
import { MenuItemsProvider } from "@/contexts/MenuItemsContext";
import { useInventoryStore } from "@/hooks/useInventoryStore";
import { PERMISSIONS } from "@/types/auth";
import { SaleResponse } from "@/types/inventory";
import { Order, OrderSummary } from "@/types/orders";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

interface POSClientPageProps {
  isDayOpen?: boolean;
}

const POSClientPage: React.FC<POSClientPageProps> = ({ isDayOpen = true }) => {
  const navigate = useNavigate();
  const { user, hasPermission, logout, isAuthenticated, isLoading } = useAuth();
  const { sectionAssignments, fetchTabData } = useInventoryStore();
  const [sessionStats, setSessionStats] = useState({
    totalSales: 0,
    transactionCount: 0,
    incompleteOrdersCount: 0
  });

  const [selectedOrderForPOS, setSelectedOrderForPOS] = useState<Order | null>(null);

  const refreshCountsRef = useRef<(() => Promise<void>) | null>(null);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      navigate("/login");
      return;
    }

    if (!isLoading && isAuthenticated && !hasPermission(PERMISSIONS.SALES_CREATE)) {
      navigate("/login");
      return;
    }
  }, [isAuthenticated, isLoading, hasPermission, navigate]);

  useEffect(() => {
    fetchTabData("materials");
    fetchTodaysSales();
    fetchIncompleteOrders();
  }, [fetchTabData]);

  const fetchTodaysSales = async () => {
    try {
      const response = await salesAPI.getSales();
      const allSales = response.data || [];
      const today = new Date().toISOString().split("T")[0];
      const todaysSales = allSales.filter(sale => {
        const saleDate = new Date(sale.saleDate || sale.createdAt || "").toISOString().split("T")[0];
        return saleDate === today;
      });
      const totalSales = todaysSales.reduce((sum, sale) => {
        const saleAmount = Number(sale.totalAmount) || 0;
        return sum + (isNaN(saleAmount) ? 0 : saleAmount);
      }, 0);
      setSessionStats(prev => ({
        ...prev,
        totalSales: isNaN(totalSales) ? 0 : totalSales,
        transactionCount: todaysSales.length
      }));
    } catch (error) {
      console.error("Failed to fetch today's sales:", error);
    }
  };

  const fetchIncompleteOrders = async () => {
    try {
      const response = await ordersAPI.getOrders({ limit: 100, offset: 0 });
      const responseData = response.data as { data?: OrderSummary[] } | OrderSummary[];
      const allOrders = Array.isArray(responseData) ? responseData : responseData?.data || [];
      const today = new Date().toISOString().split("T")[0];
      const incompleteStatuses = ['draft', 'confirmed', 'preparing', 'ready'];
      const incompleteOrdersToday = allOrders.filter((order: OrderSummary) => {
        const orderDate = order.createdAt ? new Date(order.createdAt).toISOString().split("T")[0] : null;
        const isToday = orderDate === today;
        const isIncomplete = incompleteStatuses.includes(order.status);
        return isToday && isIncomplete;
      });
      setSessionStats(prev => ({
        ...prev,
        incompleteOrdersCount: incompleteOrdersToday.length
      }));
    } catch (error) {
      console.error("Failed to fetch incomplete orders:", error);
    }
  };

  const handleSaleComplete = (saleData: SaleResponse) => {
    const saleAmount = Number(saleData.totalAmount) || 0;
    const validSaleAmount = isNaN(saleAmount) ? 0 : saleAmount;
    setSessionStats(prev => ({
      totalSales: prev.totalSales + validSaleAmount,
      transactionCount: prev.transactionCount + 1,
      incompleteOrdersCount: prev.incompleteOrdersCount
    }));
    fetchTabData("materials");
  };

  const handleOrderSelect = useCallback(async (order: Order) => {
    setSelectedOrderForPOS(order);
  }, []);

  const handleRefreshCounts = useCallback((refreshFn: () => Promise<void>) => {
    refreshCountsRef.current = async () => {
      await refreshFn();
      await fetchIncompleteOrders();
    };
  }, []);

  const handleLogout = async () => {
    try {
      await logout();
      navigate("/login");
    } catch (error) {
      console.error("Logout failed:", error);
      navigate("/login");
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return null;
  }

  return (
    <POSLayout 
      currentTotal={sessionStats.totalSales} 
      transactionCount={sessionStats.transactionCount}
      incompleteOrdersCount={sessionStats.incompleteOrdersCount}
      onLogout={handleLogout}
      onOrderSelect={handleOrderSelect}
      onRefreshCounts={handleRefreshCounts}
    >
      <MenuItemsProvider>
        <POSClient 
          sectionAssignments={sectionAssignments} 
          onSaleComplete={handleSaleComplete}
          selectedOrderForPOS={selectedOrderForPOS}
          onOrderProcessed={undefined}
          refreshCountsRef={refreshCountsRef}
          isDayOpen={isDayOpen}
        />
      </MenuItemsProvider>
    </POSLayout>
  );
};

export default POSClientPage;

import { ordersAPI } from "@/api/orders.api.ts";
import { salesAPI } from "@/api/sales.api.ts.tsx";
import POSLayout from "@/components/layout/POSLayout";
import { POSClient } from "@/components/pos/POSClient";
import { useAuth } from "@/contexts/AuthContext";
import { useInventoryStore } from "@/hooks/useInventoryStore";
import { PERMISSIONS } from "@/types/auth";
import { SaleResponse } from "@/types/inventory";
import { Order, OrderSummary } from "@/types/orders";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

const POSClientPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, hasPermission, logout, isAuthenticated, isLoading } = useAuth();
  const { sectionAssignments, fetchTabData } = useInventoryStore();
  const [sessionStats, setSessionStats] = useState({
    totalSales: 0,
    transactionCount: 0,
    incompleteOrdersCount: 0
  });

  // State to hold selected order that will be passed to POSClient
  const [selectedOrderForPOS, setSelectedOrderForPOS] = useState<Order | null>(null);

  // Ref to store the refresh counts function from POSLayout
  const refreshCountsRef = useRef<(() => Promise<void>) | null>(null);

  // Check authentication and permissions
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

  // Load initial data and fetch today's sales
  useEffect(() => {
    fetchTabData("materials");
    fetchTodaysSales();
    fetchIncompleteOrders();
  }, [fetchTabData]);

  // Fetch today's sales total
  const fetchTodaysSales = async () => {
    try {
      const response = await salesAPI.getSales();
      const allSales = response.data || [];

      // Filter sales for today
      const today = new Date().toISOString().split("T")[0]; // YYYY-MM-DD format
      const todaysSales = allSales.filter(sale => {
        const saleDate = new Date(sale.saleDate || sale.createdAt || "").toISOString().split("T")[0];
        return saleDate === today;
      });

      // Calculate total from today's sales
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
      // Keep default values if fetch fails
    }
  };

  // Fetch incomplete orders count
  const fetchIncompleteOrders = async () => {
    try {
      const response = await ordersAPI.getOrders({ limit: 100, offset: 0 });
      const responseData = response.data as { data?: OrderSummary[] } | OrderSummary[];
      const allOrders = Array.isArray(responseData) ? responseData : responseData?.data || [];
      
      // Filter for incomplete orders from today
      const today = new Date().toISOString().split("T")[0];
      const incompleteStatuses = ['draft', 'confirmed', 'preparing', 'ready'];
      
      const incompleteOrdersToday = allOrders.filter((order: OrderSummary) => {
        // Check if order is from today
        const orderDate = order.createdAt ? new Date(order.createdAt).toISOString().split("T")[0] : null;
        const isToday = orderDate === today;
        
        // Check if order is incomplete and not a table order
        const isIncomplete = incompleteStatuses.includes(order.status);
        const isNotTableOrder = order.orderType !== 'table';
        
        return isToday && isIncomplete && isNotTableOrder;
      });
      
      setSessionStats(prev => ({
        ...prev,
        incompleteOrdersCount: incompleteOrdersToday.length
      }));
    } catch (error) {
      console.error("Failed to fetch incomplete orders:", error);
      // Keep default value if fetch fails
    }
  };

  // Handle sale completion
  const handleSaleComplete = (saleData: SaleResponse) => {
    const saleAmount = Number(saleData.totalAmount) || 0;
    const validSaleAmount = isNaN(saleAmount) ? 0 : saleAmount;

    setSessionStats(prev => ({
      totalSales: prev.totalSales + validSaleAmount,
      transactionCount: prev.transactionCount + 1,
      incompleteOrdersCount: prev.incompleteOrdersCount // Keep existing count
    }));

    // Refresh data after sale
    fetchTabData("materials");
  };

  // Handle order selection from POSLayout
  const handleOrderSelect = useCallback(async (order: Order) => {
    console.log("📎 POSClientPage: Order selected from POSLayout:", order);
    // Set the selected order state which will trigger POSClient to load it
    setSelectedOrderForPOS(order);
  }, []);

  // Handle refresh counts callback from POSLayout
  const handleRefreshCounts = useCallback((refreshFn: () => Promise<void>) => {
    refreshCountsRef.current = async () => {
      await refreshFn(); // Call the original refresh function
      await fetchIncompleteOrders(); // Also refresh incomplete orders count
    };
  }, []);

  // Handle logout
  const handleLogout = async () => {
    try {
      await logout();
      navigate("/login");
    } catch (error) {
      console.error("Logout failed:", error);
      // Force navigation even if logout fails
      navigate("/login");
    }
  };

  // Show loading while checking authentication
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

  // Don't render if not authenticated (useEffect will handle redirect)
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
      <POSClient 
        sectionAssignments={sectionAssignments} 
        onSaleComplete={handleSaleComplete}
        selectedOrderForPOS={selectedOrderForPOS}
        onOrderProcessed={() => setSelectedOrderForPOS(null)}
        refreshCountsRef={refreshCountsRef}
      />
    </POSLayout>
  );
};

export default POSClientPage;

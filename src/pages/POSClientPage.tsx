import { salesAPI } from "@/api/sales.api.ts.tsx";
import POSLayout from "@/components/layout/POSLayout";
import { POSClient } from "@/components/pos/POSClient";
import { useAuth } from "@/contexts/AuthContext";
import { useInventoryStore } from "@/hooks/useInventoryStore";
import { PERMISSIONS } from "@/types/auth";
import { SaleResponse } from "@/types/inventory";
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const POSClientPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, hasPermission, logout, isAuthenticated, isLoading } = useAuth();
  const { sectionAssignments, fetchTabData } = useInventoryStore();
  const [sessionStats, setSessionStats] = useState({
    totalSales: 0,
    transactionCount: 0
  });

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

  // Handle sale completion
  const handleSaleComplete = (saleData: SaleResponse) => {
    const saleAmount = Number(saleData.totalAmount) || 0;
    const validSaleAmount = isNaN(saleAmount) ? 0 : saleAmount;

    setSessionStats(prev => ({
      totalSales: prev.totalSales + validSaleAmount,
      transactionCount: prev.transactionCount + 1
    }));

    // Refresh data after sale
    fetchTabData("materials");
  };

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
    <POSLayout currentTotal={sessionStats.totalSales} transactionCount={sessionStats.transactionCount} onLogout={handleLogout}>
      <POSClient sectionAssignments={sectionAssignments} onSaleComplete={handleSaleComplete} />
    </POSLayout>
  );
};

export default POSClientPage;

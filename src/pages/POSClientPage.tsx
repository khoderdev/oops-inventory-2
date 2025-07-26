import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useInventoryStore } from "@/hooks/useInventoryStore";
import { useAuth } from "@/contexts/AuthContext";
import POSLayout from "@/components/layout/POSLayout";
import { POSClient } from "@/components/pos/POSClient";
import { PERMISSIONS } from "@/types/auth";

const POSClientPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, hasPermission, logout, isAuthenticated, isLoading } = useAuth();
  const { materialsWithStock, sectionAssignments, fetchTabData } = useInventoryStore();
  const [sessionStats, setSessionStats] = useState({
    totalSales: 0,
    transactionCount: 0
  });

  // Check authentication and permissions
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      navigate('/login');
      return;
    }
    
    if (!isLoading && isAuthenticated && !hasPermission(PERMISSIONS.SALES_CREATE)) {
      navigate('/login');
      return;
    }
  }, [isAuthenticated, isLoading, hasPermission, navigate]);

  // Load initial data
  useEffect(() => {
    fetchTabData('materials');
  }, [fetchTabData]);

  // Handle sale completion
  const handleSaleComplete = (saleData: any) => {
    setSessionStats(prev => ({
      totalSales: prev.totalSales + (saleData.totalAmount || 0),
      transactionCount: prev.transactionCount + 1
    }));

    // Refresh data after sale
    fetchTabData('materials');
  };

  // Handle logout
  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Logout failed:', error);
      // Force navigation even if logout fails
      navigate('/login');
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
      onLogout={handleLogout}
    >
      <POSClient
        materials={materialsWithStock}
        sectionAssignments={sectionAssignments}
        onSaleComplete={handleSaleComplete}
      />
    </POSLayout>
  );
};

export default POSClientPage;

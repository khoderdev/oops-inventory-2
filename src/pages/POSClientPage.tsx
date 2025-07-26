import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useInventoryStore } from "@/hooks/useInventoryStore";
import { useAuth } from "@/contexts/AuthContext";
import POSLayout from "@/components/layout/POSLayout";
import { POSClient } from "@/components/pos/POSClient";
import { PERMISSIONS } from "@/types/auth";

const POSClientPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, hasPermission } = useAuth();
  const { materialsWithStock, sectionAssignments, fetchTabData } = useInventoryStore();
  const [sessionStats, setSessionStats] = useState({
    totalSales: 0,
    transactionCount: 0
  });

  // Check permissions
  useEffect(() => {
    if (!hasPermission(PERMISSIONS.SALES_CREATE)) {
      navigate('/login');
      return;
    }
  }, [hasPermission, navigate]);

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
  const handleLogout = () => {
    navigate('/login');
  };

  if (!user) {
    return null; // Will redirect to login
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

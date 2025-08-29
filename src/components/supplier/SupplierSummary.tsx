// src/components/supplier/SupplierSummary.tsx
import React from 'react';
import { useSupplierSummary } from '@/hooks/useSuppliers';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const SupplierSummary: React.FC = () => {
  const { data: summary, isLoading } = useSupplierSummary();

  if (isLoading) return <div>Loading summary...</div>;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <Card>
        <CardHeader>
          <CardTitle>Total Suppliers</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-3xl font-bold">{summary?.totalSuppliers || 0}</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Total Outstanding</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-3xl font-bold">${summary?.totalOutstanding || 0}</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Active Suppliers</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-3xl font-bold">{summary?.activeSuppliers || 0}</p>
        </CardContent>
      </Card>
      {/* Add more summary cards as per the summary data structure */}
    </div>
  );
};

export default SupplierSummary;
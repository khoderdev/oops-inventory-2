import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import SuppliersList from './SuppliersList';
import SupplierSummary from './SupplierSummary';

const SupplierManagement: React.FC = () => {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Supplier Management</h1>
      <Tabs defaultValue="list">
        <TabsList>
          <TabsTrigger value="list">Suppliers List</TabsTrigger>
          <TabsTrigger value="summary">Summary</TabsTrigger>
        </TabsList>
        <TabsContent value="list">
          <SuppliersList />
        </TabsContent>
        <TabsContent value="summary">
          <SupplierSummary />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SupplierManagement;
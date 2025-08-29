// src/components/supplier/SupplierDetails.tsx
import React from "react";
import { useSupplier, useOutstandingInvoices } from "@/hooks/useSuppliers";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import CreateSettlementForm from "./CreateSettlementForm";
import { SupplierSettlement } from "@/types/supplier";

interface SupplierDetailsProps {
  supplierId: number | string;
}

const SupplierDetails: React.FC<SupplierDetailsProps> = ({ supplierId }) => {
  const { data: supplier } = useSupplier(supplierId, { includeInvoices: true, includeSettlements: true });
  const { data: outstandingInvoices } = useOutstandingInvoices(supplierId);

  if (!supplier) return <div>Loading supplier details...</div>;

  return (
    <div>
      <h2 className="text-xl font-semibold mb-4">{supplier.name}</h2>
      <p>Contact: {supplier.contactPerson}</p>
      <p>Email: {supplier.email}</p>
      <p>Phone: {supplier.phone}</p>
      <p>Address: {supplier.address}</p>
      <p>Payment Terms: {supplier.paymentTerms} days</p>
      <p>Credit Limit: ${supplier.creditLimit}</p>

      <Tabs defaultValue="invoices" className="mt-6">
        <TabsList>
          <TabsTrigger value="invoices">Outstanding Invoices</TabsTrigger>
          <TabsTrigger value="settlements">Settlements</TabsTrigger>
        </TabsList>
        <TabsContent value="invoices">
          <div className="flex justify-end mb-4">
            <Dialog>
              <DialogTrigger asChild>
                <Button>Create Settlement</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create Payment Settlement</DialogTitle>
                </DialogHeader>
                <CreateSettlementForm supplierId={supplierId} outstandingInvoices={outstandingInvoices || []} />
              </DialogContent>
            </Dialog>
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Invoice ID</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Due Date</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {outstandingInvoices?.map(invoice => (
                <TableRow key={invoice.id}>
                  <TableCell>{invoice.id}</TableCell>
                  <TableCell>${invoice.amount}</TableCell>
                  <TableCell>{invoice.dueDate}</TableCell>
                  <TableCell>{invoice.status}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TabsContent>
        <TabsContent value="settlements">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Settlement ID</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Payment Method</TableHead>
                <TableHead>Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {supplier.settlements?.map(
                (
                  settlement: SupplierSettlement 
                ) => (
                  <TableRow key={settlement.id}>
                    <TableCell>{settlement.id}</TableCell>
                    <TableCell>${settlement.amount}</TableCell>
                    <TableCell>{settlement.paymentMethod}</TableCell>
                    <TableCell>{settlement.paymentDate}</TableCell>
                  </TableRow>
                )
              )}
            </TableBody>
          </Table>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SupplierDetails;

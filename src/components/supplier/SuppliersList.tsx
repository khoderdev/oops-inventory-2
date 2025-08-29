import React, { useState } from "react";
import { useSuppliers, useCreateSupplier, useUpdateSupplier, useDeleteSupplier, useBulkUpdateSupplierStatus, useSupplierForm } from "@/hooks/useSuppliers";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import SupplierDetails from "./SupplierDetails";
import CreateSupplierForm from "./CreateSupplierForm";
import UpdateSupplierForm from "./UpdateSupplierForm";
import { SuppliersQueryParams } from "@/types/supplier";

const SuppliersList: React.FC = () => {
  const [params, setParams] = useState<SuppliersQueryParams>({});
  const { data: suppliers, isLoading } = useSuppliers(params);
  const [selectedSuppliers, setSelectedSuppliers] = useState<(number | string)[]>([]);
  const [selectedSupplierId, setSelectedSupplierId] = useState<number | string | null>(null);
  const bulkUpdate = useBulkUpdateSupplierStatus();

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedSuppliers(suppliers?.data.data.map(s => s.id) || []);
    } else {
      setSelectedSuppliers([]);
    }
  };

  const handleSelect = (id: number | string, checked: boolean) => {
    setSelectedSuppliers(prev => (checked ? [...prev, id] : prev.filter(s => s !== id)));
  };

  const handleBulkUpdate = (status: string) => {
    bulkUpdate.mutate({ ids: selectedSuppliers, status });
    setSelectedSuppliers([]);
  };

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setParams(prev => ({ ...prev, search: e.target.value }));
  };

  if (isLoading) return <div>Loading suppliers...</div>;
  console.log("Suppliers response:", suppliers);

  return (
    <div>
      <div className="flex justify-between mb-4">
        <Input placeholder="Search suppliers..." onChange={handleSearch} className="w-64" />
        <Dialog>
          <DialogTrigger asChild>
            <Button>Create Supplier</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Supplier</DialogTitle>
            </DialogHeader>
            <CreateSupplierForm onSuccess={() => {}} />
          </DialogContent>
        </Dialog>
      </div>
      {selectedSuppliers.length > 0 && (
        <div className="mb-4">
          <Select onValueChange={handleBulkUpdate}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Bulk Update Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>
              <Checkbox onCheckedChange={handleSelectAll} />
            </TableHead>
            <TableHead>Name</TableHead>
            <TableHead>Contact</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Phone</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {Array.isArray(suppliers?.data?.data) &&
            suppliers.data.data.map(supplier => (
              <TableRow key={supplier.id}>
                <TableCell>
                  <Checkbox checked={selectedSuppliers.includes(supplier.id)} onCheckedChange={checked => handleSelect(supplier.id, checked as boolean)} />
                </TableCell>
                <TableCell>{supplier.name}</TableCell>
                <TableCell>{supplier.contactPerson}</TableCell>
                <TableCell>{supplier.email}</TableCell>
                <TableCell>{supplier.phone}</TableCell>
                <TableCell>
                  <Button variant="link" onClick={() => setSelectedSupplierId(supplier.id)}>
                    View
                  </Button>
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button variant="link">Edit</Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Update Supplier</DialogTitle>
                      </DialogHeader>
                      <UpdateSupplierForm supplierId={supplier.id} initialData={supplier} />
                    </DialogContent>
                  </Dialog>
                  <DeleteSupplierButton supplierId={supplier.id} />
                </TableCell>
              </TableRow>
            ))}
        </TableBody>
      </Table>
      {selectedSupplierId && (
        <Dialog open={!!selectedSupplierId} onOpenChange={() => setSelectedSupplierId(null)}>
          <DialogContent className="max-w-4xl">
            <DialogHeader>
              <DialogTitle>Supplier Details</DialogTitle>
            </DialogHeader>
            <SupplierDetails supplierId={selectedSupplierId} />
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

const DeleteSupplierButton: React.FC<{ supplierId: number | string }> = ({ supplierId }) => {
  const deleteSupplier = useDeleteSupplier();
  return (
    <Button variant="link" onClick={() => deleteSupplier.mutate(supplierId)}>
      Delete
    </Button>
  );
};

export default SuppliersList;

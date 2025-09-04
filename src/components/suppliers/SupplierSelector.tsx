import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Plus } from "lucide-react";
import { useSuppliersContext } from "@/context/SuppliersContext";
import { Supplier } from "@/types/suppliers";
import SupplierForm from "./SupplierForm";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface SupplierSelectorProps {
  value: string;
  onChange: (value: string) => void;
  onSupplierCreate?: (supplier: Supplier) => void;
}

export function SupplierSelector({ value, onChange, onSupplierCreate }: SupplierSelectorProps) {
  const { suppliers, loading, fetchSuppliers } = useSuppliersContext();
  const [isNewSupplierDialogOpen, setIsNewSupplierDialogOpen] = useState(false);

  useEffect(() => {
    fetchSuppliers(true);
  }, []);

  const handleSelectSupplier = (supplierId: string) => {
    onChange(supplierId);
  };

  const handleSupplierCreate = (supplier: Supplier) => {
    onChange(supplier.id.toString());
    setIsNewSupplierDialogOpen(false);
    if (onSupplierCreate) {
      onSupplierCreate(supplier);
    }
  };

  return (
    <div className="flex gap-2">
      {/* Simple select dropdown */}
      <div className="relative w-full">
        <Select value={value} onValueChange={handleSelectSupplier}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select supplier" />
          </SelectTrigger>
          <SelectContent>
            {loading ? (
              <div className="p-2 text-sm text-center">Loading suppliers...</div>
            ) : suppliers.length === 0 ? (
              <div className="p-2 text-sm text-center">No suppliers found</div>
            ) : (
              suppliers.map(supplier => (
                <SelectItem key={supplier.id} value={supplier.id.toString()}>
                  {supplier.name}
                  {!supplier.isActive && " (Inactive)"}
                </SelectItem>
              ))
            )}
          </SelectContent>
        </Select>
      </div>

      <Button type="button" variant="outline" size="icon" onClick={() => setIsNewSupplierDialogOpen(true)} title="Add new supplier">
        <Plus className="h-4 w-4" />
      </Button>

      {/* New supplier dialog */}
      <Dialog open={isNewSupplierDialogOpen} onOpenChange={setIsNewSupplierDialogOpen}>
        <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add New Supplier</DialogTitle>
          </DialogHeader>
          <SupplierForm onSuccess={handleSupplierCreate} onCancel={() => setIsNewSupplierDialogOpen(false)} />
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default SupplierSelector;

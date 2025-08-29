// src/components/supplier/UpdateSupplierForm.tsx
import React from 'react';
import { useUpdateSupplier, useSupplierForm } from '@/hooks/useSuppliers';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { DialogClose } from '@/components/ui/dialog';
import { Supplier } from '@/types/supplier';

interface UpdateSupplierFormProps {
  supplierId: number | string;
  initialData: Partial<Supplier>;
}

const UpdateSupplierForm: React.FC<UpdateSupplierFormProps> = ({ supplierId, initialData }) => {
  const updateSupplier = useUpdateSupplier();
  const { formData, setFormData, updateField } = useSupplierForm(initialData);

  React.useEffect(() => {
    setFormData({
      name: initialData.name || "",
      contactPerson: initialData.contactPerson || "",
      email: initialData.email || "",
      phone: initialData.phone || "",
      address: initialData.address || "",
      paymentTerms: initialData.paymentTerms || 30,
      creditLimit: initialData.creditLimit || 0,
    });
  }, [initialData, setFormData]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateSupplier.mutate({ id: supplierId, data: formData });
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="grid gap-4">
        <div>
          <Label htmlFor="name">Name</Label>
          <Input id="name" value={formData.name} onChange={(e) => updateField('name', e.target.value)} required />
        </div>
        <div>
          <Label htmlFor="contactPerson">Contact Person</Label>
          <Input id="contactPerson" value={formData.contactPerson} onChange={(e) => updateField('contactPerson', e.target.value)} />
        </div>
        <div>
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" value={formData.email} onChange={(e) => updateField('email', e.target.value)} />
        </div>
        <div>
          <Label htmlFor="phone">Phone</Label>
          <Input id="phone" value={formData.phone} onChange={(e) => updateField('phone', e.target.value)} />
        </div>
        <div>
          <Label htmlFor="address">Address</Label>
          <Input id="address" value={formData.address} onChange={(e) => updateField('address', e.target.value)} />
        </div>
        <div>
          <Label htmlFor="paymentTerms">Payment Terms (days)</Label>
          <Input id="paymentTerms" type="number" value={formData.paymentTerms} onChange={(e) => updateField('paymentTerms', Number(e.target.value))} />
        </div>
        <div>
          <Label htmlFor="creditLimit">Credit Limit</Label>
          <Input id="creditLimit" type="number" value={formData.creditLimit} onChange={(e) => updateField('creditLimit', Number(e.target.value))} />
        </div>
        <DialogClose asChild>
          <Button type="submit" disabled={updateSupplier.isPending}>Update</Button>
        </DialogClose>
      </div>
    </form>
  );
};

export default UpdateSupplierForm;
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Supplier, CreateSupplierData, UpdateSupplierData } from "@/types/supplier";
import { supplierFormSchema } from "./schemas/supplier-schema";

interface SupplierFormProps {
  supplier?: Supplier | null;
  onSubmit: (data: CreateSupplierData | UpdateSupplierData) => void;
  isSubmitting?: boolean;
  onCancel?: () => void;
  hideButtons?: boolean;
}

export function SupplierForm({ 
  supplier, 
  onSubmit, 
  isSubmitting = false, 
  onCancel, 
  hideButtons = false 
}: SupplierFormProps) {
  const form = useForm<CreateSupplierData | UpdateSupplierData>({
    resolver: zodResolver(supplierFormSchema),
    defaultValues: supplier || {
      name: "",
      contactPerson: "",
      email: "",
      phone: "",
      address: "",
      paymentTerms: 30,
      creditLimit: 0,
      isActive: true
    }
  });

  const handleSubmit = form.handleSubmit(async (data) => {
    await onSubmit(data as CreateSupplierData);
  });

  const { register, formState: { errors } } = form;

  return (
    <form onSubmit={handleSubmit} className="space-y-4 p-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label htmlFor="name">Supplier Name *</Label>
          <Input id="name" {...register("name")} />
          {errors.name && <p className="text-sm text-red-500">{errors.name.message}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="contactPerson">Contact Person</Label>
          <Input id="contactPerson" {...register("contactPerson")} />
          {errors.contactPerson && <p className="text-sm text-red-500">{errors.contactPerson.message}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" {...register("email")} />
          {errors.email && <p className="text-sm text-red-500">{errors.email.message}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="phone">Phone</Label>
          <Input id="phone" {...register("phone")} />
          {errors.phone && <p className="text-sm text-red-500">{errors.phone.message}</p>}
        </div>

        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="address">Address</Label>
          <Textarea id="address" {...register("address")} />
          {errors.address && <p className="text-sm text-red-500">{errors.address.message}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="paymentTerms">Payment Terms (days)</Label>
          <Input id="paymentTerms" type="number" {...register("paymentTerms", { valueAsNumber: true })} />
          {errors.paymentTerms && <p className="text-sm text-red-500">{errors.paymentTerms.message}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="creditLimit">Credit Limit</Label>
          <Input id="creditLimit" type="number" step="0.01" {...register("creditLimit", { valueAsNumber: true })} />
          {errors.creditLimit && <p className="text-sm text-red-500">{errors.creditLimit.message}</p>}
        </div>
      </div>

      {!hideButtons && (
        <div className="flex justify-end space-x-4">
          <Button 
            type="button" 
            variant="outline" 
            onClick={onCancel}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button 
            type="submit" 
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <span className="mr-2 h-4 w-4 animate-spin" />
                {supplier ? 'Updating...' : 'Creating...'}
              </>
            ) : supplier ? 'Update Supplier' : 'Create Supplier'}
          </Button>
        </div>
      )}
    </form>
  );
}

import React, { useState, useCallback, memo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { CreateSupplierData, SupplierFormProps, SupplierFormValues, supplierFormSchema } from "@/types/suppliers";
import { useSuppliersContext } from "@/context/SuppliersContext";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Loader2 } from "lucide-react";

// Memoized form field components to prevent unnecessary re-renders
const MemoizedFormField = memo(({ control, name, label, placeholder, type = "text", description }: any) => (
  <FormField
    control={control}
    name={name}
    render={({ field }) => (
      <FormItem>
        <FormLabel>{label}</FormLabel>
        <FormControl>
          {type === "textarea" ? (
            <Textarea placeholder={placeholder} className="resize-none" {...field} />
          ) : (
            <Input placeholder={placeholder} type={type} {...field} />
          )}
        </FormControl>
        {description && <FormDescription>{description}</FormDescription>}
        <FormMessage />
      </FormItem>
    )}
  />
));

export const SupplierForm: React.FC<SupplierFormProps> = ({ supplier, onSuccess, onCancel }) => {
  const { createSupplier, updateSupplier, loading } = useSuppliersContext();
  const isEditing = !!supplier;
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Use defaultValues to prevent unnecessary re-renders
  const defaultValues = {
    name: supplier?.name || "",
    contactPerson: supplier?.contactPerson || "",
    email: supplier?.email || "",
    phone: supplier?.phone || "",
    address: supplier?.address || "",
    notes: supplier?.notes || "",
    isActive: supplier?.isActive ?? true
  };

  const form = useForm<SupplierFormValues>({
    resolver: zodResolver(supplierFormSchema),
    defaultValues,
    mode: "onBlur" // Validate on blur instead of onChange to reduce renders
  });

  // Memoize submit handler to prevent unnecessary re-renders
  const onSubmit = useCallback(async (values: SupplierFormValues) => {
    // Prevent double submissions
    if (isSubmitting) return;
    
    try {
      setIsSubmitting(true);
      let result;
      
      if (isEditing && supplier) {
        result = await updateSupplier(supplier.id, values);
      } else {
        // Ensure all required fields are present for CreateSupplierData
        const supplierData: CreateSupplierData = {
          name: values.name,
          contactPerson: values.contactPerson || "",
          email: values.email || "",
          phone: values.phone || "",
          address: values.address || "",
          notes: values.notes || "",
          isActive: values.isActive
        };
        result = await createSupplier(supplierData);
      }
      
      if (result && onSuccess) {
        onSuccess(result);
      }
    } catch (error) {
      console.error("Error saving supplier:", error);
    } finally {
      setIsSubmitting(false);
    }
  }, [isEditing, supplier, updateSupplier, createSupplier, onSuccess, isSubmitting]);

  // Track if form is actually submitting to show correct loading state
  const isFormSubmitting = loading || isSubmitting;
  
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Use memoized form fields to prevent unnecessary re-renders */}
        <MemoizedFormField 
          control={form.control}
          name="name"
          label="Supplier Name*"
          placeholder="Enter supplier name"
        />

        <MemoizedFormField 
          control={form.control}
          name="contactPerson"
          label="Contact Person"
          placeholder="Enter contact person name"
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <MemoizedFormField 
            control={form.control}
            name="email"
            label="Email"
            placeholder="Enter email address"
            type="email"
          />

          <MemoizedFormField 
            control={form.control}
            name="phone"
            label="Phone"
            placeholder="Enter phone number"
          />
        </div>

        <MemoizedFormField 
          control={form.control}
          name="address"
          label="Address"
          placeholder="Enter supplier address"
          type="textarea"
        />

        <MemoizedFormField 
          control={form.control}
          name="notes"
          label="Notes"
          placeholder="Additional notes about this supplier"
          type="textarea"
          description="Any additional information about this supplier"
        />

        <FormField
          control={form.control}
          name="isActive"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <FormLabel className="text-base">Active Status</FormLabel>
                <FormDescription>Set whether this supplier is currently active</FormDescription>
              </div>
              <FormControl>
                <Switch checked={field.value} onCheckedChange={field.onChange} />
              </FormControl>
            </FormItem>
          )}
        />

        <div className="flex justify-end gap-2">
          {onCancel && (
            <Button 
              type="button" 
              variant="outline" 
              onClick={onCancel} 
              disabled={isFormSubmitting}
            >
              Cancel
            </Button>
          )}
          <Button 
            type="submit" 
            disabled={isFormSubmitting}
          >
            {isFormSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isEditing ? "Update Supplier" : "Create Supplier"}
          </Button>
        </div>
      </form>
    </Form>
  );
};

export default SupplierForm;

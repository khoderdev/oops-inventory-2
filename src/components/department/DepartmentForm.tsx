import React, { useEffect } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { EmployeeSelector } from "@/components/employees/EmployeeSelector";
import { createSchema, DepartmentCreateValues, DepartmentFormProps, type CreateDepartmentData, type UpdateDepartmentData, updateSchema } from "@/types/department";

const normalizeCode = (code: string) => code?.toUpperCase() || "";

export const DepartmentForm: React.FC<DepartmentFormProps> = ({ mode, initialData, onSubmit, onCancel, submitting }) => {
  const isEdit = mode === "edit";

  const form = useForm<DepartmentCreateValues & { isActive?: boolean }>({
    resolver: zodResolver(isEdit ? updateSchema : createSchema),
    defaultValues: {
      name: initialData?.name || "",
      code: initialData?.code || "",
      description: initialData?.description || "",
      managerId: initialData?.managerId ?? undefined,
      costCenter: initialData?.costCenter || "",
      ...(isEdit ? { isActive: initialData?.isActive ?? true } : {})
    }
  });

  useEffect(() => {
    if (initialData) {
      form.reset({
        name: initialData.name || "",
        code: initialData.code || "",
        description: initialData.description || "",
        managerId: initialData.managerId ?? undefined,
        costCenter: initialData.costCenter || "",
        ...(isEdit ? { isActive: initialData.isActive } : {})
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialData?.id]);

  const handleSubmit = async (values: DepartmentCreateValues & { isActive?: boolean }) => {
    const payload: CreateDepartmentData | UpdateDepartmentData = isEdit
      ? {
          name: values.name || undefined,
          code: values.code || undefined,
          description: values.description ?? null,
          managerId: values.managerId ?? null,
          costCenter: values.costCenter ?? null,
          isActive: values.isActive
        }
      : {
          name: values.name,
          code: values.code,
          description: values.description || undefined,
          managerId: values.managerId,
          costCenter: values.costCenter
        };

    await onSubmit(payload);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Name</FormLabel>
                <FormControl>
                  <Input placeholder="e.g. Kitchen" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="code"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Code</FormLabel>
                <FormControl>
                  <Input placeholder="e.g. KIT" {...field} onChange={e => field.onChange(normalizeCode(e.target.value))} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="costCenter"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Cost Center</FormLabel>
                <FormControl>
                  <Input placeholder="Optional" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="managerId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Manager</FormLabel>
                <FormControl>
                  <div>
                    <EmployeeSelector compact selectedEmployeeId={field.value ?? undefined} onEmployeeSelect={emp => field.onChange(emp?.id ?? undefined)} placeholder="Select manager (optional)" />
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea placeholder="Describe the department (optional)" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {isEdit && (
          <FormField
            control={form.control}
            name="isActive"
            render={({ field }) => (
              <FormItem className="flex items-center justify-between rounded-lg border p-3">
                <div className="space-y-0.5">
                  <FormLabel>Active</FormLabel>
                  <p className="text-sm text-muted-foreground">Inactive departments will be hidden in most lists.</p>
                </div>
                <FormControl>
                  <Switch checked={!!field.value} onCheckedChange={field.onChange} />
                </FormControl>
              </FormItem>
            )}
          />
        )}

        <div className="flex items-center justify-end gap-2">
          {onCancel && (
            <Button type="button" variant="outline" onClick={onCancel} disabled={submitting}>
              Cancel
            </Button>
          )}
          <Button type="submit" disabled={submitting}>
            {isEdit ? "Save Changes" : "Create Department"}
          </Button>
        </div>
      </form>
    </Form>
  );
};

export default DepartmentForm;

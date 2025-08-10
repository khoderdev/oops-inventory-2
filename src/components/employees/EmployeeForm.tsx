import { userAPI } from "@/api/auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { createEmployeeAtom, employeeFormLoadingAtom, updateEmployeeAtom } from "@/store/employeeAtoms";
import type { User } from "@/types/auth";
import type { CreateEmployeeData, Employee, EmployeeDepartment, UpdateEmployeeData } from "@/types/employee";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAtom } from "jotai";
import { CreditCard, DollarSign, Phone, User as UserIcon } from "lucide-react";
import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

const departments: EmployeeDepartment[] = ["kitchen", "service", "management", "cleaning", "security", "other"];

const employeeSchema = z.object({
  userId: z.number().optional(),
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().optional(),
  phone: z.string().optional(),
  employeeNumber: z.string().optional(),
  department: z.enum(["kitchen", "service", "management", "cleaning", "security", "other"]),
  position: z.string().min(1, "Position is required"),
  baseSalary: z.number().min(0, "Salary must be positive"),
  discountPercentage: z.number().min(0).max(100).optional(),
  hireDate: z.string().min(1, "Hire date is required"),
  isActive: z.boolean().optional(),
  emergencyContactName: z.string().optional(),
  emergencyContactPhone: z.string().optional(),
  emergencyContactRelationship: z.string().optional(),
  emergencyContactAddress: z.string().optional(),
  bankAccountNumber: z.string().optional(),
  bankName: z.string().optional(),
  bankRoutingNumber: z.string().optional(),
  bankAccountHolderName: z.string().optional(),
  notes: z.string().optional()
});

type EmployeeFormData = z.infer<typeof employeeSchema>;

interface EmployeeFormProps {
  open: boolean;
  onClose: () => void;
  employee?: Employee | null;
  mode: "create" | "edit";
}

export const EmployeeForm: React.FC<EmployeeFormProps> = ({ open, onClose, employee, mode }) => {
  const [users, setUsers] = useState<User[]>([]);
  const [, setLoadingUsers] = useState(false);
  const [loading] = useAtom(employeeFormLoadingAtom);
  const [, createEmployee] = useAtom(createEmployeeAtom);
  const [, updateEmployee] = useAtom(updateEmployeeAtom);

  const form = useForm<EmployeeFormData>({
    resolver: zodResolver(employeeSchema),
    defaultValues: {
      userId: undefined,
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      department: "service",
      position: "",
      baseSalary: 0,
      discountPercentage: 0,
      hireDate: new Date().toISOString().split("T")[0],
      isActive: true
    }
  });

  useEffect(() => {
    const loadUsers = async () => {
      try {
        setLoadingUsers(true);
        const response = await userAPI.getAllUsers({ limit: 100 });
        setUsers(response.users);
      } catch (error) {
        console.error("Error loading users:", error);
      } finally {
        setLoadingUsers(false);
      }
    };
    if (open && users.length === 0) {
      loadUsers();
    }
  }, [open, users.length]);

  useEffect(() => {
    if (!open) return;
    if (employee && mode === "edit") {
      form.reset({
        userId: employee.userId || undefined,
        firstName: employee.firstName || "",
        lastName: employee.lastName || "",
        email: employee.email || "",
        phone: employee.phone || "",
        employeeNumber: employee.employeeNumber,
        department: employee.department,
        position: employee.position,
        baseSalary: employee.baseSalary,
        discountPercentage: employee.discountPercentage,
        hireDate: employee.hireDate.split("T")[0],
        isActive: employee.isActive,
        emergencyContactName: employee.emergencyContact?.name || "",
        emergencyContactPhone: employee.emergencyContact?.phone || "",
        emergencyContactRelationship: employee.emergencyContact?.relationship || "",
        emergencyContactAddress: employee.emergencyContact?.address || "",
        bankAccountNumber: employee.bankDetails?.accountNumber || "",
        bankName: employee.bankDetails?.bankName || "",
        bankRoutingNumber: employee.bankDetails?.routingNumber || "",
        bankAccountHolderName: employee.bankDetails?.accountHolderName || "",
        notes: employee.notes || ""
      });
    } else if (mode === "create") {
      form.reset({
        userId: undefined,
        firstName: "",
        lastName: "",
        email: "",
        phone: "",
        employeeNumber: "",
        department: "service",
        position: "",
        baseSalary: 0,
        discountPercentage: 0,
        hireDate: new Date().toISOString().split("T")[0],
        isActive: true,
        emergencyContactName: "",
        emergencyContactPhone: "",
        emergencyContactRelationship: "",
        emergencyContactAddress: "",
        bankAccountNumber: "",
        bankName: "",
        bankRoutingNumber: "",
        bankAccountHolderName: "",
        notes: ""
      });
    }
  }, [open, employee, mode, form]);

  const onSubmit = async (data: EmployeeFormData) => {
    try {
      const formattedData = {
        userId: data.userId || undefined,
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        phone: data.phone,
        employeeNumber: data.employeeNumber,
        department: data.department,
        position: data.position,
        baseSalary: data.baseSalary,
        discountPercentage: data.discountPercentage || 0,
        hireDate: data.hireDate,
        isActive: data.isActive,
        emergencyContact:
          data.emergencyContactName || data.emergencyContactPhone
            ? {
                name: data.emergencyContactName || "",
                phone: data.emergencyContactPhone || "",
                relationship: data.emergencyContactRelationship,
                address: data.emergencyContactAddress
              }
            : undefined,
        bankDetails:
          data.bankAccountNumber || data.bankName
            ? {
                accountNumber: data.bankAccountNumber || "",
                bankName: data.bankName || "",
                routingNumber: data.bankRoutingNumber,
                accountHolderName: data.bankAccountHolderName
              }
            : undefined,
        notes: data.notes
      };
      if (mode === "create") {
        await createEmployee(formattedData as CreateEmployeeData);
      } else if (employee) {
        await updateEmployee({ id: employee.id, data: formattedData as UpdateEmployeeData });
      }
      form.reset();
      onClose();
    } catch (error) {
      console.error("Error saving employee:", error);
    }
  };

  const availableUsers = users.filter(user => (mode === "create" ? true : user.id === employee?.userId || true));

  const handleClose = () => {
    form.reset();
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserIcon className="h-5 w-5" />
            {mode === "create" ? "Add New Employee" : "Edit Employee"}
          </DialogTitle>
          <DialogDescription>{mode === "create" ? "Create a new employee record with their details and settings." : "Update employee information and settings."}</DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <UserIcon className="h-4 w-4 text-muted-foreground" />
                    Basic Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <FormField
                    control={form.control}
                    name="firstName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>First Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter first name" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="lastName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Last Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter last name" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input type="email" placeholder="employee@example.com" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Phone Number</FormLabel>
                        <FormControl>
                          <Input placeholder="+1 (555) 123-4567" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="userId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>User Account (Optional)</FormLabel>
                        <Select onValueChange={value => field.onChange(value === "none" ? undefined : parseInt(value))} value={field.value ? field.value.toString() : "none"} disabled={mode === "edit"}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Link to user account (optional)" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="none">No user account</SelectItem>
                            {availableUsers.map(user => (
                              <SelectItem key={user.id} value={user.id.toString()}>
                                {user.firstName} {user.lastName} ({user.username})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormDescription>Optional: Link this employee to a user account for system access</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="employeeNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Employee Number</FormLabel>
                        <FormControl>
                          <Input placeholder="Auto-generated if empty" {...field} />
                        </FormControl>
                        <FormDescription>Leave empty to auto-generate</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="department"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Department</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select department" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {departments.map(dept => (
                              <SelectItem key={dept} value={dept}>
                                {dept.charAt(0).toUpperCase() + dept.slice(1)}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="position"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Position</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., Head Chef, Waiter, Manager" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="hireDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Hire Date</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {mode === "edit" && (
                    <FormField
                      control={form.control}
                      name="isActive"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                          <div className="space-y-0.5">
                            <FormLabel>Active Status</FormLabel>
                            <FormDescription>Whether the employee is currently active</FormDescription>
                          </div>
                          <FormControl>
                            <Switch checked={field.value} onCheckedChange={field.onChange} />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  )}
                </CardContent>
              </Card>

              {/* Salary & Benefits */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <DollarSign className="h-4 w-4" />
                    Salary & Benefits
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <FormField
                    control={form.control}
                    name="baseSalary"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Base Salary</FormLabel>
                        <FormControl>
                          <Input type="number" step="0.01" placeholder="0.00" {...field} onChange={e => field.onChange(parseFloat(e.target.value) || 0)} />
                        </FormControl>
                        <FormDescription>Monthly base salary amount</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="discountPercentage"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Employee Discount (%)</FormLabel>
                        <FormControl>
                          <Input type="number" min="0" max="100" step="1" placeholder="0" {...field} onChange={e => field.onChange(parseFloat(e.target.value) || 0)} />
                        </FormControl>
                        <FormDescription>Discount percentage for employee purchases</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Phone className="h-4 w-4" />
                  Emergency Contact
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="emergencyContactName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Contact Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Full name" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="emergencyContactPhone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Phone Number</FormLabel>
                        <FormControl>
                          <Input placeholder="+1 (555) 123-4567" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="emergencyContactRelationship"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Relationship</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., Spouse, Parent, Sibling" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="emergencyContactAddress"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Address</FormLabel>
                        <FormControl>
                          <Input placeholder="Full address" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <CreditCard className="h-4 w-4" />
                  Bank Details
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="bankName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Bank Name</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., Chase Bank" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="bankAccountHolderName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Account Holder Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Full name on account" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="bankAccountNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Account Number</FormLabel>
                        <FormControl>
                          <Input placeholder="Account number" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="bankRoutingNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Routing Number</FormLabel>
                        <FormControl>
                          <Input placeholder="9-digit routing number" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Additional Notes</CardTitle>
              </CardHeader>
              <CardContent>
                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Notes</FormLabel>
                      <FormControl>
                        <Textarea placeholder="Any additional notes about the employee..." className="min-h-[100px]" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button type="button" variant="outline" onClick={handleClose}>
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? "Saving..." : mode === "create" ? "Create Employee" : "Update Employee"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

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
import { DollarSign, User as UserIcon } from "lucide-react";
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
  department: z.enum(["kitchen", "service", "management", "cleaning", "security", "other"]),
  position: z.string().min(1, "Position is required"),
  baseSalary: z.number().min(0, "Salary must be positive"),
  discountPercentage: z.number().min(0).max(100).optional(),
  hireDate: z.string().min(1, "Hire date is required"),
  isActive: z.boolean().optional()
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
        department: employee.department,
        position: employee.position,
        baseSalary: employee.baseSalary,
        discountPercentage: employee.discountPercentage,
        hireDate: employee.hireDate.split("T")[0],
        isActive: employee.isActive
      });
    } else if (mode === "create") {
      form.reset({
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
        department: data.department,
        position: data.position,
        baseSalary: data.baseSalary,
        discountPercentage: data.discountPercentage || 0,
        hireDate: data.hireDate,
        isActive: data.isActive
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
            {/* Basic Information Section */}
            <Card>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 py-2">
                  <FormField
                    control={form.control}
                    name="firstName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>First Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter first name" className="h-11" {...field} />
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
                          <Input placeholder="Enter last name" className="h-11" {...field} />
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
                          <Input type="email" placeholder="employee@example.com" className="h-11" {...field} />
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
                          <Input placeholder="+1 (555) 123-4567" className="h-11" {...field} />
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
                          <Input type="date" className="h-11" {...field} />
                        </FormControl>
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
                            <SelectTrigger className="h-11">
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
                          <Input placeholder="e.g., Head Chef, Waiter, Manager" className="h-11" {...field} />
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
                            <SelectTrigger className="h-11">
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
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="isActive"
                    render={({ field }) => (
                      <FormItem className="flex items-center justify-center gap-4">
                        <div>
                          <FormLabel className="text-md">Active</FormLabel>
                        </div>
                        <FormControl>
                          <Switch checked={field.value} onCheckedChange={field.onChange} />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>

                {mode === "edit" && <div className="mt-6"></div>}
              </CardContent>
            </Card>

            {/* Salary & Benefits Section */}
            <Card>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-2">
                  <FormField
                    control={form.control}
                    name="baseSalary"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Base Salary</FormLabel>
                        <FormControl>
                          <Input type="number" step="0.01" placeholder="0.00" className="h-11" {...field} onChange={e => field.onChange(parseFloat(e.target.value) || 0)} />
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
                          <Input type="number" min="0" max="100" step="1" placeholder="0" className="h-11" {...field} onChange={e => field.onChange(parseFloat(e.target.value) || 0)} />
                        </FormControl>
                        <FormDescription>Discount percentage for employee purchases</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </CardContent>
            </Card>

            <div className="flex justify-end gap-3 pt-6 border-t mt-8">
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

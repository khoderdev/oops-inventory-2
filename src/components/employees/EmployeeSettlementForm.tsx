import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { months } from "@/constants/constants";
import { employeesAtom, fetchEmployeesAtom, fetchSettlementsAtom, previewSettlementAtom, settlementFormLoadingAtom, settlementPreviewAtom, settlementPreviewLoadingAtom, settlementsAtom, settlementsErrorAtom } from "@/store/employeeAtoms";
import type { CreateSettlementData, Employee, EmployeeUsageType, SettlementFormProps } from "@/types/employee";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAtom } from "jotai";
import { AlertCircle, Calculator, DollarSign, Eye, FileText, Loader2, Plus, TrendingDown, TrendingUp, User } from "lucide-react";
import React, { useCallback, useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

// Form validation schema
const settlementFormSchema = z.object({
  employeeId: z.number().min(1, "Please select an employee"),
  settlementMonth: z.number().min(1).max(12, "Please select a valid month"),
  settlementYear: z.number().min(2020).max(2030, "Please select a valid year"),
  bonusAmount: z.number().min(0, "Bonus amount must be positive").optional(),
  penaltyAmount: z.number().min(0, "Penalty amount must be positive").optional(),
  notes: z.string().optional()
});

type SettlementFormData = z.infer<typeof settlementFormSchema>;

const usageTypeColors = {
  material: "bg-blue-100 text-blue-800",
  menu_item: "bg-green-100 text-green-800",
  stock_entry: "bg-orange-100 text-orange-800"
};

const currentYear = new Date().getFullYear();
const years = Array.from({ length: 11 }, (_, i) => currentYear - 5 + i);

export const EmployeeSettlementForm: React.FC<SettlementFormProps> = ({ settlement, onSubmit, onCancel, employees = [], onPreview }) => {
  const [allEmployees] = useAtom(employeesAtom);
  const [, fetchEmployees] = useAtom(fetchEmployeesAtom);
  const [formLoading] = useAtom(settlementFormLoadingAtom);
  const [previewLoading] = useAtom(settlementPreviewLoadingAtom);
  const [settlementPreview] = useAtom(settlementPreviewAtom);
  const [error] = useAtom(settlementsErrorAtom);
  const [existingSettlements] = useAtom(settlementsAtom);
  const [, fetchSettlements] = useAtom(fetchSettlementsAtom);

  const [, previewSettlementAction] = useAtom(previewSettlementAtom);

  const [showPreview, setShowPreview] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);

  const employeeList = employees.length > 0 ? employees : allEmployees;

  const form = useForm<SettlementFormData>({
    resolver: zodResolver(settlementFormSchema),
    defaultValues: {
      employeeId: settlement?.employeeId || 0,
      settlementMonth: settlement?.settlementMonth || new Date().getMonth() + 1,
      settlementYear: settlement?.settlementYear || new Date().getFullYear(),
      bonusAmount: settlement?.bonusAmount || 0,
      penaltyAmount: settlement?.penaltyAmount || 0,
      notes: settlement?.notes || ""
    }
  });

  const watchedEmployeeId = form.watch("employeeId");
  const watchedYear = form.watch("settlementYear");

  // Fetch employees data on component mount
  useEffect(() => {
    const loadEmployees = async () => {
      try {
        if (allEmployees.length === 0) {
          await fetchEmployees();
        }
      } catch (error) {
        console.error("Failed to load employees:", error);
      }
    };

    loadEmployees();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Empty dependency array to prevent infinite loops

  // Update selected employee when form changes
  useEffect(() => {
    if (watchedEmployeeId) {
      const employee = employeeList.find(emp => emp.id === watchedEmployeeId);
      setSelectedEmployee(employee || null);
    }
  }, [watchedEmployeeId, employeeList]);

  // Fetch settlements for the selected employee to check for existing settlements
  useEffect(() => {
    const loadEmployeeSettlements = async () => {
      if (watchedEmployeeId) {
        try {
          await fetchSettlements({ employeeId: watchedEmployeeId });
        } catch (error) {
          console.error("Failed to load employee settlements:", error);
        }
      }
    };

    loadEmployeeSettlements();
  }, [watchedEmployeeId, fetchSettlements]);

  // Get used months for the selected employee and year
  const getUsedMonths = useCallback(() => {
    if (!watchedEmployeeId) return [];

    const currentYear = watchedYear || new Date().getFullYear();
    const employeeSettlements = existingSettlements.filter(settlement => settlement.employeeId === watchedEmployeeId && settlement.settlementYear === currentYear);

    return employeeSettlements.map(settlement => settlement.settlementMonth);
  }, [watchedEmployeeId, watchedYear, existingSettlements]);

  // Check if a month is disabled (has existing settlement)
  const isMonthDisabled = useCallback(
    (monthValue: number) => {
      const usedMonths = getUsedMonths();
      const currentSettlementMonth = settlement?.settlementMonth;

      // If we're editing an existing settlement, allow the current month
      if (currentSettlementMonth && monthValue === currentSettlementMonth) {
        return false;
      }

      // Otherwise, disable months that already have settlements
      const isDisabled = usedMonths.includes(monthValue);

      // Debug logging
      if (watchedEmployeeId === 2) {
        console.log(`Month ${monthValue} disabled:`, isDisabled, "Used months:", usedMonths);
      }

      return isDisabled;
    },
    [getUsedMonths, settlement, watchedEmployeeId]
  );

  // Get available months count for display
  const getAvailableMonthsCount = useCallback(() => {
    const usedMonths = getUsedMonths();
    return months.length - usedMonths.length;
  }, [getUsedMonths]);

  // Reset month selection if it becomes unavailable due to existing settlements
  useEffect(() => {
    if (watchedEmployeeId && watchedYear) {
      const currentMonth = form.getValues("settlementMonth");

      // If current month is disabled and we're not editing an existing settlement
      if (currentMonth && isMonthDisabled(currentMonth) && !settlement) {
        form.setValue("settlementMonth", 0); // Reset to no selection
      }
    }
  }, [watchedEmployeeId, watchedYear, existingSettlements, form, settlement, isMonthDisabled]);

  // Handle form submission
  const handleSubmit = async (data: SettlementFormData) => {
    try {
      const settlementData: CreateSettlementData = {
        employeeId: data.employeeId,
        settlementMonth: data.settlementMonth,
        settlementYear: data.settlementYear,
        bonusAmount: data.bonusAmount || 0,
        penaltyAmount: data.penaltyAmount || 0,
        notes: data.notes || ""
      };

      // Let the parent component handle the API call to avoid duplicates
      onSubmit(settlementData);
    } catch (error) {
      console.error("Failed to submit settlement:", error);
    }
  };

  // Handle preview generation
  const handlePreview = async () => {
    const data = form.getValues();

    if (!data.employeeId || !data.settlementMonth || !data.settlementYear) {
      form.trigger(["employeeId", "settlementMonth", "settlementYear"]);
      return;
    }

    try {
      const settlementData: CreateSettlementData = {
        employeeId: data.employeeId,
        settlementMonth: data.settlementMonth,
        settlementYear: data.settlementYear,
        bonusAmount: data.bonusAmount || 0,
        penaltyAmount: data.penaltyAmount || 0,
        notes: data.notes || ""
      };

      await previewSettlementAction(settlementData);
      setShowPreview(true);

      if (onPreview) {
        onPreview(settlementData);
      }
    } catch (error) {
      console.error("Failed to generate preview:", error);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD"
    }).format(amount);
  };

  const getUsageTypeIcon = (type: EmployeeUsageType) => {
    switch (type) {
      case "material":
        return <FileText className="w-4 h-4" />;
      case "menu_item":
        return <DollarSign className="w-4 h-4" />;
      case "stock_entry":
        return <TrendingUp className="w-4 h-4" />;
      default:
        return <FileText className="w-4 h-4" />;
    }
  };

  return (
    <div className="space-y-6">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
          <div className="flex justify-end items-center space-x-2">
            <Button type="button" variant="outline" onClick={handlePreview} disabled={formLoading || previewLoading} className="flex items-center space-x-2">
              {previewLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Eye className="w-4 h-4" />}
              <span>Preview</span>
            </Button>
          </div>

          {/* Error Display */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-center space-x-2">
                <AlertCircle className="w-5 h-5 text-red-600" />
                <p className="text-sm text-red-800">{error}</p>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left Column - Form Fields */}
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <User className="w-5 h-5" />
                    <span>Settlement Details</span>
                  </CardTitle>
                  <CardDescription>Select the employee and settlement period</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Employee Selection */}
                  <FormField
                    control={form.control}
                    name="employeeId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Employee</FormLabel>
                        <Select onValueChange={value => field.onChange(parseInt(value))} value={field.value?.toString() || ""}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select an employee" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {employeeList.map(employee => (
                              <SelectItem key={employee.id} value={employee.id.toString()}>
                                <div className="flex items-center space-x-2">
                                  <span className="font-medium">
                                    {employee.firstName} {employee.lastName}
                                  </span>
                                  <span className="text-sm text-gray-500">({employee.employeeNumber})</span>
                                  <Badge variant="outline" className="text-xs">
                                    {employee.department}
                                  </Badge>
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Selected Employee Info */}
                  {selectedEmployee && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-blue-900">
                            {selectedEmployee.user?.firstName} {selectedEmployee.user?.lastName}
                          </p>
                          <p className="text-sm text-blue-700">
                            {selectedEmployee.position} • {selectedEmployee.department}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-blue-700">Base Salary</p>
                          <p className="font-medium text-blue-900">{formatCurrency(selectedEmployee.baseSalary)}</p>
                        </div>
                      </div>
                      <div className="mt-2 pt-2 border-t border-blue-200">
                        <p className="text-sm text-blue-700">Discount: {selectedEmployee.discountPercentage}%</p>
                      </div>
                    </div>
                  )}

                  {/* Settlement Status Info */}
                  {selectedEmployee && watchedYear && (
                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-900">Settlement Status for {watchedYear}</p>
                          <p className="text-xs text-gray-600">
                            Available months: {getAvailableMonthsCount()} of {months.length}
                          </p>
                        </div>
                        {getAvailableMonthsCount() === 0 && (
                          <div className="flex items-center space-x-1">
                            <AlertCircle className="w-4 h-4 text-amber-500" />
                            <span className="text-xs text-amber-700 font-medium">All months settled</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Settlement Period */}
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="settlementMonth"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Month</FormLabel>
                          <Select onValueChange={value => field.onChange(parseInt(value))} value={field.value?.toString() || ""}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select month" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {months.map(month => (
                                <SelectItem key={month.value} value={month.value.toString()} disabled={isMonthDisabled(month.value)} className={isMonthDisabled(month.value) ? "opacity-50 cursor-not-allowed" : ""}>
                                  <div className="flex items-center justify-between w-full">
                                    <span>{month.label}</span>
                                    {isMonthDisabled(month.value) && <span className="text-xs text-muted-foreground ml-2">(Has settlement)</span>}
                                  </div>
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
                      name="settlementYear"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Year</FormLabel>
                          <Select onValueChange={value => field.onChange(parseInt(value))} value={field.value?.toString() || ""}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select year" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {years.map(year => (
                                <SelectItem key={year} value={year.toString()}>
                                  {year}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Calculator className="w-5 h-5" />
                    <span>Adjustments</span>
                  </CardTitle>
                  <CardDescription>Add bonus or penalty amounts to the settlement</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Bonus and Penalty Amounts - Side by Side */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Bonus Amount */}
                    <FormField
                      control={form.control}
                      name="bonusAmount"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center space-x-2">
                            <TrendingUp className="w-4 h-4 text-green-600" />
                            <span>Bonus Amount</span>
                          </FormLabel>
                          <FormControl>
                            <Input type="number" step="0.01" min="0" placeholder="0.00" {...field} onChange={e => field.onChange(parseFloat(e.target.value) || 0)} />
                          </FormControl>
                          <FormDescription>Additional bonus amount to add to the final salary</FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Penalty Amount */}
                    <FormField
                      control={form.control}
                      name="penaltyAmount"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center space-x-2">
                            <TrendingDown className="w-4 h-4 text-red-600" />
                            <span>Penalty Amount</span>
                          </FormLabel>
                          <FormControl>
                            <Input type="number" step="0.01" min="0" placeholder="0.00" {...field} onChange={e => field.onChange(parseFloat(e.target.value) || 0)} />
                          </FormControl>
                          <FormDescription>Penalty amount to deduct from the final salary</FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* Notes */}
                  <FormField
                    control={form.control}
                    name="notes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Notes</FormLabel>
                        <FormControl>
                          <Textarea placeholder="Add any notes or comments about this settlement..." className="min-h-[100px]" {...field} />
                        </FormControl>
                        <FormDescription>Optional notes about the settlement</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>
            </div>

            {/* Right Column - Preview */}
            <div className="space-y-6">
              {settlementPreview && showPreview && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Eye className="w-5 h-5" />
                      <span>Settlement Preview</span>
                    </CardTitle>
                    <CardDescription>Preview of the settlement calculation</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Employee Info */}
                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-gray-900">{settlementPreview.employee.name}</p>
                          <p className="text-sm text-gray-600">
                            {settlementPreview.employee.employeeNumber} • {settlementPreview.employee.department}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-gray-600">
                            {settlementPreview.period.monthName} {settlementPreview.period.year}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Calculation Summary */}
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Base Salary</span>
                        <span className="font-medium">{formatCurrency(settlementPreview.calculation.baseSalary)}</span>
                      </div>

                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Total Usage Cost</span>
                        <span className="text-red-600">-{formatCurrency(settlementPreview.calculation.totalUsageCost)}</span>
                      </div>

                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Discount ({settlementPreview.employee.discountPercentage}%)</span>
                        <span className="text-green-600">+{formatCurrency(settlementPreview.calculation.totalDiscountAmount)}</span>
                      </div>

                      {settlementPreview.calculation.bonusAmount > 0 && (
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600">Bonus</span>
                          <span className="text-green-600">+{formatCurrency(settlementPreview.calculation.bonusAmount)}</span>
                        </div>
                      )}

                      {settlementPreview.calculation.penaltyAmount > 0 && (
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600">Penalty</span>
                          <span className="text-red-600">-{formatCurrency(settlementPreview.calculation.penaltyAmount)}</span>
                        </div>
                      )}

                      <Separator />

                      <div className="flex justify-between items-center">
                        <span className="font-medium text-gray-900">Final Salary</span>
                        <span className="font-bold text-lg text-green-600">{formatCurrency(settlementPreview.calculation.finalSalary)}</span>
                      </div>
                    </div>

                    {/* Usage Items Count */}
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                      <p className="text-sm text-blue-800">
                        <strong>{settlementPreview.calculation.usageItemsCount}</strong> usage items included in this settlement
                      </p>
                    </div>

                    {/* Usage Breakdown */}
                    {settlementPreview.usages.length > 0 && (
                      <div>
                        <Label className="text-sm font-medium text-gray-700 mb-2 block">Usage Items ({settlementPreview.usages.length})</Label>
                        <div className="max-h-96 overflow-y-auto border rounded-lg">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead className="text-xs">Item</TableHead>
                                <TableHead className="text-xs">Qty</TableHead>
                                <TableHead className="text-xs">Cost</TableHead>
                                <TableHead className="text-xs">Final</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {settlementPreview.usages.map(usage => (
                                <TableRow key={usage.id}>
                                  <TableCell className="py-2">
                                    <div className="flex items-center space-x-2">
                                      {getUsageTypeIcon(usage.usageType)}
                                      <div>
                                        <p className="text-xs font-medium">{usage.itemName}</p>
                                        <Badge variant="outline" className={`text-xs ${usageTypeColors[usage.usageType]}`}>
                                          {usage.usageType.replace("_", " ")}
                                        </Badge>
                                      </div>
                                    </div>
                                  </TableCell>
                                  <TableCell className="py-2 text-xs">
                                    {usage.quantity} {usage.unit}
                                  </TableCell>
                                  <TableCell className="py-2 text-xs">{formatCurrency(usage.totalCost)}</TableCell>
                                  <TableCell className="py-2 text-xs font-medium">{formatCurrency(usage.finalCost)}</TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex items-center justify-end space-x-4 pt-6 border-t">
            <Button type="button" variant="outline" onClick={onCancel} disabled={formLoading}>
              Cancel
            </Button>
            <Button type="submit" disabled={formLoading || previewLoading} className="flex items-center space-x-2">
              {formLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
              <span>{settlement ? "Update Settlement" : "Create Settlement"}</span>
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
};

export default EmployeeSettlementForm;

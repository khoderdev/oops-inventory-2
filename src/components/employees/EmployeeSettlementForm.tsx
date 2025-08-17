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
import { settlementFormSchema } from "./settlementSchema";

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
  const watchedMonth = form.watch("settlementMonth");
  const watchedBonusAmount = form.watch("bonusAmount");
  const watchedPenaltyAmount = form.watch("penaltyAmount");

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
  }, []);

  useEffect(() => {
    if (watchedEmployeeId) {
      const employee = employeeList.find(emp => emp.id === watchedEmployeeId);
      setSelectedEmployee(employee || null);
    }
  }, [watchedEmployeeId, employeeList]);

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

  const getUsedMonths = useCallback(() => {
    if (!watchedEmployeeId) return [];
    const currentYear = watchedYear || new Date().getFullYear();
    const employeeSettlements = existingSettlements.filter(settlement => settlement.employeeId === watchedEmployeeId && settlement.settlementYear === currentYear);
    return employeeSettlements.map(settlement => settlement.settlementMonth);
  }, [watchedEmployeeId, watchedYear, existingSettlements]);

  const isMonthDisabled = useCallback(
    (monthValue: number) => {
      const usedMonths = getUsedMonths();
      const currentSettlementMonth = settlement?.settlementMonth;
      if (currentSettlementMonth && monthValue === currentSettlementMonth) {
        return false;
      }
      const isDisabled = usedMonths.includes(monthValue);
      return isDisabled;
    },
    [getUsedMonths, settlement, watchedEmployeeId]
  );
  const getAvailableMonthsCount = useCallback(() => {
    const usedMonths = getUsedMonths();
    return months.length - usedMonths.length;
  }, [getUsedMonths]);

  useEffect(() => {
    if (watchedEmployeeId && watchedYear) {
      const currentMonth = form.getValues("settlementMonth");
      if (currentMonth && isMonthDisabled(currentMonth) && !settlement) {
        form.setValue("settlementMonth", 0);
      }
    }
  }, [watchedEmployeeId, watchedYear, existingSettlements, form, settlement, isMonthDisabled]);

  useEffect(() => {
    const generateAutoPreview = async () => {
      if (watchedEmployeeId && watchedMonth && watchedYear) {
        try {
          // First ensure all usage for this period is accounted for
          const { ensureUsageInSettlement } = await import("@/utils/employeeUsageUtils");
          const usageCheck = await ensureUsageInSettlement(watchedEmployeeId, watchedMonth, watchedYear);
          const settlementData: CreateSettlementData = {
            employeeId: watchedEmployeeId,
            settlementMonth: watchedMonth,
            settlementYear: watchedYear,
            bonusAmount: watchedBonusAmount || 0,
            penaltyAmount: watchedPenaltyAmount || 0,
            notes: form.getValues("notes") || ""
          };
          await previewSettlementAction(settlementData);
          setShowPreview(true);
          if (onPreview) {
            onPreview(settlementData);
          }
        } catch (error) {
          console.error("Failed to generate auto preview:", error);
        }
      } else {
        setShowPreview(false);
      }
    };
    generateAutoPreview();
  }, [watchedEmployeeId, watchedMonth, watchedYear, watchedBonusAmount, watchedPenaltyAmount, onPreview]);

  const handleSubmit = async (data: SettlementFormData) => {
    try {
      const { ensureUsageInSettlement } = await import("@/utils/employeeUsageUtils");
      const usageCheck = await ensureUsageInSettlement(data.employeeId, data.settlementMonth, data.settlementYear);
      const settlementData: CreateSettlementData = {
        employeeId: data.employeeId,
        settlementMonth: data.settlementMonth,
        settlementYear: data.settlementYear,
        bonusAmount: data.bonusAmount || 0,
        penaltyAmount: data.penaltyAmount || 0,
        notes: data.notes || ""
      };
      onSubmit(settlementData);
    } catch (error) {
      console.error("Failed to submit settlement:", error);
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
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-center space-x-2">
                <AlertCircle className="w-5 h-5 text-red-600" />
                <p className="text-sm text-red-800">{error}</p>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
            <div className="flex flex-col space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <User className="w-5 h-5" />
                    <span>Settlement Details</span>
                  </CardTitle>
                  <CardDescription>Select the employee and settlement period</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
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
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

            <div className="flex flex-col space-y-6 h-full">
              {settlementPreview && showPreview && (
                <Card className="flex-1 flex flex-col">
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Eye className="w-5 h-5" />
                      <span>Settlement Preview</span>
                    </CardTitle>
                    <CardDescription>Preview of the settlement calculation</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4 flex-1">
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

                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                      <p className="text-sm text-blue-800">
                        <strong>{settlementPreview.calculation.usageItemsCount}</strong> usage items included in this settlement
                      </p>
                    </div>

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
                                  <TableCell className="py-2 text-xs">{Number(usage.quantity) % 1 === 0 ? Math.floor(usage.quantity) : usage.quantity.toFixed(2)}</TableCell>
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

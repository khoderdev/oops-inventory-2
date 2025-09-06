import React, { useState } from "react";
import { SupplierPayment } from "@/types/suppliers";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { ChevronDown, MoreHorizontal, Edit, Trash2, Plus, RefreshCw, FileText, Receipt } from "lucide-react";
import { formatDate } from "@/utils/formatDate";
import { formatCurrency } from "@/utils/conversionLogic";
import { PaymentsTableProps } from "@/types/suppliers";
import PaymentForm from "./PaymentForm";

export const PaymentsTable: React.FC<PaymentsTableProps> = ({ payments = [], supplierId, loading = false, onEdit, onDelete, onAdd, onRefresh }) => {
  const [sortConfig, setSortConfig] = useState<{
    key: keyof SupplierPayment;
    direction: "asc" | "desc";
  }>({ key: "paymentDate", direction: "desc" });

  const [showForm, setShowForm] = useState(false);

  // Handle sort
  const handleSort = (key: keyof SupplierPayment) => {
    setSortConfig({
      key,
      direction: sortConfig.key === key && sortConfig.direction === "asc" ? "desc" : "asc"
    });
  };

  // Sort payments
  const sortedPayments = React.useMemo(() => {
    return [...payments].sort((a, b) => {
      if (a[sortConfig.key] === null) return 1;
      if (b[sortConfig.key] === null) return -1;

      if (a[sortConfig.key] < b[sortConfig.key]) {
        return sortConfig.direction === "asc" ? -1 : 1;
      }
      if (a[sortConfig.key] > b[sortConfig.key]) {
        return sortConfig.direction === "asc" ? 1 : -1;
      }
      return 0;
    });
  }, [payments, sortConfig]);

  const getStatusBadge = (payment: SupplierPayment) => {
    switch (payment.status) {
      case "Completed":
        return <Badge variant="default">Completed</Badge>;
      case "Pending":
        return <Badge variant="outline">Pending</Badge>;
      case "Failed":
        return <Badge variant="destructive">Failed</Badge>;
      case "Refunded":
        return <Badge variant="secondary">Refunded</Badge>;
      default:
        return <Badge variant="outline">{payment.status}</Badge>;
    }
  };
  return (
    <div className="space-y-3 sm:space-y-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-0">
        <h3 className="text-base sm:text-lg font-medium">Payment History</h3>
        <div className="flex gap-2 w-full sm:w-auto">
          {onRefresh && (
            <Button variant="outline" size="sm" onClick={onRefresh} disabled={loading} className="flex-1 sm:flex-initial">
              <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            </Button>
          )}
          <Button size="sm" onClick={() => setShowForm(true)} className="flex-1 sm:flex-initial">
            <Plus className="h-4 w-4 mr-0 sm:mr-1" />
            <span className="hidden sm:inline">New Payment</span>
            <span className="sm:hidden">Add</span>
          </Button>
        </div>
      </div>

      {showForm && (
        <div className="border p-3 sm:p-4 rounded-md bg-muted/30">
          <PaymentForm
            supplierId={supplierId}
            onSuccess={() => {
              setShowForm(false);
              onAdd?.();
            }}
            onCancel={() => setShowForm(false)}
          />
        </div>
      )}

      <div className="rounded-md border overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="cursor-pointer whitespace-nowrap px-3 sm:px-4" onClick={() => handleSort("paymentDate")}>
                Date {sortConfig.key === "paymentDate" && <ChevronDown className={`inline h-3 w-3 sm:h-4 sm:w-4 transition-transform ${sortConfig.direction === "desc" ? "rotate-180" : ""}`} />}
              </TableHead>
              <TableHead className="cursor-pointer whitespace-nowrap px-3 sm:px-4" onClick={() => handleSort("amount")}>
                Amount {sortConfig.key === "amount" && <ChevronDown className={`inline h-3 w-3 sm:h-4 sm:w-4 transition-transform ${sortConfig.direction === "desc" ? "rotate-180" : ""}`} />}
              </TableHead>
              <TableHead className="whitespace-nowrap px-3 sm:px-4">Status</TableHead>
              <TableHead className="whitespace-nowrap px-3 sm:px-4 hidden sm:table-cell">Reference</TableHead>
              <TableHead className="whitespace-nowrap px-3 sm:px-4 hidden md:table-cell">Notes</TableHead>
              <TableHead className="text-right whitespace-nowrap px-3 sm:px-4">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-6 sm:py-8 px-3 sm:px-4">
                  <div className="flex items-center justify-center">
                    <RefreshCw className="h-5 w-5 mr-2 animate-spin" />
                    Loading payments...
                  </div>
                </TableCell>
              </TableRow>
            ) : sortedPayments.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-6 sm:py-8 px-3 sm:px-4">
                  No payment records found.
                </TableCell>
              </TableRow>
            ) : (
              sortedPayments.map(payment => (
                <TableRow key={payment.id} className="hover:bg-muted/50">
                  <TableCell className="px-3 sm:px-4 py-2 sm:py-3 whitespace-nowrap">{payment.paymentDate && formatDate(payment.paymentDate)}</TableCell>
                  <TableCell className="px-3 sm:px-4 py-2 sm:py-3 font-medium whitespace-nowrap">{formatCurrency(payment.amount)}</TableCell>
                  <TableCell className="px-3 sm:px-4 py-2 sm:py-3">{getStatusBadge(payment)}</TableCell>
                  <TableCell className="px-3 sm:px-4 py-2 sm:py-3 hidden sm:table-cell">
                    {payment.referenceNumber ? (
                      <div className="flex items-center">
                        <Receipt className="h-3 w-3 mr-1 flex-shrink-0" />
                        <span className="truncate max-w-[100px] sm:max-w-[120px]">{payment.referenceNumber}</span>
                      </div>
                    ) : (
                      "-"
                    )}
                  </TableCell>
                  <TableCell className="px-3 sm:px-4 py-2 sm:py-3 hidden md:table-cell">
                    {payment.description ? (
                      <div className="flex items-center">
                        <FileText className="h-3 w-3 mr-1 flex-shrink-0" />
                        <span className="truncate max-w-[150px]">{payment.description}</span>
                      </div>
                    ) : (
                      "-"
                    )}
                  </TableCell>
                  <TableCell className="px-3 sm:px-4 py-2 sm:py-3 text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-40">
                        {onEdit && (
                          <DropdownMenuItem onClick={() => onEdit(payment)} className="cursor-pointer">
                            <Edit className="mr-2 h-4 w-4" />
                            <span>Edit</span>
                          </DropdownMenuItem>
                        )}
                        {onDelete && (
                          <DropdownMenuItem onClick={() => onDelete(payment)} className="cursor-pointer text-destructive">
                            <Trash2 className="mr-2 h-4 w-4" />
                            <span>Delete</span>
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default PaymentsTable;

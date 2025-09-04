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
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Payment History</h3>
        <div className="flex gap-2">
          {onRefresh && (
            <Button variant="outline" size="sm" onClick={onRefresh} disabled={loading}>
              <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            </Button>
          )}
          <Button size="sm" onClick={() => setShowForm(true)}>
            <Plus className="h-4 w-4 mr-1" /> New Payment
          </Button>
        </div>
      </div>

      {showForm && (
        <div className="border p-4 rounded-md bg-muted/30">
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

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="cursor-pointer" onClick={() => handleSort("paymentDate")}>
                Date {sortConfig.key === "paymentDate" && <ChevronDown className={`inline h-4 w-4 transition-transform ${sortConfig.direction === "desc" ? "rotate-180" : ""}`} />}
              </TableHead>
              <TableHead className="cursor-pointer" onClick={() => handleSort("amount")}>
                Amount {sortConfig.key === "amount" && <ChevronDown className={`inline h-4 w-4 transition-transform ${sortConfig.direction === "desc" ? "rotate-180" : ""}`} />}
              </TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Reference</TableHead>
              <TableHead>Notes</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8">
                  Loading payments...
                </TableCell>
              </TableRow>
            ) : sortedPayments.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8">
                  No payment records found.
                </TableCell>
              </TableRow>
            ) : (
              sortedPayments.map(payment => (
                <TableRow key={payment.id}>
                  <TableCell>{payment.paymentDate && formatDate(payment.paymentDate)}</TableCell>
                  <TableCell className="font-medium">{formatCurrency(payment.amount)}</TableCell>
                  <TableCell>{getStatusBadge(payment)}</TableCell>
                  <TableCell>
                    {payment.referenceNumber ? (
                      <div className="flex items-center">
                        <Receipt className="h-3 w-3 mr-1" />
                        {payment.referenceNumber}
                      </div>
                    ) : (
                      "-"
                    )}
                  </TableCell>
                  <TableCell>
                    {payment.description ? (
                      <div className="flex items-center">
                        <FileText className="h-3 w-3 mr-1" />
                        <span className="truncate max-w-[200px]">{payment.description}</span>
                      </div>
                    ) : (
                      "-"
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        {onEdit && (
                          <DropdownMenuItem onClick={() => onEdit(payment)}>
                            <Edit className="mr-2 h-4 w-4" /> Edit
                          </DropdownMenuItem>
                        )}
                        {onDelete && (
                          <DropdownMenuItem onClick={() => onDelete(payment)} className="text-destructive">
                            <Trash2 className="mr-2 h-4 w-4" /> Delete
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

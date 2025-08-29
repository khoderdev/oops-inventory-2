import { format, isValid } from "date-fns";
import { useOutstandingInvoices } from "@/hooks/useSuppliers";
import { Link } from "react-router-dom";
import { DollarSign, FileText, X } from "lucide-react";
import { useMemo, useState } from "react";
import { useReactTable, getCoreRowModel, createColumnHelper, ColumnDef } from "@tanstack/react-table";
import { TanStackTable } from "@/components/ui/TanStackTable";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";

interface SupplierInvoice {
  id: string | number;
  invoiceNumber: string;
  issueDate: string;
  dueDate: string;
  totalAmount: string;
  amountPaid: string;
  amountDue: string;
  supplierId?: string | number;
  status?: string;
}

const formatDateSafe = (dateString: string, formatStr: string) => {
  if (!dateString) return '-';
  const date = new Date(dateString);
  return isValid(date) ? format(date, formatStr) : '-';
};

export function OutstandingInvoices({ supplierId }: { supplierId: string | number }) {
  const { data: outstandingInvoices = [], isLoading } = useOutstandingInvoices(supplierId);
  const [selectedInvoice, setSelectedInvoice] = useState<SupplierInvoice | null>(null);
  const columns = useMemo<ColumnDef<SupplierInvoice>[]>(
    () => [
      {
        accessorKey: "invoiceNumber",
        header: "Invoice #",
        cell: info => (
          <div className="flex items-center">
            <FileText className="mr-2 h-4 w-4 text-muted-foreground" />
            <span className="font-medium">{info.getValue() as string}</span>
          </div>
        ),
        size: 150
      },
      {
        accessorKey: "issueDate",
        header: "Issued",
        cell: info => {
          const date = info.getValue() as string;
          if (!date) return "-"; // Return dash for null/undefined/empty
          try {
            const dateObj = new Date(date);
            return isNaN(dateObj.getTime()) ? "-" : format(dateObj, "MMM d, yyyy");
          } catch (e) {
            return "-";
          }
        },
        size: 120
      },
      {
        accessorKey: "dueDate",
        header: "Due",
        cell: info => {
          const date = info.getValue() as string;
          if (!date) return "-";
          try {
            const dateObj = new Date(date);
            return isNaN(dateObj.getTime()) ? "-" : format(dateObj, "MMM d, yyyy");
          } catch (e) {
            return "-";
          }
        },
        size: 120
      },
      {
        accessorKey: "totalAmount",
        header: "Total",
        cell: info => (
          <div className="font-medium">
            {new Intl.NumberFormat("en-US", {
              style: "currency",
              currency: "USD"
            }).format(parseFloat(info.getValue() as string))}
          </div>
        ),
        size: 120
      },
      {
        accessorKey: "amountPaid",
        header: "Paid",
        cell: info =>
          new Intl.NumberFormat("en-US", {
            style: "currency",
            currency: "USD"
          }).format(parseFloat((info.getValue() as string) || "0")),
        size: 120
      },
      {
        accessorKey: "amountDue",
        header: "Balance",
        cell: info => (
          <div className="font-medium">
            {new Intl.NumberFormat("en-US", {
              style: "currency",
              currency: "USD"
            }).format(parseFloat(info.getValue() as string))}
          </div>
        ),
        size: 120
      },
      {
        id: "actions",
        cell: ({ row }) => (
          <div className="flex justify-end">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSelectedInvoice(row.original)}
              className="text-primary hover:bg-primary/10 h-8 px-2"
            >
              View
            </Button>
          </div>
        ),
        size: 80
      }
    ],
    []
  );

  const table = useReactTable({
    data: outstandingInvoices,
    columns,
    getCoreRowModel: getCoreRowModel()
  });

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (!outstandingInvoices || outstandingInvoices.length === 0) {
    return (
      <div className="text-center py-8">
        <DollarSign className="mx-auto h-8 w-8 text-muted-foreground" />
        <h3 className="mt-2 text-sm font-medium">No outstanding invoices</h3>
        <p className="mt-1 text-sm text-muted-foreground">This supplier doesn't have any unpaid invoices.</p>
      </div>
    );
  }

  const formatCurrency = (amount: string | number) => {
    const num = typeof amount === 'string' ? parseFloat(amount) : amount;
    if (isNaN(num)) return '$0.00';
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD"
    }).format(num);
  };

  return (
    <div className="space-y-4">
      {/* Invoice Details Dialog */}
      <Dialog open={!!selectedInvoice} onOpenChange={(open) => !open && setSelectedInvoice(null)}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <DialogTitle>Invoice Details</DialogTitle>
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => setSelectedInvoice(null)}
                className="h-8 w-8 p-0"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </DialogHeader>
          
          {selectedInvoice && (
            <div className="space-y-6 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Invoice #</p>
                  <p className="font-medium">{selectedInvoice.invoiceNumber}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Status</p>
                  <Badge variant={parseFloat(selectedInvoice.amountDue) > 0 ? "outline" : "default"}>
                    {parseFloat(selectedInvoice.amountDue) > 0 ? "Unpaid" : "Paid"}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Issued</p>
                  <p>{formatDateSafe(selectedInvoice.issueDate, "MMM d, yyyy")}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Due</p>
                  <p>{formatDateSafe(selectedInvoice.dueDate, "MMM d, yyyy")}</p>
                </div>
              </div>

              <div className="rounded-md border">
                <div className="grid grid-cols-3 border-b p-4 font-medium">
                  <div>Description</div>
                  <div className="text-right">Amount</div>
                </div>
                <div className="p-4">
                  <div className="grid grid-cols-3 py-2">
                    <div>Invoice Total</div>
                    <div className="text-right">{formatCurrency(selectedInvoice.totalAmount || '0')}</div>
                  </div>
                  <div className="grid grid-cols-3 py-2">
                    <div>Amount Paid</div>
                    <div className="text-right">{formatCurrency(selectedInvoice.amountPaid || '0')}</div>
                  </div>
                  <div className="grid grid-cols-3 py-2 font-semibold">
                    <div>Balance Due</div>
                    <div className="text-right">{
                      formatCurrency(
                        (parseFloat(selectedInvoice.totalAmount || '0') - 
                         parseFloat(selectedInvoice.amountPaid || '0')).toString()
                      )
                    }</div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <Button variant="outline" onClick={() => setSelectedInvoice(null)}>
                  Close
                </Button>
                <Button asChild>
                  <Link to={`/suppliers/${supplierId}/settlements/new?invoiceId=${selectedInvoice.id}`}>
                    Record Payment
                  </Link>
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium">Outstanding Invoices</h3>
        <Link to={`/suppliers/${supplierId}/settlements/new`} className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90">
          Record Payment
        </Link>
      </div>

      <TanStackTable
        table={table}
        emptyMessage="No outstanding invoices found"
        maxHeight="calc(100vh - 300px)"
        stickyHeader
        showSortIcons
        customHeaderAlignment={{
          totalAmount: "right",
          amountPaid: "right",
          amountDue: "right",
          actions: "right"
        }}
        customCellAlignment={{
          totalAmount: "right",
          amountPaid: "right",
          amountDue: "right",
          actions: "right"
        }}
      />
    </div>
  );
}

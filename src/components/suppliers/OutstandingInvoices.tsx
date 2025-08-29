import { DataTable } from "@/components/ui/data-table";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { useOutstandingInvoices } from "@/hooks/useSuppliers";
import { Link } from "react-router-dom";
import { DollarSign, FileText, Calendar as CalendarIcon } from "lucide-react";

export function OutstandingInvoices({ supplierId }: { supplierId: string | number }) {
  const { data: outstandingInvoices, isLoading } = useOutstandingInvoices(supplierId);

  const columns = [
    {
      accessorKey: "invoiceNumber",
      header: "Invoice #",
      cell: ({ row }: any) => (
        <div className="flex items-center">
          <FileText className="mr-2 h-4 w-4 text-muted-foreground" />
          <span className="font-medium">{row.original.invoiceNumber}</span>
        </div>
      ),
    },
    {
      accessorKey: "issueDate",
      header: "Issued",
      cell: ({ row }: any) => format(new Date(row.original.issueDate), "MMM d, yyyy"),
    },
    {
      accessorKey: "dueDate",
      header: "Due",
      cell: ({ row }: any) => format(new Date(row.original.dueDate), "MMM d, yyyy"),
    },
    {
      accessorKey: "totalAmount",
      header: "Total",
      cell: ({ row }: any) => (
        <div className="font-medium">
          {new Intl.NumberFormat("en-US", {
            style: "currency",
            currency: "USD",
          }).format(parseFloat(row.original.totalAmount))}
        </div>
      ),
    },
    {
      accessorKey: "amountPaid",
      header: "Paid",
      cell: ({ row }: any) =>
        new Intl.NumberFormat("en-US", {
          style: "currency",
          currency: "USD",
        }).format(parseFloat(row.original.amountPaid || 0)),
    },
    {
      accessorKey: "amountDue",
      header: "Balance",
      cell: ({ row }: any) => (
        <div className="font-medium">
          {new Intl.NumberFormat("en-US", {
            style: "currency",
            currency: "USD",
          }).format(parseFloat(row.original.amountDue))}
        </div>
      ),
    },
    {
      id: "actions",
      cell: ({ row }: any) => (
        <Button variant="ghost" size="sm" asChild>
          <Link to={`/invoices/${row.original.id}`}>View</Link>
        </Button>
      ),
    },
  ];

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (!outstandingInvoices || outstandingInvoices.length === 0) {
    return (
      <div className="text-center py-8">
        <DollarSign className="mx-auto h-8 w-8 text-muted-foreground" />
        <h3 className="mt-2 text-sm font-medium">No outstanding invoices</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          This supplier doesn't have any unpaid invoices.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium">Outstanding Invoices</h3>
        <Button asChild>
          <Link to={`/suppliers/${supplierId}/settlements/new`}>
            Record Payment
          </Link>
        </Button>
      </div>

      <DataTable
        columns={columns}
        data={outstandingInvoices}
        isLoading={isLoading}
        pagination={{
          pageIndex: 0,
          pageSize: 10,
        }}
        onPaginationChange={() => {}}
      />
    </div>
  );
}

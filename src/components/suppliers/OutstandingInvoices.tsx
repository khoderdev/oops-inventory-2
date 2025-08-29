import { format } from "date-fns";
import { useOutstandingInvoices } from "@/hooks/useSuppliers";
import { Link } from "react-router-dom";
import { DollarSign, FileText } from "lucide-react";
import { useMemo } from "react";
import { useReactTable, getCoreRowModel, createColumnHelper, ColumnDef } from "@tanstack/react-table";
import { TanStackTable } from "@/components/ui/TanStackTable";

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

const columnHelper = createColumnHelper<SupplierInvoice>();

export function OutstandingInvoices({ supplierId }: { supplierId: string | number }) {
  const { data: outstandingInvoices = [], isLoading } = useOutstandingInvoices(supplierId);

  const columns = useMemo<ColumnDef<SupplierInvoice>[]>(() => [
    {
      accessorKey: "invoiceNumber",
      header: "Invoice #",
      cell: (info) => (
        <div className="flex items-center">
          <FileText className="mr-2 h-4 w-4 text-muted-foreground" />
          <span className="font-medium">{info.getValue() as string}</span>
        </div>
      ),
      size: 150,
    },
    {
      accessorKey: "issueDate",
      header: "Issued",
      cell: (info) => format(new Date(info.getValue() as string), "MMM d, yyyy"),
      size: 120,
    },
    {
      accessorKey: "dueDate",
      header: "Due",
      cell: (info) => format(new Date(info.getValue() as string), "MMM d, yyyy"),
      size: 120,
    },
    {
      accessorKey: "totalAmount",
      header: "Total",
      cell: (info) => (
        <div className="font-medium">
          {new Intl.NumberFormat("en-US", {
            style: "currency",
            currency: "USD",
          }).format(parseFloat(info.getValue() as string))}
        </div>
      ),
      size: 120,
    },
    {
      accessorKey: "amountPaid",
      header: "Paid",
      cell: (info) =>
        new Intl.NumberFormat("en-US", {
          style: "currency",
          currency: "USD",
        }).format(parseFloat((info.getValue() as string) || "0")),
      size: 120,
    },
    {
      accessorKey: "amountDue",
      header: "Balance",
      cell: (info) => (
        <div className="font-medium">
          {new Intl.NumberFormat("en-US", {
            style: "currency",
            currency: "USD",
          }).format(parseFloat(info.getValue() as string))}
        </div>
      ),
      size: 120,
    },
    {
      id: "actions",
      cell: ({ row }) => (
        <div className="flex justify-end">
          <Link
            to={`/invoices/${row.original.id}`}
            className="text-sm font-medium text-primary hover:underline"
          >
            View
          </Link>
        </div>
      ),
      size: 80,
    },
  ], []);

  const table = useReactTable({
    data: outstandingInvoices,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

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
        <Link
          to={`/suppliers/${supplierId}/settlements/new`}
          className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90"
        >
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
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { TanStackTable } from "@/components/ui/TanStackTable";
import { useSupplierSettlements } from "@/hooks/useSuppliers";
import { format } from "date-fns";
import { Plus } from "lucide-react";
import { useReactTable, getCoreRowModel, getPaginationRowModel, ColumnDef } from "@tanstack/react-table";
import { SupplierSettlement } from "@/types/supplier";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { SettlementForm } from "./SettlementForm";
import { useToast } from "@/components/ui/use-toast";

interface SettlementListProps {
  supplierId?: string | number;
  supplierName?: string;
  onSettlementCreated?: () => void;
}

export function SettlementList({ supplierId, supplierName, onSettlementCreated }: SettlementListProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { toast } = useToast();

  const {
    data: response,
    isLoading,
    error,
    refetch
  } = useSupplierSettlements(supplierId, {
    page: 1,
    limit: 100,
    ...(supplierId && { supplierId })
  });

  const settlements = response?.data?.data || [];

  const handleSuccess = () => {
    setIsDialogOpen(false);
    refetch();
    if (onSettlementCreated) {
      onSettlementCreated();
    }
    toast({
      title: "Success",
      description: supplierId ? "Settlement created successfully" : "Settlement created successfully",
      variant: "default"
    });
  };

  const columns = useMemo<ColumnDef<SupplierSettlement>[]>(
    () => [
      {
        accessorKey: "id",
        header: "ID",
        size: 80
      },
      {
        accessorKey: "supplierName",
        header: "Supplier",
        cell: ({ row }) => row.original.supplier?.name || "N/A",
        size: 200
      },
      {
        accessorKey: "paymentMethod",
        header: "Method",
        size: 120,
        cell: ({ row }) => <span className="capitalize">{String(row.original.paymentMethod).toLowerCase()}</span>
      },
      {
        accessorKey: "paymentDate",
        header: "Date",
        cell: ({ row }) => formatDate(row.original.paymentDate),
        size: 150
      },
      {
        accessorKey: "referenceNumber",
        header: "Reference",
        size: 150
      },
      {
        accessorKey: "amount",
        header: "Amount",
        cell: ({ row }) => formatCurrency(row.original.amount),
        size: 120
      }
    ],
    []
  );

  const table = useReactTable({
    data: settlements,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: {
      pagination: {
        pageSize: 10
      }
    }
  });

  if (error) {
    return <div className="p-4 text-red-500">Error loading settlements: {error.message}</div>;
  }

  if (isLoading) {
    return (
      <div className="p-4 flex items-center justify-center h-40">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
        <span className="ml-2">Loading settlements...</span>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium">
          {supplierId ? "Payment Settlements" : "All Payment Settlements"}
          {supplierName && ` - ${supplierName}`}
        </h3>
        <Button onClick={() => setIsDialogOpen(true)} disabled={!supplierId} title={!supplierId ? "Please select a supplier first" : ""}>
          <Plus className="mr-2 h-4 w-4" />
          New Settlement
        </Button>
      </div>

      <TanStackTable
        table={table}
        className="w-full"
        onRowClick={row => {
          console.log("Row clicked:", row.original);
        }}
      />

      {supplierId && (
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>New Payment Settlement</DialogTitle>
              {supplierName && <p className="text-sm text-muted-foreground">For {supplierName}</p>}
            </DialogHeader>
            <div className="py-4">
              <SettlementForm supplierId={Number(supplierId)} onSuccess={handleSuccess} />
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

// Format date for display
const formatDate = (dateString: string) => {
  try {
    return format(new Date(dateString), "MMM d, yyyy");
  } catch (error) {
    return "Invalid date";
  }
};

// Format currency for display
const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD"
  }).format(amount);
};

// Export the columns separately if needed elsewhere
export const settlementColumns = [
  {
    accessorKey: "id",
    header: "ID"
  },
  {
    accessorKey: "supplierName",
    header: "Supplier",
    cell: ({ row }: any) => row.original.supplier?.name || "N/A"
  },
  {
    accessorKey: "amount",
    header: "Amount",
    cell: ({ row }: any) => formatCurrency(row.original.amount)
  },
  {
    accessorKey: "paymentMethod",
    header: "Method",
    cell: ({ row }: any) => String(row.original.paymentMethod).charAt(0).toUpperCase() + String(row.original.paymentMethod).slice(1).toLowerCase()
  },
  {
    accessorKey: "paymentDate",
    header: "Date",
    cell: ({ row }: any) => formatDate(row.original.paymentDate)
  },
  {
    accessorKey: "referenceNumber",
    header: "Reference"
  }
];

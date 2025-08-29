import { useMemo, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { TanStackTable } from "@/components/ui/TanStackTable";
import { useSupplierSettlements } from "@/hooks/useSuppliers";
import { format } from "date-fns";
import { Plus } from "lucide-react";
import { useReactTable, getCoreRowModel, getPaginationRowModel, ColumnDef, Row } from "@tanstack/react-table";
import { SupplierSettlement } from "@/types/supplier";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { SettlementForm } from "./SettlementForm";
import { useToast } from "@/components/ui/use-toast";

// Extend the SupplierSettlement type with formatted fields
interface FormattedSettlement extends SupplierSettlement {
  formattedDate: string;
  formattedAmount: string;
  formattedMethod: string;
}

interface SettlementListProps {
  supplierId?: string | number;
  supplierName?: string;
  onSettlementCreated?: () => void;
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

  // Memoize the formatted settlements data with proper null checks
  const formattedSettlements = useMemo<FormattedSettlement[]>(() => {
    // Return empty array if no data is available yet
    if (!response?.data?.data || !Array.isArray(response.data.data)) {
      return [];
    }
    
    return response.data.data.map(settlement => {
      // Add null checks for required fields
      if (!settlement) return null;
      
      return {
        ...settlement,
        formattedDate: settlement.paymentDate ? formatDate(settlement.paymentDate) : 'N/A',
        formattedAmount: typeof settlement.amount === 'number' ? formatCurrency(settlement.amount) : 'N/A',
        formattedMethod: settlement.paymentMethod || 'N/A',
        // Ensure all required SupplierSettlement properties are included with defaults
        id: settlement.id || 0,
        supplierId: settlement.supplierId || 0,
        amount: typeof settlement.amount === 'number' ? settlement.amount : 0,
        paymentDate: settlement.paymentDate || new Date().toISOString(),
        paymentMethod: settlement.paymentMethod || 'N/A',
        referenceNumber: settlement.referenceNumber || '',
        createdAt: settlement.createdAt || new Date().toISOString(),
        updatedAt: settlement.updatedAt || new Date().toISOString()
      };
    }).filter(Boolean) as FormattedSettlement[]; // Filter out any null entries
  }, [response?.data?.data]);

  // Memoize the success handler
  const handleSuccess = useCallback(() => {
    setIsDialogOpen(false);
    refetch();
    onSettlementCreated?.();
    toast({
      title: "Success",
      description: "Settlement created successfully",
      variant: "default"
    });
  }, [refetch, onSettlementCreated, toast]);

  // Memoize the columns definition
  const columns = useMemo<ColumnDef<FormattedSettlement>[]>(
    () => [
      {
        accessorKey: "referenceNumber",
        header: "Reference #",
        size: 150
      },
      {
        accessorKey: "paymentDate",
        header: "Date",
        cell: (info) => {
          const row = info.row.original;
          return row.formattedDate;
        },
        size: 120
      },
      {
        accessorKey: "amount",
        header: "Amount",
        cell: (info) => {
          const row = info.row.original;
          return row.formattedAmount;
        },
        size: 120
      },
      {
        accessorKey: "paymentMethod",
        header: "Method",
        cell: (info) => {
          const row = info.row.original;
          return row.formattedMethod;
        },
        size: 100
      },
      {
        accessorKey: "notes",
        header: "Notes",
        size: 200
      }
    ],
    []
  );

  // Memoize the table instance
  const tableData = useMemo(() => Array.isArray(formattedSettlements) ? formattedSettlements : [], [formattedSettlements]);
  const table = useReactTable({
    data: tableData,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: {
      pagination: {
        pageSize: 10
      }
    }
  });

  // Memoize dialog content to prevent unnecessary re-renders
  const dialogContent = useMemo(() => {
    if (!supplierId) return null;
    
    return (
      <DialogContent className="sm:max-w-[90vw]">
        <DialogHeader>
          <DialogTitle>New Payment Settlement</DialogTitle>
          {supplierName && <p className="text-sm text-muted-foreground">For {supplierName}</p>}
        </DialogHeader>
        <div className="py-4">
          <SettlementForm 
            key={supplierId} 
            supplierId={Number(supplierId)} 
            onSuccess={handleSuccess} 
          />
        </div>
      </DialogContent>
    );
  }, [supplierId, supplierName, handleSuccess]);

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
        <Button 
          onClick={() => setIsDialogOpen(true)} 
          disabled={!supplierId} 
          title={!supplierId ? "Please select a supplier first" : ""}
        >
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
        <Dialog 
          open={!!supplierId && isDialogOpen} 
          onOpenChange={setIsDialogOpen}
        >
          {dialogContent}
        </Dialog>
      )}
    </div>
  );
}

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

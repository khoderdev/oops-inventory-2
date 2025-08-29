import { useMemo, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { TanStackTable } from "@/components/ui/TanStackTable";
import { useCreateSettlement, useOutstandingInvoices, useSupplierSettlements } from "@/hooks/useSuppliers";
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
  const [selectedSupplierId, setSelectedSupplierId] = useState<string | number | undefined>(supplierId);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const createSettlement = useCreateSettlement();

  // Fetch outstanding invoices for the selected supplier
  const { data: outstandingInvoices, refetch: refetchInvoices } = useOutstandingInvoices(selectedSupplierId?.toString() || "");

  const {
    data: response,
    isLoading,
    error,
    refetch
  } = useSupplierSettlements(supplierId || "", {
    page: 1,
    limit: 100,
    sortBy: "paymentDate",
    sortOrder: "DESC"
  });

  // Memoize the formatted settlements data with proper null checks
  const formattedSettlements = useMemo<FormattedSettlement[]>(() => {
    // Return empty array if no data is available yet
    if (!response?.data?.data || !Array.isArray(response.data.data)) {
      return [];
    }

    return response.data.data
      .map(settlement => {
        // Add null checks for required fields
        if (!settlement) return null;

        return {
          ...settlement,
          formattedDate: settlement.paymentDate ? formatDate(settlement.paymentDate) : "N/A",
          formattedAmount: typeof settlement.amount === "number" ? formatCurrency(settlement.amount) : "N/A",
          formattedMethod: settlement.paymentMethod || "N/A",
          // Ensure all required SupplierSettlement properties are included with defaults
          id: settlement.id || 0,
          supplierId: settlement.supplierId || 0,
          amount: typeof settlement.amount === "number" ? settlement.amount : 0,
          paymentDate: settlement.paymentDate || new Date().toISOString(),
          paymentMethod: settlement.paymentMethod || "N/A",
          referenceNumber: settlement.referenceNumber || "",
          createdAt: settlement.createdAt || new Date().toISOString(),
          updatedAt: settlement.updatedAt || new Date().toISOString()
        };
      })
      .filter(Boolean) as FormattedSettlement[]; // Filter out any null entries
  }, [response?.data?.data]);

  // Memoize the success handler
  const handleSuccess = useCallback(() => {
    console.log("Settlement created successfully, refreshing data...");
    setIsDialogOpen(false);
    refetch().catch(err => {
      console.error("Error refetching settlements:", err);
    });
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
        cell: info => {
          const row = info.row.original;
          return row.formattedDate;
        },
        size: 120
      },
      {
        accessorKey: "amount",
        header: "Amount",
        cell: info => {
          const row = info.row.original;
          return row.formattedAmount;
        },
        size: 120
      },
      {
        accessorKey: "paymentMethod",
        header: "Method",
        cell: info => {
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
  const tableData = useMemo(() => (Array.isArray(formattedSettlements) ? formattedSettlements : []), [formattedSettlements]);
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

  const handleSubmit = async (data: any) => {
    try {
      setIsSubmitting(true);
      // Convert string values to numbers where needed
      const submissionData = {
        ...data,
        amount: parseFloat(data.amount),
        supplierId: Number(selectedSupplierId),
        invoiceIds: data.invoiceIds?.map((id: string) => Number(id)) || []
      };

      await createSettlement.mutateAsync(submissionData);

      toast({
        title: "Success",
        description: "Settlement created successfully",
        variant: "default"
      });

      setIsDialogOpen(false);
      refetch();
      onSettlementCreated?.();
    } catch (error) {
      console.error("Error creating settlement:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create settlement",
        variant: "destructive"
      });
      throw error;
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDebugForm = () => {
    console.log("=== Form Debug Info ===");
    console.log("1. Selected supplier ID:", selectedSupplierId);
    console.log("2. Outstanding invoices:", outstandingInvoices);
  };

  // Memoize dialog content to prevent unnecessary re-renders
  const dialogContent = useMemo(
    () => (
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>Record Supplier Payment</DialogTitle>
        </DialogHeader>
        <SettlementForm
          supplierId={supplierId}
          selectedSupplierId={selectedSupplierId}
          setSelectedSupplierId={setSelectedSupplierId}
          onSubmit={handleSubmit}
          onCancel={() => setIsDialogOpen(false)}
          isSubmitting={isSubmitting}
          debugForm={handleDebugForm}
          outstandingInvoices={outstandingInvoices}
          onSuccess={() => {
            setIsDialogOpen(false);
            handleSuccess();
          }}
        />

        <div className="flex justify-end space-x-4 pt-4 border-t">
          <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)} disabled={isSubmitting}>
            Cancel
          </Button>
          <div className="flex gap-2">
            <Button type="submit" form="settlement-form" disabled={isSubmitting || !selectedSupplierId}>
              {isSubmitting ? "Processing..." : "Record Payment"}
            </Button>
            <Button type="button" variant="outline" onClick={handleDebugForm}>
              Debug Form
            </Button>
          </div>
        </div>
      </DialogContent>
    ),
    [supplierId, selectedSupplierId, handleSubmit, isSubmitting, handleDebugForm, outstandingInvoices, handleSuccess]
  );

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
        <h2 className="text-2xl font-bold">Settlements{supplierName ? ` for ${supplierName}` : ""}</h2>
        <Button onClick={() => setIsDialogOpen(true)}>
          <Plus className="w-4 h-4 mr-2" /> Add Settlement
        </Button>
      </div>

      <TanStackTable
        table={table}
        className="w-full"
        onRowClick={row => {
          console.log("Row clicked:", row.original);
        }}
      />

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        {dialogContent}
      </Dialog>
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

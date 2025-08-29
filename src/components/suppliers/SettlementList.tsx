import { useMemo, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { TanStackTable } from "@/components/ui/TanStackTable";
import { useCreateSettlement, useOutstandingInvoices, useSupplierSettlements } from "@/hooks/useSuppliers";
import { format } from "date-fns";
import { Plus } from "lucide-react";
import { useReactTable, getCoreRowModel, getPaginationRowModel, ColumnDef } from "@tanstack/react-table";
import { SupplierSettlement } from "@/types/supplier";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { SettlementForm } from "./SettlementForm";
import { useToast } from "@/components/ui/use-toast";
import { SettlementFormValues } from "./schemas/settlement-schema";

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

export function SettlementList({ supplierId, supplierName }: { supplierId?: string | number; supplierName?: string }) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { toast } = useToast();
  const createSettlement = useCreateSettlement();
  
  console.log("[SettlementList] Rendering with supplierId:", supplierId);
  
  const { 
    data: outstandingInvoices, 
    refetch: refetchInvoices, 
    isLoading: isLoadingInvoices,
    error: invoicesError 
  } = useOutstandingInvoices(supplierId ? supplierId.toString() : "");
  
  console.log("[SettlementList] Outstanding invoices data:", {
    data: outstandingInvoices,
    isLoading: isLoadingInvoices,
    error: invoicesError
  });
  
  const {
    data: response,
    isLoading,
    refetch,
    error: settlementsError
  } = useSupplierSettlements(supplierId || "", {
    page: 1,
    limit: 100,
    sortBy: "paymentDate",
    sortOrder: "DESC"
  });
  
  if (invoicesError) {
    console.error("[SettlementList] Error loading outstanding invoices:", invoicesError);
  }
  if (settlementsError) {
    console.error("[SettlementList] Error loading settlements:", settlementsError);
  }

  const formattedSettlements = useMemo<FormattedSettlement[]>(() => {
    if (!response?.data?.data) return [];
    return response.data.data.map((settlement: any) => ({
      ...settlement,
      formattedDate: settlement.paymentDate ? format(new Date(settlement.paymentDate), "MMM d, yyyy") : "N/A",
      formattedAmount: formatCurrency(settlement.amount),
      formattedMethod: settlement.paymentMethod || "N/A"
    }));
  }, [response?.data?.data]);

  const columns: ColumnDef<FormattedSettlement>[] = [
    { accessorKey: "referenceNumber", header: "Reference #", size: 150 },
    { accessorKey: "paymentDate", header: "Date", cell: ({ row }) => row.original.formattedDate, size: 120 },
    { accessorKey: "amount", header: "Amount", cell: ({ row }) => row.original.formattedAmount, size: 120 },
    { accessorKey: "paymentMethod", header: "Method", cell: ({ row }) => row.original.formattedMethod, size: 100 },
    { accessorKey: "notes", header: "Notes", size: 200 }
  ];

  const table = useReactTable({
    data: formattedSettlements,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageSize: 10 } }
  });

  const handleSubmit = async (data: any) => {
    try {
      if (!supplierId) throw new Error("No supplier selected");

      const paymentDate = data.paymentDate instanceof Date ? data.paymentDate : new Date(data.paymentDate);

      const submissionData = {
        amount: parseFloat(data.amount),
        paymentMethod: data.paymentMethod,
        paymentDate: paymentDate,
        referenceNumber: data.referenceNumber,
        invoiceIds: Array.isArray(data.invoiceIds) ? data.invoiceIds.map((id: any) => Number(id)) : []
      };

      await createSettlement.mutateAsync({
        supplierId: Number(supplierId),
        data: submissionData
      });

      setIsDialogOpen(false);
      await refetch();
      await refetchInvoices();
      toast({ title: "Success", description: "Settlement created successfully" });
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create settlement",
        variant: "destructive"
      });
    }
  };

  if (isLoading) {
    return <div className="p-4 flex justify-center">Loading settlements...</div>;
  }

  return (
    <div className="space-y-6 p-4">
      <div className="flex justify-between">
        <h2 className="text-2xl font-bold">Settlements {supplierName && `for ${supplierName}`}</h2>
        <Button onClick={() => setIsDialogOpen(true)}>
          <Plus className="w-4 h-4 mr-2" /> Record New Payment
        </Button>
      </div>

      <TanStackTable table={table} />

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Record Supplier Payment</DialogTitle>
          </DialogHeader>
          <SettlementForm supplierId={supplierId} onSubmit={handleSubmit} onCancel={() => setIsDialogOpen(false)} outstandingInvoices={outstandingInvoices || []} isLoadingInvoices={isLoadingInvoices} invoicesError={null} />
        </DialogContent>
      </Dialog>
    </div>
  );
}

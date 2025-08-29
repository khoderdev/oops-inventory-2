import { useState, useMemo} from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";
import { Plus, Search } from "lucide-react";
import { columns } from "./columns/supplier-columns";
import { TanStackTable } from "../../components/ui/TanStackTable";
import { useReactTable, getCoreRowModel, getPaginationRowModel } from "@tanstack/react-table";
import type { Supplier } from "@/types/supplier";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { SupplierForm } from "./SupplierForm";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supplierAPI } from "@/api/supplier.api";
import type { CreateSupplierData, UpdateSupplierData } from "@/types/supplier";

export function SupplierList() {
  const [searchTerm, setSearchTerm] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: 10
  });

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const createMutation = useMutation({
    mutationFn: (data: CreateSupplierData) => supplierAPI.createSupplier(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['suppliers'] });
      toast({
        title: "Success",
        description: "Supplier created successfully",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: UpdateSupplierData) => {
      const { id, ...updateData } = data;
      return supplierAPI.updateSupplier(id, updateData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['suppliers'] });
      toast({
        title: "Success",
        description: "Supplier updated successfully",
      });
    },
  });

  const handleSubmit = async (data: CreateSupplierData) => {
    try {
      if (editingSupplier?.id) {
        await updateMutation.mutateAsync({ 
          ...data,
          id: editingSupplier.id,
          isActive: editingSupplier.isActive
        } as UpdateSupplierData);
      } else {
        await createMutation.mutateAsync(data as CreateSupplierData);
      }
      setIsDialogOpen(false);
      setEditingSupplier(null);
    } catch (error) {
      console.error('Error saving supplier:', error);
      toast({
        title: "Error",
        description: "An error occurred while saving the supplier.",
        variant: "destructive",
      });
    }
  };

  // Use the paginated query
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['suppliers', { page: pagination.pageIndex + 1, pageSize: pagination.pageSize, search: searchTerm }],
    queryFn: () => supplierAPI.getSuppliersPaginated({
      page: pagination.pageIndex + 1,
      limit: pagination.pageSize,
      search: searchTerm
    }),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Extract data from the response
  const tableData = useMemo(() => {
    return data?.data?.data || [];
  }, [data]);

  const paginationData = useMemo(() => ({
    totalPages: data?.data?.pagination?.totalPages || 0,
    currentPage: data?.data?.pagination?.currentPage || 1,
    totalItems: data?.data?.pagination?.totalItems || 0,
    itemsPerPage: data?.data?.pagination?.itemsPerPage || pagination.pageSize
  }), [data, pagination.pageSize]);


  const table = useReactTable({
    data: tableData,
    columns,
    pageCount: Math.max(paginationData.totalPages, 1),
    state: {
      pagination: {
        pageIndex: Math.min(pagination.pageIndex, Math.max(0, paginationData.totalPages - 1)),
        pageSize: pagination.pageSize,
      },
    },
    onPaginationChange: (updater) => {
      const newPagination = typeof updater === 'function' ? updater({
        pageIndex: pagination.pageIndex,
        pageSize: pagination.pageSize,
      }) : updater;

      setPagination(prev => ({
        pageIndex: newPagination.pageIndex,
        pageSize: newPagination.pageSize,
      }));
    },
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    manualPagination: true,
    debugTable: true,
    debugHeaders: true,
    debugColumns: true,
  });

  if (isError) {
    toast({
      title: "Error loading suppliers",
      description: "There was an error loading the suppliers. Please try again.",
      variant: "destructive",
    });
    return <div className="p-4 text-destructive">Error loading suppliers. Please try again.</div>;
  }

  const handleSuccess = () => {
    setIsDialogOpen(false);
    setEditingSupplier(null);
    refetch();
  };

  const handleEdit = (supplier: Supplier) => {
    setEditingSupplier(supplier);
    setIsDialogOpen(true);
  };

  const handleAddNew = () => {
    setEditingSupplier(null);
    setIsDialogOpen(true);
  };
  

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Suppliers</h2>
        <Button onClick={handleAddNew}>
          <Plus className="mr-2 h-4 w-4" />
          Add Supplier
        </Button>
      </div>

      <div className="relative">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input 
          type="search" 
          placeholder="Search suppliers..." 
          className="w-full rounded-lg bg-background pl-8" 
          value={searchTerm} 
          onChange={e => setSearchTerm(e.target.value)} 
        />
      </div>

      <div className="border rounded-md p-4">
        <div className="mb-4 text-sm text-gray-500">
          {isLoading && (
            <div className="p-4">
              <div className="flex items-center space-x-2">
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                <span>Loading suppliers...</span>
              </div>
            </div>
          )}
        </div>
        <TanStackTable 
          table={table} 
          loading={isLoading} 
          className="w-full"
          emptyMessage={isError ? "Error loading suppliers" : "No suppliers found"}
          onRowClick={(row) => handleEdit(row.original as Supplier)}
        />
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[625px]">
          <DialogHeader>
            <DialogTitle>{editingSupplier ? 'Edit Supplier' : 'Add New Supplier'}</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <div className="space-y-4">
              <SupplierForm 
                supplier={editingSupplier} 
                onSubmit={handleSubmit}
                isSubmitting={createMutation.isPending || updateMutation.isPending}
                onCancel={() => {
                  setIsDialogOpen(false);
                  setEditingSupplier(null);
                }}
              />
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
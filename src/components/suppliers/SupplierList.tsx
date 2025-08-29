import { useState, useMemo, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search, Eye } from "lucide-react";
import { columns } from "./columns/supplier-columns";
import { TanStackTable } from "../../components/ui/TanStackTable";
import { useReactTable, getCoreRowModel, getPaginationRowModel } from "@tanstack/react-table";
import type { Supplier } from "@/types/supplier";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { SupplierForm } from "./SupplierForm";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supplierAPI } from "@/api/supplier.api";
import type { CreateSupplierData, UpdateSupplierData } from "@/types/supplier";
import { format } from "date-fns";
import { Badge } from "../ui/badge";
import { toast } from "@/hooks/use-toast";

export function SupplierList() {
  const [searchTerm, setSearchTerm] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [viewingSupplier, setViewingSupplier] = useState<Supplier | null>(null);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [deletingSupplier, setDeletingSupplier] = useState<Supplier | null>(null);
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: 10
  });

  const queryClient = useQueryClient();

  const createMutation = useMutation({
    mutationFn: (data: CreateSupplierData) => supplierAPI.createSupplier(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['suppliers'] });
      toast({
        title: "Success",
        description: "Supplier created successfully",
        duration: 1000,
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
      setEditingSupplier(null);
      toast({
        title: "Success",
        description: "Supplier updated successfully",
        duration: 1000,
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => supplierAPI.deleteSupplier(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['suppliers'] });
      setDeletingSupplier(null);
      toast({
        title: "Success",
        description: "Supplier deleted successfully",
        duration: 1000,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to delete supplier",
        variant: "destructive",
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
        duration: 1000,
      });
    }
  };

  const handleView = useCallback((supplier: Supplier) => {
    setViewingSupplier(supplier);
  }, []);

  const handleEdit = useCallback((supplier: Supplier) => {
    setEditingSupplier(supplier);
    setIsDialogOpen(true);
  }, []);

  const handleDelete = useCallback((supplier: Supplier) => {
    setDeletingSupplier(supplier);
  }, []);

  const confirmDelete = useCallback(() => {
    if (deletingSupplier?.id) {
      deleteMutation.mutate(deletingSupplier.id);
    }
  }, [deletingSupplier, deleteMutation]);

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
    meta: {
      onView: handleView,
      onEdit: handleEdit,
      onDelete: handleDelete,
    },
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
          // onRowClick={(row) => handleEdit(row.original as Supplier)}
        />
      </div>

      {/* View Supplier Dialog */}
      <Dialog open={!!viewingSupplier} onOpenChange={(open) => !open && setViewingSupplier(null)}>
        <DialogContent className="sm:max-w-[625px]">
          <DialogHeader>
            <div className="flex items-center space-x-2">
              <Eye className="h-5 w-5 text-muted-foreground" />
              <DialogTitle>Supplier Details</DialogTitle>
            </div>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {viewingSupplier && (
              <div className="grid gap-4">
                <div className="space-y-2">
                  <h3 className="text-lg font-medium">{viewingSupplier.name}</h3>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-muted-foreground">
                      {viewingSupplier.contactPerson || 'No contact person'}
                    </span>
                    {viewingSupplier.isActive ? (
                      <Badge variant="default">Active</Badge>
                    ) : (
                      <Badge variant="secondary">Inactive</Badge>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <p className="text-sm font-medium">Email</p>
                    <p className="text-sm">{viewingSupplier.email || '-'}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-medium">Phone</p>
                    <p className="text-sm">{viewingSupplier.phone || '-'}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-medium">Tax ID</p>
                    <p className="text-sm">{viewingSupplier.taxId || '-'}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-medium">Payment Terms</p>
                    <p className="text-sm">{viewingSupplier.paymentTerms ? `${viewingSupplier.paymentTerms} days` : '-'}</p>
                  </div>
                </div>

                {viewingSupplier.address && (
                  <div className="space-y-1">
                    <p className="text-sm font-medium">Address</p>
                    <p className="text-sm whitespace-pre-line">{viewingSupplier.address}</p>
                  </div>
                )}

                {viewingSupplier.notes && (
                  <div className="space-y-1">
                    <p className="text-sm font-medium">Notes</p>
                    <p className="text-sm text-muted-foreground whitespace-pre-line">
                      {viewingSupplier.notes}
                    </p>
                  </div>
                )}

                <div className="flex justify-between pt-4 border-t">
                  <div>
                    <p className="text-xs text-muted-foreground">
                      Created: {viewingSupplier.createdAt ? format(new Date(viewingSupplier.createdAt), 'PPpp') : 'N/A'}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Last Updated: {viewingSupplier.updatedAt ? format(new Date(viewingSupplier.updatedAt), 'PPpp') : 'N/A'}
                    </p>
                  </div>
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      setEditingSupplier(viewingSupplier);
                      setViewingSupplier(null);
                    }}
                  >
                    Edit Supplier
                  </Button>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Add/Edit Supplier Dialog */}
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

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deletingSupplier} onOpenChange={(open) => !open && setDeletingSupplier(null)}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Delete Supplier</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete <span className="font-semibold">{deletingSupplier?.name}</span>? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end space-x-2 pt-4">
            <Button 
              variant="outline" 
              onClick={() => setDeletingSupplier(null)}
              disabled={deleteMutation.isPending}
            >
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={confirmDelete}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? 'Deleting...' : 'Delete'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}